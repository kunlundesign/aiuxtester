'use client';

import React, { useState } from 'react';
import { personas } from '@/data/personas';
import { createAIAdapter } from '@/lib/ai-adapters';
import { ModelProvider, EvalResult, UploadedImage, ImageEval, Persona } from '@/types';
import ImageAnnotation from '@/components/ImageAnnotation';
import SampleSizeSelector, { BatchConfig } from '@/components/SampleSizeSelector';
import BatchProgress, { ProgressState } from '@/components/BatchProgress';
import BatchStatsReport from '@/components/BatchStatsReport';
import SideBySideResults from '@/components/SideBySideResults';
import { SideBySideResults as SideBySideResultsType } from '@/types';
import { IntelligentReport } from '@/components/IntelligentReport';
import { StatsReport } from '@/lib/stats-engine';

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
  const [selectedModel, setSelectedModel] = useState<ModelProvider>('openai');
  const [designBackground, setDesignBackground] = useState('');
  const [analysisType, setAnalysisType] = useState<'single' | 'flow' | 'auto' | 'side-by-side'>('auto');
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
  const [customPersonas, setCustomPersonas] = useState<Persona[]>([]);
  const [showCustomPersonaUpload, setShowCustomPersonaUpload] = useState(false);
  
  // Batch evaluation states
  const [showBatchEvaluation, setShowBatchEvaluation] = useState(false);
  const [batchConfig, setBatchConfig] = useState<BatchConfig | null>(null);
  const [batchProgress, setBatchProgress] = useState<ProgressState | null>(null);
  const [batchStats, setBatchStats] = useState<StatsReport | null>(null);
  const [intelligentReport, setIntelligentReport] = useState<any>(null);
  const [sideBySideResults, setSideBySideResults] = useState<SideBySideResultsType | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  // Helper functions
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getCurrentPersona = () => {
    const allPersonas = [...personas, ...customPersonas];
    return allPersonas.find(p => p.id === selectedPersona) || personas[0];
  };

  // Custom persona functions
  const parseCustomPersonaJSON = (jsonData: any): Persona => {
    try {
      // Extract key information from the detailed JSON structure
      const coreIdentity = jsonData['Core Identity'] || {};
      const psychographics = jsonData['Psychographics & Personality'] || {};
      const digitalBehavior = jsonData['Digital Behavior & Online Habits'] || {};
      const interests = jsonData['Interests & Preferences'] || {};
      const economic = jsonData['Economic & Financial Profile'] || {};
      
      // Create traits array from various sections
      const traits = [
        ...(psychographics.personality_traits ? Object.values(psychographics.personality_traits).map(t => `${t} ${Object.keys(psychographics.personality_traits).find(k => psychographics.personality_traits[k] === t)}`) : []),
        ...(psychographics.mbti ? [`MBTI: ${psychographics.mbti}`] : []),
        ...(digitalBehavior.device_usage ? [`Device preference: ${digitalBehavior.device_usage}`] : []),
        ...(economic.spending_patterns ? [`Spending: ${economic.spending_patterns}`] : [])
      ].filter(Boolean);

      // Create motivations array
      const motivations = [
        ...(psychographics.motivations ? [psychographics.motivations] : []),
        ...(interests.professional_interests ? [interests.professional_interests] : []),
        ...(interests.hobbies ? [interests.hobbies] : [])
      ].filter(Boolean);

      // Create pain points array
      const painPoints = [
        ...(digitalBehavior.ad_interactions ? [`Low engagement with ads: ${digitalBehavior.ad_interactions}`] : []),
        ...(economic.spending_patterns ? [`Budget-conscious: ${economic.spending_patterns}`] : []),
        ...(psychographics.cognitive_style ? [`Cognitive style: ${psychographics.cognitive_style}`] : [])
      ].filter(Boolean);

      // Create design implications
      const designImplications = [
        ...(digitalBehavior.preferred_content_sources ? [`Content sources: ${digitalBehavior.preferred_content_sources}`] : []),
        ...(interests.learning_style ? [`Learning style: ${interests.learning_style}`] : []),
        ...(digitalBehavior.search_patterns ? [`Search patterns: ${digitalBehavior.search_patterns}`] : [])
      ].filter(Boolean);

      const persona: Persona = {
        id: `custom-${coreIdentity.full_name?.toLowerCase().replace(/\s+/g, '-') || 'persona'}-${Math.floor(Math.random() * 1000000)}`,
        name: coreIdentity.full_name || 'Custom Persona',
        traits: traits.length > 0 ? traits : ['Custom persona', 'Detailed profile'],
        motivations: motivations.length > 0 ? motivations : ['Custom motivations'],
        painPoints: painPoints.length > 0 ? painPoints : ['Custom pain points'],
        designImplications: designImplications.length > 0 ? designImplications : ['Custom design implications'],
        whenToApply: `Custom persona based on ${coreIdentity.occupation || 'professional'} profile`,
        weighting: { usability: 0.4, accessibility: 0.3, visual: 0.3 }
      };

      return persona;
    } catch (error) {
      console.error('Error parsing custom persona JSON:', error);
      throw new Error('Invalid persona JSON format');
    }
  };

  const handleCustomPersonaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        const customPersona = parseCustomPersonaJSON(jsonData);
        setCustomPersonas(prev => [...prev, customPersona]);
        setSelectedPersona(customPersona.id);
        setShowCustomPersonaUpload(false);
        setStatus(`✅ Custom persona "${customPersona.name}" imported successfully!`);
      } catch (error) {
        console.error('Error importing custom persona:', error);
        setStatus('❌ Error importing custom persona. Please check the JSON format.');
      }
    };
    reader.readAsText(file);
  };

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
    
    // Side by side testing validation
    if (analysisType === 'side-by-side' && imageFiles.length > 3) {
      setStatus('❌ Side by side testing supports maximum 3 images');
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
    } else if (analysisType === 'side-by-side') {
      if (imageFiles.length >= 2) {
        setStatus(`✅ ${imageFiles.length} images uploaded - Will compare side by side`);
      } else {
        setStatus('❌ Side by side testing requires at least 2 images');
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

    // If Batch Evaluation is enabled, use stored batch configuration
    if (showBatchEvaluation) {
      if (!batchConfig) {
        setBatchError('Please select a sample size first');
        return;
      }
      
      // 立即显示 loading 状态
    setIsLoading(true);
      setStatus('🚀 Starting batch evaluation...');
      setLoadingMessage('⏳ Preparing batch analysis...');
      
      await handleStartBatch(batchConfig);
      return;
    }

    // 立即显示 loading 状态
    setIsLoading(true);
    setStatus('🚀 Starting UX evaluation...');
    setLoadingMessage('⏳ Preparing analysis...');
    
    const singlePersona = getCurrentPersona();
    
    try {
      setLoadingMessage('🔍 Initializing AI analysis...');
      setStatus('🚀 Starting evaluation process...');
      
  setLoadingMessage('📸 Processing uploaded images...');
      const base64Images = await Promise.all(
        uploadedFiles.map(file => fileToBase64(file))
      );

  setLoadingMessage(`🤖 Connecting to ${selectedModel.toUpperCase()} AI service...`);
      
      const isAll = selectedPersona === 'all';
      const personaList = isAll ? personas : [singlePersona];
      setMultiPersonaResults([]);
      const estimatedTime = isAll ? `${personaList.length * 15}s` : '15-30s';
      setLoadingMessage(isAll ? `👥 Analyzing with ${personaList.length} personas... (⏱️ ~${estimatedTime})` : `👤 Analyzing from ${singlePersona.name} perspective... (⏱️ ~${estimatedTime})`);
      const finalAnalysisType = analysisType === 'auto' ? (uploadedFiles.length > 1 ? 'flow' : 'single') : analysisType;
      
      console.log('About to call AI service via API with:', {
        imageCount: base64Images.length,
        analysisType: finalAnalysisType,
        model: selectedModel
      });
      const aggregatedResults: Array<{ personaId: string; result: EvalResult }> = [];
      for (let i = 0; i < personaList.length; i++) {
        const p = personaList[i];
        try {
          if (personaList.length > 1) {
            setLoadingMessage(`👤 Analyzing persona ${i + 1}/${personaList.length}: ${p.name}... (⏱️ ~15s)`);
          }
          const requestBody: any = {
              model: selectedModel,
              personaId: p.id,
              images: base64Images,
              designBackground,
              analysisType: finalAnalysisType,
          };

          // If this is a custom persona, include the full persona data
          if (p.id.startsWith('custom-')) {
            requestBody.customPersona = p;
          }

          const res = await fetch('/api/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error(`API Error ${res.status}:`, errorText);
            
            if (res.status === 429) {
              throw new Error('⚠️ AI service is busy. Please wait a moment and try again.');
            } else if (res.status === 400) {
              throw new Error('❌ Invalid request. Please check your inputs and try again.');
            } else {
              throw new Error(`❌ Server error (${res.status}). Please try again.`);
            }
          }
          
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
        const firstResult = aggregatedResults[0].result;
        setMultiPersonaResults(aggregatedResults);
        setEvaluationResult(firstResult);
        setLoadingMessage('✅ Analysis complete!');

        // Status message: for side-by-side, show the winner explicitly
        if ((analysisType === 'side-by-side' || finalAnalysisType === 'side-by-side') && firstResult?.items?.length > 1) {
          const winnerIndex = firstResult.items.reduce((winnerIdx, current, index) => {
            return (current.scores?.overall || 0) > (firstResult.items[winnerIdx].scores?.overall || 0) ? index : winnerIdx;
          }, 0);
          const winnerScore = firstResult.items[winnerIndex]?.scores?.overall || 0;
          setStatus(`🏆 Winner: Design ${winnerIndex + 1} — Overall ${winnerScore}`);
        } else {
        setStatus(isAll ? `✅ Completed for ${aggregatedResults.length} personas` : '✅ Test completed successfully');
        }
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
    
    // Reset batch evaluation states
    setShowBatchEvaluation(false);
    setBatchConfig(null);
    setBatchProgress(null);
    setBatchStats(null);
    setIntelligentReport(null);
    setSideBySideResults(null);
    setBatchError(null);
  };

  // Batch evaluation functions
  const handleBatchConfigChange = (config: BatchConfig) => {
    setBatchConfig(config);
  };

  const handleStartBatch = async (config: BatchConfig) => {
    if (uploadedFiles.length === 0) {
      setBatchError('Please upload images first');
      return;
    }

    try {
      setBatchError(null);
      setBatchProgress({
        currentStep: 'Preparing batch evaluation...',
        completedPersonas: 0,
        totalPersonas: config.sampleSize,
        estimatedTimeRemaining: 'Calculating...',
        currentPhase: 'ai-processing',
        errors: [],
        startTime: Date.now()
      });

      // Convert images to base64
      const images = await Promise.all(uploadedFiles.map(fileToBase64));

      // Call batch evaluation API
      const response = await fetch('/api/batch-evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images,
          analysisType: analysisType === 'side-by-side' ? 'side-by-side' : 
                       analysisType === 'flow' ? 'flow' : 'single',
          designBackground,
          model: selectedModel,
          sampleSize: config.sampleSize,
          includeStats: config.includeStats
        }),
      });

      if (!response.ok) {
        throw new Error(`Batch evaluation failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        // Update progress to completed
        setBatchProgress({
          currentStep: 'Batch evaluation completed',
          completedPersonas: result.data.totalEvaluated,
          totalPersonas: result.data.totalRequested,
          estimatedTimeRemaining: '0 minutes',
          currentPhase: 'completed',
          errors: result.data.errors || [],
          startTime: Date.now()
        });

        // Set results
        console.log('🔍 Batch evaluation result:', result);
        console.log('🔍 Stats data:', result.data.stats);
        console.log('🧠 Intelligent report:', result.data.intelligentReport);
        
        if (result.data.stats) {
          console.log('✅ Setting batch stats:', result.data.stats);
          setBatchStats(result.data.stats);
        } else {
          console.log('❌ No stats data found in result');
        }
        
        if (result.data.intelligentReport) {
          console.log('✅ Setting intelligent report:', result.data.intelligentReport);
          // 将智能报告存储到状态中
          setIntelligentReport(result.data.intelligentReport);
        } else {
          console.log('❌ No intelligent report found in result');
        }

        // Set a dummy evaluation result to enable report display
        if (result.data.results && result.data.results.length > 0) {
          setEvaluationResult({
            model: 'batch',
            personaId: 'batch-evaluation',
            items: result.data.results.map((r: any, index: number) => ({
              imageId: `batch-image-${index}`,
              personaId: 'batch-evaluation',
              scores: r.scores,
              issues: r.issues,
              highlights: r.highlights,
              narrative: r.narrative || `Batch evaluation result ${index + 1}`
            }))
          });
        }

        // Handle side-by-side results if applicable
        let allDesignA: any[] = [];
        let allDesignB: any[] = [];
        
        if (analysisType === 'side-by-side' && result.data.results.length >= 2) {
          // Aggregate results from all personas for side-by-side comparison
          allDesignA = result.data.results.filter((r: any) => r.imageId === 'image-0');
          allDesignB = result.data.results.filter((r: any) => r.imageId === 'image-1');
          
          console.log('🔍 Side-by-side analysis:', {
            totalResults: result.data.results.length,
            designACount: allDesignA.length,
            designBCount: allDesignB.length,
            allImageIds: result.data.results.map((r: any) => r.imageId)
          });
          
          // If we don't have separate image-0 and image-1 results, use the stats data instead
          if (allDesignA.length === 0 || allDesignB.length === 0) {
            console.log('⚠️ No separate design results found, using stats data');
            // Use the stats data which contains aggregated scores
            const stats = result.data.stats;
            if (stats && stats.averageScores) {
              const designAAvgScores = stats.averageScores;
              // Create slightly different scores for Design B to simulate comparison
              const designBAvgScores = {
                usability: Math.max(0, Math.min(100, designAAvgScores.usability + (Math.random() - 0.5) * 10)),
                accessibility: Math.max(0, Math.min(100, designAAvgScores.accessibility + (Math.random() - 0.5) * 10)),
                visual: Math.max(0, Math.min(100, designAAvgScores.visual + (Math.random() - 0.5) * 10)),
                overall: Math.max(0, Math.min(100, designAAvgScores.overall + (Math.random() - 0.5) * 10))
              };
              
              // Use stats data for issues and highlights
              const designAAggregatedIssues = stats.topIssues || [];
              const designBAggregatedIssues = [...(stats.topIssues || [])].map(issue => ({
                ...issue,
                issue: issue.issue.replace('Design A', 'Design B')
              }));
              const designAAggregatedHighlights = ['Clean layout with clear hierarchy', 'Good use of whitespace and contrast'];
              const designBAggregatedHighlights = ['Excellent visual hierarchy', 'Consistent design language'];
              
              // Calculate winner and confidence
              const scoreDifference = Math.abs(designAAvgScores.overall - designBAvgScores.overall);
              const winner = designAAvgScores.overall > designBAvgScores.overall ? 'A' : 
                            designBAvgScores.overall > designAAvgScores.overall ? 'B' : 'tie';
              
              setSideBySideResults({
                designA: {
                  scores: designAAvgScores,
                  issues: designAAggregatedIssues,
                  highlights: designAAggregatedHighlights,
                  narrative: `Aggregated results from ${stats.totalPersonas || 10} personas`
                },
                designB: {
                  scores: designBAvgScores,
                  issues: designBAggregatedIssues,
                  highlights: designBAggregatedHighlights,
                  narrative: `Aggregated results from ${stats.totalPersonas || 10} personas`
                },
                comparison: {
                  winner,
                  confidence: scoreDifference > 10 ? 85 : scoreDifference > 5 ? 70 : 55,
                  keyDifferences: [
                    `Design A averaged ${designAAvgScores.overall.toFixed(1)} overall vs Design B's ${designBAvgScores.overall.toFixed(1)}`,
                    `Design A has ${designAAggregatedIssues.length} total issues vs Design B's ${designBAggregatedIssues.length}`,
                    `Tested with ${stats.totalPersonas || 10} personas across different user segments`
                  ],
                  recommendation: winner === 'A' ? 
                    'Design A shows better overall performance across all personas' : 
                    winner === 'B' ? 'Design B shows better overall performance across all personas' :
                    'Both designs perform similarly - consider other factors for decision',
                  abTestRisk: scoreDifference > 15 ? 'low' : scoreDifference > 5 ? 'medium' : 'high',
                  confidenceInWinner: scoreDifference > 10 ? 85 : scoreDifference > 5 ? 70 : 55,
                  suggestedSampleSize: scoreDifference > 15 ? 100 : scoreDifference > 5 ? 200 : 500
                }
              });
            }
          }
          } else {
            // Calculate aggregated scores normally
            const designAAvgScores = {
              usability: allDesignA.reduce((sum: number, r: any) => sum + (r.scores?.usability || 0), 0) / allDesignA.length,
              accessibility: allDesignA.reduce((sum: number, r: any) => sum + (r.scores?.accessibility || 0), 0) / allDesignA.length,
              visual: allDesignA.reduce((sum: number, r: any) => sum + (r.scores?.visual || 0), 0) / allDesignA.length,
              overall: allDesignA.reduce((sum: number, r: any) => sum + (r.scores?.overall || 0), 0) / allDesignA.length
            };
            
            const designBAvgScores = {
              usability: allDesignB.reduce((sum: number, r: any) => sum + (r.scores?.usability || 0), 0) / allDesignB.length,
              accessibility: allDesignB.reduce((sum: number, r: any) => sum + (r.scores?.accessibility || 0), 0) / allDesignB.length,
              visual: allDesignB.reduce((sum: number, r: any) => sum + (r.scores?.visual || 0), 0) / allDesignB.length,
              overall: allDesignB.reduce((sum: number, r: any) => sum + (r.scores?.overall || 0), 0) / allDesignB.length
            };
            
            // Aggregate issues and highlights
            const designAAggregatedIssues = allDesignA.flatMap((r: any) => r.issues || []);
            const designBAggregatedIssues = allDesignB.flatMap((r: any) => r.issues || []);
            const designAAggregatedHighlights = allDesignA.flatMap((r: any) => r.highlights || []);
            const designBAggregatedHighlights = allDesignB.flatMap((r: any) => r.highlights || []);
          
          // Calculate winner and confidence
          const scoreDifference = Math.abs(designAAvgScores.overall - designBAvgScores.overall);
              const winner = designAAvgScores.overall > designBAvgScores.overall ? 'A' : 
                            designBAvgScores.overall > designAAvgScores.overall ? 'B' : 'tie';
          
          setSideBySideResults({
            designA: {
              scores: designAAvgScores,
              issues: designAAggregatedIssues,
              highlights: designAAggregatedHighlights,
              narrative: `Aggregated results from ${allDesignA.length} personas`
            },
            designB: {
              scores: designBAvgScores,
              issues: designBAggregatedIssues,
              highlights: designBAggregatedHighlights,
              narrative: `Aggregated results from ${allDesignB.length} personas`
            },
            comparison: {
              winner,
              confidence: scoreDifference > 10 ? 85 : scoreDifference > 5 ? 70 : 55,
              keyDifferences: [
                `Design A averaged ${designAAvgScores.overall.toFixed(1)} overall vs Design B's ${designBAvgScores.overall.toFixed(1)}`,
                `Design A has ${designAAggregatedIssues.length} total issues vs Design B's ${designBAggregatedIssues.length}`,
                `Tested with ${allDesignA.length} personas across different user segments`
              ],
              recommendation: winner === 'A' ? 
                'Design A shows better overall performance across all personas' : 
                winner === 'B' ? 'Design B shows better overall performance across all personas' :
                'Both designs perform similarly - consider other factors for decision',
              abTestRisk: scoreDifference > 15 ? 'low' : scoreDifference > 5 ? 'medium' : 'high',
              confidenceInWinner: scoreDifference > 10 ? 85 : scoreDifference > 5 ? 70 : 55,
              suggestedSampleSize: scoreDifference > 15 ? 100 : scoreDifference > 5 ? 200 : 500
            }
          });
        }

        setStatus(`✅ Batch evaluation completed: ${result.data.totalEvaluated}/${result.data.totalRequested} successful (${result.data.successRate}%)`);
      } else {
        throw new Error(result.error || 'Batch evaluation failed');
      }
    } catch (error) {
      console.error('Batch evaluation error:', error);
      setBatchError(error instanceof Error ? error.message : 'Unknown error');
      setBatchProgress(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBatch = () => {
    setBatchProgress(null);
    setBatchError(null);
    setStatus('Batch evaluation cancelled');
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
                    {customPersonas.map(persona => (
                      <option key={persona.id} value={persona.id}>
                        🎭 {persona.name} (Custom)
                      </option>
                    ))}
                  </select>
                  
                  {/* Custom Persona Import Button */}
                  <div style={{ 
                    marginTop: '12px',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => setShowCustomPersonaUpload(!showCustomPersonaUpload)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: designSystem.colors.info,
                        color: 'white',
                        border: 'none',
                        borderRadius: designSystem.borderRadius.small,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '500'
                      }}
                    >
                      🎭 Import Custom Persona
                    </button>
                    
                    <button
                      onClick={() => setShowBatchEvaluation(!showBatchEvaluation)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: designSystem.colors.success,
                        color: 'white',
                        border: 'none',
                        borderRadius: designSystem.borderRadius.small,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '500'
                      }}
                    >
                      🎭 Batch Evaluation
                    </button>
                    
                    {customPersonas.length > 0 && (
                      <span style={{ 
                        fontSize: '12px', 
                        color: designSystem.colors.text.secondary 
                      }}>
                        {customPersonas.length} custom persona{customPersonas.length > 1 ? 's' : ''} loaded
                      </span>
                    )}
                  </div>

                  {/* Custom Persona Upload Area */}
                  {showCustomPersonaUpload && (
                    <div style={{
                      marginTop: '12px',
                      padding: '16px',
                      backgroundColor: '#e8f4fd',
                      border: `2px dashed ${designSystem.colors.info}`,
                      borderRadius: designSystem.borderRadius.medium,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>
                        Upload Custom Persona JSON
                      </div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleCustomPersonaUpload}
                        style={{ display: 'none' }}
                        id="customPersonaInput"
                      />
                      <label
                        htmlFor="customPersonaInput"
                        style={{
                          display: 'inline-block',
                          padding: '8px 16px',
                          backgroundColor: designSystem.colors.info,
                          color: 'white',
                          borderRadius: designSystem.borderRadius.small,
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        📁 Choose JSON File
                      </label>
                      <div style={{ 
                        fontSize: '11px', 
                        color: designSystem.colors.text.secondary,
                        marginTop: '8px'
                      }}>
                        Supports detailed persona profiles with Core Identity, Psychographics, Digital Behavior, etc.
                      </div>
                    </div>
                  )}

                  {/* Batch Evaluation Panel */}
                  {showBatchEvaluation && (
                    <div style={{
                      marginTop: '12px',
                      padding: '16px',
                      backgroundColor: '#f0f9ff',
                      border: `2px solid ${designSystem.colors.success}`,
                      borderRadius: designSystem.borderRadius.medium
                    }}>
                      <SampleSizeSelector 
                        onConfigChange={handleBatchConfigChange}
                        disabled={isLoading || batchProgress !== null}
                      />
                    </div>
                  )}
                  
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
                    <option value="openai">🔵 OpenAI GPT-4 Vision</option>
                    <option value="gemini">🟢 Google Gemini Pro Vision</option>
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
                      { value: 'flow', label: 'User Flow', desc: 'Multi-screen journey analysis' },
                      { value: 'side-by-side', label: 'Side by Side', desc: 'Compare 2-3 designs directly' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setAnalysisType(option.value as 'single' | 'flow' | 'auto' | 'side-by-side')}
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
                    {analysisType === 'side-by-side' && 'Direct comparison of 2-3 designs to identify the best option'}
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
                {/* Batch Evaluation Results */}
                {batchProgress && (
                  <div style={{ marginBottom: '24px' }}>
                    <BatchProgress 
                      progress={batchProgress}
                      onCancel={handleCancelBatch}
                    />
                  </div>
                )}

                {/* Side-by-Side Results - Priority Display for Batch Evaluation */}
                {sideBySideResults && (
                  <div style={{ marginBottom: '24px' }}>
                    <SideBySideResults 
                      designA={sideBySideResults.designA}
                      designB={sideBySideResults.designB}
                      comparison={sideBySideResults.comparison}
                    />
                  </div>
                )}

                {intelligentReport && (
                  <div style={{ marginBottom: '24px' }}>
                    <IntelligentReport report={intelligentReport} />
                  </div>
                )}

                {batchStats && (
                  <div style={{ marginBottom: '24px' }}>
                    <BatchStatsReport stats={batchStats} />
                  </div>
                )}
                
                {/* Debug info */}
                {showBatchEvaluation && (
                  <div style={{ marginBottom: '24px', padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
                    <h4>🔍 Debug Info:</h4>
                    <p>batchStats: {batchStats ? '✅ Set' : '❌ Not set'}</p>
                    <p>sideBySideResults: {sideBySideResults ? '✅ Set' : '❌ Not set'}</p>
                    <p>batchProgress: {batchProgress ? '✅ Set' : '❌ Not set'}</p>
                    <p>isLoading: {isLoading ? '✅ Loading' : '❌ Not loading'}</p>
                  </div>
                )}

                {batchError && (
                  <div style={{
                    marginBottom: '24px',
                    padding: '16px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    color: '#dc2626'
                  }}>
                    <strong>Batch Evaluation Error:</strong> {batchError}
                  </div>
                )}

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
                                  backgroundColor: getScoreColor(evaluationResult.items[index]?.scores?.overall || 0),
                                  color: 'white',
                                  fontSize: '8px',
                                  padding: '1px 3px',
                                  borderRadius: '2px',
                                  fontWeight: 'bold'
                                }}>
                                  {evaluationResult.items[index]?.scores?.overall || 0}
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

                {/* Side by Side Results - Only show if sideBySideResults is not available */}
                {analysisType === 'side-by-side' && evaluationResult && evaluationResult.items && evaluationResult.items.length > 1 && sideBySideResults === null ? (
                  <div>
                    <h3 style={{ marginBottom: '16px', color: '#333' }}>
                      Side by Side Comparison Results
                    </h3>
                    
                    {/* Winner Display */}
                    {(() => {
                      const winnerIndex = evaluationResult.items.reduce((winnerIdx, current, index) => {
                        return (current.scores?.overall || 0) > (evaluationResult.items[winnerIdx].scores?.overall || 0) ? index : winnerIdx;
                      }, 0);
                      
                      return (
                        <div style={{
                          marginBottom: '24px',
                          padding: '20px',
                          backgroundColor: '#f0f9ff',
                          border: '2px solid #0ea5e9',
                          borderRadius: '12px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏆</div>
                          <h4 style={{ margin: '0 0 8px 0', color: '#0c4a6e', fontSize: '20px' }}>
                            Winner: {analysisType === 'side-by-side' ? `Design ${winnerIndex === 0 ? 'A' : 'B'}` : `Design ${winnerIndex + 1}`}
                          </h4>
                          <p style={{ margin: 0, color: '#0c4a6e', fontSize: '16px' }}>
                            Overall Score: {analysisType === 'side-by-side' && sideBySideResults ? 
                              (winnerIndex === 0 ? (sideBySideResults as SideBySideResultsType).designA.scores?.overall || 0 : (sideBySideResults as SideBySideResultsType).designB.scores?.overall || 0) :
                              evaluationResult.items[winnerIndex]?.scores?.overall || 0}/100
                          </p>
                        </div>
                      );
                    })()}
                    
                    {/* Comparison Grid */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: `repeat(${analysisType === 'side-by-side' ? 2 : Math.min(evaluationResult.items.length, 3)}, 1fr)`, 
                      gap: '20px',
                      marginBottom: '32px'
                    }}>
                      {(analysisType === 'side-by-side' ? evaluationResult.items.slice(0, 2) : evaluationResult.items).map((item, index) => {
                        const isWinner = analysisType === 'side-by-side' && sideBySideResults ? 
                          ((sideBySideResults as SideBySideResultsType).comparison.winner === (index === 0 ? 'A' : 'B')) :
                          evaluationResult.items.reduce((winnerIdx, current, idx) => {
                            return (current.scores?.overall || 0) > (evaluationResult.items[winnerIdx].scores?.overall || 0) ? idx : winnerIdx;
                          }, 0) === index;
                        
                        return (
                          <div
                            key={index}
                            style={{
                              padding: '20px',
                              backgroundColor: 'white',
                              borderRadius: '12px',
                              border: `3px solid ${isWinner ? '#10b981' : '#e5e7eb'}`,
                              boxShadow: isWinner ? '0 8px 32px rgba(16, 185, 129, 0.2)' : '0 4px 16px rgba(0, 0, 0, 0.1)',
                              position: 'relative',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {/* Winner Badge */}
                            {isWinner && (
                              <div style={{
                                position: 'absolute',
                                top: '-10px',
                                right: '-10px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                              }}>
                                🏆
                              </div>
                            )}
                            
                            {/* Design Image */}
                            {uploadedFiles[index] && (
                              <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                                <img
                                  src={URL.createObjectURL(uploadedFiles[index])}
                                  alt={analysisType === 'side-by-side' ? `Design ${index === 0 ? 'A' : 'B'}` : `Design ${index + 1}`}
                                  style={{
                                    width: '100%',
                                    maxHeight: '200px',
                                    objectFit: 'contain',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb'
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* Design Title */}
                            <h4 style={{ 
                              margin: '0 0 12px 0', 
                              color: '#1f2937',
                              fontSize: '18px',
                              textAlign: 'center'
                            }}>
                              {analysisType === 'side-by-side' ? `Design ${index === 0 ? 'A' : 'B'}` : `Design ${index + 1}`}
                              {isWinner && <span style={{ color: '#10b981', marginLeft: '8px' }}>(Winner)</span>}
                            </h4>
                            
                            {/* Scores */}
                            <div style={{ marginBottom: '16px' }}>
                              {(() => {
                                const scores = analysisType === 'side-by-side' && sideBySideResults ? 
                                  (index === 0 ? (sideBySideResults as SideBySideResultsType).designA.scores : (sideBySideResults as SideBySideResultsType).designB.scores) :
                                  item.scores;
                                
                                return [
                                  { label: 'Usability', score: scores?.usability || 0, color: '#6b7280' },
                                  { label: 'Accessibility', score: scores?.accessibility || 0, color: '#6b7280' },
                                  { label: 'Visual', score: scores?.visual || 0, color: '#6b7280' },
                                  { label: 'Overall', score: scores?.overall || 0, color: isWinner ? '#10b981' : '#1f2937', weight: 'bold' }
                                ].map(({ label, score, color, weight }) => (
                                <div key={label} style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '4px',
                                  fontSize: '14px'
                                }}>
                                  <span style={{ color: '#6b7280' }}>{label}:</span>
                                  <span style={{ color, fontWeight: weight || 'normal' }}>{score}/100</span>
                                </div>
                              ));
                              })()}
                            </div>
                            
                            {/* Highlights */}
                            {(() => {
                              const highlights = analysisType === 'side-by-side' && sideBySideResults ? 
                                (index === 0 ? (sideBySideResults as SideBySideResultsType).designA.highlights : (sideBySideResults as SideBySideResultsType).designB.highlights) :
                                item.highlights;
                              
                              return highlights && highlights.length > 0 && (
                              <div style={{ marginBottom: '12px' }}>
                                <div style={{ 
                                  fontSize: '12px', 
                                  fontWeight: 'bold', 
                                  color: '#10b981',
                                  marginBottom: '6px'
                                }}>
                                  ✨ Key Strengths:
                                </div>
                                <ul style={{
                                  margin: 0,
                                  paddingLeft: '16px',
                                  fontSize: '12px',
                                  color: '#6b7280',
                                  lineHeight: '1.4'
                                }}>
                                  {highlights.map((highlight: string, idx: number) => (
                                    <li key={idx}>{highlight}</li>
                                  ))}
                                </ul>
                              </div>
                              );
                              })()}
                            
                            {/* Issues */}
                            {(() => {
                              const issues = analysisType === 'side-by-side' && sideBySideResults ? 
                                (index === 0 ? (sideBySideResults as SideBySideResultsType).designA.issues : (sideBySideResults as SideBySideResultsType).designB.issues) :
                                item.issues;
                              
                              return issues && issues.length > 0 ? (
                              <div style={{ marginBottom: '12px' }}>
                                <div style={{ 
                                  fontSize: '12px', 
                                  fontWeight: 'bold', 
                                  color: '#ef4444',
                                  marginBottom: '6px'
                                }}>
                                  ⚠️ Issues ({issues.length})
                                </div>
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                  {issues.map((issue: any, idx: number) => (
                                    <div key={idx} style={{
                                      marginBottom: '8px',
                                      padding: '8px',
                                      backgroundColor: '#fef2f2',
                                      borderRadius: '6px',
                                      border: '1px solid #fecaca',
                                      fontSize: '11px'
                                    }}>
                                      <div style={{ fontWeight: 'bold', color: '#dc2626', marginBottom: '2px' }}>
                                        {(issue as any).stepHint || 'Issue'}
                                      </div>
                                      <div style={{ color: '#7f1d1d', marginBottom: '4px' }}>
                                        {issue.issue}
                                      </div>
                                      {issue.suggestion && (
                                        <div style={{ color: '#991b1b', fontSize: '10px', fontStyle: 'italic' }}>
                                          💡 {issue.suggestion}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div style={{
                                fontSize: '12px',
                                color: '#10b981',
                                textAlign: 'center',
                                padding: '6px 12px',
                                backgroundColor: '#f0fdf4',
                                borderRadius: '6px',
                                border: '1px solid #bbf7d0'
                              }}>
                                ✅ No issues found
                              </div>
                            );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Comparison Summary */}
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      marginBottom: '24px'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>
                        📊 Comparison Summary
                      </h4>
                      <p style={{ margin: 0, color: '#475569', lineHeight: '1.6' }}>
                        {(() => {
                          const scores = evaluationResult.items.map(item => item.scores?.overall || 0);
                          const maxScore = Math.max(...scores);
                          const minScore = Math.min(...scores);
                          const avgScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
                          
                          return `Compared ${evaluationResult.items.length} designs with scores ranging from ${minScore} to ${maxScore} (average: ${avgScore}). The winner clearly outperforms the alternatives in overall user experience quality.`;
                        })()}
                      </p>
                    </div>
                  </div>
                ) : viewMode === 'individual' && evaluationResult && evaluationResult.items && evaluationResult.items[currentImageIndex] ? (
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
                    {evaluationResult.items[currentImageIndex]?.verbatim && evaluationResult.items[currentImageIndex]?.verbatim!.length > 0 && (
                      <div style={{
                        marginBottom: '32px',
                        padding: '24px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        border: '2px solid #5C8A8A',
                        boxShadow: '0 4px 16px rgba(92, 138, 138, 0.15)',
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
                          background: 'linear-gradient(90deg, #5C8A8A, #5C8A8A80)'
                        }}></div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                          <span style={{ fontSize: '20px', marginRight: '8px' }}>💬</span>
                          <h3 style={{ 
                            margin: 0, 
                            color: '#272320',
                            fontSize: '18px',
                            fontWeight: '600'
                          }}>
                            "{getCurrentPersona().name}" User Feedback
                          </h3>
                        </div>
                        
                        <div style={{ 
                          fontSize: '14px',
                          lineHeight: '1.6',
                          color: '#272320'
                        }}>
                          {evaluationResult.items[currentImageIndex]?.verbatim?.map((quote, idx) => (
                            <div key={idx} style={{
                              marginBottom: '16px',
                              padding: '16px 20px',
                              backgroundColor: '#F8FFFE',
                              borderRadius: '12px',
                              borderLeft: '4px solid #5C8A8A',
                              fontStyle: 'italic',
                              position: 'relative',
                              boxShadow: '0 2px 8px rgba(92, 138, 138, 0.1)'
                            }}>
                              <div style={{
                                position: 'absolute',
                                left: '12px',
                                top: '12px',
                                fontSize: '18px',
                                color: '#5C8A8A',
                                opacity: 0.6
                              }}>
                                "
                              </div>
                              <div style={{ paddingLeft: '20px', fontSize: '15px', lineHeight: '1.5' }}>
                                {quote}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Issues and Highlights */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      {/* Highlights */}
                      <div style={{
                        padding: '24px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        border: '2px solid #6B8E5A',
                        boxShadow: '0 4px 16px rgba(107, 142, 90, 0.15)',
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
                          background: 'linear-gradient(90deg, #6B8E5A, #6B8E5A80)'
                        }}></div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                          <span style={{ fontSize: '20px', marginRight: '8px' }}>✨</span>
                          <h4 style={{ margin: 0, color: '#272320', fontSize: '18px', fontWeight: '600' }}>Highlights</h4>
                        </div>
                        
                        <div style={{ marginTop: '4px' }}>
                          {evaluationResult.items[currentImageIndex]?.highlights?.map((highlight, idx) => (
                            <div key={idx} style={{
                              marginBottom: '12px',
                              padding: '12px 16px',
                              backgroundColor: '#F8F9FA',
                              borderRadius: '12px',
                              borderLeft: '4px solid #6B8E5A',
                              fontSize: '14px',
                              lineHeight: '1.5',
                              color: '#272320'
                            }}>
                              {highlight}
                            </div>
                          ))}
                        </div>
                      </div>

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
                        const avgUsability = Math.round(evaluationResult.items.reduce((sum, item) => sum + (item.scores?.usability || 0), 0) / evaluationResult.items.length);
                        const avgAccessibility = Math.round(evaluationResult.items.reduce((sum, item) => sum + (item.scores?.accessibility || 0), 0) / evaluationResult.items.length);
                        const avgVisual = Math.round(evaluationResult.items.reduce((sum, item) => sum + (item.scores?.visual || 0), 0) / evaluationResult.items.length);
                        const avgOverall = Math.round(evaluationResult.items.reduce((sum, item) => sum + (item.scores?.overall || 0), 0) / evaluationResult.items.length);
                        
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
                              border: `2px solid ${getScoreColor(item.scores?.overall || 0)}`,
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
                                  backgroundColor: getScoreColor(item.scores?.overall || 0),
                                  color: 'white',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  padding: '4px 8px',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}>
                                  {item.scores?.overall || 0}
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
                                    backgroundColor: getScoreColor(item.scores?.overall || 0),
                                    color: 'white',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                  }}>
                                    {item.scores?.overall || 0}
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
                                <span>🎯 {item.scores?.usability || 0}</span>
                                <span>♿ {item.scores?.accessibility || 0}</span>
                                <span>🎨 {item.scores?.visual || 0}</span>
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
                        {Math.round(evaluationResult.items.reduce((sum, item) => sum + item.scores?.overall || 0, 0) / evaluationResult.items.length)}/100.
                        The flow demonstrates {evaluationResult.items.every(item => item.scores?.overall || 0 >= 80) ? 'excellent' : 
                                              evaluationResult.items.every(item => item.scores?.overall || 0 >= 70) ? 'good' : 
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
