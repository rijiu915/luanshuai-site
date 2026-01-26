'use client';

import Image from 'next/image';

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
    name: '极简主义别墅',
    category: '住宅',
    prompt: '极简主义现代别墅，大落地窗，清水混凝土墙面，周围是森林，黄昏光影，超写实，8k',
    image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: '2',
    name: '日式和风庭院',
    category: '景观',
    prompt: '日式传统和风庭院，枯山水，竹林，纸拉门建筑，宁静氛围，电影感，高动态范围',
    image: 'https://images.unsplash.com/photo-1545579133-99bb5ab189bd?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: '3',
    name: '赛博朋克城市',
    category: '概念',
    prompt: '未来赛博朋克风格城市，霓虹灯，雨夜，高耸的摩天大楼，飞行汽车，丰富细节，史诗级画质',
    image: 'https://images.unsplash.com/photo-1605142859862-978be7eba909?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: '4',
    name: '工业风LOFT',
    category: '室内',
    prompt: '工业风格LOFT办公室，红砖墙，外露管道，黑色金属框架，大采光窗口，现代家具，工作氛围',
    image: 'https://images.unsplash.com/photo-1515542706656-8e6ef17a1ed2?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: '5',
    name: '欧式古典城堡',
    category: '历史',
    prompt: '宏伟的欧式古典城堡，坐落在湖边山顶，哥特式建筑细节，晨雾缭绕，震撼全景，唯美梦幻',
    image: 'https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: '6',
    name: '北欧森林木屋',
    category: '度假',
    prompt: '舒适的北欧风格木屋，在雪后的森林中，温暖的灯光从窗户透出，宁静冬夜，温馨治愈',
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=400&h=300'
  },
  {
    id: '7',
    name: '现代写字楼',
    category: '商业',
    prompt: '现代全玻璃幕墙写字楼，位于繁华商业区，阳光反射，蓝天白云背景，商务感，极简线条',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400&h=300'
  }
];

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-lg font-semibold text-foreground">快速开始 - 选择模板</h3>
        <span className="text-sm text-gray-500">向左滑动查看更多</span>
      </div>
      
      <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar scroll-smooth snap-x">
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
