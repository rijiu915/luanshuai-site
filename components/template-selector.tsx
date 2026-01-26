'use client';

import React from 'react';

export interface Template {
  id: string;
  name: string;
  prompt: string;
  image?: string;
}

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
}

const TEMPLATES: Template[] = [
  {
    id: 'minimal-cabin',
    name: '极简木屋',
    prompt: '山地上的极简木屋，大落地窗，黄昏光影，8k分辨率，建筑摄影',
  },
  {
    id: 'modern-museum',
    name: '现代美术馆',
    prompt: '现代简约风格美术馆，混凝土材质，几何体块，自然采光，大师级设计',
  },
  {
    id: 'cyberpunk-city',
    name: '赛博朋克城市',
    prompt: '未来的赛博朋克风格城市景观，霓虹灯光，雨后街道，高科技感，错综复杂的建筑',
  },
  {
    id: 'traditional-courtyard',
    name: '中式合院',
    prompt: '现代中式合院建筑，白墙黛瓦，园林景观，静谧氛围，传统与现代结合',
  }
];

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">快捷模板</h3>
      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className="px-4 py-2 text-sm bg-card-bg border border-border rounded-lg hover:border-blue-500 hover:text-blue-500 transition-colors"
          >
            {template.name}
          </button>
        ))}
      </div>
    </div>
  );
}
