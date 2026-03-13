import React, { useState } from 'react';
import {
  Play, Square, Clock, Sparkles, MoreVertical,
  Edit, Languages, Copy, Download, Share2, Trash2,
  Pin, PinOff, Check, Tag, X, FileText
} from 'lucide-react';
import AiSummaryCard from './AiSummaryCard.jsx';

const CATEGORIES = [
  { id: 'personal', name: 'Personal', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { id: 'work',     name: 'Work',     color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  { id: 'ideas',    name: 'Ideas',    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  
];

// Reusable dropdown menu — always fully visible, delete always shown
const NoteMenu = ({ note, copiedId, onEdit, onTranslate, onCopy, onExport, onShare, onDelete, onClose }) => (
  <div className="w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl flex flex-col overflow-hidden">
    <div className="flex flex-col">
      <button className="menu-item" onClick={() => { onEdit(note); onClose?.(); }}>
        <Edit className="w-4 h-4 flex-shrink-0" /> Edit
      </button>
      <button className="menu-item" onClick={() => { onTranslate(note); onClose?.(); }}>
        <Languages className="w-4 h-4 flex-shrink-0" /> Translate
      </button>
      <button className="menu-item" onClick={() => { onCopy(note.text, note.id); onClose?.(); }}>
        {copiedId === note.id
          ? <><Check className="w-4 h-4 flex-shrink-0 text-green-500" /> Copied!</>
          : <><Copy className="w-4 h-4 flex-shrink-0" /> Copy</>
        }
      </button>
      <button className="menu-item" onClick={() => { onExport(note); onClose?.(); }}>
        <Download className="w-4 h-4 flex-shrink-0" /> Download
      </button>
      <button className="menu-item" onClick={() => { onShare(note); onClose?.(); }}>
        <Share2 className="w-4 h-4 flex-shrink-0" /> Share
      </button>
    </div>
    {/* Divider + Delete always pinned at bottom, never hidden */}
    <div className="h-px bg-slate-100 dark:bg-slate-700 mx-2" />
    <button
      className="menu-item text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
      onClick={() => { onDelete(note.id); onClose?.(); }}
    >
      <Trash2 className="w-4 h-4 flex-shrink-0" /> Delete
    </button>
  </div>
);

// ── NOTE DETAIL MODAL ────────────────────────────────────────────────────────
const NoteDetailModal = ({
  note, onClose, isPlaying, audioLoading, onPlay,
  copiedId, onEdit, onTranslate, onCopy, onExport, onShare, onDelete, onPin,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const categoryMeta = CATEGORIES.find(c => c.id === note.category);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col"
        style={{ maxHeight: '90vh', animation: 'noteModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          @keyframes noteModalIn {
            from { opacity: 0; transform: scale(0.93) translateY(14px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 flex-shrink-0 rounded-t-2xl" />

        {/* Header — fixed, never scrolls */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 flex-shrink-0">
          <div className="flex flex-col gap-1.5 min-w-0">
            {categoryMeta && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider w-fit ${categoryMeta.color}`}>
                {categoryMeta.name}
              </span>
            )}
            <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
              {note.title || 'Untitled Note'}
            </h2>
            <div className="flex items-center text-xs text-slate-400 gap-1">
              <Clock className="w-3 h-3" /> {note.date}
            </div>
          </div>

          {/* Header action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
            {/* Pin */}
            <button
              onClick={() => onPin(note.id, note.pinned)}
              title={note.pinned ? 'Unpin' : 'Pin'}
              className={`p-1.5 rounded-full transition-colors ${
                note.pinned
                  ? 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                  : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {note.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>

            {/* 3-dot menu — self-contained with local menuOpen state */}
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-9 z-50"
                  onClick={e => e.stopPropagation()}
                >
                  <NoteMenu
                    note={note}
                    copiedId={copiedId}
                    onEdit={(n) => { onEdit(n); onClose(); }}
                    onTranslate={onTranslate}
                    onCopy={onCopy}
                    onExport={onExport}
                    onShare={onShare}
                    onDelete={(id) => { onDelete(id); onClose(); }}
                    onClose={() => setMenuOpen(false)}
                  />
                </div>
              )}
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
            {note.text}
          </p>

          {/* Tags */}
          {(note.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {note.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full font-medium">
                  <Tag className="w-2.5 h-2.5" />{tag}
                </span>
              ))}
            </div>
          )}

          {/* AI Summary */}
          {note.summary && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5" /> AI Summary
              </div>
              <p className="text-sm text-indigo-800 dark:text-indigo-200 whitespace-pre-line leading-relaxed">
                {note.summary}
              </p>
            </div>
          )}
        </div>

        {/* Footer — fixed, never scrolls */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex justify-end flex-shrink-0 rounded-b-2xl">
          <button
            onClick={() => onPlay(note.text, note.id)}
            disabled={audioLoading === note.id}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-indigo-200 dark:shadow-indigo-900"
          >
            {audioLoading === note.id ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
            ) : isPlaying === note.id ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            {isPlaying === note.id ? 'Stop' : 'Read Aloud'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── NOTE CARD ────────────────────────────────────────────────────────────────
const NoteCard = ({
  note,
  isPlaying,
  audioLoading,
  isSummarizing,
  copiedId,
  openMenuId,
  darkMode,
  onPlay,
  onToggleMenu,
  onEdit,
  onTranslate,
  onCopy,
  onExport,
  onShare,
  onDelete,
  onPin,
  onSummarize,
  onTagAdd,
  onTagRemove,
}) => {
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showAiCard, setShowAiCard] = useState(false);

  const categoryMeta = CATEGORIES.find(c => c.id === note.category);

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      onTagAdd(note.id, tagInput.trim());
      setTagInput('');
      setShowTagInput(false);
    }
    if (e.key === 'Escape') { setShowTagInput(false); setTagInput(''); }
  };

  const handleSummarizeAndShow = async (e) => {
    e.stopPropagation();
    if (!note.summary) {
      await onSummarize(note.id, note.text);
    }
    setShowAiCard(true);
  };

  const handleViewAiCard = (e) => {
    e.stopPropagation();
    setShowAiCard(true);
  };

  const buildAiCardData = () => {
    if (!note.summary) return null;
    const lines = note.summary.split('\n').filter(l => l.trim());
    return {
      title: note.title || 'Untitled Note',
      tldr: lines[0] || note.summary,
      summary: note.summary,
      readingTime: `~${Math.max(1, Math.ceil((note.text?.split(' ').length || 0) / 200))} min read`,
      confidence: 92,
      keyPoints: lines,
      actionItems: [],
      entities: { people: [], dates: [], locations: [] },
      tags: note.tags || [],
    };
  };

  return (
    <>
      {/* ── CARD ────────────────────────────────────────────────── */}
      <div
        onClick={() => setShowDetail(true)}
        className={`group relative bg-white dark:bg-slate-800 rounded-2xl border transition-all duration-200
          hover:shadow-xl hover:-translate-y-1 cursor-pointer active:scale-[0.99]
          ${note.pinned
            ? 'border-indigo-300 dark:border-indigo-600 shadow-md shadow-indigo-100 dark:shadow-indigo-900/30'
            : 'border-slate-100 dark:border-slate-700 shadow-sm'
          }
          flex flex-col h-full overflow-hidden
        `}
      >
        {note.pinned && (
          <div className="h-0.5 w-full bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400" />
        )}

        <div className="p-5 flex flex-col h-full gap-3">

          {/* TOP ROW */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {categoryMeta && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${categoryMeta.color}`}>
                    {categoryMeta.name}
                  </span>
                )}
                {note.pinned && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center gap-1">
                    <Pin className="w-2.5 h-2.5" /> Pinned
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white leading-tight text-sm line-clamp-2">
                {note.title || 'Untitled Note'}
              </h3>
              <div className="flex items-center text-xs text-slate-400 gap-1">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span>{note.date}</span>
              </div>
            </div>

            {/* Card action buttons */}
            <div
              className="flex items-center gap-0.5 flex-shrink-0 relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Pin */}
              <button
                onClick={() => onPin(note.id, note.pinned)}
                title={note.pinned ? 'Unpin' : 'Pin'}
                className={`p-1.5 rounded-full transition-colors ${
                  note.pinned
                    ? 'text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                    : 'text-slate-300 hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100'
                }`}
              >
                {note.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </button>

              {/* Play */}
              <button
                onClick={() => onPlay(note.text, note.id)}
                disabled={audioLoading === note.id}
                title="Read aloud"
                className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                {audioLoading === note.id ? (
                  <span className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin block" />
                ) : isPlaying === note.id ? (
                  <Square className="w-3.5 h-3.5 fill-current text-indigo-500" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
              </button>

              {/* 3-dot */}
              <button
                onClick={() => onToggleMenu(note.id)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {/* Card dropdown — NoteMenu component, delete always visible */}
              {openMenuId === note.id && (
                <div
                  className="absolute right-0 top-8 z-30"
                  style={{ animation: 'noteModalIn 0.15s ease' }}
                >
                  <NoteMenu
                    note={note}
                    copiedId={copiedId}
                    onEdit={onEdit}
                    onTranslate={onTranslate}
                    onCopy={onCopy}
                    onExport={onExport}
                    onShare={onShare}
                    onDelete={onDelete}
                    onClose={() => onToggleMenu(null)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* NOTE TEXT */}
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 flex-1">
            {note.text}
          </p>

          {/* TAGS */}
          <div className="flex flex-wrap gap-1.5 items-center" onClick={e => e.stopPropagation()}>
            {(note.tags || []).map(tag => (
              <span key={tag} className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full font-medium group/tag">
                <Tag className="w-2.5 h-2.5" />
                {tag}
                <button
                  onClick={() => onTagRemove(note.id, tag)}
                  className="ml-0.5 opacity-0 group-hover/tag:opacity-100 hover:text-red-500 transition-opacity leading-none"
                >×</button>
              </span>
            ))}
            {showTagInput ? (
              <input
                autoFocus
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => { setShowTagInput(false); setTagInput(''); }}
                placeholder="tag name…"
                className="text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full outline-none w-20 text-slate-600 dark:text-slate-300"
              />
            ) : (
              <button
                onClick={() => setShowTagInput(true)}
                className="text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                + tag
              </button>
            )}
          </div>

          {/* AI SUMMARY */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 mt-auto" onClick={e => e.stopPropagation()}>
            {note.summary ? (
              <button
                onClick={handleViewAiCard}
                className="w-full py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/60 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> View AI Summary
              </button>
            ) : (
              <button
                onClick={handleSummarizeAndShow}
                disabled={isSummarizing === note.id}
                className="w-full py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {isSummarizing === note.id ? (
                  <><span className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin block" /> Generating…</>
                ) : (
                  <><Sparkles className="w-3 h-3" /> Summarize with AI</>
                )}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ── NOTE DETAIL MODAL ── */}
      {showDetail && (
        <NoteDetailModal
          note={note}
          onClose={() => setShowDetail(false)}
          isPlaying={isPlaying}
          audioLoading={audioLoading}
          onPlay={onPlay}
          copiedId={copiedId}
          onEdit={onEdit}
          onTranslate={onTranslate}
          onCopy={onCopy}
          onExport={onExport}
          onShare={onShare}
          onDelete={onDelete}
          onPin={onPin}
        />
      )}

      {/* ── AI SUMMARY POPUP ── */}
      {showAiCard && buildAiCardData() && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowAiCard(false)}
        >
          <div onClick={e => e.stopPropagation()}>
            <AiSummaryCard
              data={buildAiCardData()}
              onClose={() => setShowAiCard(false)}
              darkMode={darkMode}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default NoteCard;