import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    if (session.payment_status === 'paid' && session.metadata) {
      const userId = parseInt(session.metadata.userId, 10);
      const type = session.metadata.type || 'recharge';

      if (isNaN(userId)) {
        console.error('Invalid userId in metadata');
        return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
      }

      try {
        if (type === 'recharge') {
          const credits = parseInt(session.metadata.credits, 10);

          if (!isNaN(credits) && credits > 0) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                balance: {
                  increment: credits,
                },
                pointsHistory: {
                  create: {
                    amount: credits,
                    type: 'recharge',
                    description: '在线充值',
                  }
                }
              },
            });
            console.log(`User ${userId} recharged ${credits} credits. Session: ${session.id}`);
          }
        } else if (type === 'vip') {
          const vipLevel = session.metadata.vipLevel;
          const vipExpiry = new Date();
          vipExpiry.setDate(vipExpiry.getDate() + 30);

          await prisma.user.update({
            where: { id: userId },
            data: {
              vipLevel: vipLevel,
              vipExpiry: vipExpiry,
            },
          });
          console.log(`User ${userId} upgraded to ${vipLevel}. Session: ${session.id}`);
        }
      } catch (dbError) {
        console.error('Database update failed:', dbError);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
