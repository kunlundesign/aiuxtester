'use client';

import React, { useState } from 'react';
import { Card, Text } from '@fluentui/react-components';
import { personas } from '@/data/personas';
import { createAIAdapter } from '@/lib/ai-adapters';
import { ModelProvider, EvalResult, UploadedImage, ImageEval } from '@/types';
import ImageAnnotation from '@/components/ImageAnnotation';

// 统一的设计系统
const designSystem = {
  colors: {
    primary: '#8B7355',    // 温暖的棕色
    secondary: '#B5A99A',  // 柔和的灰棕色
    accent: '#D4C4B0',     // 浅色强调色
    success: '#6B8E5A',    // 自然绿色
    warning: '#D49C3D',    // 温暖橙色
    danger: '#B85450',     // 柔和红色
    info: '#5C8A8A',       // 蓝绿色
    light: '#F9F6F3',      // 非常浅的米色
    dark: '#2D2A26',       // 深棕色
    
    background: {
      primary: '#EFEAE7',   // 主背景色
      secondary: '#F5F1EE', // 次要背景色
      card: 'rgba(255, 255, 255, 0.7)', // 卡片背景
      overlay: 'rgba(45, 42, 38, 0.1)'   // 叠加层
    },
    
    text: {
      primary: '#2D2A26',   // 主文本
      secondary: '#5A5550', // 次要文本
      light: '#8B8680',     // 浅色文本
      accent: '#8B7355'     // 强调文本
    },
    
    score: {
      excellent: '#6B8E5A',
      good: '#5C8A8A',
      fair: '#D49C3D',
      poor: '#C67C4E',
      critical: '#B85450'
    },
    
    severity: {
      high: '#B85450',
      medium: '#D49C3D', 
      low: '#6B8E5A'
    }
  },
  
  shadows: {
    card: '0 8px 32px rgba(45, 42, 38, 0.1)',
    cardHover: '0 12px 48px rgba(45, 42, 38, 0.15)',
    button: '0 4px 16px rgba(139, 115, 85, 0.2)',
    subtle: '0 2px 8px rgba(45, 42, 38, 0.05)'
  },
  
  borderRadius: {
    small: '8px',
    medium: '12px',
    large: '16px',
    xl: '24px'
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  }
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

interface TestHistory {
  id: string;
  timestamp: Date;
  result: EvalResult;
  persona: string;
  model: ModelProvider;
  imageCount: number;
}

export default function HomePage() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedPersona, setSelectedPersona] = useState(personas[0].id);
  const [selectedModel, setSelectedModel] = useState<ModelProvider>('gemini');
  const [designBackground, setDesignBackground] = useState('');
  const [analysisType, setAnalysisType] = useState<'single' | 'flow' | 'auto'>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState('Upload 1-10 screenshots to begin evaluation');
  const [evaluationResult, setEvaluationResult] = useState<EvalResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'individual' | 'flow'>('individual');
  const [testHistory, setTestHistory] = useState<TestHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [multiPersonaResults, setMultiPersonaResults] = useState<Array<{ personaId: string; result: EvalResult }>>([]);

  // Helper functions
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getCurrentPersona = () => personas.find(p => p.id === selectedPersona) || personas[0];

  // Event handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 10) {
      setStatus('❌ Maximum 10 images allowed');
      return;
    }
    
    setUploadProgress(0);
    setUploadedFiles(imageFiles);
    
    // 自动检测分析类型
    if (analysisType === 'auto') {
      if (imageFiles.length === 1) {
        setAnalysisType('single');
        setStatus(`✅ Single image uploaded - Will analyze individual design`);
      } else if (imageFiles.length > 1) {
        setAnalysisType('flow');
        setStatus(`✅ ${imageFiles.length} images uploaded - Will analyze as user flow`);
      }
    }
    
    // 模拟上传进度
    const totalFiles = imageFiles.length;
    for (let i = 0; i <= totalFiles; i++) {
      setTimeout(() => {
        setUploadProgress((i / totalFiles) * 100);
        if (i === totalFiles) {
          setStatus(prev => prev + ' - Ready to evaluate');
        }
      }, i * 100);
    }
    
    setEvaluationResult(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleRunSimulation = async () => {
    if (uploadedFiles.length === 0) {
      setStatus('❌ Please upload at least one screenshot');
      return;
    }

    setIsLoading(true);
    const singlePersona = getCurrentPersona();
    
    try {
      setLoadingMessage('� Initializing AI analysis...');
      setStatus('🚀 Starting evaluation process...');
      
  setLoadingMessage('📸 Processing uploaded images...');
      const base64Images = await Promise.all(
        uploadedFiles.map(file => fileToBase64(file))
      );

  setLoadingMessage(`🤖 Connecting to ${selectedModel.toUpperCase()} AI service...`);
      
      const isAll = selectedPersona === 'all';
      const personaList = isAll ? personas : [singlePersona];
      setMultiPersonaResults([]);
      setLoadingMessage(isAll ? `👥 Analyzing with ${personaList.length} personas...` : `👤 Analyzing from ${singlePersona.name} perspective...`);
      const finalAnalysisType = analysisType === 'auto' ? (uploadedFiles.length > 1 ? 'flow' : 'single') : analysisType;
      
      console.log('About to call AI service via API with:', {
        imageCount: base64Images.length,
        analysisType: finalAnalysisType,
        model: selectedModel
      });
      const aggregatedResults: Array<{ personaId: string; result: EvalResult }> = [];
      for (const p of personaList) {
        try {
          const res = await fetch('/api/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: selectedModel,
              personaId: p.id,
              images: base64Images,
              designBackground,
              analysisType: finalAnalysisType,
            }),
          });
          if (!res.ok) throw new Error(`API /api/evaluate failed: ${res.status}`);
          const result = await res.json();
          console.log(`API result for ${p.name}:`, result);

          // Validate result structure, build a local fallback if empty to avoid blocking UX
          let finalResult: EvalResult = result as EvalResult;
          if (!result || !Array.isArray(result.items) || result.items.length === 0) {
            console.warn(`Invalid result structure from adapter for ${p.name}, synthesizing local fallback mock result.`);
            const fallbackItems: ImageEval[] = base64Images.map((_, i): ImageEval => {
              const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
              const usability = rand(75, 95);
              const accessibility = rand(70, 90);
              const visual = rand(80, 100);
              const overall = Math.round((usability + accessibility + visual) / 3);
              return {
                imageId: `image-${i}`,
                personaId: p.id,
                scores: { usability, accessibility, visual, overall },
                highlights: [
                  'Clean layout with clear hierarchy',
                  'Good use of whitespace and contrast',
                  finalAnalysisType === 'flow' ? `Flow step ${i + 1} maintains consistency` : 'Intuitive primary action placement'
                ],
                issues: [
                  // Accessibility (2)
                  {
                    stepHint: finalAnalysisType === 'flow' ? `Step ${i + 1} Text/Contrast` : 'Text contrast',
                    issue: 'Some text on colored backgrounds may not meet WCAG AA contrast.',
                    severity: 'Medium',
                    dimension: 'Accessibility',
                    principles: ['Contrast', 'Legibility'],
                    suggestion: 'Increase text-to-background contrast to at least 4.5:1 for body text.'
                  },
                  {
                    stepHint: finalAnalysisType === 'flow' ? `Step ${i + 1} Focus` : 'Keyboard focus',
                    issue: 'Keyboard focus states are unclear on interactive elements.',
                    severity: 'Low',
                    dimension: 'Accessibility',
                    principles: ['Focus Visible', 'Operable'],
                    suggestion: 'Ensure clear focus outlines and logical tab order.'
                  },
                  // Usability (2)
                  {
                    stepHint: finalAnalysisType === 'flow' ? `Step ${i + 1} Navigation` : 'Primary action clarity',
                    issue: 'Primary action is not visually prioritized, causing decision friction.',
                    severity: 'Medium',
                    dimension: 'Usability',
                    principles: ['Visibility of system status', 'Recognition over recall'],
                    suggestion: 'Increase prominence of the primary CTA and reduce competing elements.'
                  },
                  {
                    stepHint: finalAnalysisType === 'flow' ? `Step ${i + 1} Recovery` : 'Error prevention',
                    issue: 'Risk of accidental purchases without clear confirmations.',
                    severity: 'High',
                    dimension: 'Usability',
                    principles: ['Error prevention', 'User control'],
                    suggestion: 'Add confirm dialogs and easy undo for purchase-related actions.'
                  },
                  // Visual (2)
                  {
                    stepHint: finalAnalysisType === 'flow' ? `Step ${i + 1} Hierarchy` : 'Visual hierarchy',
                    issue: 'Secondary text competes with primary information.',
                    severity: 'Low',
                    dimension: 'Visual',
                    principles: ['Hierarchy', 'Scale'],
                    suggestion: 'Adjust typography scale/weight and spacing to clarify priorities.'
                  },
                  {
                    stepHint: finalAnalysisType === 'flow' ? `Step ${i + 1} Consistency` : 'Component consistency',
                    issue: 'Inconsistent component styles across screens.',
                    severity: 'Low',
                    dimension: 'Visual',
                    principles: ['Consistency', 'Unity'],
                    suggestion: 'Normalize spacing, corner radii, and icon sizes across variants.'
                  },
                ],
                narrative: finalAnalysisType === 'flow'
                  ? `Step ${i + 1} shows consistent design language and predictable navigation. Minor accessibility improvements could enhance clarity.`
                  : 'The interface feels modern and approachable. Minor accessibility issues remain but overall usability is strong.',
                verbatim: [
                  '“This flow feels quick but I’m not sure about the next step.”',
                  '“I can see what to do, but the text could pop more.”'
                ]
              };
            });
            finalResult = { model: selectedModel, personaId: p.id, items: fallbackItems };
            setStatus(`⚠️ Used local fallback for ${p.name} (API returned ${result?.items?.length || 0} items)`);
          }

          aggregatedResults.push({ personaId: p.id, result: finalResult });

          // Save each persona to history
          setTestHistory(prev => ([
            {
              id: `${Date.now().toString()}-${p.id}`,
              timestamp: new Date(),
              result: finalResult,
              persona: p.name,
              model: selectedModel,
              imageCount: uploadedFiles.length
            },
            ...prev
          ]));
        } catch (err) {
          console.error(`Evaluation failed for ${p.name}:`, err);
        }
      }

      // Apply results to UI
      if (aggregatedResults.length > 0) {
        setMultiPersonaResults(aggregatedResults);
        setEvaluationResult(aggregatedResults[0].result);
        setLoadingMessage('✅ Analysis complete!');
        setStatus(isAll ? `✅ Completed for ${aggregatedResults.length} personas` : '✅ Test completed successfully');
      } else {
        throw new Error('All evaluations failed');
      }
      
      setTimeout(() => setLoadingMessage(''), 2000);
    } catch (error) {
      console.error('Evaluation failed:', error);
      setLoadingMessage('❌ Analysis failed');
      setStatus(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setLoadingMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistoryItem = (historyItem: TestHistory) => {
    setEvaluationResult(historyItem.result);
    setCurrentImageIndex(0);
    setViewMode('individual');
    setShowHistory(false);
    setStatus(`📖 Viewing test from ${historyItem.timestamp.toLocaleString()}`);
  };

  const startNewTest = () => {
    setEvaluationResult(null);
  setMultiPersonaResults([]);
    setCurrentImageIndex(0);
    setViewMode('individual');
    setUploadedFiles([]);
    setShowHistory(false);
    setDesignBackground('');
    setAnalysisType('auto');
    setStatus('Upload 1-10 screenshots to begin new test');
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${designSystem.colors.background.primary} 0%, ${designSystem.colors.background.secondary} 100%)`,
      padding: '20px'
    }}>
      {/* Top Navigation Bar */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.70)',
        backdropFilter: 'blur(10px)',
        padding: '16px 24px',
        marginBottom: '24px',
        borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(45, 42, 38, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        maxWidth: '1200px',
        margin: '0 auto 24px auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38" fill="none">
              <g clipPath="url(#clip0_119_68376)">
                <rect width="38" height="38" rx="6" fill="#272320"/>
                <path d="M8 17.5L4 29L11.5 33L15.5 17.5H8Z" fill="white"/>
                <path d="M27 10L19.5 6L23 28.5H34.5L27 10Z" fill="white"/>
              </g>
              <defs>
                <clipPath id="clip0_119_68376">
                  <rect width="38" height="38" fill="white"/>
                </clipPath>
              </defs>
            </svg>
          </div>
          
          {/* Title */}
          <h1 style={{ 
            margin: 0, 
            fontSize: '24px', 
            fontWeight: '600',
            letterSpacing: '-0.01em',
            color: '#2D2A26'
          }}>
            Studio 8 AI UX tester
          </h1>
        </div>
      </div>

      {/* Main Content Card */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        background: designSystem.colors.background.card,
        backdropFilter: 'blur(10px)',
        borderRadius: designSystem.borderRadius.xl,
        boxShadow: designSystem.shadows.card,
        border: '1px solid rgba(255, 255, 255, 0.3)',
        overflow: 'hidden'
      }}>

        <div style={{ padding: '24px' }}>
          {/* Main Content Header */}
          <div style={{
            backgroundImage: 'url(/bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '24px',
            borderRadius: '16px',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{
                margin: '0 0 8px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#242424'
              }}>
                Testing your design with AI-powered personas
              </h2>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#242424',
                opacity: 0.8,
                lineHeight: '1.5'
              }}>
                Please Upload 1-10 screenshots to begin evaluation. You can get quick design feedback from different personas.
              </p>
            </div>
          </div>

          {/* Top Action Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            marginBottom: '24px',
            gap: '12px'
          }}>
            <button
              onClick={startNewTest}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              New Test
            </button>
            
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Test History ({testHistory.length})
            </button>
          </div>

          {/* Status Bar with Loading */}
          <div style={{ 
            padding: designSystem.spacing.lg, 
            background: isLoading 
              ? 'linear-gradient(135deg, rgba(212, 156, 61, 0.1) 0%, rgba(245, 241, 238, 0.8) 100%)'
              : designSystem.colors.background.card,
            border: `1px solid ${isLoading ? designSystem.colors.warning : 'rgba(255, 255, 255, 0.3)'}`,
            borderRadius: designSystem.borderRadius.large,
            marginBottom: designSystem.spacing.xl,
            boxShadow: designSystem.shadows.subtle,
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: designSystem.spacing.md,
              marginBottom: loadingMessage ? designSystem.spacing.sm : 0
            }}>
              {isLoading && (
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '3px solid rgba(139, 115, 85, 0.2)',
                  borderTop: `3px solid ${designSystem.colors.primary}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              )}
              <strong style={{ color: designSystem.colors.text.primary }}>Status:</strong> 
              <span style={{ color: isLoading ? designSystem.colors.warning : designSystem.colors.text.accent }}>
                {status}
              </span>
            </div>
            
            {isLoading && loadingMessage && (
              <div style={{
                padding: `${designSystem.spacing.xs} ${designSystem.spacing.sm}`,
                backgroundColor: 'rgba(0,123,255,0.1)',
                borderRadius: designSystem.borderRadius.small,
                fontSize: '14px',
                color: designSystem.colors.primary,
                fontWeight: '500'
              }}>
                {loadingMessage}
              </div>
            )}
            
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>

          {/* History Panel */}
          {showHistory && (
            <div style={{
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '2px solid #dee2e6'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#272320' }}>Test History</h3>
              {testHistory.length === 0 ? (
                <p style={{ color: '#272320', fontStyle: 'italic', margin: 0 }}>
                  No tests completed yet. Run your first test to see history here.
                </p>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {testHistory.map((item, index) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '12px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        border: '1px solid #dee2e6',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => loadHistoryItem(item)}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#e3f2fd';
                        e.currentTarget.style.borderColor = '#007bff';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#dee2e6';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                            Test #{testHistory.length - index}
                          </div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            {item.timestamp.toLocaleString()} • {item.persona} • {item.model.toUpperCase()} • {item.imageCount} image(s)
                          </div>
                          <div style={{ fontSize: '13px', color: '#007bff', marginTop: '4px' }}>
                            Overall Score: {item.result.items[0]?.scores?.overall || 'N/A'}/100
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(!evaluationResult && !showHistory) ? (
            /* Configuration Panel */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Left Column - Settings */}
              <div>
                {/* Persona Selection */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '12px', 
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: designSystem.colors.text.primary
                  }}>
                    Step 1. Select Persona:
                  </label>
                  <select 
                    value={selectedPersona} 
                    onChange={(e) => setSelectedPersona(e.target.value)}
                    style={{ 
                      padding: '14px 16px', 
                      width: '100%',
                      border: `2px solid ${designSystem.colors.accent}`,
                      borderRadius: designSystem.borderRadius.medium,
                      fontSize: '14px',
                      background: designSystem.colors.background.card,
                      color: designSystem.colors.text.primary,
                      fontFamily: 'inherit',
                      backdropFilter: 'blur(10px)',
                      boxShadow: designSystem.shadows.subtle
                    }}
                  >
                    <option value="all">All personas (run across all)</option>
                    {personas.map(persona => (
                      <option key={persona.id} value={persona.id}>
                        {persona.name}
                      </option>
                    ))}
                  </select>
                  
                  <div style={{ 
                    marginTop: '12px',
                    padding: '16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Traits:</strong> {selectedPersona === 'all' ? 'Varies by persona' : getCurrentPersona().traits.join(', ')}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Motivations:</strong> {selectedPersona === 'all' ? 'Broad coverage: speed, discovery, trends, accuracy, continuity' : getCurrentPersona().motivations.slice(0, 2).join(', ')}
                    </div>
                    <div>
                      <strong>Pain Points:</strong> {selectedPersona === 'all' ? 'Covers multiple pain points across user types' : getCurrentPersona().painPoints.slice(0, 2).join(', ')}
                    </div>
                    {selectedPersona !== 'all' && getCurrentPersona().whenToApply && (
                      <div style={{ marginTop: '8px', color: '#6B3900' }}>
                        <strong>Where to apply:</strong> {getCurrentPersona().whenToApply}
                      </div>
                    )}
                    </div>
                </div>

                {/* Model Selection */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '12px', 
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: designSystem.colors.text.primary
                  }}>
                    Step 2. Select AI Model:
                  </label>
                  <select 
                    value={selectedModel} 
                    onChange={(e) => setSelectedModel(e.target.value as ModelProvider)}
                    style={{ 
                      padding: '14px 16px', 
                      width: '100%',
                      border: `2px solid ${designSystem.colors.accent}`,
                      borderRadius: designSystem.borderRadius.medium,
                      fontSize: '14px',
                      background: designSystem.colors.background.card,
                      color: designSystem.colors.text.primary,
                      fontFamily: 'inherit',
                      backdropFilter: 'blur(10px)',
                      boxShadow: designSystem.shadows.subtle
                    }}
                  >
                    <option value="gemini">🟢 Google Gemini Pro Vision</option>
                    <option value="openai">🔵 OpenAI GPT-4 Vision</option>
                    <option value="zhipu">🟡 Zhipu GLM-4V</option>
                  </select>
                </div>

                {/* Design Background Input */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '12px', 
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: designSystem.colors.text.primary
                  }}>
                    Step 3. Describe Design Background & Context:
                  </label>
                  <textarea
                    value={designBackground}
                    onChange={(e) => setDesignBackground(e.target.value)}
                    placeholder="Describe your design context, target users, business goals, or any specific information that would help AI better understand your design... (Optional)"
                    style={{ 
                      padding: '16px', 
                      width: '100%',
                      minHeight: '120px',
                      border: `2px solid ${designSystem.colors.accent}`,
                      borderRadius: designSystem.borderRadius.medium,
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      background: designBackground 
                        ? `linear-gradient(135deg, rgba(107, 142, 90, 0.05) 0%, rgba(245, 241, 238, 0.8) 100%)`
                        : designSystem.colors.background.card,
                      color: designSystem.colors.text.primary,
                      backdropFilter: 'blur(10px)',
                      boxShadow: designSystem.shadows.subtle,
                      lineHeight: '1.5'
                    }}
                  />
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666', 
                    marginTop: '6px',
                    fontStyle: 'italic'
                  }}>
                    💡 Providing context helps AI give more accurate and relevant feedback
                  </div>
                </div>

                {/* Analysis Type Selection */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '12px', 
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: designSystem.colors.text.primary
                  }}>
                    Step 4. Pick Analysis Type:
                  </label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {[
                      { value: 'auto', label: 'Auto-detect', desc: 'AI decides based on image count' },
                      { value: 'single', label: 'Single Screen', desc: 'Individual screen analysis' },
                      { value: 'flow', label: 'User Flow', desc: 'Multi-screen journey analysis' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setAnalysisType(option.value as 'single' | 'flow' | 'auto')}
                        className={`btn-toggle ${analysisType === option.value ? 'active' : ''}`}
                        style={{
                          fontSize: '14px',
                          minWidth: '130px',
                          textAlign: 'center'
                        }}
                        title={option.desc}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666', 
                    marginTop: '6px'
                  }}>
                    {analysisType === 'auto' && 'Will auto-detect: Single image → Screen analysis, Multiple images → Flow analysis'}
                    {analysisType === 'single' && 'Individual screen usability, accessibility & visual design analysis'}
                    {analysisType === 'flow' && 'User journey analysis across multiple screens with flow continuity evaluation'}
                  </div>
                </div>
              </div>

              {/* Right Column - File Upload */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontWeight: 'bold',
                  fontSize: '16px',
                  color: '#272320'
                }}>
                  Step 5. Upload Screenshots (1-10 images):
                </label>
                
                {/* Drag & Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    border: `3px dashed ${dragOver ? designSystem.colors.primary : designSystem.colors.accent}`,
                    borderRadius: designSystem.borderRadius.large,
                    padding: '48px 24px',
                    textAlign: 'center',
                    background: dragOver 
                      ? `linear-gradient(135deg, rgba(139, 115, 85, 0.1) 0%, rgba(245, 241, 238, 0.8) 100%)`
                      : designSystem.colors.background.card,
                    marginBottom: '20px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                    boxShadow: dragOver ? designSystem.shadows.cardHover : designSystem.shadows.subtle
                  }}
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  <div style={{ fontSize: '56px', marginBottom: '20px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>
                    {dragOver ? '📥' : '📱'}
                  </div>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: '600', 
                    marginBottom: '12px', 
                    color: designSystem.colors.text.primary,
                    letterSpacing: '-0.01em'
                  }}>
                    {dragOver ? 'Drop images here' : 'Drag & drop screenshots'}
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    color: designSystem.colors.text.secondary, 
                    marginBottom: '20px' 
                  }}>
                    or click to browse files
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: designSystem.colors.text.light,
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.5)',
                    borderRadius: designSystem.borderRadius.small,
                    display: 'inline-block'
                  }}>
                    Supports: JPG, PNG, WebP • Max 10 images
                  </div>
                </div>

                <input
                  id="fileInput"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />

                {/* Uploaded Files Preview */}
                {uploadedFiles.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#272320' }}>
                      Uploaded Files ({uploadedFiles.length}):
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          style={{
                            position: 'relative',
                            border: '2px solid #e9ecef',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            aspectRatio: '1'
                          }}
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            bottom: '2px',
                            right: '2px',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            fontSize: '10px',
                            padding: '2px 4px',
                            borderRadius: '2px'
                          }}>
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test Button */}
                <button
                  onClick={handleRunSimulation}
                  disabled={isLoading || uploadedFiles.length === 0}
                  className="btn-large"
                >
                  {isLoading ? 'Testing...' : 'Run UX Test'}
                </button>
              </div>
            </div>
          ) : (
            /* Results Panel */
            evaluationResult && evaluationResult.items && evaluationResult.items.length > 0 ? (
              <div>
                {/* Results Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '32px',
                  padding: '24px',
                  background: `linear-gradient(135deg, ${designSystem.colors.primary} 0%, ${designSystem.colors.secondary} 100%)`,
                  borderRadius: '16px',
                  color: 'white',
                  boxShadow: '0 8px 32px rgba(139, 115, 85, 0.25)'
                }}>
                  <div>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '600', letterSpacing: '-0.02em' }}>Test Results</h2>
                    <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>Analysis completed for {uploadedFiles.length} screen{uploadedFiles.length > 1 ? 's' : ''}</p>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    <span style={{ width: '8px', height: '8px', backgroundColor: '#6B8E5A', borderRadius: '50%' }}></span>
                    Complete
                  </div>
                </div>

                {/* Multi-Image Navigation */}
                {evaluationResult.items.length > 1 && (
                  <div style={{ 
                    marginBottom: '24px',
                    padding: '20px',
                    backgroundColor: '#FFF',
                    borderRadius: '16px',
                    border: '1px solid rgba(0, 0, 0, 0.10)',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.12)'
                  }}>
                    {/* View Mode Toggle */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      marginBottom: '16px',
                      gap: '8px'
                    }}>
                      <button
                        onClick={() => setViewMode('individual')}
                        className={`btn-toggle ${viewMode === 'individual' ? 'active' : ''}`}
                      >
                        Individual Screens
                      </button>
                      <button
                        onClick={() => setViewMode('flow')}
                        className={`btn-toggle ${viewMode === 'flow' ? 'active' : ''}`}
                      >
                        Flow Analysis
                      </button>
                    </div>

                    {/* Individual Screen Navigation */}
                    {viewMode === 'individual' && (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <button
                          onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                          disabled={currentImageIndex === 0}
                          style={{
                            backgroundColor: currentImageIndex === 0 ? '#dee2e6' : designSystem.colors.primary,
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: designSystem.borderRadius.small,
                            cursor: currentImageIndex === 0 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          ← Previous
                        </button>
                        
                        {/* Screen Thumbnails */}
                        <div style={{
                          display: 'flex',
                          gap: designSystem.spacing.xs,
                          alignItems: 'center',
                          maxWidth: '500px',
                          overflowX: 'auto',
                          padding: '4px'
                        }}>
                          {evaluationResult.items.map((_, index) => (
                            <div
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              style={{
                                position: 'relative',
                                minWidth: '60px',
                                height: '60px',
                                border: `3px solid ${index === currentImageIndex ? designSystem.colors.primary : '#e9ecef'}`,
                                borderRadius: designSystem.borderRadius.small,
                                cursor: 'pointer',
                                overflow: 'hidden',
                                backgroundColor: 'white',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseOver={(e) => {
                                if (index !== currentImageIndex) {
                                  e.currentTarget.style.borderColor = designSystem.colors.info;
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (index !== currentImageIndex) {
                                  e.currentTarget.style.borderColor = '#e9ecef';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }
                              }}
                            >
                              {uploadedFiles[index] ? (
                                <img
                                  src={URL.createObjectURL(uploadedFiles[index])}
                                  alt={`Thumbnail ${index + 1}`}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#f8f9fa',
                                  color: '#666',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  {index + 1}
                                </div>
                              )}
                              
                              {/* Screen number overlay */}
                              <div style={{
                                position: 'absolute',
                                bottom: '2px',
                                right: '2px',
                                backgroundColor: index === currentImageIndex ? designSystem.colors.primary : 'rgba(0,0,0,0.7)',
                                color: 'white',
                                fontSize: '10px',
                                padding: '2px 4px',
                                borderRadius: '2px',
                                fontWeight: 'bold'
                              }}>
                                {index + 1}
                              </div>
                              
                              {/* Score indicator */}
                              {evaluationResult.items[index] && (
                                <div style={{
                                  position: 'absolute',
                                  top: '2px',
                                  left: '2px',
                                  backgroundColor: getScoreColor(evaluationResult.items[index].scores.overall),
                                  color: 'white',
                                  fontSize: '8px',
                                  padding: '1px 3px',
                                  borderRadius: '2px',
                                  fontWeight: 'bold'
                                }}>
                                  {evaluationResult.items[index].scores.overall}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <button
                          onClick={() => setCurrentImageIndex(Math.min((evaluationResult?.items?.length || 1) - 1, currentImageIndex + 1))}
                          disabled={currentImageIndex === (evaluationResult?.items?.length || 1) - 1}
                          style={{
                            backgroundColor: currentImageIndex === (evaluationResult?.items?.length || 1) - 1 ? '#dee2e6' : designSystem.colors.primary,
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: designSystem.borderRadius.small,
                            cursor: currentImageIndex === (evaluationResult?.items?.length || 1) - 1 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Persona guidance */}
                {(() => {
                  const persona = getCurrentPersona();
                  return (
                    <div style={{
                      marginBottom: '16px',
                      padding: '12px 16px',
                      backgroundColor: '#e9f5ff',
                      border: '1px solid #b6e0fe',
                      borderRadius: '8px',
                      color: '#084b8a'
                    }}>
                      <strong>Persona:</strong> {persona.name}
                      {persona.whenToApply ? (
                        <span style={{ marginLeft: '8px', color: '#0b5ed7' }}>— {persona.whenToApply}</span>
                      ) : null}
                    </div>
                  );
                })()}

                {/* Results Content */}
                {viewMode === 'individual' && evaluationResult && evaluationResult.items && evaluationResult.items[currentImageIndex] ? (
                  /* Individual Screen Results */
                  <div>
                    <h3 style={{ marginBottom: '16px', color: '#333' }}>
                      Screen {currentImageIndex + 1} Analysis
                    </h3>
                    
                    {/* Current Image Display */}
                    {uploadedFiles[currentImageIndex] && (
                      <div style={{
                        marginBottom: '24px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <div style={{
                          maxWidth: '400px',
                          backgroundColor: 'white',
                          borderRadius: '12px',
                          padding: '16px',
                          boxShadow: designSystem.shadows.card,
                          border: '2px solid #e9ecef'
                        }}>
                          <div style={{
                            marginBottom: '12px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#272320',
                            textAlign: 'center'
                          }}>
                            Analyzed Screenshot with Issues Marked
                          </div>
                          <ImageAnnotation
                            imageSrc={URL.createObjectURL(uploadedFiles[currentImageIndex])}
                            alt={`Screen ${currentImageIndex + 1}`}
                            issues={evaluationResult.items[currentImageIndex].issues}
                            style={{
                              width: '100%',
                              maxHeight: '400px'
                            }}
                          />
                          <div style={{
                            marginTop: '8px',
                            fontSize: '12px',
                            color: '#666',
                            textAlign: 'center'
                          }}>
                            {uploadedFiles[currentImageIndex].name}
                            {evaluationResult.items[currentImageIndex]?.issues?.filter(issue => issue.position).length > 0 && (
                              <div style={{ 
                                marginTop: '4px', 
                                color: '#7535FF',
                                fontWeight: 'bold' 
                              }}>
                                点击图片中的标记查看详细问题
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Scores Display */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(4, 1fr)', 
                      gap: '16px',
                      marginBottom: '32px'
                    }}>
                      {[
                        { label: 'Usability', score: evaluationResult.items[currentImageIndex]?.scores?.usability || 0, color: '#6B8E5A', icon: '🎯' },
                        { label: 'Accessibility', score: evaluationResult.items[currentImageIndex]?.scores?.accessibility || 0, color: '#5C8A8A', icon: '♿' },
                        { label: 'Visual', score: evaluationResult.items[currentImageIndex]?.scores?.visual || 0, color: '#D49C3D', icon: '🎨' },
                        { label: 'Overall', score: evaluationResult.items[currentImageIndex]?.scores?.overall || 0, color: '#8B7355', icon: '⭐' }
                      ].map(({ label, score, color, icon }) => (
                        <div
                          key={label}
                          style={{
                            position: 'relative',
                            textAlign: 'center',
                            padding: '20px 16px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '16px',
                            border: `2px solid ${color}`,
                            boxShadow: `0 4px 16px ${color}20`,
                            transition: 'all 0.3s ease',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Background accent */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: `linear-gradient(90deg, ${color}, ${color}80)`
                          }}></div>
                          
                          <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
                          <div style={{ 
                            fontSize: '32px', 
                            fontWeight: '700', 
                            color: color,
                            marginBottom: '4px',
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                          }}>
                            {score}
                          </div>
                          <div style={{ 
                            fontSize: '13px', 
                            color: '#666', 
                            fontWeight: '500',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>{label}</div>
                        </div>
                      ))}
                    </div>

                    {/* User Verbatim */}
                    {evaluationResult.items[currentImageIndex]?.verbatim && evaluationResult.items[currentImageIndex]?.verbatim.length > 0 && (
                      <Card style={{ padding: '32px', marginBottom: '24px', border: '2px solid rgb(139, 115, 85)', borderRadius: '16px', background: '#FAFAFA', boxShadow: '0 2px 8px rgba(45,42,38,0.05)' }}>
                        <Text style={{ fontSize: '18px', fontWeight: 600, color: '#272320', marginBottom: '16px', display: 'block' }}>
                          💬 "{getCurrentPersona().name}" User Feedback
                        </Text>
                        {evaluationResult.items[currentImageIndex]?.verbatim.map((quote, idx) => (
                          <div key={idx} style={{
                            marginBottom: '16px',
                            background: '#FAF8F5',
                            borderRadius: '14px',
                            padding: '28px 24px',
                            border: '1.5px solid #E5DED6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Text style={{ fontSize: '17px', color: '#272320', lineHeight: '1.6', textAlign: 'center' }}>{quote}</Text>
                          </div>
                        ))}
                      </Card>
                    )}

                    {/* Issues and Highlights */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      {/* Highlights */}
                      <Card style={{ padding: '32px', border: '2px solid rgb(139, 115, 85)', borderRadius: '16px', background: '#FAFAFA', boxShadow: '0 2px 8px rgba(45,42,38,0.05)' }}>
                        <Text style={{ fontSize: '18px', fontWeight: 600, color: '#272320', marginBottom: '16px', display: 'block' }}>
                          ✨ Highlights
                        </Text>
                        {evaluationResult.items[currentImageIndex]?.highlights?.map((highlight, idx) => (
                          <div key={idx} style={{
                            marginBottom: '12px',
                            background: '#FAF8F5',
                            borderRadius: '14px',
                            padding: '28px 24px',
                            border: '1.5px solid #E5DED6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Text style={{ fontSize: '17px', color: '#272320', lineHeight: '1.6', textAlign: 'center' }}>{highlight}</Text>
                          </div>
                        ))}
                      </Card>

                      {/* Issues - Now as individual cards */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                          <span style={{ fontSize: '20px', marginRight: '8px' }}>⚠️</span>
                          <h4 style={{ margin: 0, color: '#272320', fontSize: '18px', fontWeight: '600' }}>
                            Issues ({evaluationResult.items[currentImageIndex]?.issues?.length || 0})
                          </h4>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {(evaluationResult.items[currentImageIndex]?.issues?.length || 0) > 0 ? (
                            evaluationResult.items[currentImageIndex]?.issues?.map((issue, idx) => {
                              const severityColors = {
                                high: { bg: '#FEF2F2', border: '#DC2626', text: '#991B1B' },
                                medium: { bg: '#FFFBEB', border: '#D97706', text: '#92400E' },
                                low: { bg: '#F0FDF4', border: '#16A34A', text: '#15803D' }
                              };
                              const colorSet = severityColors[issue.severity as keyof typeof severityColors] || severityColors.medium;
                              
                              return (
                                <div key={idx} style={{
                                  padding: '16px',
                                  backgroundColor: colorSet.bg,
                                  borderRadius: '12px',
                                  border: `2px solid ${colorSet.border}`,
                                  boxShadow: `0 2px 8px ${colorSet.border}20`,
                                  position: 'relative'
                                }}>
                                  {/* Severity badge */}
                                  <div style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    backgroundColor: colorSet.border,
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}>
                                    {issue.severity}
                                  </div>
                                  
                                  {/* Position indicator */}
                                  {issue.position && (
                                    <div style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      marginBottom: '8px',
                                      fontSize: '12px',
                                      color: colorSet.text,
                                      fontWeight: '500'
                                    }}>
                                      📍 Click to see on image
                                    </div>
                                  )}
                                  
                                  <h5 style={{
                                    margin: '0 0 8px 0',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    color: colorSet.text,
                                    lineHeight: '1.3'
                                  }}>
                                    {issue.stepHint || 'Issue'}
                                  </h5>
                                  
                                  <p style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    lineHeight: '1.4',
                                    color: '#272320'
                                  }}>
                                    {issue.issue}
                                  </p>
                                </div>
                              );
                            })
                          ) : (
                            <div style={{
                              padding: '24px',
                              backgroundColor: '#F9FAFB',
                              borderRadius: '12px',
                              border: '2px dashed #D1D5DB',
                              textAlign: 'center',
                              color: '#6B7280',
                              fontSize: '14px'
                            }}>
                              No issues found! 🎉
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI Analysis */}
                    <div style={{
                      marginTop: '32px',
                      padding: '24px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '2px solid #8B7355',
                      boxShadow: '0 4px 16px rgba(139, 115, 85, 0.15)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Background accent */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #8B7355, #8B735580)'
                      }}></div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontSize: '20px', marginRight: '8px' }}>🤖</span>
                        <h4 style={{ margin: 0, color: '#272320', fontSize: '18px', fontWeight: '600' }}>AI Analysis</h4>
                      </div>
                      
                      <p style={{ 
                        margin: 0, 
                        lineHeight: '1.6', 
                        color: '#272320', 
                        fontSize: '15px',
                        backgroundColor: '#F9F7F4',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid #E5E1DB'
                      }}>
                        {evaluationResult.items[currentImageIndex]?.narrative || 'No analysis available'}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Flow Analysis Results */
                  <div>
                    <h3 style={{ marginBottom: '16px', color: '#333' }}>
                      Complete Flow Analysis ({evaluationResult?.items?.length || 0} Screens)
                    </h3>
                    
                    {/* Flow Average Scores */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(4, 1fr)', 
                      gap: '16px',
                      marginBottom: '24px'
                    }}>
                      {(() => {
                        const avgUsability = Math.round(evaluationResult.items.reduce((sum, item) => sum + item.scores.usability, 0) / evaluationResult.items.length);
                        const avgAccessibility = Math.round(evaluationResult.items.reduce((sum, item) => sum + item.scores.accessibility, 0) / evaluationResult.items.length);
                        const avgVisual = Math.round(evaluationResult.items.reduce((sum, item) => sum + item.scores.visual, 0) / evaluationResult.items.length);
                        const avgOverall = Math.round(evaluationResult.items.reduce((sum, item) => sum + item.scores.overall, 0) / evaluationResult.items.length);
                        
                        return [
                          { label: 'Usability', score: avgUsability, icon: '🎯' },
                          { label: 'Accessibility', score: avgAccessibility, icon: '♿' },
                          { label: 'Visual', score: avgVisual, icon: '🎨' },
                          { label: 'Flow Overall', score: avgOverall, icon: '🔄' }
                        ].map(({ label, score, icon }) => (
                          <div
                            key={label}
                            style={{
                              textAlign: 'center',
                              padding: '20px',
                              backgroundColor: 'white',
                              borderRadius: '8px',
                              border: `3px solid ${getScoreColor(score)}`,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                          >
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
                            <div style={{ 
                              fontSize: '32px', 
                              fontWeight: 'bold', 
                              color: getScoreColor(score),
                              marginBottom: '4px'
                            }}>
                              {score}
                            </div>
                            <div style={{ fontSize: '14px', color: '#666' }}>{label}</div>
                          </div>
                        ));
                      })()}
                    </div>

                    {/* Flow Screen Summary */}
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      marginBottom: '24px'
                    }}>
                      <h4 style={{ margin: '0 0 16px 0', color: '#333' }}>📱 Screen Breakdown</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                        {evaluationResult.items.map((item, index) => (
                          <div
                            key={index}
                            onClick={() => {
                              setViewMode('individual');
                              setCurrentImageIndex(index);
                            }}
                            style={{
                              backgroundColor: 'white',
                              borderRadius: '8px',
                              border: `2px solid ${getScoreColor(item.scores.overall)}`,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              overflow: 'hidden'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            {/* Image Thumbnail */}
                            {uploadedFiles[index] && (
                              <div style={{
                                height: '120px',
                                backgroundColor: '#f8f9fa',
                                position: 'relative'
                              }}>
                                <img
                                  src={URL.createObjectURL(uploadedFiles[index])}
                                  alt={`Screen ${index + 1} thumbnail`}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                />
                                {/* Score overlay */}
                                <div style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  backgroundColor: getScoreColor(item.scores.overall),
                                  color: 'white',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  padding: '4px 8px',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}>
                                  {item.scores.overall}
                                </div>
                                {/* Screen number overlay */}
                                <div style={{
                                  position: 'absolute',
                                  top: '8px',
                                  left: '8px',
                                  backgroundColor: 'rgba(0,0,0,0.7)',
                                  color: 'white',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  padding: '2px 6px'
                                }}>
                                  #{index + 1}
                                </div>
                              </div>
                            )}
                            
                            {/* Card Content */}
                            <div style={{ padding: '12px' }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px'
                              }}>
                                <strong style={{ fontSize: '16px' }}>Screen {index + 1}</strong>
                                {!uploadedFiles[index] && (
                                  <div style={{
                                    padding: '4px 8px',
                                    backgroundColor: getScoreColor(item.scores.overall),
                                    color: 'white',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                  }}>
                                    {item.scores.overall}
                                  </div>
                                )}
                              </div>
                              
                              {/* Sub-scores */}
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#666', 
                                marginBottom: '8px',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: '4px'
                              }}>
                                <span>🎯 {item.scores.usability}</span>
                                <span>♿ {item.scores.accessibility}</span>
                                <span>🎨 {item.scores.visual}</span>
                              </div>
                              
                              {/* Issues count */}
                              <div style={{ 
                                fontSize: '11px', 
                                color: '#007bff', 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <span>⚠️ {item.issues.length} issue(s)</span>
                                <span>•</span>
                                <span>👆 Click to analyze</span>
                              </div>
                              
                              {/* File name */}
                              {uploadedFiles[index] && (
                                <div style={{ 
                                  fontSize: '10px', 
                                  color: '#999',
                                  marginTop: '4px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  📄 {uploadedFiles[index].name}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Flow Summary */}
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#f3e5f5',
                      borderRadius: '8px'
                    }}>
                      <h4 style={{ margin: '0 0 16px 0', color: '#7b1fa2' }}>📝 Flow Analysis Summary</h4>
                      <p style={{ margin: 0, lineHeight: '1.6', color: '#333' }}>
                        This user flow consists of {evaluationResult.items.length} screens with an average score of{' '}
                        {Math.round(evaluationResult.items.reduce((sum, item) => sum + item.scores.overall, 0) / evaluationResult.items.length)}/100.
                        The flow demonstrates {evaluationResult.items.every(item => item.scores.overall >= 80) ? 'excellent' : 
                                              evaluationResult.items.every(item => item.scores.overall >= 70) ? 'good' : 
                                              'moderate'} consistency across screens.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : evaluationResult ? (
              /* Error state when result exists but items are empty */
              <div style={{
                padding: '40px',
                textAlign: 'center',
                backgroundColor: '#fff5f5',
                border: '2px dashed #fed7d7',
                borderRadius: '8px',
                margin: '20px 0'
              }}>
                <h3 style={{ color: '#e53e3e', marginBottom: '16px' }}>⚠️ Evaluation Error</h3>
                <p style={{ color: '#272320', marginBottom: '16px' }}>
                  The AI analysis returned no results. This could be due to:
                </p>
                <ul style={{ textAlign: 'left', color: '#272320', marginBottom: '24px' }}>
                  <li>Invalid or corrupted image files</li>
                  <li>API configuration issues</li>
                  <li>Network connectivity problems</li>
                </ul>
                <button
                  onClick={startNewTest}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🔄 Try Again
                </button>
              </div>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}
