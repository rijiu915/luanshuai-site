'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Template {
  id: string;
  name: string;
  prompt: string;
  image: string;
  badge: string;
}

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
}

const TEMPLATES: Template[] = [
  {
    id: 'render-style',
    name: '渲染风格分析',
    badge: '分析',
    prompt: '建筑渲染风格分析，大师级作品，超写实，高细节，电影级光影，极简主义风格',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000',
  },
  {
    id: 'general-layout',
    name: '总图填色渲染',
    badge: '生成',
    prompt: '彩色总平面图，景观填色，建筑阴影，手绘感，专业规划图纸风格',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=1000',
  },
  {
    id: 'material-analysis',
    name: '建筑材料分析',
    badge: '分析',
    prompt: '建筑材料质感分析，混凝土、玻璃、木材对比，写实光影，材质细节展示',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000',
  },
  {
    id: 'bird-eye-view',
    name: '总平面与立面生鸟瞰',
    badge: '生成',
    prompt: '建筑群鸟瞰图，城市景观，日景，广角镜头，航拍视角，宏大叙事',
    image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=1000',
  },
  {
    id: 'modify-render',
    name: '修改效果图',
    badge: '修改',
    prompt: '对现有建筑效果图进行局部修改，增加植被，调整光照，优化材质表现',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=1000',
  },
];

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 300 : scrollLeft + 300;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-10 w-full">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-xl font-bold text-foreground">快速开始 - 选择模板</h3>
        <span className="text-sm text-gray-400">向左滑动查看更多</span>
      </div>

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
          {TEMPLATES.map((template) => (
            <div
              key={template.id}
              onClick={() => onSelect(template)}
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
    </div>
  );
}
