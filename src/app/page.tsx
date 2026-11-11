'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Broadcast,
  CheckCircle,
  Coins,
  FilmStrip,
  Palette,
  ShieldCheck,
  UploadSimple,
} from '@phosphor-icons/react';
import { useWhap } from '@/context/WhapContext';
import { formatMoneyCents } from '@/lib/payout-math';
import { CampaignCard } from '@/components/CampaignCard';
import { ClappyMascot } from '@/components/ClappyMascot';

export default function LandingPage() {
  const { db, setAuthModalOpen } = useWhap();
  const [simViews, setSimViews] = useState(25000);
  const [simRateDollars, setSimRateDollars] = useState(1.5);
  const [simBaseDollars, setSimBaseDollars] = useState(5);

  const openCampaigns = db.campaigns.filter((c) => c.status === 'open');
  const simMaxBonusDollars = 60;
  const simViewBonus = Math.min(
    (simViews / 1000) * simRateDollars,
    simMaxBonusDollars
  );
  const simTotal = simBaseDollars + simViewBonus;

  return (
    <div className="space-y-12 pb-8">
      {/* Sticker Sheet Hero (No heavy images, no hero video, Clappy Mascot + Payout Calculator) */}
      <section className="card-sticker bg-mint p-6 sm:p-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip-sticker bg-sprout text-ink">
                <FilmStrip weight="bold" className="h-4 w-4" />
                <span>Clip Marketplace for Pages &amp; Editors</span>
              </span>
              <Link
                href="/styleguide"
                className="chip-sticker bg-paper text-ink hover:bg-sun"
              >
                <Palette weight="bold" className="h-3.5 w-3.5" />
                <span>View Styleguide</span>
              </Link>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl text-ink">
              You cut the clip. They run the page. Both get paid per view.
            </h1>

            <p className="max-w-xl text-base sm:text-lg text-ink">
              Page owners post raw footage and a per-1K view rate. Video editors send
              finished vertical cuts in under 2 minutes. When your clip gets picked
              and posted, you earn cash as the views roll in.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/campaigns" className="btn-sticker btn-primary">
                <span>Browse Open Campaigns</span>
                <ArrowRight weight="bold" className="h-5 w-5" />
              </Link>
              <Link href="/holder/campaigns/new" className="btn-sticker btn-secondary">
                <span>Post a Campaign for My Page</span>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-extrabold text-ink">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle weight="bold" className="h-4 w-4 text-forest" />
                Watermarked until picked
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle weight="bold" className="h-4 w-4 text-forest" />
                72h posting deadline
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle weight="bold" className="h-4 w-4 text-forest" />
                No payout form at signup
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Pay Estimator Card */}
          <div className="lg:col-span-5">
            <div className="card-sticker bg-paper p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-forest">
                    Quick Pay Math
                  </span>
                  <h2 className="font-display text-2xl font-bold text-ink">
                    See What a Clip Pays
                  </h2>
                </div>
                <ClappyMascot variant="wave" size={60} />
              </div>

              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-xs font-semibold text-ink">
                    <label htmlFor="hero-sim-views" className="text-muted">Views in 30 days</label>
                    <span className="tabular-nums font-bold text-ink">
                      {simViews.toLocaleString()} views
                    </span>
                  </div>
                  <input
                    id="hero-sim-views"
                    type="range"
                    min={1000}
                    max={60000}
                    step={1000}
                    value={simViews}
                    onChange={(e) => setSimViews(Number(e.target.value))}
                    className="w-full accent-forest cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="hero-sim-rate"
                      className="mb-1 block text-xs font-semibold text-muted"
                    >
                      Rate per 1K views ($)
                    </label>
                    <input
                      id="hero-sim-rate"
                      type="number"
                      step="0.25"
                      min="0.5"
                      max="10"
                      value={simRateDollars}
                      onChange={(e) => setSimRateDollars(Number(e.target.value))}
                      className="input-sticker tabular-nums"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="hero-sim-base"
                      className="mb-1 block text-xs font-semibold text-muted"
                    >
                      Base fee on pick ($)
                    </label>
                    <input
                      id="hero-sim-base"
                      type="number"
                      step="1"
                      min="0"
                      max="50"
                      value={simBaseDollars}
                      onChange={(e) => setSimBaseDollars(Number(e.target.value))}
                      className="input-sticker tabular-nums"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-sprout/20 p-4 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-forest">
                    Your Clip Pay
                  </span>
                  <span className="text-xs font-medium text-muted">
                    ${simBaseDollars.toFixed(2)} base + ${simViewBonus.toFixed(2)} view
                    pay
                  </span>
                </div>
                <span className="font-display text-3xl font-bold text-ink tabular-nums">
                  ${simTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Flow */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
          How whap Works
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="card-sticker p-6 space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-sky/20 text-ink shadow-sm">
              <UploadSimple weight="bold" className="h-6 w-6 text-ink" />
            </div>
            <h3 className="text-lg font-bold text-ink">
              1. Pick a brief &amp; send your cut
            </h3>
            <p className="text-sm text-muted">
              Grab raw podcast or gaming footage, edit a vertical clip, and upload
              an MP4/MOV or paste a Drive link. Your preview stays watermarked.
            </p>
          </div>

          <div className="card-sticker p-6 space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-sun/30 text-ink shadow-sm">
              <Broadcast weight="bold" className="h-6 w-6 text-ink" />
            </div>
            <h3 className="text-lg font-bold text-ink">
              2. Page owner picks &amp; posts in 72h
            </h3>
            <p className="text-sm text-muted">
              When the Account Holder taps Select, your rate is locked in and they
              get the clean file to post on their page within 72 hours.
            </p>
          </div>

          <div className="card-sticker p-6 space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-sprout/20 text-ink shadow-sm">
              <Coins weight="bold" className="h-6 w-6 text-forest" />
            </div>
            <h3 className="text-lg font-bold text-ink">
              3. Views are logged &amp; you cash out
            </h3>
            <p className="text-sm text-muted">
              Every 7 days the page owner posts a view count + screenshot. Once your
              balance hits $10, request a payout to GCash, PayPal, or bank.
            </p>
          </div>
        </div>
      </section>

      {/* Open Campaigns Grid */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              Open Clipping Campaigns
            </h2>
            <p className="text-sm text-muted">
              Browse logged out. You only sign in when you are ready to submit.
            </p>
          </div>
          <Link href="/campaigns" className="btn-sticker btn-secondary text-sm">
            <span>See All ({db.campaigns.length})</span>
            <ArrowRight weight="bold" className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {openCampaigns.map((camp) => {
            const owner = db.profiles.find((p) => p.id === camp.owner_id);
            return (
              <CampaignCard
                key={camp.id}
                campaign={camp}
                submissions={db.submissions}
                ownerHandle={owner?.username}
              />
            );
          })}
        </div>
      </section>

      {/* Bottom Callout */}
      <section className="card-sticker bg-mint p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <ClappyMascot variant="celebrate" size={72} className="shrink-0" />
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-bold text-ink">
              Ready to send your first clip?
            </h2>
            <p className="text-sm text-muted">
              One screen to join: pick your name and role. Takes 20 seconds.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAuthModalOpen(true)}
          className="btn-sticker btn-primary shrink-0"
        >
          <ShieldCheck weight="bold" className="h-5 w-5" />
          <span>Join whap in 1 Step</span>
        </button>
      </section>
    </div>
  );
}
