"use client";

import { useState, useTransition, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Card, EmptyState, InfoNote, PageHeader, Panel, TableWrap } from "@/components/ui";
import { Icon } from "@/components/icon";
import { dateTimeBR } from "@/lib/utils";
import {
  createVisitAction,
  decideVisitAction,
  gateMoveAction,
  lookupVisitByQrOrTokenAction,
  revokeVisitAction,
  saveVisitorAction,
  toggleBlockVisitorAction,
} from "@/lib/actions/portaria";
import { qrDataUrl } from "@/lib/qr";

export type VisitItem = {
  id: number;
  status: string;
  purpose: string | null;
  validFrom: string | Date;
  validUntil: string | Date;
  qrToken: string;
  checkinAt: string | Date | null;
  checkoutAt: string | Date | null;
  deniedReason: string | null;
  plate: string | null;
  visitorId: number;
  name: string;
  document: string | null;
  kind: string;
  company: string | null;
  blocked: boolean;
  unit: string | null;
  block: string | null;
  host: string | null;
};

export type VisitorItem = {
  id: number;
  condoId: number;
  name: string;
  document: string | null;
  docType: string | null;
  phone: string | null;
  photoUrl: string | null;
  kind: string;
  company: string | null;
  vehiclePlate: string | null;
  recurring: boolean;
  blocked: boolean;
  blockReason: string | null;
  notes: string | null;
  createdAt: string | Date;
};

export type UnitOption = {
  id: number;
  label: string;
};

export type HostOption = {
  id: number;
  name: string;
};

type Props = {
  initialRows: VisitItem[];
  allVisitsInScope: { id: number; status: string }[];
  recurring: VisitorItem[];
  initialStatus: string;
  unitList: UnitOption[];
  hosts: HostOption[];
  isGate: boolean;
  isResident: boolean;
  userRole: string;
  currentUserId: number;
  currentUnitId: number | null;
  initialQrMap: Record<number, string>;
};

export function VisitantesClient({
  initialRows,
  allVisitsInScope,
  recurring,
  initialStatus,
  unitList,
  hosts,
  isGate,
  isResident,
  userRole,
  currentUserId,
  currentUnitId,
  initialQrMap,
}: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<VisitItem[]>(initialRows);
  const [currentStatus, setCurrentStatus] = useState<string>(initialStatus || "todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [qrMap, setQrMap] = useState<Record<number, string>>(initialQrMap);

  // Selected visit for QR Modal
  const [selectedVisitForModal, setSelectedVisitForModal] = useState<VisitItem | null>(null);
  const [modalQrUrl, setModalQrUrl] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Portaria Scanner / Token Modal
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scannerInput, setScannerInput] = useState("");
  const [matchedVisit, setMatchedVisit] = useState<VisitItem | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupSuccess, setLookupSuccess] = useState<string | null>(null);

  // Camera Scanner
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Block Modal
  const [blockModalVisitor, setBlockModalVisitor] = useState<VisitorItem | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState("");

  // Sub-tabs for "Autorizados e Bloqueados"
  const [lowerTab, setLowerTab] = useState<"recorrentes" | "bloqueados">("recorrentes");

  // Form Auto-fill states
  const [selectedVisitorId, setSelectedVisitorId] = useState<string>("");
  const [formName, setFormName] = useState("");
  const [formDocument, setFormDocument] = useState("");
  const [formKind, setFormKind] = useState("visitante");
  const [formCompany, setFormCompany] = useState("");
  const [formPlate, setFormPlate] = useState("");
  const [formRecurring, setFormRecurring] = useState(false);
  const [selectedVisitorBlockedWarning, setSelectedVisitorBlockedWarning] = useState<string | null>(null);

  // State synchronization with props (React 19 pattern)
  const [prevInitialRows, setPrevInitialRows] = useState(initialRows);
  if (initialRows !== prevInitialRows) {
    setPrevInitialRows(initialRows);
    setRows(initialRows);
  }

  const [prevInitialStatus, setPrevInitialStatus] = useState(initialStatus || "todos");
  if ((initialStatus || "todos") !== prevInitialStatus) {
    setPrevInitialStatus(initialStatus || "todos");
    setCurrentStatus(initialStatus || "todos");
  }

  const [formValidFrom, setFormValidFrom] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  const [formValidUntil, setFormValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [formPurpose, setFormPurpose] = useState("");

  // Action feedback alert
  const [actionFeedback, setActionFeedback] = useState<{ tone: "green" | "rose" | "amber"; message: string } | null>(null);

  const [isPending, startTransition] = useTransition();

  // Handlers de auto-preenchimento ao escolher visitante cadastrado
  const handleSelectVisitor = (vId: string) => {
    setSelectedVisitorId(vId);
    if (!vId) {
      setFormName("");
      setFormDocument("");
      setFormKind("visitante");
      setFormCompany("");
      setFormPlate("");
      setFormRecurring(false);
      setSelectedVisitorBlockedWarning(null);
      return;
    }

    const found = recurring.find((r) => String(r.id) === vId);
    if (found) {
      setFormName(found.name);
      setFormDocument(found.document || "");
      setFormKind(found.kind || "visitante");
      setFormCompany(found.company || "");
      setFormPlate(found.vehiclePlate || "");
      setFormRecurring(found.recurring);

      if (found.blocked) {
        setSelectedVisitorBlockedWarning(
          `Atenção: ${found.name} está bloqueado pela administração: "${found.blockReason || "Sem motivo informado"}". Qualquer tentativa de entrada gerará negação de acesso!`
        );
      } else {
        setSelectedVisitorBlockedWarning(null);
      }
    }
  };

  // Status Tone helper
  const getStatusTone = (status: string) => {
    switch (status) {
      case "autorizado":
        return "success";
      case "dentro":
        return "info";
      case "finalizado":
        return "neutral";
      case "negado":
      case "expirado":
      case "bloqueado":
        return "danger";
      case "aguardando":
      default:
        return "warn";
    }
  };

  // Contagens dos filtros
  const counts = useMemo(() => {
    const list = allVisitsInScope.length > 0 ? allVisitsInScope : rows;
    return {
      todos: list.length,
      aguardando: list.filter((v) => v.status === "aguardando").length,
      autorizado: list.filter((v) => v.status === "autorizado").length,
      dentro: list.filter((v) => v.status === "dentro").length,
      finalizado: list.filter((v) => v.status === "finalizado").length,
      negado: list.filter((v) => v.status === "negado").length,
    };
  }, [allVisitsInScope, rows]);

  // Lista de filtros com ícones
  const filterTabs: { key: string; label: string; icon: any }[] = [
    { key: "todos", label: "Todos", icon: "users" },
    { key: "aguardando", label: "Aguardando", icon: "clock" },
    { key: "autorizado", label: "Autorizados", icon: "check-circle" },
    { key: "dentro", label: "No condomínio", icon: "shield" },
    { key: "finalizado", label: "Finalizados", icon: "refresh" },
    { key: "negado", label: "Negados", icon: "alert" },
  ];

  // Filtra registros por status e termo de busca
  const filteredRows = useMemo(() => {
    let result = rows;
    if (currentStatus !== "todos") {
      result = result.filter((v) => v.status === currentStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.name?.toLowerCase().includes(q) ||
          v.document?.toLowerCase().includes(q) ||
          v.plate?.toLowerCase().includes(q) ||
          v.company?.toLowerCase().includes(q) ||
          v.unit?.toLowerCase().includes(q) ||
          v.block?.toLowerCase().includes(q) ||
          v.purpose?.toLowerCase().includes(q) ||
          v.host?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [rows, currentStatus, searchQuery]);

  // Convites ativos destacados
  const highlightedVisits = useMemo(() => {
    return rows.filter((r) => ["autorizado", "dentro", "aguardando"].includes(r.status)).slice(0, 4);
  }, [rows]);

  // Pedidos pendentes para mim (morador ou sindico)
  const pendingForMe = useMemo(() => {
    return rows.filter(
      (r) => r.status === "aguardando" && (isResident ? true : ["sindico", "superadmin"].includes(userRole))
    );
  }, [rows, isResident, userRole]);

  // Abre Modal de QR Code com dados completos
  const handleOpenQrModal = async (visit: VisitItem) => {
    setSelectedVisitForModal(visit);
    if (qrMap[visit.id]) {
      setModalQrUrl(qrMap[visit.id]);
    } else {
      try {
        const generated = await qrDataUrl(visit.qrToken, 240);
        setQrMap((prev) => ({ ...prev, [visit.id]: generated }));
        setModalQrUrl(generated);
      } catch {
        setModalQrUrl("");
      }
    }
  };

  // Copia link seguro
  const handleCopyPassLink = (token: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const passUrl = `${origin}/v/${token}`;
    navigator.clipboard.writeText(passUrl);
    setCopiedKey(token);
    setTimeout(() => setCopiedKey(null), 3000);
  };

  // Compartilha no WhatsApp
  const handleShareWhatsApp = (visit: VisitItem) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const passUrl = `${origin}/v/${visit.qrToken}`;
    const text = `Olá, ${visit.name}! Aqui está o seu convite de acesso para o condomínio:\n\nUnidade: ${visit.block || ""} ${visit.unit || ""}\nVálido até: ${dateTimeBR(visit.validUntil)}\n\nAcesse seu QR Code aqui: ${passUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Submete formulário de novo convite
  const handleCreateVisitSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        const res = await createVisitAction(formData);
        if (res?.success) {
          setActionFeedback({ tone: "green", message: res.message || "Convite criado com sucesso!" });
          // Limpa formulário
          handleSelectVisitor("");
          setFormPurpose("");
          router.refresh();
        } else {
          setActionFeedback({ tone: "rose", message: res?.error || "Erro ao criar convite." });
        }
      } catch (err: any) {
        setActionFeedback({ tone: "rose", message: err.message || "Falha na comunicação com o servidor." });
      }
    });
  };

  // Revoga convite
  const handleRevokeVisit = async (visitId: number) => {
    if (!confirm("Tem certeza que deseja cancelar e revogar este convite de acesso?")) return;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("id", String(visitId));
        const res = await revokeVisitAction(formData);
        if (res?.success) {
          setActionFeedback({ tone: "green", message: res.message });
          setSelectedVisitForModal(null);
          router.refresh();
        } else {
          setActionFeedback({ tone: "rose", message: res?.error || "Erro ao cancelar convite." });
        }
      } catch (err: any) {
        setActionFeedback({ tone: "rose", message: err.message });
      }
    });
  };

  // Check-in ou Check-out rápido na portaria
  const handleGateMove = async (visitId: number, move: "entrada" | "saida") => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("id", String(visitId));
        formData.append("move", move);
        const res = await gateMoveAction(formData);
        if (res?.success) {
          setActionFeedback({ tone: "green", message: res.message });
          // Se estava com modal aberto, atualiza
          if (matchedVisit?.id === visitId) {
            setMatchedVisit((prev) => (prev ? { ...prev, status: move === "entrada" ? "dentro" : "finalizado" } : null));
          }
          router.refresh();
        } else {
          setActionFeedback({ tone: "rose", message: res?.error || `Erro ao registrar ${move}.` });
        }
      } catch (err: any) {
        setActionFeedback({ tone: "rose", message: err.message });
      }
    });
  };

  // Decisão de visita (autorizar ou negar)
  const handleDecideVisit = async (visitId: number, decision: "autorizar" | "negar", reason?: string) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("id", String(visitId));
        formData.append("decision", decision);
        if (reason) formData.append("reason", reason);
        const res = await decideVisitAction(formData);
        if (res?.success) {
          setActionFeedback({ tone: "green", message: res.message });
          if (matchedVisit?.id === visitId) {
            setMatchedVisit((prev) => (prev ? { ...prev, status: decision === "autorizar" ? "autorizado" : "negado" } : null));
          }
          router.refresh();
        } else {
          setActionFeedback({ tone: "rose", message: res?.error || `Erro ao registrar decisão.` });
        }
      } catch (err: any) {
        setActionFeedback({ tone: "rose", message: err.message });
      }
    });
  };

  // Lookup no modal da portaria
  const handleLookupVisit = async (termToLookup?: string) => {
    const term = (termToLookup ?? scannerInput).trim();
    if (!term) {
      setLookupError("Informe o código, token, placa ou nome do visitante.");
      return;
    }
    setLookupError(null);
    setLookupSuccess(null);
    startTransition(async () => {
      try {
        const res = await lookupVisitByQrOrTokenAction(term);
        if (res?.success && res.visit) {
          setMatchedVisit(res.visit);
          setLookupSuccess(`Autorização localizada com sucesso!`);
        } else {
          setMatchedVisit(null);
          setLookupError(res?.error || "Nenhum convite correspondente localizado neste condomínio.");
        }
      } catch (err: any) {
        setMatchedVisit(null);
        setLookupError(err.message || "Erro ao consultar visita.");
      }
    });
  };

  // Câmera do scanner
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError("Câmera não suportada neste navegador ou ambiente.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setIsCameraActive(false);
      setCameraError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Permissão de câmera negada pelo usuário. Utilize a consulta manual por token, placa ou documento."
          : "Não foi possível acessar a câmera do dispositivo."
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleCloseScannerModal = () => {
    stopCamera();
    setMatchedVisit(null);
    setScannerInput("");
    setLookupError(null);
    setLookupSuccess(null);
    setCameraError(null);
    setIsScannerModalOpen(false);
  };

  // Cleanup de câmera ao desmontar componente
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Bloqueio / Desbloqueio administrativo
  const handleToggleBlockSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!blockModalVisitor) return;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("id", String(blockModalVisitor.id));
        formData.append("reason", blockReasonInput || "Restrição administrativa aplicada pelo condomínio");
        const res = await toggleBlockVisitorAction(formData);
        if (res?.success) {
          setActionFeedback({ tone: "green", message: res.message });
          setBlockModalVisitor(null);
          setBlockReasonInput("");
          router.refresh();
        } else {
          setActionFeedback({ tone: "rose", message: res?.error || "Erro ao atualizar restrição." });
        }
      } catch (err: any) {
        setActionFeedback({ tone: "rose", message: err.message });
      }
    });
  };

  return (
    <>
      <PageHeader
        title="Visitantes e prestadores"
        subtitle="Cadastro antecipado, convite com QR Code e validade, autorização do morador, registro de entrada/saída e lista de bloqueio."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isGate && (
              <button
                type="button"
                onClick={() => setIsScannerModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition-all"
              >
                <Icon name="camera" size={15} />
                <span>Validar na portaria (Câmera & QR)</span>
              </button>
            )}
            {isGate && (
              <Link href="/painel/portaria" className="btn-ghost btn-sm">
                <Icon name="shield" size={15} />
                <span>Painel da portaria</span>
              </Link>
            )}
          </div>
        }
      />

      {/* Banner de Feedback de Ações */}
      {actionFeedback && (
        <div
          className={`mb-4 flex items-center justify-between gap-3 rounded-xl p-3.5 text-xs font-semibold shadow-xs transition-all ${
            actionFeedback.tone === "green"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : actionFeedback.tone === "rose"
              ? "bg-rose-50 text-rose-900 border border-rose-200"
              : "bg-amber-50 text-amber-900 border border-amber-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon
              name={actionFeedback.tone === "green" ? "check-circle" : actionFeedback.tone === "rose" ? "alert-triangle" : "alert"}
              size={16}
            />
            <span>{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {/* Barra de Filtros e Busca em Tempo Real */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
        {/* Filter Tabs Capsule */}
        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_-3px_rgba(15,23,42,0.04)] overflow-x-auto max-w-full">
          {filterTabs.map((f) => {
            const isActive = currentStatus === f.key;
            const count = counts[f.key as keyof typeof counts] ?? 0;

            return (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  setCurrentStatus(f.key);
                  const url = new URL(window.location.href);
                  url.searchParams.set("status", f.key);
                  window.history.pushState({}, "", url.toString());
                }}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#1355FF] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon
                  name={f.icon}
                  size={14}
                  strokeWidth={2.2}
                  className={isActive ? "text-white" : "text-slate-400"}
                />
                <span>{f.label}</span>
                <span
                  className={`flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-black tabular-nums transition-colors ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Input de Busca em tempo real */}
        <div className="relative min-w-[240px] max-w-sm">
          <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por visitante, placa, unidade..."
            className="input w-full pl-9 pr-8 text-xs py-2 bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* COLUNA ESQUERDA: Pendências, Histórico e Convites Ativos */}
        <div className="space-y-4 lg:col-span-2">
          {/* Autorizações Pendentes para o Morador/Síndico */}
          {pendingForMe.length > 0 ? (
            <Card title="Autorizações pendentes" description="O morador ou a administração precisa liberar a entrada.">
              <ul className="space-y-2">
                {pendingForMe.map((v) => (
                  <li
                    key={v.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#f0dfbc] bg-[var(--color-warn-soft)] px-3 py-2"
                  >
                    <div>
                      <p className="font-semibold text-[var(--color-ink)]">{v.name}</p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {v.kind} {v.company ? `· ${v.company} ` : ""}· Destino: {v.block ?? ""} {v.unit ?? "—"} · Válido até {dateTimeBR(v.validUntil)}
                      </p>
                      {v.purpose && <p className="text-[11px] text-slate-600 italic mt-0.5">Finalidade: {v.purpose}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDecideVisit(v.id, "autorizar")}
                        disabled={isPending}
                        className="btn-success btn-sm"
                      >
                        Autorizar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecideVisit(v.id, "negar")}
                        disabled={isPending}
                        className="btn-danger btn-sm"
                      >
                        Negar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {/* Histórico de Visitas */}
          <Card
            title="Histórico de visitas"
            description={`Exibindo ${filteredRows.length} de ${rows.length} registros.${
              isResident ? " Filtrado por unidade autorizada." : ""
            }`}
          >
            {filteredRows.length === 0 ? (
              <EmptyState
                title={searchQuery ? "Nenhuma visita encontrada para o termo pesquisado" : "Nenhuma visita registrada"}
                icon="user-check"
              />
            ) : (
              <>
                {/* Mobile Cards View */}
                <div className="md:hidden space-y-2.5">
                  {filteredRows.map((v) => (
                    <div
                      key={v.id}
                      className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{v.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {v.kind}
                            {v.company ? ` · ${v.company}` : ""}
                            {v.document ? ` · ${v.document}` : ""}
                            {v.plate ? ` · Placa: ${v.plate}` : ""}
                          </p>
                        </div>
                        <Badge tone={getStatusTone(v.status) as any}>{v.status}</Badge>
                      </div>

                      <div className="text-xs text-slate-600 space-y-0.5">
                        <p>
                          <strong>Destino:</strong> {v.block ?? "—"} {v.unit ?? ""} {v.host ? `· Anfitrião: ${v.host}` : ""}
                        </p>
                        <p className="text-slate-500 text-[11px]">Válido até: {dateTimeBR(v.validUntil)}</p>
                        {(v.checkinAt || v.checkoutAt || v.deniedReason) && (
                          <p className="text-slate-500 text-[11px]">
                            {v.checkinAt ? `Entrada: ${dateTimeBR(v.checkinAt)}` : ""}
                            {v.checkoutAt ? ` · Saída: ${dateTimeBR(v.checkoutAt)}` : ""}
                            {v.deniedReason ? ` · Motivo: ${v.deniedReason}` : ""}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 no-print">
                        <button
                          type="button"
                          onClick={() => handleOpenQrModal(v)}
                          className="btn-ghost btn-sm"
                        >
                          <Icon name="search" size={13} />
                          <span>Abrir convite / QR</span>
                        </button>

                        <div className="flex flex-wrap gap-1.5">
                          {isGate && v.status === "autorizado" ? (
                            <button
                              type="button"
                              onClick={() => handleGateMove(v.id, "entrada")}
                              disabled={isPending}
                              className="btn-success btn-sm"
                            >
                              Entrada
                            </button>
                          ) : null}
                          {isGate && v.status === "dentro" ? (
                            <button
                              type="button"
                              onClick={() => handleGateMove(v.id, "saida")}
                              disabled={isPending}
                              className="btn-dark btn-sm"
                            >
                              Saída
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <TableWrap>
                    <thead>
                      <tr>
                        <th>Visitante</th>
                        <th>Unidade</th>
                        <th>Validade</th>
                        <th>Entrada / saída</th>
                        <th>Status</th>
                        <th className="no-print">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((v) => (
                        <tr key={v.id}>
                          <td>
                            <span className="font-semibold text-[var(--color-ink)]">{v.name}</span>
                            <span className="block text-xs text-[var(--color-subtle)]">
                              {v.kind}
                              {v.company ? ` · ${v.company}` : ""}
                              {v.document ? ` · ${v.document}` : ""}
                              {v.plate ? ` · Placa: ${v.plate}` : ""}
                            </span>
                          </td>
                          <td className="whitespace-nowrap text-xs">
                            {v.block ?? "—"} {v.unit ?? ""}
                            <span className="block text-[var(--color-subtle)]">{v.host ?? "sem anfitrião"}</span>
                          </td>
                          <td className="whitespace-nowrap text-xs">{dateTimeBR(v.validUntil)}</td>
                          <td className="whitespace-nowrap text-xs">
                            {v.checkinAt ? dateTimeBR(v.checkinAt) : "—"}
                            <span className="block text-[var(--color-subtle)]">
                              {v.checkoutAt ? dateTimeBR(v.checkoutAt) : v.deniedReason ?? ""}
                            </span>
                          </td>
                          <td>
                            <Badge tone={getStatusTone(v.status) as any}>{v.status}</Badge>
                          </td>
                          <td className="no-print">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {isGate && v.status === "autorizado" ? (
                                <button
                                  type="button"
                                  onClick={() => handleGateMove(v.id, "entrada")}
                                  disabled={isPending}
                                  className="btn-success btn-sm"
                                >
                                  Entrada
                                </button>
                              ) : null}
                              {isGate && v.status === "dentro" ? (
                                <button
                                  type="button"
                                  onClick={() => handleGateMove(v.id, "saida")}
                                  disabled={isPending}
                                  className="btn-dark btn-sm"
                                >
                                  Saída
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => handleOpenQrModal(v)}
                                className="btn-ghost btn-sm"
                                title="Visualizar convite e QR Code ampliado"
                              >
                                <Icon name="search" size={13} />
                                <span>Convite</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </TableWrap>
                </div>
              </>
            )}
          </Card>

          {/* Convites Ativos com QR Code (Visualização Rápida) */}
          {highlightedVisits.length > 0 ? (
            <Card
              title="Convites ativos com QR Code"
              description="Compartilhe o convite; a portaria valida o código na chegada."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {highlightedVisits.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs hover:border-slate-300 transition-all"
                  >
                    {qrMap[v.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrMap[v.id]}
                        alt={`QR Code de ${v.name}`}
                        className="h-20 w-20 rounded-lg border border-slate-100 object-contain p-1 bg-white cursor-pointer"
                        onClick={() => handleOpenQrModal(v)}
                      />
                    ) : (
                      <div
                        onClick={() => handleOpenQrModal(v)}
                        className="h-20 w-20 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 cursor-pointer"
                      >
                        <Icon name="search" size={24} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 text-xs space-y-0.5">
                      <p className="truncate font-semibold text-slate-900">{v.name}</p>
                      <p className="text-slate-500">
                        {v.block ?? ""} {v.unit ?? ""}
                      </p>
                      <p className="text-[11px] text-slate-400">até {dateTimeBR(v.validUntil)}</p>
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenQrModal(v)}
                          className="text-[#1355FF] hover:underline font-semibold text-xs inline-flex items-center gap-1"
                        >
                          <Icon name="search" size={12} />
                          <span>Abrir convite</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyPassLink(v.qrToken)}
                          className="text-slate-500 hover:text-slate-700 text-xs inline-flex items-center gap-1"
                          title="Copiar link do convite"
                        >
                          <Icon name="copy" size={12} />
                          <span>{copiedKey === v.qrToken ? "Copiado!" : "Copiar"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>

        {/* COLUNA DIREITA: Formulário Novo Convite e Seção Autorizados/Bloqueados */}
        <div className="space-y-4">
          {/* Formulário Novo Convite com QR Code */}
          <Card
            title="Novo convite de visita"
            description="Cadastre antecipadamente para liberação rápida na portaria com QR Code."
          >
            <form onSubmit={handleCreateVisitSubmit} className="space-y-3">
              {/* Visitante já cadastrado (Auto-complete inteligente) */}
              <label className="block">
                <span className="label font-medium">Visitante já cadastrado</span>
                <select
                  name="visitorId"
                  value={selectedVisitorId}
                  onChange={(e) => handleSelectVisitor(e.target.value)}
                  className="input font-medium"
                >
                  <option value="">— novo cadastro —</option>
                  {recurring.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                      {v.company ? ` (${v.company})` : ""}
                      {v.blocked ? " · [BLOQUEADO]" : ""}
                    </option>
                  ))}
                </select>
              </label>

              {/* Alerta caso o visitante selecionado esteja bloqueado */}
              {selectedVisitorBlockedWarning && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 flex items-start gap-2">
                  <Icon name="alert-triangle" size={15} className="mt-0.5 shrink-0 text-rose-600" />
                  <span>{selectedVisitorBlockedWarning}</span>
                </div>
              )}

              <label className="block">
                <span className="label">Nome completo</span>
                <input
                  name="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="input"
                  placeholder="Nome do visitante ou prestador"
                  required
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="block">
                  <span className="label">Documento</span>
                  <input
                    name="document"
                    value={formDocument}
                    onChange={(e) => setFormDocument(e.target.value)}
                    className="input"
                    placeholder="RG, CPF ou CNH"
                  />
                </label>
                <label className="block">
                  <span className="label">Tipo</span>
                  <select
                    name="kind"
                    value={formKind}
                    onChange={(e) => setFormKind(e.target.value)}
                    className="input"
                  >
                    <option value="visitante">Visitante</option>
                    <option value="prestador">Prestador</option>
                    <option value="entrega">Entrega</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="block">
                  <span className="label">Empresa</span>
                  <input
                    name="company"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="input"
                    placeholder="Se prestador/entrega"
                  />
                </label>
                <label className="block">
                  <span className="label">Placa</span>
                  <input
                    name="visitPlate"
                    value={formPlate}
                    onChange={(e) => setFormPlate(e.target.value.toUpperCase())}
                    className="input uppercase"
                    placeholder="ABC-1234"
                  />
                </label>
              </div>

              {!isResident ? (
                <>
                  <label className="block">
                    <span className="label">Unidade de destino</span>
                    <select name="unitId" className="input" defaultValue={currentUnitId ?? ""}>
                      <option value="">Selecione a unidade</option>
                      {unitList.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="label">Anfitrião</span>
                    <select name="hostUserId" className="input" defaultValue={currentUserId ?? ""}>
                      <option value="">Selecione o anfitrião</option>
                      {hosts.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="block">
                  <span className="label">Válido de</span>
                  <input
                    type="datetime-local"
                    name="validFrom"
                    value={formValidFrom}
                    onChange={(e) => setFormValidFrom(e.target.value)}
                    className="input"
                    required
                  />
                </label>
                <label className="block">
                  <span className="label">Válido até</span>
                  <input
                    type="datetime-local"
                    name="validUntil"
                    value={formValidUntil}
                    onChange={(e) => setFormValidUntil(e.target.value)}
                    className="input"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="label">Finalidade</span>
                <input
                  name="purpose"
                  value={formPurpose}
                  onChange={(e) => setFormPurpose(e.target.value)}
                  className="input"
                  placeholder="Visita social, reparo elétrico, entrega..."
                />
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  name="recurring"
                  checked={formRecurring}
                  onChange={(e) => setFormRecurring(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#1355FF] focus:ring-[#1355FF]"
                />
                <span>Prestador recorrente (fica na lista de autorizados)</span>
              </label>

              <button
                type="submit"
                disabled={isPending}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1355FF] hover:bg-[#0D47E6] text-white px-4 py-2.5 text-xs font-bold shadow-xs hover:shadow-md transition-all disabled:opacity-60 cursor-pointer"
              >
                {isPending ? (
                  <Icon name="refresh" size={15} className="animate-spin" />
                ) : (
                  <Icon name="shield" size={15} />
                )}
                <span>Gerar convite com QR Code</span>
              </button>
            </form>
          </Card>

          {/* Área Inferior: Autorizados e Bloqueados */}
          <Card
            title="Autorizados e bloqueados"
            description="Prestadores frequentes autorizados e restrições de segurança do condomínio."
          >
            {/* Sub-tabs */}
            <div className="flex border-b border-slate-200 mb-3 text-xs">
              <button
                type="button"
                onClick={() => setLowerTab("recorrentes")}
                className={`pb-2 px-3 font-bold border-b-2 transition-all ${
                  lowerTab === "recorrentes"
                    ? "border-[#1355FF] text-[#1355FF]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Recorrentes ({recurring.filter((r) => !r.blocked).length})
              </button>
              <button
                type="button"
                onClick={() => setLowerTab("bloqueados")}
                className={`pb-2 px-3 font-bold border-b-2 transition-all ${
                  lowerTab === "bloqueados"
                    ? "border-rose-600 text-rose-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Bloqueados ({recurring.filter((r) => r.blocked).length})
              </button>
            </div>

            {lowerTab === "recorrentes" ? (
              recurring.filter((r) => !r.blocked).length === 0 ? (
                <EmptyState title="Nenhum prestador recorrente cadastrado" icon="refresh" />
              ) : (
                <ul className="space-y-2 text-xs">
                  {recurring
                    .filter((r) => !r.blocked)
                    .map((v) => (
                      <li
                        key={v.id}
                        className="rounded-xl border border-slate-200/90 bg-white p-3 hover:border-slate-300 transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900">{v.name}</span>
                          {isGate && (
                            <button
                              type="button"
                              onClick={() => {
                                setBlockModalVisitor(v);
                                setBlockReasonInput("Restrição administrativa registrada pela administração");
                              }}
                              className="btn-danger btn-sm"
                            >
                              Bloquear
                            </button>
                          )}
                        </div>
                        <p className="text-slate-500 text-[11px]">
                          {v.company ?? v.kind}
                          {v.document ? ` · Doc: ${v.document}` : ""}
                          {v.vehiclePlate ? ` · Placa: ${v.vehiclePlate}` : ""}
                        </p>
                      </li>
                    ))}
                </ul>
              )
            ) : recurring.filter((r) => r.blocked).length === 0 ? (
              <EmptyState title="Nenhum visitante bloqueado no momento" icon="shield" />
            ) : (
              <ul className="space-y-2 text-xs">
                {recurring
                  .filter((r) => r.blocked)
                  .map((v) => (
                    <li
                      key={v.id}
                      className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-rose-900 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{v.name}</span>
                        {isGate && (
                          <button
                            type="button"
                            onClick={() => {
                              setBlockModalVisitor(v);
                              setBlockReasonInput("");
                            }}
                            className="btn-success btn-sm"
                          >
                            Liberar
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] opacity-80">
                        {v.company ?? v.kind}
                        {v.document ? ` · Doc: ${v.document}` : ""}
                      </p>
                      {v.blockReason && (
                        <p className="mt-1 rounded bg-white/70 px-2 py-1 text-[11px] font-medium border border-rose-200/60">
                          <strong>Motivo:</strong> {v.blockReason}
                        </p>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </Card>

          {/* Cadastro Rápido de Prestador Recorrente (Apenas Portaria / Admin) */}
          {isGate ? (
            <Panel summary="Cadastrar prestador recorrente">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const formData = new FormData(form);
                  startTransition(async () => {
                    try {
                      const res = await saveVisitorAction(formData);
                      if (res?.success) {
                        setActionFeedback({ tone: "green", message: res.message || "Cadastro salvo com sucesso!" });
                        form.reset();
                        router.refresh();
                      } else {
                        setActionFeedback({ tone: "rose", message: res?.error || "Erro ao salvar cadastro." });
                      }
                    } catch (err: any) {
                      setActionFeedback({ tone: "rose", message: err.message });
                    }
                  });
                }}
                className="space-y-3"
              >
                <label className="block">
                  <span className="label">Nome completo</span>
                  <input name="name" className="input" required placeholder="Nome do prestador" />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="block">
                    <span className="label">Documento</span>
                    <input name="document" className="input" placeholder="RG ou CPF" />
                  </label>
                  <label className="block">
                    <span className="label">Telefone</span>
                    <input name="phone" className="input" placeholder="(11) 99999-9999" />
                  </label>
                </div>
                <label className="block">
                  <span className="label">Empresa</span>
                  <input name="company" className="input" placeholder="Ex: Enel, Comgás, Marcenaria..." />
                </label>
                <label className="block">
                  <span className="label">Placa do veículo</span>
                  <input name="vehiclePlate" className="input uppercase" placeholder="ABC-1234" />
                </label>
                <input type="hidden" name="kind" value="prestador" />
                <input type="hidden" name="recurring" value="on" />
                <label className="block">
                  <span className="label">Observações de segurança</span>
                  <textarea
                    name="notes"
                    rows={2}
                    className="input"
                    placeholder="Instruções de acesso, ferramentas autorizadas..."
                  />
                </label>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary w-full inline-flex items-center justify-center gap-2"
                >
                  {isPending ? <Icon name="refresh" size={14} className="animate-spin" /> : <Icon name="check" size={14} />}
                  <span>Salvar prestador recorrente</span>
                </button>
              </form>
            </Panel>
          ) : null}

          <InfoNote>
            Foto e documento são coletados conforme a política do condomínio e a LGPD. O morador é avisado automaticamente
            quando a entrada ou saída é registrada.
          </InfoNote>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ABRIR CONVITE & COMPARTILHAR QR CODE                            */}
      {/* ========================================================================= */}
      {selectedVisitForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1355FF]/10 text-[#1355FF]">
                  <Icon name="shield" size={18} />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Convite de Acesso</h3>
                  <p className="text-[11px] text-slate-500">Apresente este código na portaria</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVisitForModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {/* QR Code and Pass Details */}
            <div className="p-5 flex flex-col items-center border-b border-slate-100 text-center">
              {modalQrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={modalQrUrl}
                  alt={`QR Code de ${selectedVisitForModal.name}`}
                  className="h-48 w-48 rounded-xl border border-slate-200 p-2 shadow-xs bg-white"
                />
              ) : (
                <div className="h-48 w-48 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                  <Icon name="refresh" size={32} className="animate-spin" />
                </div>
              )}
              <p className="mt-2.5 font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                {selectedVisitForModal.qrToken}
              </p>
              <div className="mt-2">
                <Badge tone={getStatusTone(selectedVisitForModal.status) as any}>
                  {selectedVisitForModal.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Pass Metadata List */}
            <dl className="p-5 space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between items-center pt-1">
                <dt className="text-slate-500">Visitante</dt>
                <dd className="font-bold text-slate-900">{selectedVisitForModal.name}</dd>
              </div>
              {selectedVisitForModal.company && (
                <div className="flex justify-between items-center pt-1">
                  <dt className="text-slate-500">Empresa</dt>
                  <dd className="text-slate-800">{selectedVisitForModal.company}</dd>
                </div>
              )}
              {selectedVisitForModal.document && (
                <div className="flex justify-between items-center pt-1">
                  <dt className="text-slate-500">Documento</dt>
                  <dd className="text-slate-800">{selectedVisitForModal.document}</dd>
                </div>
              )}
              {selectedVisitForModal.plate && (
                <div className="flex justify-between items-center pt-1">
                  <dt className="text-slate-500">Placa do veículo</dt>
                  <dd className="font-mono text-slate-800">{selectedVisitForModal.plate}</dd>
                </div>
              )}
              <div className="flex justify-between items-center pt-1">
                <dt className="text-slate-500">Destino</dt>
                <dd className="font-semibold text-slate-900">
                  {selectedVisitForModal.block ?? ""} {selectedVisitForModal.unit ?? "—"}
                  {selectedVisitForModal.host ? ` (${selectedVisitForModal.host})` : ""}
                </dd>
              </div>
              <div className="flex justify-between items-center pt-1">
                <dt className="text-slate-500">Período de validade</dt>
                <dd className="text-slate-800 text-right">
                  {dateTimeBR(selectedVisitForModal.validFrom)} até {dateTimeBR(selectedVisitForModal.validUntil)}
                </dd>
              </div>
              {selectedVisitForModal.purpose && (
                <div className="flex justify-between items-center pt-1">
                  <dt className="text-slate-500">Finalidade</dt>
                  <dd className="text-slate-800">{selectedVisitForModal.purpose}</dd>
                </div>
              )}
            </dl>

            {/* Actions */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyPassLink(selectedVisitForModal.qrToken)}
                  className="btn-outline text-xs justify-center gap-1.5"
                >
                  <Icon name="copy" size={14} />
                  <span>{copiedKey === selectedVisitForModal.qrToken ? "Link copiado!" : "Copiar link"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(selectedVisitForModal)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-bold shadow-xs transition-all"
                >
                  <Icon name="send" size={14} />
                  <span>WhatsApp</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Link
                  href={`/v/${selectedVisitForModal.qrToken}`}
                  target="_blank"
                  className="text-xs text-[#1355FF] hover:underline font-semibold inline-flex items-center gap-1"
                >
                  <Icon name="external-link" size={13} />
                  <span>Página pública do passe</span>
                </Link>

                {/* Revogação se não finalizado/dentro */}
                {!["dentro", "finalizado", "negado"].includes(selectedVisitForModal.status) && (
                  <button
                    type="button"
                    onClick={() => handleRevokeVisit(selectedVisitForModal.id)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1"
                  >
                    <Icon name="x-circle" size={13} />
                    <span>Revogar convite</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: OPERAÇÃO DA PORTARIA (CÂMERA, LEITOR & VALIDAÇÃO)               */}
      {/* ========================================================================= */}
      {isScannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
                  <Icon name="shield" size={18} />
                </span>
                <div>
                  <h3 className="font-bold text-sm">Controle de Portaria & Acesso</h3>
                  <p className="text-[11px] text-slate-300">Validação de QR Code, entradas e saídas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseScannerModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              {/* Câmera / Leitor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Leitura com Câmera</span>
                  {!isCameraActive ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="btn-outline btn-sm text-xs gap-1.5"
                    >
                      <Icon name="camera" size={13} />
                      <span>Ativar câmera</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="btn-danger btn-sm text-xs gap-1.5"
                    >
                      <Icon name="x" size={13} />
                      <span>Desativar câmera</span>
                    </button>
                  )}
                </div>

                {isCameraActive && (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-xl pointer-events-none m-6" />
                    <span className="absolute bottom-2 text-[10px] text-white/80 bg-black/50 px-2 py-0.5 rounded">
                      Posicione o QR Code em frente à lente
                    </span>
                  </div>
                )}

                {cameraError && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 flex items-start gap-2">
                    <Icon name="alert-triangle" size={15} className="mt-0.5 shrink-0 text-amber-600" />
                    <span>{cameraError}</span>
                  </div>
                )}
              </div>

              {/* Consulta Manual / Leitor de Código de Barras USB */}
              <div className="space-y-1.5">
                <span className="label font-medium">Ou digite o código, placa, documento ou nome:</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scannerInput}
                    onChange={(e) => setScannerInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleLookupVisit();
                      }
                    }}
                    placeholder="Cole o link /v/..., token, placa ou nome..."
                    className="input flex-1 text-xs"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleLookupVisit()}
                    disabled={isPending}
                    className="btn-primary text-xs px-4"
                  >
                    {isPending ? <Icon name="refresh" size={14} className="animate-spin" /> : "Consultar"}
                  </button>
                </div>
              </div>

              {/* Alertas de lookup */}
              {lookupError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
                  <Icon name="alert-triangle" size={16} className="mt-0.5 shrink-0 text-rose-600" />
                  <div>
                    <strong className="block font-semibold">Acesso Não Localizado</strong>
                    <span>{lookupError}</span>
                  </div>
                </div>
              )}

              {lookupSuccess && matchedVisit && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2">
                  <Icon name="check-circle" size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>{lookupSuccess}</span>
                </div>
              )}

              {/* Resultado do Visitante Localizado */}
              {matchedVisit && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{matchedVisit.name}</h4>
                      <p className="text-xs text-slate-500">
                        {matchedVisit.kind}
                        {matchedVisit.company ? ` · ${matchedVisit.company}` : ""}
                        {matchedVisit.document ? ` · Doc: ${matchedVisit.document}` : ""}
                        {matchedVisit.plate ? ` · Placa: ${matchedVisit.plate}` : ""}
                      </p>
                    </div>
                    <Badge tone={getStatusTone(matchedVisit.status) as any}>
                      {matchedVisit.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 bg-white p-3 rounded-lg border border-slate-200/80">
                    <p>
                      <strong>Destino:</strong> {matchedVisit.block ?? ""} {matchedVisit.unit ?? "—"}
                      {matchedVisit.host ? ` (Anfitrião: ${matchedVisit.host})` : ""}
                    </p>
                    <p>
                      <strong>Vigência:</strong> {dateTimeBR(matchedVisit.validFrom)} até{" "}
                      {dateTimeBR(matchedVisit.validUntil)}
                    </p>
                    {matchedVisit.purpose && (
                      <p>
                        <strong>Finalidade:</strong> {matchedVisit.purpose}
                      </p>
                    )}
                    {matchedVisit.checkinAt && (
                      <p className="text-emerald-700">
                        <strong>Entrada registrada:</strong> {dateTimeBR(matchedVisit.checkinAt)}
                      </p>
                    )}
                    {matchedVisit.checkoutAt && (
                      <p className="text-slate-600">
                        <strong>Saída registrada:</strong> {dateTimeBR(matchedVisit.checkoutAt)}
                      </p>
                    )}
                  </div>

                  {/* Status Analysis Warning */}
                  {matchedVisit.blocked ? (
                    <div className="rounded-lg bg-rose-100 border border-rose-300 p-2.5 text-xs text-rose-900 font-semibold flex items-center gap-2">
                      <Icon name="alert-triangle" size={16} className="text-rose-700 shrink-0" />
                      <span>ACESSO BLOQUEADO: Visitante consta na lista de restrições do condomínio!</span>
                    </div>
                  ) : new Date(matchedVisit.validUntil) < new Date() && matchedVisit.status !== "dentro" ? (
                    <div className="rounded-lg bg-rose-100 border border-rose-300 p-2.5 text-xs text-rose-900 font-semibold flex items-center gap-2">
                      <Icon name="alert-triangle" size={16} className="text-rose-700 shrink-0" />
                      <span>CONVITE EXPIRADO: O prazo de validade encerrou. Entrada não autorizada!</span>
                    </div>
                  ) : new Date(matchedVisit.validFrom) > new Date() ? (
                    <div className="rounded-lg bg-amber-100 border border-amber-300 p-2.5 text-xs text-amber-900 font-semibold flex items-center gap-2">
                      <Icon name="alert" size={16} className="text-amber-700 shrink-0" />
                      <span>CONVITE FUTURO: Entrada autorizada apenas a partir de {dateTimeBR(matchedVisit.validFrom)}.</span>
                    </div>
                  ) : matchedVisit.status === "aguardando" ? (
                    <div className="rounded-lg bg-amber-100 border border-amber-300 p-2.5 text-xs text-amber-900 font-semibold flex items-center gap-2">
                      <Icon name="clock" size={16} className="text-amber-700 shrink-0" />
                      <span>AGUARDANDO LIBERAÇÃO: O morador ainda não confirmou esta autorização.</span>
                    </div>
                  ) : null}

                  {/* Operational Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    {matchedVisit.status === "autorizado" && (
                      <button
                        type="button"
                        onClick={() => handleGateMove(matchedVisit.id, "entrada")}
                        disabled={isPending}
                        className="btn-success text-xs font-bold py-2 flex-1 justify-center gap-1.5"
                      >
                        <Icon name="check" size={15} />
                        <span>Confirmar Entrada</span>
                      </button>
                    )}

                    {matchedVisit.status === "dentro" && (
                      <button
                        type="button"
                        onClick={() => handleGateMove(matchedVisit.id, "saida")}
                        disabled={isPending}
                        className="btn-dark text-xs font-bold py-2 flex-1 justify-center gap-1.5"
                      >
                        <Icon name="refresh" size={15} />
                        <span>Confirmar Saída</span>
                      </button>
                    )}

                    {matchedVisit.status === "aguardando" && (
                      <div className="flex gap-2 w-full">
                        <button
                          type="button"
                          onClick={() => handleDecideVisit(matchedVisit.id, "autorizar")}
                          disabled={isPending}
                          className="btn-success text-xs flex-1 justify-center"
                        >
                          Autorizar Excepcionalmente
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecideVisit(matchedVisit.id, "negar")}
                          disabled={isPending}
                          className="btn-danger text-xs flex-1 justify-center"
                        >
                          Negar Acesso
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={handleCloseScannerModal}
                className="btn-ghost text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: GERENCIAR BLOQUEIO ADMINISTRATIVO                                */}
      {/* ========================================================================= */}
      {blockModalVisitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {blockModalVisitor.blocked ? "Liberar Restrição de Acesso" : "Registrar Restrição (Bloqueio)"}
              </h3>
              <button
                type="button"
                onClick={() => setBlockModalVisitor(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <form onSubmit={handleToggleBlockSubmit} className="p-5 space-y-4">
              <div>
                <p className="font-bold text-slate-900 text-sm">{blockModalVisitor.name}</p>
                <p className="text-xs text-slate-500">
                  {blockModalVisitor.company ?? blockModalVisitor.kind}
                  {blockModalVisitor.document ? ` · Doc: ${blockModalVisitor.document}` : ""}
                </p>
              </div>

              {!blockModalVisitor.blocked ? (
                <label className="block space-y-1">
                  <span className="label font-medium">Justificativa do Bloqueio:</span>
                  <textarea
                    value={blockReasonInput}
                    onChange={(e) => setBlockReasonInput(e.target.value)}
                    rows={3}
                    className="input text-xs w-full"
                    placeholder="Descreva o motivo administrativo ou ocorrência..."
                    required
                  />
                  <p className="text-[11px] text-slate-400">
                    O bloqueio impede imediatamente qualquer entrada física no condomínio.
                  </p>
                </label>
              ) : (
                <p className="text-xs text-slate-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                  Tem certeza que deseja remover o bloqueio deste visitante? Ele voltará a poder receber convites normais.
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBlockModalVisitor(null)}
                  className="btn-ghost text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={blockModalVisitor.blocked ? "btn-success text-xs px-4" : "btn-danger text-xs px-4"}
                >
                  {isPending ? (
                    <Icon name="refresh" size={14} className="animate-spin" />
                  ) : blockModalVisitor.blocked ? (
                    "Confirmar Liberação"
                  ) : (
                    "Confirmar Bloqueio"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
