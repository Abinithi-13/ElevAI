import { useEffect, useRef, useState } from 'react';
import { Bot, Eraser, Send, User } from 'lucide-react';
import api, { getErrorMessage } from '../../api/client.js';
import useApi from '../../hooks/useApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Spinner } from '../../components/Spinner.jsx';

const SUGGESTIONS = [
  'Why do elevator doors keep reopening?',
  'What should I do if I am stuck in an elevator?',
  'How often should preventive maintenance be done?',
  'What causes a jerky start in a traction elevator?',
];

export default function Assistant() {
  const status = useApi('/ai/status');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottom = useRef(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    const history = [...messages.filter((m) => !m.error), { role: 'user', content }];
    setMessages([...messages, { role: 'user', content }]);
    setInput('');
    setSending(true);
    try {
      const res = await api.post('/ai/chat', { messages: history.slice(-12).map(({ role, content: c }) => ({ role, content: c })) });
      setMessages((m) => [...m, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: getErrorMessage(err), error: true }]);
    } finally {
      setSending(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <PageHeader title="AI assistant" subtitle="Ask about elevator maintenance, fault causes and troubleshooting." actions={messages.length > 0 && <button className="btn-secondary" onClick={() => setMessages([])}><Eraser size={16} /> Clear chat</button>} />
      {status.data && !status.data.configured && (
        <div role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">The AI service is not configured on the server. Add GEMINI_API_KEY to backend/.env and restart the backend to enable the assistant.</div>
      )}
      <div className="card flex h-[calc(100vh-15rem)] min-h-[420px] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" aria-live="polite">
          {messages.length === 0 && (
            <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><Bot size={28} /></div>
              <h2 className="text-lg font-bold">How can I help with your elevators?</h2>
              <p className="mt-1 text-sm text-navy-500">I can explain faults, suggest safe checks and describe what a technician would look at. For emergencies, contact your building control room.</p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-lg border border-navy-200 px-3 py-2 text-left text-sm text-navy-700 hover:border-brand-400 hover:bg-brand-50/50">{s}</button>)}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.role === 'user' ? 'bg-navy-800 text-white' : 'bg-brand-100 text-brand-700'}`}>{m.role === 'user' ? <User size={16} /> : <Bot size={16} />}</div>
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'bg-navy-800 text-white' : m.error ? 'border border-red-200 bg-red-50 text-red-700' : 'bg-navy-50 text-navy-800'}`}>{m.content}</div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-3" role="status">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700"><Bot size={16} /></div>
              <div className="flex items-center gap-2 rounded-2xl bg-navy-50 px-4 py-2.5 text-sm text-navy-500"><Spinner size={14} /> Thinking...</div>
            </div>
          )}
          <div ref={bottom} />
        </div>
        <div className="border-t border-navy-100 p-3 sm:p-4">
          <div className="flex items-end gap-2">
            <textarea className="input max-h-32 min-h-[44px] resize-none" rows={1} maxLength={2000} placeholder="Ask a maintenance question... (Enter to send)" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} aria-label="Message" />
            <button className="btn-primary h-11" onClick={() => send()} disabled={sending || !input.trim()} aria-label="Send message"><Send size={18} /></button>
          </div>
          <p className="mt-2 text-xs text-navy-400">AI guidance can be wrong. Never attempt repairs yourself; always use a licensed technician.</p>
        </div>
      </div>
    </>
  );
}
