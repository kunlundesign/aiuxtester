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
  scores: {
    usability: number;
    accessibility: number;
    visual: number;
    overall: number;
  };
  highlights: string[];
  issues: Array<{
    stepHint: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
  }>;
}

export interface IntelligentReport {
  // 核心洞察
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
  
  // 具体建议
  actionableRecommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    solution: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
    affectedUsers: number;
  }>;
  
  // 用户体验主题
  uxThemes: Array<{
    theme: string;
    description: string;
    positiveFindings: string[];
    negativeFindings: string[];
    recommendations: string[];
  }>;
  
  // 统计数据
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

export class IntelligentAggregator {
  
  /**
   * 从原始数据生成智能聚合报告
   */
  generateIntelligentReport(personaResults: PersonaInsight[]): IntelligentReport {
    console.log('🧠 Starting intelligent aggregation for', personaResults.length, 'personas');
    
    const allIssues = this.extractAllIssues(personaResults);
    const allHighlights = this.extractAllHighlights(personaResults);
    
    // 分析关键洞察
    const keyInsights = this.analyzeKeyInsights(personaResults, allIssues, allHighlights);
    
    // 生成可操作建议
    const actionableRecommendations = this.generateActionableRecommendations(allIssues, personaResults);
    
    // 识别UX主题
    const uxThemes = this.identifyUXThemes(allIssues, allHighlights, personaResults);
    
    // 计算统计数据
    const statistics = this.calculateStatistics(personaResults);
    
    console.log('✅ Intelligent report generated with', keyInsights.primaryStrengths.length, 'strengths and', keyInsights.criticalIssues.length, 'issues');
    
    return {
      keyInsights,
      actionableRecommendations,
      uxThemes,
      statistics
    };
  }
  
  /**
   * 提取所有问题并进行智能分组
   */
  private extractAllIssues(personaResults: PersonaInsight[]): DetailedIssue[] {
    const issueMap = new Map<string, DetailedIssue>();
    
    personaResults.forEach(persona => {
      persona.issues.forEach(issue => {
        const key = this.normalizeIssueText(issue.issue);
        
        if (issueMap.has(key)) {
          const existing = issueMap.get(key)!;
          existing.frequency++;
          existing.affectedPersonas.push(persona.personaName);
          existing.personaTypes.push(persona.personalityType);
        } else {
          issueMap.set(key, {
            stepHint: issue.stepHint,
            issue: issue.issue,
            severity: issue.severity,
            suggestion: issue.suggestion,
            frequency: 1,
            affectedPersonas: [persona.personaName],
            personaTypes: [persona.personalityType]
          });
        }
      });
    });
    
    return Array.from(issueMap.values())
      .sort((a, b) => b.frequency - a.frequency);
  }
  
  /**
   * 提取所有亮点并进行智能分组
   */
  private extractAllHighlights(personaResults: PersonaInsight[]): DetailedStrength[] {
    const strengthMap = new Map<string, DetailedStrength>();
    
    personaResults.forEach(persona => {
      persona.highlights.forEach(highlight => {
        const category = this.categorizeHighlight(highlight);
        const key = this.normalizeHighlightText(highlight);
        
        if (strengthMap.has(key)) {
          const existing = strengthMap.get(key)!;
          existing.frequency++;
          existing.affectedPersonas.push(persona.personaName);
        } else {
          strengthMap.set(key, {
            category,
            strength: highlight,
            frequency: 1,
            affectedPersonas: [persona.personaName],
            impact: this.assessImpact(highlight, 1)
          });
        }
      });
    });
    
    return Array.from(strengthMap.values())
      .sort((a, b) => b.frequency - a.frequency);
  }
  
  /**
   * 分析关键洞察
   */
  private analyzeKeyInsights(
    personaResults: PersonaInsight[], 
    allIssues: DetailedIssue[], 
    allHighlights: DetailedStrength[]
  ) {
    // 识别主要优势（频率高且影响大）
    const primaryStrengths = allHighlights
      .filter(strength => strength.frequency >= Math.max(2, personaResults.length * 0.3))
      .slice(0, 5);
    
    // 识别关键问题（频率高或严重性高）
    const criticalIssues = allIssues
      .filter(issue => 
        issue.frequency >= Math.max(2, personaResults.length * 0.2) || 
        issue.severity === 'high'
      )
      .slice(0, 8);
    
    // 用户分群发现
    const userSegmentFindings = this.analyzeUserSegments(personaResults);
    
    return {
      primaryStrengths,
      criticalIssues,
      userSegmentFindings
    };
  }
  
  /**
   * 生成可操作的建议
   */
  private generateActionableRecommendations(
    allIssues: DetailedIssue[], 
    personaResults: PersonaInsight[]
  ) {
    const recommendations = [];
    
    // 基于高频问题生成建议
    const topIssues = allIssues.slice(0, 10);
    
    for (const issue of topIssues) {
      const priority = this.determinePriority(issue, personaResults.length);
      const category = issue.stepHint;
      const impact = this.calculateImpact(issue, personaResults.length);
      const effort = this.estimateEffort(issue);
      
      recommendations.push({
        priority,
        category,
        issue: issue.issue,
        solution: issue.suggestion,
        impact: `影响 ${issue.affectedPersonas.length} 个用户群体`,
        effort,
        affectedUsers: issue.frequency
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  /**
   * 识别UX主题
   */
  private identifyUXThemes(
    allIssues: DetailedIssue[], 
    allHighlights: DetailedStrength[], 
    personaResults: PersonaInsight[]
  ) {
    const themes = [];
    
    // 导航主题
    const navigationIssues = allIssues.filter(issue => 
      issue.stepHint.toLowerCase().includes('navigation') || 
      issue.issue.toLowerCase().includes('navigation')
    );
    const navigationHighlights = allHighlights.filter(strength => 
      strength.strength.toLowerCase().includes('navigation')
    );
    
    if (navigationIssues.length > 0 || navigationHighlights.length > 0) {
      themes.push({
        theme: "导航体验",
        description: "用户在界面导航过程中的体验反馈",
        positiveFindings: navigationHighlights.map(h => h.strength),
        negativeFindings: navigationIssues.map(i => i.issue),
        recommendations: navigationIssues.slice(0, 3).map(i => i.suggestion)
      });
    }
    
    // 可访问性主题
    const accessibilityIssues = allIssues.filter(issue => 
      issue.stepHint.toLowerCase().includes('accessibility') || 
      issue.issue.toLowerCase().includes('contrast') ||
      issue.issue.toLowerCase().includes('screen reader')
    );
    
    if (accessibilityIssues.length > 0) {
      themes.push({
        theme: "可访问性",
        description: "界面对不同能力用户的友好程度",
        positiveFindings: allHighlights.filter(h => 
          h.strength.toLowerCase().includes('accessibility') ||
          h.strength.toLowerCase().includes('contrast')
        ).map(h => h.strength),
        negativeFindings: accessibilityIssues.map(i => i.issue),
        recommendations: accessibilityIssues.slice(0, 3).map(i => i.suggestion)
      });
    }
    
    // 视觉设计主题
    const visualIssues = allIssues.filter(issue => 
      issue.stepHint.toLowerCase().includes('visual') || 
      issue.stepHint.toLowerCase().includes('design') ||
      issue.issue.toLowerCase().includes('color') ||
      issue.issue.toLowerCase().includes('layout')
    );
    
    if (visualIssues.length > 0) {
      themes.push({
        theme: "视觉设计",
        description: "界面的视觉呈现和美观度",
        positiveFindings: allHighlights.filter(h => 
          h.category === 'Visual Design'
        ).map(h => h.strength),
        negativeFindings: visualIssues.map(i => i.issue),
        recommendations: visualIssues.slice(0, 3).map(i => i.suggestion)
      });
    }
    
    return themes;
  }
  
  /**
   * 分析用户分群
   */
  private analyzeUserSegments(personaResults: PersonaInsight[]) {
    const segments = new Map<string, PersonaInsight[]>();
    
    // 按职业分群
    personaResults.forEach(persona => {
      const occupation = persona.occupation || 'Unknown';
      if (!segments.has(occupation)) {
        segments.set(occupation, []);
      }
      segments.get(occupation)!.push(persona);
    });
    
    const findings = [];
    
    for (const [segment, personas] of segments.entries()) {
      if (personas.length >= 2) { // 至少2个persona才形成有意义的分群
        const avgScore = personas.reduce((sum, p) => sum + p.scores.overall, 0) / personas.length;
        
        // 找出该分群特有的问题
        const segmentIssues = personas.flatMap(p => p.issues.map(i => i.issue));
        const uniqueIssues = [...new Set(segmentIssues)].slice(0, 3);
        
        // 找出该分群的偏好（从highlights推断）
        const segmentHighlights = personas.flatMap(p => p.highlights);
        const preferences = [...new Set(segmentHighlights)].slice(0, 3);
        
        findings.push({
          segment,
          avgScore: Math.round(avgScore),
          uniqueIssues,
          preferences
        });
      }
    }
    
    return findings;
  }
  
  /**
   * 计算统计数据
   */
  private calculateStatistics(personaResults: PersonaInsight[]) {
    const totalPersonas = personaResults.length;
    
    const averageScores = {
      usability: personaResults.reduce((sum, p) => sum + p.scores.usability, 0) / totalPersonas,
      accessibility: personaResults.reduce((sum, p) => sum + p.scores.accessibility, 0) / totalPersonas,
      visual: personaResults.reduce((sum, p) => sum + p.scores.visual, 0) / totalPersonas,
      overall: personaResults.reduce((sum, p) => sum + p.scores.overall, 0) / totalPersonas
    };
    
    // 基于样本大小和分数一致性计算置信度
    const confidenceLevel = Math.min(
      50 + Math.min(totalPersonas * 2, 40), // 样本大小影响
      100
    );
    
    return {
      totalPersonas,
      averageScores: {
        usability: Math.round(averageScores.usability * 10) / 10,
        accessibility: Math.round(averageScores.accessibility * 10) / 10,
        visual: Math.round(averageScores.visual * 10) / 10,
        overall: Math.round(averageScores.overall * 10) / 10
      },
      confidenceLevel
    };
  }
  
  // 辅助方法
  private normalizeIssueText(text: string): string {
    return text.toLowerCase()
      .replace(/design [ab]/gi, 'design')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  private normalizeHighlightText(text: string): string {
    return text.toLowerCase()
      .replace(/design [ab]/gi, 'design')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  private categorizeHighlight(highlight: string): string {
    const lower = highlight.toLowerCase();
    if (lower.includes('navigation') || lower.includes('menu')) return 'Navigation';
    if (lower.includes('visual') || lower.includes('color') || lower.includes('design')) return 'Visual Design';
    if (lower.includes('accessibility') || lower.includes('contrast')) return 'Accessibility';
    if (lower.includes('usability') || lower.includes('user')) return 'Usability';
    return 'General';
  }
  
  private assessImpact(highlight: string, frequency: number): 'high' | 'medium' | 'low' {
    if (frequency >= 5) return 'high';
    if (frequency >= 3) return 'medium';
    return 'low';
  }
  
  private determinePriority(issue: DetailedIssue, totalPersonas: number): 'critical' | 'high' | 'medium' | 'low' {
    const frequencyRatio = issue.frequency / totalPersonas;
    
    if (issue.severity === 'high' && frequencyRatio >= 0.3) return 'critical';
    if (issue.severity === 'high' || frequencyRatio >= 0.5) return 'high';
    if (issue.severity === 'medium' && frequencyRatio >= 0.3) return 'high';
    if (issue.severity === 'medium' || frequencyRatio >= 0.2) return 'medium';
    return 'low';
  }
  
  private calculateImpact(issue: DetailedIssue, totalPersonas: number): string {
    const percentage = Math.round((issue.frequency / totalPersonas) * 100);
    return `${percentage}% 的用户受到影响`;
  }
  
  private estimateEffort(issue: DetailedIssue): 'low' | 'medium' | 'high' {
    const suggestion = issue.suggestion.toLowerCase();
    
    if (suggestion.includes('redesign') || suggestion.includes('重新设计')) return 'high';
    if (suggestion.includes('add') || suggestion.includes('include') || suggestion.includes('增加')) return 'medium';
    if (suggestion.includes('adjust') || suggestion.includes('increase') || suggestion.includes('调整')) return 'low';
    
    return 'medium';
  }
}

// 导出单例
export const intelligentAggregator = new IntelligentAggregator();


