import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-emerald-400">
      <h1 className="text-6xl font-bold mb-6 tracking-tight">Baat Chit 🌿</h1>
      <p className="text-slate-400 text-xl mb-10">Agentic Honey-Pot for Scam Intelligence</p>
      <button 
        onClick={() => navigate('/chat')}
        className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20"
      >
        Launch Secure Chat
      </button>
    </div>
  );
};

export default Home;