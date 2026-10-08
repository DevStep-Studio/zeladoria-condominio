"use client";

import { Icon } from "@/components/icon";

export function ProviderGanhosClient({
  vendor,
  services = [],
}: {
  vendor: any;
  services: any[];
}) {
  const totalGrossCents = services.reduce((acc, s) => acc + (s.finalAmountCents || 0), 0);
  const totalFeesCents = services.reduce((acc, s) => acc + (s.platformFeeCents || 0), 0);
  const netEarningsCents = totalGrossCents - totalFeesCents;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Ganhos & Extrato Financeiro
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Acompanhamento transparente dos valores de serviços concluídos através da plataforma.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-[16px] border border-slate-200/80 bg-white p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Faturamento Bruto</span>
            <Icon name="dollar" size={15} className="text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            R$ {(totalGrossCents / 100).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">{services.length} serviço(s) faturado(s)</p>
        </div>

        <div className="rounded-[16px] border border-slate-200/80 bg-white p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Líquido Recebido</span>
            <Icon name="check-circle" size={15} className="text-[#0055D4]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">
            R$ {(netEarningsCents / 100).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">Direto com o morador / condomínio</p>
        </div>

        <div className="rounded-[16px] border border-slate-200/80 bg-white p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Taxa da Plataforma</span>
            <Icon name="shield" size={15} className="text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-700">
            R$ {(totalFeesCents / 100).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-500">Taxa média de 0% a 10%</p>
        </div>
      </div>

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900">
          Histórico de Serviços Faturados ({services.length})
        </h2>

        {services.length === 0 ? (
          <div className="rounded-[16px] border border-slate-200/80 bg-white p-12 text-center space-y-2 shadow-2xs">
            <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Icon name="dollar" size={18} />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Nenhum serviço faturado ainda</h3>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Quando você concluir seus atendimentos e o morador confirmar a finalização, os valores aparecerão registrados aqui.
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
