import { NextRequest, NextResponse } from 'next/server';
import { StripeDepositSchema } from '@/lib/validation';
import { createEscrowCheckoutSession } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = StripeDepositSchema.parse(json);

    const session = await createEscrowCheckoutSession({
      campaignId: parsed.campaign_id,
      campaignTitle: json.campaign_title || 'Clipping Campaign',
      amountCents: parsed.amount_cents,
      currency: parsed.currency,
      userId: json.user_id || 'anonymous_holder',
      userEmail: json.user_email,
      successUrl: parsed.success_url,
      cancelUrl: parsed.cancel_url,
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.sessionId,
      mode: session.mode,
      amountCents: session.amountCents,
      currency: session.currency,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}
