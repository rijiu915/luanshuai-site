'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Check, LayoutGrid, ChevronUp, Sparkles } from 'lucide-react';
import { TEMPLATES, type Template } from '@/lib/templates';

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
}

const BADGE_STYLES: Record<string, string> = {
  '生成': 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  '分析': 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20',
  '编辑': 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20',
};

const BADGE_DOT: Record<string, string> = {
  '生成': 'bg-blue-500',
  '分析': 'bg-purple-500',
  '编辑': 'bg-orange-500',
};

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [displayTemplates, setDisplayTemplates] = useState<Template[]>([]);
  const [isAllView, setIsAllView] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const shuffled = [...TEMPLATES].sort(() => Math.random() - 0.5);
    setDisplayTemplates(shuffled);
  }, []);

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollButtons);
      checkScrollButtons();
      return () => el.removeEventListener('scroll', checkScrollButtons);
    }
  }, [displayTemplates]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 320 : scrollLeft + 320;
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
      {/* 标题行 */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <h3 className="text-base font-bold text-foreground">快速开始 — 选择专业模板</h3>
          <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
            {TEMPLATES.length}+ 模板
          </span>
        </div>
        <button
          onClick={() => setIsAllView(!isAllView)}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-600 dark:hover:text-blue-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-500/8 border border-transparent hover:border-blue-500/15"
        >
          {isAllView ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              收起
            </>
          ) : (
            <>
              <LayoutGrid className="w-3.5 h-3.5" />
              查看全部
            </>
          )}
        </button>
      </div>

      {/* 横向滚动 */}
      {!isAllView ? (
        <div className="relative">
          {/* 左侧渐变遮罩 */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          )}
          {/* 右侧渐变遮罩 */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          )}

          {/* 左箭头 */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 glass rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200 border border-border"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
          )}

          {/* 滚动容器 */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className="flex-shrink-0 w-[200px] text-left group/card shine-effect rounded-xl overflow-hidden border border-border hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/8 bg-card-bg"
              >
                {/* 封面图 */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={template.image}
                    alt={template.name}
                    fill
                    className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  {/* badge */}
                  <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-sm ${BADGE_STYLES[template.badge] || 'bg-black/50 text-white border border-white/10'}`}>
                    <span className="flex items-center gap-1">
                      <span className={`w-1 h-1 rounded-full ${BADGE_DOT[template.badge] || 'bg-white'}`} />
                      {template.badge}
                    </span>
                  </div>
                </div>
                {/* 名称 */}
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-foreground group-hover/card:text-blue-500 transition-colors line-clamp-1 leading-snug">
                    {template.name}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* 右箭头 */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 glass rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200 border border-border"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          )}
        </div>
      ) : (
        // 全部模板网格
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 animate-in fade-in slide-in-from-top-4 duration-400">
          {displayTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className="text-left group/card shine-effect rounded-xl overflow-hidden border border-border hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/8 bg-card-bg"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={template.image}
                  alt={template.name}
                  fill
                  className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-sm ${BADGE_STYLES[template.badge] || 'bg-black/50 text-white border border-white/10'}`}>
                  <span className="flex items-center gap-1">
                    <span className={`w-1 h-1 rounded-full ${BADGE_DOT[template.badge] || 'bg-white'}`} />
                    {template.badge}
                  </span>
                </div>
              </div>
              <div className="p-2">
                <p className="text-xs font-semibold text-foreground group-hover/card:text-blue-500 transition-colors line-clamp-1">
                  {template.name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 模板详情弹窗 */}
      {selectedTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => e.target === e.currentTarget && setSelectedTemplate(null)}
        >
          <div className="bg-card-bg border border-border rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl shadow-black/30 animate-in zoom-in-95 duration-200">
            {/* 封面 */}
            <div className="relative aspect-video w-full">
              <Image
                src={selectedTemplate.image}
                alt={selectedTemplate.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <button
                onClick={() => setSelectedTemplate(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-5 left-5 right-5">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold mb-2 inline-flex items-center gap-1 backdrop-blur-sm ${BADGE_STYLES[selectedTemplate.badge] || 'bg-blue-600 text-white'}`}>
                  <span className={`w-1 h-1 rounded-full ${BADGE_DOT[selectedTemplate.badge] || 'bg-white'}`} />
                  {selectedTemplate.badge}
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
                  {selectedTemplate.name}
                </h2>
              </div>
            </div>

            {/* 内容 */}
            <div className="p-5 md:p-6">
              {selectedTemplate.description && (
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedTemplate.description}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  取消
                </button>
                <button
                  onClick={handleApply}
                  className="btn-magnetic flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
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
