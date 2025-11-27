import React from 'react';
import { StatsReport } from '@/lib/stats-engine';
import styles from './BatchStatsReport.module.css';

interface BatchStatsReportProps {
  stats: StatsReport;
  onExport?: () => void;
}

export default function BatchStatsReport({ stats, onExport }: BatchStatsReportProps) {
  const formatScore = (score: number) => score.toFixed(1);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '中等';
    if (score >= 60) return '及格';
    return '较差';
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'high': return styles.issueSeverityHigh;
      case 'medium': return styles.issueSeverityMedium;
      case 'low': return styles.issueSeverityLow;
      default: return '';
    }
  };

  return (
    <div className={styles.statsReportPanel}>
      <div className={styles.reportHeader}>
        <h3>📊 批量评估统计报告</h3>
        <div className={styles.reportMeta}>
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>评估用户:</span>
            <span className={styles.metaValue}>{stats.totalPersonas}人</span>
          </span>
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>置信度:</span>
            <span className={styles.metaValue}>{stats.confidenceLevel}%</span>
          </span>
        </div>
      </div>

      <div className={styles.reportContent}>
        {/* 总体评分 */}
        <div className={styles.scoreSummary}>
          <h4>总体评分</h4>
          <div className={styles.scoreGrid}>
            <div className={styles.scoreItem}>
              <div className={styles.scoreLabel}>可用性</div>
              <div 
                className={styles.scoreValue}
                style={{ color: getScoreColor(stats.averageScores.usability) }}
              >
                {formatScore(stats.averageScores.usability)}
              </div>
              <div className={styles.scoreGrade}>{getScoreLabel(stats.averageScores.usability)}</div>
            </div>
            <div className={styles.scoreItem}>
              <div className={styles.scoreLabel}>可访问性</div>
              <div 
                className={styles.scoreValue}
                style={{ color: getScoreColor(stats.averageScores.accessibility) }}
              >
                {formatScore(stats.averageScores.accessibility)}
              </div>
              <div className={styles.scoreGrade}>{getScoreLabel(stats.averageScores.accessibility)}</div>
            </div>
            <div className={styles.scoreItem}>
              <div className={styles.scoreLabel}>视觉设计</div>
              <div 
                className={styles.scoreValue}
                style={{ color: getScoreColor(stats.averageScores.visual) }}
              >
                {formatScore(stats.averageScores.visual)}
              </div>
              <div className={styles.scoreGrade}>{getScoreLabel(stats.averageScores.visual)}</div>
            </div>
            <div className={`${styles.scoreItem} ${styles.scoreItemOverall}`}>
              <div className={styles.scoreLabel}>综合评分</div>
              <div 
                className={styles.scoreValue}
                style={{ color: getScoreColor(stats.averageScores.overall) }}
              >
                {formatScore(stats.averageScores.overall)}
              </div>
              <div className={styles.scoreGrade}>{getScoreLabel(stats.averageScores.overall)}</div>
            </div>
          </div>
        </div>

        {/* 分数分布 */}
        <div className={styles.scoreDistribution}>
          <h4>分数分布</h4>
          <div className={styles.distributionChart}>
            <div className={styles.distItem}>
              <div className={styles.distBar}>
                <div 
                  className={styles.distFill}
                  style={{ 
                    width: `${(stats.scoreDistribution.excellent / stats.totalPersonas) * 100}%`,
                    background: '#10b981'
                  }}
                ></div>
              </div>
              <div className={styles.distInfo}>
                <span className={styles.distLabel}>优秀 (90-100)</span>
                <span className={styles.distCount}>{stats.scoreDistribution.excellent}人</span>
              </div>
            </div>
            <div className={styles.distItem}>
              <div className={styles.distBar}>
                <div 
                  className={styles.distFill}
                  style={{ 
                    width: `${(stats.scoreDistribution.good / stats.totalPersonas) * 100}%`,
                    background: '#3b82f6'
                  }}
                ></div>
              </div>
              <div className={styles.distInfo}>
                <span className={styles.distLabel}>良好 (70-89)</span>
                <span className={styles.distCount}>{stats.scoreDistribution.good}人</span>
              </div>
            </div>
            <div className={styles.distItem}>
              <div className={styles.distBar}>
                <div 
                  className={styles.distFill}
                  style={{ 
                    width: `${(stats.scoreDistribution.fair / stats.totalPersonas) * 100}%`,
                    background: '#f59e0b'
                  }}
                ></div>
              </div>
              <div className={styles.distInfo}>
                <span className={styles.distLabel}>一般 (50-69)</span>
                <span className={styles.distCount}>{stats.scoreDistribution.fair}人</span>
              </div>
            </div>
            <div className={styles.distItem}>
              <div className={styles.distBar}>
                <div 
                  className={styles.distFill}
                  style={{ 
                    width: `${(stats.scoreDistribution.poor / stats.totalPersonas) * 100}%`,
                    background: '#ef4444'
                  }}
                ></div>
              </div>
              <div className={styles.distInfo}>
                <span className={styles.distLabel}>较差 (0-49)</span>
                <span className={styles.distCount}>{stats.scoreDistribution.poor}人</span>
              </div>
            </div>
          </div>
        </div>

        {/* 最常见问题 */}
        <div className={styles.topIssues}>
          <h4>最常见问题</h4>
          <div className={styles.issuesList}>
            {stats.topIssues.map((issue, index) => (
              <div key={index} className={styles.issueItem}>
                <div className={styles.issueHeader}>
                  <span className={styles.issueRank}>#{index + 1}</span>
                  <span className={styles.issueText}>{issue.issue}</span>
                  <span className={`${styles.issueSeverity} ${getSeverityClass(issue.severity)}`}>
                    {issue.severity === 'high' ? '高' : issue.severity === 'medium' ? '中' : '低'}
                  </span>
                </div>
                <div className={styles.issueStats}>
                  <span className={styles.issueFrequency}>{issue.frequency}次提及</span>
                  <span className={styles.issuePercentage}>({issue.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 用户分群统计 */}
        <div className={styles.userSegments}>
          <h4>用户分群统计</h4>
          <div className={styles.segmentsGrid}>
            <div className={styles.segment}>
              <h5>年龄分布</h5>
              <div className={styles.segmentContent}>
                {Object.entries(stats.personaSegments.ageGroups)
                  .sort(([,a], [,b]) => b - a)
                  .map(([age, count]) => (
                    <div key={age} className={styles.segmentItem}>
                      <span className={styles.segmentLabel}>{age}</span>
                      <span className={styles.segmentCount}>{count}人</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className={styles.segment}>
              <h5>职业分布</h5>
              <div className={styles.segmentContent}>
                {Object.entries(stats.personaSegments.occupations)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 8)
                  .map(([job, count]) => (
                    <div key={job} className={styles.segmentItem}>
                      <span className={styles.segmentLabel}>{job}</span>
                      <span className={styles.segmentCount}>{count}人</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className={styles.segment}>
              <h5>性格类型</h5>
              <div className={styles.segmentContent}>
                {Object.entries(stats.personaSegments.personalityTypes)
                  .sort(([,a], [,b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className={styles.segmentItem}>
                      <span className={styles.segmentLabel}>{type}</span>
                      <span className={styles.segmentCount}>{count}人</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* 改进建议 */}
        <div className={styles.recommendations}>
          <h4>改进建议</h4>
          <div className={styles.recommendationsList}>
            {stats.recommendations.map((recommendation, index) => (
              <div key={index} className={styles.recommendationItem}>
                <span className={styles.recommendationNumber}>{index + 1}</span>
                <span className={styles.recommendationText}>{recommendation}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {onExport && (
        <div className={styles.reportActions}>
          <button className={styles.exportBtn} onClick={onExport}>
            📥 导出报告
          </button>
        </div>
      )}
    </div>
  );
}


