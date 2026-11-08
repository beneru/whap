'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react';
import { CampaignForm } from '@/components/CampaignForm';

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <Link
        href="/holder"
        className="inline-flex items-center gap-1.5 text-sm font-extrabold text-forest hover:underline"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" />
        <span>Back to Dashboard</span>
      </Link>

      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink">
          Create Clipping Campaign
        </h1>
        <p className="mt-1 text-sm text-muted">
          Add your raw footage links, format rules, and per-1K view rate so editors
          can start sending cuts.
        </p>
      </div>

      <CampaignForm />
    </div>
  );
}
