// app/api/task/[taskId]/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    // Check our local DB first to see if it's already failed/refunded
    const localTask = await prisma.generationTask.findUnique({
      where: { taskId: String(taskId) }
    });

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
    
    // If NanoBanana API says it failed, and our local task is still pending, trigger refund
    const apiCode = data.code;
    const apiStatus = data.data?.status; // Some versions use data.status
    
    const isFailed = (apiCode !== 200 && apiCode !== 0 && apiCode !== undefined) || 
                     (apiStatus === 'failed' || apiStatus === 'error');

    if (isFailed && localTask && localTask.status === 'pending') {
      console.log(`Polling detected failure for task ${taskId}, triggering refund...`);
      await prisma.$transaction([
        prisma.user.update({
          where: { id: localTask.userId },
          data: { 
            balance: { increment: localTask.cost },
            pointsHistory: {
              create: {
                amount: localTask.cost,
                type: 'refund',
                description: `生成失败退回积分 (${localTask.model}) - 任务 ID: ${taskId} (通过轮询检测)`,
              }
            }
          }
        }),
        prisma.generationTask.update({
          where: { id: localTask.id },
          data: { status: 'failed' }
        })
      ]);
    } else if ((apiCode === 200 || apiCode === 0) && localTask && localTask.status === 'pending') {
      // If NanoBanana API says it's done (and we have resultImageUrl), mark as success
      // Note: We only mark as success if it's actually finished. 
      // Most APIs return 200 even when pending, but status field varies.
      // Based on typical behavior, if data.data.info.resultImageUrl exists, it's done.
      const resultImageUrl = data.data?.info?.resultImageUrl || data.data?.resultImageUrl;
      if (resultImageUrl) {
        await prisma.generationTask.update({
          where: { id: localTask.id },
          data: { status: 'success' }
        });
      }
    }

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
