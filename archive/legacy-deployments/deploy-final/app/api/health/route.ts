import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 🔍 基础健康检查
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.4.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      },
    };

    // 🧪 AI服务可用性检查
    const aiHealth = checkAIServices();
    
    return NextResponse.json({
      ...healthData,
      services: aiHealth,
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}

function checkAIServices() {
  const services = {
    azure_openai: {
      configured: !!(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT),
      endpoint: process.env.AZURE_OPENAI_ENDPOINT ? 'configured' : 'missing',
    },
    gemini: {
      configured: !!process.env.GEMINI_API_KEY,
    },
    zhipu: {
      configured: !!process.env.ZHIPU_API_KEY,
    },
  };
  
  return services;
}