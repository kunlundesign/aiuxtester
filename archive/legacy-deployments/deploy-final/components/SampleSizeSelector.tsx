import React, { useState } from 'react';

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
  const [selectedTier, setSelectedTier] = useState<SampleSizeTier>(sampleSizeTiers[0]); // 默认选择测试选项
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

  return (
    <div className="batch-evaluation-panel">
      <div className="panel-header">
        <h3>🎭 批量用户评估</h3>
        <p>使用1,135个真实MSN/Bing/Ads/Edge用户数据进行批量评估</p>
      </div>
      
      <div className="tier-selection">
        <h4>选择样本大小</h4>
        <div className="tier-grid">
          {sampleSizeTiers.map((tier) => (
            <div 
              key={tier.sampleSize}
              className={`tier-card ${selectedTier.sampleSize === tier.sampleSize ? 'selected' : ''} ${tier.recommended ? 'recommended' : ''} ${tier.testMode ? 'test-mode' : ''}`}
              onClick={() => handleTierChange(tier)}
            >
              {tier.recommended && (
                <div className="recommended-badge">推荐</div>
              )}
              {tier.testMode && (
                <div className="test-badge">测试</div>
              )}
              
              <div className="tier-header">
                <h5>{tier.name}</h5>
                <div className="sample-size">{tier.sampleSize}个用户</div>
              </div>
              
              <div className="tier-details">
                <div className="detail-item">
                  <span className="label">适用场景:</span>
                  <span className="value">{tier.useCase}</span>
                </div>
                <div className="detail-item">
                  <span className="label">置信度:</span>
                  <span className="value">{tier.confidence}</span>
                </div>
                <div className="detail-item">
                  <span className="label">预估成本:</span>
                  <span className="value">{tier.cost}</span>
                </div>
                <div className="detail-item">
                  <span className="label">预估时间:</span>
                  <span className="value">{tier.time}</span>
                </div>
              </div>
              
              <div className="tier-description">
                {tier.description}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="config-section">
        <div className="config-item">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={includeStats}
              onChange={(e) => handleStatsToggle(e.target.checked)}
              disabled={disabled}
            />
            <span className="checkmark"></span>
            生成详细统计报告
          </label>
          <p className="config-description">包含分数分布、问题频率、用户分群等详细分析</p>
        </div>
      </div>
      
      <div className="batch-info">
        <div className="info-item">
          <span className="info-label">选中样本:</span>
          <span className="info-value">{selectedTier.sampleSize}个用户</span>
        </div>
        <div className="info-item">
          <span className="info-label">预估时间:</span>
          <span className="info-value">{selectedTier.time}</span>
        </div>
        <div className="info-item">
          <span className="info-label">预估成本:</span>
          <span className="info-value">{selectedTier.cost}</span>
        </div>
      </div>

      <style jsx>{`
        .batch-evaluation-panel {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
        }

        .panel-header h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }

        .panel-header p {
          margin: 0 0 24px 0;
          color: #6b7280;
          font-size: 14px;
        }

        .tier-selection h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .tier-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .tier-card {
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          background: white;
        }

        .tier-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .tier-card.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .tier-card.recommended {
          border-color: #10b981;
        }

        .tier-card.recommended.selected {
          border-color: #10b981;
          background: #ecfdf5;
        }

        .tier-card.test-mode {
          border-color: #f59e0b;
        }

        .tier-card.test-mode.selected {
          border-color: #f59e0b;
          background: #fffbeb;
        }

        .recommended-badge {
          position: absolute;
          top: -8px;
          right: 12px;
          background: #10b981;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .test-badge {
          position: absolute;
          top: -8px;
          right: 12px;
          background: #f59e0b;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .tier-header {
          margin-bottom: 12px;
        }

        .tier-header h5 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .sample-size {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .tier-details {
          margin-bottom: 12px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 13px;
        }

        .detail-item .label {
          color: #6b7280;
        }

        .detail-item .value {
          color: #1f2937;
          font-weight: 500;
        }

        .tier-description {
          font-size: 13px;
          color: #6b7280;
          line-height: 1.4;
        }

        .config-section {
          margin-bottom: 24px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .config-item {
          margin-bottom: 16px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .checkbox-label input {
          margin-right: 8px;
          width: 16px;
          height: 16px;
        }

        .config-description {
          margin: 4px 0 0 24px;
          font-size: 13px;
          color: #6b7280;
        }


        .batch-info {
          display: flex;
          justify-content: center;
          gap: 24px;
          font-size: 13px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .info-label {
          color: #6b7280;
          margin-bottom: 2px;
        }

        .info-value {
          color: #1f2937;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .tier-grid {
            grid-template-columns: 1fr;
          }
          
          .batch-info {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}
