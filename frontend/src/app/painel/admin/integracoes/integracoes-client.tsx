"use client";

import { useState, useTransition } from "react";
import { Icon, type IconName } from "@/components/icon";
import {
  type IntegrationStatus,
  type ApiLogEntry,
  type IntegrationServiceId,
} from "@/lib/services/integrations/usage-tracker";
import {
  toggleIntegrationAction,
  testIntegrationAction,
} from "@/lib/actions/integrations";

interface IntegracoesClientProps {
  initialStatusList: IntegrationStatus[];
  initialLogs: ApiLogEntry[];
}

export function IntegracoesClient({
  initialStatusList,
  initialLogs,
}: IntegracoesClientProps) {
  const [statusList, setStatusList] = useState<IntegrationStatus[]>(initialStatusList);
  const [logs, setLogs] = useState<ApiLogEntry[]>(initialLogs);
  const [activeTestService, setActiveTestService] = useState<IntegrationServiceId | null>(null);
  const [testParam, setTestParam] = useState<string>("");
  const [testResult, setTestResult] = useState<{
    service: string;
    success: boolean;
    durationMs: number;
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (service: IntegrationServiceId, currentEnabled: boolean) => {
    startTransition(async () => {
      const nextEnabled = !currentEnabled;
      const res = await toggleIntegrationAction(service, nextEnabled);
      if (res.success) {
        setStatusList((prev) =>
          prev.map((s) => (s.id === service ? { ...s, enabled: nextEnabled } : s))
        );
      }
    });
  };

  const handleRunTest = (service: IntegrationServiceId) => {
    setActiveTestService(service);
    setTestResult(null);
    startTransition(async () => {
      const res = await testIntegrationAction(service, testParam);
      setTestResult({
        service: res.service || service,
        success: res.success,
        durationMs: res.durationMs || 0,
        message: res.message,
      });
      // Adiciona ao topo dos logs
      setLogs((prev) => [
        {
          id: `test_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          service,
          action: "testConnection",
          success: res.success,
          durationMs: res.durationMs || 0,
          message: res.message,
        },
        ...prev.slice(0, 49),
      ]);
    });
  };

  const getStatusBadge = (status: IntegrationStatus["status"]) => {
    switch (status) {
      case "operacional":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Operacional</span>;
      case "alerta_70":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Cota em 70%</span>;
      case "alerta_85":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">Cota em 85%</span>;
      case "alerta_95":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">Cota Crítica (95%)</span>;
      case "limite_atingido":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-200 text-red-900">Limite Atingido</span>;
      case "desativado":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">Pausado</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Verificando</span>;
    }
  };

  const getServiceIcon = (id: IntegrationServiceId): IconName => {
    switch (id) {
      case "geoapify":
        return "map-pin";
      case "postgis":
        return "navigation";
      case "viacep":
        return "search";
      case "brasilapi":
        return "building";
      case "onesignal":
        return "bell";
      case "resend":
        return "mail";
      default:
        return "shield";
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerta de Custo Zero e Boas Práticas */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-[#1355FF] shrink-0">
            <Icon name="shield" size={18} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Plano Gratuito Ativo & Custo Zero Garantido</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Todas as integrações operam estritamente dentro das cotas dos planos gratuitos ou sobre tecnologia open-source. Nenhuma cobrança automática ou upgrade foi contratado.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
            100% Gratuito
          </span>
        </div>
      </div>

      {/* Grid de Cards das 6 Integrações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statusList.map((item) => {
          const percentage = item.dailyQuota > 0 ? Math.min(100, Math.round((item.dailyUsed / item.dailyQuota) * 100)) : 0;
          const isNearLimit = percentage >= 85;

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border bg-white flex flex-col justify-between transition-shadow hover:shadow-md ${
                !item.enabled
                  ? "border-slate-200 opacity-70"
                  : isNearLimit
                  ? "border-amber-300 ring-1 ring-amber-300/40"
                  : "border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#1355FF]">
                      <Icon name={getServiceIcon(item.id)} size={20} />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">{item.name}</h4>
                      <span className="text-[11px] text-slate-500 font-medium">{item.category}</span>
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                <p className="text-xs text-slate-600 mb-4 line-clamp-2">
                  {item.freeTierDetails}
                </p>

                {/* Barra de Progresso de Cota Diária */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500">Consumo hoje</span>
                    <span className="font-mono font-bold text-slate-800">
                      {item.dailyUsed} / {item.dailyQuota.toLocaleString("pt-BR")} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        percentage >= 95
                          ? "bg-red-500"
                          : percentage >= 85
                          ? "bg-amber-500"
                          : percentage >= 70
                          ? "bg-yellow-500"
                          : "bg-[#1355FF]"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Alertas: 70% &bull; 85% &bull; 95%</span>
                    <span>{item.errorCount} erros recentes</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleRunTest(item.id)}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#1355FF] hover:bg-blue-50 text-slate-700 hover:text-[#1355FF] text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Icon name="check-circle" size={13} />
                  <span>Testar</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">
                    {item.enabled ? "Ativo" : "Pausado"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id, item.enabled)}
                    disabled={isPending}
                    className={`w-10 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                      item.enabled ? "bg-[#1355FF]" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        item.enabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Seção de Teste Interativo de Conexão */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-[#1355FF]">
              <Icon name="settings" size={16} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Terminal de Teste de Conexão Live</h3>
              <p className="text-xs text-slate-500">Dispare requisições de teste em tempo real para validar respostas das APIs.</p>
            </div>
          </div>
          {activeTestService && (
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1355FF] text-xs font-mono font-bold">
              Serviço: {activeTestService.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={testParam}
            onChange={(e) => setTestParam(e.target.value)}
            placeholder="Parâmetro de teste opcional (ex: CEP, CNPJ, endereço ou e-mail)..."
            className="flex-1 h-10 rounded-xl border border-slate-200 px-3.5 text-xs outline-none focus:border-[#1355FF]"
          />
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleRunTest("geoapify")}
              disabled={isPending}
              className="px-3 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Geoapify
            </button>
            <button
              type="button"
              onClick={() => handleRunTest("viacep")}
              disabled={isPending}
              className="px-3 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              ViaCEP
            </button>
            <button
              type="button"
              onClick={() => handleRunTest("brasilapi")}
              disabled={isPending}
              className="px-3 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              BrasilAPI
            </button>
            <button
              type="button"
              onClick={() => handleRunTest("postgis")}
              disabled={isPending}
              className="px-3 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              PostGIS Raio
            </button>
            <button
              type="button"
              onClick={() => handleRunTest("resend")}
              disabled={isPending}
              className="px-3 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1355FF] text-xs font-bold transition-colors cursor-pointer"
            >
              Resend E-mail
            </button>
          </div>
        </div>

        {testResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs space-y-1 ${
              testResult.success
                ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                : "bg-red-50/80 border-red-200 text-red-900"
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span>{testResult.success ? "✓ Resposta Recebida com Sucesso" : "✕ Falha na Consulta"}</span>
              <span className="font-mono text-[11px] opacity-80">{testResult.durationMs} ms</span>
            </div>
            <p className="font-mono text-[11px] break-all">{testResult.message}</p>
          </div>
        )}
      </div>

      {/* Tabela de Auditoria e Logs Recentes */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Icon name="clock" size={16} />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Logs Recentes de Integrações</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Últimos {logs.length} eventos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold">
                <th className="py-2.5 px-3">Horário</th>
                <th className="py-2.5 px-3">API / Serviço</th>
                <th className="py-2.5 px-3">Operação</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Tempo</th>
                <th className="py-2.5 px-3">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    Nenhum registro de consumo recente.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 font-mono text-slate-500">{log.timestamp}</td>
                    <td className="py-2 px-3 font-bold text-slate-800 uppercase">{log.service}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{log.action}</td>
                    <td className="py-2 px-3">
                      {log.success ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {log.statusCode || 200} OK
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                          {log.statusCode || "ERR"} Falha
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-500">{log.durationMs}ms</td>
                    <td className="py-2 px-3 text-slate-600 max-w-xs truncate">{log.message || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
