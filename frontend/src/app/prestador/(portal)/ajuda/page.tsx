import Link from "next/link";
import { Icon } from "@/components/icon";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Central de Ajuda do Prestador · Tião Parceiros",
  description: "Orientações operacionais, repasses, comissões e boas práticas no Tião Parceiros.",
};

export default function PrestadorAjudaPage() {
  const faqItems = [
    {
      q: "Como recebo pelas ordens e serviços executados?",
      a: "Todos os pagamentos no Zeladoria Pay são processados com segurança via Pix ou Cartão. Assim que o serviço é finalizado e o morador confirma 'Tudo Certo!', o valor líquido é liberado diretamente para sua chave Pix cadastrada ou conta bancária.",
    },
    {
      q: "Qual é a taxa de intermediação do Zeladoria?",
      a: "A taxa padrão do marketplace é de 10% sobre o valor bruto contratado. Não cobramos mensalidades fixas para você receber chamados — você só contribui quando fechar negócio.",
    },
    {
      q: "O que são as fotos de ANTES e DEPOIS?",
      a: "Para proteger o prestador e o cliente, nosso sistema permite registrar fotos comprobatórias do estado inicial do local e do resultado final. Essas evidências são anexadas ao contrato digital com hash imutável.",
    },
    {
      q: "Como funcionam custos adicionais durante o serviço?",
      a: "Caso encontre um imprevisto técnico, você pode solicitar um Adicional de Escopo diretamente pela tela do atendimento. O morador receberá o pedido e, ao aprovar, uma cobrança complementar é gerada sem alterar o contrato original.",
    },
    {
      q: "O que acontece se o morador abrir uma contestação?",
      a: "Se o cliente relatar um problema, o repasse fica temporariamente retido enquanto nossa equipe de mediação avalia as evidências fotográficas e o laudo de execução sob a garantia de 90 dias (CDC).",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
          <Link href="/prestador" className="hover:text-slate-600">Início</Link>
          <span>/</span>
          <span className="text-slate-800 font-bold">Ajuda</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Central de Ajuda do Prestador
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Dúvidas frequentes, regras operacionais e suporte ao parceiro Zeladoria.
        </p>
      </div>

      {/* Destaque Zeladoria Protege para Prestadores */}
      <div className="p-5 rounded-[12px] bg-blue-50 border border-blue-200/80 flex items-start gap-4">
        <span className="p-2.5 rounded-[10px] bg-[#1355FF] text-white shrink-0 mt-0.5">
          <Icon name="shield" size={20} strokeWidth={2} />
        </span>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900">
            Zeladoria Protege: Segurança para quem executa
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Seu pagamento é garantido assim que o morador aprova o orçamento. O valor fica custodiado em conta segura e é repassado automaticamente após a conclusão com fotos.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-400 px-1">
          Perguntas Frequentes
        </h2>
        <div className="space-y-2">
          {faqItems.map((item, idx) => (
            <details
              key={idx}
              className="p-4 rounded-[10px] bg-white border border-slate-200/80 shadow-2xs group open:border-blue-200 transition-colors"
            >
              <summary className="cursor-pointer text-xs font-bold text-slate-800 flex items-center justify-between list-none">
                <span>{item.q}</span>
                <Icon name="chevron-down" size={13} className="text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-2.5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2.5">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* Contato com Suporte */}
      <div className="p-5 rounded-[12px] bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-slate-900">Ainda precisa de auxílio?</h3>
          <p className="text-xs text-slate-500 mt-0.5">Nossa equipe operacional está disponível para ajudar.</p>
        </div>
        <a
          href="mailto:suporte@zeladoriacondominio.com.br"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#1355FF] text-white text-xs font-bold hover:bg-[#0D47E6] transition-colors"
        >
          <Icon name="mail" size={14} />
          <span>Falar com o Suporte</span>
        </a>
      </div>
    </div>
  );
}
