import React from 'react';

interface DetailedIssue {
  stepHint: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
  frequency: number;
  affectedPersonas: string[];
  personaTypes: string[];
}

interface DetailedStrength {
  category: string;
  strength: string;
  frequency: number;
  affectedPersonas: string[];
  impact: 'high' | 'medium' | 'low';
}

interface ActionableRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  solution: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  affectedUsers: number;
}

interface UXTheme {
  theme: string;
  description: string;
  positiveFindings: string[];
  negativeFindings: string[];
  recommendations: string[];
}

interface IntelligentReportData {
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
  actionableRecommendations: ActionableRecommendation[];
  uxThemes: UXTheme[];
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

interface IntelligentReportProps {
  report: IntelligentReportData;
}

export const IntelligentReport: React.FC<IntelligentReportProps> = ({ report }) => {
  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: 'critical' | 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getEffortIcon = (effort: 'low' | 'medium' | 'high') => {
    switch (effort) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div style={{ 
      padding: '24px', 
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      marginBottom: '24px'
    }}>
      {/* 标题 */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#1f2937',
          margin: '0 0 8px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🧠 智能分析报告
        </h2>
        <p style={{ 
          fontSize: '14px', 
          color: '#6b7280',
          margin: '0'
        }}>
          基于 {report.statistics.totalPersonas} 个用户角色的深度分析洞察
        </p>
      </div>

      {/* 关键洞察 */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: '#1f2937',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🎯 关键洞察
        </h3>

        {/* 主要优势 */}
        {report.keyInsights.primaryStrengths.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#059669',
              margin: '0 0 12px 0'
            }}>
              ✨ 主要优势
            </h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              {report.keyInsights.primaryStrengths.slice(0, 4).map((strength, index) => (
                <div key={index} style={{
                  padding: '12px',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #d1fae5',
                  borderRadius: '8px'
                }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#065f46',
                    marginBottom: '4px'
                  }}>
                    {strength.strength}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280'
                  }}>
                    {strength.frequency} 个用户提及 • {strength.category}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 关键问题 */}
        {report.keyInsights.criticalIssues.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#dc2626',
              margin: '0 0 12px 0'
            }}>
              ⚠️ 关键问题
            </h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              {report.keyInsights.criticalIssues.slice(0, 6).map((issue, index) => (
                <div key={index} style={{
                  padding: '12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '500',
                      color: '#991b1b',
                      flex: 1
                    }}>
                      {issue.issue}
                    </div>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'white',
                      backgroundColor: getSeverityColor(issue.severity),
                      marginLeft: '8px'
                    }}>
                      {issue.severity}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    💡 {issue.suggestion}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280'
                  }}>
                    {issue.frequency} 个用户提及 • {issue.stepHint}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 可操作建议 */}
      {report.actionableRecommendations.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: '#1f2937',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🚀 可操作建议
          </h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            {report.actionableRecommendations.slice(0, 8).map((rec, index) => (
              <div key={index} style={{
                padding: '16px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                borderLeft: `4px solid ${getPriorityColor(rec.priority)}`
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'white',
                      backgroundColor: getPriorityColor(rec.priority),
                      marginRight: '8px'
                    }}>
                      {rec.priority}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      backgroundColor: '#f1f5f9',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      {rec.category}
                    </span>
                  </div>
                  <span style={{ fontSize: '16px' }}>
                    {getEffortIcon(rec.effort)}
                  </span>
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  {rec.issue}
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: '#4b5563',
                  marginBottom: '8px'
                }}>
                  💡 {rec.solution}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6b7280',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{rec.impact}</span>
                  <span>工作量: {rec.effort}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UX主题分析 */}
      {report.uxThemes.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: '#1f2937',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🎨 UX主题分析
          </h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            {report.uxThemes.map((theme, index) => (
              <div key={index} style={{
                padding: '16px',
                backgroundColor: '#fafbfc',
                border: '1px solid #e1e5e9',
                borderRadius: '8px'
              }}>
                <h4 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0 0 8px 0'
                }}>
                  {theme.theme}
                </h4>
                <p style={{ 
                  fontSize: '13px', 
                  color: '#6b7280',
                  margin: '0 0 12px 0'
                }}>
                  {theme.description}
                </p>
                
                {theme.positiveFindings.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '500',
                      color: '#059669',
                      marginBottom: '6px'
                    }}>
                      ✅ 积极发现
                    </div>
                    <ul style={{ 
                      margin: '0', 
                      paddingLeft: '16px',
                      fontSize: '13px',
                      color: '#374151'
                    }}>
                      {theme.positiveFindings.slice(0, 3).map((finding, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{finding}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {theme.negativeFindings.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '500',
                      color: '#dc2626',
                      marginBottom: '6px'
                    }}>
                      ❌ 需要改进
                    </div>
                    <ul style={{ 
                      margin: '0', 
                      paddingLeft: '16px',
                      fontSize: '13px',
                      color: '#374151'
                    }}>
                      {theme.negativeFindings.slice(0, 3).map((finding, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{finding}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {theme.recommendations.length > 0 && (
                  <div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '500',
                      color: '#2563eb',
                      marginBottom: '6px'
                    }}>
                      💡 建议
                    </div>
                    <ul style={{ 
                      margin: '0', 
                      paddingLeft: '16px',
                      fontSize: '13px',
                      color: '#374151'
                    }}>
                      {theme.recommendations.slice(0, 3).map((rec, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 用户分群洞察 */}
      {report.keyInsights.userSegmentFindings.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: '#1f2937',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            👥 用户分群洞察
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {report.keyInsights.userSegmentFindings.map((segment, index) => (
              <div key={index} style={{
                padding: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#1f2937'
                  }}>
                    {segment.segment}
                  </div>
                  <div style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: segment.avgScore >= 80 ? '#059669' : segment.avgScore >= 60 ? '#d97706' : '#dc2626',
                    backgroundColor: segment.avgScore >= 80 ? '#ecfdf5' : segment.avgScore >= 60 ? '#fef3c7' : '#fef2f2'
                  }}>
                    平均分: {segment.avgScore}
                  </div>
                </div>
                
                {segment.uniqueIssues.length > 0 && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280',
                    marginBottom: '4px'
                  }}>
                    主要问题: {segment.uniqueIssues.slice(0, 2).join(', ')}
                  </div>
                )}
                
                {segment.preferences.length > 0 && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280'
                  }}>
                    偏好特征: {segment.preferences.slice(0, 2).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 统计摘要 */}
      <div style={{ 
        padding: '16px',
        backgroundColor: '#f1f5f9',
        borderRadius: '8px',
        border: '1px solid #cbd5e1'
      }}>
        <h4 style={{ 
          fontSize: '16px', 
          fontWeight: '600',
          color: '#1e293b',
          margin: '0 0 12px 0'
        }}>
          📊 统计摘要
        </h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          fontSize: '13px'
        }}>
          <div>
            <div style={{ color: '#6b7280' }}>样本大小</div>
            <div style={{ fontWeight: '600', color: '#1f2937' }}>
              {report.statistics.totalPersonas} 个用户
            </div>
          </div>
          <div>
            <div style={{ color: '#6b7280' }}>整体评分</div>
            <div style={{ fontWeight: '600', color: '#1f2937' }}>
              {report.statistics.averageScores.overall.toFixed(1)}/100
            </div>
          </div>
          <div>
            <div style={{ color: '#6b7280' }}>可用性</div>
            <div style={{ fontWeight: '600', color: '#1f2937' }}>
              {report.statistics.averageScores.usability.toFixed(1)}
            </div>
          </div>
          <div>
            <div style={{ color: '#6b7280' }}>可访问性</div>
            <div style={{ fontWeight: '600', color: '#1f2937' }}>
              {report.statistics.averageScores.accessibility.toFixed(1)}
            </div>
          </div>
          <div>
            <div style={{ color: '#6b7280' }}>视觉设计</div>
            <div style={{ fontWeight: '600', color: '#1f2937' }}>
              {report.statistics.averageScores.visual.toFixed(1)}
            </div>
          </div>
          <div>
            <div style={{ color: '#6b7280' }}>置信度</div>
            <div style={{ fontWeight: '600', color: '#1f2937' }}>
              {report.statistics.confidenceLevel}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


