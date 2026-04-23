// app/api/generate/route.ts
import { NextRequest } from 'next/server';
import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ code: 401, msg: 'Please login first' }, { status: 401 });
  }

  const { prompt, type, aspectRatio, imageUrls, model, resolution } = await req.json();

    // 💰 Calculate points (3x multiplier applied)
    let cost = 15;
    if (model === 'nano-banana-pro') {
      cost = resolution === '4K' ? 90 : 60;
    }

    // Check balance and user info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json({ code: 404, msg: 'User not found' }, { status: 404 });
    }

    // Apply VIP discounts
    if (user.vipLevel === 'VIP') {
      cost = Math.max(0, cost - 3);
    } else if (user.vipLevel === 'SVIP') {
      cost = Math.max(0, cost - 5);
    }

    if (user.balance < cost) {
      return Response.json({ code: 403, msg: `Insufficient balance. Need ${cost} points.` }, { status: 403 });
    }


  // 🔑 Token 校验
  const token = process.env.NANOBANANA_API_KEY;
  if (!token) {
    return Response.json({ code: 401, msg: 'Missing NANOBANANA_API_KEY' }, { status: 401 });
  }

  // 🌐 回调地址校验
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    return Response.json(
      { code: 500, msg: 'Missing NEXT_PUBLIC_SITE_URL in environment variables' },
      { status: 500 }
    );
  }

  // 📝 type 字段校验（适配 NanoBanana 的特殊拼写）
  if (typeof type !== 'string' || !type.trim()) {
    return Response.json({ code: 400, msg: 'Invalid "type": must be a non-empty string' }, { status: 400 });
  }

  const finalType = type.trim().toUpperCase();
  if (!['TEXTTOIAMGE', 'IMAGETOIAMGE'].includes(finalType)) {
    return Response.json(
      { code: 400, msg: 'Invalid type, must be TEXTTOIAMGE or IMAGETOIAMGE' },
      { status: 400 }
    );
  }

  // 🖼️ imageUrls 校验（确保是有效 HTTPS URL）
  if (imageUrls?.length > 0) {
    if (!Array.isArray(imageUrls)) {
      return Response.json({ code: 400, msg: 'imageUrls must be an array' }, { status: 400 });
    }
    for (const url of imageUrls) {
      if (typeof url !== 'string') {
        return Response.json({ code: 400, msg: 'Each image URL must be a string' }, { status: 400 });
      }
      try {
        new URL(url);
        if (!/^https?:\/\//.test(url)) {
          throw new Error('Must be HTTP/HTTPS URL');
        }
      } catch (e) {
        return Response.json({ code: 400, msg: `Invalid image URL: ${url}` }, { status: 400 });
      }
    }
  }

  // 🧪 API 路由选择
  const isProModel = model === 'nano-banana-pro';
  const apiUrl = isProModel
    ? 'https://api.nanobananaapi.ai/api/v1/nanobanana/generate-pro'
    : 'https://api.nanobananaapi.ai/api/v1/nanobanana/generate';

  const callBackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/callback`;

  // 根据模型类型构建不同的请求体
  let body: any;
  
  if (isProModel) {
    // Pro 模型请求体
    body = {
      prompt,
      type: finalType,
      aspectRatio,
      resolution: resolution || '2K',
      callBackUrl,
      ...(imageUrls?.length > 0 ? { imageUrls } : {}),
    };
  } else {
    // 标准模型请求体
    body = {
      prompt,
      type: finalType,
      numImages: 1,
      image_size: aspectRatio,
      callBackUrl,
      ...(imageUrls?.length > 0 ? { imageUrls } : {}),
    };
  }

  console.log('Calling NanoBanana API with:', { apiUrl, body });

  // ⏱️ 设置 8 秒超时
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    // 获取原始响应文本
    const responseText = await res.text();
    console.log('NanoBanana API raw response:', responseText);
    
    // 尝试解析 JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse API response as JSON:', parseError);
      return Response.json({ 
        code: 500, 
        msg: 'Invalid response from NanoBanana API',
        details: responseText.substring(0, 500)
      }, { status: 500 });
    }
    
    console.log('NanoBanana API response:', data);

    // 透传 API 错误
    if (data.code !== 200 && data.code !== 0) {
      return Response.json(data, { status: res.status || 500 });
    }

    const taskId = data.data?.taskId || data.data?.[0]?.taskId || data.taskId;

    // 💰 Deduct points on success and record task
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { 
          balance: { decrement: cost },
          pointsHistory: {
            create: {
              amount: -cost,
              type: 'consume',
              description: `生成图像 (${model})`,
            }
          }
        },
      }),
      prisma.generationTask.create({
        data: {
          taskId: String(taskId),
          userId: user.id,
          cost: cost,
          model: model || 'nano-banana',
          status: 'pending'
        }
      })
    ]);

    return Response.json(data);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('NanoBanana API timeout after 8s');
      return Response.json({ code: 408, msg: 'NanoBanana API timeout' }, { status: 408 });
    }
    console.error('NanoBanana API call failed:', error.message || error);
    return Response.json({ code: 500, msg: 'Failed to call NanoBanana API' }, { status: 500 });
  }
}
