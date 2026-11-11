'use client';

import React, { useState } from 'react';
import { CheckCircle, UserCircle } from '@phosphor-icons/react';
import { useWhap } from '@/context/WhapContext';

export default function EditorProfilePage() {
  const { db, currentUser, updateEditorProfile } = useWhap();

  const editorId = currentUser?.id || 'editor-1';
  const editor =
    db.profiles.find((p) => p.id === editorId) || db.profiles[2];

  const [displayName, setDisplayName] = useState(editor.display_name);
  const [bio, setBio] = useState(editor.bio);
  const [nichesText, setNichesText] = useState(editor.niches.join(', '));
  const [portfolioUrl, setPortfolioUrl] = useState(editor.portfolio_url);
  const [samplesText, setSamplesText] = useState(
    editor.sample_clip_urls.join('\n')
  );
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateEditorProfile({
      display_name: displayName,
      bio,
      niches: nichesText
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean),
      portfolio_url: portfolioUrl,
      sample_clip_urls: samplesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <div>
        <span className="chip-sticker bg-mint text-ink">
          <UserCircle weight="bold" className="h-4 w-4" />
          <span>Optional Profile Details</span>
        </span>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl text-ink">
          Editor Profile Settings
        </h1>
        <p className="mt-1 text-sm text-muted">
          Portfolio links, niches, and sample clips are optional. Add them whenever
          you want to show page owners your editing style.
        </p>
      </div>

      {savedToast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-sprout/20 p-4 text-sm font-semibold text-ink shadow-sm">
          <CheckCircle weight="bold" className="h-5 w-5 text-forest" />
          <span>Profile updated!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="card-sticker p-6 space-y-5">
        <div>
          <label
            htmlFor="prof-display-name"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Display name
          </label>
          <input
            id="prof-display-name"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input-sticker"
          />
        </div>

        <div>
          <label
            htmlFor="prof-bio"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Short bio (optional)
          </label>
          <textarea
            id="prof-bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="input-sticker"
          />
        </div>

        <div>
          <label
            htmlFor="prof-niches"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Niches you edit (comma separated, optional)
          </label>
          <input
            id="prof-niches"
            type="text"
            value={nichesText}
            onChange={(e) => setNichesText(e.target.value)}
            className="input-sticker"
          />
        </div>

        <div>
          <label
            htmlFor="prof-portfolio"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Portfolio website link (optional)
          </label>
          <input
            id="prof-portfolio"
            type="url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            className="input-sticker"
          />
        </div>

        <div>
          <label
            htmlFor="prof-samples"
            className="mb-1.5 block text-sm font-extrabold text-ink"
          >
            Sample clip links (one URL per line, optional)
          </label>
          <textarea
            id="prof-samples"
            rows={3}
            value={samplesText}
            onChange={(e) => setSamplesText(e.target.value)}
            className="input-sticker"
          />
        </div>

        <button type="submit" className="btn-sticker btn-primary">
          <CheckCircle weight="bold" className="h-5 w-5" />
          <span>Save Profile</span>
        </button>
      </form>
    </div>
  );
}
