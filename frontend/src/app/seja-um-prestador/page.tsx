import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Icon } from "@/components/icon";

export const metadata = {
  title: "Seja um Prestador de Serviços Parceiro · Zeladoria Condomínio",
  description:
    "Cadastre sua empresa ou perfil autônomo no Zeladoria Condomínio. Receba solicitações de serviço, envie orçamentos e amplie sua cartela de clientes residenciais.",
};

const CATEGORIES = [
  { name: "Elétrica", icon: "zap", desc: "Instalações, chuveiros, quadros e tomadas" },
  { name: "Hidráulica", icon: "droplet", desc: "Vazamentos, registros, válvulas e desentupimentos" },
  { name: "Climatização", icon: "wind", desc: "Ar-condicionado split, inverter e manutenção" },
  { name: "Pintura", icon: "pen-tool", desc: "Pintura residencial, texturas e retoques" },
  { name: "Marcenaria", icon: "tool", desc: "Móveis planejados, portas, ajustes e ferragens" },
  { name: "Limpeza & Diarista", icon: "sparkles", desc: "Higienização residencial e pós-obra" },
  { name: "Jardinagem", icon: "scissors", desc: "Paisagismo, poda e manutenção de áreas verdes" },
  { name: "Reparos Gerais", icon: "wrench", desc: "Montagem de móveis, suportes e pequenas reformas" },
];

const STEPS = [
  {
    step: "1",
    title: "Cadastro Profissional",
    desc: "Preencha seus dados de contato, especialidades, cidades atendidas e fotos do seu portfólio.",
  },
  {
    step: "2",
    title: "Análise e Habilitação",
    desc: "Nossa administração avalia as informações e confere documentos para emitir seu credenciamento.",
  },
  {
    step: "3",
    title: "Atenda Moradores",
    desc: "Seu perfil é publicado no marketplace da sua região. Receba chamados e envie orçamentos.",
  },
];

export default function SejaUmPrestadorPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="transition-opacity hover:opacity-90">
            <BrandLogo size="lg" variant="default" />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/prestador/login"
              className="text-xs font-bold text-slate-700 hover:text-[#1355FF] px-3 py-2 transition-colors"
            >
              Já sou parceiro
            </Link>
            <Link
              href="/prestador/cadastro"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1355FF] text-white text-xs font-bold hover:bg-[#0D47E6] shadow-xs transition-colors"
            >
              <span>Cadastrar Agora</span>
              <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1355FF] text-xs font-bold">
          <Icon name="sparkles" size={14} />
          <span>Marketplace Oficial de Condomínios</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-[#0F172A] tracking-tight max-w-3xl mx-auto leading-tight">
          Conecte seu trabalho aos melhores condomínios da sua região
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Sem taxas abusivas de intermediação. Seja encontrado por síndicos e moradores que buscam profissionais qualificados, com agendamento direto e garantia de recebimento.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/prestador/cadastro"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#1355FF] text-white text-sm font-black hover:bg-[#0D47E6] shadow-md transition-all cursor-pointer"
          >
            <span>Cadastrar como Prestador</span>
            <Icon name="arrow-right" size={16} />
          </Link>
          <Link
            href="/prestador/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span>Acessar Painel do Prestador</span>
          </Link>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1355FF]">
              <Icon name="shield" size={20} />
            </span>
            <h3 className="text-base font-black text-[#0F172A]">Credibilidade & Selo de Verificação</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Destaque-se com o selo de profissional verificado após conferência de antecedentes e dados cadastrais pelo condomínio.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Icon name="dollar" size={20} />
            </span>
            <h3 className="text-base font-black text-[#0F172A]">Você Define Seus Preços</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Defina sua taxa inicial ou trabalhe sob orçamento. Sem preços arbitrários impostos pela plataforma.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Icon name="map-pin" size={20} />
            </span>
            <h3 className="text-base font-black text-[#0F172A]">Busca por Proximidade Real</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Atenda apenas no seu raio de atuação definido. Clientes próximos economizam seu tempo e custo de deslocamento.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-[#0F172A]">Especialidades Atendidas</h2>
          <p className="text-xs text-slate-500">Cadastre-se na categoria correspondente ao seu ramo de atividade</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className="p-4 rounded-xl bg-white border border-slate-200 hover:border-[#1355FF] transition-all space-y-1.5"
            >
              <div className="flex items-center gap-2 text-[#1355FF]">
                <Icon name={cat.icon as any} size={16} />
                <span className="font-bold text-xs text-[#0F172A]">{cat.name}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">{cat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works / Steps */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-[#0F172A]">Como Funciona o Credenciamento</h2>
          <p className="text-xs text-slate-500">Fluxo transparente do cadastro à primeira contratação</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div key={s.step} className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 relative">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1355FF] text-white font-black text-xs">
                {s.step}
              </span>
              <h4 className="text-sm font-bold text-[#0F172A]">{s.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h3 className="text-xl sm:text-2xl font-black text-[#0F172A]">
            Pronto para receber novos clientes?
          </h3>
          <p className="text-xs text-slate-500">
            Cadastre-se gratuitamente e comece a atender condomínios parceiros no Zeladoria.
          </p>
          <div className="pt-2">
            <Link
              href="/prestador/cadastro"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1355FF] text-white text-xs font-black hover:bg-[#0D47E6] shadow-xs transition-colors"
            >
              <span>Preencher Cadastro de Prestador</span>
              <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Zeladoria Condomínio · Todos os direitos reservados.
      </footer>
    </div>
  );
}
