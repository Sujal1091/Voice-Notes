import React, { useEffect, useRef, useState } from 'react';

const FEATURES = [
  {
    icon: '🎙️',
    title: 'Voice to Text',
    desc: 'Speak naturally in 13 languages. Real-time transcription with interim results as you talk.',
    color: '#6366f1',
    bg: '#eef2ff',
  },
  {
    icon: '✨',
    title: 'AI Summaries',
    desc: 'Gemini AI distills your notes into key takeaways, action items, and a TL;DR instantly.',
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    icon: '📁',
    title: 'Smart Folders',
    desc: 'Organize notes into folders and categories. Pin important ones to the top.',
    color: '#0ea5e9',
    bg: '#f0f9ff',
  },
  {
    icon: '🔍',
    title: 'Search Everything',
    desc: 'Instant search across note content, titles, tags, and categories.',
    color: '#10b981',
    bg: '#f0fdf4',
  },
  {
    icon: '🌐',
    title: 'Multi-Language',
    desc: 'Record in Hindi, Japanese, Spanish, French and 9 more. Translate with one click.',
    color: '#f59e0b',
    bg: '#fffbeb',
  },
  {
    icon: '🔒',
    title: 'Secure Cloud Sync',
    desc: 'Notes stored securely in Firebase. Available on all your devices, always.',
    color: '#ef4444',
    bg: '#fef2f2',
  },
];

const STEPS = [
  { num: '01', title: 'Tap the mic', desc: 'Hit record and start speaking — the app transcribes in real time.' },
  { num: '02', title: 'Save & organise', desc: 'Auto-generates a title. Assign a category or folder before saving.' },
  { num: '03', title: 'Let AI work', desc: 'One tap to get a smart summary, key points, and action items.' },
];

const STATS = [
  { value: '13', label: 'Languages' },
  { value: '3', label: 'AI Features' },
  { value: '∞', label: 'Notes' },
  { value: '1', label: 'Tap to start' },
];

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

const FadeIn = ({ children, delay = 0, className = '' }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

export default function LandingPage({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false);
  const [micPulse, setMicPulse] = useState(true);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setMicPulse(p => !p), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#fafafa', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&family=DM+Serif+Display:ital@0;1&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .btn-primary {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 14px 32px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: -0.01em;
        }
        .btn-primary:hover { background: #4338ca; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(79,70,229,0.3); }

        .btn-ghost {
          background: transparent;
          color: #4f46e5;
          border: 1.5px solid #c7d2fe;
          padding: 13px 28px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-ghost:hover { background: #eef2ff; border-color: #a5b4fc; }

        .feature-card {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 20px;
          padding: 28px;
          transition: all 0.25s ease;
        }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.07); border-color: #e0e7ff; }

        .nav-link {
          color: #64748b;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.15s;
          cursor: pointer;
        }
        .nav-link:hover { color: #4f46e5; }

        .waveform-bar {
          width: 4px;
          border-radius: 99px;
          background: #818cf8;
          transform-origin: bottom;
        }

        @keyframes wave1 { 0%,100%{height:8px} 50%{height:28px} }
        @keyframes wave2 { 0%,100%{height:16px} 50%{height:8px} }
        @keyframes wave3 { 0%,100%{height:24px} 50%{height:10px} }
        @keyframes wave4 { 0%,100%{height:10px} 50%{height:32px} }
        @keyframes wave5 { 0%,100%{height:20px} 50%{height:6px} }
        @keyframes wave6 { 0%,100%{height:6px} 50%{height:22px} }
        @keyframes wave7 { 0%,100%{height:14px} 50%{height:26px} }

        .mic-ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(99,102,241,0.25);
          animation: ripple 2s ease-out infinite;
        }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 40px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .hero-btns button { text-align: center !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #f1f5f9' : 'none',
        transition: 'all 0.3s ease',
        padding: '0 max(24px, calc((100vw - 1100px) / 2))',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: '#1e1b4b', letterSpacing: '-0.02em' }}>Voice Notes</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: 99, letterSpacing: '0.05em' }}>PRO</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <span className="nav-link" style={{ display: window.innerWidth < 600 ? 'none' : undefined }}>Features</span>
            <span className="nav-link" style={{ display: window.innerWidth < 600 ? 'none' : undefined }}>How it works</span>
            <button className="btn-primary" style={{ padding: '9px 22px', fontSize: 14 }} onClick={onGetStarted}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ paddingTop: 140, paddingBottom: 100, paddingLeft: 24, paddingRight: 24, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Background blobs */}
        <div style={{ position: 'absolute', top: -100, left: '10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 50, right: '5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 999, padding: '6px 16px', marginBottom: 28,
          animation: 'fadeInDown 0.7s ease both'
        }}>
          <style>{`@keyframes fadeInDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <span style={{ width: 6, height: 6, background: '#6366f1', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#4f46e5' }}>Powered by Gemini AI</span>
        </div>

        <h1 className="hero-title" style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 68,
          lineHeight: 1.08,
          color: '#0f0a2e',
          letterSpacing: '-0.03em',
          maxWidth: 760,
          margin: '0 auto 24px',
          animation: 'fadeInUp 0.8s ease 0.1s both',
        }}>
          <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
          Your voice,<br />
          <span style={{ fontStyle: 'italic', color: '#4f46e5' }}>beautifully captured.</span>
        </h1>

        <p style={{
          fontSize: 18, color: '#64748b', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7,
          animation: 'fadeInUp 0.8s ease 0.2s both',
        }}>
          Speak your thoughts. Voice Notes Pro transcribes, organises, and summarises them with AI — so nothing important ever slips away.
        </p>

        <div className="hero-btns" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', animation: 'fadeInUp 0.8s ease 0.3s both' }}>
          <button className="btn-primary" style={{ fontSize: 16, padding: '15px 36px' }} onClick={onGetStarted}>
            Start for free →
          </button>
          <button className="btn-ghost" style={{ fontSize: 16 }}>
            See how it works
          </button>
        </div>

        {/* ── HERO VISUAL ── */}
        <div style={{ marginTop: 72, display: 'flex', justifyContent: 'center', animation: 'fadeInUp 0.9s ease 0.4s both' }}>
          <div style={{ background: 'white', borderRadius: 28, border: '1px solid #e8ecf4', boxShadow: '0 32px 80px rgba(15,10,46,0.1)', padding: 40, maxWidth: 560, width: '100%' }}>
            {/* Mock recording panel */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="mic-ring" style={{ width: 90, height: 90, animationDelay: '0s' }} />
                <div className="mic-ring" style={{ width: 90, height: 90, animationDelay: '0.6s' }} />
                <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, boxShadow: '0 8px 24px rgba(79,70,229,0.4)' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Waveform bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 5, height: 40, marginBottom: 24 }}>
              {[1,2,3,4,5,6,7].map((i) => (
                <div key={i} className="waveform-bar" style={{ animation: `wave${i} ${0.8 + i * 0.1}s ease-in-out infinite`, animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>

            {/* Mock transcript */}
            <div style={{ background: '#f8fafc', borderRadius: 14, padding: '16px 20px', textAlign: 'left', marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8, fontWeight: 500, letterSpacing: '0.04em' }}>TRANSCRIPT</p>
              <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.6 }}>
                "The quarterly meeting is on Friday at 3pm. Remind the team to prepare their updates and send the agenda by Thursday morning…"
              </p>
              <span style={{ display: 'inline-block', width: 8, height: 16, background: '#6366f1', borderRadius: 2, marginLeft: 2, animation: 'pulse 1s infinite' }} />
            </div>

            {/* Mock tags */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Work', 'Meeting', 'Friday', 'Q3'].map(tag => (
                <span key={tag} style={{ fontSize: 12, fontWeight: 500, color: '#6366f1', background: '#eef2ff', padding: '4px 12px', borderRadius: 99 }}>#{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: '#4f46e5', padding: '52px 24px' }}>
        <div className="stats-grid" style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, textAlign: 'center' }}>
          {STATS.map((s, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 48, color: 'white', lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', fontWeight: 400 }}>{s.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '96px 24px', background: '#fafafa' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', letterSpacing: '0.1em', marginBottom: 12 }}>EVERYTHING YOU NEED</p>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 44, color: '#0f0a2e', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                Built for how you<br />actually think
              </h2>
            </div>
          </FadeIn>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <FadeIn key={i} delay={i * 70}>
                <div className="feature-card">
                  <div style={{ width: 44, height: 44, background: f.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 18 }}>
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f0a2e', marginBottom: 10, letterSpacing: '-0.01em' }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '96px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', letterSpacing: '0.1em', marginBottom: 12 }}>SIMPLE BY DESIGN</p>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 44, color: '#0f0a2e', letterSpacing: '-0.02em' }}>
                Three steps to never<br />forget anything again
              </h2>
            </div>
          </FadeIn>

          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {STEPS.map((s, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div style={{ position: 'relative' }}>
                  <div style={{ fontSize: 48, fontFamily: "'DM Serif Display', serif", color: '#e0e7ff', lineHeight: 1, marginBottom: 16 }}>{s.num}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0f0a2e', marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.65 }}>{s.desc}</p>
                  {i < STEPS.length - 1 && (
                    <div style={{ position: 'absolute', top: 28, right: -20, color: '#c7d2fe', fontSize: 24, display: window.innerWidth < 768 ? 'none' : 'block' }}>→</div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI FEATURES HIGHLIGHT ── */}
      <section style={{ padding: '96px 24px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <FadeIn>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#a5b4fc', letterSpacing: '0.1em', marginBottom: 16 }}>GEMINI AI INSIDE</p>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 20 }}>
                AI that understands<br /><span style={{ fontStyle: 'italic', color: '#a5b4fc' }}>what you meant</span>
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 32 }}>
                Beyond transcription — Voice Notes Pro extracts meaning. Auto-generated titles, bullet-point summaries, detected action items, entities, and more.
              </p>
              <button className="btn-primary" style={{ background: 'white', color: '#4f46e5' }} onClick={onGetStarted}>
                Try it free →
              </button>
            </div>
          </FadeIn>

          <FadeIn delay={150}>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.12)', padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, background: '#4f46e5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 16 }}>✨</span>
                </div>
                <span style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>AI Analysis</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 6 }}>TL;DR</p>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>Team meeting scheduled Friday 3pm. Agenda required by Thursday.</p>
              </div>
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 8 }}>ACTION ITEMS</p>
                {['Send agenda by Thursday', 'Team prepares updates'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 16, height: 16, border: '1.5px solid rgba(165,180,252,0.5)', borderRadius: 4, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Friday', 'Q3 Meeting', 'Team'].map(t => (
                  <span key={t} style={{ fontSize: 12, color: '#a5b4fc', background: 'rgba(165,180,252,0.15)', padding: '3px 10px', borderRadius: 99 }}>#{t}</span>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '100px 24px', textAlign: 'center', background: '#fafafa' }}>
        <FadeIn>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 48, color: '#0f0a2e', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20 }}>
              Ready to capture every idea?
            </h2>
            <p style={{ fontSize: 17, color: '#64748b', marginBottom: 40, lineHeight: 1.65 }}>
              Join thousands of people who never lose an important thought. Free to start, no credit card needed.
            </p>
            <button className="btn-primary" style={{ fontSize: 16, padding: '16px 40px' }} onClick={onGetStarted}>
              Create free account →
            </button>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #f1f5f9', padding: '32px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: '#1e1b4b' }}>Voice Notes Pro</span>
          </div>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>© 2025 Voice Notes Pro. Built with ❤️ and Gemini AI.</p>
        </div>
      </footer>
    </div>
  );
}
