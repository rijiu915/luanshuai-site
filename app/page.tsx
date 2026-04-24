'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Maximize2, Download, ZoomIn, Pencil } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { Navbar } from '@/components/navbar';
import { TemplateSelector } from '@/components/template-selector';
import { type Template } from '@/lib/templates';

// 上传图片项组件 - 支持放大查看和编辑
interface UploadedImageItemProps {
  file: File;
  fileUrl: string;
  onPreview: (url: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const UploadedImageItem = memo(function UploadedImageItem({ file, fileUrl, onPreview, onEdit, onDelete }: UploadedImageItemProps) {
  return (
    <div className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer">
      <Image
        src={fileUrl}
        alt={file.name}
        width={200}
        height={200}
        className="w-full h-full object-cover"
        unoptimized
        onClick={() => onPreview(fileUrl)}
      />
      {/* 悬停遮罩层 */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview(fileUrl);
          }}
          className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-2 rounded-full border border-white/40 transition-all hover:scale-110"
          title="放大查看"
        >
          <Maximize2 className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-2 rounded-full border border-white/40 transition-all hover:scale-110"
          title="编辑图片"
        >
          <Pencil className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="bg-red-500/80 hover:bg-red-600 backdrop-blur-md p-2 rounded-full border border-white/40 transition-all hover:scale-110"
          title="删除"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
});

export default function HomePage() {

const router = useRouter();

  const editImage = (file: File) => {
    const url = URL.createObjectURL(file);
    console.log('editImage called, creating URL:', url.substring(0, 50) + '...');
    // Persist a small reference so returning won't lose the selected reference image
    try {
      sessionStorage.setItem('editorSourceImage', url);
      console.log('Stored editorSourceImage in sessionStorage');
    } catch (err) {
      console.error('Failed to store editorSourceImage:', err);
    }
    router.push(`/editor?image=${encodeURIComponent(url)}`);
  };


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

    const { data: session, status: sessionStatus } = useSession();
    const [prompt, setPrompt] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [adaptiveRatio, setAdaptiveRatio] = useState<string | null>(null);
    const [useAdaptive, setUseAdaptive] = useState(false);
    const [resolution, setResolution] = useState<'1K' | '2K' | '4K'>('2K');
    const [uploadedFiles, setUploadedFiles] = useState<{ file: File; previewUrl: string }[]>([]);
    const [isZoomed, setIsZoomed] = useState(false);
    const [model, setModel] = useState<'nano-banana' | 'nano-banana-pro' | 'gpt-image-2'>('nano-banana');

    // 清理预览 URL
    useEffect(() => {
      return () => {
        uploadedFiles.forEach(({ previewUrl }) => {
          URL.revokeObjectURL(previewUrl);
        });
      };
    }, []);

      // Restore edited image (or original) when coming back from editor
      useEffect(() => {
        let cancelled = false;

        const setFirstUploadFromUrl = async (url: string, filename: string, isEdited: boolean = false) => {
          console.log('setFirstUploadFromUrl called, url:', url.substring(0, 50) + (url.length > 50 ? '...' : ''), 'isEdited:', isEdited);

          try {
            let file: File | null = null;

            // 检查 URL 类型
            if (url.startsWith('data:')) {
              console.log('Processing Base64 data URL...');
              // 直接从 data URL 解析出 MIME 类型和 base64 数据
              const matches = url.match(/^data:([^;]+);base64,(.+)$/);
              if (!matches) {
                throw new Error('Invalid data URL format');
              }
              const mimeType = matches[1];
              const base64Data = matches[2];
              
              // 将 base64 转换为二进制数据
              const binaryString = atob(base64Data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: mimeType });
              console.log('Blob created from Base64, size:', blob.size, 'type:', blob.type);
              
              if (cancelled) {
                console.log('Operation cancelled');
                return;
              }
              if (blob.size === 0) {
                console.error('Blob is empty!');
                throw new Error('Blob is empty');
              }
              file = new File([blob], filename, { type: mimeType || 'image/jpeg' });
              console.log('File created from Base64:', file.name, file.size, file.type);
            } else if (url.startsWith('blob:')) {
              console.log('Processing blob URL...');
              const response = await fetch(url);
              if (!response.ok) {
                console.error('Fetch failed with status:', response.status, response.statusText);
                throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
              }
              const blob = await response.blob();
              console.log('Blob fetched from blob URL, size:', blob.size, 'type:', blob.type);
              if (blob.size === 0) {
                console.error('Blob is empty!');
                throw new Error('Blob is empty');
              }
              file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
            } else {
              console.log('Processing regular URL...');
              const response = await fetch(url);
              if (!response.ok) {
                throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
              }
              const blob = await response.blob();
              file = new File([blob], filename, { type: blob.type });
            }

            if (cancelled || !file) {
              console.log('Operation cancelled or file is null');
              return;
            }

            console.log('Setting first upload:', file.name, file.size);
            // 直接使用 File 创建预览 URL
            const previewUrl = URL.createObjectURL(file);
            setUploadedFiles([{ file, previewUrl }]);
          } catch (err) {
            console.error('Failed to set first upload from URL:', err);
            if (err instanceof Error) {
              console.error('Error name:', err.name, 'message:', err.message);
            }
          }
        };

        const checkSessionStorage = () => {
          try {
            const editedImage = sessionStorage.getItem('editedImage');
            console.log('Checking sessionStorage for editedImage:', editedImage ? 'found (' + Math.round((editedImage?.length || 0) / 1024) + ' KB)' : 'not found');

            if (editedImage) {
              console.log('Found edited image in sessionStorage, processing...');
              setFirstUploadFromUrl(editedImage, 'edited-image.jpg', true);
              sessionStorage.removeItem('editedImage');
            } else {
              console.log('No edited image found');
            }
          } catch (err) {
            console.error('Failed to access sessionStorage:', err);
          }
        };

        checkSessionStorage();

        return () => {
          cancelled = true;
        };
      }, []);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      console.log('Files selected:', files.map(f => `${f.name} (${f.size} bytes)`));
      if (files.length === 0) {
        console.warn('No files selected');
        return;
      }
      // 创建包含预览 URL 的文件对象
      const filesWithUrls = files.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));
      setUploadedFiles(filesWithUrls);
      // 检测第一张图片的宽高比
      if (files[0]) {
        detectImageRatio(files[0]);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      console.log('Files dropped:', files.map(f => `${f.name} (${f.size} bytes)`));
      if (files.length === 0) {
        console.warn('No files dropped');
        return;
      }
      // 创建包含预览 URL 的文件对象
      const filesWithUrls = files.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));
      setUploadedFiles(filesWithUrls);
      // 检测第一张图片的宽高比
      if (files[0]) {
        detectImageRatio(files[0]);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // 检测图片宽高比
    const detectImageRatio = (file: File) => {
      const img = new window.Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        let ratioString: string;
        
        // 根据比例判断常见的宽高比
        if (ratio > 1.7) ratioString = '16:9';
        else if (ratio > 1.3) ratioString = '4:3';
        else if (ratio > 0.9 && ratio < 1.1) ratioString = '1:1';
        else if (ratio < 0.6) ratioString = '9:16';
        else ratioString = '3:4';
        
        setAdaptiveRatio(`${img.width}:${img.height}`);
        setUseAdaptive(true);
        setAspectRatio(ratioString);
        console.log(`Detected image ratio: ${img.width}x${img.height} (${ratioString})`);
      };
      img.src = URL.createObjectURL(file);
    };

    const [pageStatus, setPageStatus] = useState<'idle' | 'submitting' | 'polling'>('idle');
    const [taskId, setTaskId] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<any[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // 上传图片到临时存储获取可访问URL
    const uploadImages = async (files: File[]): Promise<string[]> => {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch('/api/upload-temp', { method: 'POST', body: formData });
        if (!res.ok) throw new Error(`上传失败: ${file.name}`);
        const data = await res.json();
        return data.url;
      });
      return Promise.all(uploadPromises);
    };

    const handleGenerate = async () => {
      if (!prompt && !selectedTemplate) {
        console.warn('Generate called without prompt or template');
        alert('请输入提示词或选择模板');
        return;
      }

      if (!session?.user?.email) {
        console.warn('User not logged in');
        alert('请先登录');
        router.push('/login');
        return;
      }

      setPageStatus('submitting');

      try {
        // 先上传图片获取可访问URL
        let imageUrls: string[] = [];
        if (uploadedFiles.length > 0) {
          try {
            const files = uploadedFiles.map(item => item.file);
            imageUrls = await uploadImages(files);
          } catch (err) {
            setPageStatus('idle');
            alert('图片上传失败，请重试');
            return;
          }
        }

        // 构建最终prompt：如果有模板，使用模板的完整prompt + 用户的补充内容
        let finalPrompt = prompt;
        if (selectedTemplate) {
          finalPrompt = selectedTemplate.prompt;
          if (prompt.trim()) {
            finalPrompt += `，${prompt.trim()}`;
          }
        }

        const type = imageUrls.length > 0 ? 'IMAGETOIAMGE' : 'TEXTTOIAMGE';

        const body: any = {
          prompt: finalPrompt,
          type,
          aspectRatio: useAdaptive && adaptiveRatio ? adaptiveRatio : aspectRatio,
          model,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        };

        // 仅在 Pro 模式下添加 resolution
        if (model === 'nano-banana-pro') {
          body.resolution = resolution;
        }

        console.log('Calling generate API with:', {
          prompt: body.prompt,
          type: body.type,
          aspectRatio: body.aspectRatio,
          model: body.model,
          resolution: body.resolution,
          hasImages: imageUrls.length,
        });

        // gpt-image-2 使用独立的同步 API
        if (model === 'gpt-image-2') {
          const res = await fetch('/api/generate-openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const errorText = await res.text();
            console.error('OpenAI API HTTP error:', res.status, errorText);
            throw new Error(`服务器错误 (${res.status}): ${errorText || '未知错误'}`);
          }

          const data = await res.json();

          if (data.code !== 200) {
            console.error('OpenAI API error:', data);
            throw new Error(data.msg || '生成失败');
          }

          // 同步返回，直接拿到图片 URL
          const resultImageUrl = data.data?.response?.resultImageUrl;
          if (resultImageUrl) {
            setPageStatus('idle');
            setGeneratedImages([{ url: resultImageUrl }]);
          } else {
            throw new Error('未返回图片');
          }
          return;
        }

        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        // 检查 HTTP 状态码
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Generate API HTTP error:', res.status, errorText);
          throw new Error(`服务器错误 (${res.status}): ${errorText || '未知错误'}`);
        }

        const data = await res.json();

        if (data.code !== 200 && data.code !== 0) {
          console.error('Generate API error:', data);
          throw new Error(data.msg || data.error || '生成失败');
        }

        const generatedTaskId = data.data?.taskId || data.data?.[0]?.taskId || data.taskId;
        console.log('Task ID:', generatedTaskId);

        setTaskId(generatedTaskId);
        setPageStatus('polling');

        // Start polling
        pollTaskStatus(generatedTaskId);
      } catch (error: any) {
        console.error('Generate error:', error);
        alert(`生成失败: ${error.message}`);
        setPageStatus('idle');
      }
    };

    const pollTaskStatus = async (id: string) => {
      console.log('Polling task status for ID:', id);
      const maxAttempts = 120;
      let attempts = 0;

      const pollInterval = setInterval(async () => {
        attempts++;
        console.log(`Poll attempt ${attempts}/${maxAttempts}`);

        try {
          const res = await fetch(`/api/task/${id}`);
          const data = await res.json();

          console.log('Task status response:', data);

          // 解析 NanoBanana API 响应结构
          // 文档: https://docs.nanobananaapi.ai/nanobanana-api/get-task-details
          const apiCode = data.code;
          const successFlag = data.data?.successFlag; // 0=生成中, 1=成功, 2=创建失败, 3=生成失败
          const resultImageUrl = data.data?.response?.resultImageUrl;
          const errorMessage = data.data?.errorMessage;
          
          console.log('Parsed status:', { apiCode, successFlag, resultImageUrl, errorMessage });

          // 判断任务状态
          if (successFlag === 1 && resultImageUrl) {
            // 任务成功完成
            clearInterval(pollInterval);
            console.log('Task completed with image:', resultImageUrl);
            console.log('Setting generatedImages state...');
            setPageStatus('idle');
            setGeneratedImages([{ url: resultImageUrl }]);
            console.log('generatedImages should now be updated');
          } else if (successFlag === 2 || successFlag === 3) {
            // 任务失败 (2=创建失败, 3=生成失败)
            clearInterval(pollInterval);
            console.error('Task failed:', errorMessage || data);
            setPageStatus('idle');
            alert(`生成失败: ${errorMessage || '请重试'}`);
          } else if (attempts >= maxAttempts) {
            // 轮询超时
            clearInterval(pollInterval);
            console.error('Polling timeout');
            setPageStatus('idle');
            alert('生成超时，请重试');
          }
          // successFlag === 0 或其他情况继续轮询
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 2000);
    };

    const renderGeneratedImages = () => {
      if (generatedImages.length === 0) return null;

      return (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-foreground">生成结果</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedImages.map((img, idx) => {
              const imageUrl = img.url || img;
              return (
                <div key={idx} className="relative group rounded-lg overflow-hidden cursor-pointer">
                  <Image
                    src={imageUrl}
                    alt={`Generated ${idx + 1}`}
                    width={400}
                    height={300}
                    className="w-full h-auto object-cover"
                    onClick={() => setPreviewImage(imageUrl)}
                  />
                  {/* 悬停遮罩层 */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImage(imageUrl);
                      }}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-3 rounded-full border border-white/40 transition-all hover:scale-110"
                    >
                      <Maximize2 className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // 下载图片
                        const link = document.createElement('a');
                        link.href = imageUrl;
                        link.download = `generated-image-${idx + 1}.png`;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-3 rounded-full border border-white/40 transition-all hover:scale-110"
                    >
                      <Download className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <>
        <Navbar />

        <main className="container mx-auto px-4 py-12 md:py-20">

          <div className={`${generatedImages.length > 0 && generatedImages[0]?.url ? 'flex gap-6' : ''}`}>

            {/* 左侧：编辑界面（生成后可滚动） */}
            <div className={`${generatedImages.length > 0 && generatedImages[0]?.url ? 'w-96 flex-shrink-0 overflow-y-auto max-h-[calc(100vh-12rem)]' : ''}`}>

            {/* Hero 区域 - 生成后隐藏 */}
            {!(generatedImages.length > 0 && generatedImages[0]?.url) && (
            <div className="text-center mb-12 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-5 animate-fade-up">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                建筑概念图 AI 生成工具
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 animate-fade-up-delay-1">
                <span className="text-foreground">用文字描述</span>
                <br />
                <span className="gradient-text-blue">生成专业概念图</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mb-2 max-w-xl mx-auto animate-fade-up-delay-2">
                支持文生图 & 图生图，30+ 专业建筑模板，覆盖效果图、分析图、立面图全工作流
              </p>
              <div className="flex items-center justify-center gap-4 mt-5 animate-fade-up-delay-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  标准版 15 积分/张
                </div>
                <div className="w-px h-3 bg-border" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  Pro 最高 4K 超清
                </div>
                <div className="w-px h-3 bg-border" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <svg className="w-3.5 h-3.5 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  VIP 专属折扣
                </div>
              </div>
            </div>
            )}

            {/* 模板选择 - 生成后保留 */}
            <TemplateSelector
              onSelect={(template) => {
                setSelectedTemplate(template);
                // 清空补充内容输入框，模板prompt不显示在前端
                setPrompt('');
              }}
            />

            {/* 操作面板 */}
            <div className="relative min-h-[500px] border border-border rounded-2xl bg-card-bg p-6 md:p-8 shadow-sm">

              {pageStatus === 'polling' && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-lg font-medium text-foreground">正在生成图像...</p>
                    <p className="text-sm text-muted-foreground">这可能需要 10-30 秒</p>
                  </div>
                </div>
              )}

              {/* 文件上传区域 */}
              <div className="mb-6">
                <label
                  ref={dropZoneRef}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-lg hover:border-blue-500/50 transition-colors cursor-pointer bg-input-bg"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Pencil className="w-10 h-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">点击上传</span> 或拖拽图片到这里
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">支持 PNG, JPG, WebP 格式</p>
                </label>
              </div>

              {/* 已上传文件列表 */}
              {uploadedFiles.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-foreground">已上传 {uploadedFiles.length} 张图片</h4>
                    <button
                      onClick={() => {
                        setUploadedFiles([]);
                        setUseAdaptive(false);
                        setAdaptiveRatio(null);
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      清空
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {uploadedFiles.map((item, idx) => (
                      <UploadedImageItem
                        key={`${item.file.name}-${idx}`}
                        file={item.file}
                        fileUrl={item.previewUrl}
                        onPreview={(url) => setPreviewImage(url)}
                        onEdit={() => editImage(item.file)}
                        onDelete={() => {
                          const newFiles = [...uploadedFiles];
                          newFiles.splice(idx, 1);
                          setUploadedFiles(newFiles);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 模板标记 */}
              {selectedTemplate && (
                <div className="mb-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">正在使用模板</p>
                        <p className="text-sm font-semibold text-foreground">{selectedTemplate.name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTemplate(null);
                        setPrompt('');
                      }}
                      className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* 提示词/补充内容输入 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {selectedTemplate ? '补充内容（可选）' : '提示词'}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={selectedTemplate 
                    ? `请输入个性化补充说明（例如：调整材质颜色、修改环境光影等）...` 
                    : "例如：一个现代风格的半透明玻璃艺术馆，周围环绕着茂密的森林，夕阳余晖..."}
                  className="w-full h-32 p-4 bg-input-bg border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 text-foreground placeholder-muted-foreground resize-none transition-all shadow-inner text-sm leading-relaxed"
                />
                {selectedTemplate && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    模板提示词将在后端自动应用，您可以在上方添加个性化补充说明
                  </p>
                )}
              </div>

              {/* 模型选择 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-3">
                  生成模型
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setModel('nano-banana')}
                    className={`flex-1 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                      model === 'nano-banana'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/25'
                        : 'bg-input-bg border-border text-foreground hover:border-blue-500/50'
                    }`}
                  >
                    标准版
                    <span className="block text-[10px] opacity-70 mt-0.5">15 积分/张</span>
                  </button>
                  <button
                    onClick={() => setModel('nano-banana-pro')}
                    className={`flex-1 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                      model === 'nano-banana-pro'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-purple-500/25'
                        : 'bg-input-bg border-border text-foreground hover:border-purple-500/50'
                    }`}
                  >
                    Pro 专业版
                    <span className="block text-[10px] opacity-70 mt-0.5">60-90 积分/张</span>
                  </button>
                  <button
                    onClick={() => setModel('gpt-image-2')}
                    className={`flex-1 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                      model === 'gpt-image-2'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/25'
                        : 'bg-input-bg border-border text-foreground hover:border-emerald-500/50'
                    }`}
                  >
                    GPT Image
                    <span className="block text-[10px] opacity-70 mt-0.5">30 积分/张</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {model === 'nano-banana' 
                    ? '标准版：15 积分/张，适合快速预览' 
                    : model === 'nano-banana-pro'
                    ? 'Pro 专业版：60-90 积分/张，支持 2K/4K 超清输出'
                    : 'GPT Image 2：30 积分/张，OpenAI 最新图像生成模型'}
                </p>
              </div>

              {/* 宽高比选择 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">
                    宽高比
                  </label>
                  {adaptiveRatio && (
                    <button
                      onClick={() => setUseAdaptive(!useAdaptive)}
                      className={`text-xs font-medium px-2 py-1 rounded-lg border transition-all ${
                        useAdaptive
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-input-bg text-muted-foreground border-border hover:border-blue-500/50'
                      }`}
                    >
                      自适应 ({adaptiveRatio})
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  {['16:9', '4:3', '1:1', '9:16', '3:4'].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => {
                        setAspectRatio(ratio);
                        setUseAdaptive(false);
                      }}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        aspectRatio === ratio && !useAdaptive
                          ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/25'
                          : 'bg-input-bg border-border text-foreground hover:border-blue-500/50'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* 分辨率选择 - 仅在 Pro 模式显示 */}
              {model === 'nano-banana-pro' && (
                <div className="mb-6 animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    分辨率
                  </label>
                  <div className="flex gap-3">
                    {(['1K', '2K', '4K'] as const).map((res) => (
                      <button
                        key={res}
                        onClick={() => setResolution(res)}
                        className={`px-4 py-2 rounded-lg border transition-all ${
                          resolution === res
                            ? 'bg-purple-600 text-white border-purple-600 shadow-purple-500/25'
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
              <div className="flex justify-center">
                <button
                  onClick={handleGenerate}
                  disabled={pageStatus === 'submitting' || pageStatus === 'polling'}
                  className={`btn-magnetic px-7 py-2.5 rounded-xl font-semibold whitespace-nowrap text-white text-sm shadow-lg transition-all ${
                    pageStatus === 'submitting' || pageStatus === 'polling'
                      ? 'bg-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25 animate-pulse-glow'
                  }`}
                >
                  {pageStatus === 'submitting' ? '提交中...' : pageStatus === 'polling' ? '生成中...' : '开始生成'}
                </button>
              </div>
            </div>

            {/* 关闭左侧面板 */}
            </div>

            {/* 右侧：大图预览 */}
            {generatedImages.length > 0 && generatedImages[0]?.url && (
              <div className="flex-1 bg-card-bg border border-border rounded-2xl p-4 flex flex-col overflow-hidden min-h-[500px]">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h3 className="text-lg font-semibold text-foreground">生成结果</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewImage(generatedImages[0].url)}
                      className="px-4 py-2 text-sm bg-input-bg border border-border hover:border-blue-500/50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Maximize2 className="w-4 h-4" />
                      放大
                    </button>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = generatedImages[0].url;
                        link.download = `效果图-${Date.now()}.png`;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      下载
                    </button>
                    <button
                      onClick={() => setGeneratedImages([])}
                      className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 rounded-lg transition-colors"
                    >
                      返回
                    </button>
                  </div>
                </div>
                <div className="flex-1 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-4">
                  <img
                    src={generatedImages[0].url}
                    alt="生成结果"
                    className="max-w-full max-h-full object-contain"
                    style={{ maxHeight: 'calc(100vh - 280px)', maxWidth: '100%' }}
                    onError={(e) => {
                      console.error('图片加载失败:', generatedImages[0].url);
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => console.log('图片加载成功:', generatedImages[0].url)}
                  />
                </div>
              </div>
            )}

          </div>
        </main>

        {/* 图片预览模态框 */}
        {previewImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center">
              {/* 关闭按钮 */}
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
              
              {/* 图片 */}
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              {/* 下载按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const link = document.createElement('a');
                  link.href = previewImage;
                  link.download = 'generated-image.png';
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

        <footer className="py-8 border-t border-border">
          <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" opacity="0.6" />
                  <path d="M2 12l10 5 10-5" opacity="0.4" />
                </svg>
              </div>
              <span>© {new Date().getFullYear()} lstwin · 空间营造师的创作伴侣</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="opacity-60">powered by nanobanana</span>
              <span className="opacity-20">|</span>
              <span className="opacity-70">联系我们：18217272223</span>
            </div>
          </div>

          {/* 用户协议 & 隐私政策 */}
          <div className="container mx-auto px-4 mt-3 flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors leading-none"
            >
              用户协议
            </Link>
            <span className="opacity-40 leading-none">|</span>
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors leading-none"
            >
              隐私政策
            </Link>
            <span className="opacity-40 leading-none">|</span>
            <a
              href="https://beian.miit.gov.cn"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors leading-none"
            >
              浙ICP备2026011642号
            </a>
            <span className="opacity-40 leading-none">|</span>
            <a
              href="https://beian.gov.cn/portal/registerSystemInfo?recordcode=33049802000578"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors leading-none"
            >
              <img src="/beian-icon.png" alt="公安备案" width={14} height={14} style={{ display: 'block' }} />
              浙公网安备33049802000578号
            </a>
          </div>
        </footer>
      </>
    );
  }
