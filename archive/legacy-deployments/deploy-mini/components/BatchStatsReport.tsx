import React from 'react';
import { StatsReport } from '@/lib/stats-engine';

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

  return (
    <div className="stats-report-panel">
      <div className="report-header">
        <h3>📊 批量评估统计报告</h3>
        <div className="report-meta">
          <span className="meta-item">
            <span className="meta-label">评估用户:</span>
            <span className="meta-value">{stats.totalPersonas}人</span>
          </span>
          <span className="meta-item">
            <span className="meta-label">置信度:</span>
            <span className="meta-value">{stats.confidenceLevel}%</span>
          </span>
        </div>
      </div>

      <div className="report-content">
        {/* 总体评分 */}
        <div className="score-summary">
          <h4>总体评分</h4>
          <div className="score-grid">
            <div className="score-item">
              <div className="score-label">可用性</div>
              <div 
                className="score-value"
                style={{ color: getScoreColor(stats.averageScores.usability) }}
              >
                {formatScore(stats.averageScores.usability)}
              </div>
              <div className="score-grade">{getScoreLabel(stats.averageScores.usability)}</div>
            </div>
            <div className="score-item">
              <div className="score-label">可访问性</div>
              <div 
                className="score-value"
                style={{ color: getScoreColor(stats.averageScores.accessibility) }}
              >
                {formatScore(stats.averageScores.accessibility)}
              </div>
              <div className="score-grade">{getScoreLabel(stats.averageScores.accessibility)}</div>
            </div>
            <div className="score-item">
              <div className="score-label">视觉设计</div>
              <div 
                className="score-value"
                style={{ color: getScoreColor(stats.averageScores.visual) }}
              >
                {formatScore(stats.averageScores.visual)}
              </div>
              <div className="score-grade">{getScoreLabel(stats.averageScores.visual)}</div>
            </div>
            <div className="score-item overall">
              <div className="score-label">综合评分</div>
              <div 
                className="score-value"
                style={{ color: getScoreColor(stats.averageScores.overall) }}
              >
                {formatScore(stats.averageScores.overall)}
              </div>
              <div className="score-grade">{getScoreLabel(stats.averageScores.overall)}</div>
            </div>
          </div>
        </div>

        {/* 分数分布 */}
        <div className="score-distribution">
          <h4>分数分布</h4>
          <div className="distribution-chart">
            <div className="dist-item excellent">
              <div className="dist-bar">
                <div 
                  className="dist-fill"
                  style={{ 
                    width: `${(stats.scoreDistribution.excellent / stats.totalPersonas) * 100}%`,
                    background: '#10b981'
                  }}
                ></div>
              </div>
              <div className="dist-info">
                <span className="dist-label">优秀 (90-100)</span>
                <span className="dist-count">{stats.scoreDistribution.excellent}人</span>
              </div>
            </div>
            <div className="dist-item good">
              <div className="dist-bar">
                <div 
                  className="dist-fill"
                  style={{ 
                    width: `${(stats.scoreDistribution.good / stats.totalPersonas) * 100}%`,
                    background: '#3b82f6'
                  }}
                ></div>
              </div>
              <div className="dist-info">
                <span className="dist-label">良好 (70-89)</span>
                <span className="dist-count">{stats.scoreDistribution.good}人</span>
              </div>
            </div>
            <div className="dist-item fair">
              <div className="dist-bar">
                <div 
                  className="dist-fill"
                  style={{ 
                    width: `${(stats.scoreDistribution.fair / stats.totalPersonas) * 100}%`,
                    background: '#f59e0b'
                  }}
                ></div>
              </div>
              <div className="dist-info">
                <span className="dist-label">一般 (50-69)</span>
                <span className="dist-count">{stats.scoreDistribution.fair}人</span>
              </div>
            </div>
            <div className="dist-item poor">
              <div className="dist-bar">
                <div 
                  className="dist-fill"
                  style={{ 
                    width: `${(stats.scoreDistribution.poor / stats.totalPersonas) * 100}%`,
                    background: '#ef4444'
                  }}
                ></div>
              </div>
              <div className="dist-info">
                <span className="dist-label">较差 (0-49)</span>
                <span className="dist-count">{stats.scoreDistribution.poor}人</span>
              </div>
            </div>
          </div>
        </div>

        {/* 最常见问题 */}
        <div className="top-issues">
          <h4>最常见问题</h4>
          <div className="issues-list">
            {stats.topIssues.map((issue, index) => (
              <div key={index} className="issue-item">
                <div className="issue-header">
                  <span className="issue-rank">#{index + 1}</span>
                  <span className="issue-text">{issue.issue}</span>
                  <span className={`issue-severity ${issue.severity}`}>
                    {issue.severity === 'high' ? '高' : issue.severity === 'medium' ? '中' : '低'}
                  </span>
                </div>
                <div className="issue-stats">
                  <span className="issue-frequency">{issue.frequency}次提及</span>
                  <span className="issue-percentage">({issue.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 用户分群统计 */}
        <div className="user-segments">
          <h4>用户分群统计</h4>
          <div className="segments-grid">
            <div className="segment">
              <h5>年龄分布</h5>
              <div className="segment-content">
                {Object.entries(stats.personaSegments.ageGroups)
                  .sort(([,a], [,b]) => b - a)
                  .map(([age, count]) => (
                    <div key={age} className="segment-item">
                      <span className="segment-label">{age}</span>
                      <span className="segment-count">{count}人</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="segment">
              <h5>职业分布</h5>
              <div className="segment-content">
                {Object.entries(stats.personaSegments.occupations)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 8)
                  .map(([job, count]) => (
                    <div key={job} className="segment-item">
                      <span className="segment-label">{job}</span>
                      <span className="segment-count">{count}人</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="segment">
              <h5>性格类型</h5>
              <div className="segment-content">
                {Object.entries(stats.personaSegments.personalityTypes)
                  .sort(([,a], [,b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="segment-item">
                      <span className="segment-label">{type}</span>
                      <span className="segment-count">{count}人</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* 改进建议 */}
        <div className="recommendations">
          <h4>改进建议</h4>
          <div className="recommendations-list">
            {stats.recommendations.map((recommendation, index) => (
              <div key={index} className="recommendation-item">
                <span className="recommendation-number">{index + 1}</span>
                <span className="recommendation-text">{recommendation}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {onExport && (
        <div className="report-actions">
          <button className="btn-primary export-btn" onClick={onExport}>
            📥 导出报告
          </button>
        </div>
      )}

      <style jsx>{`
        .stats-report-panel {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
        }

        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .report-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }

        .report-meta {
          display: flex;
          gap: 16px;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .meta-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .meta-value {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .report-content {
          space-y: 24px;
        }

        .score-summary h4,
        .score-distribution h4,
        .top-issues h4,
        .user-segments h4,
        .recommendations h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .score-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .score-item {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }

        .score-item.overall {
          background: #eff6ff;
          border: 2px solid #3b82f6;
        }

        .score-label {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .score-value {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .score-grade {
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
        }

        .distribution-chart {
          space-y: 12px;
        }

        .dist-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dist-bar {
          width: 200px;
          height: 20px;
          background: #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
        }

        .dist-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.3s ease;
        }

        .dist-info {
          display: flex;
          flex-direction: column;
          min-width: 120px;
        }

        .dist-label {
          font-size: 14px;
          color: #374151;
          margin-bottom: 2px;
        }

        .dist-count {
          font-size: 12px;
          color: #6b7280;
        }

        .issues-list {
          space-y: 12px;
        }

        .issue-item {
          background: #f9fafb;
          border-radius: 8px;
          padding: 12px;
        }

        .issue-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .issue-rank {
          background: #3b82f6;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .issue-text {
          flex: 1;
          font-size: 14px;
          color: #374151;
        }

        .issue-severity {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .issue-severity.high {
          background: #fef2f2;
          color: #dc2626;
        }

        .issue-severity.medium {
          background: #fffbeb;
          color: #d97706;
        }

        .issue-severity.low {
          background: #f0f9ff;
          color: #0284c7;
        }

        .issue-stats {
          display: flex;
          gap: 8px;
          font-size: 12px;
          color: #6b7280;
        }

        .segments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .segment {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
        }

        .segment h5 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .segment-content {
          space-y: 8px;
        }

        .segment-item {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .segment-label {
          color: #6b7280;
        }

        .segment-count {
          color: #1f2937;
          font-weight: 500;
        }

        .recommendations-list {
          space-y: 12px;
        }

        .recommendation-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: #f0f9ff;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }

        .recommendation-number {
          background: #3b82f6;
          color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .recommendation-text {
          font-size: 14px;
          color: #374151;
          line-height: 1.4;
        }

        .report-actions {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }

        .export-btn {
          background: #10b981;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .export-btn:hover {
          background: #059669;
        }

        @media (max-width: 768px) {
          .report-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .score-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .dist-bar {
            width: 150px;
          }

          .segments-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}


