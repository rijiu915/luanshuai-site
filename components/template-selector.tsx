'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Check, ChevronDown, ChevronUp, LayoutGrid } from 'lucide-react';
import { TEMPLATES, type Template } from '@/lib/templates';

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {

  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [displayTemplates, setDisplayTemplates] = useState<Template[]>([]);
  const [isAllView, setIsAllView] = useState(false);

  useEffect(() => {
    // 随机打乱模板顺序
    const shuffled = [...TEMPLATES].sort(() => Math.random() - 0.5);
    setDisplayTemplates(shuffled);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 300 : scrollLeft + 300;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleApply = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
      setSelectedTemplate(null);
      setIsAllView(false);
    }
  };

  return (
    <div className="mb-10 w-full">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-xl font-bold text-foreground">快速开始 - 选择模板</h3>
        <div className="flex items-center gap-4">
          {!isAllView && <span className="text-sm text-gray-400 hidden md:inline">向左滑动查看更多</span>}
          <button 
            onClick={() => setIsAllView(!isAllView)}
            className="flex items-center gap-1 text-sm font-bold text-blue-500 hover:text-blue-600 transition-colors"
          >
            {isAllView ? (
              <>
                <ChevronUp className="w-4 h-4" />
                收起全部
              </>
            ) : (
              <>
                <LayoutGrid className="w-4 h-4" />
                查看全部
              </>
            )}
          </button>
        </div>
      </div>

      {!isAllView ? (
        <div className="relative group">
          {/* Left Arrow */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>

          {/* Scroll Container */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className="flex-shrink-0 w-[240px] cursor-pointer group/card"
              >
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3 border border-border">
                  <Image
                    src={template.image}
                    alt={template.name}
                    fill
                    className="object-cover group-hover/card:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] text-white font-medium">
                    {template.badge}
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground group-hover/card:text-blue-500 transition-colors">
                  {template.name}
                </p>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ChevronRight className="w-6 h-6 text-foreground" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          {displayTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className="cursor-pointer group/card"
            >
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2 border border-border">
                <Image
                  src={template.image}
                  alt={template.name}
                  fill
                  className="object-cover group-hover/card:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] text-white font-medium">
                  {template.badge}
                </div>
              </div>
              <p className="text-xs font-medium text-foreground group-hover/card:text-blue-500 transition-colors line-clamp-1">
                {template.name}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card-bg border border-border rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="relative aspect-video w-full">
              <Image
                src={selectedTemplate.image}
                alt={selectedTemplate.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <button
                onClick={() => setSelectedTemplate(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="absolute bottom-6 left-6 right-6">
                <span className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded uppercase tracking-wider mb-2 inline-block">
                  {selectedTemplate.badge}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {selectedTemplate.name}
                </h2>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8">
              <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                  功能描述
                </h4>
                <p className="text-foreground leading-relaxed">
                  {selectedTemplate.description || '暂无详细描述'}
                </p>
              </div>


              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="flex-1 px-6 py-3 border border-border rounded-xl font-medium text-foreground hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  取消
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  立即应用
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
