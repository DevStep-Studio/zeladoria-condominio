"use client";

import { useState, useTransition, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Card, EmptyState, InfoNote, PageHeader, TableWrap } from "@/components/ui";
import { Icon } from "@/components/icon";
import { dateTimeBR } from "@/lib/utils";
import { deliverParcelAction, registerParcelAction, lookupParcelForDeliveryAction } from "@/lib/actions/portaria";
import { qrDataUrl } from "@/lib/qr";

export type ParcelItem = {
  id: number;
  code: string;
  kind: string;
  carrier: string | null;
  tracking: string | null;
  description: string | null;
  photoUrl?: string | null;
  shelf: string | null;
  status: string;
  pickupCode: string;
  receivedAt: string | Date;
  pickedUpAt: string | Date | null;
  pickedUpBy: string | null;
  pickedUpDocument?: string | null;
  signature: string | null;
  notes?: string | null;
  unit: string;
  block: string;
  receiver: string | null;
  isLate?: boolean;
};

export type UnitOption = {
  id: number;
  label: string;
};

type Props = {
  initialRows: ParcelItem[];
  initialStatus: string;
  unitList: UnitOption[];
  isGate: boolean;
  isResident: boolean;
  initialQrMap: Record<number, string>;
};

export function EncomendasClient({
  initialRows,
  initialStatus,
  unitList,
  isGate,
  isResident,
  initialQrMap,
}: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<ParcelItem[]>(initialRows);
  const [currentStatus, setCurrentStatus] = useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");
  const [qrMap, setQrMap] = useState<Record<number, string>>(initialQrMap);
  const [selectedParcelForQr, setSelectedParcelForQr] = useState<ParcelItem | null>(null);
  const [modalQrUrl, setModalQrUrl] = useState<string>("");

  // Scanner & Validação Portaria
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [codeOrPinInput, setCodeOrPinInput] = useState("");
  const [matchedParcel, setMatchedParcel] = useState<ParcelItem | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupSuccess, setLookupSuccess] = useState<string | null>(null);

  // Formulário de confirmação de entrega
  const [recipientName, setRecipientName] = useState("");
  const [recipientDoc, setRecipientDoc] = useState("");
  const [signatureText, setSignatureText] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Feedback de ações
  const [actionFeedback, setActionFeedback] = useState<{ tone: "green" | "rose" | "amber"; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Câmera do scanner
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Transitions
  const [isPending, startTransition] = useTransition();

  // Sincroniza rows se initialRows mudar
  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  // Sincroniza currentStatus se initialStatus mudar via navegação
  useEffect(() => {
    setCurrentStatus(initialStatus);
  }, [initialStatus]);

  // Cálculo da condição de atraso (7+ dias da data de recebimento)
  const staleBefore = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }, []);

  const enrichedRows = useMemo(() => {
    return rows.map((r) => {
      const recDate = new Date(r.receivedAt);
      const isLate = r.status === "pendente" && recDate < staleBefore;
      return { ...r, isLate };
    });
  }, [rows, staleBefore]);

  const pendingList = useMemo(() => enrichedRows.filter((r) => r.status === "pendente"), [enrichedRows]);
  const lateList = useMemo(() => enrichedRows.filter((r) => r.isLate), [enrichedRows]);
  const deliveredList = useMemo(() => enrichedRows.filter((r) => r.status === "entregue"), [enrichedRows]);

  // Filtragem da lista
  const displayItems = useMemo(() => {
    let items = enrichedRows;
    if (currentStatus === "atrasada") {
      items = lateList;
    } else if (currentStatus === "pendente") {
      items = pendingList.filter((p) => !p.isLate);
    } else if (currentStatus === "entregue") {
      items = deliveredList;
    }

    if (!searchQuery.trim()) return items;

    const query = searchQuery.trim().toLowerCase();
    return items.filter((p) => {
      const matchCode = p.code.toLowerCase().includes(query);
      const matchTracking = p.tracking ? p.tracking.toLowerCase().includes(query) : false;
      const matchCarrier = p.carrier ? p.carrier.toLowerCase().includes(query) : false;
      const matchUnit = p.unit ? p.unit.toLowerCase().includes(query) : false;
      const matchBlock = p.block ? p.block.toLowerCase().includes(query) : false;
      const matchDescription = p.description ? p.description.toLowerCase().includes(query) : false;
      const matchPickup = p.pickedUpBy ? p.pickedUpBy.toLowerCase().includes(query) : false;
      const matchPin = isGate ? p.pickupCode.includes(query) : false;
      return matchCode || matchTracking || matchCarrier || matchUnit || matchBlock || matchDescription || matchPickup || matchPin;
    });
  }, [enrichedRows, currentStatus, lateList, pendingList, deliveredList, searchQuery, isGate]);

  // Gera QR Code quando o modal do morador abre
  useEffect(() => {
    if (selectedParcelForQr && selectedParcelForQr.pickupCode) {
      qrDataUrl(`ENC:${selectedParcelForQr.code}:${selectedParcelForQr.pickupCode}`, 260)
        .then(setModalQrUrl)
        .catch(() => setModalQrUrl(""));
    } else {
      setModalQrUrl("");
    }
  }, [selectedParcelForQr]);

  // Cópia para área de transferência
  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  }

  // Abre validação de portaria para uma encomenda específica
  function openDeliveryModalForParcel(parcel: ParcelItem) {
    setMatchedParcel(parcel);
    setCodeOrPinInput(parcel.pickupCode);
    setRecipientName(parcel.pickedUpBy || "");
    setRecipientDoc(parcel.pickedUpDocument || "");
    setSignatureText(parcel.signature || "");
    setDeliveryNotes(parcel.notes || "");
    setLookupError(null);
    setLookupSuccess(null);
    setIsScannerModalOpen(true);
  }

  // Busca de encomenda por código/PIN no modal da portaria
  async function handleLookup() {
    const term = codeOrPinInput.trim();
    if (!term) {
      setLookupError("Informe o código de 6 dígitos ou o código ENC.");
      setMatchedParcel(null);
      return;
    }

    setLookupError(null);
    setLookupSuccess(null);

    // Tenta correspondência local instantânea
    let cleanCode = term;
    let cleanPin = term;
    if (term.startsWith("ENC:")) {
      const parts = term.split(":");
      if (parts.length >= 3) {
        cleanCode = parts[1];
        cleanPin = parts[2];
      }
    }

    const localFound = enrichedRows.find(
      (p) =>
        p.code.toLowerCase() === cleanCode.toLowerCase() ||
        p.pickupCode === cleanPin ||
        (p.tracking && p.tracking.toLowerCase() === term.toLowerCase())
    );

    if (localFound) {
      setMatchedParcel(localFound);
      setRecipientName(localFound.pickedUpBy || "");
      setRecipientDoc(localFound.pickedUpDocument || "");
      setSignatureText(localFound.signature || "");
      if (localFound.status === "entregue") {
        setLookupError(`Atenção: esta encomenda já foi retirada em ${dateTimeBR(localFound.pickedUpAt)} por ${localFound.pickedUpBy || "morador"}.`);
      } else {
        setLookupSuccess("Encomenda localizada com sucesso.");
      }
      return;
    }

    // Se não encontrou localmente, consulta via server action
    startTransition(async () => {
      try {
        const res = await lookupParcelForDeliveryAction(term);
        if (res.success && res.parcel) {
          const parcelItem = res.parcel as ParcelItem;
          setMatchedParcel(parcelItem);
          setRecipientName(parcelItem.pickedUpBy || "");
          setRecipientDoc(parcelItem.pickedUpDocument || "");
          setSignatureText(parcelItem.signature || "");
          if (parcelItem.status === "entregue") {
            setLookupError(`Atenção: esta encomenda já foi retirada em ${dateTimeBR(parcelItem.pickedUpAt)} por ${parcelItem.pickedUpBy || "morador"}.`);
          } else {
            setLookupSuccess("Encomenda localizada com sucesso.");
          }
        } else {
          setLookupError(res.error || "Nenhuma encomenda encontrada com o código informado neste condomínio.");
          setMatchedParcel(null);
        }
      } catch (err: any) {
        setLookupError(err.message || "Erro ao consultar encomenda.");
        setMatchedParcel(null);
      }
    });
  }

  // Confirmação de entrega
  async function handleConfirmDelivery(e: React.FormEvent) {
    e.preventDefault();
    if (!matchedParcel) return;

    if (!recipientName.trim()) {
      setLookupError("Informe o nome da pessoa que está retirando a encomenda.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(matchedParcel.id));
      formData.set("pickupCode", matchedParcel.pickupCode);
      formData.set("pickedUpBy", recipientName.trim());
      formData.set("pickedUpDocument", recipientDoc.trim());
      formData.set("signature", signatureText.trim() || recipientName.trim());
      formData.set("notes", deliveryNotes.trim());

      try {
        const res = await deliverParcelAction(formData);
        if (res.success) {
          // Atualiza estado local imediatamente
          const now = new Date();
          setRows((prev) =>
            prev.map((item) =>
              item.id === matchedParcel.id
                ? {
                    ...item,
                    status: "entregue",
                    pickedUpAt: now,
                    pickedUpBy: recipientName.trim(),
                    pickedUpDocument: recipientDoc.trim() || null,
                    signature: signatureText.trim() || recipientName.trim(),
                    notes: deliveryNotes.trim() || item.notes,
                    isLate: false,
                  }
                : item
            )
          );

          setActionFeedback({
            tone: "green",
            message: `Retirada da encomenda ${matchedParcel.code} confirmada com sucesso! Notificação enviada ao morador.`,
          });
          setIsScannerModalOpen(false);
          setMatchedParcel(null);
          setCodeOrPinInput("");
          router.refresh();
        } else {
          setLookupError(res.error || "Não foi possível confirmar a entrega.");
        }
      } catch (err: any) {
        setLookupError(err.message || "Erro inesperado ao registrar entrega.");
      }
    });
  }

  // Registro de nova encomenda pela portaria
  async function handleRegisterParcel(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        const res = await registerParcelAction(formData);
        if (res.success && res.parcel) {
          form.reset();
          setActionFeedback({
            tone: "green",
            message: `Encomenda ${res.parcel.code} registrada com sucesso na portaria! Notificação disparada ao morador.`,
          });
          router.refresh();
        } else {
          setActionFeedback({
            tone: "rose",
            message: res.error || "Erro ao registrar encomenda. Verifique os dados.",
          });
        }
      } catch (err: any) {
        setActionFeedback({
          tone: "rose",
          message: err.message || "Erro inesperado ao registrar encomenda.",
        });
      }
    });
  }

  // Câmera do scanner
  async function startCamera() {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setIsCameraActive(false);
      setLookupError("Não foi possível acessar a câmera. Você pode digitar o código de 6 dígitos ou usar leitor USB.");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const filterTabs = [
    { key: "todas", label: "Todas", icon: "grid", count: rows.length },
    { key: "pendente", label: "Aguardando retirada", icon: "package", count: pendingList.length },
    { key: "atrasada", label: "Atrasadas", icon: "clock", count: lateList.length },
    { key: "entregue", label: "Entregues", icon: "check-circle", count: deliveredList.length },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Encomendas e correspondências"
          subtitle="Registro na portaria, notificação automática ao morador, código/QR de retirada e confirmação digital de quem retirou."
        />
        {isGate && (
          <div className="shrink-0 pt-1 sm:pt-0">
            <button
              type="button"
              id="btn-validar-retirada"
              onClick={() => {
                setMatchedParcel(null);
                setCodeOrPinInput("");
                setLookupError(null);
                setLookupSuccess(null);
                setIsScannerModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 active:scale-95 transition-all"
            >
              <Icon name="camera" size={16} strokeWidth={2.2} className="text-amber-400" />
              <span>Validar Retirada (QR / Código)</span>
            </button>
          </div>
        )}
      </div>

      {/* Alerta de Feedback Global */}
      {actionFeedback && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-xs font-semibold shadow-2xs transition-all ${
            actionFeedback.tone === "green"
              ? "border-emerald-200 bg-emerald-50/90 text-emerald-900"
              : actionFeedback.tone === "amber"
              ? "border-amber-200 bg-amber-50/90 text-amber-900"
              : "border-rose-200 bg-rose-50/90 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon
              name={actionFeedback.tone === "green" ? "check-circle" : "alert-triangle"}
              size={16}
              className={actionFeedback.tone === "green" ? "text-emerald-600" : "text-rose-600"}
            />
            <span>{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-slate-700"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {/* 3 Indicadores Principais (KPI Cards Interativos) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => {
            setCurrentStatus("pendente");
            router.push("/painel/encomendas?status=pendente");
          }}
          className={`group relative flex flex-col justify-between text-left rounded-[22px] border p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
            currentStatus === "pendente"
              ? "border-[#1355FF] bg-blue-50/20 ring-2 ring-blue-500/10"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-110">
              <Icon name="package" size={18} strokeWidth={2.2} />
            </span>
            <Icon
              name="arrow-up-right"
              size={15}
              strokeWidth={2.4}
              className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
            />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">
              {pendingList.length}
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-[#1355FF] transition-colors">
              Aguardando retirada
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Disponíveis na portaria
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentStatus("atrasada");
            router.push("/painel/encomendas?status=atrasada");
          }}
          className={`group relative flex flex-col justify-between text-left rounded-[22px] border p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
            currentStatus === "atrasada"
              ? "border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/10"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-transform group-hover:scale-110">
              <Icon name="clock" size={18} strokeWidth={2.2} />
            </span>
            <Icon
              name="arrow-up-right"
              size={15}
              strokeWidth={2.4}
              className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
            />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">
              {lateList.length}
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-rose-600 transition-colors">
              Atrasadas (7+ dias)
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {lateList.length > 0 ? "Cobrar retirada do morador" : "Nenhuma com atraso"}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentStatus("entregue");
            router.push("/painel/encomendas?status=entregue");
          }}
          className={`group relative flex flex-col justify-between text-left rounded-[22px] border p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
            currentStatus === "entregue"
              ? "border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/10"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
              <Icon name="check-circle" size={18} strokeWidth={2.2} />
            </span>
            <Icon
              name="arrow-up-right"
              size={15}
              strokeWidth={2.4}
              className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
            />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">
              {deliveredList.length}
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-emerald-600 transition-colors">
              Entregues
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Com confirmação digital
            </p>
          </div>
        </button>
      </div>

      {/* Barra de Filtros e Busca Rápida */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4 mb-2">
        {/* Filter Tabs Capsule */}
        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_-3px_rgba(15,23,42,0.04)] no-print overflow-x-auto max-w-full">
          {filterTabs.map((tab) => {
            const isActive = currentStatus === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setCurrentStatus(tab.key);
                  router.push(`/painel/encomendas?status=${tab.key}`);
                }}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#1355FF] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon
                  name={tab.icon as any}
                  size={14}
                  strokeWidth={2.2}
                  className={isActive ? "text-white" : "text-slate-400"}
                />
                <span>{tab.label}</span>
                <span
                  className={`flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-black tabular-nums transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Campo de Busca Rápida */}
        <div className="relative w-full md:w-72">
          <Icon name="search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código, rastreio, unidade..."
            className="w-full rounded-xl border border-slate-200/90 bg-white py-2 pl-9 pr-8 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#1355FF] focus:outline-none focus:ring-2 focus:ring-blue-500/10 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <Icon name="x" size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Coluna Principal: Listagem de Encomendas */}
        <div className="space-y-4 lg:col-span-2">
          <Card title={`Encomendas (${displayItems.length})`}>
            {displayItems.length === 0 ? (
              <EmptyState
                title="Nenhuma encomenda neste filtro"
                icon="package"
                description={
                  searchQuery
                    ? "Nenhum resultado corresponde à sua pesquisa."
                    : "Nenhuma encomenda cadastrada nesta categoria."
                }
              />
            ) : (
              <div className="space-y-3">
                {displayItems.map((p) => {
                  const qrUrl = qrMap[p.id];
                  return (
                    <div
                      key={p.id}
                      className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.04)] hover:shadow-md hover:border-slate-300 transition-all duration-200"
                    >
                      <div className="flex flex-col xs:flex-row items-start gap-3 sm:gap-4">
                        {/* QR Code Clicável */}
                        {qrUrl ? (
                          <button
                            type="button"
                            onClick={() => setSelectedParcelForQr(p)}
                            title="Clique para ver o QR Code ampliado"
                            className="relative shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xs hover:border-[#1355FF] hover:ring-2 hover:ring-blue-500/10 transition-all cursor-pointer group-hover:scale-102"
                          >
                            <img
                              src={qrUrl}
                              alt="QR Code de retirada"
                              className="h-20 w-20 object-contain"
                            />
                            <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                                Ampliar
                              </span>
                            </div>
                          </button>
                        ) : (
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                            <Icon name="package" size={28} />
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-black text-slate-900 tracking-tight">
                              {p.code}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">·</span>
                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              {p.block} {p.unit}
                            </span>
                            {p.isLate ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-black text-rose-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                                Atrasada (+7d)
                              </span>
                            ) : p.status === "entregue" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-black text-emerald-700">
                                <Icon name="check" size={11} strokeWidth={2.5} />
                                Entregue
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-black text-amber-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                Aguardando retirada
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 pt-0.5">
                            <Icon name="truck" size={13} className="text-slate-400 shrink-0" />
                            <span>{p.carrier ?? "Sem transportadora informada"}</span>
                            {p.tracking && (
                              <>
                                <span>·</span>
                                <span className="font-mono text-[11px] text-slate-700">{p.tracking}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(p.tracking!, `track-${p.id}`)}
                                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                                  title="Copiar código de rastreamento"
                                >
                                  {copiedKey === `track-${p.id}` ? (
                                    <span className="text-[10px] text-emerald-600 font-bold">Copiado!</span>
                                  ) : (
                                    <Icon name="copy" size={11} />
                                  )}
                                </button>
                              </>
                            )}
                            <span className="text-slate-300">|</span>
                            <span className="capitalize">{p.kind}</span>
                          </p>

                          <p className="text-[11px] text-slate-400">
                            Recebida em {dateTimeBR(p.receivedAt)} por {p.receiver ?? "portaria"} · Local:{" "}
                            <strong className="text-slate-700 font-bold bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200/60">
                              {p.shelf ?? "Portaria"}
                            </strong>
                          </p>

                          {/* Código de retirada e Ação rápida */}
                          <div className="pt-1.5 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">Código de retirada:</span>
                            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-black text-amber-300 tracking-wider shadow-xs">
                              {isGate || isResident ? p.pickupCode : "••••••"}
                            </span>
                            {(isGate || isResident) && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(p.pickupCode, `pin-${p.id}`)}
                                className="text-slate-400 hover:text-slate-700 text-[11px] font-semibold"
                                title="Copiar código PIN"
                              >
                                {copiedKey === `pin-${p.id}` ? "Copiado!" : "Copiar"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botão de Operação para Portaria */}
                      {isGate && p.status === "pendente" && (
                        <div className="w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => openDeliveryModalForParcel(p)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
                          >
                            <Icon name="check" size={14} strokeWidth={2.5} />
                            <span>Confirmar entrega</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Histórico Consolidado por Unidade */}
          <Card title="Histórico por unidade">
            {rows.length === 0 ? (
              <EmptyState title="Sem histórico" icon="package" />
            ) : (
              <>
                {/* Mobile Cards View */}
                <div className="md:hidden space-y-2.5">
                  {rows.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">{p.code}</span>
                        <Badge tone={p.status === "entregue" ? "green" : "amber"}>{p.status}</Badge>
                      </div>
                      <p className="text-slate-600 font-medium">Unidade: {p.block} {p.unit}</p>
                      <p className="text-slate-400 text-[11px]">Recebido: {dateTimeBR(p.receivedAt)}</p>
                      {p.pickedUpAt && (
                        <div className="pt-1 border-t border-slate-100 space-y-0.5">
                          <p className="text-emerald-700 font-semibold text-[11px]">
                            Entregue em {dateTimeBR(p.pickedUpAt)} para {p.pickedUpBy}
                          </p>
                          {p.pickedUpDocument && (
                            <p className="text-slate-400 text-[10px]">Doc: {p.pickedUpDocument}</p>
                          )}
                          {p.signature && (
                            <p className="text-slate-500 text-[10px] font-mono">Assinado: {p.signature}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <TableWrap>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Unidade</th>
                        <th>Recebida</th>
                        <th>Retirada</th>
                        <th>Comprovação</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((p) => (
                        <tr key={p.id}>
                          <td className="font-mono text-xs font-bold text-slate-900">{p.code}</td>
                          <td className="text-xs font-medium">{p.block} {p.unit}</td>
                          <td className="whitespace-nowrap text-xs text-slate-600">{dateTimeBR(p.receivedAt)}</td>
                          <td className="text-xs">
                            {p.pickedUpAt ? (
                              <span className="text-slate-700 font-medium">{dateTimeBR(p.pickedUpAt)}</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="text-xs">
                            {p.pickedUpAt ? (
                              <div>
                                <span className="font-semibold text-slate-900">{p.pickedUpBy}</span>
                                {p.pickedUpDocument && (
                                  <span className="block text-[11px] text-slate-400">Doc: {p.pickedUpDocument}</span>
                                )}
                                {p.signature && (
                                  <span className="block text-[10px] text-slate-500 font-mono">Ass: {p.signature}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td>
                            <Badge tone={p.status === "entregue" ? "green" : "amber"}>{p.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </TableWrap>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Coluna Lateral: Formulário Portaria ou Como Retirar */}
        <div className="space-y-4">
          {isGate ? (
            <Card title="Registrar encomenda">
              <form onSubmit={handleRegisterParcel} className="space-y-3">
                <label className="block">
                  <span className="label">Unidade destinatária *</span>
                  <select name="unitId" className="input" required defaultValue="">
                    <option value="" disabled>Selecione a unidade</option>
                    {unitList.map((u) => (
                      <option key={u.id} value={u.id}>{u.label}</option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="block">
                    <span className="label">Tipo</span>
                    <select name="kind" className="input" defaultValue="encomenda">
                      <option value="encomenda">Encomenda</option>
                      <option value="correspondencia">Correspondência</option>
                      <option value="delivery">Delivery</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="label">Transportadora</span>
                    <input name="carrier" className="input" placeholder="Correios, ML, Amazon..." />
                  </label>
                </div>

                <label className="block">
                  <span className="label">Código de rastreamento</span>
                  <input name="trackingCode" className="input" placeholder="BR123456789BR" />
                </label>

                <label className="block">
                  <span className="label">Descrição</span>
                  <input name="description" className="input" placeholder="Caixa média, envelope pardo..." />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="block">
                    <span className="label">Local de guarda</span>
                    <input name="shelf" className="input" placeholder="Prateleira A2, Armário..." />
                  </label>
                  <label className="block">
                    <span className="label">Foto (URL opcional)</span>
                    <input name="photoUrl" className="input" placeholder="https://..." />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Icon name="refresh" size={14} className="animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="check" size={15} />
                      <span>Registrar e notificar morador</span>
                    </>
                  )}
                </button>
              </form>
            </Card>
          ) : (
            <Card title="Como retirar sua encomenda">
              <ol className="list-decimal space-y-2.5 pl-4 text-xs font-medium text-slate-600 leading-relaxed">
                <li>Apresente o <strong>QR Code</strong> ou o <strong>Código numérico de 6 dígitos</strong> ao chegar na portaria.</li>
                <li>O porteiro confere seu documento com foto e busca o pacote no local de guarda indicado.</li>
                <li>A confirmação digital é registrada com data, hora, recebedor e assinatura digital do morador.</li>
              </ol>
            </Card>
          )}

          <InfoNote tone="amber">
            Encomendas pendentes há mais de 7 dias são sinalizadas automaticamente como atrasadas e geram alerta no comunicado semanal.
          </InfoNote>
        </div>
      </div>

      {/* MODAL 1: QR CODE AMPLIADO DO MORADOR */}
      {selectedParcelForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <button
              type="button"
              onClick={() => setSelectedParcelForQr(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <Icon name="x" size={18} />
            </button>

            <div className="text-center space-y-1">
              <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest">
                Credencial de Retirada
              </span>
              <h3 className="text-xl font-black text-slate-900">
                {selectedParcelForQr.code}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedParcelForQr.block} {selectedParcelForQr.unit} · {selectedParcelForQr.carrier ?? "Encomenda"}
              </p>
            </div>

            {/* QR Code em alta definição */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              {modalQrUrl ? (
                <img
                  src={modalQrUrl}
                  alt="QR Code de Retirada"
                  className="h-48 w-48 object-contain rounded-xl bg-white p-2 shadow-2xs"
                />
              ) : (
                <div className="h-48 w-48 flex items-center justify-center bg-slate-100 rounded-xl">
                  <Icon name="refresh" size={24} className="animate-spin text-slate-400" />
                </div>
              )}

              <div className="mt-4 text-center">
                <span className="text-[11px] font-semibold text-slate-500 block">Código numérico PIN:</span>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="font-mono text-2xl font-black tracking-widest text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-xl shadow-xs">
                    {selectedParcelForQr.pickupCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedParcelForQr.pickupCode, "modal-pin")}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 shadow-xs"
                    title="Copiar código PIN"
                  >
                    <Icon name="copy" size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 bg-blue-50/50 border border-blue-100 p-3 rounded-xl">
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Local de guarda:</span>
                <strong className="text-slate-900 font-bold">{selectedParcelForQr.shelf ?? "Portaria"}</strong>
              </p>
              {selectedParcelForQr.tracking && (
                <p className="flex items-center justify-between">
                  <span className="text-slate-500">Rastreamento:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedParcelForQr.tracking}</span>
                </p>
              )}
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Status:</span>
                <Badge tone={selectedParcelForQr.status === "entregue" ? "green" : "amber"}>
                  {selectedParcelForQr.status}
                </Badge>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedParcelForQr(null)}
              className="btn-secondary w-full"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: SCANNER & VALIDAÇÃO RÁPIDA DA PORTARIA */}
      {isScannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5 my-8">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setIsScannerModalOpen(false);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <Icon name="x" size={18} />
            </button>

            <div>
              <span className="font-mono text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                Operação de Portaria
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Validação de Retirada de Encomenda
              </h3>
              <p className="text-xs text-slate-500">
                Digite o código de 6 dígitos, bipe com o leitor ou escaneie o QR Code do morador.
              </p>
            </div>

            {/* Input de Busca / Bipe */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={codeOrPinInput}
                  onChange={(e) => setCodeOrPinInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleLookup();
                    }
                  }}
                  placeholder="Código de 6 dígitos ou ENC-..."
                  className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 font-mono text-sm font-bold text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:border-[#1355FF] focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                />
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={isPending}
                  className="btn-primary shrink-0 px-4"
                >
                  {isPending ? "Buscando..." : "Buscar"}
                </button>
              </div>

              {/* Botão de Câmera */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Leitor USB ou câmera do aparelho</span>
                {!isCameraActive ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center gap-1 font-bold text-[#1355FF] hover:underline"
                  >
                    <Icon name="camera" size={13} />
                    <span>Ligar câmera</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="inline-flex items-center gap-1 font-bold text-rose-600 hover:underline"
                  >
                    <Icon name="x" size={13} />
                    <span>Desligar câmera</span>
                  </button>
                )}
              </div>

              {/* Stream de Vídeo da Câmera */}
              {isCameraActive && (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-slate-700">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
                  </div>
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white bg-slate-900/80 px-2.5 py-0.5 rounded-full">
                    Aponte para o QR Code do morador
                  </span>
                </div>
              )}
            </div>

            {/* Mensagens de Feedback de Consulta */}
            {lookupError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                <Icon name="alert-triangle" size={15} className="shrink-0 text-rose-600" />
                <span>{lookupError}</span>
              </div>
            )}

            {lookupSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                <Icon name="check-circle" size={15} className="shrink-0 text-emerald-600" />
                <span>{lookupSuccess}</span>
              </div>
            )}

            {/* Dados da Encomenda Localizada */}
            {matchedParcel && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="font-mono text-base font-black text-slate-900 block">
                      {matchedParcel.code}
                    </span>
                    <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md mt-1 inline-block">
                      {matchedParcel.block} {matchedParcel.unit}
                    </span>
                  </div>
                  <Badge tone={matchedParcel.status === "entregue" ? "green" : "amber"}>
                    {matchedParcel.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Transportadora:</span>
                    <strong className="text-slate-800">{matchedParcel.carrier ?? "Não informada"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Local de guarda:</span>
                    <strong className="text-amber-800 font-bold bg-amber-100/60 px-1.5 py-0.5 rounded">
                      {matchedParcel.shelf ?? "Portaria"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Descrição:</span>
                    <span className="text-slate-700">{matchedParcel.description ?? "Sem descrição"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Recebido em:</span>
                    <span className="text-slate-700">{dateTimeBR(matchedParcel.receivedAt)}</span>
                  </div>
                </div>

                {/* Formulário de Entrega (Apenas se pendente) */}
                {matchedParcel.status === "pendente" ? (
                  <form onSubmit={handleConfirmDelivery} className="space-y-3 pt-2 border-t border-slate-200">
                    <span className="label block font-bold text-slate-900">
                      Identificação de quem está retirando:
                    </span>

                    <label className="block">
                      <span className="text-[11px] font-semibold text-slate-600">Nome completo do retirante *</span>
                      <input
                        type="text"
                        required
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Ex: Carlos Alberto da Silva"
                        className="input text-xs font-medium"
                      />
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="block">
                        <span className="text-[11px] font-semibold text-slate-600">Documento (RG / CPF)</span>
                        <input
                          type="text"
                          value={recipientDoc}
                          onChange={(e) => setRecipientDoc(e.target.value)}
                          placeholder="000.000.000-00"
                          className="input text-xs"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[11px] font-semibold text-slate-600">Assinatura digital (nome)</span>
                        <input
                          type="text"
                          value={signatureText}
                          onChange={(e) => setSignatureText(e.target.value)}
                          placeholder="Nome por extenso"
                          className="input text-xs"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-[11px] font-semibold text-slate-600">Observações adicionais</span>
                      <input
                        type="text"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="Ex: Retirado pelo filho / prestador autorizado"
                        className="input text-xs"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={isPending}
                      className="btn-success w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold"
                    >
                      {isPending ? (
                        <>
                          <Icon name="refresh" size={14} className="animate-spin" />
                          <span>Processando entrega...</span>
                        </>
                      ) : (
                        <>
                          <Icon name="check" size={15} strokeWidth={2.5} />
                          <span>Confirmar Retirada Digital</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-800 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Icon name="alert-triangle" size={14} className="text-rose-600" />
                      Encomenda já entregue
                    </p>
                    <p>
                      Entregue em {dateTimeBR(matchedParcel.pickedUpAt)} para <strong>{matchedParcel.pickedUpBy}</strong>.
                    </p>
                    {matchedParcel.pickedUpDocument && <p>Documento: {matchedParcel.pickedUpDocument}</p>}
                    <p className="text-[11px] text-rose-600 pt-1">
                      O código de retirada foi invalidado no ato da entrega e não permite novas retiradas.
                    </p>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                stopCamera();
                setIsScannerModalOpen(false);
              }}
              className="btn-secondary w-full"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
