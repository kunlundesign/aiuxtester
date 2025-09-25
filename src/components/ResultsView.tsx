'use client';

import React, { useState } from 'react';
import {
  Card,
  Text,
  Badge,
  Button,
  Divider,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Toolbar,
  ToolbarDivider,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { 
  ShareRegular, 
  DocumentPdfRegular, 
  DocumentTextRegular,
  FullScreenMaximizeRegular,
  PlayRegular
} from '@fluentui/react-icons';
import { UploadedImage, EvalResult, Persona, Issue, ImageEval } from '@/types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
    minHeight: '600px',
  },
  sidebar: {
    width: '200px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  thumbnailRail: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  thumbnail: {
    position: 'relative',
    cursor: 'pointer',
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    aspectRatio: '16/9',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'scale(1.02)',
      boxShadow: tokens.shadow8,
    },
  },
  thumbnailActive: {
    outline: `2px solid ${tokens.colorBrandBackground}`,
    transform: 'scale(1.02)',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
    color: 'white',
    padding: tokens.spacingVerticalXS,
    fontSize: tokens.fontSizeBase200,
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM,
  },
  sectionCard: {
    padding: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalM,
    display: 'block',
  },
  scoresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
  },
  scoreItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  scoreLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    textTransform: 'uppercase',
    marginBottom: tokens.spacingVerticalXS,
  },
  scoreValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalXS,
  },
  issuesTable: {
    width: '100%',
    marginTop: tokens.spacingVerticalM,
  },
  severityBadge: {
    minWidth: '60px',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalImage: {
    maxWidth: '90vw',
    maxHeight: '90vh',
    objectFit: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    backgroundColor: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    fontSize: '20px',
    fontWeight: 'bold',
  },
});

interface ResultsViewProps {
  results: EvalResult;
  persona: Persona;
  images: UploadedImage[];
  onRerun: () => void;
  analysisType?: 'single' | 'flow' | 'side-by-side';
}

function ResultsView({ results, persona, images, onRerun, analysisType = 'single' }: ResultsViewProps) {
  const styles = useStyles();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const activeResult = results.items[activeImageIndex];
  const activeImage = images[activeImageIndex];

  // Find the winner (highest overall score)
  const winnerIndex = results.items.reduce((winnerIdx, current, index) => {
    return current.scores.overall > results.items[winnerIdx].scores.overall ? index : winnerIdx;
  }, 0);

  // Helper functions for colors
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success' as const;
    if (score >= 60) return 'warning' as const;
    return 'danger' as const;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'danger' as const;
      case 'medium': return 'warning' as const;
      case 'low': return 'success' as const;
      default: return 'informative' as const;
    }
  };

  const exportToMarkdown = () => {
    let markdown = `# UX Evaluation Results\n\n`;
    markdown += `**Persona:** ${persona.name}\n`;
    markdown += `**Model:** ${results.model}\n\n`;

    results.items.forEach((item, index) => {
      markdown += `## Image ${index + 1}\n\n`;
      markdown += `### Scores\n`;
      markdown += `- **Usability:** ${item.scores.usability}/100\n`;
      markdown += `- **Accessibility:** ${item.scores.accessibility}/100\n`;
      markdown += `- **Visual Design:** ${item.scores.visual}/100\n`;
      markdown += `- **Overall:** ${item.scores.overall}/100\n\n`;
      
      markdown += `### Narrative\n${item.narrative}\n\n`;
      
      if (item.highlights.length > 0) {
        markdown += `### Highlights\n`;
        item.highlights.forEach(highlight => {
          markdown += `- ${highlight}\n`;
        });
        markdown += '\n';
      }
      
      if (item.issues.length > 0) {
        markdown += `### Issues\n`;
        item.issues.forEach(issue => {
          markdown += `**${issue.severity}:** ${issue.issue}\n`;
          markdown += `*Suggestion:* ${issue.suggestion}\n\n`;
        });
      }
      
      markdown += '---\n\n';
    });

    navigator.clipboard.writeText(markdown);
  };

  const exportToJSON = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ux-evaluation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openModal = (image: string) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  if (!activeResult || !activeImage) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <Text size={400} weight="semibold">Images ({images.length})</Text>
        
        <div className={styles.thumbnailRail}>
          {images.map((image, index) => (
            <Card
              key={image.id}
              className={`${styles.thumbnail} ${index === activeImageIndex ? styles.thumbnailActive : ''}`}
              onClick={() => setActiveImageIndex(index)}
            >
              <img
                src={image.preview}
                alt={`Image ${index + 1}`}
                className={styles.thumbnailImage}
                onClick={() => openModal(image.preview)}
              />
              <div className={styles.thumbnailOverlay}>
                Image {index + 1}
                {index === winnerIndex && (
                  <div style={{ 
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: tokens.colorPaletteGreenBackground1,
                    color: tokens.colorPaletteGreenForeground1,
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    🏆
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <Text size={600} weight="semibold">
              Evaluation Results - Image {activeImageIndex + 1}
            </Text>
            <Text size={300} style={{ color: tokens.colorNeutralForeground2, display: 'block', marginTop: '4px' }}>
              Persona: {persona.name} • Model: {results.model}
            </Text>
            {/* Winner indicator */}
            {images.length > 1 && (
              <div style={{ 
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: winnerIndex === activeImageIndex ? tokens.colorPaletteGreenBackground2 : tokens.colorNeutralBackground2,
                borderRadius: tokens.borderRadiusSmall,
                border: `1px solid ${winnerIndex === activeImageIndex ? tokens.colorPaletteGreenBorder2 : tokens.colorNeutralStroke2}`,
                display: 'inline-block'
              }}>
                <Text size={200} weight="semibold" style={{ 
                  color: winnerIndex === activeImageIndex ? tokens.colorPaletteGreenForeground1 : tokens.colorNeutralForeground2
                }}>
                  {analysisType === 'side-by-side' ? 
                    (winnerIndex === activeImageIndex ? '🏆 测试Winner' : `🏆 Winner: Design ${winnerIndex + 1} (${results.items[winnerIndex].scores.overall}分)`) :
                    (winnerIndex === activeImageIndex ? '🏆 测试Winner' : `🏆 Winner: Image ${winnerIndex + 1} (${results.items[winnerIndex].scores.overall}分)`)
                  }
                </Text>
              </div>
            )}
          </div>
          
          <Toolbar>
            <Button
              appearance="secondary"
              icon={<FullScreenMaximizeRegular />}
              onClick={() => setShowLightbox(true)}
            >
              Full Screen
            </Button>
            <ToolbarDivider />
            <Button
              appearance="secondary"
              icon={<DocumentTextRegular />}
              onClick={exportToMarkdown}
            >
              Copy Markdown
            </Button>
            <Button
              appearance="secondary"
              icon={<DocumentPdfRegular />}
              onClick={exportToJSON}
            >
              Export JSON
            </Button>
            <ToolbarDivider />
            <Button
              appearance="primary"
              icon={<PlayRegular />}
              onClick={onRerun}
            >
              Re-run Analysis
            </Button>
          </Toolbar>
        </div>

        {/* Scores Overview */}
        <Card className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>📊 Score Overview</Text>
          
          <div className={styles.scoresGrid}>
            <div className={styles.scoreItem}>
              <Text className={styles.scoreLabel}>Usability</Text>
              <Badge 
                className={styles.scoreValue}
                color={getScoreColor(activeResult.scores.usability)}
                appearance="filled"
                size="extra-large"
              >
                {activeResult.scores.usability}
              </Badge>
              <Text style={{ 
                fontSize: tokens.fontSizeBase200, 
                color: tokens.colorNeutralForeground2,
                marginTop: '8px',
                textAlign: 'center'
              }}>
                Nielsen's 10 Usability Heuristics - How easy and intuitive the interface is to use
              </Text>
            </div>
            
            <div className={styles.scoreItem}>
              <Text className={styles.scoreLabel}>Accessibility</Text>
              <Badge 
                className={styles.scoreValue}
                color={getScoreColor(activeResult.scores.accessibility)}
                appearance="filled"
                size="extra-large"
              >
                {activeResult.scores.accessibility}
              </Badge>
              <Text style={{ 
                fontSize: tokens.fontSizeBase200, 
                color: tokens.colorNeutralForeground2,
                marginTop: '8px',
                textAlign: 'center'
              }}>
                WCAG POUR Principles - How accessible the design is for all users including those with disabilities
              </Text>
            </div>
            
            <div className={styles.scoreItem}>
              <Text className={styles.scoreLabel}>Visual Design</Text>
              <Badge 
                className={styles.scoreValue}
                color={getScoreColor(activeResult.scores.visual)}
                appearance="filled"
                size="extra-large"
              >
                {activeResult.scores.visual}
              </Badge>
              <Text style={{ 
                fontSize: tokens.fontSizeBase200, 
                color: tokens.colorNeutralForeground2,
                marginTop: '8px',
                textAlign: 'center'
              }}>
                12 Principles of Visual Design - Visual hierarchy, balance, contrast, and overall aesthetic appeal
              </Text>
            </div>
          </div>
          
          {/* Overall Score with explanation */}
          <div style={{ 
            marginTop: '24px', 
            padding: '16px', 
            backgroundColor: tokens.colorNeutralBackground2,
            borderRadius: tokens.borderRadiusMedium,
            textAlign: 'center'
          }}>
            <Text style={{ fontSize: tokens.fontSizeBase400, fontWeight: '600' }}>
              Overall Score: 
            </Text>
            <Badge 
              style={{ marginLeft: '8px' }}
              color={getScoreColor(activeResult.scores.overall)}
              appearance="filled"
              size="extra-large"
            >
              {activeResult.scores.overall}
            </Badge>
            <Text style={{ 
              fontSize: tokens.fontSizeBase200, 
              color: tokens.colorNeutralForeground2,
              marginTop: '8px',
              display: 'block'
            }}>
              Weighted average considering all dimensions - Represents the overall user experience quality
            </Text>
          </div>
        </Card>

        {/* Detailed Scoring Sections */}
        {/* Usability Section */}
        <Card className={styles.sectionCard}>
          <div style={{ marginBottom: '16px' }}>
            <Text style={{ 
              fontSize: tokens.fontSizeBase400, 
              fontWeight: '600',
              color: tokens.colorNeutralForeground1 
            }}>
              🎯 Usability Score: {activeResult.scores.usability}/100
            </Text>
            <Text style={{ 
              fontSize: tokens.fontSizeBase200, 
              color: tokens.colorNeutralForeground2,
              marginTop: '4px'
            }}>
              Based on Nielsen's 10 Usability Heuristics
            </Text>
          </div>
          
          {activeResult.issues.filter(issue => issue.dimension === 'Usability').length > 0 && (
            <div>
              <Text style={{ 
                fontSize: tokens.fontSizeBase300, 
                fontWeight: '600', 
                color: tokens.colorPaletteRedForeground1,
                marginBottom: '12px'
              }}>
                ⚠️ Issues ({activeResult.issues.filter(issue => issue.dimension === 'Usability').length})
              </Text>
              {activeResult.issues.filter(issue => issue.dimension === 'Usability').map((issue, index) => (
                <div key={index} style={{
                  marginBottom: '12px',
                  padding: '12px',
                  backgroundColor: tokens.colorNeutralBackground1,
                  borderRadius: tokens.borderRadiusSmall,
                  borderLeft: `4px solid ${getSeverityColor(issue.severity)}`
                }}>
                  <Text style={{ 
                    fontSize: tokens.fontSizeBase300, 
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    {index + 1}. {issue.stepHint}
                  </Text>
                  <Text style={{ 
                    fontSize: tokens.fontSizeBase300, 
                    marginBottom: '4px'
                  }}>
                    {issue.issue}
                  </Text>
                  <Text style={{ 
                    fontSize: tokens.fontSizeBase200, 
                    color: tokens.colorNeutralForeground2 
                  }}>
                    {issue.severity} • {issue.dimension}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Accessibility Section */}
        <Card className={styles.sectionCard}>
          <div style={{ marginBottom: '16px' }}>
            <Text style={{ 
              fontSize: tokens.fontSizeBase400, 
              fontWeight: '600',
              color: tokens.colorNeutralForeground1 
            }}>
              ♿ Accessibility Score: {activeResult.scores.accessibility}/100
            </Text>
            <Text style={{ 
              fontSize: tokens.fontSizeBase200, 
              color: tokens.colorNeutralForeground2,
              marginTop: '4px'
            }}>
              Based on WCAG POUR Principles
            </Text>
          </div>
          
          {activeResult.issues.filter(issue => issue.dimension === 'Accessibility').length > 0 && (
            <div>
              <Text style={{ 
                fontSize: tokens.fontSizeBase300, 
                fontWeight: '600', 
                color: tokens.colorPaletteRedForeground1,
                marginBottom: '12px'
              }}>
                ⚠️ Issues ({activeResult.issues.filter(issue => issue.dimension === 'Accessibility').length})
              </Text>
              {activeResult.issues.filter(issue => issue.dimension === 'Accessibility').map((issue, index) => (
                <div key={index} style={{
                  marginBottom: '12px',
                  padding: '12px',
                  backgroundColor: tokens.colorNeutralBackground1,
                  borderRadius: tokens.borderRadiusSmall,
                  borderLeft: `4px solid ${getSeverityColor(issue.severity)}`
                }}>
                  <Text style={{ 
                    fontSize: tokens.fontSizeBase300, 
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    {index + 1}. {issue.stepHint}
                  </Text>
                  <Text style={{ 
                    fontSize: tokens.fontSizeBase300, 
                    marginBottom: '4px'
                  }}>
                    {issue.issue}
                  </Text>
                  <Text style={{ 
                    fontSize: tokens.fontSizeBase200, 
                    color: tokens.colorNeutralForeground2 
                  }}>
                    {issue.severity} • {issue.dimension}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Visual Design Section */}
        <Card className={styles.sectionCard}>
          <div style={{ marginBottom: '16px' }}>
            <Text style={{ 
              fontSize: tokens.fontSizeBase400, 
              fontWeight: '600',
              color: tokens.colorNeutralForeground1 
            }}>
              🎨 Visual Design Score: {activeResult.scores.visual}/100
            </Text>
            <Text style={{ 
              fontSize: tokens.fontSizeBase200, 
              color: tokens.colorNeutralForeground2,
              marginTop: '4px'
            }}>
              Based on 12 Principles of Visual Design
            </Text>
          </div>
          
          {activeResult.issues.filter(issue => issue.dimension === 'Visual').length > 0 && (
            <div>
              <Text style={{ 
                fontSize: tokens.fontSizeBase300, 
                fontWeight: '600', 
                color: tokens.colorPaletteRedForeground1,
                marginBottom: '12px'
              }}>
                ⚠️ Issues ({activeResult.issues.filter(issue => issue.dimension === 'Visual').length})
              </Text>
              {activeResult.issues.filter(issue => issue.dimension === 'Visual').map((issue, index) => (
                <div key={index} style={{
                  marginBottom: '12px',
                  padding: '12px',
                  backgroundColor: tokens.colorNeutralBackground1,
                  borderRadius: tokens.borderRadiusSmall,
                  borderLeft: `4px solid ${getSeverityColor(issue.severity)}`
                }}>
                  <Text style={{ 
                    fontSize: tokens.fontSizeBase300, 
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    {index + 1}. {issue.stepHint}
                  </Text>
                  <Text style={{ 
                    fontSize: tokens.fontSizeBase300, 
                    marginBottom: '4px'
                  }}>
                    {issue.issue}
                  </Text>
                  <Text style={{ 
                    fontSize: tokens.fontSizeBase200, 
                    color: tokens.colorNeutralForeground2 
                  }}>
                    {issue.severity} • {issue.dimension}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Overall Score Section */}
        <Card className={styles.sectionCard}>
          <div style={{ marginBottom: '16px' }}>
            <Text style={{ 
              fontSize: tokens.fontSizeBase400, 
              fontWeight: '600',
              color: tokens.colorNeutralForeground1 
            }}>
              ⭐ Overall Score: {activeResult.scores.overall}/100
            </Text>
            <Text style={{ 
              fontSize: tokens.fontSizeBase200, 
              color: tokens.colorNeutralForeground2,
              marginTop: '4px'
            }}>
              Calculated as a weighted average of all dimensions
            </Text>
          </div>
        </Card>

        {/* Narrative */}
        <Card className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>💬 AI Analysis</Text>
          <Text style={{ 
            fontSize: tokens.fontSizeBase300,
            lineHeight: '1.5',
            color: tokens.colorNeutralForeground1 
          }}>
            {activeResult.narrative}
          </Text>
        </Card>

        {/* Highlights */}
        {activeResult.highlights.length > 0 && (
          <Card className={styles.sectionCard}>
            <Text className={styles.sectionTitle}>✨ Key Strengths ({activeResult.highlights.length})</Text>
            
            {activeResult.highlights.map((highlight, index) => (
              <div key={index} style={{ 
                marginBottom: tokens.spacingVerticalS,
                padding: tokens.spacingVerticalS,
                backgroundColor: tokens.colorPaletteGreenBackground2,
                borderRadius: tokens.borderRadiusSmall,
                borderLeft: `4px solid ${tokens.colorPaletteGreenBorder2}`
              }}>
                <Text style={{ 
                  fontSize: tokens.fontSizeBase300,
                  color: tokens.colorNeutralForeground1 
                }}>
                  {highlight}
                </Text>
              </div>
            ))}
          </Card>
        )}

        {/* Lightbox Modal */}
        {showLightbox && (
          <div 
            className={styles.modal}
            onClick={() => setShowLightbox(false)}
          >
            <img
              src={activeImage.preview}
              alt={`Image ${activeImageIndex + 1} - Full Size`}
              className={styles.modalImage}
            />
          </div>
        )}

        {/* Full-screen image modal */}
        {selectedImage && (
          <div className={styles.modal} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}>
            <button
              onClick={closeModal}
              className={styles.closeButton}
            >
              X
            </button>
            <img
              src={selectedImage}
              alt="Enlarged Survey Image"
              style={{ maxWidth: '90%', maxHeight: '90%' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultsView;
