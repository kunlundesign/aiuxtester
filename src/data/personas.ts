import { Persona } from '@/types';

export const personas: Persona[] = [
  {
    id: 'efficiency-seeker',
    name: 'Efficiency Seeker',
    traits: [
      'Time-pressed',
      'Goal-driven',
      'Low tolerance for friction',
      'Prefers minimal UI and clear hierarchy'
    ],
    motivations: [
      'Complete tasks quickly',
      'Trust reliable, actionable answers',
      'Reduce cognitive load'
    ],
    painPoints: [
      'Cluttered layouts and distractions',
      'Slow responses or blocked interactions',
      'Hidden actions and unnecessary steps'
    ],
    designImplications: [
      'Streamline key flows',
      'Prioritize latency and responsiveness',
      'Make primary actions obvious and predictable'
    ],
    whenToApply: 'Use for high-intent, time-sensitive scenarios (Bing: SERP to task; Copilot: quick actions; MSN: at-a-glance reading).',
    weighting: { usability: 0.5, accessibility: 0.3, visual: 0.2 }
  },
  {
    id: 'casual-explorer',
    name: 'Casual Explorer',
    traits: [
      'Curious and playful',
      'Low-commitment engagement',
      'Enjoys discovery and visuals'
    ],
    motivations: [
      'Entertain and learn casually',
      'Try AI with minimal setup',
      'Effortless browsing and bite-sized content'
    ],
    painPoints: [
      'Heavy onboarding or dense forms',
      'Rigid flows that punish detours',
      'Boring or repetitive outputs'
    ],
    designImplications: [
      'Lower barriers to entry',
      'Offer gentle guidance and suggestions',
      'Use microinteractions and visual variety'
    ],
    whenToApply: 'Use for light engagement and discovery (MSN: quizzes/games; Bing: conversational exploration; Copilot: brainstorming).',
    weighting: { usability: 0.4, accessibility: 0.3, visual: 0.3 }
  },
  {
    id: 'trend-seeking-genz',
    name: 'Trend-Seeking Gen Z',
    traits: [
      'Mobile-first',
      'Socially engaged',
      'Aesthetic- and novelty-driven'
    ],
    motivations: [
      'Discover trends',
      'Self-expression and shareability',
      'Fast creation of eye-catching content'
    ],
    painPoints: [
      'Slow loads and jank',
      'Generic outputs and dated visuals',
      'Awkward sharing/export'
    ],
    designImplications: [
      'Optimize for speed on mobile',
      'Offer customization and modern visuals',
      'Make sharing/export effortless'
    ],
    whenToApply: 'Use for youth/trend-driven content (Copilot: creative/study helpers; Bing: AI chat as next-gen search; MSN: snackable modules).',
    weighting: { usability: 0.3, accessibility: 0.2, visual: 0.5 }
  },
  {
    id: 'skeptical-power-user',
    name: 'Skeptical Power User',
    traits: [
      'Tech-savvy and detail-oriented',
      'Control-seeking',
      'Expects transparency and provenance'
    ],
    motivations: [
      'Accuracy and repeatability',
      'Source control and verifiable citations',
      'Efficient handling of complex tasks'
    ],
    painPoints: [
      'AI hallucinations and vague reasoning',
      'Limited export/control',
      'Opaque errors and hidden assumptions'
    ],
    designImplications: [
      'Show citations and reasoning',
      'Expose advanced controls and settings',
      'Provide precise errors and logs'
    ],
    whenToApply: 'Use for complex/high-stakes tasks (Copilot: data analysis; Bing: fact-check/citations; MSN: finance/business).',
    weighting: { usability: 0.45, accessibility: 0.25, visual: 0.3 }
  },
  {
    id: 'habitual-loyalist',
    name: 'Habitual Loyalist',
    traits: [
      'Routine-based',
      'Stability- and trust-focused',
      'Risk-averse'
    ],
    motivations: [
      'Predictable layouts and consistent navigation',
      'Minimal relearning',
      'Clear mapping from old to new ways'
    ],
    painPoints: [
      'Frequent UI changes and surprise defaults',
      'Relocated/hidden features',
      'Loss of prior settings/history'
    ],
    designImplications: [
      'Preserve continuity and affordances',
      'Offer reversible, gradual onboarding',
      'Communicate changes and provide fallbacks'
    ],
    whenToApply: 'Use for change management and continuity (Copilot in Office flows; Bing defaults; MSN homepage redesigns).',
    weighting: { usability: 0.45, accessibility: 0.35, visual: 0.2 }
  }
];
