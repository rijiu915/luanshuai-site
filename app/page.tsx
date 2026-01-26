'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/navbar';
import { Sparkles, Image as ImageIcon, Layout, Settings, History, Info, Crown, ChevronRight, X, Plus } from 'lucide-react';

const FEATURES = [
  '渲染风格分析', '总图填色渲染', '建筑材料分析', '总平面图', '立面图生成鸟瞰图', 
  '修改效果图', '渲染风格迁移', '多图参考生成', '卫星图生成分析图', '插画风分析图', 
  '竞赛排版', '白膜转效果图', 'SU截图渲染', '基地现状分析', '立面阶段详图', 
  '户型图填色', '草图转效果图', '效果图生成立面图', '毛胚房室内设计', '空地设计'
];

export default function HomePage() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState<number | null>(null);
  const [vipLevel, setVipLevel] = useState<string>('FREE');

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/user/balance');
      const data = await res.json();
      if (data.balance !== undefined) {
        setBalance(data.balance);
        setVipLevel(data.vipLevel || 'FREE');
      }
    } catch (err) {
      console.error('Failed to fetch balance', err);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchBalance();
    }
  }, [session, fetchBalance]);

  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState<'1K' | '2K' | '4K'>('2K');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [model, setModel] = useState<'nano-banana' | 'nano-banana-pro'>('nano-banana-pro');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pageStatus, setPageStatus] = useState<'idle' | 'submitting' | 'polling' | 'success' | 'error'>('idle');

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

  const uploadImages = async (files: File[]): Promise<string[]> => {
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
        aspectRatio,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        model,
        callBackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/callback`,
      };

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
        fetchBalance();
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

  const getPointsInfo = () => {
    const base = model === 'nano-banana' ? 15 : (resolution === '4K' ? 90 : 60);
    let disc = 0;
    if (vipLevel === 'VIP') disc = 3;
    else if (vipLevel === 'SVIP') disc = 5;
    return { baseCost: base, discount: disc, finalCost: Math.max(0, base - disc) };
  };

  const { baseCost, discount, finalCost } = getPointsInfo();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-6 md:py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* 左侧边栏：设置与功能 */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-card-bg border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" /> 生成设置
              </h3>
              
              <div className="space-y-4">
                {/* 性能增强开关 */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">性能增强 (Pro)</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">支持 2K/4K 分辨率</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModel(model === 'nano-banana' ? 'nano-banana-pro' : 'nano-banana')}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                      model === 'nano-banana-pro' ? 'bg-blue-600' : 'bg-muted'
                    }`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      model === 'nano-banana-pro' ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* 比例选择 */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">画面比例</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full bg-input-bg border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    {['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* 分辨率选择 */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">分辨率</label>
                  <select
                    value={resolution}
                    disabled={model !== 'nano-banana-pro'}
                    onChange={(e) => setResolution(e.target.value as '1K' | '2K' | '4K')}
                    className="w-full bg-input-bg border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50"
                  >
                    <option value="1K">1K (标准)</option>
                    <option value="2K">2K (高清)</option>
                    <option value="4K">4K (极清)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 功能快捷入口 */}
            <div className="bg-card-bg border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Layout className="w-4 h-4" /> 架构功能
              </h3>
              <div className="flex flex-wrap gap-2">
                {FEATURES.map((feature, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(prev => prev + (prev ? ' ' : '') + feature)}
                    className="px-2 py-1 text-[11px] bg-muted border border-border rounded hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-600 transition-colors"
                  >
                    {feature}
                  </button>
                ))}
              </div>
            </div>

            {/* 会员提示 */}
            <Link href="/vip" className="block p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 hover:border-yellow-500/40 transition-all">
              <div className="flex items-center gap-2 mb-1 text-yellow-600 dark:text-yellow-500">
                <Crown className="w-4 h-4" />
                <span className="text-xs font-bold">VIP 权益</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                VIP/SVIP 每次生图最高可减免 <span className="text-orange-500 font-bold">5 积分</span>。
              </p>
            </Link>
          </aside>

          {/* 中间主要区域 */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-card-bg border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
                <Sparkles className="w-5 h-5" />
                <h2 className="font-bold">AI 建筑生成助手</h2>
              </div>

              {/* Prompt Input */}
              <div className="mb-6 relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="请输入描述词，或从左侧选择功能..."
                  className="w-full h-32 p-4 bg-input-bg border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm resize-none"
                />
                {prompt && (
                  <button 
                    onClick={() => setPrompt('')}
                    className="absolute bottom-3 right-3 p-1 rounded-md bg-muted hover:bg-muted-foreground/10 text-muted-foreground transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Reference Images */}
              <div className="mb-6">
                <label className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> 参考图片 ({uploadedFiles.length}/8)
                </label>
                <div className="flex flex-wrap gap-3">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="relative w-16 h-16 group">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`preview-${index}`}
                        fill
                        className="object-cover rounded-lg border border-border"
                        unoptimized
                      />
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {uploadedFiles.length < 8 && (
                    <button
                      onClick={triggerFileSelect}
                      className="w-16 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground hover:border-blue-500 hover:text-blue-500 transition-all bg-muted/50"
                    >
                      <Plus className="w-5 h-5" />
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

              {/* Bottom Control */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-orange-500">
                    {finalCost} <span className="text-xs font-normal text-muted-foreground">积分</span>
                  </div>
                  {discount > 0 && (
                    <span className="text-[10px] text-muted-foreground line-through">原价 {baseCost}</span>
                  )}
                  {discount > 0 && (
                    <span className="text-[10px] text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">
                      {vipLevel} 减免
                    </span>
                  )}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={pageStatus === 'submitting' || pageStatus === 'polling'}
                  className={`w-full sm:w-auto px-10 py-2.5 rounded-lg font-bold text-sm transition-all ${
                    pageStatus === 'submitting' || pageStatus === 'polling'
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                  }`}
                >
                  {pageStatus === 'submitting' ? '提交中...' : pageStatus === 'polling' ? '生成中...' : '立即生成'}
                </button>
              </div>
            </div>

            {/* Results Area */}
            {imageUrl && pageStatus === 'success' && (
              <div className="bg-card-bg border border-border rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                  <Image
                    src={imageUrl}
                    alt="Generated Result"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="flex justify-between items-center mt-3 px-1">
                  <span className="text-[10px] text-muted-foreground">生成完成，右键可保存</span>
                  <button 
                    onClick={() => window.open(imageUrl, '_blank')}
                    className="text-[10px] text-blue-500 hover:underline"
                  >
                    查看高清原图
                  </button>
                </div>
              </div>
            )}

            {/* Polling State */}
            {pageStatus === 'polling' && !imageUrl && (
              <div className="bg-card-bg border border-border rounded-xl p-12 shadow-sm text-center space-y-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">正在生成中...</p>
                  <p className="text-xs text-muted-foreground">您的建筑蓝图即将呈现，请稍候</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-border mt-auto bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} 孪数 AI (Luanshuai AI) · 专业的建筑与室内设计 AI 工具
          </p>
        </div>
      </footer>
    </div>
  );
}
