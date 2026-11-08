'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from '@phosphor-icons/react';
import { useWhap } from '@/context/WhapContext';
import { CampaignForm } from '@/components/CampaignForm';

export default function EditCampaignPage() {
  const params = useParams<{ id: string }>();
  const { db } = useWhap();
  const campaign = db.campaigns.find((c) => c.id === params.id);

  if (!campaign) {
    return (
      <div className="py-10 text-center space-y-4">
        <h1 className="font-display text-3xl text-ink">Campaign not found</h1>
        <Link href="/holder" className="btn-sticker btn-primary">
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <Link
        href={`/campaigns/${campaign.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-extrabold text-forest hover:underline"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" />
        <span>Back to Campaign</span>
      </Link>

      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink">
          Edit: {campaign.title}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Clips you already picked keep their locked-in pay rate.
        </p>
      </div>

      <CampaignForm existingCampaign={campaign} />
    </div>
  );
}
