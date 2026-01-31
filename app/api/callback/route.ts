// app/api/callback/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received NanoBanana callback:', JSON.stringify(body, null, 2));

    // Support both payload variants found in search
    const taskId = body.data?.taskId || body.task_id || body.taskId;
    const code = body.code !== undefined ? body.code : (body.status === 'success' ? 200 : 500);
    const isSuccess = code === 200 || body.status === 'success';

    if (!taskId) {
      return Response.json({ code: 400, msg: 'Missing taskId' }, { status: 400 });
    }

    // Find the task in our database
    const task = await prisma.generationTask.findUnique({
      where: { taskId: String(taskId) },
      include: { user: true }
    });

    if (!task) {
      console.warn(`Task not found in database: ${taskId}`);
      return Response.json({ code: 200, msg: 'Task not found, but acknowledged' });
    }

    // If task is already processed, just return success (idempotent)
    if (task.status !== 'pending') {
      return Response.json({ code: 200, msg: 'Task already processed' });
    }

    if (isSuccess) {
      // Task succeeded
      await prisma.generationTask.update({
        where: { id: task.id },
        data: { status: 'success' }
      });
      console.log(`Task ${taskId} succeeded`);
    } else {
      // Task failed, refund points
      console.log(`Task ${taskId} failed (code: ${code}), refunding ${task.cost} points to user ${task.userId}`);
      
      await prisma.$transaction([
        prisma.user.update({
          where: { id: task.userId },
          data: { 
            balance: { increment: task.cost },
            pointsHistory: {
              create: {
                amount: task.cost,
                type: 'refund',
                description: `生成失败退回积分 (${task.model}) - 任务 ID: ${taskId}`,
              }
            }
          }
        }),
        prisma.generationTask.update({
          where: { id: task.id },
          data: { status: 'failed' }
        })
      ]);
    }

    return Response.json({ code: 200, msg: 'Callback processed' });
  } catch (error: any) {
    console.error('Error processing callback:', error);
    return Response.json({ code: 500, msg: 'Internal server error' }, { status: 500 });
  }
}
