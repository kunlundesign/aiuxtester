import React, { useEffect, useState } from 'react';
import styles from './BatchProgress.module.css';

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
    <div className={styles.batchProgressPanel}>
      <div className={styles.progressHeader}>
        <h3>🎭 批量评估进行中</h3>
        <div className={styles.progressStatus}>
          <span className={styles.phaseIcon}>{getPhaseIcon(progress.currentPhase)}</span>
          <span className={styles.phaseText}>{getPhaseText(progress.currentPhase)}</span>
        </div>
      </div>

      <div className={styles.progressContent}>
        <div className={styles.progressBarContainer}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className={styles.progressText}>
            {progress.completedPersonas} / {progress.totalPersonas} 个用户已完成
            <span className={styles.progressPercentage}>({progressPercentage.toFixed(1)}%)</span>
          </div>
        </div>

        <div className={styles.progressDetails}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>当前步骤:</span>
            <span className={styles.detailValue}>{progress.currentStep}</span>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>已用时间:</span>
            <span className={styles.detailValue}>{formatTime(elapsedTime)}</span>
          </div>
          
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>预计剩余:</span>
            <span className={styles.detailValue}>{progress.estimatedTimeRemaining}</span>
          </div>
        </div>

        {progress.errors.length > 0 && (
          <div className={styles.errorSection}>
            <h4>⚠️ 处理错误</h4>
            <div className={styles.errorList}>
              {progress.errors.map((error, index) => (
                <div key={index} className={styles.errorItem}>
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.progressActions}>
          {onCancel && progress.currentPhase !== 'completed' && (
            <button 
              className={styles.cancelBtn}
              onClick={onCancel}
            >
              取消评估
            </button>
          )}
          
          {progress.currentPhase === 'completed' && (
            <div className={styles.completionMessage}>
              <span className={styles.successIcon}>🎉</span>
              <span className={styles.successText}>批量评估已完成！</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


