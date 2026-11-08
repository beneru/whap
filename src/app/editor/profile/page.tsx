'use client';

import React, { useState } from 'react';
import { CheckCircle2, User } from 'lucide-react';
import { useWhap } from '@/context/WhapContext';

export default function EditorProfilePage() {
  const { currentUser, openAuthModal, updateProfile } = useWhap();

  const [displayName, setDisplayName] = useState(currentUser?.display_name || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [nichesInput, setNichesInput] = useState(currentUser?.niches.join(', ') || '');
  const [portfolioUrl, setPortfolioUrl] = useState(currentUser?.portfolio_url || '');
  const [samplesInput, setSamplesInput] = useState(
    currentUser?.sample_clip_urls.join('\n') || ''
  );
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface p-8 text-center">
        <button
          type="button"
          onClick={() => openAuthModal('/editor/profile')}
          className="rounded-xl bg-tally px-4 py-2 text-xs font-bold text-zinc-950"
        >
          Sign In to Edit Profile
        </button>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSavedMsg(null);
    try {
      const niches = nichesInput
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean);
      const sample_clip_urls = samplesInput
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean);

      updateProfile({
        display_name: displayName,
        username,
        bio,
        niches,
        portfolio_url: portfolioUrl.trim(),
        sample_clip_urls,
      });
      setSavedMsg('Profile updated! Portfolio, niches, and sample clips saved.');
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="border-b border-white/10 pb-4">
        <span className="font-mono text-xs uppercase tracking-widest text-tally-bright">
          Optional Portfolio &amp; Creator Identity
        </span>
        <h1 className="mt-1 text-2xl font-extrabold text-white">Editor Profile Settings</h1>
        <p className="mt-1 text-xs text-zinc-400">
          Your @username is used on dynamic anti-theft watermarks before an Account Holder selects your clip. Portfolio, niches, and sample clips are optional.
        </p>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3.5 text-xs text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{savedMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-3.5 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-white/10 bg-surface p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300">Display Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3.5 py-2.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-300">
              Username (Watermark Handle)
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3.5 py-2.5 font-mono text-xs text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300">Bio (Optional)</label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Your editing style, NLE (Premiere/After Effects/CapCut Pro), turnaround speed..."
            className="mt-1 w-full rounded-xl border border-white/10 bg-inset p-3 text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300">
            Niches (Optional, comma-separated)
          </label>
          <input
            type="text"
            value={nichesInput}
            onChange={(e) => setNichesInput(e.target.value)}
            placeholder="Podcasts, AI & Tech, Gaming, Finance"
            className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3.5 py-2.5 text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300">
            Portfolio URL (Optional)
          </label>
          <input
            type="url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
            className="mt-1 w-full rounded-xl border border-white/10 bg-inset px-3.5 py-2.5 font-mono text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300">
            Sample Clip URLs (Optional, one URL per line)
          </label>
          <textarea
            rows={3}
            value={samplesInput}
            onChange={(e) => setSamplesInput(e.target.value)}
            placeholder="https://storage.whap.app/samples/sample-1.mp4"
            className="mt-1 w-full rounded-xl border border-white/10 bg-inset p-3 font-mono text-xs text-white"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-tally py-3 text-xs font-extrabold text-zinc-950 hover:bg-tally-bright"
        >
          Save Editor Profile
        </button>
      </form>
    </div>
  );
}
