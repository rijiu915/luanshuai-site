import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  // 解析请求体中的数据
  const { imageUrl, model, aspectRatio, image_size, resolution } = await req.json();

  // 构建转发到 /generate 的请求体
  const requestBody: any = {
    prompt: '分析此图像的设计结构、材质、光影和空间布局，生成一张带标注的分析图',
    type: 'IMAGETOIAMGE', // 使用 NanoBanana API 需要的类型
    imageUrls: [imageUrl], // 将 imageUrl 包装成数组
    model: model,
  };

  // 根据所选模型来决定是使用 aspectRatio 还是 image_size
  if (model === 'nano-banana-pro') {
    // Pro 版本使用 aspectRatio 和可选的 resolution 参数
    requestBody.aspectRatio = aspectRatio || '16:9';
    requestBody.resolution = resolution || '2K'; // Pro模型需要分辨率参数
  } else {
    // 标准版本使用 image_size
    requestBody.image_size = image_size || '16:9';
  }

  // 将请求转发到统一的 /generate 路由
  const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/generate`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': req.headers.get('cookie') || ''
    },
    body: JSON.stringify(requestBody),
  });


  const data = await response.json();
  return Response.json(data);
}