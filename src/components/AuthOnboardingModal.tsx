'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Mail, Sparkles, UserCheck, X } from 'lucide-react';
import { useWhap } from '@/context/WhapContext';

export function AuthOnboardingModal() {
  const {
    authModalOpen,
    closeAuthModal,
    pendingOnboarding,
    signInWithGoogle,
    signInWithMagicLink,
    completeOnboarding,
    authRedirectTarget,
    switchDemoUser,
    db,
  } = useWhap();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [magicLinkSentTo, setMagicLinkSentTo] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'editor' | 'account_holder' | 'both'>('editor');
  const [error, setError] = useState<string | null>(null);

  if (!authModalOpen && !pendingOnboarding) return null;

  const handleGoogleClick = async () => {
    setError(null);
    try {
      const targetEmail = email.trim() || `clipper.${Math.floor(100 + Math.random() * 899)}@gmail.com`;
      const res = await signInWithGoogle(targetEmail, authRedirectTarget || undefined);
      if (!res.needsOnboarding && authRedirectTarget) {
        router.push(authRedirectTarget);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setMagicLinkSentTo(email.trim());
      const res = await signInWithMagicLink(email, authRedirectTarget || undefined);
      if (!res.needsOnboarding && authRedirectTarget) {
        router.push(authRedirectTarget);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const targetUrl = pendingOnboarding?.redirectAfterOnboarding || authRedirectTarget;
      const profile = completeOnboarding({
        display_name: displayName,
        role: selectedRole,
      });
      if (targetUrl) {
        router.push(targetUrl);
      } else if (profile.active_role === 'account_holder') {
        router.push('/holder');
      } else {
        router.push('/editor');
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-elevated p-6 shadow-2xl">
        {!pendingOnboarding && (
          <button
            type="button"
            onClick={closeAuthModal}
            aria-label="Close sign in dialog"
            className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* STEP B: 1-SCREEN ONBOARDING (Display Name + Role ONLY) */}
        {pendingOnboarding ? (
          <form onSubmit={handleOnboardingSubmit} className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-tally/30 bg-tally/10 px-2.5 py-0.5 text-xs font-medium text-tally-bright">
                <Sparkles className="h-3.5 w-3.5" />
                1-Screen Setup · Under 30 Seconds
              </div>
              <h2 className="mt-2 text-xl font-bold text-white">Complete your whap profile</h2>
              <p className="mt-1 text-xs text-zinc-400">
                Signed in as <span className="font-mono text-zinc-200">{pendingOnboarding.email}</span>.
                No payout method or portfolio required now.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Display Name
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={50}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-inset px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-tally-bright focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                How will you use whap?
              </label>
              <div className="mt-2 grid grid-cols-1 gap-2.5">
                {[
                  {
                    id: 'editor' as const,
                    title: 'Editor',
                    desc: 'Browse open campaigns, submit clips, and get paid per 1,000 views.',
                  },
                  {
                    id: 'account_holder' as const,
                    title: 'Account Holder (Page Owner)',
                    desc: 'Post campaigns, review watermarked clips, and post winners on your pages.',
                  },
                  {
                    id: 'both' as const,
                    title: 'Both (Switch anytime from the navbar)',
                    desc: 'Run campaigns for your pages and submit edits to other campaigns.',
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedRole(opt.id)}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                      selectedRole === opt.id
                        ? 'border-tally-bright bg-tally/15 text-white'
                        : 'border-white/10 bg-surface text-zinc-300 hover:border-white/25'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-bold">{opt.title}</span>
                      {selectedRole === opt.id && (
                        <CheckCircle2 className="h-4 w-4 text-tally-bright" />
                      )}
                    </div>
                    <span className="mt-0.5 text-xs text-zinc-400">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-tally py-3 text-sm font-bold text-zinc-950 transition hover:bg-tally-bright"
            >
              Finish &amp; Enter Marketplace
            </button>
          </form>
        ) : (
          /* STEP A: PASSWORDLESS SIGN IN (Google + Email Magic Link) */
          <div className="space-y-5">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-tally/30 bg-tally/10 px-2.5 py-0.5 text-xs font-medium text-tally-bright">
                Zero Passwords · Under 2-Min First Submission
              </span>
              <h2 className="mt-2 text-xl font-bold text-white">Sign in to whap</h2>
              <p className="mt-1 text-xs text-zinc-400">
                Campaigns are open to browse logged out. Sign in with Google or an email magic link to submit clips or launch campaigns.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleClick}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-white px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-white/10" />
              <span className="bg-elevated px-3 text-[11px] uppercase tracking-wider text-zinc-500">
                or email magic link
              </span>
              <div className="w-full border-t border-white/10" />
            </div>

            <form onSubmit={handleMagicLinkSubmit} className="space-y-3">
              <div>
                <label className="sr-only">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com (enter new email to test 1-screen onboarding)"
                  className="w-full rounded-xl border border-white/10 bg-inset px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-tally-bright focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-tally/40 bg-tally/15 px-4 py-2.5 text-sm font-semibold text-tally-bright transition hover:bg-tally/25"
              >
                <Mail className="h-4 w-4" />
                Send Instant Magic Link
              </button>
              {magicLinkSentTo && (
                <p className="text-center text-xs text-emerald-300">
                  Magic link verified for {magicLinkSentTo}!
                </p>
              )}
            </form>

            {/* Quick Seeded Persona Selector for Instant Testing */}
            <div className="rounded-xl border border-white/10 bg-surface p-3">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <UserCheck className="h-3.5 w-3.5 text-tally-bright" />
                Quick Seeded Account Login (1-Tap Test)
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {db.profiles.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      switchDemoUser(p.id);
                      closeAuthModal();
                    }}
                    className="truncate rounded-lg border border-white/10 bg-elevated px-2.5 py-1.5 text-left text-xs text-zinc-200 hover:border-tally/40 hover:text-white"
                  >
                    <span className="font-semibold">@{p.username}</span>
                    <span className="block text-[10px] text-zinc-400">{p.active_role}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
