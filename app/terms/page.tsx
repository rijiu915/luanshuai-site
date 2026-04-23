import Link from 'next/link';

export const metadata = {
  title: '用户协议 - lstwin',
  description: 'lstwin 用户协议',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="mb-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← 返回首页
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">用户协议</h1>
        <p className="text-sm text-muted-foreground mb-10">最后更新：2025年1月</p>

        <div className="prose prose-sm max-w-none text-foreground space-y-8">

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. 接受条款</h2>
            <p className="text-muted-foreground leading-relaxed">
              欢迎使用 lstwin（以下简称"本平台"）。在您使用本平台提供的服务之前，请仔细阅读本用户协议。通过访问或使用本平台，即表示您同意受本协议的约束。如果您不同意本协议的任何条款，请停止使用本平台。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. 服务说明</h2>
            <p className="text-muted-foreground leading-relaxed">
              lstwin 是一款面向建筑设计师的 AI 图像生成工具，提供文生图、图生图、建筑效果图生成等功能。本平台的服务内容可能随时更新，我们将通过网站公告等方式通知用户。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. 账户注册</h2>
            <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
              <li>您需要注册账户才能使用本平台的核心功能。</li>
              <li>您须保证注册信息的真实性和准确性。</li>
              <li>您有责任维护账户的安全，不得将账户信息泄露给第三方。</li>
              <li>如发现账户被盗用，应立即联系我们。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. 积分与会员</h2>
            <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
              <li>积分为虚拟资产，用于兑换图像生成服务，不可提现。</li>
              <li>积分充值完成后，除法律规定情形外，不支持退款。</li>
              <li>会员订阅费用按订阅周期收取，到期后自动失效。</li>
              <li>本平台有权根据运营需要调整积分定价及服务内容，调整前将提前公告。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. 用户行为规范</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">您在使用本平台时，不得进行以下行为：</p>
            <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
              <li>生成违反法律法规、社会公序良俗的内容。</li>
              <li>生成侵犯他人知识产权或隐私权的内容。</li>
              <li>尝试破解、攻击或干扰本平台的正常运行。</li>
              <li>利用本平台从事任何违法商业活动。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. 知识产权</h2>
            <p className="text-muted-foreground leading-relaxed">
              用户通过本平台生成的图像，版权归用户所有。但您授予本平台在改善服务、展示案例等方面使用这些图像的非独家许可（不涉及商业销售）。如不希望您的作品被展示，可通过联系方式告知我们。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. 免责声明</h2>
            <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
              <li>本平台提供的 AI 生成内容仅供参考，不构成任何专业建议。</li>
              <li>因不可抗力或第三方原因导致的服务中断，本平台不承担责任。</li>
              <li>用户因违反本协议造成的损失由用户自行承担。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. 协议修改</h2>
            <p className="text-muted-foreground leading-relaxed">
              我们保留随时修改本协议的权利。修改后的协议将在网站上公布，继续使用本平台即表示您接受修改后的协议。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. 联系我们</h2>
            <p className="text-muted-foreground leading-relaxed">
              如您对本协议有任何疑问，请通过以下方式联系我们：<br />
              电话：18217272223
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
