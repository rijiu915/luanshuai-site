// app/about/page.tsx
export default function About() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-20">
      <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">
        关于 孪数 AI
      </h1>
      <p className="text-gray-400 text-center max-w-2xl leading-relaxed">
        孪数 AI 致力于整合最先进的大模型能力，为创作者、开发者和企业提供一站式 AI 工具解决方案。
        我们相信，AI 不应是黑盒，而应是每个人手中的高效助手。
      </p>
      <div className="mt-12">
        <a 
          href="/" 
          className="text-gray-500 hover:text-white transition"
        >
          ← 返回首页
        </a>
      </div>
    </main>
  );
}