import { NextRequest, NextResponse } from 'next/server';
import { constructStripeWebhookEvent, stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      // In development or when webhook secret is not set, log and acknowledge
      return NextResponse.json({
        received: true,
        note: 'Stripe webhook secret not configured. Running in acknowledgement mode.',
      });
    }

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const rawBody = await req.text();
    const event = constructStripeWebhookEvent(
      rawBody,
      signature,
      webhookSecret
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metadata = session.metadata || {};
        const campaignId = metadata.campaign_id;
        const amountCents = Number(metadata.amount_cents || session.amount_total || 0);

        // Metadata is captured and can be reconciled in database or local state
        break;
      }
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: `Webhook error: ${error.message}` },
      { status: 400 }
    );
  }
}
