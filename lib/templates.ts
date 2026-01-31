export interface Template {
  id: string;
  name: string;
  prompt: string;
  image: string;
  badge: string;
  description?: string;
}

export const TEMPLATES: Template[] = [
  {
    "id": "一次16张效果图结合风格分析按钮高清",
    "name": "一次16张效果图（结合风格分析按钮高清）",
    "badge": "分析",
    "prompt": "在一张图上生成16种不同风格的立面实景效果图，，保证建筑的设计轮廓形态，材质完全不做变化，每一张都要不一样的表现风格，不同的时间，但都是优秀的效果图，适当增加一些场景，不要夸张的表现",
    "image": "/cover/cover_16_sixteen_renders.png",
    "description": "深度解析建筑设计要素，快速生成专业的一次16张效果图（结合风格分析按钮高清），辅助设计师进行方案深化与表达。"
  },
  {
    "id": "真实感总图填色渲染",
    "name": "真实感总图填色渲染",
    "badge": "生成",
    "prompt": "将此总平面图转化为卫星图风格。在保留原有线条轮细节的基础上，屋顶为白色初质，道路为真实的卫星图路面，点缀绿色的树木植物，为整个画面添加柔和的投影，使其成为一张生动而立体的卫星图风格总平面，严格按照CAD线条来，不要增加任何其他元素",
    "image": "/cover/cover_5_masterplan_coloring.png",
    "description": "将基础线稿或模型快速转化为具有丰富质感和光影效果的真实感总图填色渲染，极大提升出图效率。"
  },
  {
    "id": "建筑材料分析",
    "name": "建筑材料分析",
    "badge": "分析",
    "prompt": "分析这张立面图所用的材料，再图上标注出来，并放一块材料样板图片做说明,排版优美.",
    "image": "/cover/cover_23_material_analysis.png",
    "description": "深度解析建筑设计要素，快速生成专业的建筑材料分析，辅助设计师进行方案深化与表达。"
  },
  {
    "id": "总图立面鸟瞰图",
    "name": "总图+立面=鸟瞰图",
    "badge": "生成",
    "prompt": "根据立面参考与总图生成住宅区鸟瞰效果图",
    "image": "/cover/cover_1_masterplan_to_aerial.png",
    "description": "利用 AI 技术实现总图+立面=鸟瞰图，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "随笔修改效果图",
    "name": "随笔修改效果图",
    "badge": "编辑",
    "prompt": "根据图二修改图一",
    "image": "/cover/cover_33_casual_modification.png",
    "description": "利用 AI 技术实现随笔修改效果图，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "渲染风格迁移",
    "name": "渲染风格迁移",
    "badge": "编辑",
    "prompt": "渲染参考图1的SU模型，渲染的风格可以参考参考图2的效果,包括质感，灯光，环境表达，图片色调. 确保是图1的摄像机镜头角度视角完全不变，建筑的轮线条完全和图1重叠。(一定要确保白模画幅与输出画幅一致，参考图截图成完全不同的画幅，不然容易出错)",
    "image": "/cover/cover_13_style_transfer.png",
    "description": "将基础线稿或模型快速转化为具有丰富质感和光影效果的渲染风格迁移，极大提升出图效率。"
  },
  {
    "id": "多角度效果图保持建筑一致性角度需要抽卡",
    "name": "多角度效果图保持建筑一致性（角度需要抽卡）",
    "badge": "生成",
    "prompt": "在一张图上生成项目的四个角上方向看的不同鸟瞰效果图，保证建筑完全一致能对应，且能看完整，渲染风格一致（建议选择4K高清模式，也可上传两张对应角度确保其他角度一致性）",
    "image": "/cover/cover_25_multi_angle_consistency.png",
    "description": "利用 AI 技术实现多角度效果图保持建筑一致性（角度需要抽卡），通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "卫星地图生成分析图",
    "name": "卫星地图生成分析图",
    "badge": "分析",
    "prompt": "生成3张分析图，分别是1.城市建筑肌理分析2.城市景观分析图。3.城市交通道路分析图。颜色好看，专业的建筑规划分析图，需要简洁明了。(特别提示：如果生图出现错误，建议一张一张图生成更稳妥)",
    "image": "/cover/cover_22_satellite_to_analysis.png",
    "description": "深度解析建筑设计要素，快速生成专业的卫星地图生成分析图，辅助设计师进行方案深化与表达。"
  },
  {
    "id": "生成分析图",
    "name": "生成分析图",
    "badge": "分析",
    "prompt": "生成这座建筑的三张分析图，文字用中文分析，分别是功能剖面分析、日照与自然通风分析、天际线形态分析",
    "image": "/cover/cover_17_render_to_section_analysis.png",
    "description": "深度解析建筑设计要素，快速生成专业的生成分析图，辅助设计师进行方案深化与表达。"
  },
  {
    "id": "插画风分析图",
    "name": "插画风分析图",
    "badge": "分析",
    "prompt": "把里面的人和建筑替换成黑白色块风格简笔画，植物保留绿色，增加一些日常对话气泡，英文日常，同时用色块和箭头分析街道上的建筑和交通状况，设计竞赛用，构图好看。",
    "image": "/cover/cover_30_illustration_analysis_diagram.png",
    "description": "深度解析建筑设计要素，快速生成专业的插画风分析图，辅助设计师进行方案深化与表达。"
  },
  {
    "id": "总图景观设计填色",
    "name": "总图景观设计填色",
    "badge": "生成",
    "prompt": "设计豪宅小区景观总图并填色，高级感，素雅，建筑用白色。去掉所有文字 不要增加任何建筑体块。景观设计要自然丰富。",
    "image": "/cover/cover_37_masterplan_landscape_coloring.png",
    "description": "将基础线稿或模型快速转化为具有丰富质感 and 光影效果的总图景观设计填色，极大提升出图效率。"
  },
  {
    "id": "生成竞赛排版",
    "name": "生成竞赛排版",
    "badge": "生成",
    "prompt": "生成一张建筑设计竞赛排版，包含这个咖啡书店建筑的效果图，精彩的爆炸分析图，结构图，形体关系图，日照通风图，空间关系图，功能分析图，周边环境分析图等，配色要好看，有视觉冲击力，英文排版，高清。",
    "image": "/cover/cover_38_render_to_elevation_blueprint.png",
    "description": "利用 AI 技术实现生成竞赛排版，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "卫星地图生成实景效果图",
    "name": "卫星地图生成实景效果图",
    "badge": "生成",
    "prompt": "把图1的幼儿园SU建筑模型放到图2的卫星地图红线内，做成一张实景的鸟瞰效果图。红线内考虑活动场地",
    "image": "/cover/cover_24_satellite_to_render.png",
    "description": "利用 AI 技术实现卫星地图生成实景效果图，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "城市区位分析仅限知名城市",
    "name": "城市区位分析（仅限知名城市）",
    "badge": "分析",
    "prompt": "生成一张从江苏省南京市雨花台区的区位示意，从国家到地区的不断放大的几张图来表达，周围放一些当地历史文化的拼贴图，要有设计师风格，素雅，表达准确，拼贴画风格，建筑师风格，高清，排版自然",
    "image": "/cover/cover_32_urban_location_analysis.png",
    "description": "深度解析建筑设计要素，快速生成专业的城市区位分析（仅限知名城市），辅助设计师进行方案深化与表达。"
  },
  {
    "id": "su模型渲染",
    "name": "SU模型渲染",
    "badge": "生成",
    "prompt": "把左图的模型参考右图效果，做一张真实一点的效果图。保持摄像机镜头视角角度完全不变，建筑轮廓形态完全不变。",
    "image": "/cover/cover_6_su_model_render.png",
    "description": "将基础线稿或模型快速转化为具有丰富质感 and 光影效果的SU模型渲染，极大提升出图效率。"
  },
  {
    "id": "基地现状分析",
    "name": "基地现状分析",
    "badge": "分析",
    "prompt": "根据这张现场图，做一个建筑规划设计竞赛用的现状分析图，用英文说明，排版优秀",
    "image": "/cover/cover_18_site_status_analysis.png",
    "description": "深度解析建筑设计要素，快速生成专业的基地现状分析，辅助设计师进行方案深化与表达。"
  },
  {
    "id": "根据参考总图填色",
    "name": "根据参考总图填色",
    "badge": "生成",
    "prompt": "根据参考为总图填色，生成图的建筑轮廓形状、位置必须与图1的线稿匹配. 整体色彩、材质质感和绘图风格请参考图2。结果应是“具有图2风格的图1”。(一定要确保白模画幅与输出画幅一致，参考图截图成完全不同的画幅，不然容易出错)",
    "image": "/cover/cover_26_masterplan_coloring_by_reference.png",
    "description": "将基础线稿或模型快速转化为具有丰富质感 and 光影效果的根据参考总图填色，极大提升出图效率。"
  },
  {
    "id": "草模参考效果图生图",
    "name": "草模参考效果图生图",
    "badge": "生成",
    "prompt": "用效果图的风格重绘SU模型草图，确保模型草图里的建筑高度和形态不变。（切记：尽量把模型图做成一个标准比例尺寸与出图一致的，参考图给一个完全不同的画幅，不然很容易出错）",
    "image": "/cover/cover_34_sketch_model_to_render.png",
    "description": "利用 AI 技术实现草模参考效果图生图，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "立面节点示意",
    "name": "立面节点示意",
    "badge": "生成",
    "prompt": "生成这个建筑的立面节点构造图，要求清晰准确，用3D渲染的方式表达",
    "image": "/cover/cover_14_elevation_node_diagram.png",
    "description": "利用 AI 技术实现立面节点示意，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "户型图填色",
    "name": "户型图填色",
    "badge": "生成",
    "prompt": "为这张住宅建筑平面图填色，不同功能使用不同的颜色，公共区域使用灰色，颜色要素雅，体现设计美",
    "image": "/cover/cover_29_floor_plan_coloring.png",
    "description": "将基础线稿或模型快速转化为具有丰富质感 and 光影效果的户型图填色，极大提升出图效率。"
  },
  {
    "id": "效果图转图块分析图",
    "name": "效果图转图块分析图",
    "badge": "分析",
    "prompt": "生成一张SU线稿风格住宅区建筑规划空间分析图，模仿SASAKI风格",
    "image": "/cover/cover_28_render_to_block_analysis.png",
    "description": "深度解析建筑设计要素，快速生成专业的效果图转图块分析图，辅助设计师进行方案深化与表达。"
  },
  {
    "id": "准确更改效果图角度",
    "name": "准确更改效果图角度",
    "badge": "编辑",
    "prompt": "参考图1的角度，重新生成图2的建筑",
    "image": "/cover/cover_21_accurate_angle_change.png",
    "description": "利用 AI 技术实现准确更改效果图角度，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "更改鸟瞰图角度",
    "name": "更改鸟瞰图角度",
    "badge": "编辑",
    "prompt": "以提供的鸟瞰建筑场景为基础，保持建筑的整体形态、结构细节及与周边地形（如道路、绿地、水体等）的空间关系完全不变。将观察视角改变，生成一个低角度斜侧视图。新视角应能清晰展示建筑立面与右侧环境的衔接，同时保留原始场景的光照条件与材质质感。确保画面具有空间纵深感，避免建筑变形 or 地形扭曲。",
    "image": "/cover/cover_15_change_aerial_angle.png",
    "description": "利用 AI 技术实现更改鸟瞰图角度，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "用箭头表达新的角度",
    "name": "用箭头表达新的角度",
    "badge": "生成",
    "prompt": "以提供的鸟瞰建筑场景为基础，保持建筑的整体形态、结构细节及与周边地形（如道路、绿地、水体等）的空间关系完全不变。将观察视角改变，改变的视角参考我第二张图红色箭头方向。新视角应能清晰展示建筑立面与环境的衔接，同时保留原始场景的光照条件与材质质感。确保画面具有空间纵深感，避免建筑变形 or 地形扭曲。",
    "image": "/cover/cover_12_new_angle_with_arrow.png",
    "description": "利用 AI 技术实现用箭头表达新的角度，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "效果图转剖面分析",
    "name": "效果图转剖面分析",
    "badge": "分析",
    "prompt": "生成这座办公建筑的剖面分析图，需要考虑足够的共享空间",
    "image": "/cover/cover_8_reduce_building_height.png",
    "description": "深度解析建筑设计要素，快速生成专业的效果图转剖面分析，辅助设计师进行方案深化与表达。"
  },
  {
    "id": "基地分析图生成",
    "name": "基地分析图生成",
    "badge": "分析",
    "prompt": "从建筑设计角度重绘，生成周边环境图，注意用色的搭配",
    "image": "/cover/cover_19_site_analysis_diagram.png",
    "description": "深度解析建筑设计要素，快速生成专业的基地分析图生成，辅助设计师进行方案深化与表达。"
  },
  {
    "id": "图转手绘效果",
    "name": "图转手绘效果",
    "badge": "生成",
    "prompt": "将这张图转化为一张专业建筑手绘",
    "image": "/cover/cover_4_render_to_sketch.png",
    "description": "利用 AI 技术实现图转手绘效果，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "空地生成设计",
    "name": "空地生成设计",
    "badge": "生成",
    "prompt": "在这个地块上设计一座办公园，基地面积5万平，容积率2.5，生成一张鸟瞰图",
    "image": "/cover/cover_3_empty_lot_design.png",
    "description": "利用 AI 技术实现空地生成设计，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "夜景转换",
    "name": "效果图风格转换",
    "badge": "编辑",
    "prompt": "将这张效果图转化为夜景",
    "image": "/cover/cover_20_render_style_conversion.png",
    "description": "利用 AI 技术实现效果图风格转换，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "效果图生成各个立面图",
    "name": "效果图生成各个立面图",
    "badge": "生成",
    "prompt": "生成这座办公建筑的各个立面图，要有设计感",
    "image": "/cover/cover_7_render_to_elevations.png",
    "description": "利用 AI 技术实现效果图生成各个立面图，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "老建筑商业改造",
    "name": "老建筑商业改造",
    "badge": "生成",
    "prompt": "老建筑更新为现代商业的效果图，保留原始建筑元素，增加商业氛围",
    "image": "/cover/cover_27_old_building_renovation.png",
    "description": "利用 AI 技术实现老建筑商业改造，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "毛坯房室内设计",
    "name": "毛坯房室内设计",
    "badge": "生成",
    "prompt": "设计师设计客厅，现代主义，意大利家居",
    "image": "/cover/cover_36_empty_house_interior_design.png",
    "description": "利用 AI 技术实现毛坯房室内设计，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "效果图转白模",
    "name": "效果图转白模",
    "badge": "生成",
    "prompt": "图片转化为SU白模效果",
    "image": "/cover/cover_2_render_to_white_model.png",
    "description": "利用 AI 技术实现效果图转白模，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "更改木制建筑材料",
    "name": "更改建筑材料",
    "badge": "编辑",
    "prompt": "更换建筑材料为木头",
    "image": "/cover/cover_31_change_material.png",
    "description": "利用 AI 技术实现更改建筑材料，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "效果图转su渲染风格",
    "name": "效果图转SU渲染风格",
    "badge": "生成",
    "prompt": "生成建筑立面图，SU渲染风格，设计感强",
    "image": "/cover/cover_35_render_to_su_style.png",
    "description": "将基础线稿 or 模型快速转化为具有丰富质感 and 光影效果的效果图转SU渲染风格，极大提升出图效率。"
  },
  {
    "id": "效果图转剖面",
    "name": "效果图转剖面",
    "badge": "生成",
    "prompt": "生成这座建筑的完整剖面，要求准确",
    "image": "/cover/cover_9_render_to_section.png",
    "description": "利用 AI 技术实现效果图转剖面，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "效果图转立面蓝图",
    "name": "效果图转立面蓝图",
    "badge": "生成",
    "prompt": "生成这个住宅楼的2个标准立面图，CAD蓝图，白底蓝字，层高3.3米",
    "image": "/cover/cover_38_render_to_elevation_blueprint.png",
    "description": "利用 AI 技术实现效果图转立面蓝图，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "局部修改效果图",
    "name": "局部修改效果图",
    "badge": "编辑",
    "prompt": "保留主体建筑，删除其他建筑，同时优化景观场景",
    "image": "/cover/cover_11_local_modification.png",
    "description": "利用 AI 技术实现局部修改效果图，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  },
  {
    "id": "降低建筑高度",
    "name": "降低建筑高度",
    "badge": "生成",
    "prompt": "将建筑改为50米",
    "image": "/cover/cover_8_reduce_building_height.png",
    "description": "利用 AI 技术实现降低建筑高度，通过精准的提示词控制，快速产出高质量的建筑设计相关成果。"
  }
];
