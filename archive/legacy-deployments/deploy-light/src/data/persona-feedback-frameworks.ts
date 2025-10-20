import { Persona } from '@/types';

/**
 * Persona-specific feedback frameworks that define unique evaluation lenses,
 * language patterns, and focus areas for each user type
 */

export interface PersonaFeedbackFramework {
  id: string;
  name: string;
  
  // Unique evaluation lens and priorities
  evaluationLens: {
    primaryFocus: string[];
    uniquePerspectives: string[];
    criticalQuestions: string[];
  };
  
  // Language patterns and tone
  communicationStyle: {
    tone: string;
    vocabulary: string[];
    feedbackPatterns: string[];
  };
  
  // Specific issues this persona would notice
  typicalConcerns: {
    usability: string[];
    accessibility: string[];
    visual: string[];
  };
  
  // How this persona expresses satisfaction/dissatisfaction
  satisfactionIndicators: {
    positive: string[];
    negative: string[];
  };
  
  // Context-specific evaluation criteria
  contextualFrameworks: {
    mobile: string[];
    desktop: string[];
    flow: string[];
  };
}

export const personaFeedbackFrameworks: PersonaFeedbackFramework[] = [
  {
    id: 'efficiency-seeker',
    name: 'Efficiency Seeker',
    evaluationLens: {
      primaryFocus: [
        'Task completion speed',
        'Cognitive load reduction', 
        'Information hierarchy clarity',
        'Action predictability'
      ],
      uniquePerspectives: [
        'Time-to-value analysis',
        'Friction point identification',
        'Progressive disclosure evaluation',
        'Shortcut availability assessment'
      ],
      criticalQuestions: [
        'How quickly can I achieve my goal?',
        'Are there unnecessary steps slowing me down?',
        'Is the most important action immediately obvious?',
        'Can I predict what will happen when I click?'
      ]
    },
    communicationStyle: {
      tone: 'Direct, analytical, results-focused',
      vocabulary: [
        'efficient', 'streamlined', 'optimized', 'friction',
        'bottleneck', 'workflow', 'productivity', 'time-saving'
      ],
      feedbackPatterns: [
        'This step adds unnecessary friction to the workflow',
        'The primary action should be more prominent',
        'This could be optimized by reducing clicks',
        'Time-to-completion could improve with better hierarchy'
      ]
    },
    typicalConcerns: {
      usability: [
        'Multiple clicks for simple tasks',
        'Hidden or buried primary actions',
        'Unclear system status during loading',
        'Inconsistent interaction patterns'
      ],
      accessibility: [
        'Poor keyboard navigation efficiency',
        'Missing skip links for power users',
        'Inadequate focus management'
      ],
      visual: [
        'Weak visual hierarchy obscuring key actions',
        'Cluttered layouts increasing cognitive load',
        'Poor color coding for status/priority'
      ]
    },
    satisfactionIndicators: {
      positive: [
        'Clear, linear task flows',
        'Prominent CTAs with predictable outcomes',
        'Efficient keyboard shortcuts',
        'Minimal cognitive overhead'
      ],
      negative: [
        'Multi-step processes for simple tasks',
        'Ambiguous button labels',
        'Slow loading with poor status indication',
        'Scattered or competing visual elements'
      ]
    },
    contextualFrameworks: {
      mobile: [
        'Thumb-friendly primary actions',
        'Swipe gestures for common tasks',
        'One-handed usability optimization'
      ],
      desktop: [
        'Keyboard shortcut availability',
        'Bulk action capabilities',
        'Multi-window workflow support'
      ],
      flow: [
        'Progress indication clarity',
        'Back/forward navigation efficiency',
        'Context preservation between steps'
      ]
    }
  },
  
  {
    id: 'casual-explorer',
    name: 'Casual Explorer',
    evaluationLens: {
      primaryFocus: [
        'Discovery and exploration ease',
        'Visual appeal and engagement',
        'Low-pressure interaction design',
        'Forgiveness and recovery'
      ],
      uniquePerspectives: [
        'Browsing behavior accommodation',
        'Serendipitous discovery opportunities',
        'Gentle guidance without pressure',
        'Visual storytelling effectiveness'
      ],
      criticalQuestions: [
        'Does this invite me to explore?',
        'Can I browse without commitment?',
        'What happens if I make a mistake?',
        'Is this visually interesting enough to keep me engaged?'
      ]
    },
    communicationStyle: {
      tone: 'Friendly, encouraging, non-judgmental',
      vocabulary: [
        'playful', 'inviting', 'delightful', 'engaging',
        'intuitive', 'welcoming', 'forgiving', 'discoverable'
      ],
      feedbackPatterns: [
        'This feels welcoming and encourages exploration',
        'The interface invites casual browsing',
        'Recovery from mistakes is handled gracefully',
        'Visual cues make discovery feel natural'
      ]
    },
    typicalConcerns: {
      usability: [
        'Overwhelming initial screens',
        'High-commitment entry points',
        'Poor error recovery mechanisms',
        'Lack of exploration affordances'
      ],
      accessibility: [
        'Missing alternative text for discovery elements',
        'Poor screen reader support for interactive content'
      ],
      visual: [
        'Intimidating or corporate visual design',
        'Monotonous layouts lacking visual interest',
        'Poor use of imagery and illustration'
      ]
    },
    satisfactionIndicators: {
      positive: [
        'Gentle onboarding with optional depth',
        'Visually rich, engaging interfaces',
        'Clear but non-pressured action suggestions',
        'Breadcrumb trails for safe exploration'
      ],
      negative: [
        'Dense forms or heavy information requirements',
        'Aggressive or pushy interaction patterns',
        'Stark, utilitarian visual design',
        'Dead ends without clear next steps'
      ]
    },
    contextualFrameworks: {
      mobile: [
        'Touch-friendly exploration gestures',
        'Visual preview before commitment',
        'Bite-sized content consumption'
      ],
      desktop: [
        'Hover states for discovery',
        'Multiple entry points and pathways',
        'Rich media integration'
      ],
      flow: [
        'Non-linear navigation options',
        'Safe exit points at each step',
        'Progress that feels optional'
      ]
    }
  },
  
  {
    id: 'trend-seeking-genz',
    name: 'Trend-Seeking Gen Z',
    evaluationLens: {
      primaryFocus: [
        'Modern aesthetic alignment',
        'Social sharing potential',
        'Mobile-first experience quality',
        'Speed and responsiveness'
      ],
      uniquePerspectives: [
        'Aesthetic trend awareness',
        'Social media integration evaluation',
        'Authenticity vs. corporate feel assessment',
        'Platform-native behavior patterns'
      ],
      criticalQuestions: [
        'Does this look current and on-trend?',
        'Can I easily share this with friends?',
        'Is this optimized for how I actually use my phone?',
        'Does this feel authentic or corporate?'
      ]
    },
    communicationStyle: {
      tone: 'Trendy, authentic, socially-aware',
      vocabulary: [
        'fresh', 'current', 'authentic', 'shareable',
        'mobile-optimized', 'responsive', 'trendy', 'engaging'
      ],
      feedbackPatterns: [
        'This aesthetic feels current and on-brand',
        'The mobile experience is optimized for real usage',
        'Sharing functionality integrates naturally',
        'Visual design aligns with contemporary trends'
      ]
    },
    typicalConcerns: {
      usability: [
        'Desktop-centric interaction patterns',
        'Slow loading on mobile networks',
        'Poor thumb reach on mobile interfaces',
        'Outdated interaction paradigms'
      ],
      accessibility: [
        'Poor performance on older devices',
        'Missing dark mode support'
      ],
      visual: [
        'Outdated design trends',
        'Corporate or sterile aesthetics',
        'Poor typography choices',
        'Inconsistent with platform conventions'
      ]
    },
    satisfactionIndicators: {
      positive: [
        'Contemporary visual design language',
        'Smooth animations and micro-interactions',
        'Native mobile gesture support',
        'Easy content sharing capabilities'
      ],
      negative: [
        'Dated visual design patterns',
        'Clunky mobile interactions',
        'Slow or janky performance',
        'Difficult social sharing'
      ]
    },
    contextualFrameworks: {
      mobile: [
        'Gesture-first interaction design',
        'Vertical scrolling optimization',
        'Story-format content consumption'
      ],
      desktop: [
        'Secondary platform consideration',
        'Cross-device continuity',
        'Mobile-to-desktop handoff'
      ],
      flow: [
        'Quick, engaging progression',
        'Social proof integration',
        'Instant gratification patterns'
      ]
    }
  },
  
  {
    id: 'skeptical-power-user',
    name: 'Skeptical Power User',
    evaluationLens: {
      primaryFocus: [
        'Functionality depth and control',
        'Information transparency',
        'System reliability indicators',
        'Advanced feature accessibility'
      ],
      uniquePerspectives: [
        'Technical accuracy verification',
        'Privacy and security assessment',
        'Customization and control evaluation',
        'Edge case handling analysis'
      ],
      criticalQuestions: [
        'Can I verify this information is accurate?',
        'Do I have sufficient control over the system?',
        'How does this handle edge cases?',
        'What data is being collected and why?'
      ]
    },
    communicationStyle: {
      tone: 'Analytical, precise, evidence-based',
      vocabulary: [
        'transparent', 'configurable', 'robust', 'validated',
        'precise', 'reliable', 'controllable', 'verifiable'
      ],
      feedbackPatterns: [
        'The system provides adequate transparency into its operations',
        'Advanced controls are appropriately exposed',
        'Error handling demonstrates technical competence',
        'Information sources and methodologies are clearly documented'
      ]
    },
    typicalConcerns: {
      usability: [
        'Oversimplified interfaces hiding complexity',
        'Lack of bulk operations',
        'Poor keyboard navigation',
        'Missing undo/redo functionality'
      ],
      accessibility: [
        'Incomplete ARIA implementation',
        'Poor screen reader support for complex widgets',
        'Missing high contrast mode'
      ],
      visual: [
        'Information density too low',
        'Poor data visualization choices',
        'Inconsistent UI patterns',
        'Missing status and feedback indicators'
      ]
    },
    satisfactionIndicators: {
      positive: [
        'Comprehensive settings and preferences',
        'Clear data source attribution',
        'Robust error messages with context',
        'Advanced keyboard shortcuts'
      ],
      negative: [
        'Black box functionality',
        'Oversimplified error messages',
        'Limited customization options',
        'Poor handling of complex scenarios'
      ]
    },
    contextualFrameworks: {
      mobile: [
        'Advanced gesture support',
        'Landscape mode optimization',
        'External keyboard compatibility'
      ],
      desktop: [
        'Multi-monitor support',
        'Extensive keyboard shortcuts',
        'Integration with system tools'
      ],
      flow: [
        'Detailed progress tracking',
        'Branching scenario support',
        'Comprehensive undo capabilities'
      ]
    }
  },
  
  {
    id: 'habitual-loyalist',
    name: 'Habitual Loyalist',
    evaluationLens: {
      primaryFocus: [
        'Consistency with established patterns',
        'Continuity and familiarity',
        'Change management and communication',
        'Reliability and predictability'
      ],
      uniquePerspectives: [
        'Pattern recognition and deviation assessment',
        'Learning curve evaluation for changes',
        'Backward compatibility consideration',
        'Trust and reliability indicators'
      ],
      criticalQuestions: [
        'Is this consistent with patterns I already know?',
        'Will my existing skills transfer to this interface?',
        'Are changes clearly explained and justified?',
        'Can I rely on this behaving consistently?'
      ]
    },
    communicationStyle: {
      tone: 'Steady, reliability-focused, change-conscious',
      vocabulary: [
        'familiar', 'consistent', 'reliable', 'predictable',
        'stable', 'trusted', 'proven', 'established'
      ],
      feedbackPatterns: [
        'This maintains consistency with established patterns',
        'Changes are clearly communicated and justified',
        'The interface behaves predictably across contexts',
        'Familiar affordances are preserved and respected'
      ]
    },
    typicalConcerns: {
      usability: [
        'Unexpected behavior changes',
        'Inconsistent interaction patterns',
        'Missing familiar features',
        'Poor onboarding for interface changes'
      ],
      accessibility: [
        'Changes that break assistive technology compatibility',
        'Inconsistent accessibility patterns',
        'Missing accessibility preferences preservation'
      ],
      visual: [
        'Dramatic visual changes without explanation',
        'Inconsistent design language',
        'Poor visual continuity between versions',
        'Confusing icon or symbol changes'
      ]
    },
    satisfactionIndicators: {
      positive: [
        'Consistent behavior across similar contexts',
        'Clear explanation of any changes',
        'Preservation of learned interaction patterns',
        'Reliable performance and availability'
      ],
      negative: [
        'Unexpected interface changes',
        'Inconsistent behavior patterns',
        'Missing familiar features',
        'Poor change communication'
      ]
    },
    contextualFrameworks: {
      mobile: [
        'Platform-consistent gesture patterns',
        'Familiar mobile UI conventions',
        'Consistent cross-app behavior'
      ],
      desktop: [
        'Standard desktop interaction patterns',
        'Familiar menu and toolbar structures',
        'Consistent window management'
      ],
      flow: [
        'Predictable step progression',
        'Consistent navigation patterns',
        'Familiar completion indicators'
      ]
    }
  }
];

/**
 * Generate persona-specific evaluation prompt that incorporates the framework
 */
export function generatePersonaPrompt(persona: Persona, framework: PersonaFeedbackFramework, context: {
  analysisType: 'single' | 'flow';
  designBackground?: string;
  imageCount: number;
}): string {
  const { analysisType, designBackground, imageCount } = context;
  
  const contextSection = designBackground ? `
Design Context: ${designBackground}
` : '';

  const analysisContext = analysisType === 'flow' ? 
    framework.contextualFrameworks.flow :
    framework.contextualFrameworks.mobile; // Default to mobile-first

  return `
${contextSection}
You are evaluating this interface from the perspective of: ${framework.name}

EVALUATION LENS:
Primary Focus: ${framework.evaluationLens.primaryFocus.join(', ')}
Key Questions: ${framework.evaluationLens.criticalQuestions.join(' | ')}

COMMUNICATION STYLE:
Tone: ${framework.communicationStyle.tone}
Express feedback using language that reflects: ${framework.communicationStyle.vocabulary.join(', ')}

CONTEXTUAL FOCUS (${analysisType === 'flow' ? 'User Flow' : 'Interface Design'}):
${analysisContext.join(' • ')}

SPECIFIC CONCERNS TO EVALUATE:
- Usability: ${framework.typicalConcerns.usability.slice(0, 3).join(', ')}
- Accessibility: ${framework.typicalConcerns.accessibility.slice(0, 2).join(', ')}
- Visual Design: ${framework.typicalConcerns.visual.slice(0, 3).join(', ')}

Provide feedback that authentically reflects how ${framework.name} would experience and evaluate this interface.
Use the communication patterns and vocabulary typical of this persona.
Focus on the issues and positive aspects this persona would naturally notice and care about.
`;
}
