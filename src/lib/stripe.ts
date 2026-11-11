import Stripe from 'stripe';

const apiKey = process.env.STRIPE_SECRET_KEY || '';

export const stripe = apiKey
  ? new Stripe(apiKey, {
      apiVersion: '2024-11-20.acacia' as any,
      typescript: true,
    })
  : null;

export interface CreateEscrowCheckoutSessionOptions {
  campaignId: string;
  campaignTitle: string;
  amountCents: number;
  currency: 'USD' | 'PHP';
  userId: string;
  userEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
  mode: 'live' | 'mock';
  amountCents: number;
  currency: string;
}

/**
 * Creates a Stripe Checkout Session for funding a campaign's escrow budget.
 * If STRIPE_SECRET_KEY is not configured, provides a seamless demo/mock fallback
 * that resolves immediately to the campaign page with a funded confirmation.
 */
export async function createEscrowCheckoutSession(
  options: CreateEscrowCheckoutSessionOptions
): Promise<CheckoutSessionResult> {
  const {
    campaignId,
    campaignTitle,
    amountCents,
    currency,
    userId,
    userEmail,
    successUrl,
    cancelUrl,
  } = options;

  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3088';

  const defaultSuccessUrl = `${appBaseUrl}/campaigns/${campaignId}?funded=true&amount=${amountCents}&session_id={CHECKOUT_SESSION_ID}`;
  const defaultCancelUrl = `${appBaseUrl}/campaigns/${campaignId}?funded=cancelled`;

  if (!stripe) {
    // Demo/Mock Stripe Checkout Session when API key is not present
    const mockSessionId = `cs_test_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const mockRedirectUrl = (successUrl || defaultSuccessUrl).replace(
      '{CHECKOUT_SESSION_ID}',
      mockSessionId
    );

    return {
      sessionId: mockSessionId,
      url: mockRedirectUrl,
      mode: 'mock',
      amountCents,
      currency: currency.toLowerCase(),
    };
  }

  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `${campaignTitle}: Escrow Funding Deposit`,
            description: `Pre-funded creator payout escrow for campaign #${campaignId}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    metadata: {
      campaign_id: campaignId,
      user_id: userId,
      amount_cents: amountCents.toString(),
      currency,
      deposit_type: 'campaign_escrow',
    },
    success_url: successUrl || defaultSuccessUrl,
    cancel_url: cancelUrl || defaultCancelUrl,
  });

  return {
    sessionId: session.id,
    url:
      session.url ||
      (successUrl || defaultSuccessUrl).replace(
        '{CHECKOUT_SESSION_ID}',
        session.id
      ),
    mode: 'live',
    amountCents,
    currency: currency.toLowerCase(),
  };
}

/**
 * Validates and constructs an event from a Stripe webhook payload.
 */
export function constructStripeWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  if (!stripe) {
    throw new Error('Stripe is not configured on this server.');
  }
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
