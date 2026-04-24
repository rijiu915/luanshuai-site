'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Upload, Download, Maximize2, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/navbar';

export default function PlusPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 内置提示词
  const BUILT_IN_PROMPT = '生成效果图';

  // 状态
  const [uploadedFile, setUploadedFile] = useState<{ file: File; previewUrl: string } | null>(null);
  const [model, setModel] = useState<'nano-banana' | 'nano-banana-pro' | 'gpt-image-2'>('nano-banana');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [resolution, setResolution] = useState<'1K' | '2K' | '4K'>('2K');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'polling'>('idle');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 清理预览 URL
  useEffect(() => {
    return () => {
      if (uploadedFile?.previewUrl) {
        URL.revokeObjectURL(uploadedFile.previewUrl);
      }
    };
  }, [uploadedFile]);

  // 上传图片
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadedFile?.previewUrl) {
      URL.revokeObjectURL(uploadedFile.previewUrl);
    }
    setUploadedFile({
      file,
      previewUrl: URL.createObjectURL(file),
    });
    setGeneratedImage(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    if (uploadedFile?.previewUrl) {
      URL.revokeObjectURL(uploadedFile.previewUrl);
    }
    setUploadedFile({
      file,
      previewUrl: URL.createObjectURL(file),
    });
    setGeneratedImage(null);
    setError(null);
  };

  // 上传图片到临时存储
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/upload-temp', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('图片上传失败');
    const data = await res.json();
    return data.url;
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    const maxAttempts = 120;
    let attempts = 0;

    const pollInterval = setInterval(async () => {
      attempts++;
      console.log(`Poll attempt ${attempts}/${maxAttempts}`);

      try {
        const res = await fetch(`/api/task/${taskId}`);
        const data = await res.json();

        const successFlag = data.data?.successFlag;
        const resultImageUrl = data.data?.response?.resultImageUrl;
        const errorMessage = data.data?.errorMessage;

        if (successFlag === 1 && resultImageUrl) {
          clearInterval(pollInterval);
          setStatus('idle');
          setGeneratedImage(resultImageUrl);
        } else if (successFlag === 2 || successFlag === 3) {
          clearInterval(pollInterval);
          setStatus('idle');
          setError(errorMessage || '生成失败');
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setStatus('idle');
          setError('生成超时，请重试');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);
  };

  // 生成图片
  const handleGenerate = async () => {
    if (!uploadedFile) {
      setError('请先上传参考图');
      return;
    }

    if (!session?.user?.email) {
      setError('请先登录');
      router.push('/login');
      return;
    }

    setStatus('submitting');
    setError(null);

    try {
      // 上传参考图
      const imageUrl = await uploadImage(uploadedFile.file);

      const body: any = {
        prompt: BUILT_IN_PROMPT,
        type: 'IMAGETOIAMGE',
        aspectRatio,
        model,
        imageUrls: [imageUrl],
      };

      if (model === 'nano-banana-pro') {
        body.resolution = resolution;
      }

      // gpt-image-2 使用独立同步 API
      if (model === 'gpt-image-2') {
        const res = await fetch('/api/generate-openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`服务器错误 (${res.status}): ${errorText}`);
        }

        const data = await res.json();

        if (data.code !== 200) {
          throw new Error(data.msg || '生成失败');
        }

        const resultImageUrl = data.data?.response?.resultImageUrl;
        if (resultImageUrl) {
          setStatus('idle');
          setGeneratedImage(resultImageUrl);
        } else {
          throw new Error('未返回图片');
        }
        return;
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`服务器错误 (${res.status}): ${errorText}`);
      }

      const data = await res.json();

      if (data.code !== 200 && data.code !== 0) {
        throw new Error(data.msg || data.error || '生成失败');
      }

      const taskId = data.data?.taskId || data.data?.[0]?.taskId || data.taskId;
      console.log('Task ID:', taskId);

      setStatus('polling');
      pollTaskStatus(taskId);
    } catch (err: any) {
      console.error('Generate error:', err);
      setStatus('idle');
      setError(err.message || '生成失败');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 标题 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">效果图增强</h1>
            <p className="text-muted-foreground">上传草图或线稿，一键生成专业效果图</p>
          </div>

          {/* 三个区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* 左侧：上传参考图 */}
            <div className="bg-card-bg border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">参考图</h2>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!uploadedFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 transition-colors bg-input-bg"
                >
                  <Upload className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    <span className="text-blue-600 font-medium">点击上传</span> 或拖拽图片
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">支持 PNG, JPG, WebP</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={uploadedFile.previewUrl}
                      alt="参考图"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                    {/* 删除按钮 */}
                    <button
                      onClick={() => {
                        URL.revokeObjectURL(uploadedFile.previewUrl);
                        setUploadedFile(null);
                        setGeneratedImage(null);
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-500/30 hover:border-blue-500/50 rounded-lg transition-colors"
                  >
                    更换图片
                  </button>
                </div>
              )}
            </div>

            {/* 中间：生成按钮 */}
            <div className="bg-card-bg border border-border rounded-2xl p-6 flex flex-col items-center justify-center">
              <h2 className="text-lg font-semibold text-foreground mb-4">生成设置</h2>

              {/* 提示词展示 */}
              <div className="w-full mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">提示词</label>
                <div className="px-4 py-3 bg-input-bg border border-border rounded-xl text-sm text-muted-foreground">
                  {BUILT_IN_PROMPT}
                </div>
                <p className="text-xs text-muted-foreground mt-1">内置提示词，无需输入</p>
              </div>

              {/* 宽高比 */}
              <div className="w-full mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">宽高比</label>
                <div className="flex gap-2 flex-wrap">
                  {['16:9', '4:3', '1:1', '9:16', '3:4'].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-4 py-2 rounded-lg border transition-all text-sm ${
                        aspectRatio === ratio
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-input-bg border-border text-foreground hover:border-blue-500/50'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* 模型选择 */}
              <div className="w-full mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">模型</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setModel('nano-banana')}
                    className={`flex-1 py-3 rounded-xl border transition-all font-medium ${
                      model === 'nano-banana'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/25'
                        : 'bg-input-bg border-border text-foreground hover:border-blue-500/50'
                    }`}
                  >
                    标准版
                    <span className="block text-xs opacity-70 mt-0.5">15 积分/张</span>
                  </button>
                  <button
                    onClick={() => setModel('nano-banana-pro')}
                    className={`flex-1 py-3 rounded-xl border transition-all font-medium ${
                      model === 'nano-banana-pro'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-purple-500/25'
                        : 'bg-input-bg border-border text-foreground hover:border-purple-500/50'
                    }`}
                  >
                    Pro 专业版
                    <span className="block text-xs opacity-70 mt-0.5">60-90 积分/张</span>
                  </button>
                  <button
                    onClick={() => setModel('gpt-image-2')}
                    className={`flex-1 py-3 rounded-xl border transition-all font-medium ${
                      model === 'gpt-image-2'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/25'
                        : 'bg-input-bg border-border text-foreground hover:border-emerald-500/50'
                    }`}
                  >
                    GPT Image
                    <span className="block text-xs opacity-70 mt-0.5">30 积分/张</span>
                  </button>
                </div>
              </div>

              {/* 分辨率 - 仅 Pro */}
              {model === 'nano-banana-pro' && (
                <div className="w-full mb-6 animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-foreground mb-2">分辨率</label>
                  <div className="flex gap-2">
                    {(['1K', '2K', '4K'] as const).map((res) => (
                      <button
                        key={res}
                        onClick={() => setResolution(res)}
                        className={`flex-1 py-2 rounded-lg border transition-all text-sm ${
                          resolution === res
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-input-bg border-border text-foreground hover:border-purple-500/50'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 生成按钮 */}
              <button
                onClick={handleGenerate}
                disabled={status !== 'idle' || !uploadedFile}
                className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all ${
                  status !== 'idle' || !uploadedFile
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {status === 'idle' ? (
                  <>
                    <Sparkles className="w-5 h-5" />
                    开始生成
                  </>
                ) : status === 'submitting' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    生成中...
                  </>
                )}
              </button>

              {/* 错误提示 */}
              {error && (
                <div className="w-full mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-500">
                  {error}
                </div>
              )}
            </div>

            {/* 右侧：生成结果 */}
            <div className="bg-card-bg border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">生成结果</h2>

              {generatedImage ? (
                <div className="space-y-4">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={generatedImage}
                      alt="生成结果"
                      fill
                      className="object-contain"
                      unoptimized
                      onClick={() => setPreviewImage(generatedImage)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewImage(generatedImage)}
                      className="flex-1 py-2 text-sm bg-input-bg border border-border hover:border-blue-500/50 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Maximize2 className="w-4 h-4" />
                      放大查看
                    </button>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = generatedImage;
                        link.download = `效果图-${Date.now()}.png`;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="flex-1 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      下载
                    </button>
                  </div>
                </div>
              ) : (
                <div className="aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground">
                  <svg className="w-16 h-16 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <p className="text-sm">上传参考图并点击生成</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 图片预览模态框 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                const link = document.createElement('a');
                link.href = previewImage;
                link.download = '效果图.png';
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium flex items-center gap-2 transition-all border border-white/20"
            >
              <Download className="w-5 h-5" />
              下载图片
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
