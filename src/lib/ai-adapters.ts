import { azureOpenAIChat } from './azure-openai';
let OpenAI: any = null;
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { ModelProvider, Persona, EvalResult } from '@/types';
import { personaFeedbackFrameworks, generatePersonaPrompt } from '@/data/persona-feedback-frameworks';

export interface AIAdapter {
  evaluate(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow' | 'side-by-side'): Promise<EvalResult>;
}

export class OpenAIAdapter implements AIAdapter {
  private client: any = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      // 只有有key时才动态import并初始化
      OpenAI = require('openai');
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async evaluate(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow' | 'side-by-side'): Promise<EvalResult> {
    // 优先Azure OpenAI
    if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_DEPLOYMENT) {
      console.log('🔵 Using Azure OpenAI for evaluation');
      const systemPrompt = `You are a specialized UX evaluator that provides highly specific, actionable feedback tailored to different user personas. You must output STRICT JSON only that matches this EXACT format:

{
  "model": "openai",
  "personaId": "PERSONA_ID_HERE",
  "items": [
    {
      "imageId": "image-0",
      "personaId": "PERSONA_ID_HERE", 
      "scores": {
        "usability": 85,
        "accessibility": 78,
        "visual": 82,
        "overall": 81
      },
      "highlights": [
        "Specific design element that works well for this persona",
        "Another concrete positive aspect"
      ],
      "issues": [
        {
          "stepHint": "Specific area",
          "issue": "Detailed problem description",
          "severity": "medium",
          "suggestion": "Concrete improvement recommendation"
        }
      ],
      "narrative": "Detailed analysis from this persona's perspective"
    }
  ]
}

CRITICAL REQUIREMENTS:
1. PERSONA-SPECIFIC ANALYSIS: Adopt the exact communication style, vocabulary, and priorities of the specified persona
2. COMPARATIVE ANALYSIS: For side-by-side comparisons, explicitly identify the winner and explain WHY
3. CONSTRUCTIVE FEEDBACK: Provide actionable usability and accessibility improvements
4. SPECIFIC EXAMPLES: Reference actual interface elements you see in the images
5. DETAILED ISSUES: Identify ALL specific problems with clear explanations of why they matter to this persona
6. DYNAMIC QUANTITY: Return ALL highlights and issues you find - do not limit to a fixed number

AVOID GENERIC STATEMENTS LIKE:
- "Clean layout with clear hierarchy" 
- "Good use of whitespace and contrast"
- "User-friendly interface"

INSTEAD PROVIDE SPECIFIC FEEDBACK LIKE:
- "Design A's primary CTA button is positioned optimally for thumb reach, while Design B requires awkward thumb stretching"
- "Design A's three-step checkout reduces cognitive load compared to Design B's single-page form"
- "Design A's color-coded status indicators help users quickly identify priority items, unlike Design B's text-only approach"

Response must be valid JSON only - no markdown, explanations, or additional text.

IMPORTANT: Include ALL highlights and issues you identify - typically 3-8 highlights and 1-6 issues, but adjust based on what you actually find.`;
      const userPrompt = this.buildPrompt(images, persona, designBackground, analysisType);
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];
      const result = await azureOpenAIChat({
        messages,
        images,
        options: {
          apiKey: process.env.AZURE_OPENAI_API_KEY!,
          endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
          deployment: process.env.AZURE_OPENAI_DEPLOYMENT!,
          apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
        }
      });
      const content = result.choices?.[0]?.message?.content || result.choices?.[0]?.text;
      if (!content) throw new Error('No response from Azure OpenAI');
      return this.parseResponse(content, 'openai', persona.id);
    }
        // 只有有OPENAI_API_KEY时才走官方SDK
        if (this.client) {
          console.log('🔵 Using OpenAI SDK for evaluation');
      const systemPrompt = `You are a specialized UX evaluator that provides highly specific, actionable feedback tailored to different user personas. You must output STRICT JSON only that matches the EvalResult interface.

CRITICAL REQUIREMENTS:
1. PERSONA-SPECIFIC ANALYSIS: Adopt the exact communication style, vocabulary, and priorities of the specified persona
2. COMPARATIVE ANALYSIS: For side-by-side comparisons, explicitly identify the winner and explain WHY
3. CONSTRUCTIVE FEEDBACK: Provide actionable usability and accessibility improvements
4. SPECIFIC EXAMPLES: Reference actual interface elements you see in the images
5. DETAILED ISSUES: Identify ALL specific problems with clear explanations of why they matter to this persona
6. DYNAMIC QUANTITY: Return ALL highlights and issues you find - do not limit to a fixed number

COMPARISON REQUIREMENTS (for side-by-side analysis):
- Clearly state which design performs better overall
- Provide specific reasons with concrete examples
- Compare usability, accessibility, and visual design aspects
- Give actionable recommendations for each design
- Each design may have DIFFERENT numbers of issues - do not force equal counts
- Design A might have 2 issues while Design B has 4 issues - this is normal and expected

CONSTRUCTIVE FEEDBACK REQUIREMENTS:
- Identify specific usability issues with solutions
- Highlight accessibility barriers with improvement suggestions
- Provide concrete recommendations that address the persona's unique needs
- Explain WHY certain design choices work better for this persona

AVOID GENERIC STATEMENTS LIKE:
- "Clean layout with clear hierarchy" 
- "Good use of whitespace and contrast"
- "User-friendly interface"

INSTEAD PROVIDE SPECIFIC FEEDBACK LIKE:
- "Design A's primary CTA button is positioned optimally for thumb reach, while Design B requires awkward thumb stretching"
- "Design A's three-step checkout reduces cognitive load compared to Design B's single-page form"
- "Design A's color-coded status indicators help users quickly identify priority items, unlike Design B's text-only approach"

Response must be valid JSON only - no markdown, explanations, or additional text.

IMPORTANT: Include ALL highlights and issues you identify - typically 3-8 highlights and 1-6 issues, but adjust based on what you actually find.`;
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
      return this.parseResponse(content, 'openai', persona.id);
    }
    throw new Error('No valid OpenAI or Azure OpenAI configuration found');
  }

  private buildPrompt(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow' | 'side-by-side'): string {
    // Find the persona feedback framework
    const framework = personaFeedbackFrameworks.find(f => f.id === persona.id);
    
    let personaPrompt: string;
    
    // Normalize analysisType for generatePersonaPrompt compatibility
    const normalizedType: 'single' | 'flow' =
      analysisType === 'side-by-side' ? 'single' : analysisType;
    
    if (framework) {
      // Use the new persona-specific prompt for built-in personas
      personaPrompt = generatePersonaPrompt(persona, framework, {
        analysisType: normalizedType,
        designBackground,
        imageCount: images.length
      });
    } else {
      // Handle custom personas with detailed information
      personaPrompt = this.generateCustomPersonaPrompt(persona, designBackground, analysisType || 'single', images.length);
    }
      
    const analysisInstructions = analysisType === 'flow' ? 
      `Analyze these ${images.length} images as a user flow/journey. Consider:
- How well the flow guides users through the process
- Consistency across screens  
- Navigation clarity between steps
- Overall user journey experience

Evaluate each image individually but also consider the flow as a whole.` :
      analysisType === 'side-by-side' ?
      `COMPARATIVE ANALYSIS: Compare these ${images.length} designs side by side.

CRITICAL COMPARISON REQUIREMENTS:
1. CLEAR WINNER IDENTIFICATION: Explicitly state which design (A, B, or C) performs better overall and WHY
2. DETAILED COMPARISON: For each design, provide specific strengths and weaknesses
3. USABILITY COMPARISON: Compare task completion efficiency, cognitive load, and user flow clarity
4. ACCESSIBILITY COMPARISON: Compare WCAG compliance, keyboard navigation, screen reader support
5. VISUAL DESIGN COMPARISON: Compare visual hierarchy, consistency, and aesthetic appeal

COMPARISON FRAMEWORK:
- Design A: [Specific strengths] vs [Specific weaknesses]
- Design B: [Specific strengths] vs [Specific weaknesses]  
- Winner: Design X because [concrete reasons with specific examples]

CONSTRUCTIVE FEEDBACK REQUIREMENTS:
- Identify specific usability issues with actionable solutions
- Highlight accessibility barriers with improvement suggestions
- Provide concrete recommendations for each design
- Explain WHY certain design choices work better for this persona

Evaluate each design individually AND provide a comprehensive comparative analysis.` :
      `Analyze this single interface design focusing on:
- Individual screen usability and accessibility
- Visual design principles
- User experience quality`;

    return `${personaPrompt}

${analysisInstructions}

SPECIFIC EVALUATION REQUIREMENTS:
- Provide concrete examples from the actual interface elements you see
- Explain WHY specific design choices work or don't work for this persona
- Use this persona's vocabulary and communication patterns
- Focus on the specific concerns and priorities of this persona
- Give actionable recommendations that address this persona's unique needs

FOR SIDE-BY-SIDE COMPARISONS:
- Explicitly identify which design (A, B, or C) performs better overall
- Provide specific reasons with concrete examples from the images
- Compare usability, accessibility, and visual design aspects directly
- Give constructive feedback for each design with actionable improvements
- Each design may have DIFFERENT numbers of issues - do not force equal counts
- Design A might have 3 issues while Design B has 5 issues - this is normal and expected

IMPORTANT: Return STRICT JSON in this EXACT format:
{
  "model": "openai",
  "personaId": "${persona.id}",
  "items": [
    {
      "imageId": "image-0",
      "personaId": "${persona.id}", 
      "scores": {
        "usability": 85,
        "accessibility": 78,
        "visual": 82,
        "overall": 81
      },
      "highlights": [
        "Specific design element that works well for this persona",
        "Another concrete positive aspect",
        "Additional strengths as you identify them"
      ],
      "issues": [
        {
          "stepHint": "Specific area",
          "issue": "Detailed problem description",
          "severity": "medium",
          "suggestion": "Concrete improvement recommendation"
        },
        {
          "stepHint": "Another area",
          "issue": "Another detailed problem",
          "severity": "high",
          "suggestion": "Another concrete suggestion"
        },
        {
          "stepHint": "Third area",
          "issue": "Additional problem found",
          "severity": "low",
          "suggestion": "Minor improvement suggestion"
        }
      ],
      "narrative": "Detailed analysis from this persona's perspective"
    }
  ]
}

CRITICAL: The number of highlights and issues should be DYNAMIC based on what you actually find:
- Include ALL positive aspects you identify (3-8 highlights typically)
- Include ALL problems you find (1-6 issues typically)
- Do NOT limit yourself to a fixed number
- Quality over quantity - be thorough but accurate

Use scores (0-100), specific highlights, detailed issues array, and narrative analysis that authentically reflects this persona's perspective and communication style.`;
  }

  private generateRandomIssues(imageIndex: number, isFlow: boolean): any[] {
    // 生成1-5个随机issues，模拟真实场景
    const issueCount = Math.floor(Math.random() * 5) + 1; // 1-5个issues
    const allIssues = [
      // Accessibility issues
      {
        stepHint: isFlow ? `Step ${imageIndex + 1} Text/Contrast` : 'Text contrast',
        issue: 'Some text on colored backgrounds may not meet WCAG AA contrast.',
        severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
        dimension: 'Accessibility' as const,
        principles: ['Contrast', 'Legibility'],
        suggestion: 'Increase contrast to at least 4.5:1 for body text.',
        position: {
          x: 20 + Math.random() * 60, // 20-80%
          y: 30 + Math.random() * 40, // 30-70%
          width: 10 + Math.random() * 30, // 10-40%
          height: 5 + Math.random() * 15 // 5-20%
        }
      },
      {
        stepHint: isFlow ? `Step ${imageIndex + 1} Focus` : 'Keyboard focus',
        issue: 'Keyboard focus states are unclear on interactive elements.',
        severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
        dimension: 'Accessibility' as const,
        principles: ['Focus Visible', 'Operable'],
        suggestion: 'Ensure clear focus outlines and logical tab order.',
        position: {
          x: 30 + Math.random() * 40, // 30-70%
          y: 60 + Math.random() * 30, // 60-90%
          width: 15 + Math.random() * 25, // 15-40%
          height: 8 + Math.random() * 12 // 8-20%
        }
      },
      // Usability issues
      {
        stepHint: isFlow ? `Step ${imageIndex + 1} Navigation` : 'Primary action clarity',
        issue: 'Primary action is not visually prioritized, causing decision friction.',
        severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
        dimension: 'Usability' as const,
        principles: ['Visibility of system status', 'Recognition over recall'],
        suggestion: 'Increase prominence of the primary CTA and reduce competing elements.',
        position: {
          x: 50 + Math.random() * 40, // 50-90%
          y: 80 + Math.random() * 15, // 80-95%
          width: 20 + Math.random() * 20, // 20-40%
          height: 6 + Math.random() * 8 // 6-14%
        }
      },
      {
        stepHint: isFlow ? `Step ${imageIndex + 1} Recovery` : 'Error prevention',
        issue: 'Risk of accidental purchases without clear confirmations.',
        severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
        dimension: 'Usability' as const,
        principles: ['Error prevention', 'User control'],
        suggestion: 'Add confirm dialogs and easy undo for purchase-related actions.'
      },
      // Visual issues
      {
        stepHint: isFlow ? `Step ${imageIndex + 1} Hierarchy` : 'Visual hierarchy',
        issue: 'Secondary text competes with primary information.',
        severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
        dimension: 'Visual' as const,
        principles: ['Hierarchy', 'Scale'],
        suggestion: 'Adjust typography scale/weight and spacing to clarify priorities.',
        position: {
          x: 10 + Math.random() * 30, // 10-40%
          y: 20 + Math.random() * 40, // 20-60%
          width: 25 + Math.random() * 35, // 25-60%
          height: 10 + Math.random() * 20 // 10-30%
        }
      },
      {
        stepHint: isFlow ? `Step ${imageIndex + 1} Consistency` : 'Component consistency',
        issue: 'Inconsistent component styles across screens.',
        severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
        dimension: 'Visual' as const,
        principles: ['Consistency', 'Unity'],
        suggestion: 'Normalize spacing, corner radii, and icon sizes across variants.'
      },
      // Additional issues for variety
      {
        stepHint: isFlow ? `Step ${imageIndex + 1} Performance` : 'Loading performance',
        issue: 'Large images may cause slow loading on mobile networks.',
        severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
        dimension: 'Usability' as const,
        principles: ['Performance', 'Efficiency'],
        suggestion: 'Optimize images and implement progressive loading.'
      },
      {
        stepHint: isFlow ? `Step ${imageIndex + 1} Mobile` : 'Mobile responsiveness',
        issue: 'Some elements may be too small for touch interaction on mobile.',
        severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
        dimension: 'Usability' as const,
        principles: ['Touch Target Size', 'Mobile First'],
        suggestion: 'Ensure touch targets are at least 44px and provide adequate spacing.'
      }
    ];

    // 随机选择issues
    const shuffled = [...allIssues].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, issueCount);
  }

  private generateCustomPersonaPrompt(persona: Persona, designBackground?: string, analysisType: 'single' | 'flow' | 'side-by-side' = 'single', imageCount: number = 1): string {
    const contextSection = designBackground ? `
Design Context & Background:
${designBackground}
` : '';

    const analysisContext = analysisType === 'flow' ? 
      'user flow/journey analysis' :
      analysisType === 'side-by-side' ?
      'side-by-side comparison analysis' :
      'individual interface design analysis';

    return `
${contextSection}
You are evaluating this interface from the perspective of: ${persona.name}

CUSTOM PERSONA PROFILE:
Name: ${persona.name}
Traits: ${persona.traits.join(', ')}
Motivations: ${persona.motivations.join(', ')}
Pain Points: ${persona.painPoints.join(', ')}
Design Implications: ${persona.designImplications.join(', ')}

EVALUATION APPROACH:
- Adopt the communication style and priorities of this specific persona
- Focus on issues and positive aspects this persona would naturally notice
- Consider their unique traits, motivations, and pain points
- Provide feedback that authentically reflects how this persona would experience the interface
- Use language and concerns that match this persona's background and characteristics

ANALYSIS TYPE: ${analysisContext}
Image Count: ${imageCount}

Provide specific, actionable feedback tailored to this persona's unique perspective and needs.
`;
  }

  private getMockResponse(personaId: string, imageCount: number = 1, analysisType: 'single' | 'flow' | 'side-by-side' = 'single'): EvalResult {
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
        issues: this.generateRandomIssues(i, isFlow),
        narrative: isFlow ?
          `Step ${i + 1} of the user flow demonstrates good visual consistency with previous screens. The interface maintains clear navigation patterns, though some improvements could enhance the user journey experience.` :
          'This interface shows strong visual appeal with a clean, modern design. The layout effectively uses white space and maintains good visual hierarchy, though some accessibility improvements would benefit all users.'
        ,
        verbatim: [
          '“I just want to get this done without all the extra stuff.”',
          '“Looks good, but where do I click next?”'
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
      console.log('🔍 Parsing OpenAI response...');
      console.log('Raw content length:', content.length);
      console.log('Raw content preview:', content.substring(0, 200));
      
      // Clean the response by removing markdown code blocks and extra whitespace
      let cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
      
      // Try to find JSON in the response if it's wrapped in other text
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      console.log('Clean content preview:', cleanContent.substring(0, 200));
      
      const parsed = JSON.parse(cleanContent);
      console.log('✅ Successfully parsed OpenAI response');
      return {
        model,
        personaId,
        items: parsed.items || []
      };
    } catch (error) {
      console.error('❌ OpenAI response parsing error:', error);
      console.error('Raw content:', content);
      throw new Error(`Failed to parse OpenAI response: ${error}`);
    }
  }
}

export class GeminiAdapter implements AIAdapter {
  private client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  async evaluate(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow' | 'side-by-side'): Promise<EvalResult> {
    // Mock mode for demo - return simulated response
    if (process.env.NODE_ENV === 'development' && (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === '')) {
      console.log('Gemini adapter using mock response - no API key configured');
      return this.getMockResponse(persona.id, images.length, analysisType || 'single');
    }

    const model = this.client.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const systemPrompt = `You are a specialized UX evaluator that provides highly specific, actionable feedback tailored to different user personas. You must output STRICT JSON only that matches the EvalResult interface.

CRITICAL REQUIREMENTS:
1. PERSONA-SPECIFIC ANALYSIS: Adopt the exact communication style, vocabulary, and priorities of the specified persona
2. COMPARATIVE ANALYSIS: For side-by-side comparisons, explicitly identify the winner and explain WHY
3. CONSTRUCTIVE FEEDBACK: Provide actionable usability and accessibility improvements
4. SPECIFIC EXAMPLES: Reference actual interface elements you see in the images
5. DETAILED ISSUES: Identify ALL specific problems with clear explanations of why they matter to this persona
6. DYNAMIC QUANTITY: Return ALL highlights and issues you find - do not limit to a fixed number

COMPARISON REQUIREMENTS (for side-by-side analysis):
- Clearly state which design performs better overall
- Provide specific reasons with concrete examples
- Compare usability, accessibility, and visual design aspects
- Give actionable recommendations for each design
- Each design may have DIFFERENT numbers of issues - do not force equal counts
- Design A might have 2 issues while Design B has 4 issues - this is normal and expected

CONSTRUCTIVE FEEDBACK REQUIREMENTS:
- Identify specific usability issues with solutions
- Highlight accessibility barriers with improvement suggestions
- Provide concrete recommendations that address the persona's unique needs
- Explain WHY certain design choices work better for this persona

AVOID GENERIC STATEMENTS LIKE:
- "Clean layout with clear hierarchy" 
- "Good use of whitespace and contrast"
- "User-friendly interface"

INSTEAD PROVIDE SPECIFIC FEEDBACK LIKE:
- "Design A's primary CTA button is positioned optimally for thumb reach, while Design B requires awkward thumb stretching"
- "Design A's three-step checkout reduces cognitive load compared to Design B's single-page form"
- "Design A's color-coded status indicators help users quickly identify priority items, unlike Design B's text-only approach"

Response must be valid JSON only - no markdown, explanations, or additional text.

IMPORTANT: Include ALL highlights and issues you identify - typically 3-8 highlights and 1-6 issues, but adjust based on what you actually find.`;
    const userPrompt = this.buildPrompt(images, persona, designBackground, analysisType);

    const imageParts = images.map(image => {
      const commaIdx = image.indexOf(',');
      const header = image.substring(0, commaIdx);
      const data = image.substring(commaIdx + 1);
      const mimeMatch = header.match(/^data:(.*?);base64$/);
      const mimeType = mimeMatch?.[1] || 'image/jpeg';
      return {
        inlineData: {
          data,
          mimeType,
        }
      };
    });

    const result = await model.generateContent([
      systemPrompt + '\n' + userPrompt,
      ...imageParts
    ]);

    const response = await result.response;
    const content = response.text();
    
    console.log('Gemini response:', content);
    
  return this.parseResponse(content, 'gemini', persona.id, images.length, analysisType || (images.length > 1 ? 'flow' : 'single'));
  }

  private getMockResponse(personaId: string, imageCount: number = 1, analysisType: 'single' | 'flow' | 'side-by-side' = 'single'): EvalResult {
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
          {
            stepHint: isFlow ? `Step ${i + 1} Text/Contrast` : 'Text contrast',
            issue: 'Some text on colored backgrounds may not meet WCAG AA contrast.',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Accessibility' as const,
            principles: ['Contrast', 'Legibility'],
            suggestion: 'Increase contrast to at least 4.5:1 for body text.'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Focus` : 'Keyboard focus',
            issue: 'Keyboard focus states are unclear on interactive elements.',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Accessibility' as const,
            principles: ['Focus Visible', 'Operable'],
            suggestion: 'Ensure clear focus outlines and logical tab order.'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Navigation` : 'Primary action clarity',
            issue: 'Primary action is not visually prioritized, causing decision friction.',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Usability' as const,
            principles: ['Visibility of system status', 'Recognition over recall'],
            suggestion: 'Increase prominence of the primary CTA and reduce competing elements.'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Recovery` : 'Error prevention',
            issue: 'Risk of accidental purchases without clear confirmations.',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Usability' as const,
            principles: ['Error prevention', 'User control'],
            suggestion: 'Add confirm dialogs and easy undo for purchase-related actions.'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Hierarchy` : 'Visual hierarchy',
            issue: 'Secondary text competes with primary information.',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Visual' as const,
            principles: ['Hierarchy', 'Scale'],
            suggestion: 'Adjust typography scale/weight and spacing to clarify priorities.'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Consistency` : 'Component consistency',
            issue: 'Inconsistent component styles across screens.',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Visual' as const,
            principles: ['Consistency', 'Unity'],
            suggestion: 'Normalize spacing, corner radii, and icon sizes across variants.'
          },
        ],
        narrative: isFlow ?
          `Step ${i + 1} of the user flow demonstrates good visual consistency with previous screens. The interface maintains clear navigation patterns, though some improvements could enhance the user journey experience.` :
          'This interface shows strong visual appeal with a clean, modern design. The layout effectively uses white space and maintains good visual hierarchy, though some accessibility improvements would benefit all users.'
        ,
        verbatim: [
          '“This is cool, but can I make it look more like my style?”',
          '“Feels fast, I’d share this if it had a template.”'
        ]
      });
    }

    return {
      model: 'gemini' as ModelProvider,
      personaId,
      items: mockItems
    };
  }

  private buildPrompt(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow' | 'side-by-side'): string {
    const contextSection = designBackground ? `
Design Context & Background:
${designBackground}

` : '';

    const analysisInstructions = analysisType === 'flow' ? 
      `Analyze these ${images.length} images as a user flow/journey. Consider flow continuity and consistency.` :
      analysisType === 'side-by-side' ?
      `Compare these ${images.length} designs side by side. Identify which design performs better and why.` :
      `Analyze this single interface design focusing on individual screen quality.`;

    // Check if this is a custom persona
    const isCustomPersona = persona.id.startsWith('custom-');

    return `
${contextSection}Persona: ${persona.name}
Traits: ${persona.traits.join(', ')}
Motivations: ${persona.motivations.join(', ')}
Pain Points: ${persona.painPoints.join(', ')}
${isCustomPersona ? `Design Implications: ${persona.designImplications.join(', ')}` : ''}

${analysisInstructions}

Evaluate ${images.length} image(s) and return JSON with EvalResult structure.
Score usability, accessibility, visual (0-100 each).
Include highlights, issues with severity/dimension/principles/suggestions, and narrative.
`;
  }

  private parseResponse(content: string, model: ModelProvider, personaId: string, imageCount?: number, analysisType: 'single' | 'flow' | 'side-by-side' = 'single'): EvalResult {
    try {
      // Clean the response by removing markdown code blocks and extra whitespace
      let cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
      
      // Try to find JSON in the response if it's wrapped in other text
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      const parsed = JSON.parse(cleanContent);
      
      // Return standard format (should match expected structure)
  return {
        model,
        personaId,
        items: parsed.items || []
      };
    } catch (error) {
      console.error('Gemini response parsing error:', error);
      console.error('Raw content:', content);
      
  // Return mock response as fallback honoring the original request shape
  return this.getMockResponse(personaId, imageCount || 1, analysisType);
    }
  }
}

export class ZhipuAdapter implements AIAdapter {
  private baseURL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

  async evaluate(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow' | 'side-by-side'): Promise<EvalResult> {
    // Mock mode for demo - return simulated response
    if (process.env.NODE_ENV === 'development' && (!process.env.ZHIPU_API_KEY || process.env.ZHIPU_API_KEY === '')) {
      console.log('Zhipu adapter using mock response - no API key configured');
      return this.getMockResponse(persona.id, images.length, analysisType || 'single');
    }

    const systemPrompt = `You are a specialized UX evaluator that provides highly specific, actionable feedback tailored to different user personas. You must output STRICT JSON only that matches the EvalResult interface.

CRITICAL REQUIREMENTS:
1. PERSONA-SPECIFIC ANALYSIS: Adopt the exact communication style, vocabulary, and priorities of the specified persona
2. COMPARATIVE ANALYSIS: For side-by-side comparisons, explicitly identify the winner and explain WHY
3. CONSTRUCTIVE FEEDBACK: Provide actionable usability and accessibility improvements
4. SPECIFIC EXAMPLES: Reference actual interface elements you see in the images
5. DETAILED ISSUES: Identify ALL specific problems with clear explanations of why they matter to this persona
6. DYNAMIC QUANTITY: Return ALL highlights and issues you find - do not limit to a fixed number

COMPARISON REQUIREMENTS (for side-by-side analysis):
- Clearly state which design performs better overall
- Provide specific reasons with concrete examples
- Compare usability, accessibility, and visual design aspects
- Give actionable recommendations for each design
- Each design may have DIFFERENT numbers of issues - do not force equal counts
- Design A might have 2 issues while Design B has 4 issues - this is normal and expected

CONSTRUCTIVE FEEDBACK REQUIREMENTS:
- Identify specific usability issues with solutions
- Highlight accessibility barriers with improvement suggestions
- Provide concrete recommendations that address the persona's unique needs
- Explain WHY certain design choices work better for this persona

AVOID GENERIC STATEMENTS LIKE:
- "Clean layout with clear hierarchy" 
- "Good use of whitespace and contrast"
- "User-friendly interface"

INSTEAD PROVIDE SPECIFIC FEEDBACK LIKE:
- "Design A's primary CTA button is positioned optimally for thumb reach, while Design B requires awkward thumb stretching"
- "Design A's three-step checkout reduces cognitive load compared to Design B's single-page form"
- "Design A's color-coded status indicators help users quickly identify priority items, unlike Design B's text-only approach"

Response must be valid JSON only - no markdown, explanations, or additional text.

IMPORTANT: Include ALL highlights and issues you identify - typically 3-8 highlights and 1-6 issues, but adjust based on what you actually find.`;
    const userPrompt = this.buildPrompt(images, persona, designBackground, analysisType);

    const response = await axios.post(this.baseURL, {
      model: 'glm-4v',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            ...images.map(image => ({
              type: 'image_url',
              image_url: { url: image }
            }))
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

    return this.parseResponse(content, 'zhipu', persona.id);
  }

  private getMockResponse(personaId: string, imageCount: number = 1, analysisType: 'single' | 'flow' | 'side-by-side' = 'single'): EvalResult {
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
          {
            stepHint: isFlow ? `Step ${i + 1} Text/Contrast` : 'Text contrast',
            issue: 'Some text on colored backgrounds may not meet WCAG AA contrast.',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Accessibility' as const,
            principles: ['Contrast', 'Legibility'],
            suggestion: 'Increase contrast to at least 4.5:1 for body text.'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Focus` : 'Keyboard focus',
            issue: 'Keyboard focus states are unclear on interactive elements.',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Accessibility' as const,
            principles: ['Focus Visible', 'Operable'],
            suggestion: 'Ensure clear focus outlines and logical tab order.'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Navigation` : 'Primary action clarity',
            issue: 'Primary action is not visually prioritized, causing decision friction.',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Usability' as const,
            principles: ['Visibility of system status', 'Recognition over recall'],
            suggestion: 'Increase prominence of the primary CTA and reduce competing elements.'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Recovery` : 'Error prevention',
            issue: 'Risk of accidental purchases without clear confirmations.',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Usability' as const,
            principles: ['Error prevention', 'User control'],
            suggestion: 'Add confirm dialogs and easy undo for purchase-related actions.'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Hierarchy` : 'Visual hierarchy',
            issue: 'Secondary text competes with primary information.',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Visual' as const,
            principles: ['Hierarchy', 'Scale'],
            suggestion: 'Adjust typography scale/weight and spacing to clarify priorities.'
          },
          {
            stepHint: isFlow ? `Step ${i + 1} Consistency` : 'Component consistency',
            issue: 'Inconsistent component styles across screens.',
            severity: (['High', 'Medium', 'Low'] as const)[Math.floor(Math.random() * 3)],
            dimension: 'Visual' as const,
            principles: ['Consistency', 'Unity'],
            suggestion: 'Normalize spacing, corner radii, and icon sizes across variants.'
          },
        ],
        narrative: isFlow ?
          `Step ${i + 1} of the user flow demonstrates good visual consistency with previous screens. The interface maintains clear navigation patterns, though some improvements could enhance the user journey experience.` :
          'This interface shows strong visual appeal with a clean, modern design. The layout effectively uses white space and maintains good visual hierarchy, though some accessibility improvements would benefit all users.'
        ,
        verbatim: [
          '“Show me where the data came from.”',
          '“Don’t change what already works for me.”'
        ]
      });
    }

    return {
      model: 'zhipu' as ModelProvider,
      personaId,
      items: mockItems
    };
  }

  private buildPrompt(images: string[], persona: Persona, designBackground?: string, analysisType?: 'single' | 'flow' | 'side-by-side'): string {
    const contextSection = designBackground ? `
Design Context & Background:
${designBackground}

` : '';

    const analysisInstructions = analysisType === 'flow' ? 
      `Analyze these ${images.length} images as a user flow/journey. Consider flow continuity and consistency.` :
      analysisType === 'side-by-side' ?
      `Compare these ${images.length} designs side by side. Identify which design performs better and why.` :
      `Analyze this single interface design focusing on individual screen quality.`;

    // Check if this is a custom persona
    const isCustomPersona = persona.id.startsWith('custom-');

    return `
${contextSection}Persona: ${persona.name}
Traits: ${persona.traits.join(', ')}
Motivations: ${persona.motivations.join(', ')}
Pain Points: ${persona.painPoints.join(', ')}
${isCustomPersona ? `Design Implications: ${persona.designImplications.join(', ')}` : ''}

${analysisInstructions}

Evaluate ${images.length} image(s) and return JSON with EvalResult structure.
Score usability, accessibility, visual (0-100 each).
Include highlights, issues with severity/dimension/principles/suggestions, and narrative.
`;
  }

  private parseResponse(content: string, model: ModelProvider, personaId: string): EvalResult {
    try {
      const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
      const parsed = JSON.parse(cleanContent);
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

export function createAIAdapter(provider: ModelProvider): AIAdapter {
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
