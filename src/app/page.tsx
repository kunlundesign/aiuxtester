'use client';

import React, { useState } from 'react';

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    background: '#f5f5f5',
    minHeight: '100vh'
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '30px',
    color: '#333'
  },
  card: {
    background: '#fff',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #e1e1e1'
  },
  button: {
    background: '#0070f3',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    marginTop: '5px',
    boxSizing: 'border-box' as const
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    marginTop: '5px',
    boxSizing: 'border-box' as const
  },
  label: {
    display: 'block',
    marginBottom: '15px',
    fontWeight: '500',
    color: '#333'
  }
};

export default function AIScenarioSimulator() {
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [selectedPersona, setSelectedPersona] = useState('default');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [results, setResults] = useState<string[]>([]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setUploadedImages(Array.from(files));
    }
  };

  const handleEvaluate = async () => {
    if (!apiKey.trim()) {
      alert('请输入API Key');
      return;
    }
    
    if (uploadedImages.length === 0) {
      alert('请先上传图片');
      return;
    }

    setIsEvaluating(true);
    
    try {
      // 模拟AI分析
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResults = uploadedImages.map((_, index) => 
        `图片 ${index + 1} 的UX分析结果：这是一个模拟的分析结果，显示应用已成功部署到Azure。`
      );
      
      setResults(mockResults);
    } catch (error) {
      console.error('评估失败:', error);
      alert('评估失败');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>AI UX 场景模拟器</h1>
        <p>上传UI/UX设计图片，选择AI模型和专家人格，进行智能分析</p>
      </div>

      <div style={styles.card}>
        <h3>配置设置</h3>
        
        <label style={styles.label}>
          API Key:
          <input
            style={styles.input}
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="请输入您的API Key (演示版本)"
          />
        </label>

        <label style={styles.label}>
          AI模型:
          <select
            style={styles.select}
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="gemini-pro">Gemini Pro</option>
          </select>
        </label>

        <label style={styles.label}>
          专家人格:
          <select
            style={styles.select}
            value={selectedPersona}
            onChange={(e) => setSelectedPersona(e.target.value)}
          >
            <option value="default">默认专家</option>
            <option value="accessibility">无障碍专家</option>
            <option value="visual">视觉设计师</option>
            <option value="usability">可用性专家</option>
          </select>
        </label>
      </div>

      <div style={styles.card}>
        <h3>图片上传</h3>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
        />
        
        {uploadedImages.length > 0 && (
          <p>已上传 {uploadedImages.length} 张图片</p>
        )}
      </div>

      <div style={styles.card}>
        <button
          style={{
            ...styles.button,
            opacity: isEvaluating || uploadedImages.length === 0 || !apiKey.trim() ? 0.6 : 1
          }}
          onClick={handleEvaluate}
          disabled={isEvaluating || uploadedImages.length === 0 || !apiKey.trim()}
        >
          {isEvaluating ? '分析中...' : '开始分析'}
        </button>
      </div>

      {results.length > 0 && (
        <div style={styles.card}>
          <h3>分析结果</h3>
          {results.map((result, index) => (
            <div key={index} style={{
              background: '#f9f9f9',
              border: '1px solid #e1e1e1',
              borderRadius: '6px',
              padding: '15px',
              marginBottom: '15px'
            }}>
              <h4>UX分析 - {selectedModel}</h4>
              <p>{result}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
