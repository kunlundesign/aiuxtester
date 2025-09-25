import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAIAdapter } from '@/lib/ai-adapters';
import { personas } from '@/data/personas';
import { ModelProvider } from '@/types';

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

export async function POST(request: NextRequest) {
  try {
  const body = await request.json();
  const { model, personaId, images, designBackground, analysisType, customPersona } = EvaluateRequestSchema.parse(body);

    // Find the persona - check custom persona first, then built-in personas
    let persona;
    if (customPersona && customPersona.id === personaId) {
      persona = customPersona;
    } else {
      persona = personas.find(p => p.id === personaId);
    }
    
    if (!persona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 400 }
      );
    }

    // Validate images
    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    // Create AI adapter and evaluate
  const adapter = createAIAdapter(model as ModelProvider);
  const inferredType = analysisType || (images.length > 1 ? 'flow' : 'single');
  const result = await adapter.evaluate(images, persona, designBackground, inferredType);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Evaluation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
