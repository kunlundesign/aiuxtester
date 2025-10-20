import React from 'react';

interface SideBySideResultsProps {
  designA: {
    scores?: {
      overall?: number;
      usability?: number;
      accessibility?: number;
      visual?: number;
    };
    highlights?: string[];
    issues?: Array<{
      issue: string;
      severity: string;
      suggestion?: string;
    }>;
    narrative?: string;
  };
  designB: {
    scores?: {
      overall?: number;
      usability?: number;
      accessibility?: number;
      visual?: number;
    };
    highlights?: string[];
    issues?: Array<{
      issue: string;
      severity: string;
      suggestion?: string;
    }>;
    narrative?: string;
  };
  comparison: {
    winner: 'A' | 'B' | 'tie';
    confidence: number;
    keyDifferences: string[];
    recommendation: string;
    abTestRisk: 'low' | 'medium' | 'high';
    confidenceInWinner: number;
    suggestedSampleSize: number;
  };
}

const getScoreColor = (score: number) => {
  if (score >= 80) return '#10b981'; // green
  if (score >= 60) return '#f59e0b'; // yellow
  return '#ef4444'; // red
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return '优秀';
  if (score >= 60) return '良好';
  return '需改进';
};

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#10b981';
    default: return '#6b7280';
  }
};

const getSeverityLabel = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'high': return '高';
    case 'medium': return '中';
    case 'low': return '低';
    default: return '未知';
  }
};

export default function SideBySideResults({
  designA,
  designB,
  comparison
}: SideBySideResultsProps) {
  return (
    <div className="side-by-side-results" data-component-name="SideBySideComparisonResults">
      <div className="results-header">
        <h2>🎯 Side-by-Side Comparison Analysis</h2>
        <div className="winner-badge">
          {comparison.winner === 'A' && '🏆 Design A Wins'}
          {comparison.winner === 'B' && '🏆 Design B Wins'}
          {comparison.winner === 'tie' && '🤝 Tie'}
        </div>
      </div>

      {/* Aggregated Results Summary */}
      <div className="aggregated-summary" style={{
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '16px' }}>
          📊 Aggregated Analysis Overview
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
          <div>
            <strong>Design A:</strong> {designA.narrative || 'Average Performance'}
            <br />
            <span style={{ color: '#64748b' }}>
              Overall: {(designA.scores?.overall || 0).toFixed(1)}/100 | 
              Issues: {(designA.issues || []).length} | 
              Strengths: {(designA.highlights || []).length}
            </span>
          </div>
          <div>
            <strong>Design B:</strong> {designB.narrative || 'Average Performance'}
            <br />
            <span style={{ color: '#64748b' }}>
              Overall: {(designB.scores?.overall || 0).toFixed(1)}/100 | 
              Issues: {(designB.issues || []).length} | 
              Strengths: {(designB.highlights || []).length}
            </span>
          </div>
        </div>
      </div>

      <div className="comparison-grid">
        {/* Design A */}
        <div className="design-column">
          <div className="design-header">
            <h3>Design A</h3>
            <div className="overall-score">
              <span className="score-value" style={{ color: getScoreColor(designA.scores?.overall || 0) }}>
                {designA.scores?.overall || 0}
              </span>
              <span className="score-label">{getScoreLabel(designA.scores?.overall || 0)}</span>
            </div>
          </div>

          <div className="score-breakdown">
            <div className="score-item">
              <span className="score-category">Usability</span>
              <span className="score-value" style={{ color: getScoreColor(designA.scores?.usability || 0) }}>
                {designA.scores?.usability || 0}
              </span>
            </div>
            <div className="score-item">
              <span className="score-category">Accessibility</span>
              <span className="score-value" style={{ color: getScoreColor(designA.scores?.accessibility || 0) }}>
                {designA.scores?.accessibility || 0}
              </span>
            </div>
            <div className="score-item">
              <span className="score-category">Visual Design</span>
              <span className="score-value" style={{ color: getScoreColor(designA.scores?.visual || 0) }}>
                {designA.scores?.visual || 0}
              </span>
            </div>
          </div>

          <div className="highlights-section">
            <h5>✨ Strengths</h5>
            <ul className="highlights-list">
              {(designA.highlights || []).map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          </div>

          <div className="issues-section">
            <h5>⚠️ Issues ({(designA.issues || []).length})</h5>
            <div className="issues-list">
              {(designA.issues || []).slice(0, 3).map((issue, index) => (
                <div key={index} className="issue-item">
                  <div className="issue-severity">{issue.severity}</div>
                  <div className="issue-text">{issue.issue}</div>
                </div>
              ))}
            </div>
            {(designA.issues || []).length > 3 && (
              <div className="more-issues">
                +{(designA.issues || []).length - 3} more issues...
              </div>
            )}
          </div>
        </div>

        {/* VS Divider */}
        <div className="vs-divider">
          <div className="vs-text">VS</div>
          <div className="confidence-badge">
            Confidence: {comparison.confidence}%
          </div>
        </div>

        {/* Design B */}
        <div className="design-column">
          <div className="design-header">
            <h3>Design B</h3>
            <div className="overall-score">
              <span className="score-value" style={{ color: getScoreColor(designB.scores?.overall || 0) }}>
                {designB.scores?.overall || 0}
              </span>
              <span className="score-label">{getScoreLabel(designB.scores?.overall || 0)}</span>
            </div>
          </div>

          <div className="score-breakdown">
            <div className="score-item">
              <span className="score-category">Usability</span>
              <span className="score-value" style={{ color: getScoreColor(designB.scores?.usability || 0) }}>
                {designB.scores?.usability || 0}
              </span>
            </div>
            <div className="score-item">
              <span className="score-category">Accessibility</span>
              <span className="score-value" style={{ color: getScoreColor(designB.scores?.accessibility || 0) }}>
                {designB.scores?.accessibility || 0}
              </span>
            </div>
            <div className="score-item">
              <span className="score-category">Visual Design</span>
              <span className="score-value" style={{ color: getScoreColor(designB.scores?.visual || 0) }}>
                {designB.scores?.visual || 0}
              </span>
            </div>
          </div>

          <div className="highlights-section">
            <h5>✨ Strengths</h5>
            <ul className="highlights-list">
              {(designB.highlights || []).map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          </div>

          <div className="issues-section">
            <h5>⚠️ Issues ({(designB.issues || []).length})</h5>
            <div className="issues-list">
              {(designB.issues || []).slice(0, 3).map((issue, index) => (
                <div key={index} className="issue-item">
                  <div className="issue-severity">{issue.severity}</div>
                  <div className="issue-text">{issue.issue}</div>
                </div>
              ))}
            </div>
            {(designB.issues || []).length > 3 && (
              <div className="more-issues">
                +{(designB.issues || []).length - 3} more issues...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="analysis-summary">
        <h3>📊 Analysis Summary</h3>
        
        <div className="key-differences">
          <h4>🔍 Key Differences</h4>
          <ul>
            {comparison.keyDifferences.map((diff, index) => (
              <li key={index}>{diff}</li>
            ))}
          </ul>
        </div>

        <div className="recommendation">
          <h4>💡 Recommendation</h4>
          <p>{comparison.recommendation}</p>
        </div>

        <div className="ab-test-info">
          <h4>🧪 A/B Testing Recommendations</h4>
          <div className="test-metrics">
            <div className="metric">
              <span className="metric-label">Risk Level:</span>
              <span className={`metric-value risk-${comparison.abTestRisk}`}>
                {comparison.abTestRisk === 'low' ? 'Low' : comparison.abTestRisk === 'medium' ? 'Medium' : 'High'}
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Confidence:</span>
              <span className="metric-value">{comparison.confidenceInWinner}%</span>
            </div>
            <div className="metric">
              <span className="metric-label">Suggested Sample Size:</span>
              <span className="metric-value">{comparison.suggestedSampleSize} users</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .side-by-side-results {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .results-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .results-header h2 {
          margin: 0 0 16px 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 700;
        }

        .winner-badge {
          display: inline-block;
          padding: 8px 16px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border-radius: 20px;
          font-weight: 600;
          font-size: 16px;
        }

        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 32px;
          margin-bottom: 32px;
        }

        .design-column {
          background: #f9fafb;
          border-radius: 12px;
          padding: 24px;
          border: 2px solid #e5e7eb;
        }

        .design-header {
          text-align: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
        }

        .design-header h3 {
          margin: 0 0 12px 0;
          color: #1f2937;
          font-size: 24px;
          font-weight: 600;
        }

        .overall-score {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .score-value {
          font-size: 32px;
          font-weight: 700;
        }

        .score-label {
          font-size: 16px;
          color: #6b7280;
          font-weight: 500;
        }

        .score-breakdown {
          margin-bottom: 24px;
        }

        .score-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .score-item:last-child {
          border-bottom: none;
        }

        .score-category {
          color: #6b7280;
          font-weight: 500;
        }

        .highlights-section, .issues-section {
          margin-bottom: 20px;
        }

        .highlights-section h5, .issues-section h5 {
          margin: 0 0 12px 0;
          color: #1f2937;
          font-size: 16px;
          font-weight: 600;
        }

        .highlights-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .highlights-list li {
          padding: 8px 0;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }

        .highlights-list li:last-child {
          border-bottom: none;
        }

        .issues-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .issue-item {
          background: white;
          padding: 12px;
          border-radius: 8px;
          border-left: 4px solid #e5e7eb;
        }

        .issue-severity {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 4px;
          color: #6b7280;
        }

        .issue-text {
          color: #374151;
          font-size: 14px;
          line-height: 1.4;
        }

        .more-issues {
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          font-style: italic;
          margin-top: 8px;
        }

        .vs-divider {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        .vs-text {
          font-size: 24px;
          font-weight: 700;
          color: #6b7280;
          background: #f3f4f6;
          padding: 16px;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .confidence-badge {
          background: #3b82f6;
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }

        .analysis-summary {
          background: #f8fafc;
          border-radius: 12px;
          padding: 24px;
          border: 1px solid #e2e8f0;
        }

        .analysis-summary h3 {
          margin: 0 0 20px 0;
          color: #1f2937;
          font-size: 20px;
          font-weight: 600;
        }

        .key-differences, .recommendation, .ab-test-info {
          margin-bottom: 20px;
        }

        .key-differences:last-child, .recommendation:last-child, .ab-test-info:last-child {
          margin-bottom: 0;
        }

        .key-differences h4, .recommendation h4, .ab-test-info h4 {
          margin: 0 0 12px 0;
          color: #374151;
          font-size: 16px;
          font-weight: 600;
        }

        .key-differences ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .key-differences li {
          padding: 6px 0;
          color: #4b5563;
          border-bottom: 1px solid #e5e7eb;
        }

        .key-differences li:last-child {
          border-bottom: none;
        }

        .recommendation p {
          margin: 0;
          color: #4b5563;
          line-height: 1.6;
        }

        .test-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .metric-label {
          color: #6b7280;
          font-weight: 500;
        }

        .metric-value {
          font-weight: 600;
          color: #1f2937;
        }

        .risk-low {
          color: #10b981;
        }

        .risk-medium {
          color: #f59e0b;
        }

        .risk-high {
          color: #ef4444;
        }

        @media (max-width: 768px) {
          .comparison-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .vs-divider {
            order: -1;
            flex-direction: row;
            gap: 20px;
          }

          .test-metrics {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}