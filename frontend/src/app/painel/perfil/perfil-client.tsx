"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { AppButton, AppInput } from "@/components/app-ui";
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
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        icon="user"
        title="Meu Perfil"
        description="Gerencie seus dados cadastrais, credenciais de acesso e preferências do condomínio."
      />

      {/* Top Banner / Identity */}
      <div className="rounded-[12px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 border border-blue-200 text-[#1355FF] text-xl font-black">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">{user.name}</h2>
              <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-bold text-[#1355FF]">
                {roleLabel}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">{user.email}</p>
            {user.phone && <p className="text-xs text-slate-400 mt-0.5">{user.phone}</p>}
          </div>
        </div>

        <div className="rounded-[10px] bg-slate-50 border border-slate-200/80 p-3 sm:text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Condomínio Ativo</span>
          <p className="text-xs font-bold text-slate-900">{condoName}</p>
          <p className="text-[11px] text-slate-500">{unitInfo}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("dados")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "dados"
              ? "border-[#1355FF] text-[#1355FF]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Icon name="user" size={15} />
          Dados Pessoais
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("seguranca")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "seguranca"
              ? "border-[#1355FF] text-[#1355FF]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Icon name="shield" size={15} />
          Segurança & Senha
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preferencias")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "preferencias"
              ? "border-[#1355FF] text-[#1355FF]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Icon name="bell" size={15} />
          Notificações
        </button>
      </div>

      {/* Tab 1: Dados Pessoais */}
      {activeTab === "dados" && (
        <div className="rounded-[12px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-5">
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
        <div className="rounded-[12px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-5">
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
        <div className="rounded-[12px] border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-5">
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
                  className="h-4 w-4 rounded border-slate-300 text-[#1355FF] focus:ring-[#1355FF]"
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
                  className="h-4 w-4 rounded border-slate-300 text-[#1355FF] focus:ring-[#1355FF]"
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
                  className="h-4 w-4 rounded border-slate-300 text-[#1355FF] focus:ring-[#1355FF]"
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
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Atalhos do Sistema</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROFILE_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between p-3.5 rounded-[12px] border border-slate-200/80 bg-white hover:border-blue-200 hover:bg-blue-50/20 text-left transition-all group shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-slate-50 text-slate-600 group-hover:bg-blue-50 group-hover:text-[#1355FF] transition-colors">
                  <Icon name={item.icon} size={17} />
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#1355FF] transition-colors truncate">
                    {item.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">{item.desc}</p>
                </div>
              </div>
              <Icon name="chevron-right" size={14} className="text-slate-400 group-hover:text-[#1355FF] shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      </div>

      {/* Sair da Conta */}
      <div className="pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center gap-2 rounded-[12px] border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 p-3.5 text-xs sm:text-sm font-bold text-rose-600 transition-colors"
        >
          <Icon name="logout" size={16} />
          <span>Sair da conta</span>
        </button>
      </div>

      {/* Modal de Confirmação de Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-sm rounded-[14px] border border-slate-200 bg-white p-6 shadow-xl space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <Icon name="logout" size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Deseja realmente sair?</h3>
              <p className="text-xs text-slate-500 mt-1">Sua sessão será encerrada com segurança.</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="w-1/2 h-9 px-3 text-xs font-bold rounded-[8px] border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <form action={logoutAction} className="w-1/2">
                <button
                  type="submit"
                  className="w-full h-9 px-3 text-xs font-bold rounded-[8px] bg-rose-600 text-white hover:bg-rose-700"
                >
                  Confirmar saída
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
