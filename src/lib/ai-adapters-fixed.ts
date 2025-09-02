import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { ModelProvider, Persona, EvalResult } from '@/types';

export interface AIAdapter {
  evaluate(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow'): Promise<EvalResult>;
}

export class OpenAIAdapter implements AIAdapter {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async evaluate(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow'): Promise<EvalResult> {
    // Use real OpenAI API if API key is provided
    if (process.env.OPENAI_API_KEY?.startsWith('sk-')) {
      const systemPrompt = `You are a Gen Z-focused UX evaluator. You must output STRICT JSON only that matches the EvalResult interface. Evaluate each image based on Usability (Nielsen's 10 heuristics), Accessibility (WCAG POUR), and Visual Design (12 principles).`;

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

      console.log('OpenAI response:', content);

      return this.parseResponse(content, 'openai', persona.id);
    }

    // Fallback to mock data if no API key
    return this.getMockResponse(persona.id, images.length, analysisType || 'single');
  }

  private buildPrompt(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow'): string {
    const isFlow = analysisType === 'flow';
    
    return `
Analyze ${isFlow ? 'this user flow of screens' : 'this design interface'} from the perspective of: ${persona.name} 

${designBackground ? `Design Context: ${designBackground}` : ''}

Return STRICT JSON in this format:
{
  "items": [
    {
      "imageId": "image-0",
      "personaId": "${persona.id}",
      "scores": {
        "usability": 85,
        "accessibility": 78,
        "visual": 92,
        "overall": 85
      },
      "highlights": ["Strong visual hierarchy", "Clear navigation"],
      "issues": [
        {
          "stepHint": "${isFlow ? 'Step 1 Navigation' : 'Navigation'}",
          "issue": "Contrast for secondary text could be improved", 
          "severity": "Medium",
          "dimension": "Accessibility",
          "principles": ["Contrast", "Legibility"],
          "suggestion": "Increase contrast between primary and secondary menu items"
        }
      ],
      "narrative": "This interface shows strong visual appeal but has some usability concerns...",
      "verbatim": ["Quote from persona perspective"]
    }
  ]
}

Score each dimension 0-100. Calculate overall as weighted average using persona weighting.
`;
  }

  private getMockResponse(personaId: string, imageCount: number = 1, analysisType: 'single' | 'flow' = 'single'): EvalResult {
    const mockItems = [];
    
    for (let i = 0; i < imageCount; i++) {
      const isFlow = analysisType === 'flow';
      const stepContext = isFlow ? ` (Step ${i + 1} of ${imageCount})` : '';
      
      mockItems.push({
        imageId: `image-${i}`,
        personaId,
        scores: {
          usability: Math.floor(Math.random() * 20) + 75, // 75-95
          accessibility: Math.floor(Math.random() * 20) + 70, // 70-90
          visual: Math.floor(Math.random() * 20) + 80, // 80-100
          overall: Math.floor(Math.random() * 15) + 78 // 78-93
        },
        highlights: isFlow ? [
          `Clear step progression${stepContext}`,
          'Consistent design language maintained',
          'Good visual flow between screens'
        ] : [
          'Clean and modern interface design',
          'Good use of white space',
          'Clear visual hierarchy'
        ],
        issues: [
          // Usability Issues
          {
            stepHint: isFlow ? `Step ${i + 1} Navigation` : 'Navigation',
            issue: isFlow ? 
              `Flow step ${i + 1} could provide clearer next action guidance` :
              'Primary navigation could be more prominent and intuitive',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Usability' as const,
            principles: ['Navigation', 'User Control'],
            suggestion: isFlow ?
              `Add more prominent call-to-action for step ${i + 1}` :
              'Consider reorganizing navigation hierarchy for better discoverability'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Feedback` : 'System Feedback',
            issue: isFlow ? 
              `Step ${i + 1} lacks clear progress indicators` :
              'Users may not understand current system status',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Usability' as const,
            principles: ['System Status', 'Feedback'],
            suggestion: 'Add clear progress indicators and status messages'
          },
          // Accessibility Issues
          {
            stepHint: isFlow ? `Step ${i + 1} Contrast` : 'Color Contrast',
            issue: 'Contrast ratio between text and background could be improved',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Accessibility' as const,
            principles: ['Contrast', 'Perceivable'],
            suggestion: 'Increase contrast to meet WCAG AA standards (4.5:1 ratio)'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Focus` : 'Keyboard Navigation',
            issue: 'Focus indicators may not be visible for keyboard users',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Accessibility' as const,
            principles: ['Operable', 'Focus Management'],
            suggestion: 'Add clear focus indicators for better keyboard accessibility'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Labels` : 'Form Labels',
            issue: 'Some interactive elements may lack proper labels',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Accessibility' as const,
            principles: ['Understandable', 'Labels'],
            suggestion: 'Ensure all form controls have descriptive labels'
          },
          // Visual Design Issues
          {
            stepHint: isFlow ? `Step ${i + 1} Hierarchy` : 'Visual Hierarchy',
            issue: 'Information hierarchy could be clearer through typography',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Visual' as const,
            principles: ['Hierarchy', 'Typography'],
            suggestion: 'Use consistent heading styles to establish clear information hierarchy'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Spacing` : 'White Space',
            issue: 'Some areas feel cramped with insufficient white space',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Visual' as const,
            principles: ['White Space', 'Balance'],
            suggestion: 'Increase spacing between elements for better visual breathing room'
          }
        ],
        narrative: isFlow ?
          `Step ${i + 1} of the user flow demonstrates good visual consistency with previous screens. The interface maintains clear navigation patterns, though some improvements could enhance the user journey experience.` :
          'This interface shows strong visual appeal with a clean, modern design. The layout effectively uses white space and maintains good visual hierarchy, though some accessibility improvements would benefit all users.',
        verbatim: [
          '"I just want to get this done without all the extra stuff."',
          '"Looks good, but where do I click next?"'
        ]
      });
    }

    return {
      model: 'openai' as ModelProvider,
      personaId,
      items: mockItems
    };
  }

  private parseResponse(content: string, model: ModelProvider, personaId: string): EvalResult {
    try {
      const parsed = JSON.parse(content);
      return {
        model,
        personaId,
        items: parsed.items || []
      };
    } catch (error) {
      throw new Error(`Failed to parse OpenAI response: ${error}`);
    }
  }
}

export class GeminiAdapter implements AIAdapter {
  private client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  async evaluate(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow'): Promise<EvalResult> {
    // Use real Gemini API if API key is provided
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) {
      const model = this.client.getGenerativeModel({ model: 'gemini-1.5-pro' });
      
      const systemPrompt = `You are a Gen Z-focused UX evaluator. Output STRICT JSON only.`;
      const userPrompt = this.buildPrompt(images, persona, designBackground, analysisType);

      const imageParts = images.map(image => ({
        inlineData: {
          data: image.split(',')[1], // Remove data:image/jpeg;base64, prefix
          mimeType: 'image/jpeg'
        }
      }));

      const result = await model.generateContent([
        systemPrompt + '\n' + userPrompt,
        ...imageParts
      ]);

      const response = await result.response;
      const content = response.text();
      
      console.log('Gemini response:', content);
      
      return this.parseResponse(content, 'gemini', persona.id);
    }

    // Fallback to mock data if no API key
    console.log('Gemini adapter using mock response - no API key configured');
    return this.getMockResponse(persona.id, images.length, analysisType || 'single');
  }

  private buildPrompt(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow'): string {
    const isFlow = analysisType === 'flow';
    
    return `
Analyze ${isFlow ? 'this user flow of screens' : 'this design interface'} from the perspective of: ${persona.name} 

${designBackground ? `Design Context: ${designBackground}` : ''}

Return STRICT JSON in this format:
{
  "items": [
    {
      "imageId": "image-0",
      "personaId": "${persona.id}",
      "scores": {
        "usability": 85,
        "accessibility": 78,
        "visual": 92,
        "overall": 85
      },
      "highlights": ["Strong visual hierarchy", "Clear navigation"],
      "issues": [
        {
          "stepHint": "${isFlow ? 'Step 1 Navigation' : 'Navigation'}",
          "issue": "Contrast for secondary text could be improved", 
          "severity": "Medium",
          "dimension": "Accessibility",
          "principles": ["Contrast", "Legibility"],
          "suggestion": "Increase contrast between primary and secondary menu items"
        }
      ],
      "narrative": "This interface shows strong visual appeal but has some usability concerns...",
      "verbatim": ["Quote from persona perspective"]
    }
  ]
}

Score each dimension 0-100. Calculate overall as weighted average using persona weighting.
`;
  }

  private getMockResponse(personaId: string, imageCount: number = 1, analysisType: 'single' | 'flow' = 'single'): EvalResult {
    const mockItems = [];
    
    for (let i = 0; i < imageCount; i++) {
      const isFlow = analysisType === 'flow';
      const stepContext = isFlow ? ` (Step ${i + 1} of ${imageCount})` : '';
      
      mockItems.push({
        imageId: `image-${i}`,
        personaId,
        scores: {
          usability: Math.floor(Math.random() * 20) + 75, // 75-95
          accessibility: Math.floor(Math.random() * 20) + 70, // 70-90
          visual: Math.floor(Math.random() * 20) + 80, // 80-100
          overall: Math.floor(Math.random() * 15) + 78 // 78-93
        },
        highlights: isFlow ? [
          `Clear step progression${stepContext}`,
          'Consistent design language maintained',
          'Good visual flow between screens'
        ] : [
          'Clean and modern interface design',
          'Good use of white space',
          'Clear visual hierarchy'
        ],
        issues: [
          // Usability Issues
          {
            stepHint: isFlow ? `Step ${i + 1} Navigation` : 'Navigation',
            issue: isFlow ? 
              `Flow step ${i + 1} could provide clearer next action guidance` :
              'Primary navigation could be more prominent and intuitive',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Usability' as const,
            principles: ['Navigation', 'User Control'],
            suggestion: isFlow ?
              `Add more prominent call-to-action for step ${i + 1}` :
              'Consider reorganizing navigation hierarchy for better discoverability'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Feedback` : 'System Feedback',
            issue: isFlow ? 
              `Step ${i + 1} lacks clear progress indicators` :
              'Users may not understand current system status',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Usability' as const,
            principles: ['System Status', 'Feedback'],
            suggestion: 'Add clear progress indicators and status messages'
          },
          // Accessibility Issues
          {
            stepHint: isFlow ? `Step ${i + 1} Contrast` : 'Color Contrast',
            issue: 'Contrast ratio between text and background could be improved',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Accessibility' as const,
            principles: ['Contrast', 'Perceivable'],
            suggestion: 'Increase contrast to meet WCAG AA standards (4.5:1 ratio)'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Focus` : 'Keyboard Navigation',
            issue: 'Focus indicators may not be visible for keyboard users',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Accessibility' as const,
            principles: ['Operable', 'Focus Management'],
            suggestion: 'Add clear focus indicators for better keyboard accessibility'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Labels` : 'Form Labels',
            issue: 'Some interactive elements may lack proper labels',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Accessibility' as const,
            principles: ['Understandable', 'Labels'],
            suggestion: 'Ensure all form controls have descriptive labels'
          },
          // Visual Design Issues
          {
            stepHint: isFlow ? `Step ${i + 1} Hierarchy` : 'Visual Hierarchy',
            issue: 'Information hierarchy could be clearer through typography',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Visual' as const,
            principles: ['Hierarchy', 'Typography'],
            suggestion: 'Use consistent heading styles to establish clear information hierarchy'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Spacing` : 'White Space',
            issue: 'Some areas feel cramped with insufficient white space',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Visual' as const,
            principles: ['White Space', 'Balance'],
            suggestion: 'Increase spacing between elements for better visual breathing room'
          }
        ],
        narrative: isFlow ?
          `Step ${i + 1} of the user flow demonstrates good visual consistency with previous screens. The interface maintains clear navigation patterns, though some improvements could enhance the user journey experience.` :
          'This interface shows strong visual appeal with a clean, modern design. The layout effectively uses white space and maintains good visual hierarchy, though some accessibility improvements would benefit all users.',
        verbatim: [
          '"I just want to get this done without all the extra stuff."',
          '"Looks good, but where do I click next?"'
        ]
      });
    }

    return {
      model: 'gemini' as ModelProvider,
      personaId,
      items: mockItems
    };
  }

  private parseResponse(content: string, model: ModelProvider, personaId: string): EvalResult {
    try {
      const parsed = JSON.parse(content);
      return {
        model,
        personaId,
        items: parsed.items || []
      };
    } catch (error) {
      throw new Error(`Failed to parse Gemini response: ${error}`);
    }
  }
}

export class ZhipuAdapter implements AIAdapter {
  constructor() {}

  async evaluate(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow'): Promise<EvalResult> {
    // Use real Zhipu API if API key is provided
    if (process.env.ZHIPU_API_KEY && process.env.ZHIPU_API_KEY.length > 10) {
      const requestBody = {
        model: 'glm-4v-plus',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: this.buildPrompt(images, persona, designBackground, analysisType)
              },
              ...images.map(image => ({
                type: 'image_url',
                image_url: { url: image }
              }))
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      };

      try {
        const response = await axios.post('https://open.bigmodel.cn/api/paas/v4/chat/completions', requestBody, {
          headers: {
            'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) throw new Error('No response from Zhipu');

        console.log('Zhipu response:', content);

        return this.parseResponse(content, 'zhipu', persona.id);
      } catch (error) {
        console.error('Zhipu API error:', error);
        return this.getMockResponse(persona.id, 1, 'single');
      }
    }

    // Fallback to mock data
    return this.getMockResponse(persona.id, images.length, analysisType || 'single');
  }

  private buildPrompt(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow'): string {
    const isFlow = analysisType === 'flow';
    
    return `
Analyze ${isFlow ? 'this user flow of screens' : 'this design interface'} from the perspective of: ${persona.name} 

${designBackground ? `Design Context: ${designBackground}` : ''}

Return STRICT JSON in this format:
{
  "items": [
    {
      "imageId": "image-0",
      "personaId": "${persona.id}",
      "scores": {
        "usability": 85,
        "accessibility": 78,
        "visual": 92,
        "overall": 85
      },
      "highlights": ["Strong visual hierarchy", "Clear navigation"],
      "issues": [
        {
          "stepHint": "${isFlow ? 'Step 1 Navigation' : 'Navigation'}",
          "issue": "Contrast for secondary text could be improved", 
          "severity": "Medium",
          "dimension": "Accessibility",
          "principles": ["Contrast", "Legibility"],
          "suggestion": "Increase contrast between primary and secondary menu items"
        }
      ],
      "narrative": "This interface shows strong visual appeal but has some usability concerns...",
      "verbatim": ["Quote from persona perspective"]
    }
  ]
}

Score each dimension 0-100. Calculate overall as weighted average using persona weighting.
`;
  }

  private getMockResponse(personaId: string, imageCount: number = 1, analysisType: 'single' | 'flow' = 'single'): EvalResult {
    const mockItems = [];
    
    for (let i = 0; i < imageCount; i++) {
      const isFlow = analysisType === 'flow';
      const stepContext = isFlow ? ` (Step ${i + 1} of ${imageCount})` : '';
      
      mockItems.push({
        imageId: `image-${i}`,
        personaId,
        scores: {
          usability: Math.floor(Math.random() * 20) + 75, // 75-95
          accessibility: Math.floor(Math.random() * 20) + 70, // 70-90
          visual: Math.floor(Math.random() * 20) + 80, // 80-100
          overall: Math.floor(Math.random() * 15) + 78 // 78-93
        },
        highlights: isFlow ? [
          `Clear step progression${stepContext}`,
          'Consistent design language maintained',
          'Good visual flow between screens'
        ] : [
          'Clean and modern interface design',
          'Good use of white space',
          'Clear visual hierarchy'
        ],
        issues: [
          // Usability Issues
          {
            stepHint: isFlow ? `Step ${i + 1} Navigation` : 'Navigation',
            issue: isFlow ? 
              `Flow step ${i + 1} could provide clearer next action guidance` :
              'Primary navigation could be more prominent and intuitive',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Usability' as const,
            principles: ['Navigation', 'User Control'],
            suggestion: isFlow ?
              `Add more prominent call-to-action for step ${i + 1}` :
              'Consider reorganizing navigation hierarchy for better discoverability'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Feedback` : 'System Feedback',
            issue: isFlow ? 
              `Step ${i + 1} lacks clear progress indicators` :
              'Users may not understand current system status',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Usability' as const,
            principles: ['System Status', 'Feedback'],
            suggestion: 'Add clear progress indicators and status messages'
          },
          // Accessibility Issues
          {
            stepHint: isFlow ? `Step ${i + 1} Contrast` : 'Color Contrast',
            issue: 'Contrast ratio between text and background could be improved',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Accessibility' as const,
            principles: ['Contrast', 'Perceivable'],
            suggestion: 'Increase contrast to meet WCAG AA standards (4.5:1 ratio)'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Focus` : 'Keyboard Navigation',
            issue: 'Focus indicators may not be visible for keyboard users',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Accessibility' as const,
            principles: ['Operable', 'Focus Management'],
            suggestion: 'Add clear focus indicators for better keyboard accessibility'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Labels` : 'Form Labels',
            issue: 'Some interactive elements may lack proper labels',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Accessibility' as const,
            principles: ['Understandable', 'Labels'],
            suggestion: 'Ensure all form controls have descriptive labels'
          },
          // Visual Design Issues
          {
            stepHint: isFlow ? `Step ${i + 1} Hierarchy` : 'Visual Hierarchy',
            issue: 'Information hierarchy could be clearer through typography',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Visual' as const,
            principles: ['Hierarchy', 'Typography'],
            suggestion: 'Use consistent heading styles to establish clear information hierarchy'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Spacing` : 'White Space',
            issue: 'Some areas feel cramped with insufficient white space',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Visual' as const,
            principles: ['White Space', 'Balance'],
            suggestion: 'Increase spacing between elements for better visual breathing room'
          }
        ],
        narrative: isFlow ?
          `Step ${i + 1} of the user flow demonstrates good visual consistency with previous screens. The interface maintains clear navigation patterns, though some improvements could enhance the user journey experience.` :
          'This interface shows strong visual appeal with a clean, modern design. The layout effectively uses white space and maintains good visual hierarchy, though some accessibility improvements would benefit all users.',
        verbatim: [
          '"I just want to get this done without all the extra stuff."',
          '"Looks good, but where do I click next?"'
        ]
      });
    }

    return {
      model: 'zhipu' as ModelProvider,
      personaId,
      items: mockItems
    };
  }

  private parseResponse(content: string, model: ModelProvider, personaId: string): EvalResult {
    try {
      const parsed = JSON.parse(content);
      return {
        model,
        personaId,
        items: parsed.items || []
      };
    } catch (error) {
      throw new Error(`Failed to parse Zhipu response: ${error}`);
    }
  }
}

export function createAIAdapter(model: ModelProvider): AIAdapter {
  switch (model) {
    case 'openai':
      return new OpenAIAdapter();
    case 'gemini':
      return new GeminiAdapter();
    case 'zhipu':
      return new ZhipuAdapter();
    default:
      throw new Error(`Unsupported model: ${model}`);
  }
}
