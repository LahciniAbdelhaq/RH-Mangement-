import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, X, Send, Sparkles, User, Bot, ArrowRight } from 'lucide-react';

export default function Chatbot() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const initialWelcome = i18n.language === 'fr' 
    ? `Bonjour ${user?.name || ''} ! Je suis votre assistant RH intelligent. Comment puis-je vous aider aujourd'hui ?`
    : `Hello ${user?.name || ''}! I am your smart HR Assistant. How can I help you today?`;

  useEffect(() => {
    setMessages([
      { id: 'welcome', text: initialWelcome, sender: 'bot', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
  }, [i18n.language, user]);

  const quickPrompts = i18n.language === 'fr' 
    ? [
        { label: "Mes congés restants ?", val: "Quelle est la balance de mes congés restants ?" },
        { label: "Jours fériés Maroc 🇲🇦", val: "Quels sont les jours fériés officiels au Maroc ?" },
        { label: "Intégration Slack", val: "Comment connecter Slack dans les paramètres ?" },
      ]
    : [
        { label: "My remaining leaves?", val: "What is my remaining leaves balance?" },
        { label: "Moroccan Holidays 🇲🇦", val: "List the official Moroccan public holidays" },
        { label: "Slack Integration", val: "How do I connect Slack in Settings?" },
      ];

  // Synthesize soft, futuristic UI sound effects using Web Audio API (completely zero files needed!)
  const playUISound = (type) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'open') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'message') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'close') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = (textToSend) => {
    const query = textToSend.trim();
    if (!query) return;

    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      text: query,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);
    playUISound('message');

    // Simulate bot response
    setTimeout(() => {
      let botResponse = "";
      const isFr = i18n.language === 'fr';

      const lowQuery = query.toLowerCase();

      if (lowQuery.includes('congé') || lowQuery.includes('leave') || lowQuery.includes('restant') || lowQuery.includes('balance')) {
        botResponse = isFr 
          ? `D'après vos informations d'embauche, il vous reste actuellement **18 jours de congés payés** et **6 jours de congés maladie** pour l'année en cours. Vous pouvez soumettre une demande dans l'onglet "Congés & Absences".`
          : `According to your record, you currently have **18 days of paid leave** and **6 days of sick leave** remaining for the current calendar year. You can request leaves inside the "Leaves & Absences" tab.`;
      } else if (lowQuery.includes('férié') || lowQuery.includes('holiday') || lowQuery.includes('maroc') || lowQuery.includes('moroc')) {
        botResponse = isFr
          ? `Voici la liste des principaux jours fériés au Maroc 🇲🇦 :\n\n• **1er Janvier** : Nouvel An\n• **11 Janvier** : Manifeste de l'Indépendance\n• **Aid Al Fitr** (2 jours)\n• **Aid Al Adha** (2 jours)\n• **1er Mai** : Fête du Travail\n• **30 Juillet** : Fête du Trône\n• **14 Août** : Allégeance Oued Eddahab\n• **20 Août** : Révolution du Roi et du Peuple\n• **21 Août** : Fête de la Jeunesse\n• **Al Mawlid Al Nabawi** (2 jours)\n• **6 Novembre** : Marche Verte\n• **18 Novembre** : Fête de l'Indépendance.`
          : `Here is the list of official public holidays in Morocco 🇲🇦:\n\n• **Jan 1**: New Year's Day\n• **Jan 11**: Independence Manifesto\n• **Eid Al Fitr** (2 days)\n• **Eid Al Adha** (2 days)\n• **May 1**: Labour Day\n• **July 30**: Throne Day\n• **Aug 14**: Oued Eddahab Day\n• **Aug 20**: Revolution of the King & People\n• **Aug 21**: Youth Day\n• **Eid Al Mawlid** (2 days)\n• **Nov 6**: Green March Day\n• **Nov 18**: Independence Day.`;
      } else if (lowQuery.includes('slack') || lowQuery.includes('settings') || lowQuery.includes('paramètre')) {
        botResponse = isFr
          ? `Pour connecter Slack à votre compte :\n1. Rendez-vous dans **Paramètres** via le menu de gauche.\n2. Cliquez sur l'onglet **Intégrations**.\n3. Repérez le logo **Slack** et cliquez sur le bouton de connexion. La carte s'illuminera d'un dégradé et vous recevrez une alerte de confirmation !`
          : `To connect Slack to your account:\n1. Head over to **Settings** in the left sidebar.\n2. Open the **Integrations** tab.\n3. Locate the **Slack** card and click the connect button. The card will glow with brand colors and a success message will prompt!`;
      } else if (lowQuery.includes('salaires') || lowQuery.includes('finance') || lowQuery.includes('paie') || lowQuery.includes('payslip') || lowQuery.includes('salary')) {
        botResponse = isFr
          ? `Vous pouvez consulter le tableau financier complet et générer des fiches de paie professionnelles en allant sur la nouvelle page **Salaires & Paie**. Vous y trouverez un calculateur de retenues marocaines (CNSS, AMO, IGR) et un export de fiches de paie PDF !`
          : `You can manage and calculate salaries or print payslips by going to the new **Finance & Payroll** page. It features calculations for Moroccan taxes (CNSS, AMO, IGR) and immediate print-to-PDF formatting!`;
      } else {
        botResponse = isFr
          ? `Je comprends votre message concernant "${query}". En tant qu'assistant intelligent, je peux vous guider sur vos congés, fiches de paie, intégrations ou jours fériés officiels. N'hésitez pas à poser une question plus précise !`
          : `I understand your message regarding "${query}". As your AI assistant, I can guide you through your leave balances, payslips, settings, or Moroccan public holidays. Feel free to ask or click one of the quick prompts below!`;
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: botResponse,
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
      playUISound('message');
    }, 1200);
  };

  return (
    <>
      {/* Floating Bubble Button */}
      <button 
        onClick={() => {
          const nextState = !isOpen;
          setIsOpen(nextState);
          playUISound(nextState ? 'open' : 'close');
        }}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 8px 30px rgba(37,99,235,0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOpen ? 'rotate(90deg) scale(0.9)' : 'scale(1)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = isOpen ? 'rotate(90deg) scale(0.95)' : 'scale(1.08)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = isOpen ? 'rotate(90deg) scale(0.9)' : 'scale(1)'}
      >
        {isOpen ? <X style={{ width: 24, height: 24 }} /> : <MessageSquare style={{ width: 24, height: 24 }} />}
      </button>

      {/* Expanded Chat Box Widget */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            width: '380px',
            height: '520px',
            borderRadius: '20px',
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 99999,
            animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Header */}
          <div 
            style={{ 
              padding: '16px 20px', 
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
              color: '#ffffff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              boxShadow: '0 4px 12px rgba(29,78,216,0.15)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                  <Sparkles style={{ width: 18, height: 18, color: '#93c5fd' }} />
                </div>
                <span style={{ position: 'absolute', bottom: -2, right: -2, width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', border: '2px solid #2563eb' }}></span>
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>HR Assistant AI</div>
                <div style={{ fontSize: '0.7rem', color: '#93c5fd', fontWeight: 600 }}>En ligne / Active</div>
              </div>
            </div>
            <button 
              onClick={() => { setIsOpen(false); playUISound('close'); }}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
            >
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>

          {/* Messages Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: isDark ? '#0f172a' : '#f8fafc' }}>
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div key={msg.id} style={{ display: 'flex', gap: '8px', alignSelf: isBot ? 'flex-start' : 'flex-end', maxWidth: '85%' }}>
                  {isBot && (
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Bot style={{ width: 14, height: 14, color: '#2563eb' }} />
                    </div>
                  )}
                  <div>
                    <div 
                      style={{ 
                        padding: '10px 14px', 
                        borderRadius: isBot ? '14px 14px 14px 4px' : '14px 14px 4px 14px', 
                        backgroundColor: isBot ? (isDark ? '#1e293b' : '#ffffff') : '#2563eb', 
                        color: isBot ? (isDark ? '#f1f5f9' : '#1e293b') : '#ffffff',
                        border: isBot ? `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}` : 'none',
                        fontSize: '0.85rem',
                        lineHeight: '1.45',
                        whiteSpace: 'pre-line',
                        boxShadow: isBot ? '0 2px 8px rgba(0,0,0,0.03)' : 'none'
                      }}
                    >
                      {msg.text}
                    </div>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px', textAlign: isBot ? 'left' : 'right' }}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot style={{ width: 14, height: 14, color: '#2563eb' }} />
                </div>
                <div style={{ padding: '10px 18px', borderRadius: '14px 14px 14px 4px', backgroundColor: isDark ? '#1e293b' : '#ffffff', border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb', animation: 'bounce 0.8s infinite alternate' }}></div>
                  <div className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb', animation: 'bounce 0.8s infinite alternate 0.2s' }}></div>
                  <div className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb', animation: 'bounce 0.8s infinite alternate 0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div style={{ padding: '8px 12px', background: isDark ? '#1e293b' : '#ffffff', borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, display: 'flex', gap: '8px', overflowX: 'auto', flexShrink: 0 }}>
            {quickPrompts.map((chip, idx) => (
              <button 
                key={idx}
                onClick={() => handleSend(chip.val)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
                  background: isDark ? '#0f172a' : '#f8fafc',
                  color: isDark ? '#94a3b8' : '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.color = '#2563eb';
                  e.currentTarget.style.background = 'rgba(37,99,235,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isDark ? '#475569' : '#cbd5e1';
                  e.currentTarget.style.color = isDark ? '#94a3b8' : '#64748b';
                  e.currentTarget.style.background = isDark ? '#0f172a' : '#f8fafc';
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input Box Footer */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(inputVal); }}
            style={{ 
              padding: '12px 16px', 
              background: isDark ? '#0f172a' : '#ffffff', 
              borderTop: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`, 
              display: 'flex', 
              gap: '10px', 
              alignItems: 'center' 
            }}
          >
            <input 
              type="text"
              placeholder={i18n.language === 'fr' ? "Poser une question..." : "Ask a question..."}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                fontSize: '0.85rem',
                borderRadius: '10px',
                border: `1.5px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                color: isDark ? '#f1f5f9' : '#0f172a',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <button 
              type="submit"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(37,99,235,0.2)'
              }}
            >
              <Send style={{ width: 16, height: 16 }} />
            </button>
          </form>
        </div>
      )}

      {/* Embedded CSS animations for slideUp and bounce */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}
