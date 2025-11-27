import React from 'react';
import styles from './SideBySideResults.module.css';

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
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return '优秀';
  if (score >= 60) return '良好';
  return '需改进';
};

const getRiskClass = (risk: string) => {
  switch (risk) {
    case 'low': return styles.riskLow;
    case 'medium': return styles.riskMedium;
    case 'high': return styles.riskHigh;
    default: return '';
  }
};

export default function SideBySideResults({
  designA,
  designB,
  comparison
}: SideBySideResultsProps) {
  return (
    <div className={styles.sideBySideResults} data-component-name="SideBySideComparisonResults">
      <div className={styles.resultsHeader}>
        <h2>🎯 Side-by-Side Comparison Analysis</h2>
        <div className={styles.winnerBadge}>
          {comparison.winner === 'A' && '🏆 Design A Wins'}
          {comparison.winner === 'B' && '🏆 Design B Wins'}
          {comparison.winner === 'tie' && '🤝 Tie'}
        </div>
      </div>

      {/* Aggregated Results Summary */}
      <div style={{
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

      <div className={styles.comparisonGrid}>
        {/* Design A */}
        <div className={styles.designColumn}>
          <div className={styles.designHeader}>
            <h3>Design A</h3>
            <div className={styles.overallScore}>
              <span className={styles.scoreValue} style={{ color: getScoreColor(designA.scores?.overall || 0) }}>
                {designA.scores?.overall || 0}
              </span>
              <span className={styles.scoreLabel}>{getScoreLabel(designA.scores?.overall || 0)}</span>
            </div>
          </div>

          <div className={styles.scoreBreakdown}>
            <div className={styles.scoreItem}>
              <span className={styles.scoreCategory}>Usability</span>
              <span className={styles.scoreValue} style={{ color: getScoreColor(designA.scores?.usability || 0) }}>
                {designA.scores?.usability || 0}
              </span>
            </div>
            <div className={styles.scoreItem}>
              <span className={styles.scoreCategory}>Accessibility</span>
              <span className={styles.scoreValue} style={{ color: getScoreColor(designA.scores?.accessibility || 0) }}>
                {designA.scores?.accessibility || 0}
              </span>
            </div>
            <div className={styles.scoreItem}>
              <span className={styles.scoreCategory}>Visual Design</span>
              <span className={styles.scoreValue} style={{ color: getScoreColor(designA.scores?.visual || 0) }}>
                {designA.scores?.visual || 0}
              </span>
            </div>
          </div>

          <div className={styles.highlightsSection}>
            <h5>✨ Strengths</h5>
            <ul className={styles.highlightsList}>
              {(designA.highlights || []).map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          </div>

          <div className={styles.issuesSection}>
            <h5>⚠️ Issues ({(designA.issues || []).length})</h5>
            <div className={styles.issuesList}>
              {(designA.issues || []).slice(0, 3).map((issue, index) => (
                <div key={index} className={styles.issueItem}>
                  <div className={styles.issueSeverity}>{issue.severity}</div>
                  <div className={styles.issueText}>{issue.issue}</div>
                </div>
              ))}
            </div>
            {(designA.issues || []).length > 3 && (
              <div className={styles.moreIssues}>
                +{(designA.issues || []).length - 3} more issues...
              </div>
            )}
          </div>
        </div>

        {/* VS Divider */}
        <div className={styles.vsDivider}>
          <div className={styles.vsText}>VS</div>
          <div className={styles.confidenceBadge}>
            Confidence: {comparison.confidence}%
          </div>
        </div>

        {/* Design B */}
        <div className={styles.designColumn}>
          <div className={styles.designHeader}>
            <h3>Design B</h3>
            <div className={styles.overallScore}>
              <span className={styles.scoreValue} style={{ color: getScoreColor(designB.scores?.overall || 0) }}>
                {designB.scores?.overall || 0}
              </span>
              <span className={styles.scoreLabel}>{getScoreLabel(designB.scores?.overall || 0)}</span>
            </div>
          </div>

          <div className={styles.scoreBreakdown}>
            <div className={styles.scoreItem}>
              <span className={styles.scoreCategory}>Usability</span>
              <span className={styles.scoreValue} style={{ color: getScoreColor(designB.scores?.usability || 0) }}>
                {designB.scores?.usability || 0}
              </span>
            </div>
            <div className={styles.scoreItem}>
              <span className={styles.scoreCategory}>Accessibility</span>
              <span className={styles.scoreValue} style={{ color: getScoreColor(designB.scores?.accessibility || 0) }}>
                {designB.scores?.accessibility || 0}
              </span>
            </div>
            <div className={styles.scoreItem}>
              <span className={styles.scoreCategory}>Visual Design</span>
              <span className={styles.scoreValue} style={{ color: getScoreColor(designB.scores?.visual || 0) }}>
                {designB.scores?.visual || 0}
              </span>
            </div>
          </div>

          <div className={styles.highlightsSection}>
            <h5>✨ Strengths</h5>
            <ul className={styles.highlightsList}>
              {(designB.highlights || []).map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          </div>

          <div className={styles.issuesSection}>
            <h5>⚠️ Issues ({(designB.issues || []).length})</h5>
            <div className={styles.issuesList}>
              {(designB.issues || []).slice(0, 3).map((issue, index) => (
                <div key={index} className={styles.issueItem}>
                  <div className={styles.issueSeverity}>{issue.severity}</div>
                  <div className={styles.issueText}>{issue.issue}</div>
                </div>
              ))}
            </div>
            {(designB.issues || []).length > 3 && (
              <div className={styles.moreIssues}>
                +{(designB.issues || []).length - 3} more issues...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className={styles.analysisSummary}>
        <h3>📊 Analysis Summary</h3>
        
        <div className={styles.keyDifferences}>
          <h4>🔍 Key Differences</h4>
          <ul>
            {comparison.keyDifferences.map((diff, index) => (
              <li key={index}>{diff}</li>
            ))}
          </ul>
        </div>

        <div className={styles.recommendation}>
          <h4>💡 Recommendation</h4>
          <p>{comparison.recommendation}</p>
        </div>

        <div className={styles.abTestInfo}>
          <h4>🧪 A/B Testing Recommendations</h4>
          <div className={styles.testMetrics}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Risk Level:</span>
              <span className={`${styles.metricValue} ${getRiskClass(comparison.abTestRisk)}`}>
                {comparison.abTestRisk === 'low' ? 'Low' : comparison.abTestRisk === 'medium' ? 'Medium' : 'High'}
              </span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Confidence:</span>
              <span className={styles.metricValue}>{comparison.confidenceInWinner}%</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Suggested Sample Size:</span>
              <span className={styles.metricValue}>{comparison.suggestedSampleSize} users</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}