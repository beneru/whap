import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import { ClappyMascot } from '@/components/ClappyMascot';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-12">
      <div className="card-sticker bg-mint p-8 text-center space-y-4">
        <div className="flex justify-center">
          <ClappyMascot variant="lost" size={100} />
        </div>
        <h1 className="font-display text-3xl font-bold text-ink">
          This clip reel went missing
        </h1>
        <p className="text-sm text-muted">
          We looked everywhere in the editing bay, but that page does not exist.
        </p>
        <div className="pt-2">
          <Link href="/campaigns" className="btn-sticker btn-primary">
            <ArrowLeft weight="bold" className="h-5 w-5" />
            <span>Back to Open Campaigns</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
