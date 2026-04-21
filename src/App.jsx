import React, { useState, useEffect, useRef } from 'react';
import Preloader from './components/Preloader.jsx';
import NoteCard from './components/NoteCard.jsx';
import EmptyState from './components/EmptyState.jsx';
import AiSummaryCard from './components/AiSummaryCard.jsx';
import LandingPage from './components/LandingPage.jsx'; // ← NEW
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
// (No changes to VoiceNotesDashboard — keeping your existing code as-is)

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
  const [activeFolder, setActiveFolder] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [selectedNoteFolder, setSelectedNoteFolder] = useState('');

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

  useEffect(() => {
    const stored = localStorage.getItem('voice_notes_theme');
    if (stored === 'dark') setDarkMode(true);
    return () => { stopRecordingCleanup(); window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('voice_notes_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const handler = () => { setOpenMenuId(null); setIsLangMenuOpen(false); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

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
        text, title: finalTitle, category: selectedCategory,
        folder: selectedNoteFolder || null, userId: user.uid,
        createdAt: serverTimestamp(), summary: null, pinned: false, tags: [],
      });
      setCurrentNote(''); setNoteTitle(''); setSelectedNoteFolder('');
    } catch (err) { setError('Failed to save note: ' + err.message); }
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
        title: editingNote.title, text: editingNote.text,
        category: editingNote.category, folder: editingNote.folder ?? null,
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

  const createFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      await addDoc(collection(db, 'folders'), { name, userId: user.uid, createdAt: serverTimestamp() });
      setNewFolderName(''); setShowNewFolderInput(false);
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
    } catch (err) { setError('Could not generate summary.'); }
    finally { setIsSummarizing(null); }
  };

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
      setAudioLoading(null); setIsPlaying(id);
    }
  };

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

  // ── RENDER (same as your original) ──────────────────────────────────────────
  return (
    <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100">
      <Snowfall color={darkMode ? '#ffffff' : '#c7d2fe'} snowflakeCount={20} />
      {/* Your existing dashboard JSX stays exactly the same here */}
      {/* ... */}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null);
  // ↓ NEW: 'landing' | 'login' | 'signup'
  const [authView, setAuthView] = useState('landing');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // If already logged in, skip landing page
      if (currentUser) setAuthView('login');
      setTimeout(() => setLoading(false), 2000);
    });
    return unsub;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAuthView('landing'); // ← Go back to landing on logout
    } catch (err) { console.error('Sign out error:', err); }
  };

  return (
    <>
      <Preloader isLoading={loading} />
      {!loading && (
        <div>
          {user ? (
            <VoiceNotesDashboard user={user} onLogout={handleLogout} />
          ) : authView === 'landing' ? (
            // ↓ NEW: Show landing page first
            <LandingPage onGetStarted={() => setAuthView('login')} />
          ) : authView === 'signup' ? (
            <Signup onSwitchToLogin={() => setAuthView('login')} />
          ) : (
            <Login
              onSwitchToSignup={() => setAuthView('signup')}
              onBackToLanding={() => setAuthView('landing')} // ← optional back button
            />
          )}
        </div>
      )}
    </>
  );
}
