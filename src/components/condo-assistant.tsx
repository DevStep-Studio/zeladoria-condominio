"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";

type Message = {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    sender: "bot",
    text: "Olá! Sou o Zelador Virtual. Como posso te ajudar hoje?",
    time: "Agora",
  },
];

const QUICK_PROMPTS = [
  "Como reservar o salão de festas?",
  "Regras sobre barulho após 22h",
  "Registrar vazamento de água",
  "Horário da coleta de lixo",
];

export function CondoAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");

  const handleSend = (textToSend?: string) => {
    const text = textToSend ?? input;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
      time: "Agora",
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");

    // Simulated intelligent bot reply
    setTimeout(() => {
      let replyText = "Recebi sua mensagem! O síndico e a equipe de zeladoria foram notificados.";
      const lower = text.toLowerCase();

      if (lower.includes("reserva") || lower.includes("salão") || lower.includes("churrasqueira")) {
        replyText = "Para reservar espaços como o Salão de Festas ou Churrasqueira, acesse o menu 'Reservas', escolha a data e confirme seu check-in!";
      } else if (lower.includes("barulho") || lower.includes("som") || lower.includes("horário")) {
        replyText = "O Regulamento Interno determina silêncio das 22h às 08h. Se houver excesso, a portaria pode ser acionada diretamente pelo interfone ramal 94.";
      } else if (lower.includes("vazamento") || lower.includes("manutenção") || lower.includes("lâmpada")) {
        replyText = "Você pode abrir um chamado imediato clicando em 'Registrar Ocorrência' no painel principal ou comunicar a portaria.";
      } else if (lower.includes("lixo") || lower.includes("coleta")) {
        replyText = "A coleta de lixo orgânico ocorre diariamente das 08h às 10h e a coleta seletiva às terças e quintas.";
      }

      const botReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: replyText,
        time: "Agora",
      };
      setMessages((prev) => [...prev, botReply]);
    }, 600);
  };

  return (
    <>
      {/* Floating Action Button in Bottom Right matching Reference Screenshot */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#10B981] text-white shadow-[0_8px_24px_rgba(16,185,129,0.4)] transition-all duration-200 hover:scale-110 active:scale-95 hover:bg-[#059669]"
          title="Assistente Virtual do Condomínio"
        >
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
          </span>
          <Icon name="bot" size={24} strokeWidth={2.2} />
        </button>
      </div>

      {/* Interactive Chat Window */}
      {isOpen ? (
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-[360px] overflow-hidden rounded-[20px] border border-[var(--color-line)] bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200 sm:max-w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#0070F3] to-[#0B5CD5] p-4 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-xs">
                <Icon name="bot" size={18} />
              </span>
              <div>
                <h4 className="text-sm font-bold leading-tight">Zelador Virtual</h4>
                <p className="text-[11px] text-white/80 font-medium">Assistente Inteligente 24h</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
            >
              <Icon name="x" size={18} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex h-80 flex-col gap-3 overflow-y-auto p-4 bg-[#F8FAFC]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-[14px] px-3.5 py-2.5 text-xs font-medium leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#0070F3] text-white rounded-br-none"
                      : "bg-white text-[var(--color-ink)] border border-[var(--color-line)] rounded-bl-none shadow-xs"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="mt-0.5 text-[10px] text-[var(--color-muted)] px-1">
                  {msg.time}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Prompts */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-[var(--color-line)] bg-white px-3 py-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                className="shrink-0 rounded-full border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-ink)] hover:border-[#0070F3] hover:text-[#0070F3] transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-[var(--color-line)] bg-white p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua dúvida..."
              className="flex-1 rounded-[10px] border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[#0070F3]"
            />
            <button
              type="submit"
              className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#0070F3] text-white hover:bg-[#005FD6] transition-colors shrink-0"
            >
              <Icon name="send" size={14} />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
