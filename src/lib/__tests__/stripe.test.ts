import { describe, expect, it } from 'vitest';
import {
  constructStripeWebhookEvent,
  createEscrowCheckoutSession,
} from '../stripe';
import {
  PayoutMethodSchema,
  StripeDepositSchema,
} from '../validation';

describe('whap Stripe Integration & Escrow Funding', () => {
  describe('StripeDepositSchema validation', () => {
    it('accepts valid escrow deposit payloads', () => {
      const valid = {
        campaign_id: 'camp-1',
        amount_cents: 10000, // $100.00
        currency: 'USD' as const,
        user_email: 'holder@example.com',
        success_url: 'http://localhost:3088/campaigns/camp-1?funded=true',
        cancel_url: 'http://localhost:3088/campaigns/camp-1?canceled=true',
      };

      const parsed = StripeDepositSchema.parse(valid);
      expect(parsed.amount_cents).toBe(10000);
      expect(parsed.campaign_id).toBe('camp-1');
      expect(parsed.currency).toBe('USD');
    });

    it('rejects escrow deposits below the $5.00 (500 cents) minimum', () => {
      const invalid = {
        campaign_id: 'camp-1',
        amount_cents: 499, // below 500 cents
        currency: 'USD' as const,
      };

      expect(() => StripeDepositSchema.parse(invalid)).toThrow(
        /Minimum deposit is \$5\.00/i
      );
    });

    it('rejects empty campaign_id', () => {
      const invalid = {
        campaign_id: '',
        amount_cents: 5000,
        currency: 'USD' as const,
      };

      expect(() => StripeDepositSchema.parse(invalid)).toThrow();
    });

    it('accepts PHP currency deposits with appropriate minimum', () => {
      const validPhp = {
        campaign_id: 'camp-ph-1',
        amount_cents: 25000, // 250 PHP
        currency: 'PHP' as const,
      };

      const parsed = StripeDepositSchema.parse(validPhp);
      expect(parsed.currency).toBe('PHP');
      expect(parsed.amount_cents).toBe(25000);
    });
  });

  describe('PayoutMethodSchema with Stripe', () => {
    it('accepts Stripe payout method with stripe_email', () => {
      const valid = {
        type: 'stripe' as const,
        stripe_email: 'creator@example.com',
      };

      const parsed = PayoutMethodSchema.parse(valid);
      expect(parsed.type).toBe('stripe');
      if (parsed.type === 'stripe') {
        expect(parsed.stripe_email).toBe('creator@example.com');
      }
    });

    it('accepts Stripe payout method with stripe_account_id', () => {
      const valid = {
        type: 'stripe' as const,
        stripe_account_id: 'acct_1N00002eZvKYlo2C',
      };

      const parsed = PayoutMethodSchema.parse(valid);
      expect(parsed.type).toBe('stripe');
      if (parsed.type === 'stripe') {
        expect(parsed.stripe_account_id).toBe('acct_1N00002eZvKYlo2C');
      }
    });

    it('rejects Stripe payout method when neither email nor account ID is provided', () => {
      const invalid = {
        type: 'stripe' as const,
      };

      expect(() => PayoutMethodSchema.parse(invalid)).toThrow(
        /Complete all required fields for the chosen payout method/i
      );
    });
  });

  describe('createEscrowCheckoutSession fallback mode', () => {
    it('generates a valid mock checkout session and redirect url without API keys', async () => {
      const session = await createEscrowCheckoutSession({
        campaignId: 'camp-saas-1',
        campaignTitle: 'B2B SaaS Growth Cutdowns',
        amountCents: 15000, // $150.00
        currency: 'USD',
        userId: 'holder-1',
        userEmail: 'sponsor@b2bsaas.com',
        successUrl:
          'http://localhost:3088/campaigns/camp-saas-1?funded=true&amount=15000&session_id={CHECKOUT_SESSION_ID}',
        cancelUrl:
          'http://localhost:3088/campaigns/camp-saas-1?canceled=true',
      });

      expect(session).toBeDefined();
      expect(session.sessionId).toMatch(/^cs_test_mock_/);
      expect(session.mode).toBe('mock');
      expect(session.amountCents).toBe(15000);
      expect(session.currency).toBe('usd');
      expect(session.url).toContain('camp-saas-1?funded=true');
      expect(session.url).toContain(session.sessionId);
    });
  });

  describe('constructStripeWebhookEvent behavior', () => {
    it('throws descriptive error when stripe client is not configured', () => {
      expect(() =>
        constructStripeWebhookEvent(
          '{"id":"evt_test"}',
          'sig_test',
          'whsec_test123'
        )
      ).toThrow(/Stripe is not configured on this server/i);
    });
  });
});
