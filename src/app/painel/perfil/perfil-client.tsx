"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import {
  updateProfileInfoAction,
  updateDependentsAction,
  updateVehiclesAction,
  updateEmergencyContactsAction,
  updateNotificationPreferencesAction,
  updatePasswordAction,
  toggleTwoFactorAction,
} from "@/lib/actions/perfil";

type UserData = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
  avatarUrl: string | null;
  emergencyContacts: any;
  dependents: any;
  vehicles: any;
  notificationPreferences: any;
  twoFactorEnabled: boolean;
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

export function PerfilClient({
  user,
  memberships,
  activeCondoId,
}: {
  user: UserData;
  memberships: MembershipInfo[];
  activeCondoId: number | null;
}) {
  const [activeTab, setActiveTab] = useState<
    "dados" | "dependentes" | "veiculos" | "emergencia" | "seguranca"
  >("dados");

  const [dependents, setDependents] = useState<any[]>(
    Array.isArray(user.dependents) ? user.dependents : [],
  );
  const [vehicles, setVehicles] = useState<any[]>(
    Array.isArray(user.vehicles) ? user.vehicles : [],
  );
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>(
    Array.isArray(user.emergencyContacts) ? user.emergencyContacts : [],
  );

  const [twoFactor, setTwoFactor] = useState(user.twoFactorEnabled);
  const [notificationPrefs, setNotificationPrefs] = useState<{
    email: boolean;
    push: boolean;
    whatsapp: boolean;
  }>(() => {
    const raw = user.notificationPreferences;
    return typeof raw === "object" && raw !== null
      ? {
          email: raw.email ?? true,
          push: raw.push ?? true,
          whatsapp: raw.whatsapp ?? true,
        }
      : { email: true, push: true, whatsapp: true };
  });

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Dependents state
  const [newDepName, setNewDepName] = useState("");
  const [newDepRelation, setNewDepRelation] = useState("Filho(a)");
  const [newDepPhone, setNewDepPhone] = useState("");

  // Vehicles state
  const [newVehModel, setNewVehModel] = useState("");
  const [newVehPlate, setNewVehPlate] = useState("");
  const [newVehColor, setNewVehColor] = useState("");
  const [newVehType, setNewVehType] = useState("Carro");

  // Emergency state
  const [newEmName, setNewEmName] = useState("");
  const [newEmRelation, setNewEmRelation] = useState("Cônjuge");
  const [newEmPhone, setNewEmPhone] = useState("");

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateProfileInfoAction(formData);
      if (res?.success) {
        setFeedback({ type: "success", msg: "Dados cadastrais atualizados com sucesso!" });
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao atualizar dados." });
      }
    });
  };

  const handleAddDependent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepName.trim()) return;

    const nextList = [
      ...dependents,
      { name: newDepName, relationship: newDepRelation, phone: newDepPhone },
    ];
    setDependents(nextList);
    setNewDepName("");
    setNewDepPhone("");

    startTransition(async () => {
      await updateDependentsAction(nextList);
      setFeedback({ type: "success", msg: "Dependente cadastrado com sucesso!" });
    });
  };

  const handleRemoveDependent = (index: number) => {
    const nextList = dependents.filter((_, i) => i !== index);
    setDependents(nextList);

    startTransition(async () => {
      await updateDependentsAction(nextList);
      setFeedback({ type: "success", msg: "Dependente removido com sucesso." });
    });
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehModel.trim() || !newVehPlate.trim()) return;

    const nextList = [
      ...vehicles,
      { model: newVehModel, plate: newVehPlate.toUpperCase(), color: newVehColor, type: newVehType },
    ];
    setVehicles(nextList);
    setNewVehModel("");
    setNewVehPlate("");
    setNewVehColor("");

    startTransition(async () => {
      await updateVehiclesAction(nextList);
      setFeedback({ type: "success", msg: "Veículo cadastrado com sucesso!" });
    });
  };

  const handleRemoveVehicle = (index: number) => {
    const nextList = vehicles.filter((_, i) => i !== index);
    setVehicles(nextList);

    startTransition(async () => {
      await updateVehiclesAction(nextList);
      setFeedback({ type: "success", msg: "Veículo removido com sucesso." });
    });
  };

  const handleAddEmergency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmName.trim() || !newEmPhone.trim()) return;

    const nextList = [
      ...emergencyContacts,
      { name: newEmName, relationship: newEmRelation, phone: newEmPhone },
    ];
    setEmergencyContacts(nextList);
    setNewEmName("");
    setNewEmPhone("");

    startTransition(async () => {
      await updateEmergencyContactsAction(nextList);
      setFeedback({ type: "success", msg: "Contato de emergência salvo com sucesso!" });
    });
  };

  const handleRemoveEmergency = (index: number) => {
    const nextList = emergencyContacts.filter((_, i) => i !== index);
    setEmergencyContacts(nextList);

    startTransition(async () => {
      await updateEmergencyContactsAction(nextList);
      setFeedback({ type: "success", msg: "Contato de emergência removido." });
    });
  };

  const handleUpdatePassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await updatePasswordAction(formData);
      if (res?.success) {
        setFeedback({ type: "success", msg: "Senha alterada com sucesso!" });
        form.reset();
      } else {
        setFeedback({ type: "error", msg: res?.error ?? "Erro ao alterar senha." });
      }
    });
  };

  const handleToggle2FA = () => {
    const nextVal = !twoFactor;
    setTwoFactor(nextVal);

    startTransition(async () => {
      await toggleTwoFactorAction(nextVal);
      setFeedback({
        type: "success",
        msg: nextVal ? "Autenticação em 2 etapas ativada!" : "Autenticação em 2 etapas desativada.",
      });
    });
  };

  const handleToggleNotif = (key: "email" | "push" | "whatsapp") => {
    const nextVal = { ...notificationPrefs, [key]: !notificationPrefs[key] };
    setNotificationPrefs(nextVal);

    startTransition(async () => {
      await updateNotificationPreferencesAction(nextVal);
      setFeedback({ type: "success", msg: "Preferências de notificação salvas!" });
    });
  };

  return (
    <div className="space-y-6">
      {/* Profile Header Hero */}
      <div className="card p-6 border-l-4 border-l-[#0D9488]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#0D9488] to-[#0F766E] text-2xl font-black text-white shadow-md">
            {user.name.slice(0, 1).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[var(--color-ink)]">{user.name}</h1>
              <span className="chip bg-teal-50 text-[#0D9488] border-teal-200 uppercase font-bold text-[11px]">
                {memberships.find((m) => m.condoId === activeCondoId)?.role ?? "Morador"}
              </span>
            </div>
            <p className="text-xs text-[var(--color-muted)]">
              {user.email} {user.phone ? `· ${user.phone}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback ? (
        <div
          className={`p-4 rounded-[12px] text-sm font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{feedback.msg}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold uppercase tracking-wider underline hover:opacity-75"
          >
            Fechar
          </button>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="tabbar">
        <button
          type="button"
          onClick={() => setActiveTab("dados")}
          className={`tab ${activeTab === "dados" ? "tab-active" : ""}`}
        >
          Dados Pessoais & Vínculos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("dependentes")}
          className={`tab ${activeTab === "dependentes" ? "tab-active" : ""}`}
        >
          Dependentes ({dependents.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("veiculos")}
          className={`tab ${activeTab === "veiculos" ? "tab-active" : ""}`}
        >
          Veículos ({vehicles.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("emergencia")}
          className={`tab ${activeTab === "emergencia" ? "tab-active" : ""}`}
        >
          Emergência ({emergencyContacts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("seguranca")}
          className={`tab ${activeTab === "seguranca" ? "tab-active" : ""}`}
        >
          Segurança & Senha
        </button>
      </div>

      {/* 1. Dados Pessoais & Vínculos */}
      {activeTab === "dados" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Info Form */}
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-bold text-[var(--color-ink)] border-b border-[var(--color-line)] pb-3">
              Informações Cadastrais
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="label">Nome Completo *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={user.name}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">E-mail (Login)</label>
                  <input
                    type="email"
                    disabled
                    defaultValue={user.email}
                    className="input bg-slate-50 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="label">Telefone / Celular</label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={user.phone ?? ""}
                    placeholder="(11) 98765-4321"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">CPF / Documento</label>
                <input
                  type="text"
                  name="document"
                  defaultValue={user.document ?? ""}
                  placeholder="000.000.000-00"
                  className="input"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isPending} className="btn-primary btn-sm">
                  {isPending ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>

          {/* Condominium & Units Info */}
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-bold text-[var(--color-ink)] border-b border-[var(--color-line)] pb-3">
              Vínculos Condominiais & Unidades
            </h2>

            <div className="space-y-3">
              {memberships.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-[12px] bg-[var(--color-surface-muted)] border border-[var(--color-line)] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-[var(--color-ink)]">{m.condoName}</p>
                    <span className="chip bg-teal-50 text-[#0D9488] border-teal-200 uppercase font-bold text-[10px]">
                      {m.role}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-muted)]">
                    Localização: {m.condoCity}/{m.condoState}
                  </p>
                  {m.unitNumber ? (
                    <p className="text-xs text-[#0D9488] font-bold">
                      {m.blockName ? `${m.blockName} · ` : ""}Unidade {m.unitNumber} {m.unitFloor ? `(${m.unitFloor}º andar)` : ""}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--color-subtle)]">Acesso Administrativo Geral</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* 2. Dependentes Tab */}
      {activeTab === "dependentes" ? (
        <div className="card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
            <div>
              <h2 className="text-base font-bold text-[var(--color-ink)]">
                Dependentes & Moradores da Unidade
              </h2>
              <p className="text-xs text-[var(--color-muted)]">
                Pessoas autorizadas a acessar o condomínio como residentes da sua unidade.
              </p>
            </div>
          </div>

          {/* Add form */}
          <form onSubmit={handleAddDependent} className="p-4 rounded-[14px] bg-slate-50 border border-[var(--color-line)] space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">Cadastrar Novo Morador / Dependente</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={newDepName}
                  onChange={(e) => setNewDepName(e.target.value)}
                  placeholder="Nome do dependente"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Parentesco</label>
                <select
                  value={newDepRelation}
                  onChange={(e) => setNewDepRelation(e.target.value)}
                  className="input"
                >
                  <option value="Cônjuge">Cônjuge</option>
                  <option value="Filho(a)">Filho(a)</option>
                  <option value="Pai/Mãe">Pai/Mãe</option>
                  <option value="Irmão(ã)">Irmão(ã)</option>
                  <option value="Outro">Outro Coabitante</option>
                </select>
              </div>
              <div>
                <label className="label">Telefone / Contato</label>
                <input
                  type="tel"
                  value={newDepPhone}
                  onChange={(e) => setNewDepPhone(e.target.value)}
                  placeholder="(11) 98888-7777"
                  className="input"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={isPending || !newDepName.trim()} className="btn-primary btn-sm">
                <Icon name="plus" size={14} />
                Adicionar Dependente
              </button>
            </div>
          </form>

          {/* List */}
          <div className="divide-y divide-[var(--color-line)]">
            {dependents.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--color-muted)]">Nenhum dependente cadastrado.</p>
            ) : (
              dependents.map((dep, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--color-ink)]">{dep.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {dep.relationship} {dep.phone ? `· ${dep.phone}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDependent(idx)}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Remover
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {/* 3. Veículos Tab */}
      {activeTab === "veiculos" ? (
        <div className="card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
            <div>
              <h2 className="text-base font-bold text-[var(--color-ink)]">Veículos Cadastrados</h2>
              <p className="text-xs text-[var(--color-muted)]">
                Veículos autorizados na portaria com acesso à vaga da unidade.
              </p>
            </div>
          </div>

          {/* Add Form */}
          <form onSubmit={handleAddVehicle} className="p-4 rounded-[14px] bg-slate-50 border border-[var(--color-line)] space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">Cadastrar Veículo</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="label">Marca & Modelo *</label>
                <input
                  type="text"
                  required
                  value={newVehModel}
                  onChange={(e) => setNewVehModel(e.target.value)}
                  placeholder="Ex: Honda Civic"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Placa *</label>
                <input
                  type="text"
                  required
                  value={newVehPlate}
                  onChange={(e) => setNewVehPlate(e.target.value)}
                  placeholder="ABC1D23"
                  className="input uppercase"
                />
              </div>
              <div>
                <label className="label">Cor</label>
                <input
                  type="text"
                  value={newVehColor}
                  onChange={(e) => setNewVehColor(e.target.value)}
                  placeholder="Ex: Prata"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Tipo</label>
                <select
                  value={newVehType}
                  onChange={(e) => setNewVehType(e.target.value)}
                  className="input"
                >
                  <option value="Carro">Carro</option>
                  <option value="Moto">Moto</option>
                  <option value="Bicicleta">Bicicleta</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={isPending || !newVehModel.trim() || !newVehPlate.trim()} className="btn-primary btn-sm">
                <Icon name="plus" size={14} />
                Adicionar Veículo
              </button>
            </div>
          </form>

          {/* List */}
          <div className="divide-y divide-[var(--color-line)]">
            {vehicles.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--color-muted)]">Nenhum veículo cadastrado.</p>
            ) : (
              vehicles.map((veh, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-[8px] bg-teal-50 text-[#0D9488] border border-teal-200">
                      <Icon name="truck" size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[var(--color-ink)]">{veh.model}</p>
                      <p className="text-xs text-[var(--color-muted)]">
                        Placa: <strong className="font-mono text-[var(--color-ink)]">{veh.plate}</strong> · Cor: {veh.color || "Padrão"} · Tipo: {veh.type}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVehicle(idx)}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Remover
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {/* 4. Contatos de Emergência */}
      {activeTab === "emergencia" ? (
        <div className="card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
            <div>
              <h2 className="text-base font-bold text-[var(--color-ink)]">Contatos de Emergência</h2>
              <p className="text-xs text-[var(--color-muted)]">
                Pessoas para contato imediato pela portaria em situações de urgência médica ou predial.
              </p>
            </div>
          </div>

          {/* Add Form */}
          <form onSubmit={handleAddEmergency} className="p-4 rounded-[14px] bg-slate-50 border border-[var(--color-line)] space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">Adicionar Contato</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Nome do Contato *</label>
                <input
                  type="text"
                  required
                  value={newEmName}
                  onChange={(e) => setNewEmName(e.target.value)}
                  placeholder="Nome completo"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Grau de Parentesco</label>
                <select
                  value={newEmRelation}
                  onChange={(e) => setNewEmRelation(e.target.value)}
                  className="input"
                >
                  <option value="Cônjuge">Cônjuge</option>
                  <option value="Pai/Mãe">Pai/Mãe</option>
                  <option value="Filho(a)">Filho(a)</option>
                  <option value="Irmão(ã)">Irmão(ã)</option>
                  <option value="Médico(a)">Médico(a) de Família</option>
                  <option value="Amigo(a)">Amigo(a) Próximo</option>
                </select>
              </div>
              <div>
                <label className="label">Telefone de Urgência *</label>
                <input
                  type="tel"
                  required
                  value={newEmPhone}
                  onChange={(e) => setNewEmPhone(e.target.value)}
                  placeholder="(11) 99999-0000"
                  className="input"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={isPending || !newEmName.trim() || !newEmPhone.trim()} className="btn-primary btn-sm">
                <Icon name="plus" size={14} />
                Salvar Contato
              </button>
            </div>
          </form>

          {/* List */}
          <div className="divide-y divide-[var(--color-line)]">
            {emergencyContacts.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--color-muted)]">Nenhum contato de emergência cadastrado.</p>
            ) : (
              emergencyContacts.map((ct, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--color-ink)]">{ct.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {ct.relationship} · Telefone: <strong className="text-[var(--color-ink)]">{ct.phone}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmergency(idx)}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Remover
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {/* 5. Segurança & Senha Tab */}
      {activeTab === "seguranca" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Password Change */}
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-bold text-[var(--color-ink)] border-b border-[var(--color-line)] pb-3">
              Alterar Senha de Acesso
            </h2>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="label">Senha Atual *</label>
                <input
                  type="password"
                  name="currentPassword"
                  required
                  placeholder="••••••••"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Nova Senha *</label>
                <input
                  type="password"
                  name="newPassword"
                  required
                  placeholder="Mínimo 8 caracteres"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Confirmar Nova Senha *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="Repita a nova senha"
                  className="input"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isPending} className="btn-primary btn-sm">
                  {isPending ? "Alterando..." : "Atualizar Senha"}
                </button>
              </div>
            </form>
          </div>

          {/* 2FA & Notification Preferences */}
          <div className="card p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-[var(--color-ink)] border-b border-[var(--color-line)] pb-3">
                Segurança Adicional & Notificações
              </h2>
            </div>

            {/* 2FA Toggle */}
            <div className="flex items-center justify-between p-4 rounded-[12px] bg-[var(--color-surface-muted)] border border-[var(--color-line)]">
              <div>
                <p className="text-sm font-bold text-[var(--color-ink)]">Autenticação em 2 Etapas (2FA)</p>
                <p className="text-xs text-[var(--color-muted)]">
                  Solicita confirmação adicional ao realizar login em dispositivos novos.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggle2FA}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  twoFactor ? "bg-[#0D9488] text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {twoFactor ? "ATIVADO" : "DESATIVADO"}
              </button>
            </div>

            {/* Notification Channels */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Canais de Notificação</p>
              
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-ink)]">
                <span>Notificações por E-mail</span>
                <input
                  type="checkbox"
                  checked={notificationPrefs.email}
                  onChange={() => handleToggleNotif("email")}
                  className="rounded text-[#0D9488] focus:ring-teal-200"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-ink)]">
                <span>Notificações Push / Web</span>
                <input
                  type="checkbox"
                  checked={notificationPrefs.push}
                  onChange={() => handleToggleNotif("push")}
                  className="rounded text-[#0D9488] focus:ring-teal-200"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-ink)]">
                <span>Avisos de Portaria via WhatsApp</span>
                <input
                  type="checkbox"
                  checked={notificationPrefs.whatsapp}
                  onChange={() => handleToggleNotif("whatsapp")}
                  className="rounded text-[#0D9488] focus:ring-teal-200"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
