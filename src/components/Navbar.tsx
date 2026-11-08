'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Clapperboard,
  Film,
  LayoutDashboard,
  LogIn,
  Mail,
  PlusCircle,
  RotateCcw,
  Shield,
  Users,
  Wallet,
} from 'lucide-react';
import { useWhap } from '@/context/WhapContext';
import { formatMoneyCents } from '@/lib/payout-math';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    db,
    currentUser,
    emailOutbox,
    openAuthModal,
    switchActiveRole,
    switchDemoUser,
    markNotificationRead,
    markAllNotificationsRead,
    getUserAvailableBalanceCents,
    resetDemoSeed,
  } = useWhap();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<'in_app' | 'email_outbox'>('in_app');
  const [personaOpen, setPersonaOpen] = useState(false);

  const userNotifications = currentUser
    ? db.notifications.filter((n) => n.user_id === currentUser.id)
    : [];
  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const holderReviewQueueCount = currentUser
    ? db.submissions.filter((s) => {
        const camp = db.campaigns.find((c) => c.id === s.campaign_id);
        return (
          camp?.owner_id === currentUser.id &&
          ['submitted', 'resubmitted'].includes(s.status)
        );
      }).length
    : 0;

  const activeRole = currentUser?.active_role || null;
  const availableUsdCents = currentUser
    ? getUserAvailableBalanceCents(currentUser.id, 'USD')
    : 0;

  const handleRoleToggle = (role: 'editor' | 'account_holder' | 'admin') => {
    switchActiveRole(role);
    if (role === 'editor') router.push('/editor');
    if (role === 'account_holder') router.push('/holder');
    if (role === 'admin') router.push('/admin');
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-canvas/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          {/* Left: Brand + Primary Nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-tally text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition group-hover:scale-105">
                <Clapperboard className="h-5 w-5 stroke-[2.4]" />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-lg font-extrabold tracking-tight text-white leading-none">
                  whap
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-tally-bright">
                  clip exchange
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/campaigns"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  pathname?.startsWith('/campaigns')
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                }`}
              >
                Campaigns ({db.campaigns.filter((c) => c.status === 'open').length})
              </Link>

              {activeRole === 'editor' && (
                <>
                  <Link
                    href="/editor"
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      pathname === '/editor'
                        ? 'bg-white/10 text-white'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                    }`}
                  >
                    Editor Hub
                  </Link>
                  <Link
                    href="/editor/submissions"
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      pathname?.startsWith('/editor/submissions')
                        ? 'bg-white/10 text-white'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                    }`}
                  >
                    My Submissions
                  </Link>
                  <Link
                    href="/editor/payouts"
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      pathname?.startsWith('/editor/payouts')
                        ? 'bg-white/10 text-white'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                    }`}
                  >
                    Payouts &amp; Ledger
                  </Link>
                  <Link
                    href="/editor/profile"
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      pathname?.startsWith('/editor/profile')
                        ? 'bg-white/10 text-white'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                    }`}
                  >
                    Profile
                  </Link>
                </>
              )}

              {activeRole === 'account_holder' && (
                <>
                  <Link
                    href="/holder"
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      pathname === '/holder'
                        ? 'bg-white/10 text-white'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                    }`}
                  >
                    Holder Dashboard
                  </Link>
                  <Link
                    href="/holder/review"
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      pathname?.startsWith('/holder/review')
                        ? 'bg-white/10 text-white'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                    }`}
                  >
                    Review Queue
                    {holderReviewQueueCount > 0 && (
                      <span className="rounded-full bg-tally px-1.5 py-0.2 text-[10px] font-mono font-bold text-zinc-950">
                        {holderReviewQueueCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/holder/posted"
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      pathname?.startsWith('/holder/posted')
                        ? 'bg-white/10 text-white'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                    }`}
                  >
                    Posted &amp; Views
                  </Link>
                  <Link
                    href="/holder/payouts"
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      pathname?.startsWith('/holder/payouts')
                        ? 'bg-white/10 text-white'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                    }`}
                  >
                    Editor Payouts
                  </Link>
                  <Link
                    href="/holder/campaigns/new"
                    className="ml-1 inline-flex items-center gap-1 rounded-lg bg-tally/15 border border-tally/35 px-2.5 py-1 text-xs font-semibold text-tally-bright hover:bg-tally/25"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    New Campaign
                  </Link>
                </>
              )}

              {activeRole === 'admin' && (
                <Link
                  href="/admin"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    pathname?.startsWith('/admin')
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-amber-300 hover:bg-amber-500/10'
                  }`}
                >
                  <Shield className="h-3.5 w-3.5" />
                  Admin Console ({db.disputes.filter((d) => d.status === 'open').length} Disputes)
                </Link>
              )}
            </nav>
          </div>

          {/* Right: Role Switcher + Balance + Notifications + Persona Switcher */}
          <div className="flex items-center gap-2">
            {/* Role Switcher in Nav (One user can be both Account Holder and Editor and switch roles from the nav) */}
            {currentUser && (
              <div
                aria-label="Role switcher"
                className="flex items-center rounded-xl border border-white/10 bg-surface p-0.5 text-xs"
              >
                <button
                  type="button"
                  onClick={() => handleRoleToggle('editor')}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                    activeRole === 'editor'
                      ? 'bg-tally text-zinc-950 shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleToggle('account_holder')}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                    activeRole === 'account_holder'
                      ? 'bg-tally text-zinc-950 shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Holder
                </button>
                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleRoleToggle('admin')}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                      activeRole === 'admin'
                        ? 'bg-amber-400 text-zinc-950 shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Admin
                  </button>
                )}
              </div>
            )}

            {/* Editor Balance Pill */}
            {currentUser && activeRole === 'editor' && (
              <Link
                href="/editor/payouts"
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-mono text-xs font-bold text-emerald-300 hover:bg-emerald-500/20"
              >
                <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                {formatMoneyCents(availableUsdCents, 'USD')}
              </Link>
            )}

            {/* Notifications Bell (In-App + Email Outbox) */}
            {currentUser && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen(!notifOpen);
                    setPersonaOpen(false);
                  }}
                  aria-label="Notifications"
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-surface text-zinc-300 hover:border-white/25 hover:text-white"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-tally px-1 font-mono text-[10px] font-bold text-zinc-950">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-white/15 bg-elevated p-4 shadow-2xl z-50">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setNotifTab('in_app')}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            notifTab === 'in_app'
                              ? 'bg-tally text-zinc-950'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          In-App ({userNotifications.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotifTab('email_outbox')}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            notifTab === 'email_outbox'
                              ? 'bg-tally text-zinc-950'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <Mail className="h-3 w-3" />
                          Emails ({emailOutbox.length})
                        </button>
                      </div>
                      {notifTab === 'in_app' && unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsRead}
                          className="text-[11px] font-medium text-tally-bright hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="mt-2.5 max-h-80 space-y-2 overflow-y-auto pr-1">
                      {notifTab === 'in_app' ? (
                        userNotifications.length === 0 ? (
                          <p className="py-6 text-center text-xs text-zinc-500">
                            No notifications for @{currentUser.username} yet.
                          </p>
                        ) : (
                          userNotifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                markNotificationRead(n.id);
                                setNotifOpen(false);
                                router.push(n.action_url);
                              }}
                              className={`cursor-pointer rounded-xl border p-2.5 transition ${
                                n.read
                                  ? 'border-white/5 bg-surface/60 text-zinc-400'
                                  : 'border-tally/30 bg-tally/10 text-zinc-100'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-bold text-white">{n.title}</span>
                                <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-zinc-300">
                                  +Email
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] leading-relaxed text-zinc-300">
                                {n.body}
                              </p>
                            </div>
                          ))
                        )
                      ) : emailOutbox.length === 0 ? (
                        <p className="py-6 text-center text-xs text-zinc-500">
                          Trigger any action (submit, select, update views, payout) to inspect dispatched emails here.
                        </p>
                      ) : (
                        emailOutbox.map((em) => (
                          <div
                            key={em.id}
                            className="rounded-xl border border-white/10 bg-surface p-2.5 text-xs"
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                              <span>To: {em.to}</span>
                              <span>{em.transport}</span>
                            </div>
                            <p className="mt-1 font-bold text-white">{em.subject}</p>
                            <p className="mt-1 whitespace-pre-line text-[11px] text-zinc-300">
                              {em.body}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Demo Persona Switcher & Auth Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setPersonaOpen(!personaOpen);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-surface px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-tally/40"
              >
                <Users className="h-3.5 w-3.5 text-tally-bright" />
                <span className="max-w-[115px] truncate font-mono">
                  {currentUser ? `@${currentUser.username}` : 'Logged Out'}
                </span>
              </button>

              {personaOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/15 bg-elevated p-3 shadow-2xl z-50">
                  <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Switch Seeded User / Role
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        resetDemoSeed();
                        setPersonaOpen(false);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:underline"
                      title="Reset seed data to initial state"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset Seed
                    </button>
                  </div>

                  <div className="space-y-1 max-h-72 overflow-y-auto">
                    {db.profiles.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          switchDemoUser(p.id);
                          setPersonaOpen(false);
                          if (p.active_role === 'admin') router.push('/admin');
                          else if (p.active_role === 'account_holder') router.push('/holder');
                          else router.push('/editor');
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition ${
                          currentUser?.id === p.id
                            ? 'bg-tally/20 text-white border border-tally/40'
                            : 'text-zinc-300 hover:bg-white/5'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-white">
                            {p.display_name}{' '}
                            <span className="font-mono text-[11px] text-zinc-400">@{p.username}</span>
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Role: <span className="text-tally-bright">{p.role}</span> (active:{' '}
                            {p.active_role})
                          </div>
                        </div>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        switchDemoUser(null);
                        setPersonaOpen(false);
                        router.push('/campaigns');
                      }}
                      className={`mt-1 flex w-full items-center justify-between rounded-xl border border-dashed border-white/15 px-2.5 py-2 text-left text-xs ${
                        !currentUser ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>Browse Logged Out (Public Visitor)</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPersonaOpen(false);
                      openAuthModal();
                    }}
                    className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-tally py-2 text-xs font-bold text-zinc-950 hover:bg-tally-bright"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Test New User 1-Screen Signup
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile-First Bottom Sticky Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex md:hidden items-center justify-around border-t border-white/10 bg-canvas/95 py-2 backdrop-blur-md">
        <Link
          href="/campaigns"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium ${
            pathname?.startsWith('/campaigns') ? 'text-tally-bright' : 'text-zinc-400'
          }`}
        >
          <Film className="h-4 w-4" />
          <span>Campaigns</span>
        </Link>

        {activeRole === 'account_holder' ? (
          <>
            <Link
              href="/holder"
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium ${
                pathname === '/holder' ? 'text-tally-bright' : 'text-zinc-400'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Holder</span>
            </Link>
            <Link
              href="/holder/review"
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium ${
                pathname?.startsWith('/holder/review') ? 'text-tally-bright' : 'text-zinc-400'
              }`}
            >
              <Clapperboard className="h-4 w-4" />
              <span>Review ({holderReviewQueueCount})</span>
            </Link>
            <Link
              href="/holder/posted"
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium ${
                pathname?.startsWith('/holder/posted') ? 'text-tally-bright' : 'text-zinc-400'
              }`}
            >
              <Wallet className="h-4 w-4" />
              <span>Posted/Views</span>
            </Link>
          </>
        ) : activeRole === 'admin' ? (
          <Link
            href="/admin"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium ${
              pathname?.startsWith('/admin') ? 'text-amber-300' : 'text-zinc-400'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Admin</span>
          </Link>
        ) : (
          <>
            <Link
              href="/editor"
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium ${
                pathname === '/editor' ? 'text-tally-bright' : 'text-zinc-400'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/editor/submissions"
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium ${
                pathname?.startsWith('/editor/submissions') ? 'text-tally-bright' : 'text-zinc-400'
              }`}
            >
              <Clapperboard className="h-4 w-4" />
              <span>My Clips</span>
            </Link>
            <Link
              href="/editor/payouts"
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium ${
                pathname?.startsWith('/editor/payouts') ? 'text-tally-bright' : 'text-zinc-400'
              }`}
            >
              <Wallet className="h-4 w-4" />
              <span>Payouts</span>
            </Link>
          </>
        )}
      </nav>
    </>
  );
}
