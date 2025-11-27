export interface Persona {
  id: string;
  name: string;
  // Extended fields used by batch evaluation & converter
  age?: number;
  occupation?: string;
  personalityType?: string;
  digitalBehavior?: {
    devicePreference: string;
    searchPattern: string;
    contentPreference: string;
  };
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
  dimension?: "Usability" | "Accessibility" | "Visual";
  principles?: string[];
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
  model: ModelProvider | "batch";
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

export interface SideBySideResults {
  designA: {
    scores?: {
      overall?: number;
      usability?: number;
      accessibility?: number;
      visual?: number;
    };
    highlights?: string[];
    issues?: Array<{
      issue: string;
      severity: string;
      suggestion?: string;
    }>;
    narrative?: string;
  };
  designB: {
    scores?: {
      overall?: number;
      usability?: number;
      accessibility?: number;
      visual?: number;
    };
    highlights?: string[];
    issues?: Array<{
      issue: string;
      severity: string;
      suggestion?: string;
    }>;
    narrative?: string;
  };
  comparison: {
    winner: 'A' | 'B' | 'tie';
    confidence: number;
    keyDifferences: string[];
    recommendation: string;
    abTestRisk: 'low' | 'medium' | 'high';
    confidenceInWinner: number;
    suggestedSampleSize: number;
  };
}

// Request/Response types for API
export interface EvaluateRequest {
  model: ModelProvider;
  personaId: string;
  images: string[]; // base64 encoded images
  designBackground?: string;
  analysisType?: 'single' | 'flow' | 'side-by-side';
  customPersona?: Persona;
}

export interface BatchEvaluateRequest {
  images: string[];
  analysisType?: 'single' | 'flow' | 'side-by-side';
  designBackground?: string;
  model?: ModelProvider;
  sampleSize?: number;
  includeStats?: boolean;
}

export interface BatchEvalSuccess {
  personaId: string;
  personaName: string;
  items: ImageEval[];
  model: string;
}

export interface BatchEvalError {
  personaId: string;
  error: string;
}

export interface BatchEvaluateResponse {
  success: boolean;
  data?: {
    totalEvaluated: number;
    totalRequested: number;
    successRate: string;
    results: BatchEvalSuccess[];
    stats: StatsReport | null;
    intelligentReport: IntelligentReport | null;
    errors?: BatchEvalError[];
    metadata: {
      sampleSize: number;
      analysisType: string;
      model: ModelProvider;
      timestamp: string;
      processingTime: number;
    };
  };
  error?: string;
  details?: unknown;
}

// Stats types
export interface StatsReport {
  totalPersonas: number;
  averageScores: Scores;
  scoreDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  topIssues: Array<{
    issue: string;
    frequency: number;
    severity: 'low' | 'medium' | 'high';
    percentage: number;
  }>;
  personaSegments: {
    ageGroups: Record<string, number>;
    occupations: Record<string, number>;
    personalityTypes: Record<string, number>;
  };
  confidenceLevel: number;
  recommendations: string[];
}

// Intelligent aggregator types
export interface DetailedIssue {
  stepHint: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
  frequency: number;
  affectedPersonas: string[];
  personaTypes: string[];
}

export interface DetailedStrength {
  category: string;
  strength: string;
  frequency: number;
  affectedPersonas: string[];
  impact: 'high' | 'medium' | 'low';
}

export interface PersonaInsight {
  personaId: string;
  personaName: string;
  occupation: string;
  personalityType: string;
  scores: Scores;
  highlights: string[];
  issues: Array<{
    stepHint: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
  }>;
}

export interface IntelligentReport {
  keyInsights: {
    primaryStrengths: DetailedStrength[];
    criticalIssues: DetailedIssue[];
    userSegmentFindings: Array<{
      segment: string;
      avgScore: number;
      uniqueIssues: string[];
      preferences: string[];
    }>;
  };
  actionableRecommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    solution: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
    affectedUsers: number;
  }>;
  uxThemes: Array<{
    theme: string;
    description: string;
    positiveFindings: string[];
    negativeFindings: string[];
    recommendations: string[];
  }>;
  statistics: {
    totalPersonas: number;
    averageScores: {
      usability: number;
      accessibility: number;
      visual: number;
      overall: number;
    };
    confidenceLevel: number;
  };
}

// Health check types
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  memory?: {
    used: string;
    total: string;
  };
  services?: {
    azure_openai: {
      configured: boolean;
      endpoint: string;
    };
    gemini: {
      configured: boolean;
    };
    zhipu: {
      configured: boolean;
    };
  };
  message?: string;
}
