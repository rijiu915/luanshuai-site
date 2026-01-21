// app/api/generate-analysis/route.ts
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { imageUrl, model, aspectRatio, resolution } = await req.json();

  // 构建请求体：统一使用 aspectRatio，由 /api/generate 内部决定转成 image_size 还是保留
  const requestBody = {
    prompt: '分析此图像的设计结构、材质、光影和空间布局，生成一张带标注的分析图',
    type: 'IMAGETOIAMGE', // 注意：此处必须与 generate/route.ts 中允许的值一致（原样保留）
    aspectRatio: aspectRatio ,
    imageUrls: [imageUrl],
    model: model,
    ...(model === 'nano-banana-pro' ? { resolution: resolution || '2K' } : {}),
  };

  const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  return Response.json(data, { status: response.status });
}