"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { dateTimeBR, timeBR, isoDate } from "@/lib/utils";
import {
  createVisitAction,
  gateMoveAction,
  registerParcelAction,
  deliverParcelAction,
} from "@/lib/actions/portaria";

type VisitItem = {
  id: number;
  status: string;
  purpose: string | null;
  checkinAt: Date | null;
  checkoutAt: Date | null;
  validUntil: Date;
  qrToken: string;
  plate: string | null;
  name: string;
  document: string | null;
  kind: string;
  company: string | null;
  unit: string | null;
  block: string | null;
  host: string | null;
  hostUserId: number | null;
};

type ParcelItem = {
  id: number;
  code: string;
  carrier: string | null;
  receivedAt: Date;
  deliveredAt: Date | null;
  status: string;
  pickupCode: string;
  unit: string | null;
  block: string | null;
  recipientName: string | null;
};

type UnitOption = {
  id: number;
  label: string;
};

export function PortariaClient({
  visits,
  parcels,
  units,
  role,
  currentUserId,
}: {
  visits: VisitItem[];
  parcels: ParcelItem[];
  units: UnitOption[];
  role: string;
  currentUserId: number;
}) {
  const isStaff = ["superadmin", "sindico", "porteiro", "zelador"].includes(role);
  const [activeTab, setActiveTab] = useState<"visitas" | "encomendas" | "historico">("visitas");
  const [search, setSearch] = useState("");
  const [showAuthorizeModal, setShowAuthorizeModal] = useState(false);
  const [showParcelModal, setShowParcelModal] = useState(false);
  const [selectedPasscode, setSelectedPasscode] = useState<{ name: string; token: string; validUntil: Date } | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeVisits = visits.filter((v) => ["autorizado", "dentro", "aguardando"].includes(v.status));
  const pendingParcels = parcels.filter((p) => p.status === "pendente");

  const filteredVisits = visits.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      (v.document && v.document.toLowerCase().includes(q)) ||
      (v.plate && v.plate.toLowerCase().includes(q)) ||
      (v.company && v.company.toLowerCase().includes(q)) ||
      (v.unit && v.unit.toLowerCase().includes(q))
    );
  });

  const filteredParcels = parcels.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.code.toLowerCase().includes(q) ||
      p.pickupCode.toLowerCase().includes(q) ||
      (p.carrier && p.carrier.toLowerCase().includes(q)) ||
      (p.unit && p.unit.toLowerCase().includes(q))
    );
  });

  const handleAuthorizeVisitor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      await createVisitAction(formData);
      setFeedback({ type: "success", msg: "Visitante autorizado com sucesso! Código de liberação gerado." });
      setShowAuthorizeModal(false);
    });
  };

  const handleRegisterParcel = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      await registerParcelAction(formData);
      setFeedback({ type: "success", msg: "Encomenda registrada e notificação enviada ao morador!" });
      setShowParcelModal(false);
    });
  };

  const handleGateMove = (id: number, move: "checkin" | "checkout" | "cancelar") => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      formData.set("move", move);
      await gateMoveAction(formData);
      setFeedback({
        type: "success",
        msg: move === "checkin" ? "Entrada registrada!" : move === "checkout" ? "Saída registrada!" : "Autorização cancelada.",
      });
    });
  };

  const handleDeliverParcel = (id: number) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      await deliverParcelAction(formData);
      setFeedback({ type: "success", msg: "Entrega da encomenda concluída com sucesso!" });
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-ink)] flex items-center gap-2.5">
            <Icon name="shield" size={28} className="text-[#0D9488]" />
            Portaria & Controle de Acesso
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Liberação temporária de visitantes, registro de entradas/saídas e gestão de encomendas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAuthorizeModal(true)}
            className="btn-primary btn-sm"
          >
            <Icon name="user-check" size={16} />
            Autorizar Visitante
          </button>

          {isStaff ? (
            <button
              type="button"
              onClick={() => setShowParcelModal(true)}
              className="btn-ghost btn-sm"
            >
              <Icon name="package" size={16} />
              Receber Encomenda
            </button>
          ) : null}
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

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs font-bold text-[var(--color-muted)] uppercase">Dentro do Condomínio</p>
          <p className="text-2xl font-black text-[var(--color-ink)] mt-1">
            {visits.filter((v) => v.status === "dentro").length}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Visitantes / Prestadores</p>
        </div>

        <div className="card p-4 border-l-4 border-l-[#0D9488]">
          <p className="text-xs font-bold text-[var(--color-muted)] uppercase">Aguardados / Autorizados</p>
          <p className="text-2xl font-black text-[var(--color-ink)] mt-1">
            {visits.filter((v) => v.status === "autorizado" || v.status === "aguardando").length}
          </p>
          <p className="text-[11px] text-teal-600 font-semibold mt-0.5">Com liberação ativa</p>
        </div>

        <div className="card p-4 border-l-4 border-l-amber-500">
          <p className="text-xs font-bold text-[var(--color-muted)] uppercase">Encomendas Pendentes</p>
          <p className="text-2xl font-black text-[var(--color-ink)] mt-1">{pendingParcels.length}</p>
          <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Aguardando retirada</p>
        </div>

        <div className="card p-4 border-l-4 border-l-blue-500">
          <p className="text-xs font-bold text-[var(--color-muted)] uppercase">Total de Entradas Hoje</p>
          <p className="text-2xl font-black text-[var(--color-ink)] mt-1">
            {visits.filter((v) => v.checkinAt).length}
          </p>
          <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Movimentações no portão</p>
        </div>
      </div>

      {/* Control Navigation & Search */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="tabbar">
            <button
              type="button"
              onClick={() => setActiveTab("visitas")}
              className={`tab ${activeTab === "visitas" ? "tab-active" : ""}`}
            >
              Visitantes Ativos ({activeVisits.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("encomendas")}
              className={`tab ${activeTab === "encomendas" ? "tab-active" : ""}`}
            >
              Encomendas ({parcels.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("historico")}
              className={`tab ${activeTab === "historico" ? "tab-active" : ""}`}
            >
              Histórico Completo
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-subtle)]" />
            <input
              type="text"
              placeholder="Buscar visitante, placa, encomenda..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-[8px] border border-[var(--color-line)] bg-white pl-8 pr-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-subtle)] focus:border-[#0D9488] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 1. Visitas Tab */}
      {activeTab === "visitas" || activeTab === "historico" ? (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
            <h2 className="text-base font-bold text-[var(--color-ink)]">
              {activeTab === "visitas" ? "Controle de Acesso em Tempo Real" : "Histórico de Acesso"}
            </h2>
          </div>

          {filteredVisits.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--color-muted)]">
              Nenhuma visita encontrada.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line)]">
              {(activeTab === "visitas" ? activeVisits : filteredVisits).map((visit) => {
                const isInside = visit.status === "dentro";
                return (
                  <div
                    key={visit.id}
                    className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[var(--color-surface-muted)] p-3 rounded-[12px] transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className={`p-2.5 rounded-[10px] shrink-0 border ${
                        isInside ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-teal-50 text-[#0D9488] border-teal-200"
                      }`}>
                        <Icon name={isInside ? "user-check" : "shield"} size={20} />
                      </span>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold text-[var(--color-ink)]">{visit.name}</span>
                          <span className={`chip text-[11px] ${
                            isInside ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold" :
                            visit.status === "autorizado" ? "bg-teal-50 text-[#0D9488] border-teal-200" :
                            "bg-slate-100 text-slate-700"
                          }`}>
                            {isInside ? "DENTRO DO CONDOMÍNIO" : visit.status.toUpperCase()}
                          </span>
                          <span className="chip bg-slate-100 text-slate-700 text-[11px]">{visit.kind}</span>
                        </div>

                        <p className="text-xs text-[var(--color-muted)]">
                          Destino: <strong className="text-[var(--color-ink)]">{visit.unit ? `Unidade ${visit.unit}` : "Área Comum"}</strong> {visit.host ? `(Morador: ${visit.host})` : ""}
                          {visit.company ? ` · Empresa: ${visit.company}` : ""}
                          {visit.plate ? ` · Placa: ${visit.plate}` : ""}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-subtle)] pt-0.5">
                          {visit.checkinAt ? (
                            <span>Entrada: <strong className="text-[var(--color-ink)]">{dateTimeBR(visit.checkinAt)}</strong></span>
                          ) : null}
                          {visit.checkoutAt ? (
                            <span>Saída: <strong className="text-[var(--color-ink)]">{dateTimeBR(visit.checkoutAt)}</strong></span>
                          ) : null}
                          <span>Válido até: {dateTimeBR(visit.validUntil)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => setSelectedPasscode({ name: visit.name, token: visit.qrToken, validUntil: visit.validUntil })}
                        className="btn-ghost btn-sm"
                        title="Ver Código de Liberação"
                      >
                        <Icon name="qr" size={14} />
                        Código QR
                      </button>

                      {isStaff ? (
                        <>
                          {!isInside && visit.status !== "saiu" ? (
                            <button
                              type="button"
                              onClick={() => handleGateMove(visit.id, "checkin")}
                              disabled={isPending}
                              className="btn-success btn-sm"
                            >
                              <Icon name="check" size={14} />
                              Registrar Entrada
                            </button>
                          ) : isInside ? (
                            <button
                              type="button"
                              onClick={() => handleGateMove(visit.id, "checkout")}
                              disabled={isPending}
                              className="btn-dark btn-sm"
                            >
                              <Icon name="logout" size={14} />
                              Registrar Saída
                            </button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* 2. Encomendas Tab */}
      {activeTab === "encomendas" ? (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
            <h2 className="text-base font-bold text-[var(--color-ink)]">
              Controle de Encomendas & Correspondências ({filteredParcels.length})
            </h2>
          </div>

          {filteredParcels.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--color-muted)]">
              Nenhuma encomenda registrada no momento.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line)]">
              {filteredParcels.map((parcel) => {
                const isPending = parcel.status === "pendente";
                return (
                  <div
                    key={parcel.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--color-surface-muted)] p-3 rounded-[12px] transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className={`p-2.5 rounded-[10px] shrink-0 border ${
                        isPending ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        <Icon name="package" size={20} />
                      </span>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#0D9488]">{parcel.code}</span>
                          <span className={`chip text-[11px] ${
                            isPending ? "bg-amber-50 text-amber-700 border-amber-200 font-bold" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                            {isPending ? "AGUARDANDO RETIRADA" : "ENTREGUE"}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-[var(--color-ink)]">
                          Unidade {parcel.unit ?? "Geral"} {parcel.recipientName ? `(${parcel.recipientName})` : ""}
                        </h3>

                        <p className="text-xs text-[var(--color-muted)]">
                          Transportadora: <strong>{parcel.carrier || "Correios"}</strong> · Recebido em: {dateTimeBR(parcel.receivedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-[var(--color-muted)]">Código de Retirada</p>
                        <p className="font-mono text-lg font-black text-[#0D9488]">{parcel.pickupCode}</p>
                      </div>

                      {isStaff && isPending ? (
                        <button
                          type="button"
                          onClick={() => handleDeliverParcel(parcel.id)}
                          className="btn-primary btn-sm"
                        >
                          <Icon name="check" size={14} />
                          Dar Baixa
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* Authorize Visitor Modal */}
      {showAuthorizeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setShowAuthorizeModal(false)}
          />
          <div className="relative w-full max-w-lg rounded-[20px] border border-[var(--color-line)] bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
              <h2 className="text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                <Icon name="user-check" size={20} className="text-[#0D9488]" />
                Autorizar Entrada de Visitante / Prestador
              </h2>
              <button
                type="button"
                onClick={() => setShowAuthorizeModal(false)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleAuthorizeVisitor} className="space-y-4">
              <div>
                <label className="label">Nome Completo do Visitante *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tipo de Pessoa *</label>
                  <select name="kind" className="input" defaultValue="visitante">
                    <option value="visitante">Visitante / Amigo</option>
                    <option value="prestador">Prestador de Serviço</option>
                    <option value="entrega">Entregador</option>
                    <option value="corretor">Corretor / Imobiliária</option>
                  </select>
                </div>

                <div>
                  <label className="label">Empresa / Referência</label>
                  <input
                    type="text"
                    name="company"
                    placeholder="Ex: Enel / Uber / Convidado"
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Documento (RG/CPF)</label>
                  <input
                    type="text"
                    name="document"
                    placeholder="Número do documento"
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Placa do Veículo</label>
                  <input
                    type="text"
                    name="vehiclePlate"
                    placeholder="ABC1D23"
                    className="input uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Unidade de Destino *</label>
                  <select name="unitId" className="input" defaultValue={units[0]?.id ?? ""}>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Válido Até (Data) *</label>
                  <input
                    type="date"
                    name="validUntilDate"
                    required
                    defaultValue={isoDate()}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Motivo da Visita</label>
                <input
                  type="text"
                  name="purpose"
                  placeholder="Ex: Jantar em família / Instalação de ar condicionado"
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuthorizeModal(false)}
                  className="btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary"
                >
                  {isPending ? "Gerando autorização..." : "Gerar Código de Acesso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Register Parcel Modal (Staff) */}
      {showParcelModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setShowParcelModal(false)}
          />
          <div className="relative w-full max-w-lg rounded-[20px] border border-[var(--color-line)] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3">
              <h2 className="text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                <Icon name="package" size={20} className="text-[#0D9488]" />
                Registrar Chegada de Encomenda
              </h2>
              <button
                type="button"
                onClick={() => setShowParcelModal(false)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleRegisterParcel} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Unidade Destino *</label>
                  <select name="unitId" required className="input" defaultValue={units[0]?.id ?? ""}>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Transportadora / Origem</label>
                  <input
                    type="text"
                    name="carrier"
                    placeholder="Ex: Mercado Livre / Sedex"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Código de Rastreio / Nota</label>
                <input
                  type="text"
                  name="trackingCode"
                  placeholder="Ex: BR123456789"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Local onde foi guardada na portaria</label>
                <input
                  type="text"
                  name="location"
                  placeholder="Ex: Armário 2 - Gaveta B"
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowParcelModal(false)}
                  className="btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary"
                >
                  {isPending ? "Registrando..." : "Registrar e Notificar Morador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* QR & Passcode Modal */}
      {selectedPasscode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setSelectedPasscode(null)}
          />
          <div className="relative w-full max-w-sm rounded-[20px] border border-[var(--color-line)] bg-white p-6 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-2">
              <h3 className="text-sm font-bold text-[var(--color-ink)]">Passe de Acesso Digital</h3>
              <button
                type="button"
                onClick={() => setSelectedPasscode(null)}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="p-4 rounded-[16px] bg-teal-50 border border-teal-200">
              <p className="text-xs text-[var(--color-muted)] font-semibold">Visitante Autorizado</p>
              <p className="text-lg font-black text-[var(--color-ink)] mt-0.5">{selectedPasscode.name}</p>
              <div className="my-4 flex justify-center">
                <div className="h-28 w-28 rounded-[12px] bg-white p-2 border border-teal-200 flex flex-col items-center justify-center shadow-xs">
                  <Icon name="qr" size={64} className="text-[#0D9488]" />
                </div>
              </div>
              <p className="text-[10px] uppercase font-bold text-[var(--color-muted)] tracking-wider">Código Temporário</p>
              <p className="font-mono text-2xl font-black text-[#0D9488] tracking-widest mt-0.5">{selectedPasscode.token}</p>
              <p className="text-[11px] text-[var(--color-muted)] mt-2">Válido até {dateTimeBR(selectedPasscode.validUntil)}</p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPasscode(null)}
              className="btn-ghost w-full btn-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
