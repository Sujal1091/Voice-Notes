import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Save, Trash2, Play, Square, FileText, Clock, 
  AlertCircle, WifiOff, RefreshCw, Moon, Sun, Copy, Download, 
  Search, Sparkles, LogOut, Check // Added LogOut icon
} from 'lucide-react';
import { 
  collection, addDoc, deleteDoc, doc, onSnapshot, query, where, orderBy, serverTimestamp 
} from 'firebase/firestore';
import Login from './components/login';
import Signup from './components/Signup'; // Import your Login component
import { onAuthStateChanged, signOut } from 'firebase/auth'; // Import auth methods
import { auth, googleProvider } from './config/firebase.js'; // Import auth instance
import { db } from './config/firebase.js'; // Import Firestore instance
// --- CONSTANTS ---

const LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'zh-CN', name: 'Chinese (Mandarin)' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'pt-PT', name: 'Portuguese' },
  // { code: 'ar-SA', name: 'Arabic' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'nl-NL', name: 'Dutch' },
  // { code: 'sv-SE', name: 'Swedish' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'de-DE', name: 'German' },

];

const CATEGORIES = [
  { id: 'personal', name: 'Personal', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { id: 'work', name: 'Work', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { id: 'ideas', name: 'Ideas', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
];


// --- INTERNAL COMPONENT: THE MAIN VOICE NOTES APP ---
function VoiceNotesDashboard({ user, onLogout }) {
  // --- STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [savedNotes, setSavedNotes] = useState([]);
  const [isPlaying, setIsPlaying] = useState(null);
  const [error, setError] = useState(null);
  
  // UI States
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('personal');
  const [copiedId, setCopiedId] = useState(null);
  
  // Restored States for AI features
  const [isSummarizing, setIsSummarizing] = useState(null);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  // Refs
  const recognitionRef = useRef(null);
  const isIntentionalStop = useRef(false);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const noteRef = useRef(''); 

  useEffect(() => {
    noteRef.current = currentNote;
  }, [currentNote]);

  // --- FIRESTORE REAL-TIME LISTENER ---
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notes"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt?.toDate().toLocaleString() || new Date().toLocaleString()
      }));
      setSavedNotes(notesData);
    }, (err) => console.error("Firestore Error:", err));
    return () => unsubscribe();
  }, [user]);

  // Theme & Cleanup
  useEffect(() => {
    const storedTheme = localStorage.getItem('voice_notes_theme');
    if (storedTheme === 'dark') setDarkMode(true);
    return () => {
      stopRecordingCleanup();
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // --- AUTO-SAVE LOGIC ---
  useEffect(() => {
    if (!isRecording && noteRef.current.trim().length > 0) {
      saveNote(noteRef.current);
    }
  }, [isRecording]);

  // --- AUDIO VISUALIZER ---
  const startVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      drawVisualizer();
    } catch (err) { console.warn("Visualizer failed:", err); }
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const ctx = canvasRef.current.getContext('2d');
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, width, height);
      const barColor = darkMode ? '129, 140, 248' : '79, 70, 229';
      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        ctx.fillStyle = `rgb(${barColor}, ${barHeight / 100})`;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (sourceRef.current) {
        sourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
        sourceRef.current.disconnect();
    }
    if (audioContextRef.current) audioContextRef.current.close();
    if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // --- RECORDING LOGIC ---
  const startRecording = () => {
    setError(null);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      isIntentionalStop.current = false;
      setIsRecording(true);
      startVisualizer();
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript) {
        setCurrentNote(prev => {
          const prefix = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
          return prev + prefix + finalTranscript;
        });
      }
    };

    recognition.onerror = (event) => {
      if (['no-speech', 'aborted'].includes(event.error)) return;
      stopRecordingCleanup();
    };

    recognition.onend = () => {
      if (!isIntentionalStop.current) stopRecordingCleanup();
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecordingCleanup = () => {
    isIntentionalStop.current = true;
    if (recognitionRef.current) recognitionRef.current.stop();
    stopVisualizer();
    setIsRecording(false);
  };

  const toggleRecording = () => isRecording ? stopRecordingCleanup() : startRecording();

  // --- ACTIONS ---
  
  // NOTE SAVING LOGIC
  const saveNote = async (textToSave) => {
    // Determine what text to save (manual button click passes event object, so check type)
    let text = typeof textToSave === 'string' ? textToSave : currentNote;
    
    if (!text || !text.trim()) return;
    
    try {
      let finalTitle = noteTitle;
      // Auto-generate title if missing
      if (!finalTitle) {
         const words = text.split(' ');
         finalTitle = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
      }

      await addDoc(collection(db, 'notes'), {
        text: text,
        title: finalTitle,
        category: selectedCategory,
        userId: user.uid,
        createdAt: serverTimestamp(),
        summary: null
      });
      
      setCurrentNote('');
      setNoteTitle(''); 
    } catch (err) {
      console.error("Error saving note: ", err);
      setError("Failed to save note.");
    }
  };

  const deleteNote = async (id) => {
    await deleteDoc(doc(db, 'notes', id));
  };

  // TITLE GENERATOR
  const generateTitle = () => {
    if (!currentNote) return;
    setIsGeneratingTitle(true);
    setTimeout(() => {
      const words = currentNote.split(' ');
      const newTitle = words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');
      setNoteTitle(newTitle.charAt(0).toUpperCase() + newTitle.slice(1));
      setIsGeneratingTitle(false);
    }, 800);
  };

  const speakText = (text, id) => {
    if (isPlaying === id) { window.speechSynthesis.cancel(); setIsPlaying(null); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.onend = () => setIsPlaying(null);
    setIsPlaying(id);
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // DOWNLOAD FUNCTION
  const exportNote = (note) => {
    const element = document.createElement("a");
    const file = new Blob([
      `Title: ${note.title}\nDate: ${note.date}\nCategory: ${note.category}\n\nNote:\n${note.text}\n\nSummary:\n${note.summary || 'N/A'}`
    ], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `voice-note-${note.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // AI SUMMARY SIMULATION
  const simulateAISummary = (id, text) => {
    setIsSummarizing(id);
    setTimeout(() => {
        const summary = `• ${text.slice(0, 20)}...\n• Key point extracted from audio.`;
        // To save summary permanently: updateDoc(doc(db, 'notes', id), { summary: summary });
        setIsSummarizing(null);
    }, 1500);
  };

  const filteredNotes = savedNotes.filter(note => 
    note.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (note.title && note.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    note.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight flex items-center gap-2">
              <Mic className="w-8 h-8" /> Voice Notes Pro
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
                Welcome, {user.displayName || user.email}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
              </select>
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </button>
              <button onClick={onLogout} className="p-2 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 border border-red-200 dark:border-red-800">
                <LogOut className="w-5 h-5" />
              </button>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-3 border border-red-200">
            <AlertCircle className="w-5 h-5" /> <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* RECORDING AREA */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden relative">
          
          <canvas ref={canvasRef} width="800" height="150" className={`absolute bottom-0 left-0 w-full h-32 pointer-events-none opacity-30 transition-opacity duration-500 ${isRecording ? 'opacity-100' : 'opacity-0'}`} />

          <div className="p-6 md:p-8 space-y-6 relative z-10">
            <div className="flex justify-center mb-4">
              <button onClick={toggleRecording} className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-red-500 shadow-red-500/50 scale-110 text-white' : 'bg-indigo-600 shadow-indigo-500/30 hover:bg-indigo-700 text-white'}`}>
                {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-8 h-8" />}
              </button>
            </div>

            {/* Title & Auto Title Wand */}
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note Title (Optional)"
                className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button 
                onClick={generateTitle}
                disabled={!currentNote || isGeneratingTitle}
                className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap"
              >
                <Sparkles className={`w-4 h-4 ${isGeneratingTitle ? 'animate-spin' : ''}`} />
                {isGeneratingTitle ? 'Generating...' : 'Auto Title'}
              </button>
            </div>

            <div className="relative group">
              <textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder={isRecording ? "Listening..." : "Tap the mic to record or type here..."}
                className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 transition-all resize-none outline-none text-lg leading-relaxed"
              />
              {currentNote && (
                <button onClick={() => setCurrentNote('')} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>

            {/* Controls Row - WITH SAVE BUTTON */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedCategory === cat.id ? `${cat.color} ring-2 ring-indigo-500` : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                    {cat.name}
                  </button>
                ))}
              </div>
              
              {/* RESTORED SAVE BUTTON */}
              <button onClick={() => saveNote(currentNote)} disabled={!currentNote.trim()} className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md">
                <Save className="w-4 h-4" /> Save to Cloud
              </button>
            </div>
          </div>
        </div>

        {/* SAVED NOTES LIST */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5" /> Saved Notes
              <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 text-xs px-2 py-1 rounded-full">{savedNotes.length}</span>
            </h2>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <p>No notes found.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredNotes.map((note) => (
                <div key={note.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full w-fit font-medium uppercase tracking-wider ${CATEGORIES.find(c => c.id === note.category)?.color}`}>
                          {note.category}
                      </span>
                      <h3 className="font-bold text-gray-900 dark:text-white leading-tight">
                        {note.title || "Untitled Note"}
                      </h3>
                      <div className="flex items-center text-xs text-slate-400 gap-1">
                        <Clock className="w-3 h-3" /> {note.date}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => speakText(note.text, note.id)} className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-full">
                        {isPlaying === note.id ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                      </button>
                      <button onClick={() => copyToClipboard(note.text, note.id)} className="p-1.5 text-slate-400 hover:text-green-500 rounded-full">
                        {copiedId === note.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      
                      {/* RESTORED DOWNLOAD BUTTON */}
                      <button onClick={() => exportNote(note)} className="p-1.5 text-slate-400 hover:text-blue-500 rounded-full">
                        <Download className="w-4 h-4" />
                      </button>

                      <button onClick={() => deleteNote(note.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-full">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 mb-4">
                      <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed line-clamp-4">{note.text}</p>
                  </div>

                  {/* RESTORED AI SUMMARY BUTTON */}
                  <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700">
                    {note.summary ? (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg text-xs text-indigo-800 dark:text-indigo-200">
                          <div className="flex items-center gap-1 mb-1 font-semibold"><Sparkles className="w-3 h-3" /> AI Summary</div>
                          {note.summary}
                        </div>
                    ) : (
                      <button onClick={() => simulateAISummary(note.id, note.text)} disabled={isSummarizing === note.id} className="w-full py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1">
                          {isSummarizing === note.id ? "Generating..." : <><Sparkles className="w-3 h-3" /> Summarize with AI</>}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [loading, setLoading] = useState(true); 

  // 1. LISTEN TO FIREBASE: This effect runs once on load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Stop loading once Firebase tells us the status
    });

    return () => unsubscribe(); // Cleanup subscription
  }, []);

  // 2. HANDLE LOGOUT
const handleLogout = async () => {
    try {
      await signOut(auth);
      setAuthView('login'); // <--- ADD THIS LINE
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // 3. SHOW LOADING SCREEN (while Firebase connects)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // 4. IF LOGGED IN: Show Dashboard
  if (user) {
    return <VoiceNotesDashboard user={user} onLogout={handleLogout} />;
  }

  // 5. IF NOT LOGGED IN: Show Signup or Login
  if (authView === 'signup') {
    return (
      <Signup 
        onSwitchToLogin={() => setAuthView('login')} 
      />
    );
  }

  return (
    <Login 
      onSwitchToSignup={() => setAuthView('signup')} 
    />
  );
}