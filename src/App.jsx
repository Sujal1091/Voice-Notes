import React, { useState, useEffect, useRef } from 'react';
import Preloader from './components/Preloader.jsx';
import NoteCard from './components/NoteCard.jsx';
import EmptyState from './components/EmptyState.jsx';
import AiSummaryCard from './components/AiSummaryCard.jsx';
import {
  Mic, Square, Save, Trash2, FileText, Clock,
  AlertCircle, Moon, Sun, Search, Sparkles, LogOut,
  Edit, Languages, FolderPlus, Folder, FolderOpen,
  X, Check, Plus, Pin
} from 'lucide-react';
import {
  collection, addDoc, deleteDoc, doc, onSnapshot,
  query, where, orderBy, serverTimestamp, updateDoc
} from 'firebase/firestore';
import './App.css';
import Snowfall from 'react-snowfall';
import Login from './components/login';
import Signup from './components/Signup';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './config/firebase.js';
import { db } from './config/firebase.js';
import { model } from './config/gemini.js';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'zh-CN', name: 'Chinese (Mandarin)' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'pt-PT', name: 'Portuguese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'nl-NL', name: 'Dutch' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'de-DE', name: 'German' },
];

const CATEGORIES = [
  { id: 'personal', name: 'Personal', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { id: 'work',     name: 'Work',     color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  { id: 'ideas',    name: 'Ideas',    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
];

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────

const ConfirmDialog = ({ title, message, onConfirm, onCancel }) => (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    onClick={onCancel}
  >
    <div
      className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
      onClick={e => e.stopPropagation()}
      style={{ animation: 'confirmIn 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
    >
      <style>{`
        @keyframes confirmIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div className="p-6">
        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-white text-center mb-2">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed">{message}</p>
      </div>
      <div className="flex border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={onCancel}
          className="flex-1 py-3.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <div className="w-px bg-slate-100 dark:bg-slate-800" />
        <button
          onClick={onConfirm}
          className="flex-1 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function VoiceNotesDashboard({ user, onLogout }) {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');

  // Notes data
  const [savedNotes, setSavedNotes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('personal');

  // Folders
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null); // null = All Notes
  const [selectedFolder, setSelectedFolder] = useState(''); // for saving
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [selectedNoteFolder, setSelectedNoteFolder] = useState(''); // for save

  // UI
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [editingNote, setEditingNote] = useState(null);

  // AI / audio state
  const [isPlaying, setIsPlaying] = useState(null);
  const [audioLoading, setAudioLoading] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(null);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [aiCardData, setAiCardData] = useState(null);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Refs
  const recognitionRef = useRef(null);
  const isIntentionalStop = useRef(false);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const noteRef = useRef('');

  useEffect(() => { noteRef.current = currentNote; }, [currentNote]);

  // ── FIRESTORE: notes ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notes'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setSavedNotes(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        date: d.data().createdAt?.toDate().toLocaleString() || new Date().toLocaleString(),
      })));
    }, err => setError('Failed to load notes: ' + err.message));
    return unsub;
  }, [user]);

  // ── FIRESTORE: folders ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'folders'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));
      setFolders(data);
    }, err => setError('Failed to load folders: ' + err.message));
    return unsub;
  }, [user]);

  // ── THEME ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('voice_notes_theme');
    if (stored === 'dark') setDarkMode(true);
    return () => { stopRecordingCleanup(); window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('voice_notes_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Close menus on outside click
  useEffect(() => {
    const handler = () => { setOpenMenuId(null); setIsLangMenuOpen(false); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // ── AUDIO VISUALIZER ─────────────────────────────────────────────────────
  const startVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      drawVisualizer();
    } catch (err) { console.warn('Visualizer failed:', err); }
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const ctx = canvasRef.current.getContext('2d');
    const { width, height } = canvasRef.current;
    const barColor = darkMode ? '129, 140, 248' : '79, 70, 229';
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, width, height);
      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        ctx.fillStyle = `rgba(${barColor}, ${barHeight / 100})`;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    sourceRef.current?.disconnect();
    if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close();
  };

  const stopRecordingCleanup = () => {
    isIntentionalStop.current = true;
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    stopVisualizer();
    setIsRecording(false);
  };

  // ── RECORDING ─────────────────────────────────────────────────────────────
  const startRecording = () => {
    setError(null);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setError('Speech recognition is not supported in this browser.'); return; }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language || 'en-US';

    recognition.onstart = () => { isIntentionalStop.current = false; setIsRecording(true); startVisualizer(); };
    recognition.onresult = (event) => {
      let finalText = '', interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        event.results[i].isFinal ? (finalText += t + ' ') : (interimText += t);
      }
      if (finalText) setCurrentNote(prev => prev + finalText);
      setInterimTranscript(interimText);
    };
    recognition.onerror = (e) => { if (!['no-speech', 'aborted'].includes(e.error)) setError('Recording error: ' + e.error); };
    recognition.onend = () => {
      if (!isIntentionalStop.current) recognition.start();
      else stopRecordingCleanup();
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const toggleRecording = () => isRecording ? stopRecordingCleanup() : startRecording();

  // ── NOTE ACTIONS ──────────────────────────────────────────────────────────
  const saveNote = async () => {
    const text = currentNote.trim();
    if (!text) return;
    try {
      let finalTitle = noteTitle.trim();
      if (!finalTitle) {
        const words = text.split(' ');
        finalTitle = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
      }
      await addDoc(collection(db, 'notes'), {
        text,
        title: finalTitle,
        category: selectedCategory,
        folder: selectedNoteFolder || null,
        userId: user.uid,
        createdAt: serverTimestamp(),
        summary: null,
        pinned: false,
        tags: [],
      });
      setCurrentNote('');
      setNoteTitle('');
      setSelectedNoteFolder('');
    } catch (err) {
      setError('Failed to save note: ' + err.message);
    }
  };

  const confirmDeleteNote = (id) => {
    const note = savedNotes.find(n => n.id === id);
    setConfirmDialog({
      title: 'Delete Note',
      message: `Are you sure you want to delete "${note?.title || 'Untitled Note'}"? This cannot be undone.`,
      onConfirm: async () => {
        try { await deleteDoc(doc(db, 'notes', id)); }
        catch (err) { setError('Failed to delete note.'); }
        setConfirmDialog(null);
      },
    });
  };
  const deleteNote = confirmDeleteNote;

  const handleEdit = (note) => { setEditingNote(note); setOpenMenuId(null); };

  const handleUpdateNote = async () => {
    if (!editingNote) return;
    try {
      await updateDoc(doc(db, 'notes', editingNote.id), {
        title: editingNote.title,
        text: editingNote.text,
        category: editingNote.category,
        folder: editingNote.folder ?? null,
        updatedAt: serverTimestamp(),
      });
      setEditingNote(null);
    } catch (err) { setError('Failed to update note.'); }
  };

  const handlePin = async (id, currentlyPinned) => {
    try { await updateDoc(doc(db, 'notes', id), { pinned: !currentlyPinned }); }
    catch (err) { setError('Failed to pin note.'); }
  };

  const handleTagAdd = async (id, tag) => {
    const note = savedNotes.find(n => n.id === id);
    if (!note) return;
    const existingTags = note.tags || [];
    if (existingTags.includes(tag)) return;
    try { await updateDoc(doc(db, 'notes', id), { tags: [...existingTags, tag] }); }
    catch (err) { setError('Failed to add tag.'); }
  };

  const handleTagRemove = async (id, tag) => {
    const note = savedNotes.find(n => n.id === id);
    if (!note) return;
    try { await updateDoc(doc(db, 'notes', id), { tags: (note.tags || []).filter(t => t !== tag) }); }
    catch (err) { setError('Failed to remove tag.'); }
  };

  // ── FOLDERS ───────────────────────────────────────────────────────────────
  const createFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      await addDoc(collection(db, 'folders'), { name, userId: user.uid, createdAt: serverTimestamp() });
      setNewFolderName('');
      setShowNewFolderInput(false);
    } catch (err) { setError('Failed to create folder.'); }
  };

  const deleteFolder = (id) => {
    const folder = folders.find(f => f.id === id);
    setConfirmDialog({
      title: 'Delete Folder',
      message: `Delete folder "${folder?.name}"? Notes inside will not be deleted, just unassigned.`,
      onConfirm: async () => {
        try { await deleteDoc(doc(db, 'folders', id)); if (activeFolder === id) setActiveFolder(null); }
        catch (err) { setError('Failed to delete folder.'); }
        setConfirmDialog(null);
      },
    });
  };

  // ── TRANSLATE ─────────────────────────────────────────────────────────────
  const handleTranslate = async (note) => {
    const targetLang = language.split('-')[0];
    if (!window.confirm(`Translate this note to ${LANGUAGES.find(l => l.code === language)?.name}?`)) return;
    try {
      const translateText = async (text) => {
        if (!text) return '';
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${targetLang}`);
        const data = await res.json();
        return data.responseData.translatedText;
      };
      const [newTitle, newText] = await Promise.all([translateText(note.title), translateText(note.text)]);
      setSavedNotes(prev => prev.map(n => n.id === note.id ? { ...n, title: newTitle, text: newText } : n));
      await updateDoc(doc(db, 'notes', note.id), { title: newTitle, text: newText, language });
      setOpenMenuId(null);
    } catch (err) { setError('Translation failed. The free API may be busy.'); }
  };

  // ── AI ────────────────────────────────────────────────────────────────────
  const generateTitle = async () => {
    if (!currentNote.trim() || isGeneratingTitle) return;
    setIsGeneratingTitle(true);
    setError(null);
    try {
      const result = await model.generateContent(
        `Generate a very short, catchy title (maximum 5 words) for the following note. Do not use quotes. Note: "${currentNote}"`
      );
      setNoteTitle(result.response.text().trim());
    } catch (err) {
      setError(err.message?.includes('429') ? 'Too many requests. Please wait a moment.' : 'Failed to generate title.');
    } finally { setIsGeneratingTitle(false); }
  };

  const handleGenerateSummary = async (id, text) => {
    if (!text) return;
    setIsSummarizing(id);
    try {
      const result = await model.generateContent(
        `Summarize the following text into 3 concise bullet points. Use plain text, no markdown symbols like ** or ##. Text: "${text}"`
      );
      const summaryText = result.response.text().trim();
      await updateDoc(doc(db, 'notes', id), { summary: summaryText });
    } catch (err) {
      setError('Could not generate summary.');
    } finally { setIsSummarizing(null); }
  };

  // ── SPEAK ─────────────────────────────────────────────────────────────────
  const speakText = async (text, id) => {
    if (isPlaying === id) { window.speechSynthesis.cancel(); setIsPlaying(null); return; }
    window.speechSynthesis.cancel();
    setAudioLoading(id);
    const targetLang = language.split('-')[0];
    let textToSpeak = text;
    try {
      if (targetLang !== 'en') {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
        const data = await res.json();
        if (data.responseData.translatedText) textToSpeak = data.responseData.translatedText;
      }
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = language;
      utterance.onstart = () => { setAudioLoading(null); setIsPlaying(id); };
      utterance.onend = () => setIsPlaying(null);
      utterance.onerror = () => { setAudioLoading(null); setIsPlaying(null); };
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      window.speechSynthesis.speak(utterance);
      setAudioLoading(null);
      setIsPlaying(id);
    }
  };

  // ── COPY / EXPORT / SHARE ─────────────────────────────────────────────────
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportNote = (note) => {
    const blob = new Blob([`${note.title}\n\n${note.text}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${note.title || 'note'}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = (note) => {
    const text = `${note.title || 'My Note'}\n\n${note.text}`;
    if (navigator.share) { navigator.share({ title: note.title || 'Voice Note', text }).catch(() => {}); return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // ── FILTERING ─────────────────────────────────────────────────────────────
  const filteredNotes = savedNotes.filter(note => {
    const matchesSearch =
      note.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFolder = activeFolder === null ? true : note.folder === activeFolder;
    return matchesSearch && matchesFolder;
  });

  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.pinned);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100">
      <Snowfall color={darkMode ? '#ffffff' : '#c7d2fe'} snowflakeCount={20} />

      <div className="max-w-6xl mx-auto flex gap-0 md:gap-6 p-4 md:p-8 min-h-screen">

        {/* ── SIDEBAR ─────────────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col gap-2 w-52 flex-shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-3 shadow-sm sticky top-8">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Folders</p>

            {/* All Notes */}
            <button
              onClick={() => setActiveFolder(null)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeFolder === null
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">All Notes</span>
              <span className="ml-auto text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                {savedNotes.length}
              </span>
            </button>

            {/* Folder list */}
            {folders.map(folder => (
              <div key={folder.id} className="group/folder flex items-center">
                <button
                  onClick={() => setActiveFolder(folder.id)}
                  className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    activeFolder === folder.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {activeFolder === folder.id
                    ? <FolderOpen className="w-4 h-4 flex-shrink-0" />
                    : <Folder className="w-4 h-4 flex-shrink-0" />
                  }
                  <span className="truncate">{folder.name}</span>
                  <span className="ml-auto text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded-full">
                    {savedNotes.filter(n => n.folder === folder.id).length}
                  </span>
                </button>
                <button
                  onClick={() => deleteFolder(folder.id)}
                  className="opacity-0 group-hover/folder:opacity-100 p-1 text-slate-300 hover:text-red-400 transition-all ml-1"
                  title="Delete folder"
                ><X className="w-3 h-3" /></button>
              </div>
            ))}

            {/* New folder */}
            {showNewFolderInput ? (
              <div className="flex items-center gap-1 px-2 mt-1">
                <input
                  autoFocus
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') setShowNewFolderInput(false); }}
                  placeholder="Folder name…"
                  className="flex-1 text-xs px-2 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
                />
                <button onClick={createFolder} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewFolderInput(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors mt-1"
              >
                <FolderPlus className="w-3.5 h-3.5" /> New folder
              </button>
            )}
          </div>
        </aside>

        {/* ── MAIN ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight flex items-center gap-2">
                <Mic className="w-7 h-7" /> Voice Notes Pro
              </h1>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">
                Welcome, {user.displayName || user.email}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-500" />}
              </button>
              <button
                onClick={onLogout}
                className="p-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-100 dark:border-red-900/40 hover:bg-red-100 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Error banner */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl flex items-center gap-2 border border-red-200 dark:border-red-900/40 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* ── RECORDING AREA ─────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={150}
              className={`absolute bottom-0 left-0 w-full h-28 pointer-events-none transition-opacity duration-500 ${isRecording ? 'opacity-100' : 'opacity-0'}`}
            />
            <div className="p-5 md:p-7 space-y-4 relative z-10">

              {/* Mic button */}
              <div className="flex justify-center">
                <button
                  onClick={toggleRecording}
                  className={`relative w-18 h-18 w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                    isRecording
                      ? 'bg-red-500 shadow-red-300 dark:shadow-red-900 scale-110 text-white animate-pulse'
                      : 'bg-indigo-600 shadow-indigo-200 dark:shadow-indigo-900 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {isRecording ? <Square className="w-7 h-7 fill-current" /> : <Mic className="w-7 h-7" />}
                </button>
              </div>

              {/* Title row */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={e => setNoteTitle(e.target.value)}
                  placeholder="Note title (optional)"
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
                <button
                  onClick={generateTitle}
                  disabled={!currentNote || isGeneratingTitle}
                  className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-1.5 text-sm font-medium disabled:opacity-40 whitespace-nowrap"
                >
                  <Sparkles className={`w-4 h-4 ${isGeneratingTitle ? 'animate-spin' : ''}`} />
                  {isGeneratingTitle ? 'Generating…' : 'Auto Title'}
                </button>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={currentNote + (interimTranscript ? ` ${interimTranscript}` : '')}
                  onChange={e => setCurrentNote(e.target.value)}
                  placeholder={isRecording ? 'Listening…' : 'Tap the mic to record or type here…'}
                  className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all resize-none outline-none text-base leading-relaxed"
                />
                {currentNote && (
                  <button onClick={() => setCurrentNote('')} className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-400 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {isRecording && interimTranscript && (
                  <div className="absolute bottom-3 left-4 text-xs text-indigo-400 italic pointer-events-none">{interimTranscript}</div>
                )}
              </div>

              {/* Bottom controls */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        selectedCategory === cat.id ? `${cat.color} ring-2 ring-indigo-500` : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Folder selector */}
                  {folders.length > 0 && (
                    <select
                      value={selectedNoteFolder}
                      onChange={e => setSelectedNoteFolder(e.target.value)}
                      className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600 dark:text-slate-300"
                    >
                      <option value="">No folder</option>
                      {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  )}

                  <button
                    onClick={saveNote}
                    disabled={!currentNote.trim()}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center gap-2 shadow-md shadow-indigo-200 dark:shadow-indigo-900 transition-all text-sm"
                  >
                    <Save className="w-4 h-4" /> Save Note
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── NOTES LIST ─────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* List header */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                {activeFolder
                  ? <><FolderOpen className="w-5 h-5 text-indigo-400" />{folders.find(f => f.id === activeFolder)?.name}</>
                  : <><FileText className="w-5 h-5" /> All Notes</>
                }
                <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {filteredNotes.length}
                </span>
              </h2>

              {/* Language + Search */}
              <div className="flex gap-2 w-full sm:w-auto">
                {/* Language picker */}
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium hover:border-indigo-400 transition-colors"
                  >
                    <Languages className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">{LANGUAGES.find(l => l.code === language)?.name}</span>
                    <span className="sm:hidden">{language.split('-')[0].toUpperCase()}</span>
                  </button>
                  {isLangMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="p-2 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                          <input
                            autoFocus
                            type="text"
                            placeholder="Search language…"
                            value={langSearch}
                            onChange={e => setLangSearch(e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <div className="max-h-52 overflow-y-auto p-1">
                        {LANGUAGES.filter(l => l.name.toLowerCase().includes(langSearch.toLowerCase())).map(lang => (
                          <button
                            key={lang.code}
                            onClick={() => { setLanguage(lang.code); setIsLangMenuOpen(false); setLangSearch(''); }}
                            className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors ${language === lang.code ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}
                          >
                            {lang.name}
                            {language === lang.code && <Check className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Search */}
                <div className="relative flex-1 sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search notes, tags…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Notes grid */}
            {filteredNotes.length === 0 ? (
              <EmptyState
                type={searchQuery ? 'search' : activeFolder ? 'folder' : 'notes'}
                searchQuery={searchQuery}
                folder={folders.find(f => f.id === activeFolder)?.name}
              />
            ) : (
              <>
                {/* Pinned */}
                {pinnedNotes.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                      <Pin className="w-3 h-3" /> Pinned
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {pinnedNotes.map(note => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          isPlaying={isPlaying}
                          audioLoading={audioLoading}
                          isSummarizing={isSummarizing}
                          copiedId={copiedId}
                          openMenuId={openMenuId}
                          onPlay={speakText}
                          onToggleMenu={id => setOpenMenuId(openMenuId === id ? null : id)}
                          onEdit={handleEdit}
                          onTranslate={handleTranslate}
                          onCopy={copyToClipboard}
                          onExport={exportNote}
                          onShare={handleShare}
                          onDelete={deleteNote}
                          onPin={handlePin}
                          onSummarize={handleGenerateSummary}
                          onTagAdd={handleTagAdd}
                          onTagRemove={handleTagRemove}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Other */}
                {unpinnedNotes.length > 0 && (
                  <div className="space-y-3">
                    {pinnedNotes.length > 0 && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        <FileText className="w-3 h-3" /> Other
                      </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {unpinnedNotes.map(note => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          isPlaying={isPlaying}
                          audioLoading={audioLoading}
                          isSummarizing={isSummarizing}
                          copiedId={copiedId}
                          openMenuId={openMenuId}
                          onPlay={speakText}
                          onToggleMenu={id => setOpenMenuId(openMenuId === id ? null : id)}
                          onEdit={handleEdit}
                          onTranslate={handleTranslate}
                          onCopy={copyToClipboard}
                          onExport={exportNote}
                          onShare={handleShare}
                          onDelete={deleteNote}
                          onPin={handlePin}
                          onSummarize={handleGenerateSummary}
                          onTagAdd={handleTagAdd}
                          onTagRemove={handleTagRemove}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── EDIT MODAL ─────────────────────────────────────────────── */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-indigo-500" /> Edit Note
              </h3>
              <button onClick={() => setEditingNote(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                <input
                  type="text"
                  value={editingNote.title}
                  onChange={e => setEditingNote({ ...editingNote, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Content</label>
                <textarea
                  value={editingNote.text}
                  onChange={e => setEditingNote({ ...editingNote, text: e.target.value })}
                  className="w-full h-36 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-700 dark:text-slate-300 leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Category</label>
                <div className="flex gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setEditingNote({ ...editingNote, category: cat.id })}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${editingNote.category === cat.id ? `${cat.color} ring-2 ring-indigo-500` : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              {folders.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Folder</label>
                  <select
                    value={editingNote.folder || ''}
                    onChange={e => setEditingNote({ ...editingNote, folder: e.target.value || null })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300"
                  >
                    <option value="">No folder</option>
                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button onClick={() => setEditingNote(null)} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleUpdateNote} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2">
                <Check className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI SUMMARY CARD MODAL ──────────────────────────────────── */}
      {aiCardData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <AiSummaryCard data={aiCardData} onClose={() => setAiCardData(null)} darkMode={darkMode} />
        </div>
      )}

      {/* ── CONFIRM DELETE DIALOG ─────────────────────────────────── */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setTimeout(() => setLoading(false), 2000);
    });
    return unsub;
  }, []);

  const handleLogout = async () => {
    try { await signOut(auth); setAuthView('login'); }
    catch (err) { console.error('Sign out error:', err); }
  };

  return (
    <>
      <Preloader isLoading={loading} />
      {!loading && (
        <div>
          {user ? (
            <VoiceNotesDashboard user={user} onLogout={handleLogout} />
          ) : authView === 'signup' ? (
            <Signup onSwitchToLogin={() => setAuthView('login')} />
          ) : (
            <Login onSwitchToSignup={() => setAuthView('signup')} />
          )}
        </div>
      )}
    </>
  );
}