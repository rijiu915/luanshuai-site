import Link from 'next/link';

export const metadata = {
  title: '隐私政策 - lstwin',
  description: 'lstwin 隐私政策',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="mb-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← 返回首页
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">隐私政策</h1>
        <p className="text-sm text-muted-foreground mb-10">最后更新：2025年1月</p>

        <div className="prose prose-sm max-w-none text-foreground space-y-8">

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. 概述</h2>
            <p className="text-muted-foreground leading-relaxed">
              lstwin 非常重视您的隐私保护。本隐私政策说明我们如何收集、使用和保护您的个人信息。请在使用本平台前仔细阅读本政策。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. 我们收集的信息</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">我们可能收集以下类型的信息：</p>
            <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
              <li><strong>账户信息</strong>：注册时提供的邮箱地址、用户名等。</li>
              <li><strong>使用数据</strong>：您在平台上的操作记录、生成图像的提示词、使用频次等。</li>
              <li><strong>上传内容</strong>：您上传的参考图片（仅在生成过程中临时使用，不长期存储）。</li>
              <li><strong>支付信息</strong>：充值记录（具体支付信息由第三方支付平台处理，我们不存储您的银行卡或支付密码）。</li>
              <li><strong>设备信息</strong>：浏览器类型、IP 地址、访问时间等基础日志信息。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. 信息的使用</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">我们使用收集的信息用于：</p>
            <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
              <li>提供、维护和改善我们的服务。</li>
              <li>处理积分充值和会员订阅。</li>
              <li>向您发送服务通知和重要更新。</li>
              <li>检测和预防违规行为，保障平台安全。</li>
              <li>分析使用情况，优化用户体验。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. 信息的共享</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">我们不会出售您的个人信息。我们仅在以下情况下共享您的信息：</p>
            <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
              <li><strong>服务提供商</strong>：为运行平台所必需的第三方服务（如 AI 模型提供商、云存储、支付处理），仅提供必要的最小信息。</li>
              <li><strong>法律要求</strong>：在法律法规要求或司法机关要求时。</li>
              <li><strong>您的授权</strong>：经您明确同意后。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. 数据安全</h2>
            <p className="text-muted-foreground leading-relaxed">
              我们采用行业标准的安全措施保护您的数据，包括 HTTPS 加密传输、数据库访问控制等。但请注意，任何网络传输都无法保证 100% 的安全性，建议您妥善保管账户密码。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. 数据保留</h2>
            <p className="text-muted-foreground leading-relaxed">
              账户信息将在您使用期间保留。上传的参考图片在生成完成后会被删除，不做长期存储。您可以随时申请删除账户及相关数据。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Cookie 的使用</h2>
            <p className="text-muted-foreground leading-relaxed">
              本平台使用 Cookie 和类似技术维持您的登录状态、保存偏好设置。您可以通过浏览器设置控制 Cookie，但禁用 Cookie 可能影响部分功能的正常使用。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. 您的权利</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">根据相关法律，您有权：</p>
            <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
              <li>查询和访问我们持有的您的个人信息。</li>
              <li>更正不准确的个人信息。</li>
              <li>在特定情况下要求删除您的个人信息。</li>
              <li>撤回您对我们处理您个人信息的同意。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. 未成年人保护</h2>
            <p className="text-muted-foreground leading-relaxed">
              本平台不向 14 周岁以下未成年人提供服务。如我们发现不当收集了未成年人信息，将及时删除。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. 联系我们</h2>
            <p className="text-muted-foreground leading-relaxed">
              如您对本隐私政策有任何疑问或需要行使您的数据权利，请通过以下方式联系我们：<br />
              电话：18217272223
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
