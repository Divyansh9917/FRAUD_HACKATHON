import { useState, useEffect, useRef } from "react";
import axios from "axios";

// Use the Vercel URL from environment variables
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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

  const update = async () => {
    try {
      // Calling the DEPLOYED backend URL
      const res = await axios.get(`${BACKEND_URL}/api/history/${sessionId}`);
      setMessages(res.data.history || []);
      setIntel(res.data.extractedIntelligence || {});
    } catch (e) { console.error("Sync error"); }
  };

  useEffect(() => {
    update();
    const i = setInterval(update, 3000);
    return () => clearInterval(i);
  }, [sessionId]);

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
    // ... rest of your UI code from previous turns ...
    <div>UI Code Here</div>
  );
};

export default Chat;