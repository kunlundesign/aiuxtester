import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { z } from "zod";
import { createAIAdapter } from "../lib/ai-adapters";
import { 
  Persona, 
  ModelProvider, 
  BatchEvalSuccess, 
  BatchEvalError,
  StatsReport,
  IntelligentReport,
  PersonaInsight,
  DetailedIssue,
  DetailedStrength,
  Scores
} from "../types";

const BatchEvaluateRequestSchema = z.object({
  images: z.array(z.string()).min(1).max(10),
  analysisType: z.enum(['single', 'flow', 'side-by-side']).optional(),
  designBackground: z.string().optional(),
  model: z.enum(['openai', 'gemini', 'zhipu']).default('openai'),
  sampleSize: z.number().min(1).max(1000).default(100),
  includeStats: z.boolean().default(true)
});

// Persona converter
interface RawPersonaData {
  'Core Identity'?: {
    full_name?: string;
    age?: number;
    occupation?: string;
  };
  'Psychographics & Personality'?: {
    personality_traits?: Record<string, string>;
    mbti?: string;
    motivations?: string | string[];
  };
  'Digital Behavior & Online Habits'?: {
    device_usage?: string;
    preferred_content_sources?: string;
    search_patterns?: string;
  };
}

function safeToString(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join(' ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function safeToArray(value: any): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
  return [String(value)];
}

function convertToStandardPersona(rawData: RawPersonaData, personaId: string): Persona {
  try {
    const core = rawData['Core Identity'] || {};
    const psych = rawData['Psychographics & Personality'] || {};
    const digital = rawData['Digital Behavior & Online Habits'] || {};

    const name = core.full_name || 'Unknown User';
    const age = core.age || 25;
    const occupation = core.occupation || 'Unknown';
    const personalityType = psych.mbti || 'Unknown';
    const motivations = safeToArray(psych.motivations);

    const traits: string[] = [];
    if (psych.personality_traits && typeof psych.personality_traits === 'object') {
      const traitsObj = psych.personality_traits;
      if (traitsObj.conscientiousness === 'High') traits.push('detail-oriented');
      if (traitsObj.openness === 'High') traits.push('creative');
      if (traitsObj.extraversion === 'High') traits.push('extroverted');
      if (traitsObj.agreeableness === 'High') traits.push('collaborative');
    }
    if (traits.length === 0) traits.push('balanced');

    const painPoints: string[] = [];
    const deviceText = safeToString(digital.device_usage).toLowerCase();
    if (deviceText.includes('desktop')) painPoints.push('mobile-unfriendly');
    if (deviceText.includes('mobile')) painPoints.push('desktop-heavy');

    const preferences: string[] = [];
    const sourcesText = safeToString(digital.preferred_content_sources).toLowerCase();
    if (sourcesText.includes('manufacturer') || sourcesText.includes('official')) preferences.push('official-sources');
    if (sourcesText.includes('review') || sourcesText.includes('user')) preferences.push('user-reviews');

    return {
      id: personaId,
      name,
      age,
      occupation,
      traits,
      motivations,
      painPoints,
      designImplications: preferences,
      personalityType,
      digitalBehavior: {
        devicePreference: deviceText.includes('desktop') ? 'desktop' : 'mobile',
        searchPattern: safeToString(digital.search_patterns),
        contentPreference: sourcesText.includes('official') ? 'official-sources' : 'user-reviews'
      }
    };
  } catch (error) {
    return {
      id: personaId,
      name: 'Unknown User',
      age: 25,
      occupation: 'Unknown',
      traits: ['balanced'],
      motivations: ['general satisfaction'],
      painPoints: ['unknown'],
      designImplications: ['user-reviews']
    };
  }
}

// Stats engine
function generateStats(
  scores: Scores[], 
  issues: Array<{ stepHint: string; issue: string; severity: 'low' | 'medium' | 'high'; suggestion: string }>,
  metadata: Array<{ age: number; occupation: string; personalityType: string }>
): StatsReport {
  const totalPersonas = scores.length;
  
  if (totalPersonas === 0) {
    return {
      totalPersonas: 0,
      averageScores: { usability: 0, accessibility: 0, visual: 0, overall: 0 },
      scoreDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
      topIssues: [],
      personaSegments: { ageGroups: {}, occupations: {}, personalityTypes: {} },
      confidenceLevel: 0,
      recommendations: []
    };
  }

  const averageScores = {
    usability: scores.reduce((sum, s) => sum + s.usability, 0) / totalPersonas,
    accessibility: scores.reduce((sum, s) => sum + s.accessibility, 0) / totalPersonas,
    visual: scores.reduce((sum, s) => sum + s.visual, 0) / totalPersonas,
    overall: scores.reduce((sum, s) => sum + s.overall, 0) / totalPersonas
  };

  const scoreDistribution = {
    excellent: scores.filter(s => s.overall >= 90).length,
    good: scores.filter(s => s.overall >= 70 && s.overall < 90).length,
    fair: scores.filter(s => s.overall >= 50 && s.overall < 70).length,
    poor: scores.filter(s => s.overall < 50).length
  };

  const issueFrequency: Record<string, { count: number; severity: 'low' | 'medium' | 'high' }> = {};
  issues.forEach(issue => {
    const key = issue.issue;
    if (issueFrequency[key]) {
      issueFrequency[key].count++;
      if (issue.severity === 'high' || 
          (issue.severity === 'medium' && issueFrequency[key].severity === 'low')) {
        issueFrequency[key].severity = issue.severity;
      }
    } else {
      issueFrequency[key] = { count: 1, severity: issue.severity };
    }
  });

  const topIssues = Object.entries(issueFrequency)
    .map(([issue, data]) => ({
      issue,
      frequency: data.count,
      severity: data.severity,
      percentage: parseFloat((data.count / totalPersonas * 100).toFixed(1))
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  const ageGroups: Record<string, number> = {};
  const occupations: Record<string, number> = {};
  const personalityTypes: Record<string, number> = {};

  metadata.forEach(meta => {
    const ageGroup = meta.age < 25 ? '18-24' : meta.age < 35 ? '25-34' : meta.age < 45 ? '35-44' : meta.age < 55 ? '45-54' : '55+';
    ageGroups[ageGroup] = (ageGroups[ageGroup] || 0) + 1;
    occupations[meta.occupation] = (occupations[meta.occupation] || 0) + 1;
    personalityTypes[meta.personalityType] = (personalityTypes[meta.personalityType] || 0) + 1;
  });

  let confidence = totalPersonas >= 500 ? 40 : totalPersonas >= 100 ? 25 : 10;
  confidence += averageScores.overall >= 80 ? 30 : averageScores.overall >= 60 ? 20 : 10;
  confidence += 20;

  const recommendations: string[] = [];
  if (averageScores.usability < 70) recommendations.push('优先改善用户体验设计');
  if (averageScores.accessibility < 70) recommendations.push('加强可访问性设计');
  if (averageScores.visual < 70) recommendations.push('优化视觉设计');
  if (topIssues.length > 0 && topIssues[0].severity === 'high') {
    recommendations.push(`立即解决高频问题："${topIssues[0].issue}"`);
  }

  return {
    totalPersonas,
    averageScores,
    scoreDistribution,
    topIssues,
    personaSegments: { ageGroups, occupations, personalityTypes },
    confidenceLevel: Math.min(confidence, 100),
    recommendations: recommendations.slice(0, 5)
  };
}

// Intelligent aggregator
function generateIntelligentReport(personaInsights: PersonaInsight[]): IntelligentReport {
  const issueMap = new Map<string, DetailedIssue>();
  const strengthMap = new Map<string, DetailedStrength>();

  personaInsights.forEach(persona => {
    persona.issues.forEach(issue => {
      const key = issue.issue.toLowerCase().replace(/\s+/g, ' ').trim();
      if (issueMap.has(key)) {
        const existing = issueMap.get(key)!;
        existing.frequency++;
        existing.affectedPersonas.push(persona.personaName);
        existing.personaTypes.push(persona.personalityType);
      } else {
        issueMap.set(key, {
          stepHint: issue.stepHint,
          issue: issue.issue,
          severity: issue.severity,
          suggestion: issue.suggestion,
          frequency: 1,
          affectedPersonas: [persona.personaName],
          personaTypes: [persona.personalityType]
        });
      }
    });

    persona.highlights.forEach(highlight => {
      const key = highlight.toLowerCase().replace(/\s+/g, ' ').trim();
      const category = highlight.toLowerCase().includes('navigation') ? 'Navigation' :
                       highlight.toLowerCase().includes('visual') ? 'Visual Design' :
                       highlight.toLowerCase().includes('accessibility') ? 'Accessibility' : 'General';
      
      if (strengthMap.has(key)) {
        const existing = strengthMap.get(key)!;
        existing.frequency++;
        existing.affectedPersonas.push(persona.personaName);
      } else {
        strengthMap.set(key, {
          category,
          strength: highlight,
          frequency: 1,
          affectedPersonas: [persona.personaName],
          impact: 'medium'
        });
      }
    });
  });

  const allIssues = Array.from(issueMap.values()).sort((a, b) => b.frequency - a.frequency);
  const allStrengths = Array.from(strengthMap.values()).sort((a, b) => b.frequency - a.frequency);

  const totalPersonas = personaInsights.length;
  const averageScores = {
    usability: personaInsights.reduce((sum, p) => sum + p.scores.usability, 0) / totalPersonas,
    accessibility: personaInsights.reduce((sum, p) => sum + p.scores.accessibility, 0) / totalPersonas,
    visual: personaInsights.reduce((sum, p) => sum + p.scores.visual, 0) / totalPersonas,
    overall: personaInsights.reduce((sum, p) => sum + p.scores.overall, 0) / totalPersonas
  };

  return {
    keyInsights: {
      primaryStrengths: allStrengths.slice(0, 5),
      criticalIssues: allIssues.filter(i => i.severity === 'high' || i.frequency >= totalPersonas * 0.2).slice(0, 8),
      userSegmentFindings: []
    },
    actionableRecommendations: allIssues.slice(0, 10).map(issue => ({
      priority: issue.severity === 'high' ? 'critical' as const : issue.frequency >= totalPersonas * 0.3 ? 'high' as const : 'medium' as const,
      category: issue.stepHint,
      issue: issue.issue,
      solution: issue.suggestion,
      impact: `影响 ${issue.frequency} 个用户`,
      effort: 'medium' as const,
      affectedUsers: issue.frequency
    })),
    uxThemes: [],
    statistics: {
      totalPersonas,
      averageScores: {
        usability: Math.round(averageScores.usability * 10) / 10,
        accessibility: Math.round(averageScores.accessibility * 10) / 10,
        visual: Math.round(averageScores.visual * 10) / 10,
        overall: Math.round(averageScores.overall * 10) / 10
      },
      confidenceLevel: Math.min(50 + totalPersonas * 2, 100)
    }
  };
}

async function loadPersonasFromBlobStorage(context: InvocationContext): Promise<{ id: string; data: RawPersonaData }[]> {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    context.warn('No Azure Storage connection string configured');
    return [];
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient('personas');
    
    const personas: { id: string; data: RawPersonaData }[] = [];
    
    for await (const blob of containerClient.listBlobsFlat()) {
      if (blob.name.endsWith('.json')) {
        const blobClient = containerClient.getBlobClient(blob.name);
        const downloadResponse = await blobClient.download();
        const content = await streamToString(downloadResponse.readableStreamBody!);
        const data = JSON.parse(content) as RawPersonaData;
        const id = blob.name.replace('.json', '');
        personas.push({ id, data });
      }
    }
    
    context.log(`Loaded ${personas.length} personas from blob storage`);
    return personas;
  } catch (error) {
    context.error('Error loading personas from blob storage:', error);
    return [];
  }
}

async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data) => chunks.push(Buffer.from(data)));
    readableStream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    readableStream.on('error', reject);
  });
}

async function batchEvaluate(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  context.log('Batch evaluation function processing request');
  
  try {
    const body = await request.json();
    const validatedData = BatchEvaluateRequestSchema.parse(body);
    
    const { images, analysisType, designBackground, model, sampleSize, includeStats } = validatedData;

    context.log(`🎭 Starting batch evaluation with ${sampleSize} personas`);

    // Load personas from blob storage
    const allPersonas = await loadPersonasFromBlobStorage(context);
    
    if (allPersonas.length === 0) {
      return {
        status: 400,
        jsonBody: { success: false, error: 'No persona files found in storage' }
      };
    }

    // Random selection
    const selectedPersonas = allPersonas
      .sort(() => Math.random() - 0.5)
      .slice(0, sampleSize);

    context.log(`📁 Found ${allPersonas.length} personas, selected ${selectedPersonas.length} for evaluation`);

    const results: BatchEvalSuccess[] = [];
    const allScores: Scores[] = [];
    const allIssues: Array<{ stepHint: string; issue: string; severity: 'low' | 'medium' | 'high'; suggestion: string }> = [];
    const personaMetadata: Array<{ age: number; occupation: string; personalityType: string }> = [];
    const errors: BatchEvalError[] = [];

    const CONCURRENT_LIMIT = 10;
    const adapter = createAIAdapter(model as ModelProvider);

    // Process in batches
    for (let i = 0; i < selectedPersonas.length; i += CONCURRENT_LIMIT) {
      const batch = selectedPersonas.slice(i, i + CONCURRENT_LIMIT);
      
      context.log(`🔄 Processing batch ${Math.floor(i / CONCURRENT_LIMIT) + 1}`);

      const batchPromises = batch.map(async ({ id, data }) => {
        try {
          const standardPersona = convertToStandardPersona(data, id);
          const inferredType = analysisType || (images.length > 1 ? 'flow' : 'single');
          const evaluationResult = await adapter.evaluate(images, standardPersona, designBackground, inferredType);

          const result: BatchEvalSuccess = {
            personaId: id,
            personaName: standardPersona.name,
            model: evaluationResult.model,
            items: evaluationResult.items || []
          };

          if (evaluationResult.items && evaluationResult.items.length > 0) {
            const firstItem = evaluationResult.items[0];
            if (firstItem.scores) allScores.push(firstItem.scores);
            if (Array.isArray(firstItem.issues)) {
              firstItem.issues.forEach((iss: any) => {
                allIssues.push({
                  stepHint: iss.stepHint || '',
                  issue: iss.issue || 'Unknown issue',
                  severity: (iss.severity || 'medium').toLowerCase() as 'low' | 'medium' | 'high',
                  suggestion: iss.suggestion || ''
                });
              });
            }
          }
          
          personaMetadata.push({
            age: standardPersona.age || 25,
            occupation: standardPersona.occupation || 'Unknown',
            personalityType: standardPersona.personalityType || 'Unknown'
          });
          
          return { success: true as const, data: result };
        } catch (error) {
          context.error(`Error evaluating persona ${id}:`, error);
          return {
            success: false as const,
            error: error instanceof Error ? error.message : 'Unknown error',
            personaId: id
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((res) => {
        if (res.status === 'fulfilled') {
          if (res.value.success) {
            results.push(res.value.data);
          } else {
            errors.push({ personaId: res.value.personaId || 'unknown', error: res.value.error || 'Unknown error' });
          }
        } else {
          errors.push({ personaId: 'unknown', error: res.reason?.message || 'Promise rejected' });
        }
      });
    }

    // Generate statistics and intelligent report
    let stats: StatsReport | null = null;
    let intelligentReport: IntelligentReport | null = null;
    
    if (includeStats && results.length > 0) {
      stats = generateStats(allScores, allIssues, personaMetadata);
      
      const personaInsights: PersonaInsight[] = results.map((result, index) => ({
        personaId: result.personaId,
        personaName: result.personaName || result.personaId,
        occupation: personaMetadata[index]?.occupation || 'Unknown',
        personalityType: personaMetadata[index]?.personalityType || 'Unknown',
        scores: result.items[0]?.scores || { usability: 0, accessibility: 0, visual: 0, overall: 0 },
        highlights: result.items[0]?.highlights || [],
        issues: result.items[0]?.issues?.map(i => ({
          stepHint: i.stepHint,
          issue: i.issue,
          severity: (i.severity?.toLowerCase() || 'medium') as 'low' | 'medium' | 'high',
          suggestion: i.suggestion
        })) || []
      }));
      
      intelligentReport = generateIntelligentReport(personaInsights);
    }

    const response = {
      success: true,
      data: {
        totalEvaluated: results.length,
        totalRequested: sampleSize,
        successRate: (results.length / sampleSize * 100).toFixed(1),
        results,
        stats,
        intelligentReport,
        errors: errors.length > 0 ? errors : undefined,
        metadata: {
          sampleSize: selectedPersonas.length,
          analysisType: analysisType || 'auto-detect',
          model,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      }
    };

    context.log(`🎉 Batch evaluation completed: ${results.length}/${sampleSize} successful`);

    return {
      jsonBody: response,
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (error) {
    context.error('Batch evaluation error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        status: 400,
        jsonBody: { success: false, error: 'Invalid request format', details: error.errors }
      };
    }

    return {
      status: 500,
      jsonBody: { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

app.http('batch-evaluate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'batch-evaluate',
  handler: batchEvaluate
});
