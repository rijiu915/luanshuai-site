// app/api/upload-temp/route.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest } from 'next/server';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// 初始化 S3 客户端（兼容 R2）
const s3Client = new S3Client({
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('image') as File | null;

  if (!file || !(file instanceof File)) {
    return Response.json({ error: 'No image provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: 'Invalid file type. Only JPEG, PNG, WebP allowed.' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: 'File too large. Max size is 20MB.' }, { status: 400 });
  }

  try {
    // 清理文件名
    const cleanFileName = (file.name || 'image')
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .toLowerCase();

    const key = `nano-images/${Date.now()}-${cleanFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到 R2
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: 'public, max-age=31536000', // 1年缓存
      })
    );

    // 构造公开 URL
    const publicHost = process.env.R2_PUBLIC_HOST;
    if (!publicHost) {
      throw new Error('R2_PUBLIC_HOST environment variable is required for public URLs');
    }

    const url = `${publicHost}/${key}`;
    console.log('Uploaded to R2:', url);
    return Response.json({ url });
  } catch (error: any) {
    console.error('R2 Upload failed:', error);
    return Response.json({ error: 'Upload to R2 failed', details: error.message }, { status: 500 });
  }
}