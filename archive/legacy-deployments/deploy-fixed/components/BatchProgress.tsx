import React, { useEffect, useState } from 'react';

export interface ProgressState {
  currentStep: string;
  completedPersonas: number;
  totalPersonas: number;
  estimatedTimeRemaining: string;
  currentPhase: 'ai-processing' | 'result-generation' | 'completed';
  errors: string[];
  startTime: number;
}

interface BatchProgressProps {
  progress: ProgressState;
  onCancel?: () => void;
}

export default function BatchProgress({ progress, onCancel }: BatchProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - progress.startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [progress.startTime]);

  const progressPercentage = progress.totalPersonas > 0 
    ? (progress.completedPersonas / progress.totalPersonas) * 100 
    : 0;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'ai-processing':
        return '🤖';
      case 'result-generation':
        return '📊';
      case 'completed':
        return '✅';
      default:
        return '⏳';
    }
  };

  const getPhaseText = (phase: string) => {
    switch (phase) {
      case 'ai-processing':
        return 'AI评估处理中';
      case 'result-generation':
        return '生成统计报告';
      case 'completed':
        return '评估完成';
      default:
        return '准备中';
    }
  };

  return (
    <div className="batch-progress-panel">
      <div className="progress-header">
        <h3>🎭 批量评估进行中</h3>
        <div className="progress-status">
          <span className="phase-icon">{getPhaseIcon(progress.currentPhase)}</span>
          <span className="phase-text">{getPhaseText(progress.currentPhase)}</span>
        </div>
      </div>

      <div className="progress-content">
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="progress-text">
            {progress.completedPersonas} / {progress.totalPersonas} 个用户已完成
            <span className="progress-percentage">({progressPercentage.toFixed(1)}%)</span>
          </div>
        </div>

        <div className="progress-details">
          <div className="detail-row">
            <span className="detail-label">当前步骤:</span>
            <span className="detail-value">{progress.currentStep}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">已用时间:</span>
            <span className="detail-value">{formatTime(elapsedTime)}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">预计剩余:</span>
            <span className="detail-value">{progress.estimatedTimeRemaining}</span>
          </div>
        </div>

        {progress.errors.length > 0 && (
          <div className="error-section">
            <h4>⚠️ 处理错误</h4>
            <div className="error-list">
              {progress.errors.map((error, index) => (
                <div key={index} className="error-item">
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="progress-actions">
          {onCancel && progress.currentPhase !== 'completed' && (
            <button 
              className="btn-secondary cancel-btn"
              onClick={onCancel}
            >
              取消评估
            </button>
          )}
          
          {progress.currentPhase === 'completed' && (
            <div className="completion-message">
              <span className="success-icon">🎉</span>
              <span className="success-text">批量评估已完成！</span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .batch-progress-panel {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .progress-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }

        .progress-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .phase-icon {
          font-size: 20px;
        }

        .phase-text {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
        }

        .progress-content {
          space-y: 16px;
        }

        .progress-bar-container {
          margin-bottom: 20px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #10b981);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-text {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          color: #374151;
        }

        .progress-percentage {
          font-weight: 600;
          color: #3b82f6;
        }

        .progress-details {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .detail-row:last-child {
          margin-bottom: 0;
        }

        .detail-label {
          font-size: 14px;
          color: #6b7280;
        }

        .detail-value {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
        }

        .error-section {
          margin-bottom: 20px;
        }

        .error-section h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #dc2626;
        }

        .error-list {
          max-height: 120px;
          overflow-y: auto;
        }

        .error-item {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 8px 12px;
          margin-bottom: 8px;
          font-size: 13px;
          color: #dc2626;
        }

        .error-item:last-child {
          margin-bottom: 0;
        }

        .progress-actions {
          display: flex;
          justify-content: center;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .cancel-btn {
          background: #ef4444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .cancel-btn:hover {
          background: #dc2626;
        }

        .completion-message {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #10b981;
        }

        .success-icon {
          font-size: 20px;
        }

        .success-text {
          color: #059669;
        }

        @media (max-width: 768px) {
          .progress-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .progress-details {
            padding: 12px;
          }

          .detail-row {
            flex-direction: column;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
}


