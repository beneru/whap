'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CampaignForm } from '@/components/CampaignForm';

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link
        href="/holder"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Holder Dashboard
      </Link>
      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-tally-bright">
          Account Holder Campaign Builder
        </span>
        <h1 className="mt-1 text-2xl font-extrabold text-white">Create Clipping Campaign</h1>
      </div>
      <CampaignForm />
    </div>
  );
}
