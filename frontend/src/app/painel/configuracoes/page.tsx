import Link from "next/link";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { Icon, type IconName } from "@/components/icon";
import { saveCondoSettingsAction, updateOnboardingAction } from "@/lib/actions/admin";
import { ROLE_LABEL, type Role } from "@/lib/rbac";
import {
  INTERNAL_BTN_PRIMARY_CLS,
  INTERNAL_BTN_SECONDARY_CLS,
  INTERNAL_INPUT_CLS,
  InternalFormField,
  InternalPageHeader,
  InternalPageLayout,
  InternalSectionCard,
  InternalStatusBadge,
} from "@/components/internal/internal-ui";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const { session, condo } = await requireRole(["superadmin", "sindico"]);

  if (!condo) {
    if (session.role === "superadmin") {
      redirect("/painel/admin/condominios");
    }
    redirect("/login?erro=sem-condominio");
  }

  const sections: { href: string; title: string; desc: string; icon: IconName; badge?: string }[] = [
    { href: "/painel/moradores", title: "Moradores e unidades", desc: "Cadastros, convites e importação.", icon: "users" },
    { href: "/painel/implantacao", title: "Implantação", desc: "Assistente de configuração inicial.", icon: "sparkles", badge: condo.onboardingDone ? "concluída" : "em andamento" },
    { href: "/painel/auditoria", title: "Auditoria", desc: "Trilha de ações e acessos.", icon: "lock" },
    { href: "/painel/ajuda", title: "Central de ajuda", desc: "Suporte e base de conhecimento.", icon: "help" },
  ];
  if (session.role === "superadmin") {
    sections.push({ href: "/painel/adocao", title: "Painel do SaaS", desc: "Adoção e implantação multi-condomínio.", icon: "trending" });
  }

  return (
    <InternalPageLayout>
      <InternalPageHeader
        icon="settings"
        title="Configurações"
        subtitle="Dados cadastrais do condomínio, status da implantação e atalhos administrativos."
        breadcrumbs={[
          { label: "Início", href: "/painel" },
          { label: "Configurações" },
        ]}
        badge={
          <InternalStatusBadge
            label={condo.plan ? `Plano ${condo.plan}` : "Ativo"}
            tone="blue"
          />
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start min-w-0">
        <div className="lg:col-span-8 space-y-5 min-w-0">
          <InternalSectionCard
            title="Dados do condomínio"
            subtitle="Identificação institucional, localização e visibilidade pública."
          >
            <form action={saveCondoSettingsAction} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <InternalFormField label="Nome" required>
                  <input name="name" className={INTERNAL_INPUT_CLS} defaultValue={condo.name} required />
                </InternalFormField>
                <InternalFormField label="CNPJ">
                  <input name="cnpj" className={INTERNAL_INPUT_CLS} defaultValue={condo.cnpj ?? ""} />
                </InternalFormField>
              </div>
              <InternalFormField label="Endereço">
                <input name="address" className={INTERNAL_INPUT_CLS} defaultValue={condo.address ?? ""} />
              </InternalFormField>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <InternalFormField label="Cidade">
                    <input name="city" className={INTERNAL_INPUT_CLS} defaultValue={condo.city ?? ""} />
                  </InternalFormField>
                </div>
                <InternalFormField label="UF">
                  <input name="state" className={INTERNAL_INPUT_CLS} defaultValue={condo.state ?? ""} maxLength={2} />
                </InternalFormField>
              </div>
              <InternalFormField label="Plano contratado">
                <input
                  className={`${INTERNAL_INPUT_CLS} opacity-75 cursor-not-allowed bg-[#F5F8FC]`}
                  defaultValue={condo.plan}
                  disabled
                />
              </InternalFormField>
              <label className="flex items-center gap-2.5 text-sm font-medium text-[#101828] pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  name="publicPage"
                  defaultChecked={condo.publicPage}
                  className="h-4 w-4 rounded border-[#CBD5E1] accent-[#1455FF]"
                />
                <span>Exibir página pública do condomínio</span>
              </label>
              <div className="flex justify-end pt-2 border-t border-[#E2E8F0]">
                <button type="submit" className={INTERNAL_BTN_PRIMARY_CLS}>
                  <Icon name="check" size={16} />
                  <span>Salvar alterações</span>
                </button>
              </div>
            </form>
          </InternalSectionCard>

          <InternalSectionCard
            title="Atalhos administrativos"
            subtitle="Acesso direto aos cadastros estruturais, auditoria e implantação."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {sections.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="group flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F5F8FC] p-3.5 transition-all hover:border-[#1455FF]/35 hover:bg-[#EAF1FF]/45"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-[#E2E8F0] text-[#1455FF] group-hover:bg-[#1455FF] group-hover:text-white group-hover:border-[#1455FF] transition-colors">
                    <Icon name={s.icon} size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#101828] group-hover:text-[#1455FF] transition-colors">
                      {s.title}
                    </p>
                    <p className="truncate text-xs text-[#526079]">{s.desc}</p>
                  </div>
                  {s.badge ? (
                    <InternalStatusBadge
                      label={s.badge}
                      tone={s.badge === "concluída" ? "green" : "amber"}
                    />
                  ) : (
                    <Icon name="chevron-right" size={15} className="text-[#94A3B8] group-hover:text-[#1455FF] shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          </InternalSectionCard>
        </div>

        <div className="lg:col-span-4 space-y-5 min-w-0">
          <InternalSectionCard
            title="Status da implantação"
            subtitle="Acompanhe a etapa de ativação e uso de armazenamento."
          >
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F5F8FC] px-3.5 py-2.5">
                <span className="text-xs font-medium text-[#526079]">Etapa atual</span>
                <span className="text-sm font-extrabold text-[#101828] tabular-nums">
                  {condo.onboardingStep}/9
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F5F8FC] px-3.5 py-2.5">
                <span className="text-xs font-medium text-[#526079]">Publicação</span>
                <InternalStatusBadge
                  label={condo.onboardingDone ? "publicado" : "rascunho"}
                  tone={condo.onboardingDone ? "green" : "amber"}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F5F8FC] px-3.5 py-2.5">
                <span className="text-xs font-medium text-[#526079]">Armazenamento</span>
                <span className="text-sm font-extrabold text-[#101828] tabular-nums">
                  {condo.storageUsedMb} MB
                </span>
              </div>
            </div>

            <form action={updateOnboardingAction} className="mt-4">
              <input type="hidden" name="step" value={condo.onboardingStep} />
              <input type="hidden" name="done" value={condo.onboardingDone ? "off" : "on"} />
              <button type="submit" className={`${INTERNAL_BTN_SECONDARY_CLS} w-full h-10 text-xs`}>
                <Icon name="check" size={15} />
                <span>{condo.onboardingDone ? "Reabrir publicação" : "Concluir publicação"}</span>
              </button>
            </form>
            <div className="mt-3 text-center">
              <Link
                href="/painel/implantacao"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#1455FF] hover:text-[#0048E8] transition-colors"
              >
                <span>Abrir assistente de implantação</span>
                <Icon name="chevron-right" size={13} />
              </Link>
            </div>
          </InternalSectionCard>

          <InternalSectionCard title="Minha conta">
            <div className="space-y-2.5 text-sm min-w-0">
              <div className="flex items-center justify-between gap-3 py-1 border-b border-[#E2E8F0] min-w-0">
                <span className="text-xs font-medium text-[#526079] shrink-0">Nome</span>
                <span className="font-bold text-[#101828] text-right truncate min-w-0">{session.user.name}</span>
              </div>
              <div className="flex items-center justify-between gap-3 py-1 border-b border-[#E2E8F0] min-w-0">
                <span className="text-xs font-medium text-[#526079] shrink-0">E-mail</span>
                <span className="font-medium text-[#101828] text-right truncate min-w-0">{session.user.email}</span>
              </div>
              <div className="flex items-center justify-between gap-3 pt-1 min-w-0">
                <span className="text-xs font-medium text-[#526079] shrink-0">Perfil</span>
                <InternalStatusBadge label={ROLE_LABEL[session.role as Role] ?? session.role} tone="blue" />
              </div>
            </div>
          </InternalSectionCard>
        </div>
      </div>
    </InternalPageLayout>
  );
}
