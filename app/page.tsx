'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/navbar';
import { Sparkles, Image as ImageIcon, Layout, Settings, History, Info, Crown, ChevronRight } from 'lucide-react';

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
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] font-sans selection:bg-blue-500/30">
      <Navbar />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 左侧边栏 - 功能快捷入口 */}
          <aside className="lg:col-span-3 space-y-6 hidden lg:block">
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-semibold text-[#888] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layout className="w-4 h-4" /> 架构功能
              </h3>
              <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {FEATURES.map((feature, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(prev => prev + (prev ? ' ' : '') + feature)}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#262626] transition-colors text-[#a1a1a1] hover:text-white flex items-center justify-between group"
                  >
                    <span>{feature}</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>

            <Link href="/vip" className="block p-5 rounded-2xl bg-gradient-to-br from-[#f59e0b20] to-[#ea580c20] border border-[#f59e0b30] hover:border-[#f59e0b50] transition-all group">
              <div className="flex items-center gap-3 mb-2 text-yellow-500">
                <Crown className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-bold">开通会员</span>
              </div>
              <p className="text-xs text-[#a1a1a1] leading-relaxed">
                每次生图最高可减免 <span className="text-yellow-500 font-bold">5 积分</span>，尊享极速通道与更高分辨率。
              </p>
            </Link>
          </aside>

          {/* 中间主生成区 */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-orange-600 opacity-50"></div>
              
              <div className="flex items-center gap-2 mb-6 text-blue-400">
                <Sparkles className="w-5 h-5" />
                <h2 className="font-bold text-lg">AI 建筑生成助手</h2>
              </div>

              {/* Prompt Input */}
              <div className="mb-6 relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="输入描述词，例如：在森林里的极简主义玻璃住宅，晨雾效果，写实渲染..."
                  className="w-full h-32 p-4 bg-[#0a0a0a] border border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-[#ededed] placeholder-[#555] resize-none transition-all"
                />
                <button 
                  onClick={() => setPrompt('')}
                  className="absolute bottom-4 right-4 text-xs text-[#555] hover:text-[#888] transition-colors"
                >
                  清空
                </button>
              </div>

              {/* Reference Images */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-[#888] flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> 参考图片 (最多8张)
                  </label>
                  <span className="text-[10px] text-[#555]">每张 ≤ 5MB</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="relative w-20 h-20 group">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`preview-${index}`}
                        fill
                        className="object-cover rounded-xl border border-[#262626]"
                        unoptimized
                      />
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {uploadedFiles.length < 8 && (
                    <button
                      onClick={triggerFileSelect}
                      className="w-20 h-20 border-2 border-dashed border-[#262626] rounded-xl flex items-center justify-center text-[#555] hover:border-blue-500/50 hover:text-blue-400 transition-all bg-[#0a0a0a]"
                    >
                      <span className="text-2xl font-light">+</span>
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

              {/* Settings Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#888] uppercase tracking-widest">画面比例</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#ededed] focus:ring-1 focus:ring-blue-500/50 outline-none cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                  >
                    {['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#888] uppercase tracking-widest">分辨率</label>
                  <select
                    value={resolution}
                    disabled={model !== 'nano-banana-pro'}
                    onChange={(e) => setResolution(e.target.value as '1K' | '2K' | '4K')}
                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-[#ededed] focus:ring-1 focus:ring-blue-500/50 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1a1a1a] transition-colors"
                  >
                    <option value="1K">1K (标准)</option>
                    <option value="2K">2K (高清)</option>
                    <option value="4K">4K (极清)</option>
                  </select>
                </div>
              </div>

              {/* Bottom Control Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-[#262626]">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#888]">性能增强</span>
                    <button
                      type="button"
                      onClick={() => setModel(model === 'nano-banana' ? 'nano-banana-pro' : 'nano-banana')}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                        model === 'nano-banana-pro' ? 'bg-blue-600' : 'bg-[#262626]'
                      }`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        model === 'nano-banana-pro' ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="text-right flex flex-col items-end">
                    <div className="flex items-center gap-1.5">
                      {discount > 0 && (
                        <span className="text-[10px] text-yellow-500 font-bold px-1.5 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20">
                          {vipLevel} 减免 -{discount}
                        </span>
                      )}
                      <span className="text-sm font-bold text-orange-500">
                        {finalCost} <span className="text-[10px] font-normal text-[#888]">积分</span>
                      </span>
                    </div>
                    {discount > 0 && (
                      <span className="text-[10px] text-[#555] line-through">原价 {baseCost}</span>
                    )}
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={pageStatus === 'submitting' || pageStatus === 'polling'}
                    className={`flex-1 sm:flex-none px-8 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all shadow-xl shadow-blue-900/20 ${
                      pageStatus === 'submitting' || pageStatus === 'polling'
                        ? 'bg-[#262626] text-[#555] cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white active:scale-95'
                    }`}
                  >
                    {pageStatus === 'submitting' ? '提交中...' : pageStatus === 'polling' ? '生成中...' : '立即生成'}
                  </button>
                </div>
              </div>
            </div>

            {/* Success Area */}
            {imageUrl && pageStatus === 'success' && (
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 shadow-2xl animate-in fade-in zoom-in duration-500">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                  <Image
                    src={imageUrl}
                    alt="Generated"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="flex justify-between items-center mt-4 px-2">
                  <span className="text-xs text-[#888]">生成完成 - 点击右键可保存图片</span>
                  <button 
                    onClick={() => window.open(imageUrl, '_blank')}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    查看高清原图
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 右侧边栏 - 用户状态 & 说明 */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-semibold text-[#888] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" /> 积分规则
              </h3>
              <ul className="space-y-4 text-xs text-[#a1a1a1]">
                <li className="flex justify-between items-start gap-4">
                  <span>标准版 (Nano Banana)</span>
                  <span className="text-white font-mono">15 积分/张</span>
                </li>
                <li className="flex justify-between items-start gap-4">
                  <span>专业版 (Nano Pro 2K)</span>
                  <span className="text-white font-mono">60 积分/张</span>
                </li>
                <li className="flex justify-between items-start gap-4">
                  <span>专业版 (Nano Pro 4K)</span>
                  <span className="text-white font-mono">90 积分/张</span>
                </li>
                <li className="pt-2 border-t border-[#262626] text-[10px] text-[#555]">
                  提示：生成失败会自动退还积分。
                </li>
              </ul>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-semibold text-[#888] uppercase tracking-wider mb-4 flex items-center gap-2">
                <History className="w-4 h-4" /> 生成状态
              </h3>
              <div className="py-8 text-center">
                {pageStatus === 'polling' ? (
                  <div className="space-y-3">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                    <p className="text-xs text-[#888]">正在构建您的建筑蓝图...</p>
                  </div>
                ) : pageStatus === 'success' ? (
                  <div className="space-y-2">
                    <div className="w-8 h-8 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">✓</div>
                    <p className="text-xs text-[#888]">生成成功！</p>
                  </div>
                ) : (
                  <p className="text-xs text-[#555]">暂无正在进行的任务</p>
                )}
              </div>
            </div>
          </aside>

        </div>
      </main>

      <footer className="py-12 text-center border-t border-[#262626] mt-12 bg-[#0a0a0a]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-blue-600 rounded"></div>
            <span className="text-lg font-bold">孪数<span className="text-orange-400">AI</span></span>
          </div>
          <p className="text-xs text-[#555] max-w-md mx-auto leading-relaxed">
            致力于为建筑师、室内设计师及城市规划师提供最前沿的 AI 辅助设计工具。
            <br />
            © {new Date().getFullYear()} 孪数 AI (Luanshuai AI). All rights reserved.
          </p>
        </div>
      </footer>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #262626;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #333;
        }
      `}</style>
    </div>
  );
}
