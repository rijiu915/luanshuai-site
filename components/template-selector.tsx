'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Template {
  id: string;
  name: string;
  prompt: string;
  image: string;
  category: string;
}

export const TEMPLATES: Template[] = [
  {
    id: '1',
    name: '平面图转3D',
    category: '建筑',
    prompt: 'Render this architectural plan as photorealistic 3D model, Nano Banana style, high detail materials, natural daylight, sharp edges',
    image: 'https://images.unsplash.com/photo-1503387762-592dee58c460?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: '2',
    name: '立面图生成',
    category: '效果',
    prompt: 'Convert building facade image to photorealistic render, precise architectural details, modern glass and steel materials, blue hour lighting',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: '3',
    name: '草图转渲染',
    category: '创意',
    prompt: 'Transform architectural sketch into photorealistic render, residential style, dramatic lighting, rich vegetation, cinematic atmosphere',
    image: 'https://images.unsplash.com/photo-1600585154340-be6191da95b8?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: '4',
    name: '室内空间',
    category: '室内',
    prompt: 'Dramatic interior visualization of a modern living room, warm ambient lighting, high-end materials, floor-to-ceiling windows, 8k resolution',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: '5',
    name: '城市规划',
    category: '规划',
    prompt: 'Urban masterplan visualization, sustainable mixed-use development, aerial view, green spaces, photorealistic textures, daytime',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: '6',
    name: '概念未来',
    category: '概念',
    prompt: 'Futuristic organic skyscraper, fluid forms, bio-integrated architecture, sunset lighting, cinematic render, sharp details',
    image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: '7',
    name: '旧房翻新',
    category: '改造',
    prompt: 'Adaptive reuse of an old industrial warehouse into a modern creative office, preserving brick walls, high ceilings, sustainable makeover',
    image: 'https://images.unsplash.com/photo-1515542706656-8e6ef17a1ed2?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: '8',
    name: '景观园林',
    category: '景观',
    prompt: 'Public urban park with a modern bridge, recreational areas, pedestrians, golden hour, photorealistic landscape design',
    image: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&q=80&w=400&h=300'
  }
];

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth / 1.5 
        : scrollLeft + clientWidth / 1.5;
      
      scrollRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="w-full py-4 relative group/selector">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-lg font-semibold text-foreground">快速开始 - 选择模板</h3>
        <span className="text-sm text-gray-500">向左滑动查看更多</span>
      </div>
      
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-background/90 border border-border rounded-full shadow-xl opacity-0 group-hover/selector:opacity-100 transition-opacity hover:bg-background hover:scale-110 active:scale-95 hidden md:block"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-background/90 border border-border rounded-full shadow-xl opacity-0 group-hover/selector:opacity-100 transition-opacity hover:bg-background hover:scale-110 active:scale-95 hidden md:block"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6 text-foreground" />
        </button>

        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 pb-4 no-scrollbar scroll-smooth snap-x"
        >
          {TEMPLATES.map((template) => (
            <div
              key={template.id}
              onClick={() => onSelect(template)}
              className="flex-shrink-0 w-40 md:w-48 group cursor-pointer snap-start"
            >
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2 border border-border group-hover:border-blue-500 transition-colors">
                <Image
                  src={template.image}
                  alt={template.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 bg-black/60 text-[10px] text-white rounded backdrop-blur-sm">
                    {template.category}
                  </span>
                </div>
              </div>
              <h4 className="text-sm font-medium text-foreground truncate group-hover:text-blue-500 transition-colors">
                {template.name}
              </h4>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
