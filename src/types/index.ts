export interface Persona {
  id: string;
  name: string;
  traits: string[];
  motivations: string[];
  painPoints: string[];
  designImplications: string[];
  // Guidance for UX testing: when and how to apply this persona
  whenToApply?: string;
  weighting?: Record<string, number>;
}

export interface Issue {
  stepHint: string;
  issue: string;
  severity: "Low" | "Medium" | "High";
  dimension: "Usability" | "Accessibility" | "Visual";
  principles: string[];
  suggestion: string;
  // 位置信息 - 用于在图片上标记问题位置
  position?: {
    x: number; // 百分比，0-100
    y: number; // 百分比，0-100
    width?: number; // 百分比，可选
    height?: number; // 百分比，可选
  };
}

export interface Scores {
  usability: number;
  accessibility: number;
  visual: number;
  overall: number; // client-side computed
}

export interface ImageEval {
  imageId: string;
  personaId: string;
  scores: Scores;
  highlights: string[];
  issues: Issue[];
  narrative: string;
  // Optional user quotes to humanize findings
  verbatim?: string[];
}

export interface EvalResult {
  model: "openai" | "gemini" | "zhipu";
  personaId: string;
  items: ImageEval[];
}

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  name: string;
  order: number;
}

export type ModelProvider = "openai" | "gemini" | "zhipu";
