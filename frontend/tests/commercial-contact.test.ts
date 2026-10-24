import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  formatBrazilianPhone,
  cleanPhoneDigits,
  validateBrazilianPhone,
  validateEmail,
  getCommercialWhatsAppInfo,
  OFFICIAL_COMMERCIAL_MESSAGE,
  COMMERCIAL_SUBJECTS,
} from "../src/lib/commercial-utils";
import { submitCommercialLeadAction } from "../src/lib/actions/commercial";

describe("FLUXO COMERCIAL & LOGIN PRIVADO — ZELADORIA CONDOMÍNIO", () => {
  // Teste 1: Formatação e máscara de telefone brasileiro
  describe("Teste 1 — Formatação e Máscara de Telefone", () => {
    it("deve limpar caracteres não numéricos corretamente", () => {
      assert.equal(cleanPhoneDigits("(11) 98765-4321"), "11987654321");
      assert.equal(cleanPhoneDigits("+55 (41) 3232-4455"), "554132324455");
      assert.equal(cleanPhoneDigits("abc-123.456"), "123456");
      assert.equal(cleanPhoneDigits(""), "");
    });

    it("deve aplicar a máscara de celular (11 dígitos) e fixo (10 dígitos)", () => {
      assert.equal(formatBrazilianPhone("11987654321"), "(11) 98765-4321");
      assert.equal(formatBrazilianPhone("4132324455"), "(41) 3232-4455");
      assert.equal(formatBrazilianPhone("11"), "(11");
      assert.equal(formatBrazilianPhone("11987"), "(11) 987");
      assert.equal(formatBrazilianPhone(""), "");
    });
  });

  // Teste 2: Regras de validação estritas da Anatel para números do Brasil
  describe("Teste 2 — Validação de Telefones Brasileiros", () => {
    it("deve aprovar números de celular e fixo válidos", () => {
      assert.equal(validateBrazilianPhone("(11) 98765-4321"), true, "Celular SP válido");
      assert.equal(validateBrazilianPhone("41991234567"), true, "Celular PR válido");
      assert.equal(validateBrazilianPhone("(21) 2234-5678"), true, "Fixo RJ válido");
      assert.equal(validateBrazilianPhone("3134567890"), true, "Fixo MG válido");
    });

    it("deve reprovar telefones com DDD inválido ou quantidade incorreta de dígitos", () => {
      assert.equal(validateBrazilianPhone("(00) 98765-4321"), false, "DDD 00 inválido");
      assert.equal(validateBrazilianPhone("(09) 98765-4321"), false, "DDD 09 inválido");
      assert.equal(validateBrazilianPhone("123456"), false, "Incompleto");
      assert.equal(validateBrazilianPhone("(11) 88765-4321"), false, "Celular de 11 dígitos sem nono dígito 9");
      assert.equal(validateBrazilianPhone(""), false, "Vazio");
    });
  });

  // Teste 3: Validação de E-mail
  describe("Teste 3 — Validação de E-mail", () => {
    it("deve aceitar e-mails válidos corporativos e pessoais", () => {
      assert.equal(validateEmail("contato@condominio.com.br"), true);
      assert.equal(validateEmail("sindico.gestor@gmail.com"), true);
      assert.equal(validateEmail("mariana+zeladoria@empresa.org"), true);
    });

    it("deve rejeitar e-mails mal formatados", () => {
      assert.equal(validateEmail(""), false);
      assert.equal(validateEmail("sem-arroba.com.br"), false);
      assert.equal(validateEmail("invalido@"), false);
      assert.equal(validateEmail("@dominio.com"), false);
      assert.equal(validateEmail("usuario@dominio"), false);
    });
  });

  // Teste 4: Integração oficial do WhatsApp comercial com mensagem padronizada
  describe("Teste 4 — Integração e Deep Link do WhatsApp Comercial", () => {
    it("deve conter a mensagem contextualizada oficial requerida", () => {
      assert.equal(
        OFFICIAL_COMMERCIAL_MESSAGE,
        "Olá! Conheci o Zeladoria Condomínio e gostaria de saber mais sobre os serviços disponíveis."
      );
    });

    it("deve gerar link oficial do WhatsApp quando número for configurado", () => {
      const info = getCommercialWhatsAppInfo("11987654321");
      assert.equal(info.configured, true);
      assert.ok(info.url.startsWith("https://wa.me/5511987654321?text="));
      assert.ok(info.url.includes(encodeURIComponent(OFFICIAL_COMMERCIAL_MESSAGE)));
    });

    it("deve sinalizar canal não configurado sem inventar dados quando variável estiver ausente", () => {
      const info = getCommercialWhatsAppInfo("");
      assert.equal(info.configured, false);
      assert.equal(info.url, "");
    });
  });

  // Teste 5: Assuntos comerciais disponíveis
  describe("Teste 5 — Opções de Assunto Comercial", () => {
    it("deve disponibilizar exatamente os assuntos comerciais oficiais", () => {
      assert.deepEqual(
        [...COMMERCIAL_SUBJECTS],
        [
          "Conhecer os serviços",
          "Solicitar uma proposta",
          "Contratar uma solução",
          "Outros assuntos",
        ]
      );
    });
  });

  // Teste 6: Submissão do formulário comercial e proteção anti-spam
  describe("Teste 6 — Server Action de Contato Comercial", () => {
    it("deve reprovar quando campos obrigatórios estiverem ausentes", async () => {
      const result = await submitCommercialLeadAction({
        nome: "",
        whatsapp: "",
        email: "",
        assunto: "",
      });

      assert.equal(result.success, false);
      assert.ok(result.errors?.nome, "Erro no nome obrigatório");
      assert.ok(result.errors?.whatsapp, "Erro no WhatsApp obrigatório");
      assert.ok(result.errors?.email, "Erro no e-mail obrigatório");
      assert.ok(result.errors?.assunto, "Erro no assunto obrigatório");
    });

    it("deve neutralizar bots silenciosamente quando o campo honeypot for preenchido", async () => {
      const botSubmission = await submitCommercialLeadAction({
        nome: "Spam Bot",
        whatsapp: "(11) 99999-9999",
        email: "bot@spamnetwork.com",
        assunto: "Conhecer os serviços",
        empresa_website: "http://spam-link.ru", // Honeypot armadilha preenchida
      });

      assert.equal(botSubmission.success, true);
      assert.equal(
        botSubmission.message,
        "Recebemos sua solicitação! Nossa equipe entrará em contato pelos dados informados."
      );
    });

    it("deve processar solicitação válida com mensagem de confirmação amigável", async () => {
      const validSubmission = await submitCommercialLeadAction({
        nome: "Dr. Fernando Henrique",
        condominio: "Condomínio Bosque Imperial",
        whatsapp: "(11) 97123-4567",
        email: "fernando@bosqueimperial.com.br",
        assunto: "Solicitar uma proposta",
        mensagem: "Gostaríamos de agendar uma reunião comercial para apresentação à comissão.",
      });

      assert.equal(validSubmission.success, true);
      assert.equal(
        validSubmission.message,
        "Recebemos sua solicitação! Nossa equipe entrará em contato pelos dados informados."
      );
    });

    it("deve garantir que a solicitação comercial NUNCA crie usuário ou conceda acesso automático", async () => {
      const lead = {
        nome: "Visitante Interessado",
        whatsapp: "(41) 98877-6655",
        email: "visitante@empresa.com",
        assunto: "Conhecer os serviços",
      };

      const result = await submitCommercialLeadAction(lead);
      assert.equal(result.success, true);
      // Confirma que nenhum token ou sessão é retornado
      assert.equal((result as any).token, undefined);
      assert.equal((result as any).session, undefined);
      assert.equal((result as any).user, undefined);
    });
  });
});
