'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useWhap } from '@/context/WhapContext';
import { CampaignForm } from '@/components/CampaignForm';

export default function EditCampaignPage() {
  const params = useParams<{ id: string }>();
  const { db } = useWhap();
  const campaign = db.campaigns.find((c) => c.id === params.id);

  if (!campaign) {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface p-8 text-center">
        <p className="text-sm font-bold text-white">Campaign not found</p>
        <Link href="/holder" className="mt-2 inline-block text-xs text-tally-bright">
          Back to Holder Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link
        href={`/campaigns/${campaign.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Campaign
      </Link>
      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-tally-bright">
          Edit Campaign Settings &amp; Status
        </span>
        <h1 className="mt-1 text-2xl font-extrabold text-white">Edit: {campaign.title}</h1>
      </div>
      <CampaignForm existingCampaign={campaign} />
    </div>
  );
}
