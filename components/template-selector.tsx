'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Check, LayoutGrid, List } from 'lucide-react';

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
    "id": "渲染风格分析按钮使用说明",
    "name": "\"渲染风格分析\"按钮使用说明",
    "badge": "分析",
    "prompt": "1.点击“渲染风格分析”按钮  2.选择你需要参考的图片拖进对话框并点击\"开始分析\" 3.复制结果，并做检查，删除不合适参考的部分 4.粘贴提示词到生图框，作为风格参考指令开始生图",
    "image": "https://jzai.pro/static/images/examples/8610a931-becc-4b45-96ab-27ca3f098863.webp",
    "description": "深度解析建筑设计要素，快速生成专业的\"渲染风格分析\"按钮使用说明，辅助设计师进行方案深化与表达。"
  },
  {
    "id": "一次16张效果图结合风格分析按钮高清",
    "name": "一次16张效果图（结合风格分析按钮高清）",
    "badge": "分析",
    "prompt": "在一张图上生成16种不同风格的高级感豪宅立面实景效果图，，保证建筑的设计轮廓形态，材质完全不做变化，每一张都要不一样的表现风格，不同的时间，但都是优秀的效果图，适当增加一些场景，不要夸张的表现",
    "image": "https://jzai.pro/static/images/examples/163c7b87-e45c-4552-80ce-71c1d0f72067.webp",
    "description": "深度解析建筑设计要素，快速生成专业的一次16张效果图（结合风格分析按钮高清），辅助设计师进行方案深化与表达。"
  },
  {
    "id": "真实感总图填色渲染",
    "name": "真实感总图填色渲染",
    "badge": "生成",
    "prompt": "将此总平面图转化为卫星图风格。在保留原有线条轮细节的基础上，屋顶为白色初质，道路为真实的卫星图路面，点缀绿色的树木植物，为整个画面添加柔和的投影，使其成为一张生动而立体的卫星图风格总平面，严格按照CAD线条来，不要增加任何其他元素",
    "image": "https://jzai.pro/static/images/examples/a5c2794b-20e2-4d18-88fd-55b8a4fe9434.webp",
    "description": "将基础线稿或模型快速转化为具有丰富质感和光影效果的真实感总图填色渲染，极大提升出图效率。"
  },
  {
    "id": "建筑材料分析",
    "name": "建筑材料分析",
    "badge": "分析",
    "prompt": "分析这张立面图所用的材料，再图上标注出来，并放一块材料样板图片做说明,排版优美.",
    "image": "https://jzai.pro/static/images/examples/116a840b-8ceb-4ca0-ac7e-ad9f0067a3c0.webp",
    "description": "深度解析建筑设计要素，快速生成专业的建筑材料分析，辅助设计师进行方案深化与表达。"
  },
  {
    "id": "总图立面鸟瞰图",
    "name": "总图+立面=鸟瞰图",
    "badge": "生成",
    "prompt": "根据立面参考与总图生成住宅区鸟瞰效果图",
    "image": "https://jzai.pro/static/images/examples/56111f9b-aa91-4dd9-b209-304c07b52b3a.webp",
    "description": "利用 AI 技术实现总图+立面=鸟瞰图，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "随笔修改效果图",
    "name": "随笔修改效果图",
    "badge": "编辑",
    "prompt": "根据图2的指示和修改意见，修改图1效果图",
    "image": "https://jzai.pro/static/images/examples/94f47a65-5ba5-4a52-9377-3e196ea6a212.webp",
    "description": "利用 AI 技术实现随笔修改效果图，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "渲染风格迁移",
    "name": "渲染风格迁移",
    "badge": "编辑",
    "prompt": "渲染参考图1的SU模型，渲染的风格可以参考参考图2的效果,包括质感，灯光，环境表达，图片色调. 确保是图1的摄像机镜头角度视角完全不变，建筑的轮线条完全和图1重叠。(一定要确保白模画幅与输出画幅一致，参考图截图成完全不同的画幅，不然容易出错)",
    "image": "https://jzai.pro/static/images/examples/20ae9dbb-fb4a-41f2-8e90-813a77c75c79.webp",
    "description": "将基础线稿或模型快速转化为具有丰富质感和光影效果的渲染风格迁移，极大提升出图效率。"
  },
  {
    "id": "多图参考生成大鸟瞰图",
    "name": "多图参考生成大鸟瞰图",
    "badge": "生成",
    "prompt": "按照图1 的标注功能和层数，以图2的规划风格，以图3图4图5图6的立面风格，徽派中式建筑风格，按图7的总平面草图布局，及箭头角度生成一张真实一点的鸟瞰效果图",
    "image": "https://jzai.pro/static/images/examples/465ba3dd-f01d-4465-be32-be94cda10e73.webp",
    "description": "利用 AI 技术实现多图参考生成大鸟瞰图，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "多角度效果图保持建筑一致性角度需要抽卡",
    "name": "多角度效果图保持建筑一致性（角度需要抽卡）",
    "badge": "生成",
    "prompt": "在一张图上生成项目的四个角上方向看的不同鸟瞰效果图，保证建筑完全一致能对应，且能看完整，渲染风格一致（建议选择4K高清模式，也可上传两张对应角度确保其他角度一致性）",
    "image": "https://jzai.pro/static/images/examples/46190dcb-4452-4137-bdc7-4a92d80c0fe3.webp",
    "description": "利用 AI 技术实现多角度效果图保持建筑一致性（角度需要抽卡），通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "卫星地图生成分析图",
    "name": "卫星地图生成分析图",
    "badge": "分析",
    "prompt": "生成3张分析图，分别是1.城市建筑肌理分析2.城市景观分析图。3.城市交通道路分析图。颜色好看，专业的建筑规划分析图，需要简洁明了。(特别提示：如果生图出现错误，建议一张一张图生成更稳妥)",
    "image": "https://jzai.pro/static/images/examples/32212d4a-4983-4fe2-8507-7908792d0877.webp",
    "description": "深度解析建筑设计要素，快速生成专业的卫星地图生成分析图，辅助设计师进行方案深化与表达。"
  },
  {
    "id": "生成分析图",
    "name": "生成分析图",
    "badge": "分析",
    "prompt": "生成这座建筑的三张分析图，文字用中文分析，分别是功能剖面分析、日照与自然通风分析、天际线形态分析",
    "image": "https://jzai.pro/static/images/examples/eb82d5ca-8035-4c14-8266-fe688f87100d.webp",
    "description": "深度解析建筑设计要素，快速生成专业的生成分析图，辅助设计师进行方案深化与表达。"
  },
  {
    "id": "插画风分析图",
    "name": "插画风分析图",
    "badge": "分析",
    "prompt": "把里面的人和建筑替换成黑白色块风格简笔画，植物保留绿色，增加一些日常对话气泡，英文日常，同时用色块和箭头分析街道上的建筑和交通状况，设计竞赛用，构图好看。",
    "image": "https://jzai.pro/static/images/examples/cc9f8f63-4bd4-4eec-90d6-fa305a6e66eb.webp",
    "description": "深度解析建筑设计要素，快速生成专业的插画风分析图，辅助设计师进行方案深化与表达。"
  },
  {
    "id": "总图景观设计填色",
    "name": "总图景观设计填色",
    "badge": "生成",
    "prompt": "设计豪宅小区景观总图并填色，高级感，素雅，建筑用白色。去掉所有文字 不要增加任何建筑体块。景观设计要自然丰富。",
    "image": "https://jzai.pro/static/images/examples/837489fd-d900-45ad-9d13-876152ab0919.webp",
    "description": "将基础线稿或模型快速转化为具有丰富质感和光影效果的总图景观设计填色，极大提升出图效率。"
  },
  {
    "id": "生成竞赛排版",
    "name": "生成竞赛排版",
    "badge": "生成",
    "prompt": "生成一张建筑设计竞赛排版，包含这个咖啡书店建筑的效果图，精彩的爆炸分析图，结构图，形体关系图，日照通风图，空间关系图，功能分析图，周边环境分析图等，配色要好看，有视觉冲击力，英文排版，高清。",
    "image": "https://jzai.pro/static/images/examples/dbeb112b-ba39-4233-aa6b-0207479aae82.webp",
    "description": "利用 AI 技术实现生成竞赛排版，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "卫星地图生成实景效果图",
    "name": "卫星地图生成实景效果图",
    "badge": "生成",
    "prompt": "把图1的幼儿园SU建筑模型放到图2的卫星地图红线内，做成一张实景的鸟瞰效果图。红线内考虑活动场地",
    "image": "https://jzai.pro/static/images/examples/cef38de6-1de0-4830-b834-75fd0751e302.webp",
    "description": "利用 AI 技术实现卫星地图生成实景效果图，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "城市区位分析仅限知名城市",
    "name": "城市区位分析（仅限知名城市）",
    "badge": "分析",
    "prompt": "生成一张从江苏省南京市雨花台区的区位示意，从国家到地区的不断放大的几张图来表达，周围放一些当地历史文化的拼贴图，要有设计师风格，素雅，表达准确，拼贴画风格，建筑师风格，高清，排版自然",
    "image": "https://jzai.pro/static/images/examples/2653f940-a7bf-4dd7-978f-b472c1051dce.webp",
    "description": "深度解析建筑设计要素，快速生成专业的城市区位分析（仅限知名城市），辅助设计师进行方案深化与表达。"
  },
  {
    "id": "白模转效果图",
    "name": "白模转效果图",
    "badge": "生成",
    "prompt": "一座70米高欧洲总部大楼，建筑大师设计，优秀效果图，环境丰富",
    "image": "https://jzai.pro/static/images/examples/9ef8f056-8534-4209-bc0e-a2534ccf6997.png",
    "description": "利用 AI 技术实现白模转效果图，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "su模型渲染",
    "name": "SU模型渲染",
    "badge": "生成",
    "prompt": "把左图的模型参考右图效果，做一张真实一点的效果图。保持摄像机镜头视角角度完全不变，建筑轮廓形态完全不变。",
    "image": "https://jzai.pro/static/images/examples/056e3fe6-6c5d-4ba3-8c55-578fe1a0433e.webp",
    "description": "将基础线稿或模型快速转化为具有丰富质感和光影效果的SU模型渲染，极大提升出图效率。"
  },
  {
    "id": "基地现状分析",
    "name": "基地现状分析",
    "badge": "分析",
    "prompt": "根据这张现场图，做一个建筑规划设计竞赛用的现状分析图，用英文说明，排版优秀",
    "image": "https://jzai.pro/static/images/examples/b1358c62-bb0b-4c45-8ac5-96417304d758.webp",
    "description": "深度解析建筑设计要素，快速生成专业的基地现状分析，辅助设计师进行方案深化与表达。"
  },
  {
    "id": "根据参考总图填色",
    "name": "根据参考总图填色",
    "badge": "生成",
    "prompt": "根据参考为总图填色，生成图的建筑轮廓形状、位置必须与图1的线稿匹配. 整体色彩、材质质感和绘图风格请参考图2。结果应是“具有图2风格的图1”。(一定要确保白模画幅与输出画幅一致，参考图截图成完全不同的画幅，不然容易出错)",
    "image": "https://jzai.pro/static/images/examples/c90261d9-03e4-4ea8-a114-5097014e9af3.webp",
    "description": "将基础线稿或模型快速转化为具有丰富质感和光影效果的根据参考总图填色，极大提升出图效率。"
  },
  {
    "id": "草模参考效果图生图",
    "name": "草模参考效果图生图",
    "badge": "生成",
    "prompt": "用效果图的风格重绘SU模型草图，确保模型草图里的建筑高度和形态不变。（切记：尽量把模型图做成一个标准比例尺寸与出图一致的，参考图给一个完全不同的画幅，不然很容易出错）",
    "image": "https://jzai.pro/static/images/examples/4da0bf3e-22c4-4f66-a0b8-ddb203a12475.webp",
    "description": "利用 AI 技术实现草模参考效果图生图，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "立面节点示意",
    "name": "立面节点示意",
    "badge": "生成",
    "prompt": "生成这个建筑的立面节点构造图，要求清晰准确，用3D渲染的方式表达",
    "image": "https://jzai.pro/static/images/examples/7e9d6f26-87bc-461a-8334-f3e904ad6bb3.webp",
    "description": "利用 AI 技术实现立面节点示意，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "户型图填色",
    "name": "户型图填色",
    "badge": "生成",
    "prompt": "为这张住宅建筑平面图填色，不同功能使用不同的颜色，公共区域使用灰色，颜色要素雅，体现设计美",
    "image": "https://jzai.pro/static/images/examples/02f62716-d9d4-4ee7-82e5-86748806481a.png",
    "description": "将基础线稿或模型快速转化为具有丰富质感和光影效果的户型图填色，极大提升出图效率。"
  },
  {
    "id": "效果图转图块分析图",
    "name": "效果图转图块分析图",
    "badge": "分析",
    "prompt": "生成一张SU线稿风格住宅区建筑规划空间分析图，模仿SASAKI风格",
    "image": "https://jzai.pro/static/images/examples/64d053d3-1247-408c-a4ca-9775598cb3eb.webp",
    "description": "深度解析建筑设计要素，快速生成专业的效果图转图块分析图，辅助设计师进行方案深化与表达。"
  },
  {
    "id": "准确更改效果图角度",
    "name": "准确更改效果图角度",
    "badge": "编辑",
    "prompt": "参考图1的角度，重新生成图2的建筑",
    "image": "https://jzai.pro/static/images/examples/6e81a257-04f9-4236-a300-079c7aaf03c5.webp",
    "description": "利用 AI 技术实现准确更改效果图角度，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "效果图转风格分析图排版",
    "name": "效果图转风格分析图排版",
    "badge": "分析",
    "prompt": "生成一张建筑分析图，模仿sasaki风格，下方有建筑剖面示意",
    "image": "https://jzai.pro/static/images/examples/5d758a09-47d7-48d6-b0e4-afdde31cef98.jpg",
    "description": "深度解析建筑设计要素，快速生成专业的效果图转风格分析图排版，辅助设计师进行方案深化与表达。"
  },
  {
    "id": "更改鸟瞰图角度",
    "name": "更改鸟瞰图角度",
    "badge": "编辑",
    "prompt": "以提供的鸟瞰建筑场景为基础，保持建筑的整体形态、结构细节及与周边地形（如道路、绿地、水体等）的空间关系完全不变。将观察视角改变，生成一个低角度斜侧视图。新视角应能清晰展示建筑立面与右侧环境的衔接，同时保留原始场景的光照条件与材质质感。确保画面具有空间纵深感，避免建筑变形或地形扭曲。",
    "image": "https://jzai.pro/static/images/examples/2059c30f-37b4-4dc0-8d35-db70bebbb91c.webp",
    "description": "利用 AI 技术实现更改鸟瞰图角度，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "用箭头表达新的角度",
    "name": "用箭头表达新的角度",
    "badge": "生成",
    "prompt": "以提供的鸟瞰建筑场景为基础，保持建筑的整体形态、结构细节及与周边地形（如道路、绿地、水体等）的空间关系完全不变。将观察视角改变，改变的视角参考我第二张图红色箭头方向。新视角应能清晰展示建筑立面与环境的衔接，同时保留原始场景的光照条件与材质质感。确保画面具有空间纵深感，避免建筑变形或地形扭曲。",
    "image": "https://jzai.pro/static/images/examples/a862cf80-57f6-46db-b824-32a720dbdb64.webp",
    "description": "利用 AI 技术实现用箭头表达新的角度，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "效果图转剖面分析",
    "name": "效果图转剖面分析",
    "badge": "分析",
    "prompt": "生成这座办公建筑的剖面分析图，需要考虑足够的共享空间",
    "image": "https://jzai.pro/static/images/examples/ad5686ef-bfa4-4b74-95b4-ce9cdfcdfc9a.png",
    "description": "深度解析建筑设计要素，快速生成专业的效果图转剖面分析，辅助设计师进行方案深化与表达。"
  },
  {
    "id": "草图变效果图",
    "name": "草图变效果图",
    "badge": "生成",
    "prompt": "生成一张有意境的展览建筑效果图，夜景，角度不变，实景效果",
    "image": "https://jzai.pro/static/images/examples/cfd9344b-717f-4b58-9ac1-d2310dcab58a.jpg",
    "description": "利用 AI 技术实现草图变效果图，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "基地分析图生成",
    "name": "基地分析图生成",
    "badge": "分析",
    "prompt": "从建筑设计角度重绘，生成周边环境图，注意用色的搭配",
    "image": "https://jzai.pro/static/images/examples/d5c35f9e-5720-49a2-8741-f94684688ddb.png",
    "description": "深度解析建筑设计要素，快速生成专业的基地分析图生成，辅助设计师进行方案深化与表达。"
  },
  {
    "id": "图转手绘效果",
    "name": "图转手绘效果",
    "badge": "生成",
    "prompt": "将这张图转化为一张专业建筑手绘",
    "image": "https://jzai.pro/static/images/examples/59b3de65-1a0f-443e-9ba3-997cc206b76a.png",
    "description": "利用 AI 技术实现图转手绘效果，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "空地生成设计",
    "name": "空地生成设计",
    "badge": "生成",
    "prompt": "在这个地块上设计一座办公园，基地面积5万平，容积率2.5，生成一张鸟瞰图",
    "image": "https://jzai.pro/static/images/examples/818e11ce-a100-4c6d-87cf-581d71595fc2.png",
    "description": "利用 AI 技术实现空地生成设计，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "效果图风格转换",
    "name": "效果图风格转换",
    "badge": "编辑",
    "prompt": "将这张效果图转化为夜景，冬天的效果",
    "image": "https://jzai.pro/static/images/examples/e0859e30-30ab-4957-b644-cca3fb5560e9.png",
    "description": "利用 AI 技术实现效果图风格转换，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "效果图生成各个立面图",
    "name": "效果图生成各个立面图",
    "badge": "生成",
    "prompt": "生成这座办公建筑的各个立面图，要有设计感",
    "image": "https://jzai.pro/static/images/examples/1a6a1fda-dc78-4386-889b-782475c86c06.png",
    "description": "利用 AI 技术实现效果图生成各个立面图，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "老建筑商业改造",
    "name": "老建筑商业改造",
    "badge": "生成",
    "prompt": "老建筑更新为现代商业的效果图，保留原始建筑元素，增加商业氛围",
    "image": "https://jzai.pro/static/images/examples/aed9e836-bea1-42a5-a7cb-be01a6aa6f3f.jpg",
    "description": "利用 AI 技术实现老建筑商业改造，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "毛坯房室内设计",
    "name": "毛坯房室内设计",
    "badge": "生成",
    "prompt": "设计师设计客厅，现代主义，意大利家居",
    "image": "https://jzai.pro/static/images/examples/3d97bd0a-1d1e-4b36-887a-adcc0aff057f.png",
    "description": "利用 AI 技术实现毛坯房室内设计，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "更改效果图角度",
    "name": "更改效果图角度",
    "badge": "编辑",
    "prompt": "改为人视角度，屋顶改为木色，场景改为日景",
    "image": "https://jzai.pro/static/images/examples/f5804d89-9e96-44c6-841a-e484db056e69.png",
    "description": "利用 AI 技术实现更改效果图角度，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "效果图转白模",
    "name": "效果图转白模",
    "badge": "生成",
    "prompt": "图片转化为SU白模效果",
    "image": "https://jzai.pro/static/images/examples/5c498f04-ba6d-40bc-b887-d883b6321271.jpg",
    "description": "利用 AI 技术实现效果图转白模，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "更改建筑材料",
    "name": "更改建筑材料",
    "badge": "编辑",
    "prompt": "把建筑屋顶改为木条，场景改为日景，角度改为鸟瞰",
    "image": "https://jzai.pro/static/images/examples/93d56f88-0ca0-4e64-88d7-6dd47c82cf56.jpg",
    "description": "利用 AI 技术实现更改建筑材料，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "效果图转su渲染风格",
    "name": "效果图转SU渲染风格",
    "badge": "生成",
    "prompt": "生成建筑立面图，SU渲染风格，设计感强",
    "image": "https://jzai.pro/static/images/examples/9cadee23-b4f8-4755-a5e6-d165c0c29792.png",
    "description": "将基础线稿或模型快速转化为具有丰富质感和光影效果的效果图转SU渲染风格，极大提升出图效率。"
  },
  {
    "id": "效果图转剖面",
    "name": "效果图转剖面",
    "badge": "生成",
    "prompt": "生成这座建筑的完整剖面，要求准确",
    "image": "https://jzai.pro/static/images/examples/2c6f36f3-652a-44bc-aa6e-f1923cc04be6.webp",
    "description": "利用 AI 技术实现效果图转剖面，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "效果图转立面蓝图",
    "name": "效果图转立面蓝图",
    "badge": "生成",
    "prompt": "生成这个住宅楼的2个标准立面图，CAD蓝图，白底蓝字，层高3.3米",
    "image": "https://jzai.pro/static/images/examples/fd2db374-d7dd-4616-ade3-56248813cbc6.webp",
    "description": "利用 AI 技术实现效果图转立面蓝图，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "局部修改效果图",
    "name": "局部修改效果图",
    "badge": "编辑",
    "prompt": "保留主体建筑，删除其他建筑，同时优化景观场景",
    "image": "https://jzai.pro/static/images/examples/72fdf59f-004f-43e4-940f-c09fdc11f3d2.webp",
    "description": "利用 AI 技术实现局部修改效果图，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "降低建筑高度",
    "name": "降低建筑高度",
    "badge": "生成",
    "prompt": "将建筑改为50米",
    "image": "https://jzai.pro/static/images/examples/ec6bf827-5833-4a46-bd13-e7ee3471ba00.webp",
    "description": "利用 AI 技术实现降低建筑高度，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "总平面图生成鸟瞰图",
    "name": "总平面图生成鸟瞰图",
    "badge": "生成",
    "prompt": "生成这个住宅区与商业的总体景观规划鸟瞰图，白色建筑是100米高层，黄色是100米办公塔楼，橘黄色是2-3层的商业，现代立面风格，高级的效果图氛围感，高清",
    "image": "https://jzai.pro/static/images/examples/e7796f70-32a7-4866-9564-6e960608063b.webp",
    "description": "利用 AI 技术实现总平面图生成鸟瞰图，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  }
];

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isGridView, setIsGridView] = useState(false);

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-foreground">快速开始 - 选择模板</h3>
          <p className="text-xs text-gray-400 mt-1">
            {isGridView ? '点击下方卡片查看详情并应用' : '向左滑动查看更多，点击卡片查看详情'}
          </p>
        </div>
        <button
          onClick={() => setIsGridView(!isGridView)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all text-sm font-medium border border-blue-500/20"
        >
          {isGridView ? (
            <>
              <List className="w-4 h-4" />
              收起列表
            </>
          ) : (
            <>
              <LayoutGrid className="w-4 h-4" />
              查看全部
            </>
          )}
        </button>
      </div>

      {!isGridView ? (
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
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3 border border-border shadow-sm group-hover/card:shadow-md transition-all">
                  <Image
                    src={template.image}
                    alt={template.name}
                    fill
                    className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] text-white font-medium">
                    {template.badge}
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground group-hover/card:text-blue-500 transition-colors line-clamp-2">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {TEMPLATES.map((template) => (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className="cursor-pointer group/card"
            >
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3 border border-border shadow-sm group-hover/card:shadow-md transition-all">
                <Image
                  src={template.image}
                  alt={template.name}
                  fill
                  className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] text-white font-medium">
                  {template.badge}
                </div>
                <div className="absolute inset-0 bg-blue-600/0 group-hover/card:bg-blue-600/10 transition-colors flex items-center justify-center opacity-0 group-hover/card:opacity-100">
                  <span className="bg-white/90 dark:bg-gray-900/90 px-3 py-1 rounded-full text-[10px] font-bold text-blue-600 shadow-xl">
                    查看详情
                  </span>
                </div>
              </div>
              <p className="text-xs font-medium text-foreground group-hover/card:text-blue-500 transition-colors line-clamp-2 text-center">
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
