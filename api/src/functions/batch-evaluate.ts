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
  
  context.log('📦 [Blob] Checking Azure Storage connection...');
  
  if (!connectionString) {
    context.error('❌ [Blob] AZURE_STORAGE_CONNECTION_STRING is not configured');
    throw new Error('Azure Storage connection string is not configured. Please set AZURE_STORAGE_CONNECTION_STRING in Application Settings.');
  }

  context.log('✅ [Blob] Connection string found, connecting to Blob Storage...');

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient('personas');
    
    // Check if container exists
    const containerExists = await containerClient.exists();
    if (!containerExists) {
      context.error('❌ [Blob] Container "personas" does not exist');
      throw new Error('Blob container "personas" does not exist. Please create the container and upload persona files.');
    }
    
    context.log('✅ [Blob] Container "personas" found, listing blobs...');
    
    const personas: { id: string; data: RawPersonaData }[] = [];
    let blobCount = 0;
    let errorCount = 0;
    
    for await (const blob of containerClient.listBlobsFlat()) {
      blobCount++;
      
      if (!blob.name.endsWith('.json')) {
        context.log(`⏭️ [Blob] Skipping non-JSON file: ${blob.name}`);
        continue;
      }
      
      try {
        const blobClient = containerClient.getBlobClient(blob.name);
        
        // ✅ 使用 downloadToBuffer() 替代 streamToString，更可靠
        const downloadResponse = await blobClient.downloadToBuffer();
        const content = downloadResponse.toString('utf-8');
        
        // 验证 JSON 格式
        const data = JSON.parse(content) as RawPersonaData;
        const id = blob.name.replace('.json', '');
        
        personas.push({ id, data });
        
        // 每加载 100 个输出一次进度
        if (personas.length % 100 === 0) {
          context.log(`📊 [Blob] Loaded ${personas.length} personas...`);
        }
      } catch (parseError) {
        errorCount++;
        context.warn(`⚠️ [Blob] Failed to parse ${blob.name}: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        // 继续处理其他文件，不中断
      }
    }
    
    context.log(`✅ [Blob] Finished loading personas:`);
    context.log(`   - Total blobs scanned: ${blobCount}`);
    context.log(`   - Successfully loaded: ${personas.length}`);
    context.log(`   - Parse errors: ${errorCount}`);
    
    if (personas.length === 0) {
      throw new Error(`No valid persona files found in "personas" container. Scanned ${blobCount} blobs, ${errorCount} parse errors.`);
    }
    
    return personas;
  } catch (error) {
    context.error('❌ [Blob] Error loading personas:', error);
    throw error; // 重新抛出，让调用方处理
  }
}

async function batchEvaluate(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const startTime = Date.now();
  context.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  context.log('🚀 [BatchEvaluate] Starting batch evaluation request');
  context.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Step 1: Parse request body
    context.log('📥 [Step 1] Parsing request body...');
    let body: any;
    try {
      body = await request.json();
      context.log(`✅ [Step 1] Request body parsed successfully`);
      context.log(`   - images: ${body.images?.length || 0} image(s)`);
      context.log(`   - model: ${body.model || 'openai (default)'}`);
      context.log(`   - sampleSize: ${body.sampleSize || 100}`);
      context.log(`   - analysisType: ${body.analysisType || 'auto-detect'}`);
    } catch (parseError) {
      context.error('❌ [Step 1] Failed to parse request body:', parseError);
      return {
        status: 400,
        jsonBody: { 
          success: false, 
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
        }
      };
    }
    
    // Step 2: Validate request with Zod
    context.log('🔍 [Step 2] Validating request schema...');
    let validatedData;
    try {
      validatedData = BatchEvaluateRequestSchema.parse(body);
      context.log('✅ [Step 2] Request validation passed');
    } catch (validationError) {
      context.error('❌ [Step 2] Request validation failed:', validationError);
      if (validationError instanceof z.ZodError) {
        return {
          status: 400,
          jsonBody: { 
            success: false, 
            error: 'Invalid request format',
            details: validationError.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          }
        };
      }
      throw validationError;
    }
    
    const { images, analysisType, designBackground, model, sampleSize: requestedSampleSize, includeStats } = validatedData;

    // Step 3: Load personas from Blob Storage
    context.log('📦 [Step 3] Loading personas from Blob Storage...');
    let allPersonas: { id: string; data: RawPersonaData }[];
    try {
      allPersonas = await loadPersonasFromBlobStorage(context);
      context.log(`✅ [Step 3] Loaded ${allPersonas.length} personas from Blob Storage`);
    } catch (blobError) {
      context.error('❌ [Step 3] Failed to load personas:', blobError);
      return {
        status: 500,
        jsonBody: { 
          success: false, 
          error: 'Failed to load personas from storage',
          details: blobError instanceof Error ? blobError.message : 'Unknown storage error'
        }
      };
    }

    // Step 4: Sample size adjustment (容错逻辑)
    context.log('🎲 [Step 4] Adjusting sample size...');
    const actualSampleSize = Math.min(requestedSampleSize, allPersonas.length);
    if (actualSampleSize < requestedSampleSize) {
      context.warn(`⚠️ [Step 4] Requested ${requestedSampleSize} personas but only ${allPersonas.length} available`);
      context.warn(`   → Adjusted sample size to ${actualSampleSize}`);
    } else {
      context.log(`✅ [Step 4] Sample size: ${actualSampleSize} (requested: ${requestedSampleSize})`);
    }

    // Step 5: Random selection
    context.log('🔀 [Step 5] Randomly selecting personas...');
    const selectedPersonas = allPersonas
      .sort(() => Math.random() - 0.5)
      .slice(0, actualSampleSize);
    context.log(`✅ [Step 5] Selected ${selectedPersonas.length} personas for evaluation`);

    // Step 6: Initialize result containers
    const results: BatchEvalSuccess[] = [];
    const allScores: Scores[] = [];
    const allIssues: Array<{ stepHint: string; issue: string; severity: 'low' | 'medium' | 'high'; suggestion: string }> = [];
    const personaMetadata: Array<{ age: number; occupation: string; personalityType: string }> = [];
    const errors: BatchEvalError[] = [];

    // Step 7: Create AI adapter
    context.log(`🤖 [Step 6] Creating AI adapter for model: ${model}`);
    const CONCURRENT_LIMIT = 10;
    let adapter;
    try {
      adapter = createAIAdapter(model as ModelProvider);
      context.log('✅ [Step 6] AI adapter created successfully');
    } catch (adapterError) {
      context.error('❌ [Step 6] Failed to create AI adapter:', adapterError);
      return {
        status: 500,
        jsonBody: { 
          success: false, 
          error: 'Failed to initialize AI adapter',
          details: adapterError instanceof Error ? adapterError.message : 'Unknown adapter error'
        }
      };
    }

    // Step 8: Process personas in batches
    const totalBatches = Math.ceil(selectedPersonas.length / CONCURRENT_LIMIT);
    context.log(`🔄 [Step 7] Starting batch processing: ${totalBatches} batches of ${CONCURRENT_LIMIT}`);

    for (let i = 0; i < selectedPersonas.length; i += CONCURRENT_LIMIT) {
      const batchIndex = Math.floor(i / CONCURRENT_LIMIT) + 1;
      const batch = selectedPersonas.slice(i, i + CONCURRENT_LIMIT);
      
      context.log(`   📦 Processing batch ${batchIndex}/${totalBatches} (${batch.length} personas)...`);
      const batchStartTime = Date.now();

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

          // ✅ 修复 firstItem 问题：确保 items 存在且有内容
          if (evaluationResult.items && evaluationResult.items.length > 0) {
            const firstItem = evaluationResult.items[0];
            
            // 收集分数
            if (firstItem.scores && typeof firstItem.scores === 'object') {
              allScores.push({
                usability: firstItem.scores.usability || 0,
                accessibility: firstItem.scores.accessibility || 0,
                visual: firstItem.scores.visual || 0,
                overall: firstItem.scores.overall || 0
              });
            }
            
            // 收集问题
            if (Array.isArray(firstItem.issues)) {
              firstItem.issues.forEach((iss: any) => {
                if (iss && typeof iss === 'object') {
                  allIssues.push({
                    stepHint: String(iss.stepHint || ''),
                    issue: String(iss.issue || 'Unknown issue'),
                    severity: (['low', 'medium', 'high'].includes(String(iss.severity).toLowerCase()) 
                      ? String(iss.severity).toLowerCase() 
                      : 'medium') as 'low' | 'medium' | 'high',
                    suggestion: String(iss.suggestion || '')
                  });
                }
              });
            }
          }
          
          personaMetadata.push({
            age: standardPersona.age || 25,
            occupation: standardPersona.occupation || 'Unknown',
            personalityType: standardPersona.personalityType || 'Unknown'
          });
          
          return { success: true as const, data: result, personaId: id };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown evaluation error';
          context.warn(`   ⚠️ Persona ${id} evaluation failed: ${errorMessage}`);
          return {
            success: false as const,
            error: errorMessage,
            personaId: id
          };
        }
      });

      // ✅ 优化 Promise.allSettled 结果收集
      const batchResults = await Promise.allSettled(batchPromises);
      
      let batchSuccess = 0;
      let batchFailed = 0;
      
      batchResults.forEach((res) => {
        if (res.status === 'fulfilled') {
          if (res.value.success) {
            results.push(res.value.data);
            batchSuccess++;
          } else {
            errors.push({ 
              personaId: res.value.personaId || 'unknown', 
              error: res.value.error || 'Unknown error' 
            });
            batchFailed++;
          }
        } else {
          // Promise rejected
          errors.push({ 
            personaId: 'unknown', 
            error: res.reason?.message || 'Promise rejected unexpectedly' 
          });
          batchFailed++;
        }
      });
      
      const batchTime = Date.now() - batchStartTime;
      context.log(`   ✅ Batch ${batchIndex} completed in ${batchTime}ms: ${batchSuccess} success, ${batchFailed} failed`);
    }

    context.log(`🎯 [Step 8] All batches processed: ${results.length} success, ${errors.length} failed`);

    // Step 9: Generate statistics and intelligent report
    let stats: StatsReport | null = null;
    let intelligentReport: IntelligentReport | null = null;
    
    if (includeStats && results.length > 0) {
      context.log('📊 [Step 9] Generating statistics and intelligent report...');
      
      try {
        stats = generateStats(allScores, allIssues, personaMetadata);
        context.log('   ✅ Stats report generated');
        
        const personaInsights: PersonaInsight[] = results.map((result, index) => ({
          personaId: result.personaId,
          personaName: result.personaName || result.personaId,
          occupation: personaMetadata[index]?.occupation || 'Unknown',
          personalityType: personaMetadata[index]?.personalityType || 'Unknown',
          scores: result.items[0]?.scores || { usability: 0, accessibility: 0, visual: 0, overall: 0 },
          highlights: result.items[0]?.highlights || [],
          issues: (result.items[0]?.issues || []).map(i => ({
            stepHint: i.stepHint || '',
            issue: i.issue || 'Unknown',
            severity: (String(i.severity || 'medium').toLowerCase()) as 'low' | 'medium' | 'high',
            suggestion: i.suggestion || ''
          }))
        }));
        
        intelligentReport = generateIntelligentReport(personaInsights);
        context.log('   ✅ Intelligent report generated');
      } catch (statsError) {
        context.error('   ⚠️ Error generating reports:', statsError);
        // 不中断流程，继续返回结果
      }
    } else {
      context.log('📊 [Step 9] Skipping statistics (includeStats=false or no results)');
    }

    // Step 10: Build response
    const processingTime = Date.now() - startTime;
    const successRate = actualSampleSize > 0 
      ? (results.length / actualSampleSize * 100).toFixed(1) 
      : '0.0';
    
    context.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    context.log(`🎉 [Complete] Batch evaluation finished in ${processingTime}ms`);
    context.log(`   - Evaluated: ${results.length}/${actualSampleSize} personas`);
    context.log(`   - Success rate: ${successRate}%`);
    context.log(`   - Errors: ${errors.length}`);
    context.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const response = {
      success: true,
      data: {
        totalEvaluated: results.length,
        totalRequested: requestedSampleSize,
        totalAvailable: allPersonas.length,
        actualSampleSize,
        successRate,
        results,
        stats,
        intelligentReport,
        errors: errors.length > 0 ? errors : undefined,
        metadata: {
          sampleSize: actualSampleSize,
          requestedSampleSize,
          analysisType: analysisType || 'auto-detect',
          model,
          timestamp: new Date().toISOString(),
          processingTimeMs: processingTime
        }
      }
    };

    return {
      status: 200,
      jsonBody: response,
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    context.error('❌ [Error] Unexpected error in batch evaluation:', error);
    context.error(`   Processing time before error: ${processingTime}ms`);

    return {
      status: 500,
      jsonBody: { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown internal error',
        processingTimeMs: processingTime
      }
    };
  }
}

app.http('batch-evaluate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'batch-evaluate',
  handler: batchEvaluate
});
