import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { createAIAdapter } from '@/lib/ai-adapters';
import { convertToStandardPersona } from '@/lib/persona-converter';
import { generateStats } from '@/lib/stats-engine';
import { intelligentAggregator, PersonaInsight } from '@/lib/intelligent-aggregator';

const BatchEvaluateRequestSchema = z.object({
  images: z.array(z.string()).min(1).max(10),
  analysisType: z.enum(['single', 'flow', 'side-by-side']).optional(),
  designBackground: z.string().optional(),
  model: z.enum(['openai', 'gemini', 'zhipu']).default('openai'),
  sampleSize: z.number().min(1).max(1000).default(100),
  includeStats: z.boolean().default(true)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = BatchEvaluateRequestSchema.parse(body);
    
    const { images, analysisType, designBackground, model, sampleSize, includeStats } = validatedData;

    console.log(`🎭 Starting batch evaluation with ${sampleSize} personas`);

    // 读取persona文件
    const personasDir = path.join(process.cwd(), 'public', 'personas');
    const personaFiles = fs.readdirSync(personasDir).filter(file => file.endsWith('.json'));
    
    if (personaFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No persona files found' },
        { status: 400 }
      );
    }

    // 随机选择指定数量的persona
    const selectedPersonas = personaFiles
      .sort(() => Math.random() - 0.5)
      .slice(0, sampleSize);

    console.log(`📁 Found ${personaFiles.length} persona files, selected ${selectedPersonas.length} for evaluation`);

    interface BatchEvalSuccess {
      personaId: string;
      personaName: string;
      items: any[]; // Simplified; could import ImageEval for stricter typing
      model: string;
    }
    interface BatchEvalError { personaId: string; error: string; }

    const results: BatchEvalSuccess[] = [];
    const allScores: { usability: number; accessibility: number; visual: number; overall: number; }[] = [];
    // Conform to stats-engine Issue interface (stepHint, issue, severity, suggestion)
    const allIssues: { stepHint: string; issue: string; severity: 'low' | 'medium' | 'high'; suggestion: string; }[] = [];
    const personaMetadata: { age: number; occupation: string; personalityType: string; }[] = [];
    const errors: BatchEvalError[] = [];

    // 并发处理配置
    const CONCURRENT_LIMIT = 10;
    const adapter = createAIAdapter(model);

    // 分批处理persona
    for (let i = 0; i < selectedPersonas.length; i += CONCURRENT_LIMIT) {
      const batch = selectedPersonas.slice(i, i + CONCURRENT_LIMIT);
      
      console.log(`🔄 Processing batch ${Math.floor(i / CONCURRENT_LIMIT) + 1}/${Math.ceil(selectedPersonas.length / CONCURRENT_LIMIT)} (${batch.length} personas)`);

      // 并发处理当前批次
      const batchPromises = batch.map(async (personaFile) => {
        const personaId = personaFile.replace('.json', '');
        let personaData: any = null;
        try {
          console.log(`🔄 Processing persona ${personaId}...`);
          
          // 读取persona数据
          personaData = JSON.parse(
            fs.readFileSync(path.join(personasDir, personaFile), 'utf8')
          );
          console.log(`✅ Read persona data for ${personaId}`);

          // 转换为标准格式
          const standardPersona = convertToStandardPersona(personaData, personaId);
          console.log(`✅ Converted persona ${personaId} to standard format`);

          // 执行AI评估
          const inferredType = analysisType || (images.length > 1 ? 'flow' : 'single');
          console.log(`🔄 Starting AI evaluation for ${personaId} with type ${inferredType}`);
          const evaluationResult = await adapter.evaluate(images, standardPersona, designBackground, inferredType);
          console.log(`✅ AI evaluation completed for ${personaId}`);

          // The AI adapter returns an EvalResult object directly, not wrapped in a success/error structure
          const result: BatchEvalSuccess = {
            personaId,
            personaName: standardPersona.name,
            model: evaluationResult.model,
            items: evaluationResult.items || []
          };

          // 收集数据用于统计分析
          if (evaluationResult.items && evaluationResult.items.length > 0) {
            const firstItem: any = evaluationResult.items[0];
            console.log('🔍 Collecting data from persona:', personaId, {
              hasScores: !!firstItem.scores,
              hasIssues: !!firstItem.issues,
              scoresValue: firstItem.scores,
              issuesValue: firstItem.issues
            });
            if (firstItem.scores) {
              allScores.push(firstItem.scores);
            }
            if (Array.isArray(firstItem.issues)) {
              firstItem.issues.forEach((iss: any) => {
                allIssues.push({
                  stepHint: iss.stepHint || '',
                  issue: iss.issue || iss.description || 'Unknown issue',
                  severity: (iss.severity || 'medium').toLowerCase() as 'low' | 'medium' | 'high',
                  suggestion: iss.suggestion || iss.recommendation || ''
                });
              });
            }
          } else {
            console.log('❌ No items found in evaluation result for persona:', personaId);
          }
          personaMetadata.push({
            age: standardPersona.age || 25,
            occupation: standardPersona.occupation || 'Unknown',
            personalityType: standardPersona.personalityType || 'Unknown'
          });
          return { success: true as const, data: result };

        } catch (error) {
          console.error(`❌ Error evaluating persona ${personaFile}:`, error);
          console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            console.error('Persona data keys:', personaData ? Object.keys(personaData) : 'No persona data');
          return {
            success: false as const,
            error: error instanceof Error ? error.message : 'Unknown error',
            personaId
          };
        }
      });

      // 等待当前批次完成
      const batchResults = await Promise.allSettled(batchPromises);
      
      // 处理批次结果
      batchResults.forEach((res) => {
        if (res.status === 'fulfilled') {
          const v = res.value;
            if (v.success) {
              results.push(v.data);
            } else {
              errors.push({ personaId: v.personaId || 'unknown', error: v.error || 'Unknown error' });
            }
        } else {
          errors.push({ personaId: 'unknown', error: (res.reason && (res.reason.message || String(res.reason))) || 'Promise rejected' });
        }
      });

      // 更新进度
      const completed = Math.min(i + CONCURRENT_LIMIT, selectedPersonas.length);
      console.log(`✅ Completed ${completed}/${selectedPersonas.length} personas`);
    }

    // 生成统计报告和智能洞察
    let stats = null;
    let intelligentReport = null;
    
    if (includeStats && results.length > 0) {
      console.log('🔍 Generating stats with:', {
        scoresCount: allScores.length,
        issuesCount: allIssues.length,
        metadataCount: personaMetadata.length
      });
      stats = generateStats(allScores, allIssues, personaMetadata);
      console.log('✅ Generated stats:', stats);
      
      // 生成智能聚合报告
      console.log('🧠 Generating intelligent insights...');
      const personaInsights: PersonaInsight[] = results.map((result, index) => ({
        personaId: result.personaId,
        personaName: result.personaName || result.personaId,
        occupation: personaMetadata[index]?.occupation || 'Unknown',
        personalityType: personaMetadata[index]?.personalityType || 'Unknown',
        scores: result.items[0]?.scores || { usability: 0, accessibility: 0, visual: 0, overall: 0 },
        highlights: result.items[0]?.highlights || [],
        issues: result.items[0]?.issues || []
      }));
      
      intelligentReport = intelligentAggregator.generateIntelligentReport(personaInsights);
      console.log('✅ Generated intelligent report with', intelligentReport.keyInsights.primaryStrengths.length, 'key strengths');
    } else {
      console.log('❌ No stats generated:', { includeStats, resultsLength: results.length });
    }

    const response = {
      success: true,
      data: {
        totalEvaluated: results.length,
        totalRequested: sampleSize,
        successRate: (results.length / sampleSize * 100).toFixed(1),
        results,
        stats,
        intelligentReport,
        errors: errors.length > 0 ? errors : undefined,
        metadata: {
          sampleSize: selectedPersonas.length,
          analysisType: analysisType || 'auto-detect',
          model,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - Date.now() // 这里可以添加实际的处理时间计算
        }
      }
    };

    console.log(`🎉 Batch evaluation completed: ${results.length}/${sampleSize} successful (${response.data.successRate}%)`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Batch evaluation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request format', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
