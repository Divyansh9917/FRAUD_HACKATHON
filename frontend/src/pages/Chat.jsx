import { useState, useEffect, useRef } from "react";
import axios from "axios";

const Chat = () => {
  // 1. DYNAMIC SESSION: Generates a unique ID so every chat is isolated
  const [sessionId] = useState(() => {
    const saved = localStorage.getItem('current_chat_id');
    if (saved) return saved;
    // Native JS generator (No npm install required)
    const newId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('current_chat_id', newId);
    return newId;
  });

  const [messages, setMessages] = useState([]);
  const [intel, setIntel] = useState({});
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef();
  const chatContainerRef = useRef();

  // 2. DATA SYNC: Polling the Express backend for updates
  const updateChat = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/history/${sessionId}`);
      // Only update state if data has actually changed to prevent unnecessary re-renders
      if (JSON.stringify(res.data.history) !== JSON.stringify(messages)) {
        setMessages(res.data.history || []);
        setIntel(res.data.extractedIntelligence || {});
      }
    } catch (err) {
      console.log("Syncing...");
    }
  };

  useEffect(() => {
    updateChat();
    const interval = setInterval(updateChat, 3000); // Background sync
    return () => clearInterval(interval);
  }, [sessionId, messages]);

  // 3. SMART AUTO-SCROLL: Only jumps to bottom if you are already looking at latest messages
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      const { scrollHeight, scrollTop, clientHeight } = container;
      // If user is within 150px of bottom, auto-scroll to new message
      const isNearBottom = scrollHeight - scrollTop <= clientHeight + 150;
      
      if (isNearBottom || messages.length <= 1) {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages.length]); 

  // 4. OPTIMISTIC SEND: Instant UI update to remove network lag
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const val = input;
    setInput(""); // Clear immediately for snappy feel
    setIsTyping(true);

    // Add user message to UI immediately
    const optimisticMsg = { 
      sender: 'user', 
      text: val, 
      timestamp: Date.now() 
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      // Background request to Express -> Vercel AI Agent
      await axios.post('http://localhost:5000/api/messages', { 
        sessionId, 
        message: val 
      });
      updateChat(); 
    } catch (err) {
      console.error("Send failed");
    } finally {
      setIsTyping(false);
    }
  };

  const startNewChat = () => {
    localStorage.removeItem('current_chat_id');
    window.location.reload(); // Generates fresh ID
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col border-r border-slate-800">
        <header className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-emerald-500 font-bold tracking-tight">🛡️ BAAT CHIT SHIELD</span>
          </div>
          <button 
            onClick={startNewChat} 
            className="text-[10px] uppercase bg-slate-800 px-3 py-1.5 rounded-md hover:bg-slate-700 transition-all border border-slate-700"
          >
            + New Session
          </button>
        </header>

        {/* MESSAGES CONTAINER */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950 custom-scrollbar"
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3.5 rounded-2xl max-w-[80%] shadow-md ${
                m.sender === 'user' 
                ? 'bg-emerald-600 rounded-br-none' 
                : 'bg-slate-800 border border-slate-700 rounded-bl-none'
              }`}>
                <p className="text-sm leading-relaxed">{m.text}</p>
                <span className="text-[8px] opacity-40 mt-1 block text-right">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {isTyping && <div className="text-xs text-emerald-500 animate-pulse font-mono">Agent analyzing scammer tactics...</div>}
          <div ref={scrollRef} />
        </div>

        {/* INPUT AREA */}
        <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-slate-800 flex gap-3">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            className="flex-1 bg-slate-800 p-3 rounded-xl border border-slate-700 outline-none focus:border-emerald-500 transition-all" 
            placeholder="Message scammer..." 
          />
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg active:scale-95">
            Send
          </button>
        </form>
      </div>

      {/* INTELLIGENCE SIDEBAR */}
      <div className="w-80 bg-slate-950 p-6 hidden lg:block overflow-y-auto border-l border-slate-800">
        <h2 className="text-emerald-500 text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
          <span>Analysis Findings</span>
          <span className="h-px flex-1 bg-slate-800"></span>
        </h2>
        
        <div className="space-y-5">
          <FindingCard label="UPI IDs Found" data={intel.upiIds} color="emerald" />
          <FindingCard label="Phishing Links" data={intel.phishingLinks} color="red" />
          <FindingCard label="Bank Accounts" data={intel.bankAccounts} color="blue" />
        </div>

        <div className="mt-8 p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Session Tracking</p>
          <p className="text-[9px] font-mono text-slate-500 break-all">{sessionId}</p>
        </div>
      </div>
    </div>
  );
};

// COMPONENT: Individual Finding Item
const FindingCard = ({ label, data, color }) => (
  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 transition-colors">
    <p className="text-slate-400 text-[10px] font-bold uppercase mb-2">{label}</p>
    {data && data.length > 0 ? (
      <div className="space-y-1.5">
        {data.map((item, idx) => (
          <div key={idx} className={`text-xs font-mono break-all py-1 px-2 rounded bg-slate-950/50 text-${color}-400 border border-slate-800`}>
            {item}
          </div>
        ))}
      </div>
    ) : (
      <p className="text-slate-700 text-xs italic">Scanning patterns...</p>
    )}
  </div>
);

export default Chat; // Critical: App.jsx needs this default export