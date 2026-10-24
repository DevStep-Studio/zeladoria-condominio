import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Icon } from "@/components/icon";

export const metadata = {
  title: "Termos de Uso · Zeladoria Condomínio",
  description: "Termos e condições gerais de uso da plataforma Zeladoria Condomínio.",
};

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased text-[#0F172A]">
      <header className="max-w-3xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-200">
        <Link href="/" className="transition-opacity hover:opacity-90">
          <BrandLogo size="lg" variant="default" />
        </Link>
        <Link
          href="/login"
          className="text-xs font-bold text-[#1355FF] hover:text-[#0D47E6] hover:underline flex items-center gap-1.5"
        >
          <Icon name="arrow-left" size={14} />
          <span>Voltar ao Login</span>
        </Link>
      </header>

      <div className="max-w-3xl w-full mx-auto my-8 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#1355FF] text-xs font-bold">
            <Icon name="file-text" size={14} />
            <span>Condições Gerais</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Termos de Uso
          </h1>
          <p className="text-xs text-slate-500">Última atualização: Outubro de 2026</p>
        </div>

        <div className="text-xs sm:text-sm text-slate-600 space-y-4 leading-relaxed">
          <p>
            Bem-vindo ao <strong>Zeladoria Condomínio</strong>. Ao acessar nossa plataforma ou solicitar contato comercial,
            você concorda com as condições descritas abaixo.
          </p>

          <h2 className="text-base font-bold text-slate-900 pt-2">1. Acesso Restrito e Exclusivo</h2>
          <p>
            O Zeladoria Condomínio é um software corporativo (B2B) de acesso restrito. O cadastramento de contas e liberação
            de acessos é realizado de forma exclusiva e direta pela equipe administrativa após contratação ou convite formal
            da administração do condomínio. Não é permitido o cadastro público espontâneo.
          </p>

          <h2 className="text-base font-bold text-slate-900 pt-2">2. Contato Comercial e Demonstração</h2>
          <p>
            Potenciais clientes e síndicos interessados em conhecer ou contratar nossas soluções podem solicitar atendimento
            através do botão &quot;Fale conosco&quot; ou pelos canais oficiais de atendimento.
          </p>

          <h2 className="text-base font-bold text-slate-900 pt-2">3. Responsabilidades do Usuário</h2>
          <p>
            O usuário é responsável pela guarda e sigilo de suas credenciais de acesso, devendo notificar imediatamente
            a administração em caso de qualquer uso não autorizado de sua conta.
          </p>
        </div>
      </div>

      <footer className="max-w-3xl w-full mx-auto pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
        <span>© 2026 Zeladoria Cidades</span>
        <div className="flex items-center gap-3">
          <Link href="/privacidade" className="hover:text-[#1355FF] transition-colors">
            Privacidade
          </Link>
          <span>·</span>
          <Link href="/login" className="hover:text-[#1355FF] transition-colors">
            Acessar Sistema
          </Link>
        </div>
      </footer>
    </main>
  );
}
