// app/page.tsx
'use client';

import { useState, useRef, useEffect,useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Navbar } from '@/components/navbar';

export default function HomePage() {


const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/user/balance');
      const data = await res.json();
      if (data.success) {
       // setBalance(data.balance); // 假设你有个 setBalance
      }
    } catch (err) {
      console.error('Failed to fetch balance', err);
    }
  }, []);

const [showDropdown, setShowDropdown] = useState(false);

  const { data: session } = useSession();
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState<'1K' | '2K' | '4K'>('2K');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [model, setModel] = useState<'nano-banana' | 'nano-banana-pro'>('nano-banana-pro');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pageStatus, setPageStatus] = useState<'idle' | 'submitting' | 'polling' | 'success' | 'error'>('idle');

  // ========== 文件处理（不变）==========
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (uploadedFiles.length + files.length > 8) {
      alert('最多只能上传 8 张图片');
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert(`"${file.name}" 不是有效图片`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`"${file.name}" 超过 5MB 限制`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...validFiles].slice(0, 8));
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // ========== 上传图片（不变）==========
  const uploadImages = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload-temp', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`上传失败: ${file.name}`);
      const data = await res.json();
      return data.url;
    });

    try {
      return await Promise.all(uploadPromises);
    } catch (err) {
      console.error('批量上传失败:', err);
      throw err;
    }
  };

  // ========== 轮询（不变）==========
  const pollTaskStatus = (taskId: string) => {
    let pollCount = 0;
    const MAX_POLL = 30;
    const interval = setInterval(async () => {
      pollCount++;
      try {
        const res = await fetch(`/api/task/${taskId}`);
        const data = await res.json();
        if (data.code === 200 && data.data) {
          const { successFlag, response } = data.data;
          if (successFlag === 1 && response?.resultImageUrl) {
            clearInterval(interval);
            setImageUrl(response.resultImageUrl);
            setPageStatus('success');
            return;
          }
          if (successFlag === 2 || successFlag === 3) {
            clearInterval(interval);
            setPageStatus('error');
            alert('生成失败，请重试');
            return;
          }
        }
        if (pollCount >= MAX_POLL) {
          clearInterval(interval);
          setPageStatus('error');
          alert('生成超时，请重试');
        }
      } catch (err) {
        clearInterval(interval);
        setPageStatus('error');
        console.error('Polling error:', err);
      }
    }, 2000);
  };

  // ========== 生成逻辑（关键修改）==========
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('请输入提示词');
      return;
    }

    setPageStatus('submitting');
    let imageUrls: string[] = [];

    if (uploadedFiles.length > 0) {
      try {
        imageUrls = await uploadImages(uploadedFiles);
      } catch (err) {
        setPageStatus('error');
        alert('图片上传失败，请重试');
        return;
      }
    }

    const type = imageUrls.length > 0 ? 'IMAGETOIAMGE' : 'TEXTTOIAMGE';

    try {
      const requestBody: any = {
        prompt: prompt.trim(),
        numImages: 1,
        type,
        aspectRatio: aspectRatio,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        model,
        callBackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/callback`,
      };

      // ✅ 只有在选择 'nano-banana-pro' 时才添加 resolution 字段
      if (model === 'nano-banana-pro') {
        requestBody.resolution = resolution;
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (res.ok && data.code === 200 && data.data?.taskId) {
        setPageStatus('polling');
        pollTaskStatus(data.data.taskId);
        fetchBalance(); // 刷新余额
      } else {
        setPageStatus('error');
        alert(data.msg || '提交失败');
      }
    } catch (err) {
      setPageStatus('error');
      alert('网络错误，请检查控制台');
      console.error(err);
    }
  };

    const handleLogout = async () => {
      await signOut({ redirect: false });
      setShowDropdown(false);
      window.location.reload();
    };

    const currentPoints = model === 'nano-banana' ? 15 : (resolution === '4K' ? 90 : 60);

      return (
        <div className="min-h-screen bg-background text-foreground">
          <Navbar />

          <main className="container mx-auto px-4 py-12 md:py-20">

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold text-center mb-6">
            用文字描述，生成建筑概念图
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-10 max-w-2xl mx-auto">
            支持文生图 & 图生图（上传参考图）
          </p>

            <div className="relative min-h-[500px] border border-border rounded-xl bg-card-bg p-6">
              {/* Prompt */}
              <div className="mb-6">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="例如：山地上的极简木屋..."
                  className="w-full h-24 p-4 bg-input-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground placeholder-gray-500"
                />
              </div>
  
              {/* 比例 & 分辨率 */}
              <div className="flex flex-wrap gap-4 mb-6">
                {/* 比例 */}
                <div>
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">比例</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="bg-input-bg border border-border rounded px-3 py-2 text-foreground"
                  >
                    {['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'].map((r) => (
                      <option key={r} value={r} className="bg-input-bg">{r}</option>
                    ))}
                  </select>
                </div>
  
                {/* 分辨率：仅在选择 'nano-banana-pro' 时显示 */}
                {model === 'nano-banana-pro' && (
                  <div>
                    <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">分辨率</label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value as '1K' | '2K' | '4K')}
                      className="bg-input-bg border border-border rounded px-3 py-2 text-foreground"
                    >
                      <option value="1K" className="bg-input-bg">1K</option>
                      <option value="2K" className="bg-input-bg">2K</option>
                      <option value="4K" className="bg-input-bg">4K</option>
                    </select>
                  </div>
                )}
              </div>

            {/* 图片上传 */}
            <div className="mb-6">
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">参考图（可选，最多8张，每张≤5MB）</label>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="relative w-16 h-16">
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`preview-${index}`}
                      width={64}
                      height={64}
                      className="object-cover rounded border border-border"
                      unoptimized
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {uploadedFiles.length < 8 && (
                  <button
                    onClick={triggerFileSelect}
                    className="w-16 h-16 border-2 border-dashed border-border rounded flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500"
                  >
                    +
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </div>
            </div>

              {/* 底部：左模型选择，右生成按钮 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border">
                {/* 模型选择 */}
                <div className="w-full sm:w-auto">
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">模型</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value as 'nano-banana' | 'nano-banana-pro')}
                    className="bg-input-bg border border-border rounded px-3 py-2 w-full sm:w-48 text-foreground"
                  >
                    <option value="nano-banana" className="bg-input-bg">nano banana</option>
                    <option value="nano-banana-pro" className="bg-input-bg">nano banana pro</option>
                  </select>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    本次生成所需积分: <span className="text-orange-400 font-bold">{currentPoints}</span>
                  </span>
                  <button
                    onClick={handleGenerate}
                    disabled={pageStatus === 'submitting' || pageStatus === 'polling'}
                    className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap text-white ${
                      pageStatus === 'submitting' || pageStatus === 'polling'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {pageStatus === 'submitting'
                      ? '提交中...'
                      : pageStatus === 'polling'
                      ? '生成中...'
                      : '生成图像'}
                  </button>
                </div>
              </div>


              {/* 预览 */}
              <div className="mt-8 flex justify-center">
                {pageStatus === 'success' && imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt="Generated"
                    width={800}
                    height={800}
                    className="rounded-lg shadow-lg max-w-full"
                    unoptimized
                  />
                ) : pageStatus === 'polling' ? (
                  <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                    <p className="text-foreground">正在生成...</p>
                  </div>
                ) : (
                  <div className="text-gray-400 py-10">点击"生成图像"开始创作</div>
                )}
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-gray-400 text-sm border-t border-border">
        © {new Date().getFullYear()} lsai — 建筑师的 AI 创作伙伴
      </footer>
    </div>
  );
}
