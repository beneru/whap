'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowsClockwise,
  Bell,
  Broadcast,
  CaretDown,
  Checks,
  Coins,
  EnvelopeSimple,
  FilmSlate,
  FilmStrip,
  Gauge,
  Palette,
  PlusCircle,
  Queue,
  ShieldCheck,
  SignOut,
  UserCircle,
  Users,
} from '@phosphor-icons/react';
import { useWhap } from '@/context/WhapContext';
import { formatMoneyCents } from '@/lib/payout-math';

interface NavLinkItem {
  href: string;
  label: string;
  shortLabel: string;
  Icon: React.ElementType;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    db,
    currentUser,
    activeRole,
    switchActiveRole,
    switchDemoPersona,
    setAuthModalOpen,
    markNotificationRead,
    markAllNotificationsRead,
    getEditorWalletSummary,
    resetToInitialSeed,
  } = useWhap();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<'in_app' | 'email'>('in_app');
  const [personaOpen, setPersonaOpen] = useState(false);

  const userNotifs = db.notifications.filter(
    (n) => !currentUser || n.user_id === currentUser.id
  );
  const unreadCount = userNotifs.filter((n) => !n.read).length;

  const wallet =
    currentUser && (activeRole === 'editor' || currentUser.role === 'both')
      ? getEditorWalletSummary(currentUser.id)
      : null;

  // Max 4 items so mobile bottom bar always has <= 4 tabs
  const editorLinks: NavLinkItem[] = [
    { href: '/campaigns', label: 'Campaigns', shortLabel: 'Campaigns', Icon: FilmStrip },
    { href: '/editor', label: 'Dashboard', shortLabel: 'Home', Icon: Gauge },
    {
      href: '/editor/submissions',
      label: 'My Clips',
      shortLabel: 'My Clips',
      Icon: FilmSlate,
    },
    {
      href: '/editor/payouts',
      label: 'Payouts',
      shortLabel: 'Payouts',
      Icon: Coins,
    },
  ];

  const holderLinks: NavLinkItem[] = [
    { href: '/holder', label: 'Overview', shortLabel: 'Home', Icon: Gauge },
    {
      href: '/holder/review',
      label: 'Review Queue',
      shortLabel: 'Review',
      Icon: Queue,
    },
    {
      href: '/holder/posted',
      label: 'Posted Clips',
      shortLabel: 'Posted',
      Icon: Broadcast,
    },
    {
      href: '/holder/payouts',
      label: 'Payouts',
      shortLabel: 'Payouts',
      Icon: Coins,
    },
  ];

  const adminLinks: NavLinkItem[] = [
    { href: '/admin', label: 'Admin Desk', shortLabel: 'Admin', Icon: ShieldCheck },
    { href: '/campaigns', label: 'Campaigns', shortLabel: 'Campaigns', Icon: FilmStrip },
    { href: '/holder/review', label: 'Review Queue', shortLabel: 'Review', Icon: Queue },
    {
      href: '/styleguide',
      label: 'Styleguide',
      shortLabel: 'Style',
      Icon: Palette,
    },
  ];

  const publicLinks: NavLinkItem[] = [
    { href: '/', label: 'Home', shortLabel: 'Home', Icon: FilmSlate },
    { href: '/campaigns', label: 'Campaigns', shortLabel: 'Campaigns', Icon: FilmStrip },
    { href: '/styleguide', label: 'Styleguide', shortLabel: 'Style', Icon: Palette },
  ];

  const navLinks = !currentUser
    ? publicLinks
    : activeRole === 'admin'
    ? adminLinks
    : activeRole === 'account_holder'
    ? holderLinks
    : editorLinks;

  const handleRoleSwitch = (nextRole: 'editor' | 'account_holder' | 'admin') => {
    switchActiveRole(nextRole);
    if (nextRole === 'editor') router.push('/editor');
    if (nextRole === 'account_holder') router.push('/holder');
    if (nextRole === 'admin') router.push('/admin');
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-paper/95 backdrop-blur-none">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-sprout shadow-sm transition-transform duration-150 group-hover:-translate-y-0.5">
                <FilmSlate weight="bold" className="h-5 w-5 text-ink" />
              </div>
              <span className="font-display text-2xl tracking-tight font-bold text-ink">
                whap
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav
              aria-label="Primary Navigation"
              className="hidden md:flex items-center gap-1.5"
            >
              {navLinks.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.Icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                      isActive
                        ? 'border border-emerald-500/40 bg-sprout/25 text-ink'
                        : 'border border-transparent text-muted hover:bg-mint hover:text-ink'
                    }`}
                  >
                    <Icon weight="bold" className="h-4 w-4 text-ink" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {currentUser && activeRole === 'editor' && (
                <Link
                  href="/editor/profile"
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                    pathname === '/editor/profile'
                      ? 'border border-emerald-500/40 bg-sprout/25 text-ink'
                      : 'border border-transparent text-muted hover:bg-mint hover:text-ink'
                  }`}
                >
                  <UserCircle weight="bold" className="h-4 w-4 text-ink" />
                  <span>Profile</span>
                </Link>
              )}

              {currentUser && activeRole === 'account_holder' && (
                <Link
                  href="/holder/campaigns/new"
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                    pathname === '/holder/campaigns/new'
                      ? 'border border-emerald-500/40 bg-sprout/25 text-ink'
                      : 'border border-transparent text-forest hover:bg-mint'
                  }`}
                >
                  <PlusCircle weight="bold" className="h-4 w-4" />
                  <span>New Campaign</span>
                </Link>
              )}

              {pathname !== '/styleguide' && (
                <Link
                  href="/styleguide"
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-muted hover:bg-mint hover:text-ink"
                >
                  <Palette weight="bold" className="h-3.5 w-3.5" />
                  <span>Styleguide</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Right Controls: Role Switcher, Balance Pill, Notifications, Persona Switcher */}
          <div className="flex items-center gap-2">
            {/* Role Switcher */}
            {currentUser && (
              <div
                role="group"
                aria-label="Switch Role"
                className="flex items-center rounded-full border border-border bg-mint/50 p-0.5 text-xs"
              >
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('editor')}
                  className={`rounded-full px-2.5 py-1 font-bold transition ${
                    activeRole === 'editor'
                      ? 'border border-emerald-500/40 bg-sprout text-ink shadow-sm'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('account_holder')}
                  className={`rounded-full px-2.5 py-1 font-bold transition ${
                    activeRole === 'account_holder'
                      ? 'border border-emerald-500/40 bg-sprout text-ink shadow-sm'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  Holder
                </button>
                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch('admin')}
                    className={`rounded-full px-2.5 py-1 font-bold transition ${
                      activeRole === 'admin'
                        ? 'border border-sun/60 bg-sun text-ink shadow-sm'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    Admin
                  </button>
                )}
              </div>
            )}

            {/* Editor Balance Pill */}
            {wallet && activeRole === 'editor' && (
              <Link
                href="/editor/payouts"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-sprout/20 px-3 py-1 text-xs font-bold text-forest shadow-sm hover:bg-sprout/30 transition"
              >
                <Coins weight="bold" className="h-4 w-4 text-forest" />
                <span className="tabular-nums">
                  {formatMoneyCents(wallet.availableBalanceCents, 'USD')}
                </span>
              </Link>
            )}

            {/* Notifications Bell */}
            {currentUser && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen((prev) => !prev);
                    setPersonaOpen(false);
                  }}
                  aria-label="Notifications"
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-paper text-ink shadow-sm hover:bg-mint transition"
                >
                  <Bell weight="bold" className="h-4 w-4 text-ink" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-border bg-sun px-1 text-[10px] font-bold text-ink tabular-nums">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="card-sticker absolute right-0 mt-2 w-80 sm:w-96 p-4 z-50">
                    <div className="flex items-center justify-between border-b border-border pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setNotifTab('in_app')}
                          className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                            notifTab === 'in_app'
                              ? 'border border-emerald-500/40 bg-sprout text-ink shadow-sm'
                              : 'text-muted hover:text-ink'
                          }`}
                        >
                          Alerts ({userNotifs.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotifTab('email')}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition ${
                            notifTab === 'email'
                              ? 'border border-emerald-500/40 bg-sprout text-ink shadow-sm'
                              : 'text-muted hover:text-ink'
                          }`}
                        >
                          <EnvelopeSimple weight="bold" className="h-3.5 w-3.5" />
                          <span>Email Outbox</span>
                        </button>
                      </div>

                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsRead}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:underline"
                        >
                          <Checks weight="bold" className="h-3.5 w-3.5" />
                          <span>Mark read</span>
                        </button>
                      )}
                    </div>

                    <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
                      {userNotifs.length === 0 ? (
                        <p className="py-6 text-center text-xs font-medium text-muted">
                          No alerts right now.
                        </p>
                      ) : notifTab === 'in_app' ? (
                        userNotifs.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationRead(n.id);
                              setNotifOpen(false);
                              router.push(n.action_url);
                            }}
                            className={`cursor-pointer rounded-xl border p-3 transition ${
                              n.read
                                ? 'border-border bg-paper hover:bg-mint/60'
                                : 'border-emerald-500/30 bg-mint/80'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-bold text-ink">
                                {n.title}
                              </span>
                              {!n.read && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-forest mt-1" />
                              )}
                            </div>
                            <p className="mt-1 text-xs text-muted">{n.body}</p>
                          </div>
                        ))
                      ) : (
                        userNotifs.map((n) => (
                          <div
                            key={n.id}
                            className="rounded-xl border border-border bg-mint/50 p-3 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px] font-bold text-muted">
                              <span>To: {currentUser?.email}</span>
                              <span>Sent</span>
                            </div>
                            <p className="font-extrabold text-ink">
                              Subject: [whap] {n.title}
                            </p>
                            <p className="whitespace-pre-line text-muted text-[11px]">
                              {n.body}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Persona Switcher / Sign In */}
            <div className="relative">
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => {
                    setPersonaOpen((prev) => !prev);
                    setNotifOpen(false);
                  }}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-paper px-3 text-xs font-semibold text-ink shadow-sm hover:bg-mint transition"
                >
                  <Users weight="bold" className="h-4 w-4 text-ink" />
                  <span className="max-w-[96px] truncate">
                    @{currentUser.username}
                  </span>
                  <CaretDown weight="bold" className="h-3.5 w-3.5 text-ink" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="btn-sticker btn-primary py-2 px-4 text-xs"
                >
                  Sign In / Join
                </button>
              )}

              {personaOpen && (
                <div className="card-sticker absolute right-0 mt-2 w-72 p-3.5 z-50 space-y-2.5">
                  <div className="border-b border-border pb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink">
                      Switch Demo Account
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        resetToInitialSeed();
                        setPersonaOpen(false);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:underline"
                    >
                      <ArrowsClockwise weight="bold" className="h-3.5 w-3.5" />
                      <span>Reset Data</span>
                    </button>
                  </div>

                  <div className="max-h-64 space-y-1.5 overflow-y-auto">
                    {db.profiles.map((p) => {
                      const isCurrent = currentUser?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            switchDemoPersona(p.id);
                            setPersonaOpen(false);
                          }}
                          className={`w-full rounded-xl border p-2 text-left text-xs transition ${
                            isCurrent
                              ? 'border-emerald-500/40 bg-sprout/20 text-ink font-bold'
                              : 'border-transparent hover:border-border hover:bg-mint text-ink'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{p.display_name}</span>
                            <span className="rounded-full border border-border bg-paper px-2 py-0.5 text-[10px] font-bold uppercase text-muted">
                              {p.role}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-muted">
                            @{p.username}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-t border-border pt-2 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPersonaOpen(false);
                        setAuthModalOpen(true);
                      }}
                      className="w-full rounded-xl border border-border bg-mint py-2 text-xs font-bold text-ink hover:bg-sprout transition"
                    >
                      + Test 1-Screen Onboarding
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoPersona(null);
                        setPersonaOpen(false);
                        router.push('/campaigns');
                      }}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-paper py-2 text-xs font-bold text-ink hover:bg-coral/20 transition"
                    >
                      <SignOut weight="bold" className="h-4 w-4" />
                      <span>Browse Logged Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-paper/95 backdrop-blur-none md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 px-2 py-1.5">
          {navLinks.slice(0, 4).map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-ink"
              >
                <span
                  className={`flex h-8 w-12 items-center justify-center rounded-full transition ${
                    isActive
                      ? 'border border-emerald-500/40 bg-sprout/30'
                      : 'border border-transparent'
                  }`}
                >
                  <Icon weight="bold" className="h-5 w-5 text-ink" />
                </span>
                <span
                  className={`text-[11px] ${
                    isActive ? 'font-bold text-ink' : 'font-medium text-muted'
                  }`}
                >
                  {item.shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
