import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, User as UserIcon, ShieldCheck } from "lucide-react";
import Layout from "../components/ui/Layout";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";
import { toast } from "../components/ui/Toast";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "model";
  text: string;
}

export default function Assistant() {
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "Hello! I am the Admin AI Assistant. I can help you query device registrations, audit logs, and user activity in English or Amharic. How can I assist you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    
    // Add user message to UI immediately
    const newMessages = [...messages, { role: "user" as const, text: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const formattedHistory = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const res = await api.adminAssistant(userText, formattedHistory);
      
      if (res.text) {
        setMessages([...newMessages, { role: "model", text: res.text }]);
      } else {
        toast.error("Received empty response from assistant.");
        setMessages([...newMessages, { role: "model", text: "I'm sorry, I couldn't generate a response." }]);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to communicate with assistant");
      setMessages([...newMessages, { role: "model", text: "An error occurred while processing your request. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <Layout>
        <div className="card p-8 text-center max-w-lg mx-auto mt-10">
          <ShieldCheck className="w-12 h-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Access Denied</h2>
          <p className="mt-2 text-neutral-500">You must be an administrator to access the AI Assistant.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col">
        <div className="mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">AI Assistant</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Live system query & analysis</p>
          </div>
        </div>

        <div className="flex-1 card flex flex-col overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-800">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-neutral-50/50 dark:bg-neutral-900/50"
          >
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 sm:gap-4 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  msg.role === "user" 
                    ? "bg-primary-600 text-white" 
                    : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-primary-600 dark:text-primary-400"
                }`}>
                  {msg.role === "user" ? <UserIcon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.role === "user" 
                    ? "bg-primary-600 text-white" 
                    : "bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-100 dark:border-neutral-700 markdown-body"
                }`}>
                  {msg.role === "model" ? (
                    <div className="markdown-body">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 sm:gap-4 max-w-[85%] mr-auto">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-primary-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-white dark:bg-neutral-800 text-neutral-800 border border-neutral-100 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                  <span className="text-sm text-neutral-500">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 sm:p-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
            <form 
              onSubmit={handleSubmit}
              className="flex items-center gap-2 max-w-4xl mx-auto relative"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about devices, logs, or users..."
                className="flex-1 min-w-0 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-neutral-100 transition-shadow"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-11 h-11 flex-shrink-0 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
            <div className="mt-2 text-center">
              <p className="text-[10px] text-neutral-400">AI Assistant can make mistakes. Check important info.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
