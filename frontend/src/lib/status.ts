export function statusTone(status?: string | null) {
  if (!status || typeof status !== "string") return "neutral";
  const s = status.toLowerCase().replace(/_/g, " ");
  if (
    [
      "autorizado",
      "aprovada",
      "aprovado",
      "entregue",
      "concluida",
      "concluido",
      "pago",
      "paga",
      "ativo",
      "vigente",
      "operacional",
      "retirado",
      "finalizado",
      "fechado",
      "devolvido",
      "presente",
      "respondido",
      "encerrado",
    ].includes(s)
  ) {
    return "green";
  }
  if (
    [
      "pendente",
      "aguardando",
      "programada",
      "aberta",
      "aberto",
      "convocada",
      "em andamento",
      "guardado",
      "em análise",
      "em analise",
      "solicitado",
      "agendado",
      "convidado",
    ].includes(s)
  ) {
    return "yellow";
  }
  if (
    [
      "negado",
      "bloqueado",
      "vencido",
      "vencida",
      "atrasado",
      "cancelado",
      "rejeitada",
      "rejeitado",
      "inativo",
      "falha",
      "descartado",
    ].includes(s)
  ) {
    return "red";
  }
  if (["dentro", "em visita"].includes(s)) return "primary";
  return "neutral";
}

export function statusLabel(status?: string | null) {
  if (!status || typeof status !== "string") return "";
  return status.replace(/_/g, " ");
}

