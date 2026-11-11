'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  EnvelopeSimple,
  GoogleLogo,
  X,
} from '@phosphor-icons/react';
import { useWhap } from '@/context/WhapContext';
import { ClappyMascot } from '@/components/ClappyMascot';

export function AuthOnboardingModal() {
  const { authModalOpen, setAuthModalOpen, completePasswordlessOnboarding } =
    useWhap();

  const [step, setStep] = useState<'auth' | 'onboarding'>('auth');
  const [authMethod, setAuthMethod] = useState<'google' | 'magic_link'>('google');
  const [email, setEmail] = useState('alex@clipmakers.io');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [displayName, setDisplayName] = useState('Alex Rivera');
  const [role, setRole] = useState<'editor' | 'account_holder' | 'both'>('editor');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleGoogleTap = () => {
    setAuthMethod('google');
    setStep('onboarding');
    setErrorMsg(null);
  };

  const handleSendMagicLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setErrorMsg('Enter a valid email address so we can send your sign-in link.');
      return;
    }
    setAuthMethod('magic_link');
    setMagicLinkSent(true);
    setErrorMsg(null);
  };

  const handleCompleteOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      completePasswordlessOnboarding({
        email,
        display_name: displayName,
        role,
        auth_provider: authMethod,
      });
      setStep('auth');
      setMagicLinkSent(false);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
    >
      <div className="card-sticker relative w-full max-w-md p-6 space-y-5">
        <button
          type="button"
          onClick={() => setAuthModalOpen(false)}
          aria-label="Close sign in window"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-paper text-ink shadow-sm hover:bg-mint transition"
        >
          <X weight="bold" className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-4">
          <ClappyMascot variant="wave" size={60} className="shrink-0" />
          <div>
            <span className="chip-sticker bg-sprout text-ink">
              Passwordless Auth
            </span>
            <h2
              id="onboarding-modal-title"
              className="mt-1.5 font-display text-2xl font-bold text-ink"
            >
              {step === 'auth' ? 'Sign in to whap' : 'One quick step'}
            </h2>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-coral/40 bg-coral/15 p-3 text-xs font-bold text-ink">
            {errorMsg}
          </div>
        )}

        {step === 'auth' ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleTap}
              className="btn-sticker btn-primary w-full"
            >
              <GoogleLogo weight="bold" className="h-5 w-5" />
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                or email magic link
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSendMagicLink} className="space-y-3">
              <div>
                <label
                  htmlFor="magic-link-email"
                  className="mb-1.5 block text-sm font-bold text-ink"
                >
                  Your email address
                </label>
                <input
                  id="magic-link-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-sticker"
                />
              </div>

              {!magicLinkSent ? (
                <button
                  type="submit"
                  className="btn-sticker btn-secondary w-full"
                >
                  <EnvelopeSimple weight="bold" className="h-5 w-5" />
                  <span>Send Magic Link</span>
                </button>
              ) : (
                <div className="rounded-xl border border-border bg-mint p-4 space-y-3">
                  <p className="text-xs font-semibold text-ink">
                    We sent a sign-in link to <strong>{email}</strong>. Tap below to
                    open it right now:
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep('onboarding')}
                    className="btn-sticker btn-primary w-full text-xs"
                  >
                    <CheckCircle weight="bold" className="h-4 w-4" />
                    <span>Tap Magic Link &rarr; Continue</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        ) : (
          <form onSubmit={handleCompleteOnboarding} className="space-y-4">
            <div>
              <label
                htmlFor="onboarding-display-name"
                className="mb-1.5 block text-sm font-bold text-ink"
              >
                What name should people see?
              </label>
              <input
                id="onboarding-display-name"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-sticker"
              />
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-bold text-ink">
                How will you use whap?
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    value: 'editor',
                    title: 'Video Editor',
                    desc: 'I cut clips and get paid per view.',
                  },
                  {
                    value: 'account_holder',
                    title: 'Account Holder (Page Owner)',
                    desc: 'I run social pages and need edited clips.',
                  },
                  {
                    value: 'both',
                    title: 'Both Roles',
                    desc: 'I edit clips and also run my own pages.',
                  },
                ].map((opt) => {
                  const selected = role === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setRole(opt.value as 'editor' | 'account_holder' | 'both')
                      }
                      className={`rounded-xl border p-3 text-left transition ${
                        selected
                          ? 'border-emerald-600 bg-emerald-500/10 shadow-sm'
                          : 'border-border bg-paper hover:bg-mint/60'
                      }`}
                    >
                      <div className="font-bold text-sm text-ink">
                        {opt.title}
                      </div>
                      <div className="text-xs text-muted mt-0.5">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-xs font-bold text-muted">
              We only ask for your payout info after your first clip earns money.
            </p>

            <button type="submit" className="btn-sticker btn-primary w-full">
              <CheckCircle weight="bold" className="h-5 w-5" />
              <span>Finish &amp; Jump In</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
