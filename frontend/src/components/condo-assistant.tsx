"use client";

import { useRef, useState } from "react";
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
    text: "Olá! Sou a Zeladoria IA. Como posso te auxiliar com regras, reservas ou ocorrências do seu condomínio?",
    time: "Agora",
  },
];

const QUICK_PROMPTS = [
  "Como reservar o salão de festas?",
  "Regras sobre barulho após 22h",
  "Registrar vazamento de água",
  "Horário da coleta de lixo",
];

export function CondoAssistant({
  onClose,
}: {
  onClose?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const nextIdRef = useRef(2);

  const handleClose = () => {
    setInternalOpen(false);
    onClose?.();
  };

  const handleSend = (textToSend?: string) => {
    const text = textToSend ?? input;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: String(nextIdRef.current++),
      sender: "user",
      text,
      time: "Agora",
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");

    setTimeout(() => {
      let replyText = "Recebi sua mensagem! A equipe de zeladoria do condomínio foi comunicada.";
      const lower = text.toLowerCase();

      if (lower.includes("reserva") || lower.includes("salão") || lower.includes("churrasqueira")) {
        replyText = "Para reservar áreas comuns, acesse o menu 'Reservas' na barra lateral ou no menu rápido, escolha a data desejada e confirme.";
      } else if (lower.includes("barulho") || lower.includes("som") || lower.includes("horário")) {
        replyText = "O Regulamento Interno do Residencial Zeladoria estabelece horário de silêncio entre 22h e 08h. Se necessário, acione a portaria.";
      } else if (lower.includes("vazamento") || lower.includes("manutenção") || lower.includes("lâmpada")) {
        replyText = "Você pode registrar essa ocorrência detalhada no menu 'Ocorrências' > 'Nova Ocorrência', anexando fotos se preferir.";
      } else if (lower.includes("lixo") || lower.includes("coleta")) {
        replyText = "A coleta de lixo orgânico ocorre diariamente às 08h. A coleta seletiva ocorre às terças e quintas-feiras.";
      }

      const botReply: Message = {
        id: String(nextIdRef.current++),
        sender: "bot",
        text: replyText,
        time: "Agora",
      };
      setMessages((prev) => [...prev, botReply]);
    }, 500);
  };

  if (!internalOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-[380px] overflow-hidden rounded-[16px] border border-[var(--color-line)] bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Header - Solid Blue without gradient */}
      <div className="flex items-center justify-between bg-[#0070F3] p-4 text-white">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white">
            <Icon name="sparkles" size={16} />
          </span>
          <div>
            <h4 className="text-sm font-bold leading-tight">Zeladoria IA</h4>
            <p className="text-[11px] text-blue-100 font-medium">Assistente do Condomínio</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          aria-label="Fechar"
        >
          <Icon name="x" size={18} />
        </button>
      </div>

      {/* Messages Body */}
      <div className="flex h-72 flex-col gap-3 overflow-y-auto p-4 bg-[#F8FAFC]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-[12px] px-3.5 py-2.5 text-xs font-medium leading-relaxed ${
                msg.sender === "user"
                  ? "bg-[#0070F3] text-white rounded-br-none"
                  : "bg-white text-[var(--color-ink)] border border-slate-200 rounded-bl-none shadow-2xs"
              }`}
            >
              {msg.text}
            </div>
            <span className="mt-0.5 text-[10px] text-slate-400 px-1">
              {msg.time}
            </span>
          </div>
        ))}
      </div>

      {/* Quick Prompts */}
      <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 bg-white px-3 py-2">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleSend(prompt)}
            className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#0070F3] hover:text-[#0070F3] transition-colors"
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
        className="flex items-center gap-2 border-t border-slate-100 bg-white p-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 rounded-[8px] border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#0070F3] focus:bg-white transition-colors"
        />
        <button
          type="submit"
          className="flex h-8.5 w-8.5 items-center justify-center rounded-[8px] bg-[#0070F3] hover:bg-[#005FD6] text-white transition-colors shrink-0"
          aria-label="Enviar"
        >
          <Icon name="send" size={14} />
        </button>
      </form>
    </div>
  );
}
