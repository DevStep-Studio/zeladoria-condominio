"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/icon";
import { NextStepModal } from "@/components/next-step-modal";
import { logoutAction } from "@/lib/actions/session";

type UserData = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
  avatarUrl: string | null;
};

type MembershipInfo = {
  id: number;
  role: string;
  condoId: number;
  condoName: string;
  condoCity: string | null;
  condoState: string | null;
  unitNumber: string | null;
  unitFloor: number | null;
  blockName: string | null;
};

const PROFILE_SHORTCUTS: { label: string; icon: IconName; desc: string }[] = [
  { label: "Comunicados", icon: "mail", desc: "Avisos e comunicados da administração" },
  { label: "Minhas encomendas", icon: "package", desc: "Rastreio e retiradas na portaria" },
  { label: "Documentos", icon: "folder", desc: "Atas, convenção e regulamento interno" },
  { label: "Votações e assembleias", icon: "scale", desc: "Pautas em votação e assembleias virtuais" },
  { label: "Visitantes / acesso", icon: "users", desc: "Liberação de convidados e prestadores" },
  { label: "Minha agenda", icon: "calendar", desc: "Eventos e cronograma do condomínio" },
  { label: "Notificações", icon: "bell", desc: "Preferências de alertas e avisos" },
  { label: "Segurança e privacidade", icon: "shield", desc: "Senha, 2FA e dados protegidos" },
];

export function PerfilClient({
  user,
  memberships,
  activeCondoId,
}: {
  user: UserData;
  memberships: MembershipInfo[];
  activeCondoId: number | null;
}) {
  const activeMembership = memberships.find((m) => m.condoId === activeCondoId) || memberships[0];

  const roleLabel =
    activeMembership?.role === "sindico"
      ? "Síndico"
      : activeMembership?.role === "superadmin"
      ? "Super Admin"
      : "Morador";

  const condoName = activeMembership?.condoName || "Residencial Zeladoria";
  const unitInfo = activeMembership?.unitNumber
    ? `${activeMembership.blockName ? `${activeMembership.blockName} · ` : ""}Unidade ${activeMembership.unitNumber}`
    : "Torre A · Unidade 402";

  const condoAddress = "Av. Brasil, 1000 - Itaim Bibi, São Paulo - SP";

  const [nextStepModalOpen, setNextStepModalOpen] = useState(false);
  const [nextStepItemName, setNextStepItemName] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleShortcutClick = (label: string) => {
    setNextStepItemName(label);
    setNextStepModalOpen(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
          Perfil
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Gerencie suas informações cadastrais e dados condominiais
        </p>
      </div>

      {/* 1. User Identity Card */}
      <div className="rounded-[14px] border border-slate-200/60 bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-50 border border-blue-200 text-[#0070F3] text-2xl font-black">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-[#0F172A]">
                {user.name}
              </h2>
              <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-bold text-[#0070F3]">
                {roleLabel}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {user.email}
            </p>
            {user.phone && (
              <p className="text-xs text-slate-400 mt-0.5">
                {user.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Card Meu Condomínio (Identidade Azul e Amarela, SEM gradiente) */}
      <div className="rounded-[14px] border border-blue-100 bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#0070F3] text-white">
              <Icon name="home" size={17} />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0070F3]">
                Meu Condomínio
              </span>
              <h3 className="text-base font-black text-[#0F172A]">
                {condoName}
              </h3>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-[#FAB800]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FAB800]" />
            <span>Ativo</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-[10px] bg-slate-50/70 p-3 border border-slate-200/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Torre & Unidade
            </span>
            <p className="text-sm font-bold text-[#0F172A] mt-0.5">
              {unitInfo}
            </p>
          </div>

          <div className="rounded-[10px] bg-slate-50/70 p-3 border border-slate-200/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Endereço
            </span>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              {condoAddress}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Atalhos do Perfil (8 Itens) */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Atalhos do Perfil
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROFILE_SHORTCUTS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleShortcutClick(item.label)}
              className="flex items-center justify-between p-3.5 rounded-[12px] border border-slate-200/60 bg-white hover:border-blue-200 hover:bg-blue-50/20 text-left transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-slate-50 text-slate-600 group-hover:bg-blue-50 group-hover:text-[#0070F3] transition-colors">
                  <Icon name={item.icon} size={17} />
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#0070F3] transition-colors truncate">
                    {item.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {item.desc}
                  </p>
                </div>
              </div>

              <Icon name="chevron-right" size={14} className="text-slate-400 group-hover:text-[#0070F3] shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* 4. Sair da Conta */}
      <div className="pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center gap-2 rounded-[12px] border border-red-200 bg-red-50/50 hover:bg-red-100/60 p-3.5 text-xs sm:text-sm font-bold text-red-600 transition-colors"
        >
          <Icon name="logout" size={16} />
          <span>Sair da conta</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setShowLogoutConfirm(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-sm rounded-[16px] border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Icon name="logout" size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                Deseja realmente sair?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Sua sessão será encerrada com segurança e você retornará à tela de login.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="btn-ghost btn-sm flex-1"
              >
                Cancelar
              </button>
              <form action={logoutAction} className="flex-1">
                <button
                  type="submit"
                  className="w-full btn-danger btn-sm"
                >
                  Confirmar saída
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Next Step Feature Notification Modal */}
      <NextStepModal
        isOpen={nextStepModalOpen}
        title={nextStepItemName}
        description="Esta funcionalidade será disponibilizada em uma próxima etapa do Zeladoria Condomínio."
        onClose={() => setNextStepModalOpen(false)}
      />
    </div>
  );
}
