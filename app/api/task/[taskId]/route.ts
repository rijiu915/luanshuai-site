// app/api/task/[taskId]/route.ts
import { NextRequest } from 'next/server';

const API_KEY = process.env.NANOBANANA_API_KEY;

/**
 * 查询 NanoBanana 任务状态（兼容 Next.js 15+）
 * 使用官方接口: GET /api/v1/nanobanana/record-info?taskId=xxx
 */
export async function GET(
  _req: NextRequest,
  // ✅ 关键：params 类型必须是 Promise
  { params }: { params: Promise<{ taskId: string }> }
) {
  // ✅ 关键：必须 await params 才能访问 taskId
  const { taskId } = await params;

  // 🔍 严格校验 taskId
  if (!taskId || typeof taskId !== 'string' || taskId.trim() === '' || taskId === 'undefined') {
    return Response.json(
      { code: 400, message: 'Invalid taskId parameter' },
      { status: 400 }
    );
  }

  if (!API_KEY) {
    console.error('❌ Missing NANOBANANA_API_KEY in environment variables');
    return Response.json(
      { code: 500, message: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    const url = new URL('https://api.nanobananaapi.ai/api/v1/nanobanana/record-info');
    url.searchParams.set('taskId', taskId);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
    });

    const data = await res.json();
    return Response.json(data, { status: res.status });

  } catch (error) {
    console.error('💥 Error fetching task status from NanoBanana:', error);
    return Response.json(
      { code: 500, message: 'Failed to query image generation task status' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';