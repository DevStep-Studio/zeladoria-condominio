import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import { BrandLogo } from "@/components/brand-logo";

const MODULES: Array<{ icon: IconName; title: string; desc: string; color: string }> = [
  { icon: "shield", title: "Portaria & Controle de Acesso", desc: "Painel do turno, validação de QR Code, entradas e saídas com registro auditado.", color: "from-blue-500 to-blue-700" },
  { icon: "user-check", title: "Visitantes e prestadores", desc: "Convite digital, autorização do morador, lista de recorrentes e bloqueios de segurança.", color: "from-amber-500 to-amber-700" },
  { icon: "package", title: "Encomendas e entregas", desc: "Registro com foto, código de retirada e confirmação digital na recepção.", color: "from-emerald-500 to-emerald-700" },
  { icon: "book", title: "Livro de ocorrências digital", desc: "Registros públicos, administrativos e sigilosos com notificação ao síndico.", color: "from-purple-500 to-purple-700" },
  { icon: "refresh", title: "Passagem de turno", desc: "Checklist de conferência, pendências e transferência formal entre porteiros.", color: "from-cyan-500 to-cyan-700" },
  { icon: "wrench", title: "Chamados e Manutenção", desc: "Triagem assistida, SLA, ordens de serviço, histórico e acompanhamento em mapa.", color: "from-orange-500 to-orange-700" },
  { icon: "calendar", title: "Reservas de espaços", desc: "Agenda em tempo real para salão de festas, churrasqueira, quadra e piscina.", color: "from-blue-600 to-indigo-700" },
  { icon: "scale", title: "Assembleias & Votação", desc: "Convocação digital, presenças, procurações, quórum e publicação de ata.", color: "from-rose-500 to-pink-700" },
  { icon: "settings", title: "Vistorias preventivas", desc: "Equipamentos, planos, vencimentos de laudos, custos e manutenções prediais.", color: "from-slate-700 to-slate-900" },
  { icon: "briefcase", title: "Fornecedores e contratos", desc: "Vigências, reajustes, alertas de renovação e avaliação de terceirizados.", color: "from-teal-500 to-teal-700" },
  { icon: "wallet", title: "Financeiro & Prestação", desc: "Receitas, despesas, fundo de reserva, boletos e relatórios aos condôminos.", color: "from-amber-600 to-yellow-600" },
  { icon: "bot", title: "Zelador Virtual IA", desc: "Assistente inteligente 24h para esclarecimento de regras e abertura de chamados.", color: "from-emerald-600 to-teal-700" },
];

const PLANS = [
  {
    name: "Básico",
    price: "R$ 289",
    per: "/mês",
    items: ["Até 60 unidades", "Portaria, comunicados e chamados", "Documentos e enquetes", "Suporte por e-mail"],
  },
  {
    name: "Pro",
    price: "R$ 549",
    per: "/mês",
    featured: true,
    items: ["Até 200 unidades", "Tudo do Básico + assembleias", "Mapa interativo & Botão SOS", "Mural para TV e Zelador IA"],
  },
  {
    name: "Enterprise",
    price: "sob consulta",
    per: "",
    items: ["Unidades ilimitadas", "Financeiro completo e rateios", "White label para administradoras", "API e SLA dedicado 24h"],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandLogo size="md" showText={true} />
          </Link>
          <nav className="hidden gap-8 text-sm font-semibold text-[var(--color-muted)] md:flex">
            <a href="#modulos" className="hover:text-[#0070F3] transition-colors">Módulos</a>
            <Link href="/agendar" className="hover:text-[#0070F3] transition-colors">Agendamento</Link>
            <a href="#planos" className="hover:text-[#0070F3] transition-colors">Planos</a>
            <Link href="/status" className="hover:text-[#0070F3] transition-colors">Status</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/status" className="btn-ghost btn-sm hidden sm:inline-flex">
              <Icon name="check-circle" size={14} className="text-[#10B981]" />
              Status
            </Link>
            <Link href="/login" className="btn-primary btn-sm">
              Entrar no sistema
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Blue & Yellow Palette Accent */}
      <section className="relative overflow-hidden border-b border-[var(--color-line)] bg-white py-16 lg:py-24">
        {/* Subtle background glow */}
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-amber-100/60 blur-3xl pointer-events-none" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[54%_46%]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-[#0070F3] mb-4">
              <span className="flex h-2 w-2 rounded-full bg-[#0070F3] animate-pulse" />
              SISTEMA INTEGRADO DE ZELADORIA CONDOMINIAL
            </div>

            <h1 className="text-[40px] font-black leading-tight tracking-tight text-[var(--color-ink)] sm:text-[54px] lg:text-[58px]">
              Gestão visual e inteligente para o seu <span className="text-[#0070F3]">condomínio</span>.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-muted)] sm:text-lg">
              Mapa operacional em tempo real, registro de ocorrências, reservas sem conflitos, controle de portaria com QR Code e botão de emergência SOS.
            </p>

            <div className="mt-8 flex flex-wrap gap-3.5">
              <Link href="/login" className="btn-primary">
                <Icon name="arrow-right" size={16} />
                Acessar demonstração
              </Link>
              <Link href="/agendar" className="btn-yellow">
                <Icon name="calendar" size={16} />
                Agendar online
              </Link>
              <Link href="/painel" className="btn-ghost">
                Ver painel
              </Link>
            </div>

            {/* Metrics */}
            <dl className="mt-10 grid grid-cols-3 gap-3 sm:gap-4 text-sm">
              {[
                ["100%", "Registros Auditados", "text-[#0070F3]"],
                ["24h", "Zelador Virtual IA", "text-[#F59E0B]"],
                ["15+", "Módulos Integrados", "text-[#10B981]"],
              ].map(([value, label, color]) => (
                <div key={label} className="rounded-[14px] border border-[var(--color-line)] bg-[#F8FAFC] p-4 text-center">
                  <dd className={`text-2xl font-black ${color} sm:text-3xl`}>{value}</dd>
                  <dt className="mt-1 text-xs font-bold text-[var(--color-muted)]">{label}</dt>
                </div>
              ))}
            </dl>
          </div>

          {/* Right Hero Image Card with Live UI Preview */}
          <div className="relative">
            <div className="overflow-hidden rounded-[24px] border-2 border-[var(--color-line)] bg-white p-2 shadow-2xl">
              <div className="rounded-[18px] bg-[#0F172A] p-4 text-white">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <BrandLogo size="sm" showText={false} />
                    <span className="text-xs font-bold text-white">ZELADORIA CONDOMÍNIO</span>
                  </div>
                  <span className="chip bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    PAINEL SUPER ADMIN
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-[10px] bg-white/10 p-2.5">
                    <p className="text-[10px] text-white/70">Ocorrências</p>
                    <p className="text-lg font-black text-amber-400">12 ativas</p>
                  </div>
                  <div className="rounded-[10px] bg-white/10 p-2.5">
                    <p className="text-[10px] text-white/70">Reservas</p>
                    <p className="text-lg font-black text-blue-400">4 hoje</p>
                  </div>
                  <div className="rounded-[10px] bg-white/10 p-2.5">
                    <p className="text-[10px] text-white/70">Portaria</p>
                    <p className="text-lg font-black text-emerald-400">Online</p>
                  </div>
                </div>

                <div className="mt-4 rounded-[12px] bg-white/5 p-3 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-400 font-bold text-xs">
                      SOS
                    </span>
                    <div>
                      <p className="text-xs font-bold">Acionamento de Emergência</p>
                      <p className="text-[10px] text-white/60">Bombeiros, Polícia e Portaria 24h</p>
                    </div>
                  </div>
                  <span className="chip bg-red-500/20 text-red-300 text-[10px] font-bold">Pronto</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-b-[18px] text-center text-xs text-[var(--color-muted)] font-medium">
                Interface baseada na identidade visual oficial com mapa interativo e paleta azul e amarela.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modulos" className="border-b border-[var(--color-line)] bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="chip bg-blue-50 text-[#0070F3] border border-blue-200 text-xs font-bold mb-2">
              RECURSOS COMPLETOS
            </span>
            <h2 className="text-[32px] font-black tracking-tight text-[var(--color-ink)] sm:text-[38px]">
              Tudo o que seu condomínio precisa
            </h2>
            <p className="mt-2 text-sm text-[var(--color-muted)] font-medium">
              Da portaria física às assembleias virtuais, uma rotina sem atritos.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {MODULES.map((m) => (
              <div
                key={m.title}
                className="group rounded-[18px] border border-[var(--color-line)] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#0070F3]/40 hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#EFF6FF] text-[#0070F3] group-hover:bg-[#0070F3] group-hover:text-white transition-colors">
                  <Icon name={m.icon} size={20} />
                </span>
                <h3 className="mt-3.5 text-base font-bold text-[var(--color-ink)]">{m.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="planos" className="border-b border-[var(--color-line)] bg-[#F8FAFC] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="chip bg-amber-50 text-[#F59E0B] border border-amber-200 text-xs font-bold mb-2">
              INVESTIMENTO
            </span>
            <h2 className="text-[32px] font-black tracking-tight text-[var(--color-ink)] sm:text-[38px]">
              Planos dimensionados para sua estrutura
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[20px] border bg-white p-7 shadow-xs flex flex-col justify-between ${
                  plan.featured
                    ? "border-2 border-[#0070F3] shadow-lg ring-4 ring-blue-50 relative"
                    : "border-[var(--color-line)]"
                }`}
              >
                {plan.featured ? (
                  <span className="chip absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0070F3] text-white text-xs font-bold px-3 py-1">
                    MAIS RECOMENDADO
                  </span>
                ) : null}

                <div>
                  <h3 className="text-xl font-black text-[var(--color-ink)]">{plan.name}</h3>
                  <p className="mt-2 text-3xl font-black text-[var(--color-ink)]">
                    {plan.price}
                    <span className="text-sm font-normal text-[var(--color-muted)]">{plan.per}</span>
                  </p>
                  <ul className="mt-6 space-y-2.5 text-xs text-[var(--color-muted)] font-medium">
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Icon name="check" size={15} className="text-[#10B981] shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/login"
                  className={`mt-8 w-full ${plan.featured ? "btn-primary" : "btn-ghost"}`}
                >
                  Começar agora
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 text-center text-xs text-[var(--color-muted)]">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" showText={true} />
          </div>
          <p>© 2026 Zeladoria Condomínio · Todos os direitos reservados</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-[#0070F3] font-semibold">Entrar</Link>
            <Link href="/status" className="hover:text-[#0070F3] font-semibold">Status</Link>
            <Link href="/mural" className="hover:text-[#0070F3] font-semibold">Mural da Portaria</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
