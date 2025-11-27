import React, { useState } from 'react';
import styles from './SampleSizeSelector.module.css';

export interface SampleSizeTier {
  name: string;
  sampleSize: number;
  useCase: string;
  confidence: string;
  cost: string;
  time: string;
  description: string;
  recommended?: boolean;
  testMode?: boolean;
}

export interface BatchConfig {
  sampleSize: number;
  includeStats: boolean;
  analysisType: string;
}

interface SampleSizeSelectorProps {
  onConfigChange: (config: BatchConfig) => void;
  disabled?: boolean;
}

const sampleSizeTiers: SampleSizeTier[] = [
  {
    name: "功能测试",
    sampleSize: 10,
    useCase: "功能验证和调试",
    confidence: "基础 (60%)",
    cost: "极低 ($1)",
    time: "1-2分钟",
    description: "快速测试功能是否正常工作，适合开发调试",
    testMode: true
  },
  {
    name: "快速对比",
    sampleSize: 50,
    useCase: "早期设计方向验证",
    confidence: "中等 (80%)",
    cost: "低 ($5)",
    time: "3-5分钟",
    description: "快速识别明显问题，适合设计初期快速迭代"
  },
  {
    name: "详细分析", 
    sampleSize: 150,
    useCase: "A/B测试风险降低",
    confidence: "高 (90%)",
    cost: "中等 ($15)",
    time: "8-12分钟",
    description: "平衡成本与准确性，适合大多数A/B测试场景",
    recommended: true
  },
  {
    name: "深度研究",
    sampleSize: 300, 
    useCase: "重要产品决策",
    confidence: "很高 (95%)",
    cost: "较高 ($30)",
    time: "15-25分钟",
    description: "高置信度结果，适合关键产品功能决策"
  },
  {
    name: "全面验证",
    sampleSize: 500,
    useCase: "企业级产品发布",
    confidence: "最高 (98%)", 
    cost: "高 ($50)",
    time: "25-40分钟",
    description: "最全面的用户洞察，适合重要产品发布前验证"
  }
];

export default function SampleSizeSelector({ onConfigChange, disabled = false }: SampleSizeSelectorProps) {
  const [selectedTier, setSelectedTier] = useState<SampleSizeTier>(sampleSizeTiers[0]);
  const [includeStats, setIncludeStats] = useState(true);

  const handleTierChange = (tier: SampleSizeTier) => {
    setSelectedTier(tier);
    const config: BatchConfig = {
      sampleSize: tier.sampleSize,
      includeStats,
      analysisType: 'auto-detect'
    };
    onConfigChange(config);
  };

  const handleStatsToggle = (include: boolean) => {
    setIncludeStats(include);
    const config: BatchConfig = {
      sampleSize: selectedTier.sampleSize,
      includeStats: include,
      analysisType: 'auto-detect'
    };
    onConfigChange(config);
  };

  const getTierCardClasses = (tier: SampleSizeTier) => {
    let classes = styles.tierCard;
    if (selectedTier.sampleSize === tier.sampleSize) classes += ` ${styles.tierCardSelected}`;
    if (tier.recommended) classes += ` ${styles.tierCardRecommended}`;
    if (tier.testMode) classes += ` ${styles.tierCardTestMode}`;
    return classes;
  };

  return (
    <div className={styles.batchEvaluationPanel}>
      <div className={styles.panelHeader}>
        <h3>🎭 批量用户评估</h3>
        <p>使用1,135个真实MSN/Bing/Ads/Edge用户数据进行批量评估</p>
      </div>
      
      <div className={styles.tierSelection}>
        <h4>选择样本大小</h4>
        <div className={styles.tierGrid}>
          {sampleSizeTiers.map((tier) => (
            <div 
              key={tier.sampleSize}
              className={getTierCardClasses(tier)}
              onClick={() => handleTierChange(tier)}
            >
              {tier.recommended && (
                <div className={styles.recommendedBadge}>推荐</div>
              )}
              {tier.testMode && (
                <div className={styles.testBadge}>测试</div>
              )}
              
              <div className={styles.tierHeader}>
                <h5>{tier.name}</h5>
                <div className={styles.sampleSize}>{tier.sampleSize}个用户</div>
              </div>
              
              <div className={styles.tierDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.label}>适用场景:</span>
                  <span className={styles.value}>{tier.useCase}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.label}>置信度:</span>
                  <span className={styles.value}>{tier.confidence}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.label}>预估成本:</span>
                  <span className={styles.value}>{tier.cost}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.label}>预估时间:</span>
                  <span className={styles.value}>{tier.time}</span>
                </div>
              </div>
              
              <div className={styles.tierDescription}>
                {tier.description}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.configSection}>
        <div className={styles.configItem}>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={includeStats}
              onChange={(e) => handleStatsToggle(e.target.checked)}
              disabled={disabled}
            />
            <span className={styles.checkmark}></span>
            生成详细统计报告
          </label>
          <p className={styles.configDescription}>包含分数分布、问题频率、用户分群等详细分析</p>
        </div>
      </div>
      
      <div className={styles.batchInfo}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>选中样本:</span>
          <span className={styles.infoValue}>{selectedTier.sampleSize}个用户</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>预估时间:</span>
          <span className={styles.infoValue}>{selectedTier.time}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>预估成本:</span>
          <span className={styles.infoValue}>{selectedTier.cost}</span>
        </div>
      </div>
    </div>
  );
}
