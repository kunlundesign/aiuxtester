import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { z } from "zod";
import { createAIAdapter } from "../lib/ai-adapters";
import { Persona, ModelProvider, EvalResult } from "../types";

// Built-in personas (simplified for the function)
const builtInPersonas: Persona[] = [
  {
    id: 'efficiency-seeker',
    name: 'Efficiency Seeker',
    traits: ['Time-pressed', 'Goal-driven', 'Low tolerance for friction'],
    motivations: ['Complete tasks quickly', 'Trust reliable answers', 'Reduce cognitive load'],
    painPoints: ['Cluttered layouts', 'Slow responses', 'Hidden actions'],
    designImplications: ['Streamline key flows', 'Prioritize latency', 'Make primary actions obvious']
  },
  {
    id: 'casual-explorer',
    name: 'Casual Explorer',
    traits: ['Curious and playful', 'Low-commitment engagement', 'Enjoys discovery'],
    motivations: ['Entertain and learn casually', 'Try AI with minimal setup', 'Effortless browsing'],
    painPoints: ['Heavy onboarding', 'Rigid flows', 'Boring outputs'],
    designImplications: ['Lower barriers to entry', 'Offer gentle guidance', 'Use microinteractions']
  },
  {
    id: 'trend-seeking-genz',
    name: 'Trend-Seeking Gen Z',
    traits: ['Mobile-first', 'Socially engaged', 'Aesthetic-driven'],
    motivations: ['Discover trends', 'Self-expression', 'Fast content creation'],
    painPoints: ['Slow loads', 'Generic outputs', 'Awkward sharing'],
    designImplications: ['Optimize for mobile', 'Offer customization', 'Make sharing effortless']
  },
  {
    id: 'skeptical-power-user',
    name: 'Skeptical Power User',
    traits: ['Tech-savvy', 'Control-seeking', 'Expects transparency'],
    motivations: ['Accuracy', 'Source control', 'Efficient complex tasks'],
    painPoints: ['AI hallucinations', 'Limited control', 'Opaque errors'],
    designImplications: ['Show citations', 'Expose advanced controls', 'Provide precise errors']
  },
  {
    id: 'habitual-loyalist',
    name: 'Habitual Loyalist',
    traits: ['Routine-based', 'Stability-focused', 'Risk-averse'],
    motivations: ['Predictable layouts', 'Minimal relearning', 'Clear mapping'],
    painPoints: ['Frequent UI changes', 'Relocated features', 'Loss of settings'],
    designImplications: ['Preserve continuity', 'Offer gradual onboarding', 'Communicate changes']
  }
];

const EvaluateRequestSchema = z.object({
  model: z.enum(['openai', 'gemini', 'zhipu']),
  personaId: z.string(),
  images: z.array(z.string()), // base64 encoded images
  designBackground: z.string().optional(),
  analysisType: z.enum(['single', 'flow', 'side-by-side']).optional(),
  customPersona: z.object({
    id: z.string(),
    name: z.string(),
    traits: z.array(z.string()),
    motivations: z.array(z.string()),
    painPoints: z.array(z.string()),
    designImplications: z.array(z.string()),
    whenToApply: z.string().optional(),
    weighting: z.object({
      usability: z.number(),
      accessibility: z.number(),
      visual: z.number()
    }).optional()
  }).optional(),
});

async function evaluate(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Evaluate function processing request');
  
  try {
    const body = await request.json();
    const { model, personaId, images, designBackground, analysisType, customPersona } = EvaluateRequestSchema.parse(body);

    // Find the persona - check custom persona first, then built-in personas
    let persona: Persona | undefined;
    if (customPersona && customPersona.id === personaId) {
      persona = customPersona;
    } else {
      persona = builtInPersonas.find(p => p.id === personaId);
    }
    
    if (!persona) {
      return {
        status: 400,
        jsonBody: { error: 'Persona not found' }
      };
    }

    // Validate images
    if (!images || images.length === 0) {
      return {
        status: 400,
        jsonBody: { error: 'No images provided' }
      };
    }

    // Create AI adapter and evaluate
    const adapter = createAIAdapter(model as ModelProvider);
    const inferredType = analysisType || (images.length > 1 ? 'flow' : 'single');
    const result: EvalResult = await adapter.evaluate(images, persona, designBackground, inferredType);

    return {
      jsonBody: result,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Evaluation error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        status: 400,
        jsonBody: { error: 'Invalid request format', details: error.errors }
      };
    }

    return {
      status: 500,
      jsonBody: { error: 'Internal server error' }
    };
  }
}

app.http('evaluate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'evaluate',
  handler: evaluate
});
