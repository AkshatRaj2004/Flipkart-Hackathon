import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Bot, User } from 'lucide-react';
import { Panel } from '../components/ui/KPICard';
import { copilotQuery } from '../services/api';
import type { CopilotResponse } from '../types';

const SUGGESTIONS = [
  'Which zones are most congested?',
  'Why is Koramangala high risk?',
  'What incidents are affecting Whitefield?',
  "Predict tomorrow's hotspots",
  'Recommend resource allocation',
];

interface Message { role: 'user' | 'assistant'; content: string; data?: CopilotResponse }

export default function Copilot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (query: string) => {
    if (!query.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setInput('');
    setLoading(true);
    try {
      const res = await copilotQuery(query);
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer, data: res }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error processing your request.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4 h-[calc(100vh-120px)] flex flex-col">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-accent-cyan" /> TrafficWise AI Copilot
        </h2>
        <p className="text-sm text-slate-400 mt-1">Natural language traffic intelligence assistant</p>
      </motion.div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => send(s)}
            className="px-3 py-1.5 text-xs rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-accent-cyan hover:border-accent-cyan/30 transition-colors">
            {s}
          </button>
        ))}
      </div>

      <Panel className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4 p-2">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Bot className="w-12 h-12 mb-3 text-accent-cyan/30" />
              <p className="text-sm">Ask me anything about Bengaluru traffic operations</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && <Bot className="w-5 h-5 text-accent-cyan shrink-0 mt-1" />}
              <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                msg.role === 'user' ? 'bg-accent-cyan/20 text-white' : 'bg-white/5 text-slate-300'
              }`}>
                <p>{msg.content}</p>
                {msg.data?.reasoning && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Reasoning</p>
                    {msg.data.reasoning.map((r, j) => <p key={j} className="text-[10px] text-slate-500">› {r}</p>)}
                  </div>
                )}
                {msg.data?.supporting_data != null && (
                  <pre className="mt-2 p-2 rounded bg-black/30 text-[10px] text-slate-400 overflow-x-auto max-h-32">
                    {JSON.stringify(msg.data.supporting_data, null, 2)}
                  </pre>
                )}
              </div>
              {msg.role === 'user' && <User className="w-5 h-5 text-slate-400 shrink-0 mt-1" />}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <Bot className="w-5 h-5 text-accent-cyan shrink-0" />
              <div className="bg-white/5 p-3 rounded-xl text-sm text-slate-400 animate-pulse">Analyzing traffic data...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2 p-2 border-t border-white/10">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send(input)}
            placeholder="Ask about traffic conditions, predictions, or resources..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent-cyan/50" />
          <button onClick={() => send(input)} disabled={loading}
            className="px-4 py-2.5 bg-accent-cyan/20 border border-accent-cyan/40 text-accent-cyan rounded-lg hover:bg-accent-cyan/30 transition-colors disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </Panel>
    </div>
  );
}
