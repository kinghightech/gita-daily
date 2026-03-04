// @ts-nocheck
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, History, Loader2, Plus, Send, Trash2, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const AI_AVATAR = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69693b41fa30602fd8425699/89ba518a1_IMG_1456.jpg";

export default function HinduAI({ user }) {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([
  {
    role: 'assistant',
    content: `🙏 Namaste! I can answer your questions about:

• **Anything related to Hinduism**
• **Hindu philosophy** - Vedanta, Yoga, Dharma, and more

What would you like to learn about today?`
  }]
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadConversations();
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    const userData = await base44.auth.me();
    setUserProfile(userData);
  };

  const loadConversations = async () => {
    const convs = await base44.entities.AIConversation.filter({ user_email: user.email }, '-created_date');
    setConversations(convs);
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const saveConversation = async (newMessages) => {
    if (currentConversation) {
      await base44.entities.AIConversation.update(currentConversation.id, {
        messages: newMessages,
        title: newMessages.find((m) => m.role === 'user')?.content?.slice(0, 50) || 'Conversation'
      });
    } else if (newMessages.filter((m) => m.role === 'user').length > 0) {
      const conv = await base44.entities.AIConversation.create({
        user_email: user.email,
        title: newMessages.find((m) => m.role === 'user')?.content?.slice(0, 50) || 'Conversation',
        messages: newMessages
      });
      setCurrentConversation(conv);
      loadConversations();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage, timestamp: new Date().toISOString() }];
    setMessages(newMessages);
    setIsLoading(true);

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a knowledgeable and respectful Hindu wisdom guide. You ONLY answer questions related to Hinduism, Hindu philosophy, Hindu scriptures, Hindu deities, Hindu practices, Hindu festivals, Hindu history, and related spiritual topics.

If the user asks something NOT related to Hinduism, politely redirect them by saying: "I specialize in Hindu wisdom and teachings. Please ask me about Hindu philosophy, scriptures, deities, practices, or spiritual concepts, and I'll be happy to help! 🙏"

Be warm, wise, and respectful. Use Sanskrit terms when appropriate but always explain them. Include relevant verses or teachings when helpful.

User's question: ${userMessage}

Provide a helpful, accurate response about Hinduism:`,
      add_context_from_internet: true
    });

    const finalMessages = [...newMessages, { role: 'assistant', content: response, timestamp: new Date().toISOString() }];
    setMessages(finalMessages);
    await saveConversation(finalMessages);
    setIsLoading(false);
  };

  const loadConversation = (conv) => {
    setCurrentConversation(conv);
    setMessages(conv.messages || []);
    setShowHistory(false);
  };

  const startNewConversation = () => {
    setCurrentConversation(null);
    setMessages([{
      role: 'assistant',
      content: `🙏 Namaste! I am your Hindu wisdom guide. What would you like to learn about today?`
    }]);
    setShowHistory(false);
  };

  const deleteConversation = async (convId, e) => {
    e.stopPropagation();
    await base44.entities.AIConversation.delete(convId);
    if (currentConversation?.id === convId) {
      startNewConversation();
    }
    loadConversations();
  };

  const suggestedQuestions = [
  "What is the meaning of Om?",
  "Explain the concept of Karma",
  "Who is Lord Ganesha?",
  "What are the Vedas?"];


  if (showHistory) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-slate-900/95 to-indigo-950/95 rounded-2xl border border-amber-400/20 overflow-hidden">
                <div className="p-4 border-b border-amber-400/20 bg-gradient-to-r from-amber-900/30 via-orange-900/30 to-amber-900/30 flex items-center gap-3">
                    <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(false)}
            className="text-amber-300 hover:bg-amber-500/20">

                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <h3 className="font-serif text-amber-100 font-medium text-lg">Chat History</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {conversations.length === 0 ?
          <p className="text-amber-300/60 text-center py-8">No past conversations</p> :

          conversations.map((conv) =>
          <div
            key={conv.id}
            onClick={() => loadConversation(conv)}
            className="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer border border-amber-400/10 flex items-center justify-between">

                                <div>
                                    <p className="text-amber-100 text-sm truncate">{conv.title || 'Conversation'}</p>
                                    <p className="text-amber-300/50 text-xs">
                                        {new Date(conv.created_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <Button
              variant="ghost"
              size="icon"
              onClick={(e) => deleteConversation(conv.id, e)}
              className="text-red-400/50 hover:text-red-400 hover:bg-red-500/20">

                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
          )
          }
                </div>
                <div className="p-4 border-t border-amber-400/20">
                    <Button
            onClick={startNewConversation}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900">

                        <Plus className="w-4 h-4 mr-2" />
                        New Conversation
                    </Button>
                </div>
            </div>);

  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900/95 to-indigo-950/95 rounded-2xl border border-amber-400/20 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-amber-400/20 bg-gradient-to-r from-amber-900/30 via-orange-900/30 to-amber-900/30 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                src={AI_AVATAR}
                alt="HinduAI"
                className="w-12 h-12 rounded-full object-cover border-2 border-amber-400/50 shadow-lg" />

                            <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }} />

                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-serif text-amber-100 font-medium text-lg">HinduAI</h3>
                                
                            </div>
                            <p className="text-xs text-amber-300/60">Ask me anything about Hinduism</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHistory(true)}
              className="text-amber-300 hover:bg-amber-500/20">

                            <History className="w-5 h-5" />
                        </Button>
                        <Button
              variant="ghost"
              size="icon"
              onClick={startNewConversation}
              className="text-amber-300 hover:bg-amber-500/20">

                            <Plus className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4">

                <AnimatePresence>
                    {messages.map((message, index) =>
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>

                            {message.role === 'user' ?
            userProfile?.profile_picture ?
            <img
              src={userProfile.profile_picture}
              alt="You"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0" /> :


            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-white" />
                                    </div> :


            <img
              src={AI_AVATAR}
              alt="HinduAI"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0" />

            }
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
            message.role === 'user' ?
            'bg-blue-600 text-white' :
            'bg-slate-800/80 border border-amber-400/20'}`
            }>
                                {message.role === 'user' ?
              <p className="text-sm">{message.content}</p> :

              <div className="prose prose-sm prose-invert max-w-none">
                                        <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="text-amber-100/90 text-sm mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="text-amber-300">{children}</strong>,
                    ul: ({ children }) => <ul className="list-disc list-inside text-amber-100/80 text-sm space-y-1">{children}</ul>,
                    li: ({ children }) => <li>{children}</li>
                  }}>

                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
              }
                            </div>
                        </motion.div>
          )}
                </AnimatePresence>
                
                {isLoading &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-3">

                        <img
            src={AI_AVATAR}
            alt="HinduAI"
            className="w-8 h-8 rounded-full object-cover flex-shrink-0" />

                        <div className="bg-slate-800/80 border border-amber-400/20 rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2 text-amber-300/70">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Seeking wisdom...</span>
                            </div>
                        </div>
                    </motion.div>
        }
                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            {messages.length === 1 &&
      <div className="px-4 pb-2 flex-shrink-0">
                    <div className="flex flex-wrap gap-2">
                        {suggestedQuestions.map((q, i) =>
          <button
            key={i}
            onClick={() => setInput(q)}
            className="text-xs px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors">

                                {q}
                            </button>
          )}
                    </div>
                </div>
      }

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-amber-400/20 bg-gradient-to-b from-slate-900/95 to-indigo-950/95 flex-shrink-0">
                <div className="flex gap-2">
                    <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Hindu wisdom..."
            className="flex-1 bg-slate-800/50 border-amber-400/30 text-amber-100 placeholder:text-amber-300/40 focus:border-amber-400"
            disabled={isLoading} />

                    <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900">

                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </form>
        </div>);

}