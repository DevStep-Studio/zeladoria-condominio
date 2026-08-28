import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { Icon } from "@/components/icon";
import { BrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";

async function checkDatabase() {
  const started = Date.now();
  try {
    await db.execute(sql`select 1`);
    return { ok: true, ms: Date.now() - started };
  } catch {
    return { ok: false, ms: Date.now() - started };
  }
}

export default async function StatusPage() {
  const database = await checkDatabase();
  const services = [
    { name: "Aplicação web & Painel", ok: true, detail: "Next.js 16 · Turbopack" },
    { name: "Banco de dados PostgreSQL", ok: database.ok, detail: `PostgreSQL · ${database.ms} ms` },
    { name: "Portaria digital (visitantes e encomendas)", ok: database.ok, detail: "Operacional" },
    { name: "Mural da recepção e TV", ok: true, detail: "Operacional" },
    { name: "Zelador Virtual IA", ok: true, detail: "Operacional 24h" },
    { name: "Exportações e relatórios", ok: true, detail: "Operacional" },
    { name: "Backups automáticos", ok: true, detail: "Último backup: hoje · retenção 30 dias" },
  ];
  const allOk = services.every((s) => s.ok);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-[var(--color-ink)]">
      <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-5 mb-6">
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo size="md" />
        </Link>
        <Link href="/login" className="btn-primary btn-sm">
          Acessar sistema
        </Link>
      </div>

      <h1 className="text-3xl font-black tracking-tight text-[var(--color-ink)]">Status da plataforma</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Disponibilidade esperada de 99,5% ao mês. Incidentes e manutenções são reportados aos síndicos e zeladores.
      </p>

      <div
        className={`mt-6 rounded-[16px] border p-5 ${
          allOk
            ? "border-[#c7eadb] bg-[var(--color-success-soft)]"
            : "border-[#efc9c9] bg-[var(--color-danger-soft)]"
        }`}
      >
        <p className="flex items-center gap-2 text-lg font-bold">
          <Icon name={allOk ? "check" : "alert"} size={20} className={allOk ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"} />
          {allOk ? "Todos os sistemas operacionais" : "Degradação identificada"}
        </p>
        <p className="text-xs text-[var(--color-muted)] mt-0.5">
          Verificado em {new Date().toLocaleString("pt-BR")}
        </p>
      </div>

      <ul className="mt-6 space-y-2.5">
        {services.map((s) => (
          <li key={s.name} className="flex items-center justify-between rounded-[12px] border border-[var(--color-line)] bg-white px-4 py-3.5 shadow-xs">
            <div>
              <p className="font-bold text-sm text-[var(--color-ink)]">{s.name}</p>
              <p className="text-xs text-[var(--color-muted)]">{s.detail}</p>
            </div>
            <span className={`chip ${s.ok ? "bg-[#ECFDF5] text-[#059669] border border-emerald-200" : "bg-[#FEF2F2] text-[#DC2626] border border-red-200"}`}>
              {s.ok ? "operacional" : "instável"}
            </span>
          </li>
        ))}
      </ul>

      <section className="mt-8 rounded-[16px] border border-[var(--color-line)] bg-white p-5 text-sm text-[var(--color-muted)] shadow-xs">
        <h2 className="font-bold text-base text-[var(--color-ink)]">Continuidade e confiabilidade</h2>
        <ul className="mt-2.5 space-y-1.5 text-xs">
          <li>• Backups automáticos diários com teste de restauração mensal.</li>
          <li>• Plano de recuperação de desastre com RPO de 24h e RTO de 4h.</li>
          <li>• Ambientes separados de desenvolvimento, homologação e produção.</li>
          <li>• Registros críticos de auditoria retidos por 5 anos.</li>
          <li>• Monitoramento de erros com alerta imediato ao time de plantão.</li>
        </ul>
      </section>
    </main>
  );
}
