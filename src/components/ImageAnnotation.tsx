import React, { useState, useRef, useEffect } from 'react';
import { Issue } from '@/types';

interface ImageAnnotationProps {
  imageSrc: string;
  alt: string;
  issues: Issue[];
  style?: React.CSSProperties;
  className?: string;
}

interface AnnotationMarker {
  issue: Issue;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

const ImageAnnotation: React.FC<ImageAnnotationProps> = ({
  imageSrc,
  alt,
  issues,
  style,
  className
}) => {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取有位置信息的问题
  const issuesWithPosition = (issues || []).filter(issue => issue.position);

  // 根据严重程度获取颜色
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return '#dc3545';
      case 'Medium': return '#ffc107';
      case 'Low': return '#28a745';
      default: return '#6c757d';
    }
  };

  // 根据严重程度获取边框样式
  const getSeverityBorderStyle = (severity: string) => {
    const color = getSeverityColor(severity);
    switch (severity) {
      case 'High': return `3px solid ${color}`;
      case 'Medium': return `2px dashed ${color}`;
      case 'Low': return `2px dotted ${color}`;
      default: return `1px solid ${color}`;
    }
  };

  // 获取问题图标
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'High': return '🔴';
      case 'Medium': return '🟡';
      case 'Low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        ...style
      }}
    >
      {/* 主图片 */}
      <img
        src={imageSrc}
        alt={alt}
        onLoad={() => setImageLoaded(true)}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          borderRadius: '8px'
        }}
      />

      {/* 问题标记层 */}
      {imageLoaded && issuesWithPosition.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}>
          {issuesWithPosition.map((issue, index) => {
            const position = issue.position!;
            return (
              <React.Fragment key={index}>
                {/* 区域高亮 */}
                {position.width && position.height && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                      width: `${position.width}%`,
                      height: `${position.height}%`,
                      backgroundColor: getSeverityColor(issue.severity),
                      opacity: selectedIssue === issue ? 0.3 : 0.15,
                      border: getSeverityBorderStyle(issue.severity),
                      borderRadius: '4px',
                      pointerEvents: 'auto',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      zIndex: selectedIssue === issue ? 10 : 5
                    }}
                    onClick={() => setSelectedIssue(selectedIssue === issue ? null : issue)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.25';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = selectedIssue === issue ? '0.3' : '0.15';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                )}

                {/* 点标记 */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    width: '24px',
                    height: '24px',
                    marginLeft: '-12px',
                    marginTop: '-12px',
                    backgroundColor: getSeverityColor(issue.severity),
                    borderRadius: '50%',
                    border: '2px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    zIndex: selectedIssue === issue ? 15 : 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s ease',
                    transform: selectedIssue === issue ? 'scale(1.2)' : 'scale(1)'
                  }}
                  onClick={() => setSelectedIssue(selectedIssue === issue ? null : issue)}
                  onMouseEnter={(e) => {
                    if (selectedIssue !== issue) {
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedIssue !== issue) {
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {getSeverityIcon(issue.severity)}
                </div>

                {/* 问题标号 */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    marginLeft: '18px',
                    marginTop: '-12px',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                    zIndex: 20,
                    whiteSpace: 'nowrap'
                  }}
                >
                  #{index + 1}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* 选中问题详情弹窗 */}
      {selectedIssue && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            right: '10px',
            backgroundColor: 'white',
            border: `3px solid ${getSeverityColor(selectedIssue.severity)}`,
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 30,
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>
                {getSeverityIcon(selectedIssue.severity)}
              </span>
              <span style={{
                backgroundColor: getSeverityColor(selectedIssue.severity),
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {selectedIssue.severity}
              </span>
              <span style={{
                backgroundColor: '#e9ecef',
                color: '#495057',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px'
              }}>
                {selectedIssue.dimension}
              </span>
            </div>
            <button
              onClick={() => setSelectedIssue(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#6c757d',
                padding: '0',
                lineHeight: '1'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div style={{ 
              fontWeight: 'bold', 
              color: '#333',
              marginBottom: '4px' 
            }}>
              问题：
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>
              {selectedIssue.issue}
            </div>
          </div>

          {selectedIssue.suggestion && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ 
                fontWeight: 'bold', 
                color: '#333',
                marginBottom: '4px' 
              }}>
                建议：
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                {selectedIssue.suggestion}
              </div>
            </div>
          )}

          {selectedIssue.principles && selectedIssue.principles.length > 0 && (
            <div>
              <div style={{ 
                fontWeight: 'bold', 
                color: '#333',
                marginBottom: '4px' 
              }}>
                相关原则：
              </div>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '4px' 
              }}>
                {selectedIssue.principles.map((principle, idx) => (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: '#f8f9fa',
                      color: '#495057',
                      padding: '2px 6px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      border: '1px solid #dee2e6'
                    }}
                  >
                    {principle}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 图例 */}
      {issuesWithPosition.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(255,255,255,0.95)',
          padding: '8px',
          borderRadius: '8px',
          fontSize: '12px',
          border: '1px solid #dee2e6',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>
            问题等级
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>🔴</span>
              <span style={{ color: '#dc3545' }}>高严重</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>🟡</span>
              <span style={{ color: '#ffc107' }}>中等</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>🟢</span>
              <span style={{ color: '#28a745' }}>轻微</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageAnnotation;
