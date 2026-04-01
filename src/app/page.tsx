"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  GraduationCap,
  Loader2,
  Trash2,
  MapPin,
  DollarSign,
  School,
  GitCompare,
  BarChart3,
  BookOpen,
  Bot,
  User,
  Download,
  Sun,
  Moon,
  Settings,
  X,
  Monitor,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

interface ProviderInfo {
  id: string;
  name: string;
  models: string[];
  defaultModel: string;
}

const BUILTIN_PROVIDERS: ProviderInfo[] = [
  { id: "glm", name: "智谱 GLM", models: ["glm-4-plus", "glm-4-flash", "glm-4-long", "glm-4"], defaultModel: "glm-4-plus" },
  { id: "openai", name: "OpenAI GPT", models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "o4-mini"], defaultModel: "gpt-4o" },
  { id: "claude", name: "Claude", models: ["claude-sonnet-4-20250514", "claude-opus-4-20250514", "claude-haiku-4-20250514"], defaultModel: "claude-sonnet-4-20250514" },
  { id: "gemini", name: "Gemini", models: ["gemini-2.5-flash-preview-05-20", "gemini-2.5-pro-preview-05-06", "gemini-2.0-flash"], defaultModel: "gemini-2.5-flash-preview-05-20" },
  { id: "kimi", name: "Kimi (月之暗面)", models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k", "moonshot-v1-auto"], defaultModel: "moonshot-v1-auto" },
  { id: "openrouter", name: "OpenRouter", models: ["anthropic/claude-sonnet-4", "openai/gpt-4o", "google/gemini-2.5-flash-preview-05-20", "deepseek/deepseek-chat-v3"], defaultModel: "anthropic/claude-sonnet-4" },
  { id: "deepseek", name: "DeepSeek", models: ["deepseek-chat", "deepseek-reasoner"], defaultModel: "deepseek-chat" },
];

interface AppSettings {
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";
  maxResults: number;
  provider: string;
  model: string;
  apiKey: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  fontSize: "medium",
  maxResults: 30,
  provider: "glm",
  model: "glm-4-plus",
  apiKey: "",
};

const QUICK_QUESTIONS = [
  { text: "我是物理方向，想去上海读大学，有哪些选择？", icon: MapPin },
  { text: "帮我看看学费5000以下的本科院校", icon: DollarSign },
  { text: "青海大学有哪些专业在招生？", icon: School },
  { text: "比较一下复旦大学和上海交通大学", icon: GitCompare },
  { text: "有哪些城市的学校在青海招生最多？", icon: BarChart3 },
  { text: "藏文班有哪些学校和专业可以选？", icon: BookOpen },
];

const STORAGE_KEYS = {
  messages: "gaokao-messages",
  theme: "gaokao-theme",
  settings: "gaokao-settings",
};

function parseSuggestions(content: string): { text: string; suggestions: string[] } {
  const separator = "---SUGGESTIONS---";
  const idx = content.indexOf(separator);
  if (idx === -1) return { text: content, suggestions: [] };

  const text = content.slice(0, idx).trim();
  const suggestionsRaw = content.slice(idx + separator.length).trim();
  const suggestions = suggestionsRaw
    .split("\n")
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter((line) => line.length > 0);

  return { text, suggestions };
}

function getEffectiveTheme(theme: "light" | "dark" | "system"): "light" | "dark" {
  if (theme === "system") {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  }
  return theme;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEYS.messages);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
      const savedSettings = localStorage.getItem(STORAGE_KEYS.settings);
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      }
    } catch {}
    setMounted(true);
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
      } catch {}
    }
  }, [messages, mounted]);

  // Save settings to localStorage
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
      } catch {}
    }
  }, [settings, mounted]);

  // Apply theme
  useEffect(() => {
    if (!mounted) return;
    const effective = getEffectiveTheme(settings.theme);
    if (effective === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEYS.theme, settings.theme === "system" ? "" : settings.theme);
  }, [settings.theme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (mq.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings.theme]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      inputRef.current?.focus();
    }
  }, [loading, messages.length]);

  const sendMessage = useCallback(async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;

    const userMessage: Message = { role: "user", content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          provider: settings.provider,
          model: settings.model,
          apiKey: settings.apiKey,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages([...newMessages, { role: "assistant", content: `\u26a0\ufe0f ${data.error}` }]);
      } else {
        const { text: parsed, suggestions } = parseSuggestions(data.message);
        setMessages([...newMessages, { role: "assistant", content: parsed, suggestions }]);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "\u26a0\ufe0f 网络错误，请检查连接后重试。" },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.messages);
    } catch {}
  };

  const exportChat = () => {
    const lines = messages.map((m) => {
      const prefix = m.role === "user" ? "用户" : "助手";
      return `${prefix}: ${m.content}`;
    });
    const text = lines.join("\n\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `高考报考对话_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleThemeQuick = () => {
    const effective = getEffectiveTheme(settings.theme);
    setSettings((s) => ({ ...s, theme: effective === "dark" ? "light" : "dark" }));
  };

  const isDark = mounted && getEffectiveTheme(settings.theme) === "dark";
  const fontSizeClass = `text-size-${settings.fontSize}`;

  return (
    <div className={`flex flex-col h-[100dvh] bg-[#f8f9fb] dark:bg-[#0f172a] ${fontSizeClass}`}>
      {/* Header */}
      <header className="flex-shrink-0 border-b border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-[#1e293b] shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                青海高考报考教练
              </h1>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 tracking-wide">
                1342所院校 · 13764条数据 · 2025招生计划
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={exportChat}
                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                aria-label="导出对话"
                title="导出对话"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={toggleThemeQuick}
              className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all duration-200"
              aria-label="切换主题"
              title="切换主题"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
              aria-label="设置"
              title="设置"
            >
              <Settings className="w-4 h-4" />
            </button>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200"
                aria-label="清空对话"
                title="清空对话"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              {/* Hero */}
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/25 rotate-3">
                  <GraduationCap className="w-10 h-10 text-white -rotate-3" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-2 border-white dark:border-[#0f172a] flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">AI</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">
                高考选专业，从这里开始
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-10 text-center max-w-sm text-sm leading-relaxed">
                告诉我你的科目方向、想去的城市或感兴趣的专业，<br className="hidden sm:block" />
                我帮你从 <strong className="text-slate-700 dark:text-slate-300">1342所院校</strong> 中找到最合适的选择
              </p>

              {/* Quick Questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl">
                {QUICK_QUESTIONS.map((q, i) => {
                  const Icon = q.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => sendMessage(q.text)}
                      className="group text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-500/10 dark:hover:to-cyan-500/10 hover:border-blue-200 dark:hover:border-blue-500/30 transition-all duration-200 flex items-start gap-3"
                    >
                      <div className="mt-0.5 w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 flex items-center justify-center flex-shrink-0 transition-colors duration-200">
                        <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors duration-200" />
                      </div>
                      <span className="text-[13px] text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100 leading-snug transition-colors duration-200">
                        {q.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-8 justify-center">
                {["985/211标识", "宿舍口碑", "学费对比", "藏文班/民族班"].map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* API Key prompt */}
              {!settings.apiKey && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="mt-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-500/15 transition-all duration-200"
                >
                  <Settings className="w-3.5 h-3.5" />
                  请先点击这里配置 AI 模型和 API Key 后开始使用
                </button>
              )}
            </div>
          ) : (
            <div role="log" aria-live="polite" aria-label="对话记录" className="space-y-5">
              {messages.map((msg, i) => (
                <div key={i}>
                  <div
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-sm shadow-blue-500/20"
                          : "bg-slate-100 dark:bg-slate-700"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      )}
                    </div>
                    {/* Bubble */}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm shadow-blue-500/20"
                          : "bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 shadow-sm"
                      }`}
                    >
                      <div
                        className={`text-[13px] leading-relaxed ${
                          msg.role === "assistant" ? "prose prose-sm prose-slate dark:prose-invert max-w-none" : ""
                        }`}
                        dangerouslySetInnerHTML={{
                          __html:
                            msg.role === "assistant"
                              ? formatMarkdown(msg.content)
                              : escapeHtml(msg.content),
                        }}
                      />
                    </div>
                  </div>
                  {/* Suggestions */}
                  {msg.role === "assistant" && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 ml-11">
                      {msg.suggestions.map((s, j) => (
                        <button
                          key={j}
                          onClick={() => sendMessage(s)}
                          className="text-xs px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 hover:border-blue-300 dark:hover:border-blue-500/40 transition-all duration-200"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading skeleton */}
              {loading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mt-0.5">
                    <Bot className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-slate-700/80 rounded-2xl px-4 py-4 shadow-sm max-w-[70%]">
                    <div className="flex items-center gap-2 mb-3">
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                      <span className="text-xs text-slate-400 dark:text-slate-500">正在查询数据...</span>
                    </div>
                    <div className="space-y-2.5 animate-pulse">
                      <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full w-full" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full w-4/5" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full w-3/5" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input */}
      <footer className="flex-shrink-0 border-t border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-[#1e293b]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 px-3 py-2 focus-within:border-blue-300 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all duration-200">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="输入你的问题"
              placeholder="输入你的问题..."
              rows={1}
              className="flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus-visible:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              style={{ maxHeight: "100px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 100) + "px";
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              aria-label="发送消息"
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white flex items-center justify-center hover:from-blue-600 hover:to-cyan-600 disabled:from-slate-200 disabled:to-slate-200 dark:disabled:from-slate-700 dark:disabled:to-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed transition-all duration-200 shadow-sm disabled:shadow-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 text-center">
            数据来源：2025年青海省招生计划 · 含 colleges.chat 口碑 · 仅供参考
          </p>
        </div>
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowSettings(false)}>
          <div
            className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">设置</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
                aria-label="关闭设置"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Theme */}
            <div className="mb-5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">主题</label>
              <div className="flex gap-2">
                {([
                  { value: "light", label: "亮色", icon: Sun },
                  { value: "dark", label: "暗色", icon: Moon },
                  { value: "system", label: "跟随系统", icon: Monitor },
                ] as const).map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSettings((s) => ({ ...s, theme: opt.value }))}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                        settings.theme === opt.value
                          ? "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size */}
            <div className="mb-5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">字体大小</label>
              <div className="flex gap-2">
                {([
                  { value: "small", label: "小" },
                  { value: "medium", label: "中" },
                  { value: "large", label: "大" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSettings((s) => ({ ...s, fontSize: opt.value }))}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                      settings.fontSize === opt.value
                        ? "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Results */}
            <div className="mb-5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">每次查询最大结果数</label>
              <div className="flex gap-2">
                {[10, 30, 50, 100].map((n) => (
                  <button
                    key={n}
                    onClick={() => setSettings((s) => ({ ...s, maxResults: n }))}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                      settings.maxResults === n
                        ? "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200 dark:border-slate-700 my-5" />

            {/* AI Model Provider */}
            <div className="mb-5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">AI 模型提供商</label>
              <select
                value={settings.provider}
                onChange={(e) => {
                  const p = BUILTIN_PROVIDERS.find((x) => x.id === e.target.value);
                  setSettings((s) => ({ ...s, provider: e.target.value, model: p?.defaultModel || s.model }));
                }}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {BUILTIN_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Model Selection */}
            <div className="mb-5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">模型</label>
              <select
                value={settings.model}
                onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {(BUILTIN_PROVIDERS.find((p) => p.id === settings.provider)?.models || []).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* API Key */}
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">API Key</label>
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value }))}
                placeholder={`输入 ${BUILTIN_PROVIDERS.find((p) => p.id === settings.provider)?.name || ""} API Key`}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                API Key 仅保存在浏览器本地，不会上传到服务器
              </p>
            </div>

            {/* Status indicator */}
            <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-xl text-xs ${
              settings.apiKey
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"
            }`}>
              <div className={`w-2 h-2 rounded-full ${settings.apiKey ? "bg-emerald-500" : "bg-amber-500"}`} />
              {settings.apiKey
                ? `已配置 ${BUILTIN_PROVIDERS.find((p) => p.id === settings.provider)?.name} · ${settings.model}`
                : "未配置 API Key，请先填入后保存"}
            </div>

            {/* Save button */}
            <button
              onClick={() => {
                try {
                  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
                } catch {}
                setShowSettings(false);
              }}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-sm"
            >
              保存设置
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatMarkdown(text: string): string {
  let html = escapeHtml(text);

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong class='font-semibold text-slate-900 dark:text-slate-100'>$1</strong>");

  // Headers (process # before ## before ###)
  html = html.replace(
    /^### (.+)$/gm,
    '<h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-1.5">$1</h3>'
  );
  html = html.replace(
    /^## (.+)$/gm,
    '<h2 class="text-base font-bold text-slate-900 dark:text-slate-100 mt-5 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-700">$1</h2>'
  );
  html = html.replace(
    /^# (.+)$/gm,
    '<h1 class="text-lg font-bold text-slate-900 dark:text-slate-100 mt-5 mb-2">$1</h1>'
  );

  // Tables — first row as <th>, rest as <td>
  let isFirstTableRow = true;
  html = html.replace(/\|(.+)\|/g, (match) => {
    const cells = match
      .split("|")
      .filter((c) => c.trim())
      .map((c) => c.trim());
    if (cells.every((c) => /^[-:]+$/.test(c))) {
      return "";
    }
    if (isFirstTableRow) {
      isFirstTableRow = false;
      return `<tr class="border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800">${cells.map((c) => `<th scope="col" class="px-2.5 py-1.5 text-left text-slate-700 dark:text-slate-300 text-xs font-medium">${c}</th>`).join("")}</tr>`;
    }
    return `<tr class="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-700/50">${cells.map((c) => `<td class="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 text-xs">${c}</td>`).join("")}</tr>`;
  });

  if (html.includes("<tr")) {
    html = html.replace(
      /(<tr[^]*?<\/tr>\s*)+/g,
      '<div class="overflow-x-auto my-3 rounded-lg border border-slate-200 dark:border-slate-700"><table class="w-full text-sm">$&</table></div>'
    );
    isFirstTableRow = true;
  }

  // Lists — wrap consecutive <li> in <ul>/<ol>
  html = html.replace(
    /^- (.+)$/gm,
    '<li class="text-slate-600 dark:text-slate-300 text-[13px] leading-relaxed">$1</li>'
  );
  html = html.replace(
    /^(\d+)\. (.+)$/gm,
    '<li class="text-slate-600 dark:text-slate-300 text-[13px] leading-relaxed">$2</li>'
  );
  // Wrap consecutive <li> blocks in <ul>
  html = html.replace(
    /(<li[^>]*>.*?<\/li>\s*)+/g,
    '<ul class="ml-4 list-disc space-y-0.5 marker:text-slate-300 dark:marker:text-slate-600 my-1.5">$&</ul>'
  );

  // Line breaks — avoid extra breaks after block elements
  html = html.replace(/(<\/h[1-3]>|<\/table>|<\/ul>|<\/div>)\n/g, "$1");
  html = html.replace(/\n\n/g, '<div class="h-2.5"></div>');
  html = html.replace(/\n/g, "<br>");

  return html;
}
