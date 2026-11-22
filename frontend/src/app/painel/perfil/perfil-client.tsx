"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import { AppButton, AppInput } from "@/components/app-ui";
import {
  InternalPageHeader,
  InternalPageLayout,
  InternalStatusBadge,
} from "@/components/internal/internal-ui";
import { InternalModal, InternalTabStrip } from "@/components/internal/internal-interactive";
import { logoutAction } from "@/lib/actions/session";
import {
  updateProfileInfoAction,
  updatePasswordAction,
  updateNotificationPreferencesAction,
} from "@/lib/actions/perfil";

type UserData = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
  avatarUrl: string | null;
  notificationPreferences?: {
    email?: boolean;
    push?: boolean;
    whatsapp?: boolean;
  };
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

const PROFILE_LINKS: { label: string; icon: IconName; desc: string; href: string }[] = [
  { label: "Comunicados", icon: "mail", desc: "Avisos e comunicados da administração", href: "/painel/comunicados" },
  { label: "Minhas encomendas", icon: "package", desc: "Rastreio e retiradas na portaria", href: "/painel/encomendas" },
  { label: "Documentos", icon: "folder", desc: "Atas, convenção e regulamento interno", href: "/painel/documentos" },
  { label: "Votações e assembleias", icon: "scale", desc: "Pautas em votação e assembleias virtuais", href: "/painel/assembleias" },
  { label: "Visitantes e acessos", icon: "users", desc: "Liberação de convidados e prestadores", href: "/painel/portaria" },
  { label: "Minha agenda e reservas", icon: "calendar", desc: "Eventos e cronograma do condomínio", href: "/painel/reservas" },
  { label: "Central de Notificações", icon: "bell", desc: "Preferências e histórico de alertas", href: "/painel/notificacoes" },
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
      : activeMembership?.role === "porteiro"
      ? "Portaria"
      : activeMembership?.role === "zelador"
      ? "Zelador"
      : "Morador";

  const condoName = activeMembership?.condoName || "Residencial Zeladoria";
  const unitInfo = activeMembership?.unitNumber
    ? `${activeMembership.blockName ? `${activeMembership.blockName} · ` : ""}Unidade ${activeMembership.unitNumber}`
    : "Unidade Principal";

  const [activeTab, setActiveTab] = useState<"dados" | "seguranca" | "preferencias">("dados");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Profile Form State
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [documentVal, setDocumentVal] = useState(user.document || "");
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPendingProfile, startProfileTransition] = useTransition();

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPendingPassword, startPasswordTransition] = useTransition();

  // Notification Preferences State
  const [emailNotif, setEmailNotif] = useState(user.notificationPreferences?.email ?? true);
  const [pushNotif, setPushNotif] = useState(user.notificationPreferences?.push ?? true);
  const [whatsappNotif, setWhatsappNotif] = useState(user.notificationPreferences?.whatsapp ?? false);
  const [prefMsg, setPrefMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPendingPref, startPrefTransition] = useTransition();

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    startProfileTransition(async () => {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("phone", phone);
      fd.set("document", documentVal);
      const res = await updateProfileInfoAction(fd);
      if (res.success) {
        setProfileMsg({ type: "success", text: "Dados cadastrais atualizados com sucesso!" });
      } else {
        setProfileMsg({ type: "error", text: res.error || "Erro ao atualizar dados." });
      }
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "A nova senha deve ter no mínimo 8 caracteres." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "A confirmação de senha não confere." });
      return;
    }
    startPasswordTransition(async () => {
      const fd = new FormData();
      fd.set("currentPassword", currentPassword);
      fd.set("newPassword", newPassword);
      fd.set("confirmPassword", confirmPassword);
      const res = await updatePasswordAction(fd);
      if (res.success) {
        setPasswordMsg({ type: "success", text: "Senha alterada com sucesso! Use a nova senha no próximo acesso." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMsg({ type: "error", text: res.error || "Erro ao alterar senha. Verifique a senha atual." });
      }
    });
  };

  const handleUpdatePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setPrefMsg(null);
    startPrefTransition(async () => {
      const res = await updateNotificationPreferencesAction({
        email: emailNotif,
        push: pushNotif,
        whatsapp: whatsappNotif,
      });
      if (res.success) {
        setPrefMsg({ type: "success", text: "Preferências de notificação salvas!" });
      } else {
        setPrefMsg({ type: "error", text: "Erro ao salvar preferências." });
      }
    });
  };

  return (
    <InternalPageLayout className="max-w-4xl mx-auto">
      <InternalPageHeader
        icon="user"
        title="Meu Perfil"
        subtitle="Gerencie seus dados cadastrais, credenciais de acesso e preferências do condomínio."
        breadcrumbs={[
          { label: "Início", href: "/painel" },
          { label: "Meu Perfil" },
        ]}
        badge={<InternalStatusBadge label={roleLabel} tone="blue" />}
      />

      {/* Top Banner / Identity */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-[0_2px_10px_rgba(8,26,55,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAF1FF] border border-[#1455FF]/20 text-[#1455FF] text-xl font-black">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold text-[#101828]">{user.name}</h2>
              <InternalStatusBadge label={roleLabel} tone="blue" />
            </div>
            <p className="text-xs sm:text-sm text-[#526079] font-medium">{user.email}</p>
            {user.phone && <p className="text-xs text-[#64748B] mt-0.5">{user.phone}</p>}
          </div>
        </div>

        <div className="rounded-xl bg-[#F5F8FC] border border-[#E2E8F0] px-4 py-3 sm:text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#526079]">Condomínio ativo</span>
          <p className="text-xs font-extrabold text-[#101828] mt-0.5">{condoName}</p>
          <p className="text-[11px] text-[#526079]">{unitInfo}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <InternalTabStrip
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as "dados" | "seguranca" | "preferencias")}
        items={[
          { id: "dados", label: "Dados Pessoais", icon: "user" },
          { id: "seguranca", label: "Segurança & Senha", icon: "shield" },
          { id: "preferencias", label: "Notificações", icon: "bell" },
        ]}
      />

      {/* Tab 1: Dados Pessoais */}
      {activeTab === "dados" && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-[0_2px_10px_rgba(8,26,55,0.03)] space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Informações Cadastrais</h3>
            <p className="text-xs text-slate-500 mt-0.5">Mantenha seus dados atualizados para contato da portaria e administração.</p>
          </div>

          {profileMsg && (
            <div
              className={`p-3.5 rounded-[8px] text-xs font-semibold ${
                profileMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AppInput
                label="Nome Completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-mail de Acesso</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full h-10 px-3.5 rounded-[8px] border border-slate-200 bg-slate-50 text-slate-500 text-xs font-medium cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Para alterar seu e-mail, entre em contato com o suporte.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AppInput
                label="Telefone / WhatsApp"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
              <AppInput
                label="Documento (CPF ou RG)"
                value={documentVal}
                onChange={(e) => setDocumentVal(e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <AppButton type="submit" variant="primary" isLoading={isPendingProfile}>
                Salvar Alterações
              </AppButton>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Segurança & Senha */}
      {activeTab === "seguranca" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Alterar Senha de Acesso</h3>
            <p className="text-xs text-slate-500 mt-0.5">Defina uma senha segura com no mínimo 8 caracteres para proteger sua conta.</p>
          </div>

          {passwordMsg && (
            <div
              className={`p-3.5 rounded-[8px] text-xs font-semibold ${
                passwordMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
            <AppInput
              label="Senha Atual"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite sua senha atual"
              required
            />
            <AppInput
              label="Nova Senha"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo de 8 caracteres"
              required
            />
            <AppInput
              label="Confirmar Nova Senha"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Digite novamente a nova senha"
              required
            />

            <div className="pt-2">
              <AppButton type="submit" variant="primary" isLoading={isPendingPassword}>
                Atualizar Senha
              </AppButton>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Preferências de Notificações */}
      {activeTab === "preferencias" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Canais de Notificação</h3>
            <p className="text-xs text-slate-500 mt-0.5">Escolha como prefere receber avisos de encomendas, comunicados e ocorrências.</p>
          </div>

          {prefMsg && (
            <div
              className={`p-3.5 rounded-[8px] text-xs font-semibold ${
                prefMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {prefMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdatePreferences} className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-[10px] border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                <div>
                  <p className="text-xs font-bold text-slate-900">Notificações por E-mail</p>
                  <p className="text-[11px] text-slate-500">Receba cópias de comunicados, boletos e convites no seu e-mail.</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotif}
                  onChange={(e) => setEmailNotif(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#1455FF] focus:ring-[#1455FF]"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-[10px] border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                <div>
                  <p className="text-xs font-bold text-slate-900">Alertas Push no Navegador</p>
                  <p className="text-[11px] text-slate-500">Avisos imediatos de entrega de encomendas e chegada de visitantes.</p>
                </div>
                <input
                  type="checkbox"
                  checked={pushNotif}
                  onChange={(e) => setPushNotif(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#1455FF] focus:ring-[#1455FF]"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-[10px] border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                <div>
                  <p className="text-xs font-bold text-slate-900">Notificações via WhatsApp</p>
                  <p className="text-[11px] text-slate-500">Alertas urgentes e comunicados emergenciais no seu número celular.</p>
                </div>
                <input
                  type="checkbox"
                  checked={whatsappNotif}
                  onChange={(e) => setWhatsappNotif(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#1455FF] focus:ring-[#1455FF]"
                />
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <AppButton type="submit" variant="primary" isLoading={isPendingPref}>
                Salvar Preferências
              </AppButton>
            </div>
          </form>
        </div>
      )}

      {/* Atalhos Rápidos com Links Reais */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#526079]">Atalhos do Sistema</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROFILE_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-[#E2E8F0] bg-white hover:border-[#1455FF]/35 hover:bg-[#EAF1FF]/35 text-left transition-all group shadow-[0_2px_8px_rgba(8,26,55,0.02)]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1455FF] group-hover:bg-[#1455FF] group-hover:text-white transition-colors">
                  <Icon name={item.icon} size={17} />
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#101828] group-hover:text-[#1455FF] transition-colors truncate">
                    {item.label}
                  </h4>
                  <p className="text-[11px] text-[#526079] truncate">{item.desc}</p>
                </div>
              </div>
              <Icon name="chevron-right" size={14} className="text-[#94A3B8] group-hover:text-[#1455FF] shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      </div>

      {/* Sair da Conta */}
      <div className="pt-4 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/70 p-3.5 text-xs sm:text-sm font-bold text-rose-600 transition-colors cursor-pointer"
        >
          <Icon name="logout" size={16} />
          <span>Sair da conta</span>
        </button>
      </div>

      {/* Modal de Confirmação de Logout */}
      <InternalModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Deseja realmente sair?"
        subtitle="Sua sessão será encerrada com segurança."
        maxWidth="sm"
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 border border-rose-200 text-rose-600">
            <Icon name="logout" size={22} />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(false)}
              className="w-1/2 h-10 px-3 text-xs font-bold rounded-xl border border-[#E2E8F0] text-[#101828] hover:bg-[#F5F8FC]"
            >
              Cancelar
            </button>
            <form action={logoutAction} className="w-1/2">
              <button
                type="submit"
                className="w-full h-10 px-3 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700"
              >
                Confirmar saída
              </button>
            </form>
          </div>
        </div>
      </InternalModal>
    </InternalPageLayout>
  );
}
