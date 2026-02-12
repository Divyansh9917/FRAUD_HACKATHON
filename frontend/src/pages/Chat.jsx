import { useState, useEffect, useRef } from "react";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const Chat = () => {
  const [sessionId] = useState(() => {
    const saved = localStorage.getItem('chat_id');
    if (saved) return saved;
    const newId = `session-${Date.now()}`;
    localStorage.setItem('chat_id', newId);
    return newId;
  });

  const [messages, setMessages] = useState([]);
  const [intel, setIntel] = useState({});
  const [input, setInput] = useState("");
  const scrollRef = useRef();
  const chatContainerRef = useRef();

  const update = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/history/${sessionId}`);
      if (JSON.stringify(res.data.history) !== JSON.stringify(messages)) {
        setMessages(res.data.history || []);
        setIntel(res.data.extractedIntelligence || {});
      }
    } catch (e) { console.log("Sync..."); }
  };

  useEffect(() => {
    update();
    const i = setInterval(update, 3000);
    return () => clearInterval(i);
  }, [sessionId, messages]);

  // Smart Scroll
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;
      if (isNearBottom || messages.length <= 1) {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const val = input; setInput("");
    
    // Optimistic Update
    setMessages(prev => [...prev, { sender: 'user', text: val, timestamp: Date.now() }]);
    
    await axios.post(`${BACKEND_URL}/api/messages`, { sessionId, message: val });
    update();
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <div className="flex-1 flex flex-col border-r border-slate-800">
        <header className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between">
          <span className="text-emerald-500 font-bold">🛡️ Baat Chit Shield</span>
          <button onClick={() => { localStorage.removeItem('chat_id'); window.location.reload(); }} className="text-xs bg-slate-800 px-2 py-1 rounded">+ New</button>
        </header>
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-xl max-w-xs ${m.sender === 'user' ? 'bg-emerald-600' : 'bg-slate-800'}`}>{m.text}</div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
        <form onSubmit={send} className="p-4 bg-slate-900 flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} className="flex-1 bg-slate-800 p-2 rounded-lg outline-none" />
          <button className="bg-emerald-600 px-4 rounded-lg font-bold">Send</button>
        </form>
      </div>
      <div className="w-80 bg-slate-900 p-6 hidden lg:block overflow-y-auto">
        <h2 className="text-emerald-500 font-bold mb-4">Findings</h2>
        <div className="space-y-4 text-xs">
          <Finding label="UPI IDs" data={intel.upiIds} color="emerald" />
          <Finding label="Phishing Links" data={intel.phishingLinks} color="red" />
          <Finding label="Bank Accounts" data={intel.bankAccounts} color="blue" />
        </div>
      </div>
    </div>
  );
};

const Finding = ({ label, data, color }) => (
  <div className="bg-slate-800 p-3 rounded-lg">
    <p className="text-slate-500">{label}</p>
    <p className={`text-${color}-400 font-mono break-all`}>{data?.join(', ') || 'Scanning...'}</p>
  </div>
);

export default Chat;