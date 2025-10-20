import { Issue } from './stats-engine';

export interface AggregatedIssue {
  issue: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
  affectedPersonas: number;
  impactScore: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'usability' | 'accessibility' | 'visual' | 'content' | 'navigation' | 'performance';
}

export interface ImprovementRecommendation {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  personas: string[];
  implementation: string[];
  metrics: string[];
}

export interface AggregatedInsights {
  totalIssues: number;
  criticalIssues: number;
  aggregatedIssues: AggregatedIssue[];
  recommendations: ImprovementRecommendation[];
  priorityMatrix: {
    quickWins: AggregatedIssue[];
    majorProjects: AggregatedIssue[];
    fillIns: AggregatedIssue[];
    thankless: AggregatedIssue[];
  };
  summary: {
    topCategories: Array<{ category: string; count: number; percentage: number }>;
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    improvementPotential: number;
  };
}

export function aggregateImprovements(issues: Issue[], totalPersonas: number): AggregatedInsights {
  // 按问题内容分组
  const issueGroups = groupIssuesByContent(issues);
  
  // 聚合相似问题
  const aggregatedIssues = aggregateSimilarIssues(issueGroups, totalPersonas);
  
  // 生成改进建议
  const recommendations = generateRecommendations(aggregatedIssues, totalPersonas);
  
  // 创建优先级矩阵
  const priorityMatrix = createPriorityMatrix(aggregatedIssues);
  
  // 生成摘要
  const summary = generateSummary(aggregatedIssues, totalPersonas);
  
  return {
    totalIssues: issues.length,
    criticalIssues: aggregatedIssues.filter(issue => issue.priority === 'critical').length,
    aggregatedIssues,
    recommendations,
    priorityMatrix,
    summary
  };
}

function groupIssuesByContent(issues: Issue[]): Map<string, Issue[]> {
  const groups = new Map<string, Issue[]>();
  
  issues.forEach(issue => {
    const key = normalizeIssueText(issue.issue);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(issue);
  });
  
  return groups;
}

function normalizeIssueText(text: string): string {
  // 标准化问题文本，去除具体细节，保留核心问题
  return text
    .toLowerCase()
    .replace(/\d+/g, 'X') // 替换数字
    .replace(/[^\w\s]/g, '') // 移除标点符号
    .replace(/\s+/g, ' ') // 标准化空格
    .trim();
}

function aggregateSimilarIssues(issueGroups: Map<string, Issue[]>, totalPersonas: number): AggregatedIssue[] {
  const aggregated: AggregatedIssue[] = [];
  
  issueGroups.forEach((issues, normalizedText) => {
    if (issues.length === 0) return;
    
    const firstIssue = issues[0];
    const frequency = issues.length;
    const severity = getHighestSeverity(issues.map(i => i.severity));
    const suggestions = [...new Set(issues.map(i => i.suggestion))];
    const category = categorizeIssue(firstIssue.issue);
    const impactScore = calculateImpactScore(frequency, severity, totalPersonas);
    const priority = calculatePriority(impactScore, frequency, severity);
    
    aggregated.push({
      issue: firstIssue.issue,
      frequency,
      severity,
      suggestions,
      affectedPersonas: frequency,
      impactScore,
      priority,
      category
    });
  });
  
  // 按影响分数排序
  return aggregated.sort((a, b) => b.impactScore - a.impactScore);
}

function getHighestSeverity(severities: string[]): 'low' | 'medium' | 'high' {
  if (severities.includes('high')) return 'high';
  if (severities.includes('medium')) return 'medium';
  return 'low';
}

function categorizeIssue(issueText: string): AggregatedIssue['category'] {
  const text = issueText.toLowerCase();
  
  if (text.includes('navigation') || text.includes('menu') || text.includes('button')) {
    return 'navigation';
  }
  if (text.includes('color') || text.includes('contrast') || text.includes('visual')) {
    return 'visual';
  }
  if (text.includes('accessibility') || text.includes('screen reader') || text.includes('keyboard')) {
    return 'accessibility';
  }
  if (text.includes('content') || text.includes('text') || text.includes('information')) {
    return 'content';
  }
  if (text.includes('performance') || text.includes('slow') || text.includes('loading')) {
    return 'performance';
  }
  
  return 'usability';
}

function calculateImpactScore(frequency: number, severity: string, totalPersonas: number): number {
  const frequencyScore = (frequency / totalPersonas) * 100;
  const severityMultiplier = severity === 'high' ? 3 : severity === 'medium' ? 2 : 1;
  
  return frequencyScore * severityMultiplier;
}

function calculatePriority(impactScore: number, frequency: number, severity: string): AggregatedIssue['priority'] {
  if (impactScore >= 30 || (severity === 'high' && frequency >= 10)) {
    return 'critical';
  }
  if (impactScore >= 15 || (severity === 'high' && frequency >= 5)) {
    return 'high';
  }
  if (impactScore >= 5 || (severity === 'medium' && frequency >= 5)) {
    return 'medium';
  }
  return 'low';
}

function generateRecommendations(aggregatedIssues: AggregatedIssue[], totalPersonas: number): ImprovementRecommendation[] {
  const recommendations: ImprovementRecommendation[] = [];
  
  // 按类别分组问题
  const issuesByCategory = new Map<string, AggregatedIssue[]>();
  aggregatedIssues.forEach(issue => {
    if (!issuesByCategory.has(issue.category)) {
      issuesByCategory.set(issue.category, []);
    }
    issuesByCategory.get(issue.category)!.push(issue);
  });
  
  // 为每个类别生成建议
  issuesByCategory.forEach((issues, category) => {
    const topIssues = issues.slice(0, 3); // 取前3个问题
    const totalFrequency = issues.reduce((sum, issue) => sum + issue.frequency, 0);
    
    if (topIssues.length > 0) {
      const recommendation = createRecommendation(category, topIssues, totalFrequency, totalPersonas);
      recommendations.push(recommendation);
    }
  });
  
  // 按优先级排序
  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

function createRecommendation(
  category: string, 
  issues: AggregatedIssue[], 
  totalFrequency: number, 
  totalPersonas: number
): ImprovementRecommendation {
  const categoryNames = {
    usability: '用户体验优化',
    accessibility: '可访问性改进',
    visual: '视觉设计提升',
    content: '内容策略优化',
    navigation: '导航结构改进',
    performance: '性能优化'
  };
  
  const title = categoryNames[category as keyof typeof categoryNames] || '设计改进';
  const description = generateCategoryDescription(category, issues, totalFrequency, totalPersonas);
  const priority = getHighestPriority(issues.map(i => i.priority));
  const impact = calculateOverallImpact(totalFrequency, totalPersonas);
  const effort = estimateEffort(issues);
  // Personas list kept as array (was joining into a single string causing type error)
  const personas = issues.map(i => `${i.affectedPersonas}人`);
  const implementation = generateImplementationSteps(category, issues);
  const metrics = generateSuccessMetrics(category);
  
  return {
    title,
    description,
    priority,
    category,
    impact,
    effort,
    personas,
    implementation,
    metrics
  };
}

function generateCategoryDescription(category: string, issues: AggregatedIssue[], totalFrequency: number, totalPersonas: number): string {
  const percentage = ((totalFrequency / totalPersonas) * 100).toFixed(1);
  const topIssue = issues[0];
  
  return `在${category}方面，${percentage}%的用户遇到了问题。最主要的问题是"${topIssue.issue}"，影响了${topIssue.affectedPersonas}个用户。建议优先解决这些问题以提升整体用户体验。`;
}

function getHighestPriority(priorities: string[]): ImprovementRecommendation['priority'] {
  if (priorities.includes('critical')) return 'critical';
  if (priorities.includes('high')) return 'high';
  if (priorities.includes('medium')) return 'medium';
  return 'low';
}

function calculateOverallImpact(totalFrequency: number, totalPersonas: number): ImprovementRecommendation['impact'] {
  const percentage = (totalFrequency / totalPersonas) * 100;
  if (percentage >= 30) return 'high';
  if (percentage >= 15) return 'medium';
  return 'low';
}

function estimateEffort(issues: AggregatedIssue[]): ImprovementRecommendation['effort'] {
  const hasComplexIssues = issues.some(issue => 
    issue.category === 'performance' || 
    issue.category === 'accessibility' ||
    issue.priority === 'critical'
  );
  
  if (hasComplexIssues) return 'high';
  if (issues.length >= 3) return 'medium';
  return 'low';
}

function generateImplementationSteps(category: string, issues: AggregatedIssue[]): string[] {
  const steps: string[] = [];
  
  switch (category) {
    case 'usability':
      steps.push('进行用户测试，识别具体的使用障碍');
      steps.push('优化用户流程，简化操作步骤');
      steps.push('改进界面布局，提升信息层次');
      break;
    case 'accessibility':
      steps.push('添加ARIA标签和语义化HTML');
      steps.push('确保键盘导航支持');
      steps.push('优化颜色对比度和字体大小');
      break;
    case 'visual':
      steps.push('建立统一的设计系统');
      steps.push('优化颜色搭配和视觉层次');
      steps.push('改进图标和视觉元素');
      break;
    case 'content':
      steps.push('优化文案表达，提升可读性');
      steps.push('改进信息架构');
      steps.push('增加用户引导和帮助信息');
      break;
    case 'navigation':
      steps.push('简化导航结构');
      steps.push('优化面包屑和页面标题');
      steps.push('改进搜索功能');
      break;
    case 'performance':
      steps.push('优化图片和资源加载');
      steps.push('实施代码分割和懒加载');
      steps.push('优化数据库查询和API响应');
      break;
  }
  
  return steps;
}

function generateSuccessMetrics(category: string): string[] {
  const metrics: string[] = [];
  
  switch (category) {
    case 'usability':
      metrics.push('任务完成率提升');
      metrics.push('用户操作时间减少');
      metrics.push('用户满意度评分提升');
      break;
    case 'accessibility':
      metrics.push('可访问性评分提升');
      metrics.push('辅助技术兼容性改善');
      metrics.push('键盘导航成功率提升');
      break;
    case 'visual':
      metrics.push('视觉吸引力评分提升');
      metrics.push('品牌一致性改善');
      metrics.push('用户停留时间增加');
      break;
    case 'content':
      metrics.push('内容理解度提升');
      metrics.push('用户参与度增加');
      metrics.push('转化率提升');
      break;
    case 'navigation':
      metrics.push('页面跳转成功率提升');
      metrics.push('用户迷失度降低');
      metrics.push('搜索使用率提升');
      break;
    case 'performance':
      metrics.push('页面加载时间减少');
      metrics.push('用户跳出率降低');
      metrics.push('系统稳定性提升');
      break;
  }
  
  return metrics;
}

function createPriorityMatrix(aggregatedIssues: AggregatedIssue[]): AggregatedInsights['priorityMatrix'] {
  const quickWins: AggregatedIssue[] = [];
  const majorProjects: AggregatedIssue[] = [];
  const fillIns: AggregatedIssue[] = [];
  const thankless: AggregatedIssue[] = [];
  
  aggregatedIssues.forEach(issue => {
    const impact = issue.impactScore;
    const effort = issue.category === 'performance' || issue.category === 'accessibility' ? 'high' : 'low';
    
    if (impact >= 20 && effort === 'low') {
      quickWins.push(issue);
    } else if (impact >= 20 && effort === 'high') {
      majorProjects.push(issue);
    } else if (impact < 20 && effort === 'low') {
      fillIns.push(issue);
    } else {
      thankless.push(issue);
    }
  });
  
  return { quickWins, majorProjects, fillIns, thankless };
}

function generateSummary(aggregatedIssues: AggregatedIssue[], totalPersonas: number): AggregatedInsights['summary'] {
  // 按类别统计
  const categoryCounts = new Map<string, number>();
  aggregatedIssues.forEach(issue => {
    categoryCounts.set(issue.category, (categoryCounts.get(issue.category) || 0) + issue.frequency);
  });
  
  const topCategories = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({
      category,
      count,
      percentage: parseFloat(((count / totalPersonas) * 100).toFixed(1))
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // 计算整体健康度
  const criticalIssues = aggregatedIssues.filter(issue => issue.priority === 'critical').length;
  const overallHealth = criticalIssues === 0 ? 'excellent' : 
                       criticalIssues <= 2 ? 'good' : 
                       criticalIssues <= 5 ? 'fair' : 'poor';
  
  // 计算改进潜力
  const totalImpact = aggregatedIssues.reduce((sum, issue) => sum + issue.impactScore, 0);
  const improvementPotential = Math.min(totalImpact / aggregatedIssues.length, 100);
  
  return {
    topCategories,
    overallHealth,
    improvementPotential: Math.round(improvementPotential)
  };
}


