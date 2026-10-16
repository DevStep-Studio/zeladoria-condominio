"use client";

import { Icon } from "@/components/icon";

export function ProviderGanhosClient({
  vendor,
  services = [],
  orders = [],
}: {
  vendor: any;
  services: any[];
  orders?: any[];
}) {
  // Se houver ordens no Zeladoria Pay, calcula a partir delas; senão fallback para services
  const hasOrders = orders && orders.length > 0;

  const totalGrossCents = hasOrders
    ? orders.filter((o) => o.status !== "cancelled" && o.status !== "refunded").reduce((acc, o) => acc + (o.amountGrossCents || 0), 0)
    : services.reduce((acc, s) => acc + (s.finalAmountCents || 0), 0);

  const totalFeesCents = hasOrders
    ? orders.filter((o) => o.status !== "cancelled" && o.status !== "refunded").reduce((acc, o) => acc + (o.platformFeeCents || 0), 0)
    : services.reduce((acc, s) => acc + (s.platformFeeCents || 0), 0);

  const netEarningsCents = totalGrossCents - totalFeesCents;

  const retainedCents = hasOrders
    ? orders.filter((o) => o.status === "retained" || o.status === "in_dispute").reduce((acc, o) => acc + (o.netVendorCents || 0), 0)
    : 0;

  const releasedCents = hasOrders
    ? orders.filter((o) => o.status === "released" || o.status === "paid").reduce((acc, o) => acc + (o.netVendorCents || 0), 0)
    : netEarningsCents;

  const processingCents = hasOrders
    ? orders.filter((o) => o.status === "processing").reduce((acc, o) => acc + (o.netVendorCents || 0), 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Icon name="dollar" size={18} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Financeiro & Repasses
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Valores a receber, em processamento e recebidos com comissão de 10% da Zeladoria e split automatizado.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Cards: A receber | Em processamento | Recebido | Comissão Zeladoria */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold uppercase">
            <span>A receber (Retido)</span>
            <Icon name="clock" size={16} className="text-amber-700" />
          </div>
          <div className="text-2xl font-black text-amber-900">
            R$ {(retainedCents / 100).toFixed(2)}
          </div>
          <p className="text-[11px] text-amber-700 font-medium">Zeladoria Protege ativo</p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#0055D4] font-bold uppercase">
            <span>Em processamento</span>
            <Icon name="zap" size={16} className="text-[#0055D4]" />
          </div>
          <div className="text-2xl font-black text-blue-950">
            R$ {(processingCents / 100).toFixed(2)}
          </div>
          <p className="text-[11px] text-blue-700 font-medium">Split em andamento no PSP</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold uppercase">
            <span>Recebido (Líquido)</span>
            <Icon name="check-circle" size={16} className="text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-emerald-800">
            R$ {(releasedCents / 100).toFixed(2)}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">Disponível para saque</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Comissão Zeladoria</span>
            <Icon name="shield" size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-700">
            R$ {(totalFeesCents / 100).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">10% padrão de intermediação</p>
        </div>
      </div>

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">
          Extrato Detalhado de Pagamentos & Vistorias ({hasOrders ? orders.length : services.length})
        </h2>

        {hasOrders ? (
          <div className="rounded-[16px] border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3.5">Código / Finalidade</th>
                  <th className="p-3.5">Data</th>
                  <th className="p-3.5">Status Repasse</th>
                  <th className="p-3.5 text-right">Valor Bruto</th>
                  <th className="p-3.5 text-right">Comissão</th>
                  <th className="p-3.5 text-right">Líquido Prestador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5">
                      <span className="font-bold text-[#0055D4] block">{o.code}</span>
                      <span className={`inline-block text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        o.purpose === "vistoria" ? "bg-blue-50 text-[#0055D4]" : "bg-purple-50 text-purple-700"
                      }`}>
                        {o.purpose === "vistoria" ? "Vistoria Técnica" : "Serviço Principal"}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {o.paidAt ? new Date(o.paidAt).toLocaleDateString("pt-BR") : new Date(o.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        o.status === "released" || o.status === "paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : o.status === "retained"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : o.status === "in_dispute"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {o.status === "retained"
                          ? "Protegido (Retido)"
                          : o.status === "released"
                          ? "Repasse Liberado"
                          : o.status === "paid"
                          ? "Pago"
                          : o.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-semibold text-slate-800">
                      R$ {((o.amountGrossCents || 0) / 100).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right text-slate-500">
                      R$ {((o.platformFeeCents || 0) / 100).toFixed(2)} ({o.commissionPercent || 10}%)
                    </td>
                    <td className="p-3.5 text-right font-black text-emerald-700">
                      R$ {((o.netVendorCents || 0) / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-[16px] border border-slate-200/80 bg-white p-12 text-center space-y-2 shadow-2xs">
            <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Icon name="dollar" size={18} />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Nenhum pagamento faturado ainda</h3>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Quando você receber vistorias pagas ou concluir serviços com Zeladoria Protege, os repasses com split aparecerão registrados aqui.
            </p>
          </div>
        ) : (
          <div className="rounded-[16px] border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3.5">Código / Serviço</th>
                  <th className="p-3.5">Data Conclusão</th>
                  <th className="p-3.5 text-right">Valor Bruto</th>
                  <th className="p-3.5 text-right">Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5">
                      <span className="font-bold text-[#0055D4] block">{s.code}</span>
                      <span className="text-slate-600">{s.title}</span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {s.completedAt ? new Date(s.completedAt).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="p-3.5 text-right font-semibold text-slate-800">
                      R$ {((s.finalAmountCents || 0) / 100).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-black text-emerald-700">
                      R$ {(((s.finalAmountCents || 0) - (s.platformFeeCents || 0)) / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
