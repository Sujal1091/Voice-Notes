import React, { useState } from 'react';
import {
  X, Sparkles, ArrowRight, Clock, List, CheckCircle2,
  Calendar, MapPin, User, Tag, ChevronUp, ChevronDown,
  ThumbsUp, ThumbsDown, Copy, Globe
} from 'lucide-react';

const TRANSLATION_LANGS = [
  { value: 'en-US', label: 'English' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'ja-JP', label: 'Japanese' },
];

const AiSummaryCard = ({ data, onClose, darkMode = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [copied, setCopied] = useState(false);
  const [translationLang, setTranslationLang] = useState('en-US');

  if (!data) return null;

  const handleCopy = () => {
    const text = `${data.title}\n\nTL;DR: ${data.tldr}\n\n${data.summary}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-700">

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50/60 to-white dark:from-indigo-900/20 dark:to-slate-900 p-5 border-b border-gray-100 dark:border-slate-700 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/70 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-wrap justify-between items-start mb-3 pr-10 gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded-lg shadow-sm shadow-indigo-200">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">AI Analysis</span>
          </div>

          {/* Translation picker */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1 shadow-sm">
            <Globe className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={translationLang}
              onChange={e => setTranslationLang(e.target.value)}
              className="text-xs font-medium text-gray-600 dark:text-slate-300 bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
            >
              {TRANSLATION_LANGS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-2 pr-8">{data.title}</h2>

        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {data.readingTime}
          </div>
          {data.confidence && (
            <div className="flex items-center gap-1.5" title="AI Confidence Score">
              <div className="w-16 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${data.confidence}%` }} />
              </div>
              <span>{data.confidence}% confidence</span>
            </div>
          )}
        </div>
      </div>

      {/* TL;DR */}
      <div className="p-5 bg-indigo-50/30 dark:bg-indigo-900/10 border-b border-indigo-50 dark:border-indigo-900/30">
        <div className="flex gap-3">
          <ArrowRight className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wide mb-1">TL;DR</h3>
            <p className="text-gray-800 dark:text-slate-200 text-sm leading-relaxed font-medium">
              {translationLang !== 'en-US' ? '[Translated] ' : ''}{data.tldr}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="max-h-[55vh] overflow-y-auto">
        <div className="p-6 space-y-6">

          {/* Entities */}
          {(data.entities?.people?.length > 0 || data.entities?.dates?.length > 0 || data.entities?.locations?.length > 0) && (
            <section className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Detected Entities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {data.entities.people?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 text-indigo-600">
                      <User className="w-3.5 h-3.5" /><span className="text-xs font-bold">People</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {data.entities.people.map((p, i) => (
                        <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
                {data.entities.dates?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 text-emerald-600">
                      <Calendar className="w-3.5 h-3.5" /><span className="text-xs font-bold">Dates</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {data.entities.dates.map((d, i) => (
                        <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100">{d}</span>
                      ))}
                    </div>
                  </div>
                )}
                {data.entities.locations?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 text-amber-600">
                      <MapPin className="w-3.5 h-3.5" /><span className="text-xs font-bold">Locations</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {data.entities.locations.map((l, i) => (
                        <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100">{l}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Key Takeaways */}
          {data.keyPoints?.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
                <List className="w-4 h-4 text-gray-500" /> Key Takeaways
              </h3>
              <ul className="space-y-2">
                {data.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Action Items */}
          {data.actionItems?.length > 0 && (
            <section className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <CheckCircle2 className="w-4 h-4 text-gray-500" /> Action Items
                </h3>
                <span className="text-xs bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400">
                  {data.actionItems.length} detected
                </span>
              </div>
              <div className="space-y-2">
                {data.actionItems.map((item) => (
                  <label key={item.id} className="flex items-start gap-3 p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={item.status === 'done'}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className={`text-sm ${item.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-slate-200'}`}>
                        {item.text}
                      </p>
                      {item.owner && (
                        <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                          {item.owner}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Full Summary */}
          {isExpanded && data.summary && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Full Summary</h3>
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-7 text-justify">{data.summary}</p>
            </section>
          )}

          {/* Tags */}
          {data.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {data.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-md text-xs font-medium">
                  <Tag className="w-3 h-3" />{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 dark:bg-slate-800/60 p-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-sm">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white font-medium transition-colors"
        >
          {isExpanded ? <><span>Show Less</span><ChevronUp className="w-4 h-4" /></> : <><span>Show Full Details</span><ChevronDown className="w-4 h-4" /></>}
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 p-0.5 shadow-sm">
            <button onClick={() => setFeedback('up')} className={`p-1.5 rounded-md transition-colors ${feedback === 'up' ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-slate-600'}`}>
              <ThumbsUp className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-gray-200 dark:bg-slate-600 mx-0.5" />
            <button onClick={() => setFeedback('down')} className={`p-1.5 rounded-md transition-colors ${feedback === 'down' ? 'text-rose-600 bg-rose-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-slate-600'}`}>
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
          <div className="h-4 w-px bg-gray-300 dark:bg-slate-600 mx-1" />
          <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-all font-medium text-xs">
            {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiSummaryCard;
