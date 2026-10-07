"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import {
  createVisitAction,
  gateMoveAction,
  registerParcelAction,
  deliverParcelAction,
  createOccurrenceAction,
  openShiftAction,
  closeShiftAction,
} from "@/lib/actions/portaria";

export type InsideVisitor = {
  id: number;
  name: string;
  kind: string;
  company?: string;
  document?: string;
  plate?: string;
  unit: string;
  hostName?: string;
  checkinAt: string;
  purpose?: string;
};

export type ExpectedVisitor = {
  id: number;
  name: string;
  kind: string;
  company?: string;
  plate?: string;
  unit: string;
  hostName: string;
  validTime: string;
  status: string;
  purpose?: string;
  qrToken?: string;
};

export type PendingParcel = {
  id: number;
  code: string;
  carrier: string;
  shelf: string;
  pickupCode: string;
  unit: string;
  receivedTimeAgo: string;
  description?: string;
};

export type ShiftInfo = {
  id: number;
  period: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  userName: string;
  handoverNotes?: string;
  pendingItems?: string;
  checklist?: Record<string, boolean>;
};

export type PorteiroOverview = {
  insideCount: number;
  insideVisitors: InsideVisitor[];
  expectedCount: number;
  expectedVisitors: ExpectedVisitor[];
  pendingParcelsCount: number;
  pendingParcels: PendingParcel[];
  todayProvidersCount: number;
  todayReservationsCount: number;
  waitingConfirmationCount: number;
};

export type UnitOption = {
  id: number;
  label: string;
};

const EMERGENCY_CONTACTS = [
  { id: "pm", name: "Polícia Militar", role: "Emergência", phone: "190", icon: "shield" },
  { id: "cbm", name: "Corpo de Bombeiros", role: "Emergência / Resgate", phone: "193", icon: "shield" },
  { id: "sindico", name: "Síndica Marina Prado", role: "Administração", phone: "(11) 98765-4321", icon: "user" },
  { id: "zelador", name: "Zelador José Roberto", role: "Zeladoria Predial", phone: "(11) 97654-3210", icon: "wrench" },
  { id: "elevador", name: "Otis Elevadores", role: "Chamado Técnico 24h", phone: "0800 703 8765", icon: "wrench" },
  { id: "portao", name: "Garen Portões", role: "Manutenção Portões", phone: "(11) 3456-7890", icon: "shield" },
];

export function PorteiroDashboard({
  userName,
  condoName,
  activeShift,
  lastShift,
  overview,
  allUnits,
}: {
  userName: string;
  condoName: string;
  activeShift: ShiftInfo | null;
  lastShift: ShiftInfo | null;
  overview: PorteiroOverview;
  allUnits: UnitOption[];
}) {
  const [modal, setModal] = useState<"autorizar" | "encomenda" | "consultar" | "ocorrencia" | "turno_abrir" | "turno_fechar" | "entregar_encomenda" | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<PendingParcel | null>(null);
  const [searchMorador, setSearchMorador] = useState("");
  const [activeTab, setActiveTab] = useState<"dentro" | "esperados" | "encomendas" | "contatos">("dentro");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGateMove = (id: number, move: "checkin" | "checkout") => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(id));
      formData.set("move", move === "checkin" ? "entrada" : "saida");
      await gateMoveAction(formData);
      setFeedback({
        type: "success",
        msg: move === "checkin" ? "Entrada registrada com sucesso!" : "Saída registrada com sucesso!",
      });
      setTimeout(() => setFeedback(null), 3500);
    });
  };

  const handleDeliverSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await deliverParcelAction(formData);
      setFeedback({ type: "success", msg: "Encomenda entregue e retirada registrada com sucesso!" });
      setModal(null);
      setSelectedParcel(null);
      setTimeout(() => setFeedback(null), 3500);
    });
  };

  const handleAuthorizeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createVisitAction(formData);
      setFeedback({ type: "success", msg: "Visitante autorizado! Entrada liberada." });
      setModal(null);
      setTimeout(() => setFeedback(null), 3500);
    });
  };

  const handleParcelSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await registerParcelAction(formData);
      setFeedback({ type: "success", msg: "Encomenda cadastrada e morador notificado automaticamente!" });
      setModal(null);
      setTimeout(() => setFeedback(null), 3500);
    });
  };

  const handleOccurrenceSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createOccurrenceAction(formData);
      setFeedback({ type: "success", msg: "Ocorrência operacional registrada no Livro Digital!" });
      setModal(null);
      setTimeout(() => setFeedback(null), 3500);
    });
  };

  const handleOpenShiftSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await openShiftAction(formData);
      setFeedback({ type: "success", msg: "Turno de portaria aberto com sucesso!" });
      setModal(null);
      setTimeout(() => setFeedback(null), 3500);
    });
  };

  const handleCloseShiftSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await closeShiftAction(formData);
      setFeedback({ type: "success", msg: "Turno encerrado e passagem de serviço registrada!" });
      setModal(null);
      setTimeout(() => setFeedback(null), 3500);
    });
  };

  const filteredUnits = allUnits.filter((u) => u.label.toLowerCase().includes(searchMorador.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-sm font-semibold border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon name={feedback.type === "success" ? "check" : "alert-triangle"} size={18} />
            <span>{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
            <Icon name="x" size={16} />
          </button>
        </div>
      )}

      {/* 1. Top Bar: Shift & Context */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-1 bg-[#0055D4] text-white text-xs font-black rounded-lg uppercase tracking-wider">
              Portaria
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {condoName}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Bom dia, {userName}
          </h1>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${activeShift ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              <strong>{activeShift ? `Turno Ativo (${activeShift.period})` : "Nenhum turno aberto"}</strong>
            </span>
            {activeShift && (
              <>
                <span>·</span>
                <span>Iniciado às {new Date(activeShift.startedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeShift ? (
            <button
              id="btn-encerrar-turno"
              onClick={() => setModal("turno_fechar")}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
            >
              <Icon name="refresh" size={16} />
              Encerrar Turno & Passagem
            </button>
          ) : (
            <button
              id="btn-abrir-turno"
              onClick={() => setModal("turno_abrir")}
              className="px-4 py-2.5 bg-[#0055D4] hover:bg-[#0044AA] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xs"
            >
              <Icon name="check" size={16} />
              Iniciar Turno
            </button>
          )}
          <Link
            href="/painel/turnos"
            className="px-3 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Histórico de Turnos
          </Link>
        </div>
      </div>

      {/* Resumo do turno anterior se houver pendências */}
      {lastShift && lastShift.pendingItems && !activeShift && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-xs">
          <div className="flex items-center gap-2 font-bold mb-1">
            <Icon name="alert-triangle" size={16} className="text-amber-600" />
            <span>Pendências do turno anterior ({lastShift.userName}):</span>
          </div>
          <p className="text-amber-800">{lastShift.pendingItems}</p>
        </div>
      )}

      {/* 2. 4 Primary Operational Quick Action Buttons (EXTREMELY ACCESSIBLE) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          id="btn-autorizar-visitante"
          onClick={() => setModal("autorizar")}
          className="flex flex-col items-start justify-between p-4 bg-[#0055D4] hover:bg-[#0044AA] text-white rounded-2xl shadow-xs transition-all text-left min-h-[108px] group"
        >
          <div className="flex items-center justify-between w-full">
            <span className="p-2 bg-white/10 rounded-xl text-white">
              <Icon name="users" size={20} />
            </span>
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">Acesso</span>
          </div>
          <div>
            <p className="text-sm sm:text-base font-black tracking-tight leading-tight">Autorizar Visitante</p>
            <p className="text-[11px] text-blue-100 font-medium mt-0.5">Liberar entrada / QR</p>
          </div>
        </button>

        <button
          id="btn-registrar-encomenda"
          onClick={() => setModal("encomenda")}
          className="flex flex-col items-start justify-between p-4 bg-slate-900 hover:bg-black text-white rounded-2xl shadow-xs transition-all text-left min-h-[108px] group"
        >
          <div className="flex items-center justify-between w-full">
            <span className="p-2 bg-white/10 rounded-xl text-white">
              <Icon name="package" size={20} />
            </span>
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">+ Novo</span>
          </div>
          <div>
            <p className="text-sm sm:text-base font-black tracking-tight leading-tight">Registrar Encomenda</p>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5">Notifica morador na hora</p>
          </div>
        </button>

        <button
          id="btn-consultar-morador"
          onClick={() => setModal("consultar")}
          className="flex flex-col items-start justify-between p-4 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-2xl shadow-xs transition-all text-left min-h-[108px]"
        >
          <div className="flex items-center justify-between w-full">
            <span className="p-2 bg-slate-100 rounded-xl text-slate-700">
              <Icon name="search" size={20} />
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Busca</span>
          </div>
          <div>
            <p className="text-sm sm:text-base font-black tracking-tight leading-tight">Consultar Unidade</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Moradores & veículos</p>
          </div>
        </button>

        <button
          id="btn-ocorrencia-rapida"
          onClick={() => setModal("ocorrencia")}
          className="flex flex-col items-start justify-between p-4 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-2xl shadow-xs transition-all text-left min-h-[108px]"
        >
          <div className="flex items-center justify-between w-full">
            <span className="p-2 bg-slate-100 rounded-xl text-amber-600">
              <Icon name="clipboard" size={20} />
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Livro</span>
          </div>
          <div>
            <p className="text-sm sm:text-base font-black tracking-tight leading-tight">Ocorrência Rápida</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Registrar evento / foto</p>
          </div>
        </button>
      </div>

      {/* 3. Section “AGORA NA PORTARIA” (Compact Operational Summary) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="clock" size={18} className="text-[#0055D4]" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Agora na Portaria
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Situações operacionais em tempo real</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => setActiveTab("dentro")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activeTab === "dentro"
                ? "bg-blue-50 border-[#0055D4] text-[#0055D4]"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <p className="text-2xl font-black">{overview.insideCount}</p>
            <p className="text-xs font-bold mt-0.5">Dentro do condomínio</p>
            <p className="text-[11px] opacity-75">Visitantes & prestadores</p>
          </button>

          <button
            onClick={() => setActiveTab("esperados")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activeTab === "esperados"
                ? "bg-blue-50 border-[#0055D4] text-[#0055D4]"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <p className="text-2xl font-black">{overview.expectedCount}</p>
            <p className="text-xs font-bold mt-0.5">Visitantes previstos</p>
            <p className="text-[11px] opacity-75">Autorizados hoje</p>
          </button>

          <button
            onClick={() => setActiveTab("encomendas")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activeTab === "encomendas"
                ? "bg-blue-50 border-[#0055D4] text-[#0055D4]"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <p className="text-2xl font-black">{overview.pendingParcelsCount}</p>
            <p className="text-xs font-bold mt-0.5">Encomendas na portaria</p>
            <p className="text-[11px] opacity-75">Aguardando retirada</p>
          </button>

          <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200 text-slate-700">
            <p className="text-2xl font-black">{overview.todayReservationsCount}</p>
            <p className="text-xs font-bold mt-0.5">Reservas de hoje</p>
            <p className="text-[11px] opacity-75">Salão, churrasqueira, etc.</p>
          </div>

          <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200 text-slate-700">
            <p className="text-2xl font-black">{overview.todayProvidersCount}</p>
            <p className="text-xs font-bold mt-0.5">Prestadores autorizados</p>
            <p className="text-[11px] opacity-75">Obras & serviços</p>
          </div>
        </div>
      </div>

      {/* 4. Main Operational Tabs & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab("dentro")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === "dentro" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Quem está dentro ({overview.insideCount})
            </button>
            <button
              onClick={() => setActiveTab("esperados")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === "esperados" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Visitantes esperados ({overview.expectedCount})
            </button>
            <button
              onClick={() => setActiveTab("encomendas")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === "encomendas" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Encomendas ({overview.pendingParcelsCount})
            </button>
          </div>

          {/* TAB 1: QUEM ESTÁ DENTRO */}
          {activeTab === "dentro" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Pessoas no condomínio sem saída registrada
                </h3>
              </div>

              {overview.insideVisitors.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  <Icon name="check" size={24} className="mx-auto text-emerald-500 mb-1.5" />
                  Nenhum visitante ou prestador dentro do condomínio no momento.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {overview.insideVisitors.map((v) => (
                    <div key={v.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{v.name}</span>
                          <span className="px-2 py-0.5 bg-blue-50 text-[#0055D4] text-[10px] font-bold rounded">
                            {v.kind}
                          </span>
                          {v.plate && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded">
                              {v.plate}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Destino: <strong>{v.unit}</strong> {v.hostName ? `(Autorizado por ${v.hostName})` : ""} · Entrada às{" "}
                          {new Date(v.checkinAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleGateMove(v.id, "checkout")}
                        disabled={isPending}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors shrink-0 flex items-center gap-1.5"
                      >
                        <Icon name="logout" size={14} />
                        Registrar Saída
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VISITANTES ESPERADOS */}
          {activeTab === "esperados" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-slate-900">
                  Visitantes autorizados com entrada prevista para hoje
                </h3>
              </div>

              {overview.expectedVisitors.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  <Icon name="users" size={24} className="mx-auto text-slate-300 mb-1.5" />
                  Nenhum visitante pré-cadastrado aguardando entrada.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {overview.expectedVisitors.map((v) => (
                    <div key={v.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{v.name}</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                            {v.kind}
                          </span>
                          {v.plate && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded">
                              {v.plate}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Destino: <strong>{v.unit}</strong> · Morador responsável: <strong>{v.hostName}</strong> · Horário: {v.validTime}
                        </p>
                      </div>
                      <button
                        onClick={() => handleGateMove(v.id, "checkin")}
                        disabled={isPending}
                        className="px-3.5 py-1.5 bg-[#0055D4] hover:bg-[#0044AA] text-white text-xs font-bold rounded-lg transition-colors shrink-0 flex items-center gap-1.5"
                      >
                        <Icon name="check" size={14} />
                        Confirmar Entrada
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ENCOMENDAS */}
          {activeTab === "encomendas" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-slate-900">
                  Encomendas na portaria aguardando retirada pelo morador
                </h3>
              </div>

              {overview.pendingParcels.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  <Icon name="package" size={24} className="mx-auto text-slate-300 mb-1.5" />
                  Nenhuma encomenda pendente de retirada na portaria.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {overview.pendingParcels.map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-[#0055D4]">{p.code}</span>
                          <span className="text-sm font-bold text-slate-900">{p.unit}</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded">
                            {p.carrier}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Prateleira: <strong>{p.shelf}</strong> · Código de Retirada: <strong className="font-mono text-slate-900">{p.pickupCode}</strong> · Chegou {p.receivedTimeAgo}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedParcel(p);
                          setModal("entregar_encomenda");
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0 flex items-center gap-1.5"
                      >
                        <Icon name="check" size={14} />
                        Entregar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SIDEBAR: CONTATOS RÁPIDOS & LIVRO DIGITAL */}
        <div className="space-y-4">
          {/* Contatos Rápidos */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
              <Icon name="phone" size={16} className="text-[#0055D4]" />
              Contatos de Emergência & Apoio
            </h3>
            <div className="space-y-2">
              {EMERGENCY_CONTACTS.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{c.name}</p>
                    <p className="text-[11px] text-slate-500">{c.role}</p>
                  </div>
                  <a
                    href={`tel:${c.phone.replace(/\D/g, "")}`}
                    className="font-mono font-bold text-[#0055D4] bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:border-[#0055D4]"
                  >
                    {c.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Links Rápidos Operacionais */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 mb-2">Acesso Rápido aos Módulos</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link href="/painel/visitantes" className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 font-bold text-slate-800 text-center">
                Visitantes & QR
              </Link>
              <Link href="/painel/encomendas" className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 font-bold text-slate-800 text-center">
                Encomendas
              </Link>
              <Link href="/painel/livro" className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 font-bold text-slate-800 text-center">
                Livro Digital
              </Link>
              <Link href="/painel/reservas" className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 font-bold text-slate-800 text-center">
                Reservas de Hoje
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: AUTORIZAR VISITANTE */}
      {modal === "autorizar" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Icon name="users" size={20} className="text-[#0055D4]" />
                Autorizar Visitante / Prestador
              </h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700">
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleAuthorizeSubmit} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Completo</label>
                <input name="name" required placeholder="Ex: Carlos Silva" className="w-full input text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo</label>
                  <select name="kind" className="w-full input text-sm">
                    <option value="visitante">Visitante</option>
                    <option value="prestador">Prestador / Técnico</option>
                    <option value="entregador">Entregador</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unidade Destino</label>
                  <select name="unitId" required className="w-full input text-sm">
                    <option value="">Selecione a unidade</option>
                    {allUnits.map((u) => (
                      <option key={u.id} value={u.id}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Documento (RG / CNH)</label>
                  <input name="document" placeholder="00.000.000-0" className="w-full input text-sm" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Placa do Veículo</label>
                  <input name="vehiclePlate" placeholder="ABC-1234" className="w-full input text-sm uppercase" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Empresa / Motivo</label>
                <input name="company" placeholder="Ex: Enel / Visita familiar" className="w-full input text-sm" />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 border rounded-xl text-slate-600 font-bold">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="px-5 py-2 bg-[#0055D4] hover:bg-[#0044AA] text-white rounded-xl font-bold">
                  {isPending ? "Gravando..." : "Confirmar & Liberar Entrada"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR ENCOMENDA */}
      {modal === "encomenda" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Icon name="package" size={20} className="text-[#0055D4]" />
                Registrar Encomenda na Portaria
              </h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700">
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleParcelSubmit} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Unidade Destino</label>
                <select name="unitId" required className="w-full input text-sm">
                  <option value="">Selecione a unidade</option>
                  {allUnits.map((u) => (
                    <option key={u.id} value={u.id}>{u.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transportadora / Origem</label>
                  <input name="carrier" placeholder="Ex: Mercado Livre, Amazon, Correios" className="w-full input text-sm" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Local / Prateleira</label>
                  <input name="shelf" placeholder="Ex: Prateleira B2" className="w-full input text-sm" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição do Pacote</label>
                <input name="description" placeholder="Ex: Caixa média, envelope pardo" className="w-full input text-sm" />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 border rounded-xl text-slate-600 font-bold">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl font-bold">
                  {isPending ? "Cadastrando..." : "Registrar & Notificar Morador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENTREGAR ENCOMENDA */}
      {modal === "entregar_encomenda" && selectedParcel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Entregar Encomenda {selectedParcel.code}</h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700">
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleDeliverSubmit} className="space-y-3 mt-4 text-xs">
              <input type="hidden" name="id" value={selectedParcel.id} />
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-900">{selectedParcel.unit} · {selectedParcel.carrier}</p>
                <p className="text-slate-500 mt-0.5">Código de Retirada: <strong className="font-mono text-slate-900">{selectedParcel.pickupCode}</strong></p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Código de Confirmação do Morador</label>
                <input name="pickupCode" placeholder="Informe o código exibido no app" className="w-full input text-sm font-mono" />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome de quem está retirando</label>
                <input name="pickedUpBy" required placeholder="Ex: Morador ou familiar" className="w-full input text-sm" />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Documento de quem retirou</label>
                <input name="pickedUpDocument" placeholder="RG ou CPF" className="w-full input text-sm" />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 border rounded-xl text-slate-600 font-bold">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">
                  {isPending ? "Concluindo..." : "Confirmar Entrega"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONSULTAR UNIDADE */}
      {modal === "consultar" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Icon name="search" size={20} className="text-[#0055D4]" />
                Consulta Rápida de Unidades & Moradores
              </h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700">
                <Icon name="x" size={20} />
              </button>
            </div>

            <div className="py-3 shrink-0">
              <input
                value={searchMorador}
                onChange={(e) => setSearchMorador(e.target.value)}
                placeholder="Digite o número da unidade ou bloco..."
                className="w-full input text-sm"
                autoFocus
              />
            </div>

            <div className="overflow-y-auto space-y-2 pr-1">
              {filteredUnits.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">Nenhuma unidade encontrada.</p>
              ) : (
                filteredUnits.map((u) => (
                  <div key={u.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{u.label}</p>
                      <p className="text-xs text-slate-500">Autorizações ativas · Portaria integrada</p>
                    </div>
                    <button
                      onClick={() => {
                        setModal("autorizar");
                      }}
                      className="px-3 py-1 bg-[#0055D4] text-white text-xs font-bold rounded-lg"
                    >
                      + Acesso
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OCORRÊNCIA RÁPIDA */}
      {modal === "ocorrencia" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Icon name="clipboard" size={20} className="text-amber-600" />
                Registrar Ocorrência Rápida na Portaria
              </h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700">
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleOccurrenceSubmit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título do Evento</label>
                <input name="title" required placeholder="Ex: Falha no portão de pedestres" className="w-full input text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria</label>
                  <select name="category" className="w-full input text-sm">
                    <option value="seguranca">Segurança</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="barulho">Barulho / Convivência</option>
                    <option value="acesso">Acesso / Portão</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gravidade</label>
                  <select name="severity" className="w-full input text-sm">
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Relato dos Fatos / Ação Tomada</label>
                <textarea name="description" rows={3} required placeholder="Descreva o que ocorreu durante o turno..." className="w-full input text-sm" />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 border rounded-xl text-slate-600 font-bold">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="px-5 py-2 bg-[#0055D4] text-white rounded-xl font-bold">
                  {isPending ? "Salvando..." : "Registrar no Livro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FECHAR TURNO */}
      {modal === "turno_fechar" && activeShift && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Icon name="refresh" size={20} className="text-[#0055D4]" />
                Encerrar Turno & Passagem de Serviço
              </h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700">
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleCloseShiftSubmit} className="space-y-3.5 mt-4 text-xs">
              <input type="hidden" name="id" value={activeShift.id} />

              {/* Checklist de conferência automática do fechamento */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
                <p className="font-bold text-slate-900 mb-1">Resumo operacional do turno:</p>
                <p className="text-slate-600">· {overview.insideCount} pessoas dentro do condomínio</p>
                <p className="text-slate-600">· {overview.pendingParcelsCount} encomendas aguardando retirada</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Relato da Passagem de Turno</label>
                <textarea
                  name="handoverNotes"
                  rows={3}
                  required
                  placeholder="Informe rondas realizadas, chaves sob custódia, ocorrências do período..."
                  className="w-full input text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pendências para o próximo porteiro</label>
                <input name="pendingItems" placeholder="Ex: Prestador voltará às 14h; encomenda frágil unidade 302" className="w-full input text-sm" />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 border rounded-xl text-slate-600 font-bold">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl font-bold">
                  {isPending ? "Gravando..." : "Confirmar Encerramento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ABRIR TURNO */}
      {modal === "turno_abrir" && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Iniciar Turno de Portaria</h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700">
                <Icon name="x" size={20} />
              </button>
            </div>

            <form onSubmit={handleOpenShiftSubmit} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Período do Turno</label>
                <select name="period" className="w-full input text-sm">
                  <option value="manha">Manhã (06:00 - 14:00)</option>
                  <option value="tarde">Tarde (14:00 - 22:00)</option>
                  <option value="noite">Noite / Madrugada (22:00 - 06:00)</option>
                </select>
              </div>

              <div className="space-y-1.5 pt-1">
                <p className="font-bold text-slate-900">Checklist de Assunção:</p>
                <label className="flex items-center gap-2 text-slate-700">
                  <input type="checkbox" name="radios" defaultChecked className="h-4 w-4" />
                  Rádios e baterias carregados
                </label>
                <label className="flex items-center gap-2 text-slate-700">
                  <input type="checkbox" name="chaves" defaultChecked className="h-4 w-4" />
                  Chavaria conferida
                </label>
                <label className="flex items-center gap-2 text-slate-700">
                  <input type="checkbox" name="cameras" defaultChecked className="h-4 w-4" />
                  CFTV e gravação operacional
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 border rounded-xl text-slate-600 font-bold">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="px-5 py-2 bg-[#0055D4] text-white rounded-xl font-bold">
                  {isPending ? "Iniciando..." : "Iniciar Turno"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
