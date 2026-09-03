import Link from "next/link";
import { and, desc, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { blocks, parcels, units, users } from "@/db/schema";
import { requireCondo } from "@/lib/auth";
import { GATE } from "@/lib/rbac";
import { Badge, Card, EmptyState, InfoNote, PageHeader, Panel, TableWrap } from "@/components/ui";
import { dateTimeBR } from "@/lib/utils";
import { unitOptions } from "@/lib/queries";
import { deliverParcelAction, registerParcelAction } from "@/lib/actions/portaria";
import { qrDataUrl } from "@/lib/qr";
import { Icon } from "@/components/icon";

export const dynamic = "force-dynamic";

export default async function EncomendasPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { session, condoId } = await requireCondo();
  const { status } = await searchParams;
  const currentStatus = status ?? "todas";
  const isGate = GATE.includes(session.role);
  const isResident = session.role === "morador";
  const scope = isResident && session.unitId ? eq(parcels.unitId, session.unitId) : undefined;

  const rows = await db
    .select({
      id: parcels.id,
      code: parcels.code,
      kind: parcels.kind,
      carrier: parcels.carrier,
      tracking: parcels.trackingCode,
      description: parcels.description,
      shelf: parcels.shelf,
      status: parcels.status,
      pickupCode: parcels.pickupCode,
      receivedAt: parcels.receivedAt,
      pickedUpAt: parcels.pickedUpAt,
      pickedUpBy: parcels.pickedUpBy,
      signature: parcels.signature,
      unit: units.number,
      block: blocks.name,
      receiver: users.name,
    })
    .from(parcels)
    .leftJoin(units, eq(units.id, parcels.unitId))
    .leftJoin(blocks, eq(blocks.id, units.blockId))
    .leftJoin(users, eq(users.id, parcels.receivedById))
    .where(and(eq(parcels.condoId, condoId), scope))
    .orderBy(desc(parcels.receivedAt))
    .limit(80);

  const pending = rows.filter((r) => r.status === "pendente");
  const staleBefore = new Date();
  staleBefore.setDate(staleBefore.getDate() - 7);
  const pendingWithStatus = pending.map((p) => ({ ...p, isLate: new Date(p.receivedAt) < staleBefore }));
  const late = pendingWithStatus.filter((r) => r.isLate);
  const delivered = rows.filter((r) => r.status === "entregue");

  const [{ id: staleId } = { id: 0 }] = await db
    .select({ id: parcels.id })
    .from(parcels)
    .where(and(eq(parcels.condoId, condoId), eq(parcels.status, "pendente"), lt(parcels.receivedAt, staleBefore)))
    .limit(1);

  // Filtragem dos itens exibidos
  let displayItems = pendingWithStatus;
  if (currentStatus === "atrasada") {
    displayItems = late;
  } else if (currentStatus === "pendente") {
    displayItems = pendingWithStatus.filter((p) => !p.isLate);
  } else if (currentStatus === "entregue") {
    displayItems = delivered.map((d) => ({ ...d, isLate: false }));
  } else {
    displayItems = rows.map((r) => ({
      ...r,
      isLate: r.status === "pendente" && new Date(r.receivedAt) < staleBefore,
    }));
  }

  const unitList = await unitOptions(condoId);
  const qrMap = new Map<number, string>();
  for (const parcel of displayItems.slice(0, 10)) {
    if (parcel.pickupCode) {
      qrMap.set(parcel.id, await qrDataUrl(`ENC:${parcel.code}:${parcel.pickupCode}`, 130));
    }
  }

  const filterTabs = [
    { key: "todas", label: "Todas", icon: "grid", count: rows.length },
    { key: "pendente", label: "Aguardando retirada", icon: "package", count: pending.length },
    { key: "atrasada", label: "Atrasadas", icon: "clock", count: late.length },
    { key: "entregue", label: "Entregues", icon: "check-circle", count: delivered.length },
  ];

  return (
    <>
      <PageHeader
        title="Encomendas e correspondências"
        subtitle="Registro na portaria, notificação automática ao morador, código/QR de retirada e confirmação digital de quem retirou."
      />

      {/* 3 Cards Minimalistas e Sofisticados (combinam perfeitamente com a Home) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/painel/encomendas?status=pendente"
          className={`group relative flex flex-col justify-between rounded-[22px] border p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
            currentStatus === "pendente"
              ? "border-[#0055D4] bg-blue-50/20 ring-2 ring-blue-500/10"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
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
              {pending.length}
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-[#0055D4] transition-colors">
              Aguardando retirada
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Disponíveis na portaria
            </p>
          </div>
        </Link>

        <Link
          href="/painel/encomendas?status=atrasada"
          className={`group relative flex flex-col justify-between rounded-[22px] border p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
            currentStatus === "atrasada"
              ? "border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/10"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
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
              {late.length}
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-rose-600 transition-colors">
              Atrasadas (7+ dias)
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {staleId ? "Cobrar retirada do morador" : "Nenhuma com atraso"}
            </p>
          </div>
        </Link>

        <Link
          href="/painel/encomendas?status=entregue"
          className={`group relative flex flex-col justify-between rounded-[22px] border p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
            currentStatus === "entregue"
              ? "border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/10"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
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
              {delivered.length}
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-emerald-600 transition-colors">
              Entregues
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Com confirmação digital
            </p>
          </div>
        </Link>
      </div>

      {/* Filter Tabs Capsule - Minimalista e Fluido */}
      <div className="mt-6 mb-4 inline-flex items-center gap-1 p-1 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_-3px_rgba(15,23,42,0.04)] no-print overflow-x-auto max-w-full">
        {filterTabs.map((tab) => {
          const isActive = currentStatus === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/painel/encomendas?status=${tab.key}`}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-gradient-to-r from-[#0055D4] to-[#0070F3] text-white shadow-md shadow-blue-500/20"
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
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title={`Encomendas (${displayItems.length})`}>
            {displayItems.length === 0 ? (
              <EmptyState title="Nenhuma encomenda neste status" icon="package" description="Tudo em dia nesta categoria." />
            ) : (
              <div className="space-y-3">
                {displayItems.map((p) => {
                  return (
                    <div
                      key={p.id}
                      className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.04)] hover:shadow-md hover:border-slate-300 transition-all duration-200"
                    >
                      <div className="flex items-start gap-4">
                        {qrMap.get(p.id) ? (
                          <div className="relative shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xs">
                            <img
                              src={qrMap.get(p.id)}
                              alt="QR Code de retirada"
                              className="h-20 w-20 object-contain"
                            />
                          </div>
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
                            <span>{p.carrier ?? "Sem transportadora informada"}{p.tracking ? ` · ${p.tracking}` : ""}</span>
                            <span className="text-slate-300">|</span>
                            <span className="capitalize">{p.kind}</span>
                          </p>

                          <p className="text-[11px] text-slate-400">
                            Recebida em {dateTimeBR(p.receivedAt)} por {p.receiver ?? "portaria"} · Local: <strong className="text-slate-600 font-bold">{p.shelf ?? "Portaria"}</strong>
                          </p>

                          <div className="pt-1.5 flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">Código de retirada:</span>
                            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-black text-amber-300 tracking-wider shadow-xs">
                              {isGate || isResident ? p.pickupCode : "••••••"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isGate && p.status === "pendente" && (
                        <div className="w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                          <Panel summary="Registrar retirada" tone="ghost">
                            <form action={deliverParcelAction} className="space-y-2">
                              <input type="hidden" name="id" value={p.id} />
                              <label className="block">
                                <span className="label">Código informado</span>
                                <input name="pickupCode" className="input" placeholder="6 dígitos" />
                              </label>
                              <label className="block">
                                <span className="label">Quem retirou</span>
                                <input name="pickedUpBy" className="input" required />
                              </label>
                              <label className="block">
                                <span className="label">Documento</span>
                                <input name="pickedUpDocument" className="input" />
                              </label>
                              <label className="block">
                                <span className="label">Assinatura digital (nome completo)</span>
                                <input name="signature" className="input" />
                              </label>
                              <button className="btn-success w-full btn-sm">Confirmar entrega</button>
                            </form>
                          </Panel>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card title="Histórico por unidade">
            {rows.length === 0 ? (
              <EmptyState title="Sem histórico" icon="package" />
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Unidade</th>
                    <th>Recebida</th>
                    <th>Retirada</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id}>
                      <td className="font-mono text-xs">{p.code}</td>
                      <td className="text-xs">{p.block} {p.unit}</td>
                      <td className="whitespace-nowrap text-xs">{dateTimeBR(p.receivedAt)}</td>
                      <td className="text-xs">
                        {p.pickedUpAt ? (
                          <>
                            {dateTimeBR(p.pickedUpAt)}
                            <span className="block text-[var(--color-subtle)]">por {p.pickedUpBy} · assinado: {p.signature}</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <Badge tone={p.status === "entregue" ? "green" : "amber"}>{p.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {isGate ? (
            <Card title="Registrar encomenda">
              <form action={registerParcelAction} className="space-y-3">
                <label className="block">
                  <span className="label">Unidade</span>
                  <select name="unitId" className="input" required>
                    <option value="">Selecione</option>
                    {unitList.map((u) => (
                      <option key={u.id} value={u.id}>{u.label}</option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="label">Tipo</span>
                    <select name="kind" className="input">
                      <option value="encomenda">Encomenda</option>
                      <option value="correspondencia">Correspondência</option>
                      <option value="delivery">Delivery</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="label">Transportadora</span>
                    <input name="carrier" className="input" />
                  </label>
                </div>
                <label className="block">
                  <span className="label">Rastreio</span>
                  <input name="trackingCode" className="input" />
                </label>
                <label className="block">
                  <span className="label">Descrição</span>
                  <input name="description" className="input" placeholder="Caixa média, envelope..." />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="label">Prateleira</span>
                    <input name="shelf" className="input" />
                  </label>
                  <label className="block">
                    <span className="label">Foto (URL)</span>
                    <input name="photoUrl" className="input" />
                  </label>
                </div>
                <button className="btn-primary w-full">Registrar e notificar</button>
              </form>
            </Card>
          ) : (
            <Card title="Como retirar">
              <ol className="list-decimal space-y-2 pl-4 text-sm text-[var(--color-muted)]">
                <li>Apresente o código de retirada (ou o QR Code) na portaria.</li>
                <li>A portaria confere o documento de quem está retirando.</li>
                <li>A confirmação digital é registrada com data, hora e responsável.</li>
              </ol>
            </Card>
          )}

          <InfoNote tone="amber">
            Encomendas pendentes há mais de 7 dias são sinalizadas como atrasadas e podem gerar cobrança automática de
            retirada no comunicado semanal.
          </InfoNote>
        </div>
      </div>
    </>
  );
}
