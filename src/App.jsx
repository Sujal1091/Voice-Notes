import React, { useState, useEffect, useRef } from 'react';
import Preloader from './components/Preloader.jsx';
import {
  Mic, Square, Save, Trash2, Play, FileText, Clock,
  AlertCircle, Moon, Sun, Copy, Download,
  Search, Sparkles, LogOut, Check, MoreVertical, Edit, Share2, Languages
} from 'lucide-react';
import {
  collection, addDoc, deleteDoc, doc, onSnapshot, query, where, orderBy, serverTimestamp, updateDoc
} from 'firebase/firestore';
import './App.css';
import Login from './components/login';
import Signup from './components/Signup'; // Import your Login component
import { onAuthStateChanged, signOut } from 'firebase/auth'; // Import auth methods
import { auth, googleProvider } from './config/firebase.js'; // Import auth instance
import { db } from './config/firebase.js'; // Import Firestore instance
import { model } from './config/gemini.js'; // Import Gemini model
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
  const [editingNote, setEditingNote] = useState(null); // Handles both data and modal visibility
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [audioLoading, setAudioLoading] = useState(null);

  
  // Restored States for AI features
  const [isSummarizing, setIsSummarizing] = useState(null);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');


  // Refs
  const recognitionRef = useRef(null);
  const isIntentionalStop = useRef(false);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const noteRef = useRef(''); 
  const [openMenuId, setOpenMenuId] = useState(null);

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
    sourceRef.current.disconnect();
  }

  // ADD THIS CHECK: Only close if it's not already closed
  if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
    audioContextRef.current.close();
  }
};

  const stopRecordingCleanup = () => {
  isIntentionalStop.current = true;

  if (recognitionRef.current) {
    recognitionRef.current.stop();
    recognitionRef.current = null;
  }

  stopVisualizer();
  setIsRecording(false);
};


const startRecording = () => {
  setError(null);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setError('Speech recognition not supported');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = language || 'en-IN';

  recognition.onstart = () => {
    isIntentionalStop.current = false;
    setIsRecording(true);
    startVisualizer();
  };

  recognition.onresult = (event) => {
    let finalText = '';
    let interimText = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalText += transcript + ' ';
      } else {
        interimText += transcript;
      }
    }

    if (finalText) {
      setCurrentNote(prev => prev + finalText);
    }

    setInterimTranscript(interimText);
  };

  recognition.onerror = (e) => {
    if (['no-speech', 'aborted'].includes(e.error)) return;
    console.error(e);
  };

  recognition.onend = () => {
    if (!isIntentionalStop.current) {
      recognition.start();
    } else {
      stopRecordingCleanup();
    }
  };

  recognitionRef.current = recognition;
  recognition.start();
};


  const toggleRecording = () => isRecording ? stopRecordingCleanup() : startRecording();

          // --- ACTIONS ---
        // 1. Open the Modal
        const handleEdit = (note) => {
          setEditingNote(note); // Set the note to be edited
          setOpenMenuId(null);  // Close the dropdown menu if it's open
        };

        // 2. Save Changes to Firebase
        const handleUpdateNote = async () => {
          if (!editingNote) return;

          try {
            const noteRef = doc(db, 'notes', editingNote.id);
            
            await updateDoc(noteRef, {
              title: editingNote.title,
              text: editingNote.text,
              category: editingNote.category, // Optional: if you want to allow changing category
              updatedAt: serverTimestamp()
            });

            setEditingNote(null); // Close the modal
          } catch (err) {
            console.error("Error updating note:", err);
            setError("Failed to update note.");
          }
        };


// --- NEW TRANSLATE FUNCTION (No Backend Needed) ---
const handleTranslate = async (note) => {
  // 1. Get the target language code (e.g., "hi-IN" becomes "hi")
  const targetLang = language.split('-')[0]; 
  
  if (!targetLang) return;

  // Visual feedback
  const confirmTranslate = window.confirm(
    `Translate this note to ${LANGUAGES.find(l => l.code === language)?.name}?`
  );
  if (!confirmTranslate) return;

  try {
    console.log(`Translating to ${targetLang}...`);

    // 2. Helper function to call the Free API
    const translateText = async (text) => {
      if (!text) return "";
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|${targetLang}`
      );
      const data = await response.json();
      return data.responseData.translatedText;
    };

    // 3. Translate Title and Text in parallel (faster)
    const [newTitle, newText] = await Promise.all([
      translateText(note.title),
      translateText(note.text)
    ]);

    // 4. Update the UI Immediately (Optimistic Update)
    setSavedNotes(prev => 
      prev.map(n => 
        n.id === note.id ? { ...n, title: newTitle, text: newText } : n
      )
    );

    // 5. Save changes to Firebase
    const noteRef = doc(db, 'notes', note.id);
    await updateDoc(noteRef, {
      title: newTitle,
      text: newText,
      language: language // Optional: store which language it is now
    });
    
    setOpenMenuId(null); // Close the menu
    alert("Translation Complete!");

  } catch (error) {
    console.error("Translation failed:", error);
    alert("Translation failed. The free API might be busy.");
  }
};

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

      const generateTitle = async () => {
        if (!currentNote.trim() || isGeneratingTitle) return;
        
        setIsGeneratingTitle(true); 
        setError(null); 

        try {
          const prompt = `Generate a very short, catchy title (maximum 5 words) for the following note. Do not use quotes. Note: "${currentNote}"`;
          
          const result = await model.generateContent(prompt);
          
          // FIX: Safely access the text function
          // In newer SDKs, 'result.response' is NOT a promise you await, it's a property.
          // We try to access it directly first.
          const response = result.response; 
          const aiTitle = response.text().trim();
          
          setNoteTitle(aiTitle);
        } catch (err) {
          console.error("AI Title Error:", err);
          // Specific error handling for the 404/429 issues you saw earlier
          if (err.message.includes("429")) {
              setError("Too many requests. Please wait a moment.");
          } else {
              setError("Failed to generate title. Try again.");
          }
        } finally {
          setIsGeneratingTitle(false); 
        }
      };

      const speakText = async (text, id) => {
      // 1. Stop if already playing
      if (isPlaying === id) {
        window.speechSynthesis.cancel();
        setIsPlaying(null);
        return;
      }

      // 2. Stop any previous audio
      window.speechSynthesis.cancel();
      setAudioLoading(id); // Start loading spinner

      const targetLang = language.split('-')[0]; // e.g., "hi" from "hi-IN"
      let textToSpeak = text;

      try {
        // 3. CHECK: Do we need to translate?
        // We assume the note is in English if not specified. 
        // If target is NOT English, we try to translate.
        if (targetLang !== 'en') {
            console.log(`Translating audio to ${targetLang}...`);
            
            const response = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`
            );
            const data = await response.json();
            
            // Use the translated text if found, otherwise fallback to original
            if (data.responseData.translatedText) {
                textToSpeak = data.responseData.translatedText;
            }
        }

        // 4. Speak the (potentially translated) text
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = language; // Use the accent of the selected language
        
        utterance.onstart = () => {
            setAudioLoading(null); // Stop loading, start playing icon
            setIsPlaying(id);
        };
        
        utterance.onend = () => {
            setIsPlaying(null);
        };

        utterance.onerror = () => {
            setAudioLoading(null);
            setIsPlaying(null);
        };

        window.speechSynthesis.speak(utterance);

      } catch (error) {
        console.error("Audio translation failed:", error);
        // Fallback: Just read the original text if translation fails
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        window.speechSynthesis.speak(utterance);
        setAudioLoading(null);
        setIsPlaying(id);
      }
    };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // DOWNLOAD FUNCTION
  const exportNote = (note) => {
  const content = `${note.title}\n\n${note.text}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${note.title || 'note'}.txt`;
  a.click();

  URL.revokeObjectURL(url);
};

//SHare FUNCTION (placeholder)
const handleShare = (note) => {
  const text = `${note.title || "My Note"}\n\n${note.content}`;

  // 1️⃣ If browser supports system share (BEST)
  if (navigator.share) {
    navigator
      .share({
        title: note.title || "Voice Note",
        text,
      })
      .catch(() => {});
    return;
  }

  // 2️⃣ Fallback: open WhatsApp
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(whatsappUrl, "_blank");

  // 3️⃣ Email fallback (optional)
  const emailUrl = `mailto:?subject=${encodeURIComponent(
    note.title || "Voice Note"
  )}&body=${encodeURIComponent(text)}`;
  window.open(emailUrl, "_self");
};

// --- REAL AI SUMMARY GENERATOR ---
const handleGenerateSummary = async (id, text) => {
  if (!text) return;
  
  setIsSummarizing(id); // Show loading state on the specific button

  try {
    const prompt = `Summarize the following text into 3 concise bullet points. Use plain text, no markdown symbols like ** or ##. Text: "${text}"`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summaryText = response.text().trim();

    // Save the summary permanently to Firebase
    const noteRef = doc(db, 'notes', id);
    await updateDoc(noteRef, {
      summary: summaryText
    });

  } catch (err) {
    console.error("AI Summary Error:", err);
    alert("Could not generate summary.");
  } finally {
    setIsSummarizing(null); // Stop loading
  }
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
                <Save className="w-4 h-4" /> Save
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
            {/* --- CONTAINER FOR LANGUAGE & SEARCH --- */}
<div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">

  {/* 1. NEW CUSTOM LANGUAGE DROPDOWN */}
  <div className="relative">
    {/* The Trigger Button */}
    <button 
      onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
      className="flex items-center justify-between w-full md:w-48 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:border-indigo-500 transition-colors"
    >
      <span className="flex items-center gap-2">
        <Languages className="w-4 h-4 text-slate-400" />
        {LANGUAGES.find(l => l.code === language)?.name || "Select Language"}
      </span>
      {/* Chevron Icon */}
      <svg className={`w-4 h-4 text-slate-400 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
    </button>

    {/* The Dropdown Menu (Visible only when open) */}
    {isLangMenuOpen && (
      <div className="absolute top-full left-0 mt-2 w-full md:w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
        
        {/* Search Input inside Dropdown */}
        <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 sticky top-0">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search language..." 
              value={langSearch}
              onChange={(e) => setLangSearch(e.target.value)}
              autoFocus
              className="w-full pl-7 pr-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Scrollable Language List */}
        <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
          {LANGUAGES.filter(l => l.name.toLowerCase().includes(langSearch.toLowerCase())).length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 text-center">No language found</div>
          ) : (
            LANGUAGES.filter(l => l.name.toLowerCase().includes(langSearch.toLowerCase())).map(lang => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsLangMenuOpen(false);
                  setLangSearch('');
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between group hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors ${language === lang.code ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}
              >
                {lang.name}
                {language === lang.code && <Check className="w-3 h-3" />}
              </button>
            ))
          )}
        </div>
      </div>
    )}
  </div>

  {/* 2. EXISTING SEARCH BAR (Moved here) */}
  <div className="relative w-full md:w-64">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    <input 
      type="text" 
      placeholder="Search notes..." 
      value={searchQuery} 
      onChange={(e) => setSearchQuery(e.target.value)} 
      className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
    />
  </div>

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
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full w-fit font-medium uppercase tracking-wider ${
                          CATEGORIES.find(c => c.id === note.category)?.color
                        }`}
                      >
                        {note.category}
                      </span>

                      <h3 className="font-bold text-gray-900 dark:text-white leading-tight">
                        {note.title || "Untitled Note"}
                      </h3>

                      <div className="flex items-center text-xs text-slate-400 gap-1">
                        <Clock className="w-3 h-3" /> {note.date}
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 my-1">
                        {note.text}
                      </p>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex items-center gap-1 relative">

                      {/* PLAY BUTTON (OUTSIDE MENU) */}
                      <button
                          onClick={() => speakText(note.text, note.id)}
                          disabled={audioLoading === note.id} // Disable while loading
                          className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-full transition-colors"
                        >
                          {audioLoading === note.id ? (
                            // LOADING SPINNER
                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : isPlaying === note.id ? (
                            // STOP ICON
                            <Square className="w-4 h-4 fill-current text-indigo-500" />
                          ) : (
                            // PLAY ICON
                            <Play className="w-4 h-4 fill-current" />
                          )}
                        </button>

                      {/* 3 DOT MENU */}
                      <button
                        onClick={() =>
                          setOpenMenuId(openMenuId === note.id ? null : note.id)
                        }
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openMenuId === note.id && (
                        <div className="absolute right-0 top-8 z-30 w-44 bg-white dark:bg-slate-800 
                                        border border-slate-200 dark:border-slate-700 
                                        rounded-lg shadow-lg overflow-hidden">

                          <button className="menu-item"
                            onClick={() => handleEdit(note)}
                            >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>

                          <button
                            onClick={() => handleTranslate(note)}
                            className="menu-item"
                          >
                            <Languages className="w-4 h-4" />
                            Translate
                          </button>

                          <button
                            onClick={() => copyToClipboard(note.text, note.id)}
                            className="menu-item"
                          >
                            <Copy className="w-4 h-4" />
                            Copy
                          </button>

                          <button
                            onClick={() => exportNote(note)}
                            className="menu-item"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>

                          <button
                            onClick={() => handleShare(note)}
                            className="menu-item"
                          >
                            <Share2 className="w-4 h-4" />
                            Share
                            </button>


                          <button
                            onClick={() => deleteNote(note.id)}
                            className="menu-item text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>



                  {/* AI SUMMARY SECTION */}
                  <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700">
                    {note.summary ? (
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg text-xs text-indigo-800 dark:text-indigo-200">
                        <div className="flex items-center gap-1 mb-1 font-semibold">
                          <Sparkles className="w-3 h-3" /> AI Summary
                        </div>
                        {/* We use whitespace-pre-line so the bullet points display on new lines */}
                        <p className="whitespace-pre-line leading-relaxed">{note.summary}</p>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleGenerateSummary(note.id, note.text)} // <--- UPDATED FUNCTION NAME
                        disabled={isSummarizing === note.id} 
                        className="w-full py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1"
                      >
                        {isSummarizing === note.id ? (
                          <>
                            <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" /> Summarize with AI
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
            {/* --- EDIT MODAL --- */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animation-fade-in">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-500" /> Edit Note
              </h3>
              <button 
                onClick={() => setEditingNote(null)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Title</label>
                <input 
                  type="text" 
                  value={editingNote.title} 
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-800 dark:text-slate-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Content</label>
                <textarea 
                  value={editingNote.text} 
                  onChange={(e) => setEditingNote({ ...editingNote, text: e.target.value })}
                  className="w-full h-40 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-700 dark:text-slate-300 leading-relaxed"
                />
              </div>

              {/* Category Selection in Edit (Optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Category</label>
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
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setEditingNote(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateNote}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

    </div>
  );
}




// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login');
  
  // 1. Initialize loading to true
  const [loading, setLoading] = useState(true); 

  // 2. LISTEN TO FIREBASE & HANDLE DELAY
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      // Add a 2-second delay so the user can see your Preloader animation
      // properly before the app appears.
      setTimeout(() => {
        setLoading(false);
      }, 2000); 
    });

    return () => unsubscribe(); 
  }, []);

  // 3. HANDLE LOGOUT
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAuthView('login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // 4. RENDER WITH PRELOADER
  return (
    <>
      {/* The Preloader handles its own fade-out logic */}
      <Preloader isLoading={loading} />

      {/* Only show the main app when loading is finished */}
      {!loading && (
        <div className="animate-fade-in"> 
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