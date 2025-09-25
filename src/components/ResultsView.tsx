'use client';

import React, { useState } from 'react';
import { UploadedImage, EvalResult, Persona, Issue, ImageEval } from '@/types';

// 使用与主页面相同的设计系统
const designSystem = {
  colors: {
    primary: '#8B7355',
    secondary: '#B5A99A',
    accent: '#D4C4B0',
    background: {
      primary: '#EFEAE7',
      secondary: '#F5F1EE',
      card: 'rgba(255, 255, 255, 0.7)',
    },
    text: {
      primary: '#2D2A26',
      secondary: '#5A5550',
      light: '#8B8680',
    },
    score: {
      excellent: '#10b981',
      good: '#3b82f6',
      fair: '#f59e0b',
      poor: '#ef4444',
      critical: '#dc2626',
    },
    severity: {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#10b981',
    },
    brand: '#0078d4',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    xl: '16px',
  },
  shadows: {
    subtle: '0 2px 8px rgba(45, 42, 38, 0.05)',
    card: '0 8px 32px rgba(45, 42, 38, 0.1)',
    cardHover: '0 12px 40px rgba(45, 42, 38, 0.15)',
  },
};

// 样式对象
const styles = {
  container: {
    display: 'flex',
    gap: designSystem.spacing.xl,
    minHeight: '600px',
  },
  sidebar: {
    width: '200px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: designSystem.spacing.lg,
  },
  thumbnailRail: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: designSystem.spacing.sm,
  },
  thumbnail: {
    position: 'relative' as const,
    cursor: 'pointer',
    borderRadius: designSystem.borderRadius.medium,
    overflow: 'hidden',
    aspectRatio: '16/9',
    transition: 'all 0.2s ease-in-out',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    backgroundColor: designSystem.colors.background.card,
    backdropFilter: 'blur(10px)',
  },
  thumbnailHover: {
    transform: 'scale(1.02)',
    boxShadow: designSystem.shadows.cardHover,
  },
  thumbnailActive: {
    outline: `2px solid ${designSystem.colors.brand}`,
    transform: 'scale(1.02)',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  thumbnailOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
    color: 'white',
    padding: designSystem.spacing.xs,
    fontSize: '12px',
    textAlign: 'center' as const,
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: designSystem.spacing.lg,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designSystem.spacing.lg,
  },
  sectionCard: {
    padding: designSystem.spacing.xl,
    marginBottom: designSystem.spacing.lg,
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: designSystem.borderRadius.medium,
    backgroundColor: designSystem.colors.background.card,
    boxShadow: designSystem.shadows.subtle,
    backdropFilter: 'blur(10px)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: designSystem.colors.text.primary,
    marginBottom: designSystem.spacing.lg,
    display: 'block',
  },
  scoresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: designSystem.spacing.lg,
    marginBottom: designSystem.spacing.lg,
  },
  scoreItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: designSystem.spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: designSystem.borderRadius.medium,
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  scoreLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: designSystem.colors.text.secondary,
    textTransform: 'uppercase' as const,
    marginBottom: designSystem.spacing.xs,
  },
  scoreValue: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: designSystem.spacing.xs,
  },
  scoreDescription: {
    fontSize: '12px',
    color: designSystem.colors.text.light,
    marginTop: designSystem.spacing.sm,
    textAlign: 'center' as const,
  },
  overallScore: {
    marginTop: designSystem.spacing.xl,
    padding: designSystem.spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: designSystem.borderRadius.medium,
    textAlign: 'center' as const,
  },
  issuesTable: {
    width: '100%',
    marginTop: designSystem.spacing.lg,
    borderCollapse: 'collapse' as const,
  },
  tableHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
  },
  tableHeaderCell: {
    padding: designSystem.spacing.md,
    textAlign: 'left' as const,
    fontWeight: '600',
    fontSize: '14px',
    color: designSystem.colors.text.primary,
  },
  tableRow: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  },
  tableCell: {
    padding: designSystem.spacing.md,
    fontSize: '14px',
    color: designSystem.colors.text.primary,
  },
  severityBadge: {
    minWidth: '60px',
    padding: '4px 8px',
    borderRadius: designSystem.borderRadius.small,
    fontSize: '12px',
    fontWeight: '600',
    textAlign: 'center' as const,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: designSystem.spacing.sm,
  },
  toolbarDivider: {
    width: '1px',
    height: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  button: {
    padding: '8px 16px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: designSystem.borderRadius.small,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    color: designSystem.colors.text.primary,
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: designSystem.spacing.xs,
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
  },
  buttonPrimary: {
    backgroundColor: designSystem.colors.brand,
    color: 'white',
    border: `1px solid ${designSystem.colors.brand}`,
  },
  buttonHover: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    transform: 'translateY(-1px)',
    boxShadow: designSystem.shadows.subtle,
  },
  winnerBadge: {
    marginTop: designSystem.spacing.sm,
    padding: '8px 12px',
    borderRadius: designSystem.borderRadius.small,
    border: '1px solid rgba(255, 255, 255, 0.3)',
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: '600',
  },
  winnerActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: designSystem.colors.success,
  },
  winnerInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    color: designSystem.colors.text.secondary,
  },
  fullscreenOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  fullscreenImage: {
    maxWidth: '90%',
    maxHeight: '90%',
    objectFit: 'contain' as const,
  },
  closeButton: {
    position: 'absolute' as const,
    top: '20px',
    right: '20px',
    padding: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
  },
};

// 获取分数颜色的辅助函数
const getScoreColor = (score: number) => {
  if (score >= 90) return designSystem.colors.score.excellent;
  if (score >= 80) return designSystem.colors.score.good;
  if (score >= 70) return designSystem.colors.score.fair;
  if (score >= 60) return designSystem.colors.score.poor;
  return designSystem.colors.score.critical;
};

// 获取严重程度颜色的辅助函数
const getSeverityColor = (severity: string) => {
  const level = severity.toLowerCase();
  return designSystem.colors.severity[level as keyof typeof designSystem.colors.severity] || designSystem.colors.secondary;
};

interface ResultsViewProps {
  results: EvalResult;
  persona: Persona;
  images: UploadedImage[];
  onRerun: () => void;
  analysisType?: 'single' | 'flow' | 'side-by-side';
}

export default function ResultsView({ results, persona, images, onRerun, analysisType }: ResultsViewProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredThumbnail, setHoveredThumbnail] = useState<number | null>(null);

  const activeResult = results.items[activeImageIndex];
  
  // 计算winner
  const winnerIndex = results.items.reduce((winnerIdx, item, idx) => 
    item.scores.overall > results.items[winnerIdx].scores.overall ? idx : winnerIdx, 0
  );

  const exportToMarkdown = () => {
    const markdown = `# UX Evaluation Results

**Persona:** ${persona.name}
**Model:** ${results.model}
**Image:** ${activeImageIndex + 1} of ${images.length}

## Scores
- **Usability:** ${activeResult.scores.usability}/100
- **Accessibility:** ${activeResult.scores.accessibility}/100
- **Visual Design:** ${activeResult.scores.visual}/100
- **Overall:** ${activeResult.scores.overall}/100

## Highlights
${activeResult.highlights.map(h => `- ${h}`).join('\n')}

## Issues
${activeResult.issues.map((issue, idx) => 
  `${idx + 1}. **${issue.stepHint}** (${issue.severity})
   - ${issue.issue}
   - Suggestion: ${issue.suggestion}`
).join('\n\n')}

## Narrative
${activeResult.narrative}
`;

    navigator.clipboard.writeText(markdown);
  };

  const exportToJSON = () => {
    const jsonData = {
      persona: persona.name,
      model: results.model,
      imageIndex: activeImageIndex,
      results: activeResult,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ux-evaluation-${persona.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <span style={{ fontSize: '16px', fontWeight: '600', color: designSystem.colors.text.primary }}>
          Images ({images.length})
        </span>
        
        <div style={styles.thumbnailRail}>
          {images.map((image, index) => (
            <div
              key={image.id}
              style={{
                ...styles.thumbnail,
                ...(index === activeImageIndex ? styles.thumbnailActive : {}),
                ...(hoveredThumbnail === index ? styles.thumbnailHover : {}),
              }}
              onClick={() => setActiveImageIndex(index)}
              onMouseEnter={() => setHoveredThumbnail(index)}
              onMouseLeave={() => setHoveredThumbnail(null)}
            >
              <img
                src={image.preview}
                alt={`Screenshot ${index + 1}`}
                style={styles.thumbnailImage}
              />
              <div style={styles.thumbnailOverlay}>
                Image {index + 1}
              </div>
              {images.length > 1 && winnerIndex === index && (
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  backgroundColor: designSystem.colors.success,
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}>
                  🏆
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <div>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: designSystem.colors.text.primary,
              margin: 0 
            }}>
              Evaluation Results - Image {activeImageIndex + 1}
            </h2>
            <p style={{ 
              fontSize: '14px', 
              color: designSystem.colors.text.secondary, 
              margin: '4px 0 0 0' 
            }}>
              Persona: {persona.name} • Model: {results.model}
            </p>
            {/* Winner indicator */}
            {images.length > 1 && (
              <div style={{
                ...styles.winnerBadge,
                ...(winnerIndex === activeImageIndex ? styles.winnerActive : styles.winnerInactive),
              }}>
                {analysisType === 'side-by-side' ?
                  (winnerIndex === activeImageIndex ? '🏆 Winner' : `🏆 Winner: Design ${winnerIndex + 1} (${results.items[winnerIndex].scores.overall}分)`) :
                  (winnerIndex === activeImageIndex ? '🏆 Winner' : `🏆 Winner: Image ${winnerIndex + 1} (${results.items[winnerIndex].scores.overall}分)`)
                }
              </div>
            )}
          </div>
          
          <div style={styles.toolbar}>
            <button
              style={styles.button}
              onClick={() => setIsFullscreen(true)}
            >
              ⛶ Full Screen
            </button>
            <div style={styles.toolbarDivider} />
            <button
              style={styles.button}
              onClick={exportToMarkdown}
            >
              📄 Copy Markdown
            </button>
            <button
              style={styles.button}
              onClick={exportToJSON}
            >
              📋 Export JSON
            </button>
            <div style={styles.toolbarDivider} />
            <button
              style={{ ...styles.button, ...styles.buttonPrimary }}
              onClick={onRerun}
            >
              ▶️ Re-run Analysis
            </button>
          </div>
        </div>

        {/* Scores Overview */}
        <div style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>📊 Score Overview</h3>
          
          <div style={styles.scoresGrid}>
            <div style={styles.scoreItem}>
              <span style={styles.scoreLabel}>Usability</span>
              <span style={{ 
                ...styles.scoreValue, 
                color: getScoreColor(activeResult.scores.usability) 
              }}>
                {activeResult.scores.usability}
              </span>
              <p style={styles.scoreDescription}>
                Nielsen's 10 Usability Heuristics - How easy and intuitive the interface is to use
              </p>
            </div>
            
            <div style={styles.scoreItem}>
              <span style={styles.scoreLabel}>Accessibility</span>
              <span style={{ 
                ...styles.scoreValue, 
                color: getScoreColor(activeResult.scores.accessibility) 
              }}>
                {activeResult.scores.accessibility}
              </span>
              <p style={styles.scoreDescription}>
                WCAG POUR Principles - How accessible the design is for all users including those with disabilities
              </p>
            </div>
            
            <div style={styles.scoreItem}>
              <span style={styles.scoreLabel}>Visual Design</span>
              <span style={{ 
                ...styles.scoreValue, 
                color: getScoreColor(activeResult.scores.visual) 
              }}>
                {activeResult.scores.visual}
              </span>
              <p style={styles.scoreDescription}>
                12 Principles of Visual Design - Visual hierarchy, balance, contrast, and overall aesthetic appeal
              </p>
            </div>
          </div>

          <div style={styles.overallScore}>
            <span style={{ fontSize: '16px', fontWeight: '600', color: designSystem.colors.text.primary }}>
              Overall Score: 
            </span>
            <span style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              color: getScoreColor(activeResult.scores.overall),
              marginLeft: designSystem.spacing.sm 
            }}>
              {activeResult.scores.overall}
            </span>
          </div>
        </div>

        {/* Issues Table */}
        {activeResult.issues && activeResult.issues.length > 0 && (
          <div style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>⚠️ Issues Found ({activeResult.issues.length})</h3>
            <table style={styles.issuesTable}>
              <thead style={styles.tableHeader}>
                <tr>
                  <th style={styles.tableHeaderCell}>Area</th>
                  <th style={styles.tableHeaderCell}>Issue</th>
                  <th style={styles.tableHeaderCell}>Severity</th>
                  <th style={styles.tableHeaderCell}>Suggestion</th>
                </tr>
              </thead>
              <tbody>
                {activeResult.issues.map((issue, index) => (
                  <tr key={index} style={styles.tableRow}>
                    <td style={styles.tableCell}>{issue.stepHint}</td>
                    <td style={styles.tableCell}>{issue.issue}</td>
                    <td style={styles.tableCell}>
                      <span style={{
                        ...styles.severityBadge,
                        backgroundColor: getSeverityColor(issue.severity),
                        color: 'white',
                      }}>
                        {issue.severity}
                      </span>
                    </td>
                    <td style={styles.tableCell}>{issue.suggestion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Highlights */}
        {activeResult.highlights && activeResult.highlights.length > 0 && (
          <div style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>✨ Key Strengths</h3>
            <ul style={{ 
              margin: 0, 
              paddingLeft: designSystem.spacing.xl,
              color: designSystem.colors.text.primary 
            }}>
              {activeResult.highlights.map((highlight, index) => (
                <li key={index} style={{ marginBottom: designSystem.spacing.sm }}>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Narrative */}
        <div style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>📝 Analysis Summary</h3>
          <p style={{ 
            color: designSystem.colors.text.primary, 
            lineHeight: '1.6',
            margin: 0 
          }}>
            {activeResult.narrative}
          </p>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div style={styles.fullscreenOverlay} onClick={() => setIsFullscreen(false)}>
          <img
            src={images[activeImageIndex].preview}
            alt={`Screenshot ${activeImageIndex + 1}`}
            style={styles.fullscreenImage}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            style={styles.closeButton}
            onClick={() => setIsFullscreen(false)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}