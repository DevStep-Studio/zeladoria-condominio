"use client";

import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/icon";
import type { LostAndFoundItem } from "@/types/lost-and-found";

interface ItemDetailsDrawerProps {
  item: LostAndFoundItem | null;
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  onClaimItem: (itemId: string | number, message: string) => void;
  onReportFound: (itemId: string | number, message: string) => void;
  onMarkResolved: (itemId: string | number, recipientName: string, notes: string) => void;
}

const CATEGORY_ICONS: Record<string, IconName> = {
  Documentos: "file-text",
  Eletrônicos: "tv",
  Chaves: "key",
  Roupas: "tag",
  Outros: "package",
};

export function ItemDetailsDrawer({
  item,
  isOpen,
  onClose,
  userRole = "morador",
  onClaimItem,
  onReportFound,
  onMarkResolved,
}: ItemDetailsDrawerProps) {
  const [claimMode, setClaimMode] = useState<"none" | "claim_mine" | "found_it" | "mark_resolved">("none");
  const [claimText, setClaimText] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Scroll lock and ESC listener
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (claimMode !== "none") {
          setClaimMode("none");
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, claimMode, onClose]);

  // Reset internal sub-states when item changes or closes
  useEffect(() => {
    setClaimMode("none");
    setClaimText("");
    setRecipientName("");
    setResolutionNotes("");
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const isFound = item.type === "FOUND";
  const isOpenStatus = item.status === "OPEN";
  const categoryIcon = CATEGORY_ICONS[item.category] || "package";

  // Check if current user has staff or administrative permissions
  const isStaffOrAdmin = [
    "sindico",
    "zelador",
    "porteiro",
    "superadmin",
    "admin",
  ].includes(userRole.toLowerCase());

  const handleConfirmClaim = () => {
    onClaimItem(item.id, claimText || "Morador declarou posse do item.");
    setClaimMode("none");
  };

  const handleConfirmFound = () => {
    onReportFound(item.id, claimText || "Item localizado pelo morador.");
    setClaimMode("none");
  };

  const handleConfirmResolved = () => {
    if (!recipientName.trim()) return;
    onMarkResolved(
      item.id,
      recipientName.trim(),
      resolutionNotes.trim() || "Item retirado mediante comprovação."
    );
    setClaimMode("none");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8 sm:pl-16">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${
                  isFound
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                <Icon name={isFound ? "check-circle" : "search"} size={13} />
                <span>{isFound ? "Item Encontrado" : "Item Perdido"}</span>
              </span>

              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                  isOpenStatus
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isOpenStatus ? "bg-blue-600 animate-pulse" : "bg-emerald-500"
                  }`}
                />
                <span>{isOpenStatus ? "Aberto" : "Devolvido"}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition-colors"
              title="Fechar (Esc)"
            >
              <Icon name="x" size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Foto ou Ilustração */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-2xs">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 p-6 text-slate-400">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200 text-slate-500">
                    <Icon name={categoryIcon} size={32} />
                  </span>
                  <span className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {item.category}
                  </span>
                </div>
              )}
            </div>

            {/* Título e Categoria */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  <Icon name={categoryIcon} size={11} />
                  <span>{item.category}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  ID: #{item.id}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                {item.title}
              </h2>
            </div>

            {/* Informações de Local e Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isFound ? "Local onde foi achado" : "Visto por último em"}
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Icon name="map-pin" size={14} className="text-emerald-600 shrink-0" />
                  <span className="break-words">{item.location}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Data do ocorrido
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Icon name="calendar" size={14} className="text-blue-600 shrink-0" />
                  <span>{item.date}</span>
                </div>
              </div>
            </div>

            {/* Descrição Detalhada */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Descrição e Características
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs whitespace-pre-wrap">
                {item.description}
              </p>
            </div>

            {/* Detalhes de Registro */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Informações de Registro
              </h4>
              <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[#0070F3] font-bold text-xs">
                    {item.reportedBy.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">
                      {item.reportedBy}
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      {item.unit || item.reportedByRole || "Morador"}
                    </span>
                  </div>
                </div>

                {item.contactPhone && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Contato</span>
                    <span className="text-xs font-bold text-slate-700">
                      {item.contactPhone}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Histórico de Resolução / Reivindicação se houver */}
            {!isOpenStatus && item.resolvedAt && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <Icon name="check-circle" size={16} className="text-emerald-600" />
                  <span>Item Devolvido com Sucesso</span>
                </div>
                <p className="text-xs text-emerald-900 font-medium">
                  {item.resolvedBy || "Item entregue ao proprietário"} em {item.resolvedAt}
                </p>
              </div>
            )}

            {item.claimedBy && isOpenStatus && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 space-y-1">
                <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                  <Icon name="bell" size={15} className="text-[#0070F3]" />
                  <span>Reivindicação em Andamento</span>
                </div>
                <p className="text-xs text-blue-900 font-medium">
                  Reivindicado por: <strong>{item.claimedBy}</strong>
                </p>
                {item.claimMessage && (
                  <p className="text-[11px] text-blue-700 italic">
                    &quot;{item.claimMessage}&quot;
                  </p>
                )}
              </div>
            )}

            {/* Painéis Inline de Ação (quando usuário clica em algum botão) */}
            {claimMode === "claim_mine" && (
              <div className="rounded-2xl border-2 border-blue-500 bg-blue-50/40 p-4 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Icon name="bell" size={14} className="text-[#0070F3]" />
                    Reivindicar Posse do Item
                  </h4>
                  <button
                    type="button"
                    onClick={() => setClaimMode("none")}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancelar
                  </button>
                </div>
                <p className="text-xs text-slate-600">
                  Ao confirmar, uma notificação formal será enviada à portaria e zeladoria com seus dados. Compareça à portaria munido de documento para verificação e retirada.
                </p>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Detalhe comprovatório (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={claimText}
                    onChange={(e) => setClaimText(e.target.value)}
                    placeholder="Ex: Minha chave tem um chaveiro com o nome 'Ana' gravado atrás..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-[#0070F3] resize-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleConfirmClaim}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0070F3] hover:bg-[#005FD6] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar e Notificar Portaria
                </button>
              </div>
            )}

            {claimMode === "found_it" && (
              <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/40 p-4 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Icon name="check-circle" size={14} className="text-emerald-600" />
                    Informar que Encontrou
                  </h4>
                  <button
                    type="button"
                    onClick={() => setClaimMode("none")}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancelar
                  </button>
                </div>
                <p className="text-xs text-slate-600">
                  Que ótima notícia! Informe onde o objeto está ou se já o entregou aos cuidados da portaria.
                </p>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Onde o item se encontra atualmente? *
                  </label>
                  <input
                    type="text"
                    value={claimText}
                    onChange={(e) => setClaimText(e.target.value)}
                    placeholder="Ex: Entreguei agora na Portaria Central com o Sr. Antenor"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleConfirmFound}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Enviar Aviso ao Morador
                </button>
              </div>
            )}

            {claimMode === "mark_resolved" && (
              <div className="rounded-2xl border-2 border-slate-700 bg-slate-50 p-4 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Icon name="check-circle" size={14} className="text-slate-700" />
                    Registrar Devolução / Retirada
                  </h4>
                  <button
                    type="button"
                    onClick={() => setClaimMode("none")}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancelar
                  </button>
                </div>
                <p className="text-xs text-slate-600">
                  Preencha as informações de entrega para arquivar o item e gerar o registro no histórico do condomínio.
                </p>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nome e Unidade de quem retirou *
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Ex: João da Silva (Torre B · Apto 402)"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#0070F3]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Observações de conferência (opcional)
                  </label>
                  <input
                    type="text"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Ex: Documento de identidade conferido na portaria"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#0070F3]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleConfirmResolved}
                  disabled={!recipientName.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Concluir Devolução
                </button>
              </div>
            )}
          </div>

          {/* Rodapé com Botões de Ação Principais */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 space-y-2">
            {isOpenStatus && claimMode === "none" && (
              <div className="space-y-2">
                {/* Ação para Morador: "Este item é meu" se for FOUND */}
                {isFound && (
                  <button
                    type="button"
                    onClick={() => setClaimMode("claim_mine")}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0070F3] hover:bg-[#005FD6] text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Icon name="check-circle" size={16} />
                    <span>Este item é meu</span>
                  </button>
                )}

                {/* Ação para Morador: "Eu encontrei este item" se for LOST */}
                {!isFound && (
                  <button
                    type="button"
                    onClick={() => setClaimMode("found_it")}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Icon name="search" size={16} />
                    <span>Eu encontrei este item</span>
                  </button>
                )}

                {/* Ação para Zelador / Portaria / Síndico / Admin: "Marcar como Devolvido" */}
                {isStaffOrAdmin && (
                  <button
                    type="button"
                    onClick={() => setClaimMode("mark_resolved")}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <Icon name="check" size={16} className="text-emerald-600" />
                    <span>Marcar como Devolvido</span>
                  </button>
                )}
              </div>
            )}

            {!isOpenStatus && (
              <div className="text-center py-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Icon name="check-circle" size={14} className="text-emerald-500" />
                  Este item já foi finalizado e devolvido.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

