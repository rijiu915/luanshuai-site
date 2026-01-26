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
    id: 'render-style-analysis',
    name: '渲染风格分析',
    category: '分析',
    prompt: 'Analyze the architectural rendering style, identify lighting, materials, and atmosphere. Provide a detailed breakdown of visual elements.',
    image: 'https://images.unsplash.com/photo-1511818330031-05a3b2c86bd5?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'site-plan-coloring',
    name: '总图填色渲染',
    category: '生成',
    prompt: 'Color and render this site plan with realistic textures for landscape, roads, and buildings. Professional architectural presentation style.',
    image: 'https://images.unsplash.com/photo-1503387762-592dee58c460?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'building-material-analysis',
    name: '建筑材料分析',
    category: '分析',
    prompt: 'Detailed analysis of building materials in the image. Identify textures, finishes, and construction details for architectural study.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'plan-elevation-to-aerial',
    name: '总平面与立面生鸟瞰',
    category: '生成',
    prompt: 'Generate a high-detail 3D aerial view based on the provided site plan and building elevations. Photorealistic textures and environment.',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'modify-rendering',
    name: '修改效果图',
    category: '修改',
    prompt: 'Modify the existing architectural rendering. Change materials, lighting, or specific design elements while maintaining overall consistency.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6191da95b8?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'style-transfer',
    name: '渲染风格迁移',
    category: '生成',
    prompt: 'Apply a specific artistic or architectural rendering style to the provided image. Maintain structural geometry while changing visual language.',
    image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'multi-ref-aerial',
    name: '多图参考生大鸟瞰',
    category: '生成',
    prompt: 'Generate a large-scale aerial masterplan view using multiple reference images for style, lighting, and detail density.',
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'satellite-to-analysis',
    name: '卫星图生成分析图',
    category: '分析',
    prompt: 'Transform a raw satellite image into a professional urban analysis diagram. Highlight zoning, traffic flow, and green infrastructure.',
    image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'generate-analysis',
    name: '生成分析图',
    category: '分析',
    prompt: 'Create conceptual architectural analysis diagrams. Focus on massing, circulation, solar access, and environmental factors.',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'illustration-analysis',
    name: '插画风分析图',
    category: '分析',
    prompt: 'Generate stylized, hand-drawn or vector-style architectural analysis illustrations for competition or presentation boards.',
    image: 'https://images.unsplash.com/photo-1515542706656-8e6ef17a1ed2?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'competition-layout',
    name: '竞赛排版',
    category: '排版',
    prompt: 'Professional architectural competition board layout generation. Organize plans, sections, and renders into a cohesive visual story.',
    image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'white-model-to-render',
    name: '白膜转效果图',
    category: '生成',
    prompt: 'Convert a white massing model into a photorealistic architectural render with materials, vegetation, and realistic lighting.',
    image: 'https://images.unsplash.com/photo-1511818330031-05a3b2c86bd5?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'su-screenshot-render',
    name: 'su截图渲染',
    category: '生成',
    prompt: 'Take a raw SketchUp screenshot and transform it into a professional architectural visualization with high-quality textures.',
    image: 'https://images.unsplash.com/photo-1503387762-592dee58c460?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'site-status-analysis',
    name: '基地现状分析',
    category: '分析',
    prompt: 'Detailed site analysis based on existing conditions. Map topography, surrounding context, views, and environmental constraints.',
    image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'elevation-detail',
    name: '立面阶段详图',
    category: '详情',
    prompt: 'Generate detailed architectural facade drawings. Focus on material junctions, window details, and construction layers.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'floor-plan-coloring',
    name: '户型图填色',
    category: '生成',
    prompt: 'Colorize residential floor plans with realistic floor finishes, furniture layout, and soft shadows for marketing presentation.',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'sketch-to-render',
    name: '草图转效果图',
    category: '生成',
    prompt: 'Transform a hand-drawn architectural sketch into a photorealistic visualization while preserving the original design intent.',
    image: 'https://images.unsplash.com/photo-1600585154340-be6191da95b8?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'render-to-elevation',
    name: '效果图生成立面图',
    category: '生成',
    prompt: 'Generate accurate 2D architectural elevations from a 3D perspective rendering. Maintain scale and proportion.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'rough-house-interior',
    name: '毛胚房室内设计',
    category: '室内',
    prompt: 'Design and visualize a complete interior for a rough-cast concrete space. Implement modern, industrial, or minimalist styles.',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: 'empty-lot-design',
    name: '空地设计',
    category: '设计',
    prompt: 'Generate architectural proposals for a vacant lot. Consider site constraints, program requirements, and urban context.',
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
