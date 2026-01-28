'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

export interface Template {
  id: string;
  name: string;
  prompt: string;
  image: string;
  badge: string;
  description?: string;
}

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
}

const TEMPLATES: Template[] = [
  
  {
    id: 'general-layout',
    name: '卫星图风格总图填色渲染',
    badge: '生成',
    prompt: '将此总平面图转化为卫星图风格。在保留原有线条轮细节的基础上，屋顶为白色初质，道路为真实的卫星图路面，点缀绿色的树木植物，为整个画面添加柔和的投影，使其成为一张生动而立体的卫星图风格总平面，严格按照CAD线条来，不要增加任何其他元素',
    image: 'https://images.unsplash.com/photo-1503387762-592dee58c460?auto=format&fit=crop&q=80&w=1000',
    description: '快速将黑白线稿总平面图转化为具有丰富色彩、铺装质感及植被景观的高品质渲染总图。',
  },
  {
    id: 'material-analysis',
    name: '建筑材料分析',
    badge: '分析',
    prompt: '分析这张立面图所用的材料，再图上标注出来，并放一块材料样板图片做说明,排版优美.中文标注',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000',
    description: '精准识别并解析建筑表皮材料，提供材质配搭方案建议，辅助深化阶段的立面材料选型。',
  },
  {
    id: 'bird-eye-view',
    name: '总平立面转鸟瞰',
    badge: '生成',
    prompt: '根据立面参考与总图生成住宅区鸟瞰效果图',
    image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=1000',
    description: '融合总平面布局与立面逻辑，一键生成宏大且真实的城市级或园区级建筑鸟瞰透视图。',
  },
  {
    id: 'modify-render',
    name: '修改效果图',
    badge: '修改',
    prompt: '根据图2的指示和修改意见，修改图1效果图',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=1000',
    description: '针对已有效果图进行快速微调，如更换季节氛围、调整立面颜色或修补环境细节。第一张放效果图，第二张放修改意见',
  },
  {
    id: 'style-transfer',
    name: '渲染风格迁移',
    badge: '生成',
    prompt: '渲染参考图1的SU模型，渲染的风格可以参考参考图2的效果,包括质感，灯光，环境表达，图片色调。确保是图1的摄像机镜头角度视角完全不变，建筑的轮线条完全和图1重叠。(一定要确保白模画幅与输出画幅一致，参考图截图成完全不同的画幅，不然容易出错)',
    image: 'https://images.unsplash.com/photo-1518005020480-1099c11fb50a?auto=format&fit=crop&q=80&w=1000',
    description: '汲取大师作品的色彩平衡与光影调性，将其视觉灵魂精准赋予您的设计模型。模型图片放第一个，参考风格放第二个',
  },
  {
    id: 'large-bird-view',
    name: '多图参考大鸟瞰',
    badge: '生成',
    prompt: '按照图1 的标注功能和层数，以图2的总平面布局，以图3图4图5图6的立面风格，及箭头角度生成一张真实一点的鸟瞰效果图',
    image: 'https://images.unsplash.com/photo-1449156001931-829f768ed659?auto=format&fit=crop&q=80&w=1000',
    description: '结合多张环境参考图与规划数据，生成细节极其丰富、地理环境真实的高规格大鸟瞰。图一放功能和层数，图二是总平面后面的是立面风格',
  },
  {
    id: 'sat-analysis',
    name: '卫星图生成分析图',
    badge: '分析',
    prompt: '将原始卫星地图转化为极简建筑分析图，色块分区，道路流线标注，地理信息提取',
    image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1000',
    description: '从杂乱的卫星遥感图中提取城市肌理，自动生成清晰的地块属性与交通流线分析图。',
  },
  {
    id: 'gen-analysis',
    name: '生成分析图',
    badge: '分析',
    prompt: '建筑功能分析图，三维轴侧视图，爆炸图，色块区分功能分区，逻辑清晰，简约风格',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=1000',
    description: '根据空间逻辑生成专业的体块功能、日照路径或视线引导等逻辑分析图。',
  },
  {
    id: 'illus-analysis',
    name: '插画风分析图',
    badge: '风格',
    prompt: '插画风格建筑分析图，扁平化设计，清爽色调，手绘元素，艺术感，清新叙事',
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1000',
    description: '以极具艺术表现力的扁平插画风格呈现设计逻辑，适合竞赛及个性的作品集表达。',
  },
  {
    id: 'competition-layout',
    name: '竞赛排版',
    badge: '工具',
    prompt: '专业建筑竞赛排版，黄金分割构图，极简主义，清晰的图纸逻辑分布，视觉平衡，高级感',
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=1000',
    description: '基于视觉引导原理，自动优化图纸与文字的留白与比例，打造高溢价感的竞赛图板。',
  },
  {
    id: 'mass-to-render',
    name: '白膜转效果图',
    badge: '生成',
    prompt: '将建筑白膜模型渲染为超写实实景图，真实材质填充，环境配景优化，高质量光影，细腻纹理',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000',
    description: '直接利用粗糙的Sketchup白膜截图，瞬间赋予其石材、玻璃质感及写实的光环境。',
  },
  {
    id: 'su-screenshot',
    name: 'SU 截图渲染',
    badge: '生成',
    prompt: 'Sketchup模型截图快速渲染，极简风格，柔和光影，环境配景填充，方案意向表达',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000',
    description: '无需复杂参数设置，直接将SU视口截图升华为具有设计美感的高级意向表现图。',
  },
  {
    id: 'site-analysis',
    name: '基地现状分析',
    badge: '分析',
    prompt: '基地现状实景分析图，环境文脉标注，植被水体分布，高差分析，场地逻辑解读',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1000',
    description: '通过对航拍图或现场照片的识别，智能标注场地高差、核心景观及周边约束条件。',
  },
  {
    id: 'facade-detail',
    name: '立面阶段详图',
    badge: '生成',
    prompt: '建筑立面节点详图，构造展示，材料交接关系，专业制图风格，技术细节表达',
    image: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?auto=format&fit=crop&q=80&w=1000',
    description: '生成针对立面细部的构造示意图，辅助解决构造逻辑，体现施工图深度的技术美学。',
  },
  {
    id: 'floorplan-render',
    name: '户型图填色',
    badge: '生成',
    prompt: '室内户型图彩色填色，家具布置，软装质感，生活氛围营造，真实光影，温馨色调',
    image: 'https://images.unsplash.com/photo-1556912177-c54030639a6d?auto=format&fit=crop&q=80&w=1000',
    description: '将枯燥的CAD黑白户型图转化为温馨、带有家具质感与光影深度的商业营销图。',
  },
  {
    id: 'sketch-to-render',
    name: '草图转效果图',
    badge: '生成',
    prompt: '将手绘建筑草图转化为写实渲染图，保留手绘笔触灵魂，赋予真实质感，沉浸式场景',
    image: 'https://images.unsplash.com/photo-1515542641795-85ed3b821605?auto=format&fit=crop&q=80&w=1000',
    description: '保留设计师手绘草稿的灵动笔触与最初构思，将其快速演绎为具有沉浸感的真实场景。',
  },
  {
    id: 'render-to-facade',
    name: '效果图生立面',
    badge: '生成',
    prompt: '从建筑透视效果图生成正交立面图，比例严谨，构造清晰，二维制图表达',
    image: 'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&q=80&w=1000',
    description: '基于AI对三维空间的理解，逆向生成规整、具有制图比例感的二维正交立面图纸。',
  },
  {
    id: 'interior-design',
    name: '毛胚房室内设计',
    badge: '生成',
    prompt: '毛胚房实景生成室内装修效果，现代简约风格，高档材质，灯光渲染，空间美学',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1000',
    description: '根据毛胚房实勘照片，自动匹配多种软装风格，一键生成极具空间质感的全屋软装方案。',
  },
  {
    id: 'empty-site-design',
    name: '空地设计',
    badge: '生成',
    prompt: '在空旷场地上生成建筑方案，环境融合，功能布局，整体规划，概念推敲',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1000',
    description: '基于空旷场地的地理特征，快速推敲多种可能的建筑体块组合及景观空间逻辑。',
  },
];

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

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

              <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                  核心关键词
                </h4>
                <div className="bg-input-bg border border-border rounded-xl p-4 text-sm text-gray-600 dark:text-gray-300 italic">
                  "{selectedTemplate.prompt}"
                </div>
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
