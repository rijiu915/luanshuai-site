// app/api/generate-openai/route.ts
// OpenAI gpt-image-2 图像生成接口（同步模式，直接返回图片）
import { NextRequest } from 'next/server';
import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// 积分配置
const OPENAI_POINTS = 30; // gpt-image-2 每张消耗积分

// 宽高比 → OpenAI size 映射
const RATIO_TO_SIZE: Record<string, string> = {
  '1:1': '1024x1024',
  '16:9': '1536x1024',
  '9:16': '1024x1536',
  '4:3': '1024x768',
  '3:4': '768x1024',
  '3:2': '1536x1024',
  '2:3': '1024x1536',
  '21:9': '2048x1024',
  '4:5': '768x960',
  '5:4': '960x768',
};

export async function POST(req: NextRequest) {
  // 1. 认证
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ code: 401, msg: 'Please login first' }, { status: 401 });
  }

  // 2. 检查 API Key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ code: 500, msg: 'Server error: OPENAI_API_KEY not configured' }, { status: 500 });
  }

  // 3. 解析参数
  const { prompt, type, aspectRatio, imageUrls } = await req.json();
  const model = 'gpt-image-2';

  // 4. 计算积分
  let cost = OPENAI_POINTS;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return Response.json({ code: 404, msg: 'User not found' }, { status: 404 });
  }

  // VIP 折扣
  if (user.vipLevel === 'VIP') {
    cost = Math.max(0, cost - 3);
  } else if (user.vipLevel === 'SVIP') {
    cost = Math.max(0, cost - 5);
  }

  if (user.balance < cost) {
    return Response.json({ code: 403, msg: `积分不足，需要 ${cost} 积分` }, { status: 403 });
  }

  // 5. 构建请求
  const size = RATIO_TO_SIZE[aspectRatio] || '1024x1024';

  // 构建消息内容
  let messages: any[];
  
  if (type === 'IMAGETOIAMGE' && imageUrls?.length > 0) {
    // 图生图：使用 image edit API
    // 先下载图片转为 base64
    let imageBase64: string | null = null;
    let imageMimeType: string | null = null;
    
    try {
      const imageRes = await fetch(imageUrls[0]);
      if (!imageRes.ok) throw new Error('Failed to fetch image');
      const imageBuffer = await imageRes.arrayBuffer();
      const contentType = imageRes.headers.get('Content-Type') || 'image/png';
      imageMimeType = contentType;
      imageBase64 = Buffer.from(imageBuffer).toString('base64');
    } catch (err) {
      console.error('Failed to process input image:', err);
      return Response.json({ code: 400, msg: '无法处理输入图片' }, { status: 400 });
    }

    messages = [
      {
        role: 'user',
        content: [
          {
            type: 'input_image',
            image_url: `data:${imageMimeType};base64,${imageBase64}`,
          },
          {
            type: 'input_text',
            text: prompt || '请根据这张图片生成效果图',
          },
        ],
      },
    ];
  } else {
    // 文生图
    messages = [
      {
        role: 'user',
        content: prompt || 'Generate an image',
      },
    ];
  }

  // 6. 调用 OpenAI API
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-2',
        input: messages,
        size: size,
        quality: 'medium',
        output_format: 'png',
      }),
    });

    const responseText = await response.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('OpenAI API returned non-JSON:', responseText.substring(0, 500));
      return Response.json({ code: 502, msg: 'OpenAI API 返回无效响应' }, { status: 502 });
    }

    if (data.error) {
      console.error('OpenAI API error:', data.error);
      return Response.json({ code: 500, msg: data.error.message || 'OpenAI API 调用失败' }, { status: 500 });
    }

    // 7. 提取生成的图片
    // OpenAI Responses API 返回结构中，图片在 output 数组里
    let resultImageUrl: string | null = null;
    let resultBase64: string | null = null;

    const output = data.output || [];
    for (const item of output) {
      if (item.type === 'image_generation_call' && item.result) {
        resultBase64 = item.result;
        break;
      }
    }

    if (!resultBase64) {
      console.error('No image in OpenAI response:', JSON.stringify(data).substring(0, 500));
      return Response.json({ code: 500, msg: 'OpenAI 未返回图片' }, { status: 500 });
    }

    // 8. 上传图片到 R2（复用现有的上传逻辑）
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      region: 'auto',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });

    const imageBuffer = Buffer.from(resultBase64, 'base64');
    const key = `nano-images/openai-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.png`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: imageBuffer,
        ContentType: 'image/png',
        CacheControl: 'public, max-age=31536000',
      })
    );

    resultImageUrl = `${process.env.R2_PUBLIC_HOST}/${key}`;
    console.log('OpenAI image uploaded to R2:', resultImageUrl);

    // 9. 扣积分 + 记录任务（状态直接为 success，因为是同步的）
    const fakeTaskId = `openai-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
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
            },
          },
        },
      }),
      prisma.generationTask.create({
        data: {
          taskId: fakeTaskId,
          userId: user.id,
          cost: cost,
          model: model,
          status: 'success',
        },
      }),
    ]);

    // 10. 返回结果（兼容前端轮询格式）
    return Response.json({
      code: 200,
      data: {
        successFlag: 1,
        response: {
          resultImageUrl: resultImageUrl,
        },
        isSync: true, // 标记为同步结果，前端直接使用
      },
    });
  } catch (error: any) {
    console.error('OpenAI generation error:', error);
    return Response.json({ code: 500, msg: '图片生成失败，请重试' }, { status: 500 });
  }
}
