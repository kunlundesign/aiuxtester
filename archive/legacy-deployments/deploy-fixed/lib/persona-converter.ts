import { Persona } from '@/types';

export interface RawPersonaData {
  'Core Identity': {
    full_name: string;
    age: number;
    gender: string;
    nationality: string;
    current_residence: string;
    education: {
      degree: string;
      major: string;
      institution: string;
    };
    occupation: string;
    company: string;
    physical_attributes: Record<string, string>;
  };
  'Psychographics & Personality': {
    personality_traits: {
      openness: string;
      conscientiousness: string;
      extraversion: string;
      agreeableness: string;
      neuroticism: string;
    };
    mbti: string;
    beliefs_and_values: string;
    motivations: string;
    cognitive_style: string;
  };
  'Digital Behavior & Online Habits': {
    search_patterns: string;
    ad_interactions: string;
    preferred_content_sources: string;
    social_media_usage: string;
    ecommerce_behavior: string;
    device_usage: string;
    subscriptions: string;
  };
  'Interests & Preferences': {
    professional_interests: string;
    hobbies: string;
    entertainment_preferences: string;
    content_consumption: string;
    learning_style: string;
  };
  'Economic & Financial Profile': {
    spending_patterns: string;
    income_level: string;
    investment_habits: string;
    financial_tools: string;
  };
  'Social & Relational Dynamics': {
    work_relationships: string;
    family_structure: string;
    friendship_circle: string;
    community_involvement: string;
    online_vs_offline_engagement: string;
  };
  'Daily & Lifestyle Patterns': {
    morning_routine: string;
    workday_habits: string;
    evening_and_leisure: string;
    weekend_activities: string;
    sleep_schedule: string;
  };
  'Health & Well-being': {
    physical_health: string;
    mental_health: string;
    work_life_balance: string;
    health_related_digital_behavior: string;
  };
  'Decision-Making & Behavioral Insights': {
    decision_making_style: string;
    brand_loyalty: string;
    influence_factors: string;
    tech_adoption: string;
    privacy_and_security_concerns: string;
  };
  'Other Unique Attributes & Contextual Information': {
    cultural_and_linguistic_background: string;
    travel_habits: string;
    personal_projects: string;
    unexpected_behavioral_traits: string;
  };
}

// Helper function to safely convert any field to string
function safeToString(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join(' ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// Helper function to safely convert any field to array
function safeToArray(value: any): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
  return [String(value)];
}

export function convertToStandardPersona(rawData: RawPersonaData, personaId: string): Persona {
  try {
    // Add comprehensive null checks
    if (!rawData) {
      throw new Error('Raw data is null or undefined');
    }

    const core = rawData['Core Identity'] || {};
    const psych = rawData['Psychographics & Personality'] || {};
    const digital = rawData['Digital Behavior & Online Habits'] || {};
    const interests = rawData['Interests & Preferences'] || {};
    const economic = rawData['Economic & Financial Profile'] || {};
    const decision = rawData['Decision-Making & Behavioral Insights'] || {};

    // Extract basic info with safe defaults
    const name = core.full_name || 'Unknown User';
    const age = core.age || 25;
    const occupation = core.occupation || 'Unknown';
    const personalityType = psych.mbti || 'Unknown';

    // Extract motivations safely
    const motivations = safeToArray(psych.motivations);

    // Extract traits safely
    const traits = [];
    if (psych.personality_traits && typeof psych.personality_traits === 'object') {
      const traitsObj = psych.personality_traits;
      if (traitsObj.conscientiousness === 'High') traits.push('detail-oriented');
      if (traitsObj.openness === 'High') traits.push('creative');
      if (traitsObj.extraversion === 'High') traits.push('extroverted');
      if (traitsObj.agreeableness === 'High') traits.push('collaborative');
      if (traitsObj.neuroticism === 'High') traits.push('anxious');
    }
    if (traits.length === 0) traits.push('balanced');

    // Extract pain points safely
    const painPoints = [];
    const deviceText = safeToString(digital.device_usage).toLowerCase();
    if (deviceText.includes('desktop')) painPoints.push('mobile-unfriendly');
    if (deviceText.includes('mobile')) painPoints.push('desktop-heavy');

    // Extract preferences safely
    const preferences = [];
    const sourcesText = safeToString(digital.preferred_content_sources).toLowerCase();
    if (sourcesText.includes('manufacturer') || sourcesText.includes('official')) preferences.push('official-sources');
    if (sourcesText.includes('review') || sourcesText.includes('user')) preferences.push('user-reviews');

    // Determine device preference
    const devicePreference = deviceText.includes('desktop') ? 'desktop' : 'mobile';

    // Determine content preference
    const contentPreference = sourcesText.includes('manufacturer') || sourcesText.includes('official') ? 'official-sources' : 'user-reviews';

    return {
      id: personaId,
      name,
      age,
      occupation,
      traits,
      motivations,
      painPoints,
      designImplications: preferences, // Map preferences to designImplications
      personalityType,
      digitalBehavior: {
        devicePreference,
        searchPattern: safeToString(digital.search_patterns),
        contentPreference
      }
    };
  } catch (error) {
    console.error(`Error converting persona ${personaId}:`, error);
    console.error('Raw data keys:', rawData ? Object.keys(rawData) : 'null');
    // Return a minimal valid persona instead of throwing
    return {
      id: personaId,
      name: 'Unknown User',
      age: 25,
      occupation: 'Unknown',
      traits: ['balanced'],
      motivations: ['general satisfaction'],
      painPoints: ['unknown'],
      designImplications: ['user-reviews'],
      personalityType: 'Unknown',
      digitalBehavior: {
        devicePreference: 'mobile',
        searchPattern: 'Unknown',
        contentPreference: 'user-reviews'
      }
    };
  }
}

