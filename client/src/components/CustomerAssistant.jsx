import { useMemo, useState } from "react";
import { Bot, MessageSquareText, Send, Sparkles, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const quickPrompts = [
  "How do I book a service?",
  "How provider approval works?",
  "How can I pay online?",
  "How do I cancel a booking?",
];

const getAssistantReply = (message, user) => {
  const text = message.toLowerCase();

  if (text.includes("book") || text.includes("booking")) {
    return "Open Services, choose a category, view a provider profile, and click Book service. Then fill date, time, address, and problem details to submit your request.";
  }

  if (text.includes("provider") && (text.includes("approve") || text.includes("approval"))) {
    return "A provider registers first, uploads ID proof, and waits for admin approval. After approval, their profile and service category become visible to users.";
  }

  if (text.includes("pay") || text.includes("payment") || text.includes("razorpay")) {
    return "After booking, open your Bookings page and use the Pay online button. Payment becomes available on active bookings that are not cancelled.";
  }

  if (text.includes("cancel")) {
    return "You can cancel from your Bookings page using the Cancel booking button. If a provider changes the visit time, you can also reject the new time and the booking will be cancelled.";
  }

  if (text.includes("chat") || text.includes("message")) {
    return "Chat unlocks only after the provider accepts the booking. If the provider sends a custom timing request, chat opens after you confirm that new time.";
  }

  if (text.includes("login") || text.includes("register") || text.includes("join")) {
    return "Use Join now if you do not have an account yet. Existing users can log in from the Login page, and Forgot password is available if needed.";
  }

  if (text.includes("support") || text.includes("contact")) {
    return "Direct provider contact is hidden before booking. After booking, company support details are shown to help connect you with the provider.";
  }

  if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
    return `Hello${user?.name ? ` ${user.name}` : ""}. I can help with bookings, provider approval, payments, cancellation, chat, and account guidance.`;
  }

  return "I can help with booking steps, provider approval, payments, cancellation, chat access, and account support. Try one of the quick questions below.";
};

const CustomerAssistant = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const getWelcomeMessages = () => [
    {
      id: 1,
      role: "assistant",
      text: `Hi${user?.name ? ` ${user.name}` : ""}, I am your ServiceBuddy assistant. Ask me about booking, providers, payments, cancellation, or support.`,
    },
  ];
  const [messages, setMessages] = useState(getWelcomeMessages);

  const helperLabel = useMemo(() => (user ? "Need help?" : "Ask ServiceBuddy"), [user]);

  const resetAssistant = () => {
    setIsOpen(false);
    setInput("");
    setMessages(getWelcomeMessages());
  };

  const sendMessage = (rawText) => {
    const text = rawText.trim();
    if (!text) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: "user",
      text,
    };

    const assistantMessage = {
      id: Date.now() + 1,
      role: "assistant",
      text: getAssistantReply(text, user),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsOpen(true);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-4 flex h-[38rem] w-[22rem] flex-col overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#0f1d28] shadow-[0_30px_80px_rgba(15,29,40,0.3)]">
          <div className="flex items-center justify-between border-b border-white/10 bg-[linear-gradient(135deg,rgba(217,125,84,0.18),rgba(255,255,255,0.02))] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-brand">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">ServiceBuddy AI</p>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">Customer help</p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetAssistant}
              className="rounded-full border border-white/10 p-2 text-white/70 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#122230] px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "assistant"
                    ? "mr-8 rounded-2xl border border-white/10 bg-[#1a3142] px-4 py-3 text-sm leading-6 text-white"
                    : "ml-8 rounded-2xl bg-brand px-4 py-3 text-sm leading-6 text-white shadow-[0_14px_34px_rgba(217,125,84,0.26)]"
                }
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 px-4 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-white/12 bg-[#203242] px-3 py-2 text-xs font-medium text-white transition hover:border-brand/40 hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    sendMessage(input);
                  }
                }}
                className="w-full rounded-full border border-white/10 bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-ink/40"
                placeholder="Ask about booking, payment, cancellation..."
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white transition hover:bg-[#bf6e49]"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            resetAssistant();
            return;
          }

          setIsOpen(true);
        }}
        className="group flex items-center gap-3 rounded-full bg-ink px-5 py-3 text-white shadow-soft transition hover:bg-teal"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-brand">
          {isOpen ? <MessageSquareText className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        </span>
        <span className="text-sm font-semibold">{helperLabel}</span>
      </button>
    </div>
  );
};

export default CustomerAssistant;
