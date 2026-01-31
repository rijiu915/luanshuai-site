import { prisma } from '@/lib/prisma';

const RECHARGE_PLANS = [
  { id: 'plan_10', amount: 10, credits: 280 },
  { id: 'plan_35', amount: 35, credits: 1000 },
  { id: 'plan_50', amount: 50, credits: 1450 },
  { id: 'plan_100', amount: 100, credits: 3000 },
  { id: 'vip_monthly', amount: 29.9, type: 'VIP', duration: 30 },
  { id: 'svip_monthly', amount: 59.9, type: 'SVIP', duration: 30 },
];

export async function processSuccessfulOrder(orderId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { orderId },
  });

  if (!transaction || transaction.status === 'completed') {
    return;
  }

  const plan = RECHARGE_PLANS.find(p => p.id === transaction.planId);

  if (!plan) {
    throw new Error(`Plan not found for transaction: ${transaction.orderId}`);
  }

  await prisma.$transaction(async (tx) => {
    // 1. 更新订单状态
    await tx.transaction.update({
      where: { orderId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    // 2. 更新用户余额或 VIP 状态
    if (plan.type) {
      // VIP 计划
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (plan.duration || 30));

      await tx.user.update({
        where: { id: transaction.userId },
        data: {
          vipLevel: plan.type,
          vipExpiry: expiryDate,
        },
      });
    } else if (plan.credits) {
      // 积分计划
      await tx.user.update({
        where: { id: transaction.userId },
        data: {
          balance: {
            increment: plan.credits,
          },
        },
      });

      // 添加积分记录
      await tx.pointsHistory.create({
        data: {
          userId: transaction.userId,
          amount: plan.credits,
          type: 'recharge',
          description: `充值 ${plan.credits} 积分`,
        },
      });
    }
  });
}
