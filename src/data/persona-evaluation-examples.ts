/**
 * Persona-Driven UX Evaluation System
 * 
 * This demonstrates how the enhanced system provides persona-specific feedback
 * that goes beyond generic UX evaluation to reflect each user type's unique
 * perspective, language, and priorities.
 * 
 * Enhanced Features:
 * 1. Persona-specific evaluation lenses and critical questions
 * 2. Authentic communication styles and vocabulary
 * 3. Typical concerns each persona would notice
 * 4. Context-aware evaluation criteria (mobile/desktop/flow)
 * 5. Satisfaction indicators specific to each user type
 */

import { personaFeedbackFrameworks, generatePersonaPrompt } from './persona-feedback-frameworks';
import { personas } from './personas';

// Example: How each persona would evaluate the same mobile app interface

export const personaEvaluationExamples = {
  
  // Efficiency Seeker perspective
  'efficiency-seeker': {
    sampleFeedback: {
      tone: "Direct, analytical, results-focused",
      highlights: [
        "Primary CTA is immediately obvious and thumb-accessible",
        "Task flow is streamlined with minimal friction points",
        "Loading states provide clear progress indication"
      ],
      concerns: [
        "Secondary navigation adds unnecessary friction to the workflow",
        "Multiple taps required for common actions reduces efficiency",
        "Time-to-completion could improve with better visual hierarchy"
      ],
      language: [
        "This step adds unnecessary friction",
        "The workflow could be optimized by...",
        "Primary action should be more prominent",
        "This creates a bottleneck in task completion"
      ]
    }
  },

  // Casual Explorer perspective  
  'casual-explorer': {
    sampleFeedback: {
      tone: "Friendly, encouraging, non-judgmental",
      highlights: [
        "Interface feels welcoming and encourages exploration",
        "Visual design creates an inviting browsing experience",
        "Error recovery is handled gracefully without pressure"
      ],
      concerns: [
        "Dense information requirements feel overwhelming",
        "Interface lacks visual interest for casual engagement",
        "Dead ends without clear next steps discourage exploration"
      ],
      language: [
        "This feels welcoming and invites exploration",
        "The design encourages casual browsing",
        "Visual cues make discovery feel natural",
        "Recovery from mistakes is handled gracefully"
      ]
    }
  },

  // Trend-Seeking Gen Z perspective
  'trend-seeking-genz': {
    sampleFeedback: {
      tone: "Trendy, authentic, socially-aware",
      highlights: [
        "Aesthetic feels current and on-brand for mobile-first users",
        "Smooth animations and micro-interactions enhance engagement",
        "Social sharing integration feels natural and effortless"
      ],
      concerns: [
        "Design language feels dated compared to current trends",
        "Mobile interactions feel clunky and not optimized for real usage",
        "Sharing functionality is buried and difficult to access"
      ],
      language: [
        "This aesthetic feels fresh and current",
        "Mobile experience is optimized for real usage patterns",
        "Visual design aligns with contemporary trends",
        "This feels authentic rather than corporate"
      ]
    }
  },

  // Skeptical Power User perspective
  'skeptical-power-user': {
    sampleFeedback: {
      tone: "Analytical, precise, evidence-based",
      highlights: [
        "System provides adequate transparency into operations",
        "Advanced controls are appropriately exposed for power users",
        "Error handling demonstrates technical competence"
      ],
      concerns: [
        "Black box functionality lacks sufficient transparency",
        "Oversimplified interface hides necessary complexity",
        "Limited customization options restrict advanced usage"
      ],
      language: [
        "The system provides adequate transparency",
        "Advanced controls are appropriately exposed",
        "Information sources and methodologies are clearly documented",
        "Error handling demonstrates technical competence"
      ]
    }
  },

  // Habitual Loyalist perspective
  'habitual-loyalist': {
    sampleFeedback: {
      tone: "Steady, reliability-focused, change-conscious",
      highlights: [
        "Interface maintains consistency with established patterns",
        "Familiar affordances are preserved and respected",
        "Changes are clearly communicated and justified"
      ],
      concerns: [
        "Unexpected behavior changes disrupt established workflows",
        "Interface deviates from familiar interaction patterns",
        "Missing familiar features break existing mental models"
      ],
      language: [
        "This maintains consistency with established patterns",
        "Familiar affordances are preserved",
        "The interface behaves predictably across contexts",
        "Changes are clearly communicated and justified"
      ]
    }
  }
};

/**
 * Comparison: Generic vs Persona-Specific Feedback
 */
export const feedbackComparison = {
  
  // Generic UX evaluation (current baseline)
  generic: {
    issue: "Button size may be too small for mobile interaction",
    suggestion: "Increase button size to meet accessibility guidelines"
  },

  // Persona-specific variations of the same issue
  personaSpecific: {
    'efficiency-seeker': {
      issue: "Small touch targets create friction in task completion workflows",
      suggestion: "Optimize button sizes for one-handed efficiency and reduce interaction overhead"
    },
    'casual-explorer': {
      issue: "Tiny buttons feel intimidating and might discourage exploration",
      suggestion: "Make interactive elements more inviting with comfortable touch targets"
    },
    'trend-seeking-genz': {
      issue: "Button sizes don't match current mobile-first interaction patterns",
      suggestion: "Update touch targets to align with contemporary mobile design standards"
    },
    'skeptical-power-user': {
      issue: "Touch target dimensions don't meet WCAG 2.1 AA requirements (minimum 44px)",
      suggestion: "Implement precise 44px minimum touch targets with adequate spacing"
    },
    'habitual-loyalist': {
      issue: "Button sizes deviate from platform-standard interaction patterns",
      suggestion: "Maintain consistency with established mobile platform conventions"
    }
  }
};

/**
 * Testing function to demonstrate persona-specific prompts
 */
export function demonstratePersonaPrompts() {
  console.log('🎭 Persona-Driven UX Evaluation System Demo\n');
  
  personas.forEach(persona => {
    const framework = personaFeedbackFrameworks.find(f => f.id === persona.id);
    if (framework) {
      console.log(`--- ${framework.name} ---`);
      console.log(`Focus: ${framework.evaluationLens.primaryFocus.slice(0, 2).join(', ')}`);
      console.log(`Style: ${framework.communicationStyle.tone}`);
      console.log(`Key Question: "${framework.evaluationLens.criticalQuestions[0]}"`);
      console.log('');
    }
  });
}

export default {
  personaEvaluationExamples,
  feedbackComparison,
  demonstratePersonaPrompts
};
