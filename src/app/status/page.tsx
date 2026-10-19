import { backendRequest } from "@/lib/api/server";
import Link from "next/link";

import { Icon } from "@/components/icon";
import { BrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";

async function checkDatabase() {
  const started = Date.now();
  try {
    await backendRequest("/status");
    return { ok: true, ms: Date.now() - started };
  } catch {
    return { ok: false, ms: Date.now() - started };
  }
}

export default async function StatusPage() {
  const database = await checkDatabase();
  const services = [
    { name: "API Laravel", ok: database.ok, detail: database.ok ? "API respondeu à verificação" : "API indisponível" },
    { name: "Banco de dados MySQL", ok: database.ok, detail: `MySQL · ${database.ms} ms` },
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


    </main>
  );
}
