import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Loader, MessageSquare, Sparkles, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIHelperProps {
  studentName: string;
  onClose: () => void;
}

const renderFormatted = (text: string) => {
  // Handle fenced code blocks ```lang\n...```
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(?:([a-zA-Z0-9_-]+)\n)?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const [full, lang, code] = match;
    const idx = match.index;
    if (idx > lastIndex) {
      parts.push(text.slice(lastIndex, idx));
    }
    parts.push(
      <pre key={idx} className="bg-gray-100 p-3 rounded-md overflow-auto text-xs my-2">
        <code>{code}</code>
      </pre>
    );
    lastIndex = idx + full.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  // Now for each non-code chunk, handle inline formatting and line breaks
  const renderChunk = (chunk: string, keyBase: number) => {
    // split by inline code first
    const inlineCodeRegex = /(`+)(.+?)\1/gs;
    const segments: React.ReactNode[] = [];
    let cursor = 0;
    let mi: RegExpExecArray | null;
    let segIdx = 0;
    while ((mi = inlineCodeRegex.exec(chunk)) !== null) {
      const [full, ticks, code] = mi;
      const i = mi.index;
      if (i > cursor) segments.push(chunk.slice(cursor, i));
      segments.push(<code key={`${keyBase}-${segIdx++}`} className="bg-gray-100 px-1 rounded text-xs">{code}</code>);
      cursor = i + full.length;
    }
    if (cursor < chunk.length) segments.push(chunk.slice(cursor));

    // Further replace bold and italics within text nodes
    return segments.map((seg, i) => {
      if (typeof seg !== 'string') return <React.Fragment key={`${keyBase}-seg-${i}`}>{seg}</React.Fragment>;
      const withFormatting: React.ReactNode[] = [];
      // bold **text**
      const boldRegex = /\*\*(.+?)\*\*/g;
      let bLast = 0;
      let bm: RegExpExecArray | null;
      let bidx = 0;
      while ((bm = boldRegex.exec(seg)) !== null) {
        const [bf, boldText] = bm;
        const bi = bm.index;
        if (bi > bLast) withFormatting.push(seg.slice(bLast, bi));
        withFormatting.push(<strong key={`${keyBase}-b-${bidx++}`}>{boldText}</strong>);
        bLast = bi + bf.length;
      }
      if (bLast < seg.length) withFormatting.push(seg.slice(bLast));

      // if nothing matched for bold, try italics on the original seg
      if (withFormatting.length === 1 && typeof withFormatting[0] === 'string') {
        const s = withFormatting[0] as string;
        const italicsRegex = /\*(.+?)\*/g;
        const out: React.ReactNode[] = [];
        let iLast = 0;
        let im: RegExpExecArray | null;
        let iidx = 0;
        while ((im = italicsRegex.exec(s)) !== null) {
          const [ifull, itext] = im;
          const ii = im.index;
          if (ii > iLast) out.push(s.slice(iLast, ii));
          out.push(<em key={`${keyBase}-i-${iidx++}`}>{itext}</em>);
          iLast = ii + ifull.length;
        }
        if (iLast < s.length) out.push(s.slice(iLast));
        return <React.Fragment key={`${keyBase}-fmt-${i}`}>{out}</React.Fragment>;
      }

      return <React.Fragment key={`${keyBase}-fmt-${i}`}>{withFormatting}</React.Fragment>;
    });
  };

  // Flatten parts and render with line breaks
  const rendered: React.ReactNode[] = [];
  parts.forEach((p, idx) => {
    if (typeof p === 'string') {
      // split on newlines, preserve blanks
      const lines = p.split(/\n/);
      lines.forEach((ln, i) => {
        if (ln === '') rendered.push(<br key={`br-${idx}-${i}`} />);
        else rendered.push(<React.Fragment key={`txt-${idx}-${i}`}>{renderChunk(ln, idx * 100 + i)}</React.Fragment>);
        if (i < lines.length - 1) rendered.push(<br key={`nl-${idx}-${i}`} />);
      });
    } else {
      rendered.push(p);
    }
  });

  return <div className="prose prose-sm max-w-none break-words">{rendered}</div>;
};

const AIHelper: React.FC<AIHelperProps> = ({ studentName, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello ${studentName}! I'm your AI study assistant. I can help you with homework questions, explain concepts, provide study tips, and more. How can I assist you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Persist conversation in localStorage so closing/reopening modal doesn't reset it
  const [storageKey] = useState(() => {
    try {
      const raw = localStorage.getItem('loggedUser');
      if (raw) {
        const u = JSON.parse(raw);
        const id = u.id || u.admission_id || u.admissionId || u.teacher_id || u.email || u.name;
        if (id) return `ai_convo_${String(id).replace(/\s+/g, '_')}`;
      }
    } catch {
      // ignore
    }
    return `ai_convo_${studentName.replace(/\s+/g, '_')}`;
  });

  // debug: show which storage key we're using (helps trace unexpected clears/resets)
  useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.debug('[AIHelper] using storageKey=', storageKey);
    } catch (e) {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      // debug
      // eslint-disable-next-line no-console
      console.debug('[AIHelper] restore from', storageKey, raw ? 'FOUND' : 'EMPTY');
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ role: string; content: string; timestamp: string }>;
        const restored: Message[] = parsed.map((m) => ({
          role: m.role as Message['role'],
          content: m.content,
          timestamp: new Date(m.timestamp),
        }));
        setMessages(restored);
      }
    } catch (e) {
      // ignore and keep default
    }
    // focus input after loading
    inputRef.current?.focus();
    // only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const toStore = messages.map((m) => ({ role: m.role, content: m.content, timestamp: m.timestamp.toISOString() }));
      // debug
      // eslint-disable-next-line no-console
      console.debug('[AIHelper] write to', storageKey, 'entries=', toStore.length);
      localStorage.setItem(storageKey, JSON.stringify(toStore));
    } catch (e) {
      // ignore storage errors
    }
  }, [messages, storageKey]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyAUB2ppBC7_Lj_z8rpJbzhgx99m7rB-yYE`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a helpful AI study assistant for students. Your role is to help with homework, explain concepts clearly, provide study tips, and encourage learning. Keep responses concise, friendly, and educational. Student's question: ${userMessage.content}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I'm sorry, I couldn't generate a response. Please try again.";

      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Helper Error:', error);
      toast.error('Failed to get AI response. Please try again.');

      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const refreshConversation = () => {
    const initial: Message = {
      role: 'assistant',
      content: `Hello ${studentName}! I'm your AI study assistant. I can help you with homework questions, explain concepts, provide study tips, and more. How can I assist you today?`,
      timestamp: new Date(),
    };
    setMessages([initial]);
    try {
      // instead of removing the key, explicitly write the initial conversation so it's deterministic
      localStorage.setItem(storageKey, JSON.stringify([{ role: initial.role, content: initial.content, timestamp: initial.timestamp.toISOString() }]));
      // debug
      // eslint-disable-next-line no-console
      console.debug('[AIHelper] refreshed conversation stored to', storageKey);
    } catch (e) {}
    inputRef.current?.focus();
    toast.success('Conversation refreshed');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden"
      >
        {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                AI Study Assistant
                <Sparkles className="w-4 h-4" />
              </h3>
              <p className="text-xs text-white/80">Powered by Google Gemini</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshConversation}
              title="Refresh"
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white shadow-md border border-gray-200'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-gray-600">AI Assistant</span>
                  </div>
                )}
                <div className={`text-sm whitespace-pre-wrap ${
                  message.role === 'user' ? 'text-white' : 'text-gray-800'
                }`}>
                  {message.role === 'assistant' ? (
                    // render lightweight formatting for AI responses
                    renderFormatted(message.content)
                  ) : (
                    // user messages remain plain text
                    <span>{message.content}</span>
                  )}
                </div>
                <p className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-white/70' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white shadow-md border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your studies..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AIHelper;
