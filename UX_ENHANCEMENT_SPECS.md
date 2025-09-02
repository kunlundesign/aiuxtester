# 🎯 UX Enhancement Specifications

## 功能1: User Verbatim信息层级提升

### **当前状态**
- 位置：Results页面底部，Issues和Narrative之间
- 样式：黄色虚线框，相对较小的视觉权重
- 问题：用户直接反馈被埋没在技术分析中

### **目标状态**
- 提升至页面顶部或显著位置
- 增强视觉权重和用户关注度
- 与persona角色强关联，突出真实用户声音

### **技术实现规格**

#### **1.1 布局重构**
```tsx
// 新布局顺序：
1. 评分概览 (Scores)
2. 👤 User Verbatim (提升到第二位置)
3. ✨ Highlights  
4. ⚠️ Issues (带位置标注)
5. 📖 Narrative
```

#### **1.2 视觉设计规格**
```tsx
const userVerbatimStyles = {
  // 提升视觉权重
  backgroundColor: '#f3e5f5', // 紫色主题匹配persona
  border: '3px solid #9c27b0', // 实线边框增强存在感
  borderRadius: '12px',
  padding: '24px', // 增加内边距
  marginTop: '20px',
  boxShadow: '0 4px 12px rgba(156, 39, 176, 0.1)', // 添加阴影
  
  // 内容样式
  title: {
    fontSize: '18px', // 增大标题
    fontWeight: '600',
    color: '#6a1b9a',
    marginBottom: '16px'
  },
  
  quotes: {
    fontSize: '16px', // 增大引用文字
    lineHeight: '1.5',
    fontStyle: 'italic',
    color: '#4a148c'
  }
}
```

#### **1.3 Persona关联增强**
```tsx
// 动态persona头像和名称
<div className="verbatim-header">
  <Avatar persona={selectedPersona} />
  <span>"{persona.name}" 用户反馈</span>
</div>

// 引用样式差异化
{evaluationResult.items[currentImageIndex].verbatim!.map((quote, idx) => (
  <div key={idx} className={`quote-${selectedPersona.id}`}>
    <Quote icon={getPersonaIcon(selectedPersona)} />
    {quote}
  </div>
))}
```

---

## 功能2: Issues位置标注系统

### **当前状态**
- Issues以文本列表形式展示
- 用户需要猜测问题在界面中的具体位置
- 缺乏视觉关联性

### **目标状态**
- Issues列表中每个问题有编号
- 图片上显示对应编号的热点标记
- 点击标记高亮对应Issue
- 提供空间位置的直观理解

### **技术实现规格**

#### **2.1 数据结构扩展**
```typescript
// 扩展Issue类型
interface Issue {
  issue: string;
  severity: 'High' | 'Medium' | 'Low';
  dimension: 'Usability' | 'Accessibility' | 'Visual';
  principles: string[];
  suggestion: string;
  stepHint?: string;
  
  // 新增位置数据
  position?: {
    x: number;        // 相对坐标 0-100%
    y: number;        // 相对坐标 0-100%
    width?: number;   // 可选，问题区域宽度
    height?: number;  // 可选，问题区域高度
  };
  
  // 新增编号
  id: string;         // 唯一标识
  displayNumber: number; // 显示编号 1, 2, 3...
}
```

#### **2.2 图片标注组件**
```tsx
// ImageAnnotation.tsx
interface ImageAnnotationProps {
  imageSrc: string;
  issues: Issue[];
  onIssueClick: (issueId: string) => void;
  highlightedIssue?: string;
}

const ImageAnnotation: React.FC<ImageAnnotationProps> = ({
  imageSrc, issues, onIssueClick, highlightedIssue
}) => {
  return (
    <div className="image-annotation-container">
      <img src={imageSrc} alt="UI Screenshot" />
      
      {/* 位置标记 */}
      {issues.map((issue, index) => (
        issue.position && (
          <div
            key={issue.id}
            className={`issue-marker ${highlightedIssue === issue.id ? 'highlighted' : ''}`}
            style={{
              position: 'absolute',
              left: `${issue.position.x}%`,
              top: `${issue.position.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={() => onIssueClick(issue.id)}
          >
            <div className={`marker severity-${issue.severity.toLowerCase()}`}>
              {issue.displayNumber}
            </div>
          </div>
        )
      ))}
    </div>
  );
};
```

#### **2.3 Issues列表增强**
```tsx
// 增强的Issues列表
{evaluationResult.items[currentImageIndex].issues.map((issue, idx) => (
  <div 
    key={issue.id}
    className={`issue-item ${highlightedIssue === issue.id ? 'highlighted' : ''}`}
    onClick={() => setHighlightedIssue(issue.id)}
  >
    {/* 编号标识 */}
    <div className="issue-number">
      <span className={`number-badge severity-${issue.severity.toLowerCase()}`}>
        {issue.displayNumber}
      </span>
    </div>
    
    {/* 问题内容 */}
    <div className="issue-content">
      <div className="issue-title">
        {issue.stepHint}
        {issue.position && <LocationIcon />}
      </div>
      <div className="issue-description">
        {issue.issue}
      </div>
      <div className="issue-meta">
        <strong>{issue.severity}</strong> • {issue.dimension}
      </div>
    </div>
  </div>
))}
```

#### **2.4 样式规格**
```css
/* 图片标记样式 */
.issue-marker {
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
}

.marker {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.marker.severity-high {
  background: #f44336;
  border: 3px solid #d32f2f;
}

.marker.severity-medium {
  background: #ff9800;
  border: 3px solid #f57c00;
}

.marker.severity-low {
  background: #2196f3;
  border: 3px solid #1976d2;
}

.issue-marker.highlighted .marker {
  animation: pulse 1.5s infinite;
  transform: scale(1.2);
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(244, 67, 54, 0); }
  100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
}

/* Issues列表样式 */
.issue-item {
  display: flex;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.issue-item:hover {
  background-color: #f5f5f5;
}

.issue-item.highlighted {
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.number-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
}
```

#### **2.5 AI位置检测集成**
```typescript
// 扩展AI Prompt以生成位置信息
const enhancedPrompt = `
${basePrompt}

For each issue identified, estimate the approximate location on the interface where the problem occurs:
- Provide x,y coordinates as percentages (0-100) relative to the image dimensions
- x: horizontal position from left edge
- y: vertical position from top edge

Example issue with position:
{
  "issue": "Button text contrast is insufficient",
  "position": {"x": 75, "y": 60},
  "displayNumber": 1
}

Return issues with position data when identifiable visual elements are involved.
`;
```

### **2.6 实现优先级**

#### **Phase 1: 基础实现**
1. 扩展Issue数据结构
2. 实现ImageAnnotation组件
3. 更新Issues列表显示编号

#### **Phase 2: 交互增强**
1. 添加点击高亮功能
2. 实现标记动画效果
3. 优化移动端交互

#### **Phase 3: 智能定位**
1. 集成AI位置检测
2. 添加手动位置调整功能
3. 实现位置数据持久化

---

## 🎯 实施建议

### **开发顺序**
1. **User Verbatim提升**（相对简单，快速见效）
2. **Issues编号系统**（基础数据结构）
3. **位置标注UI**（核心功能）
4. **AI位置检测**（高级功能）

### **测试策略**
1. **A/B测试**：对比User Verbatim位置调整效果
2. **可用性测试**：验证位置标注的直观性
3. **Persona测试**：确保不同persona的verbatim突出效果

这个规格设计如何？你希望我开始实现哪个功能，或者需要调整某些方面？
