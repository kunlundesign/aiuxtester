import { azureOpenAIChat } from './azure-openai';
import { azureLimiter } from './limit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { ModelProvider, Persona, EvalResult, ImageEval } from '../types';

// Type normalization helper
type AllowedAnalysisType = 'single' | 'flow';

function normalizeAnalysisType(t: unknown): { type: AllowedAnalysisType; isSideBySide: boolean } {
  if (t === 'flow') return { type: 'flow', isSideBySide: false };
  if (t === 'side-by-side') return { type: 'single', isSideBySide: true };
  return { type: 'single', isSideBySide: false };
}

export interface AIAdapter {
  evaluate(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow' | 'side-by-side'): Promise<EvalResult>;
}

export class OpenAIAdapter implements AIAdapter {
  private client: any = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      const OpenAI = require('openai');
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async evaluate(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow' | 'side-by-side'): Promise<EvalResult> {
    console.log(`🔄 OpenAIAdapter.evaluate called for persona ${persona.id}`);
    
    // Priority: Azure OpenAI
    if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_DEPLOYMENT) {
      console.log('🔵 Using Azure OpenAI for evaluation');
      const { type: safeType, isSideBySide } = normalizeAnalysisType(analysisType);
      const systemPrompt = this.buildSystemPrompt(isSideBySide, images.length);
      const userPrompt = this.buildPrompt(images, persona, designBackground, analysisType);
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];
      
      try {
        const result = await azureLimiter(() => azureOpenAIChat({
          messages,
          images,
          options: {
            apiKey: process.env.AZURE_OPENAI_API_KEY!,
            endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
            deployment: process.env.AZURE_OPENAI_DEPLOYMENT!,
            apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
          }
        }));
        const content = result.choices?.[0]?.message?.content || result.choices?.[0]?.text;
        if (!content) throw new Error('No response from Azure OpenAI');
        return this.parseResponse(content, 'openai', persona.id, images.length, analysisType);
      } catch (error: any) {
        console.error('❌ Azure OpenAI API error:', error);
        
        if (error.status === 429 || error.response?.status === 429) {
          console.log('⏳ Rate limit hit, waiting 2 seconds before retry...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          try {
            const retryResult = await azureLimiter(() => azureOpenAIChat({
              messages,
              images,
              options: {
                apiKey: process.env.AZURE_OPENAI_API_KEY!,
                endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
                deployment: process.env.AZURE_OPENAI_DEPLOYMENT!,
                apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
              }
            }));
            const content = retryResult.choices?.[0]?.message?.content || retryResult.choices?.[0]?.text;
            if (!content) throw new Error('No response from Azure OpenAI retry');
            return this.parseResponse(content, 'openai', persona.id, images.length, analysisType);
          } catch (retryError) {
            console.error('❌ Azure OpenAI retry also failed:', retryError);
            return this.getMockResponse(persona.id, images.length, analysisType || 'single');
          }
        }
        
        return this.getMockResponse(persona.id, images.length, analysisType || 'single');
      }
    } else if (this.client) {
      console.log('🔵 Using OpenAI SDK for evaluation');
      const { isSideBySide } = normalizeAnalysisType(analysisType);
      const systemPrompt = this.buildSystemPrompt(isSideBySide, images.length);
      const userPrompt = this.buildPrompt(images, persona, designBackground, analysisType);
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              ...images.map(image => ({
                type: 'image_url' as const,
                image_url: { url: image }
              }))
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      });
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenAI');
      return this.parseResponse(content, 'openai', persona.id, images.length, analysisType);
    } else {
      console.log('🔄 No OpenAI API keys configured, using mock response');
      return this.getMockResponse(persona.id, images.length, analysisType || 'single');
    }
  }

  private buildSystemPrompt(isSideBySide: boolean, imageCount: number): string {
    return `You are a specialized UX evaluator that provides highly specific, actionable feedback tailored to different user personas. You must output STRICT JSON only.

CRITICAL REQUIREMENTS:
1. PERSONA-SPECIFIC ANALYSIS
2. CONSTRUCTIVE FEEDBACK with actionable improvements
3. SPECIFIC EXAMPLES from the actual interface
4. DETAILED ISSUES with clear explanations
5. DYNAMIC QUANTITY - return ALL highlights and issues you find

Response must be valid JSON only - no markdown, explanations, or additional text.
Include ALL highlights and issues you identify - typically 3-8 highlights and 1-6 issues.`;
  }

  private buildPrompt(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow' | 'side-by-side'): string {
    const contextSection = designBackground ? `Design Context: ${designBackground}\n` : '';
    const { type: safeType, isSideBySide } = normalizeAnalysisType(analysisType);
    
    const analysisInstructions = safeType === 'flow' ? 
      `Analyze these ${images.length} images as a user flow/journey.` :
      isSideBySide ?
      `COMPARATIVE ANALYSIS: Compare these ${images.length} designs side by side.` :
      `Analyze this single interface design.`;

    return `${contextSection}
Persona: ${persona.name}
Traits: ${persona.traits.join(', ')}
Motivations: ${persona.motivations.join(', ')}
Pain Points: ${persona.painPoints.join(', ')}

${analysisInstructions}

Return JSON with this structure:
{
  "model": "openai",
  "personaId": "${persona.id}",
  "items": [
    {
      "imageId": "image-0",
      "personaId": "${persona.id}",
      "scores": { "usability": 85, "accessibility": 78, "visual": 82, "overall": 81 },
      "highlights": ["Specific positive aspect 1", "Specific positive aspect 2"],
      "issues": [
        { "stepHint": "Area", "issue": "Problem description", "severity": "medium", "suggestion": "Improvement" }
      ],
      "narrative": "Analysis from this persona's perspective"
    }
  ]
}`;
  }

  private parseResponse(content: string, model: ModelProvider, personaId: string, imageCount: number, analysisType?: 'single' | 'flow' | 'side-by-side'): EvalResult {
    try {
      let cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleanContent = jsonMatch[0];
      cleanContent = this.fixJsonIssues(cleanContent);
      
      const parsed = JSON.parse(cleanContent);
      return { model, personaId, items: parsed.items || [] };
    } catch (error) {
      console.error('❌ Response parsing error:', error);
      return this.getMockResponse(personaId, imageCount, analysisType || 'single');
    }
  }

  private fixJsonIssues(jsonString: string): string {
    let fixed = jsonString;
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      fixed += '}'.repeat(openBraces - closeBraces);
    }
    
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    if (openBrackets > closeBrackets) {
      fixed += ']'.repeat(openBrackets - closeBrackets);
    }
    
    return fixed;
  }

  private getMockResponse(personaId: string, imageCount: number, analysisType: 'single' | 'flow' | 'side-by-side'): EvalResult {
    const items: ImageEval[] = [];
    
    for (let i = 0; i < imageCount; i++) {
      const isFlow = analysisType === 'flow';
      
      items.push({
        imageId: `image-${i}`,
        personaId,
        scores: {
          usability: 75 + Math.floor(Math.random() * 20),
          accessibility: 70 + Math.floor(Math.random() * 20),
          visual: 80 + Math.floor(Math.random() * 20),
          overall: 78 + Math.floor(Math.random() * 15)
        },
        highlights: isFlow ? [
          `Clear step progression (Step ${i + 1})`,
          'Consistent design language',
          'Good visual flow'
        ] : [
          'Clean and modern interface',
          'Good use of white space',
          'Clear visual hierarchy'
        ],
        issues: [
          {
            stepHint: 'Text contrast',
            issue: 'Some text may not meet WCAG AA contrast.',
            severity: 'Medium',
            suggestion: 'Increase contrast to at least 4.5:1.'
          },
          {
            stepHint: 'Primary action',
            issue: 'Primary action not visually prioritized.',
            severity: 'Medium',
            suggestion: 'Increase prominence of primary CTA.'
          }
        ],
        narrative: isFlow ?
          `Step ${i + 1} demonstrates good visual consistency with navigation patterns.` :
          'Interface shows strong visual appeal with clean, modern design.'
      });
    }

    return { model: 'openai', personaId, items };
  }
}

export class GeminiAdapter implements AIAdapter {
  private client: GoogleGenerativeAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY) {
      this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || '');
    }
  }

  async evaluate(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow' | 'side-by-side'): Promise<EvalResult> {
    if (!this.client) {
      console.log('Gemini adapter using mock response - no API key configured');
      return this.getMockResponse(persona.id, images.length, analysisType || 'single');
    }

    const model = this.client.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const prompt = this.buildPrompt(images, persona, designBackground, analysisType);

    const imageParts = images.map(image => {
      const commaIdx = image.indexOf(',');
      const header = image.substring(0, commaIdx);
      const data = image.substring(commaIdx + 1);
      const mimeMatch = header.match(/^data:(.*?);base64$/);
      const mimeType = mimeMatch?.[1] || 'image/jpeg';
      return { inlineData: { data, mimeType } };
    });

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const content = response.text();
    
    return this.parseResponse(content, 'gemini', persona.id, images.length, analysisType);
  }

  private buildPrompt(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow' | 'side-by-side'): string {
    const contextSection = designBackground ? `Design Context: ${designBackground}\n` : '';
    
    return `You are a UX evaluator. Output STRICT JSON only.

${contextSection}
Persona: ${persona.name}
Traits: ${persona.traits.join(', ')}
Motivations: ${persona.motivations.join(', ')}
Pain Points: ${persona.painPoints.join(', ')}

Evaluate ${images.length} image(s). Return JSON:
{
  "model": "gemini",
  "personaId": "${persona.id}",
  "items": [{ "imageId": "image-0", "personaId": "${persona.id}", "scores": {...}, "highlights": [...], "issues": [...], "narrative": "..." }]
}`;
  }

  private parseResponse(content: string, model: ModelProvider, personaId: string, imageCount: number, analysisType?: 'single' | 'flow' | 'side-by-side'): EvalResult {
    try {
      let cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleanContent = jsonMatch[0];
      const parsed = JSON.parse(cleanContent);
      return { model, personaId, items: parsed.items || [] };
    } catch (error) {
      console.error('Gemini response parsing error:', error);
      return this.getMockResponse(personaId, imageCount, analysisType || 'single');
    }
  }

  private getMockResponse(personaId: string, imageCount: number, analysisType: 'single' | 'flow' | 'side-by-side'): EvalResult {
    const items: ImageEval[] = [];
    for (let i = 0; i < imageCount; i++) {
      items.push({
        imageId: `image-${i}`,
        personaId,
        scores: { usability: 80, accessibility: 75, visual: 85, overall: 80 },
        highlights: ['Clean interface design', 'Good visual hierarchy'],
        issues: [{
          stepHint: 'Contrast',
          issue: 'Text contrast could be improved.',
          severity: 'Medium',
          suggestion: 'Increase contrast ratio.'
        }],
        narrative: 'Interface shows good design principles with room for accessibility improvements.'
      });
    }
    return { model: 'gemini', personaId, items };
  }
}

export class ZhipuAdapter implements AIAdapter {
  private baseURL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

  async evaluate(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow' | 'side-by-side'): Promise<EvalResult> {
    if (!process.env.ZHIPU_API_KEY) {
      console.log('Zhipu adapter using mock response - no API key configured');
      return this.getMockResponse(persona.id, images.length, analysisType || 'single');
    }

    const prompt = this.buildPrompt(images, persona, designBackground, analysisType);

    const response = await axios.post(this.baseURL, {
      model: 'glm-4v',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...images.map(image => ({ type: 'image_url', image_url: { url: image } }))
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const content = response.data.choices[0]?.message?.content;
    if (!content) throw new Error('No response from Zhipu');

    return this.parseResponse(content, 'zhipu', persona.id, images.length, analysisType);
  }

  private buildPrompt(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow' | 'side-by-side'): string {
    const contextSection = designBackground ? `Design Context: ${designBackground}\n` : '';
    
    return `You are a UX evaluator. Output STRICT JSON only.

${contextSection}
Persona: ${persona.name}
Traits: ${persona.traits.join(', ')}
Motivations: ${persona.motivations.join(', ')}
Pain Points: ${persona.painPoints.join(', ')}

Evaluate ${images.length} image(s). Return JSON with EvalResult structure.`;
  }

  private parseResponse(content: string, model: ModelProvider, personaId: string, imageCount: number, analysisType?: 'single' | 'flow' | 'side-by-side'): EvalResult {
    try {
      const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      return { model, personaId, items: parsed.items || [] };
    } catch (error) {
      console.error('Zhipu response parsing error:', error);
      return this.getMockResponse(personaId, imageCount, analysisType || 'single');
    }
  }

  private getMockResponse(personaId: string, imageCount: number, analysisType: 'single' | 'flow' | 'side-by-side'): EvalResult {
    const items: ImageEval[] = [];
    for (let i = 0; i < imageCount; i++) {
      items.push({
        imageId: `image-${i}`,
        personaId,
        scores: { usability: 78, accessibility: 72, visual: 80, overall: 77 },
        highlights: ['Modern interface', 'Clear layout'],
        issues: [{
          stepHint: 'Navigation',
          issue: 'Navigation could be clearer.',
          severity: 'Low',
          suggestion: 'Add visual cues for navigation.'
        }],
        narrative: 'Interface meets basic usability standards.'
      });
    }
    return { model: 'zhipu', personaId, items };
  }
}

// Mock adapter for offline/local testing
class MockAdapter implements AIAdapter {
  constructor(private provider: ModelProvider) {}
  
  async evaluate(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow' | 'side-by-side'): Promise<EvalResult> {
    const baseScore = 70 + (persona.name.length % 20);
    const items: ImageEval[] = images.map((_, idx) => ({
      imageId: `image-${idx}`,
      personaId: persona.id,
      scores: {
        usability: baseScore - 3 + idx,
        accessibility: baseScore - 5 + idx,
        visual: baseScore + 2 + idx,
        overall: Math.round((baseScore * 3 + idx) / 3)
      },
      highlights: [
        `(${this.provider} mock) 清晰的信息层级与视觉对比`,
        `(${this.provider} mock) 操作路径符合 persona 的动机：${persona.motivations[0] || 'N/A'}`
      ],
      issues: [{
        stepHint: 'layout',
        issue: '按钮间距略紧凑（mock）',
        severity: 'Medium',
        suggestion: '增加 4-8px 间距提升触达准确率'
      }],
      narrative: `${persona.name} 视角的模拟分析（mock, 无真实模型调用）`
    }));
    
    return { model: this.provider, personaId: persona.id, items };
  }
}

export function createAIAdapter(provider: ModelProvider): AIAdapter {
  // Global mock override for local testing
  if (process.env.MOCK_MODE === '1' || process.env.MOCK_MODE === 'true') {
    return new MockAdapter(provider);
  }
  
  switch (provider) {
    case 'openai':
      return new OpenAIAdapter();
    case 'gemini':
      return new GeminiAdapter();
    case 'zhipu':
      return new ZhipuAdapter();
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
