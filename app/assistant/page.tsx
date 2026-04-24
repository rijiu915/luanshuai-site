// app/assistant/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { Navbar } from '@/components/navbar';

// ===== 模型选项 =====
const MODEL_OPTIONS = [
  { value: 'nano-banana', label: 'Nano Banana（标准版）' },
  { value: 'nano-banana-pro', label: 'Nano Banana Pro（专业高清版）' },
  { value: 'gpt-image-2', label: 'GPT Image 2（OpenAI）' },
];

// 新增支持的分辨率选项
type ResolutionOption = '1K' | '2K' | '4K';
const RESOLUTION_OPTIONS: ResolutionOption[] = ['1K', '2K', '4K'];

export default function AssistantPage() {
  // ===== 草图相关 =====
  const [sketchFile, setSketchFile] = useState<File | null>(null);
  const [sketchPreviewUrl, setSketchPreviewUrl] = useState<string | null>(null);
  const [sketchR2Url, setSketchR2Url] = useState<string | null>(null);

  // ===== 效果图相关 =====
  const [effectTaskId, setEffectTaskId] = useState<string | null>(null);
  const [effectImageUrl, setEffectImageUrl] = useState<string | null>(null);
  const [effectStatus, setEffectStatus] = useState<"idle" | "uploading" | "submitting" | "polling" | "success" | "error">("idle");

  // ===== 分析图相关 =====
  const [analysisTaskId, setAnalysisTaskId] = useState<string | null>(null);
  const [analysisImageUrl, setAnalysisImageUrl] = useState<string | null>(null);
 const [analysisStatus, setAnalysisStatus] = useState<"idle" | "uploading" | "submitting" | "polling" | "success" | "error">("idle");

  // ===== 模型与尺寸设置 =====
  const [selectedModel, setSelectedModel] = useState<string>('nano-banana'); // 默认选标准版
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [resolution, setResolution] = useState<ResolutionOption>('2K'); // 默认分辨率为 2K
  const [balance, setBalance] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取余额
  useEffect(() => {
    fetch('/api/user/balance')
      .then(res => res.json())
      .then(data => {
        if (data.balance !== undefined) setBalance(data.balance);
      })
      .catch(console.error);
  }, []);

  const currentPoints = selectedModel === 'gpt-image-2' ? 80 : (selectedModel === 'nano-banana' ? 15 : (resolution === '4K' ? 90 : 60));

  // === 1. 上传草图到 R2 ===
  const uploadSketchToR2 = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload-temp', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

      const data = await res.json();
      if (!data.url) throw new Error('No URL returned');

      return data.url as string;
    } catch (err) {
      console.error('Upload error:', err);
      alert('草图上传失败，请重试');
      throw err;
    }
  };

  // === 2. 处理草图选择 ===
  const handleSketchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSketchFile(file);
    setSketchPreviewUrl(URL.createObjectURL(file));
    setEffectStatus('uploading');

    try {
      const r2Url = await uploadSketchToR2(file);
      setSketchR2Url(r2Url);
      setEffectStatus('idle');
    } catch {
      setEffectStatus('error');
    }
  };

  // === 3. 轮询通用函数 ===
   const startPolling = (
    taskId: string,
    setStatus: React.Dispatch<React.SetStateAction<"idle" | "uploading" | "submitting" | "polling" | "success" | "error">>,
    setImageUrl: React.Dispatch<React.SetStateAction<string | null>>,
    type: 'effect' | 'analysis'
  ) => {
    if (!taskId || taskId === "undefined" || typeof taskId !== 'string' || taskId.trim() === '') return;

    setStatus("polling");
    let pollCount = 0;
    const MAX_POLL_COUNT = 50;

    const interval = setInterval(async () => {
      pollCount++;
      try {
        const res = await fetch(`/api/task/${taskId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          console.error(`[${type}] Task status check failed: ${res.status}`);
          clearInterval(interval);
          setStatus("error");
          return;
        }

        const data = await res.json();
        const taskData = data.data;

        if (data.code === 200 && taskData) {
          const { successFlag, response, errorMessage } = taskData;

          if (successFlag === 1 && response?.resultImageUrl) {
            clearInterval(interval);
            setImageUrl(response.resultImageUrl);
            setStatus("success");
            return;
          }

          if (successFlag === 2 || successFlag === 3) {
            clearInterval(interval);
            console.error(`[${type}] Task failed:`, errorMessage);
            setStatus("error");
            alert(`${type === 'effect' ? '效果图' : '分析图'}生成失败: ${errorMessage || '未知错误'}`);
            return;
          }
        }

        if (pollCount >= MAX_POLL_COUNT) {
          clearInterval(interval);
          setStatus("error");
          alert(`${type === 'effect' ? '效果图' : '分析图'}生成超时，请重试`);
        }
      } catch (err) {
        console.error(`[${type}] Polling error:`, err);
        clearInterval(interval);
        setStatus("error");
      }
    }, 2000);

    return () => clearInterval(interval);
  };

  const downloadImage = async (url: string) => {
    try {
      const proxyUrl = `/api/download?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `lstwin-assistant-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (err) {
      console.error('Download failed:', err);
      window.open(url, '_blank');
    }
  };

  // === 4. 轮询副作用 ===
  useEffect(() => {
    if (effectTaskId) {
      const cleanup = startPolling(effectTaskId, setEffectStatus, setEffectImageUrl, 'effect');
      return cleanup;
    }
  }, [effectTaskId]);

  useEffect(() => {
    if (analysisTaskId) {
      const cleanup = startPolling(analysisTaskId, setAnalysisStatus, setAnalysisImageUrl, 'analysis');
      return cleanup;
    }
  }, [analysisTaskId]);

  // === 5. 生成效果图 ===
  const handleGenerateEffect = async () => {
    if (!sketchR2Url) {
      alert('请先上传草图');
      return;
    }

    setEffectStatus('submitting');
    try {
      // gpt-image-2 使用独立同步 API
      if (selectedModel === 'gpt-image-2') {
        const requestBody: Record<string, any> = {
          prompt: '高清渲染，建筑效果图，逼真材质与光影',
          type: 'IMAGETOIAMGE',
          aspectRatio: aspectRatio,
          model: selectedModel,
          imageUrls: [sketchR2Url],
        };

        const res = await fetch('/api/generate-openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error('OpenAI effect failed:', text);
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        if (data.code === 200 && data.data?.response?.resultImageUrl) {
          setEffectImageUrl(data.data.response.resultImageUrl);
          setEffectStatus('success');
        } else {
          throw new Error(data.msg || '未返回图片');
        }
        return;
      }

      // ✅ 统一使用 aspectRatio 字段（由 /api/generate 内部处理字段映射）
      const requestBody: Record<string, any> = {
        imageUrl: sketchR2Url,
        model: selectedModel,
        aspectRatio: aspectRatio,
        prompt: '高清渲染，建筑效果图，逼真材质与光影',
      };

      // 仅 Pro 模型需要传 resolution
      if (selectedModel === 'nano-banana-pro') {
        requestBody.resolution = resolution;
      }

      const res = await fetch('/api/generate-effect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Generate effect failed:', text);
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.code === 200 && data.data?.taskId) {
        setEffectTaskId(data.data.taskId);
      } else {
        throw new Error(data.message || '未返回有效任务ID');
      }
    } catch (err) {
      console.error('Generate effect error:', err);
      setEffectStatus('error');
      alert('效果图生成提交失败，请重试');
    }
  };

  // === 6. 生成分析图 ===
  const handleGenerateAnalysis = async () => {
    if (!effectImageUrl) {
      alert('请先生成效果图');
      return;
    }

    setAnalysisStatus('submitting');
    try {
      // gpt-image-2 使用独立同步 API
      if (selectedModel === 'gpt-image-2') {
        const requestBody: Record<string, any> = {
          prompt: '分析此图像的设计结构、材质、光影和空间布局，生成一张带标注的分析图',
          type: 'IMAGETOIAMGE',
          aspectRatio: aspectRatio,
          model: selectedModel,
          imageUrls: [effectImageUrl],
        };

        const res = await fetch('/api/generate-openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error('OpenAI analysis failed:', text);
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        if (data.code === 200 && data.data?.response?.resultImageUrl) {
          setAnalysisImageUrl(data.data.response.resultImageUrl);
          setAnalysisStatus('success');
        } else {
          throw new Error(data.msg || '未返回图片');
        }
        return;
      }

      // ✅ 统一使用 aspectRatio 字段
      const requestBody: Record<string, any> = {
        imageUrl: effectImageUrl,
        model: selectedModel,
        aspectRatio: aspectRatio,
      };

      if (selectedModel === 'nano-banana-pro') {
        requestBody.resolution = resolution;
      }

      const res = await fetch('/api/generate-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Generate analysis failed:', text);
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.code === 200 && data.data?.taskId) {
        setAnalysisTaskId(data.data.taskId);
      } else {
        throw new Error(data.message || '未返回有效任务ID');
      }
    } catch (err) {
      console.error('Generate analysis error:', err);
      setAnalysisStatus('error');
      alert('分析图生成提交失败，请重试');
    }
  };

  // === 7. 重置 ===
  const handleReset = () => {
    if (sketchPreviewUrl) URL.revokeObjectURL(sketchPreviewUrl);
    setSketchFile(null);
    setSketchPreviewUrl(null);
    setSketchR2Url(null);
    setEffectTaskId(null);
    setEffectImageUrl(null);
    setEffectStatus('idle');
    setAnalysisTaskId(null);
    setAnalysisImageUrl(null);
    setAnalysisStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-1 p-6 gap-6">
        {/* 左侧：草图上传 + 模型选择 + 尺寸选择 */}
        <div className="w-full md:w-1/3 bg-card-bg p-6 rounded-lg shadow-sm border border-border">
          <h2 className="text-lg font-semibold mb-4 text-foreground">1. 上传草图</h2>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors bg-input-bg"
               onClick={() => fileInputRef.current?.click()}>
            {sketchPreviewUrl ? (
              <Image
                src={sketchPreviewUrl}
                alt="草图预览"
                width={200}
                height={200}
                className="mx-auto max-h-40 object-contain"
              />
            ) : (
              <div>
                <p className="text-gray-500 dark:text-gray-400">点击上传草图</p>
                <p className="text-xs text-gray-400 mt-1">支持 JPG/PNG</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleSketchChange}
            className="hidden"
          />

          {effectStatus === 'uploading' && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">上传中...</p>
          )}

            {/* 模型选择 */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">模型</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedModel('nano-banana')}
                  className={`flex-1 py-2 rounded-lg border transition-all text-sm font-medium ${
                    selectedModel === 'nano-banana'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-input-bg border-border text-foreground hover:border-blue-500/50'
                  }`}
                >
                  标准版
                </button>
                <button
                  onClick={() => setSelectedModel('nano-banana-pro')}
                  className={`flex-1 py-2 rounded-lg border transition-all text-sm font-medium ${
                    selectedModel === 'nano-banana-pro'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-input-bg border-border text-foreground hover:border-purple-500/50'
                  }`}
                >
                  Pro
                </button>
                <button
                  onClick={() => setSelectedModel('gpt-image-2')}
                  className={`flex-1 py-2 rounded-lg border transition-all text-sm font-medium ${
                    selectedModel === 'gpt-image-2'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-input-bg border-border text-foreground hover:border-emerald-500/50'
                  }`}
                >
                  GPT Image
                </button>
              </div>
            </div>

          {/* 添加比例选择 */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">比例</label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full p-2 bg-input-bg border border-border rounded-md focus:ring-blue-500 focus:border-blue-500 text-foreground"
            >
              {['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'].map((r) => (
                <option key={r} value={r} className="bg-input-bg">{r}</option>
              ))}
            </select>
          </div>

          {/* 分辨率选择：仅在选择 'nano-banana-pro' 时显示 */}
          {selectedModel === 'nano-banana-pro' && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">分辨率</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as ResolutionOption)}
                className="w-full p-2 bg-input-bg border border-border rounded-md focus:ring-blue-500 focus:border-blue-500 text-foreground"
              >
                {RESOLUTION_OPTIONS.map((res) => (
                  <option key={res} value={res} className="bg-input-bg">{res}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleReset}
            className="mt-4 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-foreground"
          >
            重置全部
          </button>
        </div>

        {/* 右侧：生成区域 */}
        <div className="flex-1 space-y-8">
            {/* 效果图区块 */}
            <div className="bg-card-bg p-6 rounded-lg shadow-sm border border-border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-foreground">2. 生成效果图</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">消耗 <span className="text-orange-600 dark:text-orange-400 font-bold">{currentPoints}</span> 积分</span>
                  <button
                    onClick={handleGenerateEffect}
                    disabled={!sketchR2Url || effectStatus === 'submitting' || effectStatus === 'polling'}
                    className={`px-4 py-2 rounded-md text-white ${
                      !sketchR2Url || effectStatus === 'submitting' || effectStatus === 'polling'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {effectStatus === 'submitting' ? '提交中...' : '生成效果图'}
                  </button>
                </div>
              </div>


            <div className="bg-input-bg rounded-lg h-64 flex items-center justify-center border border-border relative overflow-hidden group">
              {effectStatus === 'success' && effectImageUrl ? (
                <>
                  <Image
                    src={effectImageUrl}
                    alt="效果图"
                    width={400}
                    height={240}
                    className="max-w-full max-h-full object-contain"
                    unoptimized
                  />
                  <button
                    onClick={() => downloadImage(effectImageUrl)}
                    className="absolute top-2 right-2 p-2 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-500 hover:text-white"
                    title="下载效果图"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </>
              ) : effectStatus === 'polling' ? (
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-500 mb-2"></div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">正在生成效果图...</p>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">点击"生成效果图"开始</p>
              )}
            </div>
          </div>

          {/* 分析图区块 */}
          <div className="bg-card-bg p-6 rounded-lg shadow-sm border border-border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-foreground">3. 生成分析图</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">消耗 <span className="text-orange-600 dark:text-orange-400 font-bold">{currentPoints}</span> 积分</span>
                <button
                  onClick={handleGenerateAnalysis}
                  disabled={!effectImageUrl || analysisStatus === 'submitting' || analysisStatus === 'polling'}
                  className={`px-4 py-2 rounded-md text-white ${
                    !effectImageUrl || analysisStatus === 'submitting' || analysisStatus === 'polling'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {analysisStatus === 'submitting' ? '提交中...' : '生成分析图'}
                </button>
              </div>
            </div>

            <div className="bg-input-bg rounded-lg h-64 flex items-center justify-center border border-border relative overflow-hidden group">
              {analysisStatus === 'success' && analysisImageUrl ? (
                <>
                  <Image
                    src={analysisImageUrl}
                    alt="分析图"
                    width={400}
                    height={240}
                    className="max-w-full max-h-full object-contain"
                    unoptimized
                  />
                  <button
                    onClick={() => downloadImage(analysisImageUrl)}
                    className="absolute top-2 right-2 p-2 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-500 hover:text-white"
                    title="下载分析图"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </>
              ) : analysisStatus === 'polling' ? (
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500 mb-2"></div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">正在生成分析图...</p>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">需先生成效果图</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}