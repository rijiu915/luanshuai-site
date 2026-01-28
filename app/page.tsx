'use client';

import { useState, useRef, useEffect,useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Maximize2, Download, ZoomIn } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { Navbar } from '@/components/navbar';
import { TemplateSelector, Template } from '@/components/template-selector';

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
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [adaptiveRatio, setAdaptiveRatio] = useState<string | null>(null);
    const [useAdaptive, setUseAdaptive] = useState(false);
    const [resolution, setResolution] = useState<'1K' | '2K' | '4K'>('2K');
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [isZoomed, setIsZoomed] = useState(false);

    // ========== 检测第一张图的比例 ==========
    useEffect(() => {
      if (uploadedFiles.length > 0) {
        const file = uploadedFiles[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new (window as any).Image();
          img.onload = () => {
            setAdaptiveRatio(`${img.width}:${img.height}`);
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        setAdaptiveRatio(null);
        setUseAdaptive(false);
      }
    }, [uploadedFiles]);

    const downloadImage = async (url: string) => {
      try {
        const proxyUrl = `/api/download?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `lstwin-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      } catch (err) {
        console.error('Download failed:', err);
        window.open(url, '_blank');
      }
    };

  const [model, setModel] = useState<'nano-banana' | 'nano-banana-pro'>('nano-banana');
  const [vipLevel, setVipLevel] = useState<string>('FREE');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pageStatus, setPageStatus] = useState<'idle' | 'submitting' | 'polling' | 'success' | 'error'>('idle');

  // ========== 余额和VIP等级获取 ==========
  const fetchUserData = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch('/api/user/balance');
      const data = await res.json();
      if (data.balance !== undefined) {
        setVipLevel(data.vipLevel || 'FREE');
      }
    } catch (err) {
      console.error('Failed to fetch user data', err);
    }
  }, [session]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

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
    const MAX_POLL = 100;
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
      // 如果没有选模板且没有输入内容，报错
      if (!selectedTemplate && !prompt.trim()) {
        alert('请输入提示词或选择一个功能模板');
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
        // 合并提示词：模板提示词 + 用户补充说明
        const finalPrompt = selectedTemplate 
          ? `${selectedTemplate.prompt}${prompt.trim() ? `，${prompt.trim()}` : ''}`
          : prompt.trim();

          const requestBody: any = {
            prompt: finalPrompt,
            numImages: 1,
            type,
            aspectRatio: useAdaptive && adaptiveRatio ? adaptiveRatio : aspectRatio,
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

    const basePoints = model === 'nano-banana' ? 15 : (resolution === '4K' ? 90 : 60);
    let currentPoints = basePoints;
    if (vipLevel === 'VIP') {
      currentPoints = Math.max(0, basePoints - 3);
    } else if (vipLevel === 'SVIP') {
      currentPoints = Math.max(0, basePoints - 5);
    }

      return (
        <div className="min-h-screen bg-background text-foreground">
          <Navbar />

          <main className="container mx-auto px-4 py-12 md:py-20">

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold text-center mb-6">
            用文字描述，生成概念图
          </h1>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-10 max-w-2xl mx-auto">
              支持文生图 & 图生图（上传参考图）
            </p>

                <TemplateSelector onSelect={(template) => {
                  setSelectedTemplate(template);
                  // 自动滚动到输入区域或聚焦
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }} />

                <div className="relative min-h-[500px] border border-border rounded-xl bg-card-bg p-6">
                
                {selectedTemplate && (
                  <div className="mb-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-xl px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-blue-500/30">
                          <Image src={selectedTemplate.image} alt={selectedTemplate.name} fill className="object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-500 font-bold">已应用: {selectedTemplate.name}</span>
                            <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold uppercase">{selectedTemplate.badge}</span>
                          </div>
                          <p className="text-xs text-blue-500/70 mt-0.5">提示：模板内置专业提示词已隐藏，您可以继续在下方输入补充说明。</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedTemplate(null)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                        title="移除模板"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Prompt */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {selectedTemplate ? '补充说明' : '描述您的创作意图'}
                    </label>
                    {selectedTemplate && (
                      <span className="text-[10px] text-blue-500 font-medium px-2 py-0.5 bg-blue-500/5 rounded-full border border-blue-500/10">
                        双提示词合并发送
                      </span>
                    )}
                  </div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={selectedTemplate ? `请输入针对“${selectedTemplate.name}”的个性化补充说明（例如：调整材质颜色、修改环境光影等）...` : "例如：一个现代风格的半透明玻璃艺术馆，周围环绕着茂密的森林，夕阳余晖..."}
                    className="w-full h-32 p-4 bg-input-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground placeholder-gray-500 resize-none transition-all shadow-inner"
                  />
                </div>
  
              {/* 图片上传 */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {selectedTemplate ? '参考图上传' : '参考图 (可选)'}
                  </label>
                  {selectedTemplate && (
                    <span className="text-[10px] text-orange-500 font-medium px-2 py-0.5 bg-orange-500/5 rounded-full border border-orange-500/10">
                      建议上传以获得更精准效果
                    </span>
                  )}
                </div>
                <div className={`flex flex-wrap gap-3 p-6 rounded-xl border-2 border-dashed transition-all duration-300 ${selectedTemplate ? 'border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/5' : 'border-border hover:border-blue-500/30 bg-input-bg/40'}`}>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="relative w-20 h-20 group">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`preview-${index}`}
                        width={80}
                        height={80}
                        className="object-cover rounded-lg border border-border shadow-sm group-hover:scale-105 transition-transform"
                        unoptimized
                      />
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-md hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {uploadedFiles.length < 8 && (
                    <button
                      onClick={triggerFileSelect}
                      className={`w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all ${selectedTemplate ? 'border-blue-400 text-blue-500 bg-blue-500/5 hover:bg-blue-500/10' : 'border-border text-gray-400 hover:border-blue-500 hover:text-blue-500'}`}
                    >
                      <span className="text-2xl mb-1">+</span>
                      <span className="text-[10px] font-bold">上传</span>
                    </button>
                  )}
                  {uploadedFiles.length === 0 && selectedTemplate && (
                    <div className="flex flex-col justify-center ml-2">
                      <p className="text-sm text-blue-500/80 font-medium">点击上方区域上传参考图</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">上传参考图能让 AI 更准确地理解空间关系</p>
                    </div>
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
  
                    {/* 尺寸比例选择 */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          尺寸比例
                        </label>
                        <span className="text-[10px] text-gray-400 font-medium px-2 py-0.5 bg-gray-500/5 rounded-full border border-border">
                          决定图像构图
                        </span>
                      </div>
                        <div className="flex flex-wrap gap-2">
                          {/* 自适应选项 */}
                          <button
                            onClick={() => {
                              if (adaptiveRatio) {
                                setUseAdaptive(true);
                                setAspectRatio('adaptive');
                              } else {
                                alert('请先上传参考图以使用自适应比例');
                              }
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 ${
                              useAdaptive
                                ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-500/20'
                                : 'bg-input-bg border-border text-gray-500 hover:border-orange-500/50 hover:text-orange-500'
                            }`}
                          >
                            自适应 {adaptiveRatio ? `(${adaptiveRatio})` : '(上传图片后开启)'}
                          </button>

                          {[
                            { label: '横屏 16:9', value: '16:9' },
                            { label: '标准 4:3', value: '4:3' },
                            { label: '正方形 1:1', value: '1:1' },
                            { label: '人像 3:4', value: '3:4' },
                            { label: '竖屏 9:16', value: '9:16' },
                          ].map((ratio) => (
                            <button
                              key={ratio.value}
                              onClick={() => {
                                setAspectRatio(ratio.value);
                                setUseAdaptive(false);
                              }}
                              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 ${
                                aspectRatio === ratio.value && !useAdaptive
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20'
                                  : 'bg-input-bg border-border text-gray-500 hover:border-blue-500/50 hover:text-orange-500'
                              }`}
                            >
                              {ratio.label}
                            </button>
                          ))}
                        </div>

                    </div>
  
                    {/* 底部：左模型选择，右生成按钮 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* 模型选择开关 */}
                      <div className="flex items-center gap-4 bg-input-bg p-3 rounded-xl border border-border/50">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold transition-colors ${model === 'nano-banana-pro' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                              {model === 'nano-banana-pro' ? 'Pro 专业版' : '标准版'}
                            </span>
                            {model === 'nano-banana-pro' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white font-black uppercase tracking-wider">
                                PRO
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setModel(model === 'nano-banana' ? 'nano-banana-pro' : 'nano-banana')}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none shadow-inner ${
                            model === 'nano-banana-pro' ? 'bg-blue-600 shadow-blue-900/20' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-out ${
                              model === 'nano-banana-pro' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* 分辨率选择 - 仅在 Pro 模式显示 */}
                      {model === 'nano-banana-pro' && (
                        <div className="flex items-center gap-2 bg-input-bg p-2 rounded-xl border border-border/50 animate-in slide-in-from-left-2 duration-300">
                          {(['1K', '2K', '4K'] as const).map((res) => (
                            <button
                              key={res}
                              onClick={() => setResolution(res)}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                resolution === res
                                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                  : 'text-gray-500 hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                            >
                              {res}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        本次生成所需积分: <span className="text-orange-400 font-bold">{currentPoints}</span>
                      </span>
                      {vipLevel !== 'FREE' && (
                        <span className="text-[11px] text-green-500 font-medium">
                          {vipLevel} 专享优惠 -{vipLevel === 'SVIP' ? '5' : '3'} 积分
                        </span>
                      )}
                      {vipLevel === 'FREE' && (
                        <span className="text-[11px] text-gray-400">
                          VIP 减 3，SVIP 减 5
                        </span>
                      )}
                    </div>
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
              <div className="mt-8 flex justify-center items-start gap-4">
                {pageStatus === 'success' && imageUrl ? (
                  <>
                    <button
                      onClick={() => downloadImage(imageUrl)}
                      className="flex flex-col items-center gap-2 p-3 bg-white/10 hover:bg-white/20 border border-border rounded-xl transition-all group shrink-0"
                      title="下载图像"
                    >
                      <Download className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-gray-500">下载</span>
                    </button>
                    <div className="relative group cursor-zoom-in" onClick={() => setIsZoomed(true)}>
                      <Image
                        src={imageUrl}
                        alt="Generated"
                        width={800}
                        height={800}
                        className="rounded-lg shadow-lg max-w-full"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white/30 backdrop-blur-md p-3 rounded-full border border-white/40">
                          <Maximize2 className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </>
                ) : pageStatus === 'polling' ? (
                  <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                    <p className="text-foreground">正在生成...</p>
                  </div>
                ) : (
                  <div className="text-gray-400 py-10">点击"生成图像"开始创作</div>
                )}
            </div>

            {/* 灯箱预览 */}
            {isZoomed && imageUrl && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <button 
                  onClick={() => setIsZoomed(false)}
                  className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center gap-6">
                  <Image
                    src={imageUrl}
                    alt="Zoomed"
                    width={1600}
                    height={1600}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                    unoptimized
                  />
                  <button
                    onClick={() => downloadImage(imageUrl)}
                    className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                  >
                    <Download className="w-6 h-6" />
                    立即下载高清图
                  </button>
                </div>
                <div className="absolute inset-0 -z-10" onClick={() => setIsZoomed(false)} />
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-gray-400 text-sm border-t border-border">
        © {new Date().getFullYear()} lstwin-空间营造师的创作伴侣————powered by nanobanana
      </footer>
    </div>
  );
}
