import { NextResponse } from 'next/server';

export async function GET() {
  // 可在此做更细的依赖检查（如必需环境变量）
  return NextResponse.json({ status: 'ok', time: new Date().toISOString() }, { status: 200 });
}
