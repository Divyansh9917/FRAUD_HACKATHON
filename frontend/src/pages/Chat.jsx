import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const SESSION_ID = "hackathon-session";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef();

  const fetchHistory = async () => {
    try {
      // Changed to exact backend port 5000
      const res = await axios.get(`http://localhost:5000/api/history/${SESSION_ID}`);
      setMessages(res.data || []);
    } catch (err) {
      console.log("Polling error (Server might be down)");
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const msgText = input;
    setInput("");

    try {
      await axios.post('http://localhost:5000/api/messages', {
        sessionId: SESSION_ID,
        message: msgText,
        sender: 'user'
      });
      fetchHistory();
    } catch (err) {
      
      alert("Backend offline! Please check your terminal for nodemon errors.");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200">
      <header className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between">
        <span className="font-bold text-emerald-500">🛡️ Honey-Pot Active</span>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-emerald-600' : 'bg-slate-800'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-slate-800 rounded-lg px-4 outline-none"
          placeholder="Type message..."
        />
        <button type="submit" className="bg-emerald-600 px-6 py-2 rounded-lg font-bold">Send</button>
      </form>
    </div>
  );
};

export default Chat;