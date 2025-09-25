'use client';

import React, { useState } from 'react';

export default function HomePage() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedPersona, setSelectedPersona] = useState('technical');
  const [selectedModel, setSelectedModel] = useState('gemini');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Upload screenshots to begin evaluation');
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  const personas = [
    { id: 'technical', name: '👨‍💻 Technical User' },
    { id: 'business', name: '👩‍💼 Business User' },
    { id: 'casual', name: '👤 Casual User' }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(files);
    setStatus(`${files.length} screenshot(s) uploaded`);
  };

  const handleRunSimulation = async () => {
    if (uploadedFiles.length === 0) {
      setStatus('Please upload at least one screenshot');
      return;
    }

    setIsLoading(true);
    setStatus('🚀 Running AI evaluation...');

    try {
      // Mock result for testing
      const mockResult = {
        model: selectedModel,
        persona: selectedPersona,
        items: [
          {
            id: '1',
            score: 8.5,
            feedback: 'Great user interface design',
            category: 'UI/UX'
          },
          {
            id: '2', 
            score: 7.2,
            feedback: 'Navigation could be improved',
            category: 'Navigation'
          }
        ]
      };

      setEvaluationResult(mockResult);
      setStatus('✅ Evaluation completed successfully');
    } catch (error) {
      console.error('Evaluation failed:', error);
      setStatus('❌ Evaluation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#007bff', marginBottom: '20px' }}>
        🤖 AI Scenario Simulator
      </h1>

      {/* Status */}
      <div style={{ 
        padding: '12px', 
        backgroundColor: '#f8f9fa', 
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <strong>Status:</strong> {status}
      </div>

      {/* Persona Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Select Persona:
        </label>
        <select 
          value={selectedPersona} 
          onChange={(e) => setSelectedPersona(e.target.value)}
          style={{ padding: '8px', width: '200px' }}
        >
          {personas.map(persona => (
            <option key={persona.id} value={persona.id}>
              {persona.name}
            </option>
          ))}
        </select>
      </div>

      {/* Model Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          AI Model:
        </label>
        <select 
          value={selectedModel} 
          onChange={(e) => setSelectedModel(e.target.value)}
          style={{ padding: '8px', width: '200px' }}
        >
          <option value="gemini">Google Gemini</option>
          <option value="gpt4">OpenAI GPT-4</option>
        </select>
      </div>

      {/* File Upload */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Upload Screenshots:
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          style={{ marginBottom: '10px' }}
        />
        {uploadedFiles.length > 0 && (
          <div>
            <p>{uploadedFiles.length} file(s) selected:</p>
            <ul>
              {uploadedFiles.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Run Button */}
      <button
        onClick={handleRunSimulation}
        disabled={isLoading || uploadedFiles.length === 0}
        style={{
          backgroundColor: isLoading ? '#6c757d' : '#7535FF',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {isLoading ? '⏳ Running...' : '🚀 Run Evaluation'}
      </button>

      {/* Results */}
      {evaluationResult && (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '8px',
          border: '2px solid #7535FF'
        }}>
          <h2 style={{ color: '#7535FF' }}>🎯 Evaluation Results</h2>
          <p><strong>Model:</strong> {evaluationResult.model}</p>
          <p><strong>Persona:</strong> {evaluationResult.persona}</p>
          <p><strong>Items Found:</strong> {evaluationResult.items?.length || 0}</p>
          
          <button
            onClick={() => {
              setEvaluationResult(null);
              setStatus('Upload screenshots to begin evaluation');
            }}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            🔄 Clear Results
          </button>

          <details style={{ marginTop: '15px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              📋 Raw Data (click to expand)
            </summary>
            <pre style={{ 
              backgroundColor: 'white', 
              padding: '10px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '300px',
              marginTop: '10px'
            }}>
              {JSON.stringify(evaluationResult, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
