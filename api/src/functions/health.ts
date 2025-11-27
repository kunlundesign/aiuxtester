import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

async function health(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Health check requested');
  
  try {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      },
      services: {
        azure_openai: {
          configured: !!(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT),
          endpoint: process.env.AZURE_OPENAI_ENDPOINT ? 'configured' : 'missing',
        },
        gemini: {
          configured: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY),
        },
        zhipu: {
          configured: !!process.env.ZHIPU_API_KEY,
        },
        blob_storage: {
          configured: !!process.env.AZURE_STORAGE_CONNECTION_STRING,
        }
      }
    };

    return {
      jsonBody: healthData,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    };
  } catch (error) {
    context.error('Health check failed:', error);
    return {
      status: 503,
      jsonBody: {
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
      }
    };
  }
}

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: health
});
