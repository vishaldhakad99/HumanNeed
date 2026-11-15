import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ShoppingBag,
  ExternalLink,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
} from 'lucide-react';

export const AIAssistantDrawer = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Namaste! I am your HumanNeed AI Shopping Assistant. How can I help you discover products, compare deals, or check store policies today?',
      followUps: [
        'Top trending gadgets',
        'Products under ₹1000',
        'How does 7-day return work?',
        'Do you offer free delivery?',
      ],
      products: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Voice speech recognition for chat
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  const handleSend = async (messageText = null) => {
    const query = (messageText || input).trim();
    if (!query || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: query });
      if (res.data) {
        const botMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: res.data.message,
          products: res.data.products || [],
          followUps: res.data.followUps || [],
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Sorry, I am having trouble connecting to the catalog right now. Please try again or browse directly through our Shop page.',
        products: [],
        followUps: ['Browse Shop Catalog', 'Check Delivery Time'],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-slide-left">
        {/* Drawer Header */}
        <div className="p-4 bg-gradient-to-r from-brand-navy to-slate-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-royal flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 text-brand-orange animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">HumanNeed AI</h3>
                <span className="bg-brand-orange/20 text-brand-orange border border-brand-orange/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Assistant
                </span>
              </div>
              <p className="text-[11px] text-slate-300">Instant shopping help & product discovery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-brand-royal text-white flex items-center justify-center shrink-0 text-xs shadow-sm">
                  <Bot className="w-4 h-4 text-brand-orange" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-subtle ${
                  msg.sender === 'user'
                    ? 'bg-brand-royal text-white rounded-br-none'
                    : 'bg-white text-brand-dark border border-slate-200 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {/* Display matched database products if any */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Recommended Matches:
                    </p>
                    {msg.products.map((prod) => (
                      <Link
                        key={prod._id}
                        to={`/product/${prod.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-2.5 p-2 bg-slate-50 hover:bg-brand-royal-light rounded-xl border border-slate-200 transition-colors group"
                      >
                        <img
                          src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                          alt={prod.title}
                          className="w-10 h-10 object-cover rounded-lg bg-white shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-brand-dark group-hover:text-brand-royal truncate text-xs">
                            {prod.title}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] mt-0.5">
                            <span className="font-bold text-brand-royal">₹{prod.discountPrice}</span>
                            {prod.price > prod.discountPrice && (
                              <span className="text-slate-400 line-through text-[10px]">₹{prod.price}</span>
                            )}
                            <span className="text-amber-500 font-medium">★ {prod.ratingsAverage}</span>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-royal shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}

                {/* Follow-up recommendation chips */}
                {msg.followUps && msg.followUps.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {msg.followUps.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(chip)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-brand-royal/10 hover:text-brand-royal text-slate-600 rounded-full text-[10px] font-medium transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 items-center text-slate-400 text-xs">
              <div className="w-8 h-8 rounded-full bg-brand-royal text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-brand-orange animate-pulse" />
              </div>
              <div className="bg-white px-4 py-2.5 rounded-2xl rounded-bl-none border border-slate-200 flex items-center gap-2 shadow-subtle">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-royal" />
                <span>Searching HumanNeed catalog...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={isListening ? 'Listening... Speak now...' : 'Ask about products, deals, returns...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-royal focus:ring-1 focus:ring-brand-royal"
              />
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`absolute right-2 top-2 p-1 rounded-lg transition-colors ${
                  isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-brand-royal'
                }`}
                title="Voice Search"
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-brand-royal hover:bg-brand-royal-hover disabled:bg-slate-200 text-white rounded-xl transition-colors shadow-sm shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantDrawer;
