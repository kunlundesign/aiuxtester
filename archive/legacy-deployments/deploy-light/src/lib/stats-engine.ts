export interface Scores {
  usability: number;
  accessibility: number;
  visual: number;
  overall: number;
}

export interface Issue {
  stepHint: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface PersonaMetadata {
  age: number;
  occupation: string;
  personalityType: string;
}

export interface StatsReport {
  totalPersonas: number;
  averageScores: Scores;
  scoreDistribution: {
    excellent: number; // 90-100
    good: number;       // 70-89
    fair: number;       // 50-69
    poor: number;        // 0-49
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

export function generateStats(scores: Scores[], issues: Issue[], metadata: PersonaMetadata[]): StatsReport {
  const totalPersonas = scores.length;
  
  if (totalPersonas === 0) {
    return {
      totalPersonas: 0,
      averageScores: { usability: 0, accessibility: 0, visual: 0, overall: 0 },
      scoreDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
      topIssues: [],
      personaSegments: { ageGroups: {}, occupations: {}, personalityTypes: {} },
      confidenceLevel: 0,
      recommendations: []
    };
  }

  // 计算平均分数
  const averageScores = {
    usability: scores.reduce((sum, s) => sum + s.usability, 0) / totalPersonas,
    accessibility: scores.reduce((sum, s) => sum + s.accessibility, 0) / totalPersonas,
    visual: scores.reduce((sum, s) => sum + s.visual, 0) / totalPersonas,
    overall: scores.reduce((sum, s) => sum + s.overall, 0) / totalPersonas
  };

  // 计算分数分布
  const scoreDistribution = {
    excellent: scores.filter(s => s.overall >= 90).length,
    good: scores.filter(s => s.overall >= 70 && s.overall < 90).length,
    fair: scores.filter(s => s.overall >= 50 && s.overall < 70).length,
    poor: scores.filter(s => s.overall < 50).length
  };

  // 计算问题频率
  const issueFrequency: Record<string, { count: number; severity: 'low' | 'medium' | 'high' }> = {};
  issues.forEach(issue => {
    const key = issue.issue;
    if (issueFrequency[key]) {
      issueFrequency[key].count++;
      // 使用最高严重级别
      if (issue.severity === 'high' || 
          (issue.severity === 'medium' && issueFrequency[key].severity === 'low')) {
        issueFrequency[key].severity = issue.severity;
      }
    } else {
      issueFrequency[key] = {
        count: 1,
        severity: issue.severity
      };
    }
  });

  // 获取前10个最常见问题
  const topIssues = Object.entries(issueFrequency)
    .map(([issue, data]) => ({
      issue,
      frequency: data.count,
      severity: data.severity,
      percentage: parseFloat((data.count / totalPersonas * 100).toFixed(1))
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  // 用户分群统计
  const personaSegments = {
    ageGroups: groupByAge(metadata),
    occupations: groupByOccupation(metadata),
    personalityTypes: groupByPersonalityType(metadata)
  };

  // 计算置信度
  const confidenceLevel = calculateConfidenceLevel(totalPersonas, averageScores.overall);

  // 生成建议
  const recommendations = generateRecommendations(averageScores, scoreDistribution, topIssues);

  return {
    totalPersonas,
    averageScores,
    scoreDistribution,
    topIssues,
    personaSegments,
    confidenceLevel,
    recommendations
  };
}

function groupByAge(metadata: PersonaMetadata[]): Record<string, number> {
  const ageGroups: Record<string, number> = {};
  
  metadata.forEach(meta => {
    let ageGroup: string;
    if (meta.age < 25) {
      ageGroup = '18-24';
    } else if (meta.age < 35) {
      ageGroup = '25-34';
    } else if (meta.age < 45) {
      ageGroup = '35-44';
    } else if (meta.age < 55) {
      ageGroup = '45-54';
    } else if (meta.age < 65) {
      ageGroup = '55-64';
    } else {
      ageGroup = '65+';
    }
    
    ageGroups[ageGroup] = (ageGroups[ageGroup] || 0) + 1;
  });
  
  return ageGroups;
}

function groupByOccupation(metadata: PersonaMetadata[]): Record<string, number> {
  const occupations: Record<string, number> = {};
  
  metadata.forEach(meta => {
    const occupation = meta.occupation || 'Unknown';
    occupations[occupation] = (occupations[occupation] || 0) + 1;
  });
  
  return occupations;
}

function groupByPersonalityType(metadata: PersonaMetadata[]): Record<string, number> {
  const personalityTypes: Record<string, number> = {};
  
  metadata.forEach(meta => {
    const personalityType = meta.personalityType || 'Unknown';
    personalityTypes[personalityType] = (personalityTypes[personalityType] || 0) + 1;
  });
  
  return personalityTypes;
}

function calculateConfidenceLevel(sampleSize: number, averageScore: number): number {
  // 基于样本大小和分数一致性计算置信度
  let confidence = 0;
  
  // 样本大小影响 (0-40分)
  if (sampleSize >= 500) {
    confidence += 40;
  } else if (sampleSize >= 300) {
    confidence += 35;
  } else if (sampleSize >= 150) {
    confidence += 30;
  } else if (sampleSize >= 100) {
    confidence += 25;
  } else if (sampleSize >= 50) {
    confidence += 20;
  } else {
    confidence += 10;
  }
  
  // 分数水平影响 (0-30分)
  if (averageScore >= 80) {
    confidence += 30;
  } else if (averageScore >= 70) {
    confidence += 25;
  } else if (averageScore >= 60) {
    confidence += 20;
  } else if (averageScore >= 50) {
    confidence += 15;
  } else {
    confidence += 10;
  }
  
  // 样本多样性影响 (0-30分)
  // 这里简化处理，实际可以根据用户分群的多样性计算
  confidence += 20;
  
  return Math.min(confidence, 100);
}

function generateRecommendations(
  averageScores: Scores, 
  scoreDistribution: StatsReport['scoreDistribution'], 
  topIssues: StatsReport['topIssues']
): string[] {
  const recommendations = [];
  
  // 基于平均分数生成建议
  if (averageScores.usability < 70) {
    recommendations.push('优先改善用户体验设计，重点关注导航和交互流程');
  }
  
  if (averageScores.accessibility < 70) {
    recommendations.push('加强可访问性设计，确保所有用户都能轻松使用');
  }
  
  if (averageScores.visual < 70) {
    recommendations.push('优化视觉设计，提升界面美观度和品牌一致性');
  }
  
  // 基于分数分布生成建议
  if (scoreDistribution.poor > scoreDistribution.excellent) {
    recommendations.push('设计存在严重问题，建议进行全面重新设计');
  } else if (scoreDistribution.fair > scoreDistribution.good) {
    recommendations.push('设计需要显著改进，建议重点优化核心功能');
  }
  
  // 基于最常见问题生成建议
  if (topIssues.length > 0) {
    const topIssue = topIssues[0];
    if (topIssue.severity === 'high') {
      recommendations.push(`立即解决高频问题："${topIssue.issue}"`);
    } else if (topIssue.severity === 'medium') {
      recommendations.push(`优先处理中等问题："${topIssue.issue}"`);
    }
  }
  
  // 基于整体表现生成建议
  if (averageScores.overall >= 80) {
    recommendations.push('设计表现良好，建议保持现有优势并持续优化');
  } else if (averageScores.overall >= 60) {
    recommendations.push('设计有改进空间，建议针对低分项进行重点优化');
  } else {
    recommendations.push('设计需要重大改进，建议重新评估设计策略');
  }
  
  return recommendations.slice(0, 5); // 最多返回5个建议
}


