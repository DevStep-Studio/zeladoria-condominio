import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Icon } from "@/components/icon";

export const metadata = {
  title: "Política de Privacidade · Zeladoria Condomínio",
  description: "Diretrizes de privacidade, segurança e conformidade com a LGPD no Zeladoria Condomínio.",
};

export default function PrivacidadePage() {
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
            <Icon name="shield" size={14} />
            <span>LGPD e Proteção de Dados</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Política de Privacidade
          </h1>
          <p className="text-xs text-slate-500">Última atualização: Outubro de 2026</p>
        </div>

        <div className="text-xs sm:text-sm text-slate-600 space-y-4 leading-relaxed">
          <p>
            O <strong>Zeladoria Condomínio</strong> está comprometido com a segurança, transparência e proteção integral
            dos dados pessoais tratados em nossa plataforma, em total conformidade com a Lei Geral de Proteção de Dados
            Pessoais (Lei nº 13.709/2018 — LGPD).
          </p>

          <h2 className="text-base font-bold text-slate-900 pt-2">1. Coleta e Finalidade</h2>
          <p>
            Coletamos informações cadastrais fornecidas exclusivamente pela administração condominial ou através do
            nosso formulário comercial (Fale Conosco). Tais informações são utilizadas exclusivamente para viabilizar
            a gestão condominial, controle de portaria, atendimento ao cliente e comunicação institucional.
          </p>

          <h2 className="text-base font-bold text-slate-900 pt-2">2. Não Comercialização</h2>
          <p>
            O Zeladoria Condomínio jamais vende, aluga ou transfere dados pessoais de usuários para terceiros com
            propósitos publicitários.
          </p>

          <h2 className="text-base font-bold text-slate-900 pt-2">3. Segurança da Informação</h2>
          <p>
            Adotamos medidas técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados
            e de situações acidentais ou ilícitas de destruição, perda ou alteração.
          </p>

          <h2 className="text-base font-bold text-slate-900 pt-2">4. Contato do Encarregado (DPO)</h2>
          <p>
            Para exercer seus direitos de titular de dados ou esclarecer dúvidas, entre em contato através do e-mail:{" "}
            <span className="text-[#1355FF] font-semibold">privacidade@zeladoriacondominio.com.br</span>.
          </p>
        </div>
      </div>

      <footer className="max-w-3xl w-full mx-auto pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
        <span>© 2026 Zeladoria Cidades</span>
        <div className="flex items-center gap-3">
          <Link href="/termos" className="hover:text-[#1355FF] transition-colors">
            Termos
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
