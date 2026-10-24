/**
 * Utilitários comerciais: Validação de formulário, formatação de telefone brasileiro
 * e montagem do link oficial de WhatsApp para contato comercial.
 */

export const COMMERCIAL_SUBJECTS = [
  "Conhecer os serviços",
  "Solicitar uma proposta",
  "Contratar uma solução",
  "Outros assuntos",
] as const;

export type CommercialSubject = (typeof COMMERCIAL_SUBJECTS)[number];

export const OFFICIAL_COMMERCIAL_MESSAGE =
  "Olá! Conheci o Zeladoria Condomínio e gostaria de saber mais sobre os serviços disponíveis.";

/**
 * Remove qualquer caractere não numérico
 */
export function cleanPhoneDigits(value: string): string {
  return (value || "").replace(/\D/g, "");
}

/**
 * Formata em tempo real o telefone no padrão brasileiro:
 * - Até 10 dígitos: (XX) XXXX-XXXX (fixo)
 * - 11 dígitos: (XX) XXXXX-XXXX (celular)
 */
export function formatBrazilianPhone(value: string): string {
  const digits = cleanPhoneDigits(value).slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Valida formato e regras de telefone do Brasil:
 * - 10 ou 11 dígitos
 * - DDD válido (11 a 99)
 * - Se celular (11 dígitos), 3º dígito deve ser 9
 */
export function validateBrazilianPhone(value: string): boolean {
  const digits = cleanPhoneDigits(value);
  if (digits.length !== 10 && digits.length !== 11) {
    return false;
  }
  const ddd = parseInt(digits.slice(0, 2), 10);
  if (Number.isNaN(ddd) || ddd < 11 || ddd > 99) {
    return false;
  }
  if (digits.length === 11 && digits[2] !== "9") {
    return false;
  }
  return true;
}

/**
 * Validação simples e robusta de formato de e-mail (RFC 5322 simplificado)
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 160) return false;
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return regex.test(trimmed);
}

/**
 * Retorna as informações do canal oficial de WhatsApp comercial configurado
 */
export function getCommercialWhatsAppInfo(customPhone?: string): {
  url: string;
  configured: boolean;
  phone: string;
  formattedMessage: string;
} {
  const envPhone =
    process.env.NEXT_PUBLIC_COMMERCIAL_WHATSAPP ||
    process.env.NEXT_PUBLIC_WHATSAPP_COMERCIAL ||
    "";
  const rawPhone = (customPhone || envPhone).trim();
  const digits = cleanPhoneDigits(rawPhone);

  const configured = digits.length >= 10;
  if (!configured) {
    return {
      url: "",
      configured: false,
      phone: rawPhone,
      formattedMessage: OFFICIAL_COMMERCIAL_MESSAGE,
    };
  }

  const fullPhone = digits.startsWith("55") ? digits : `55${digits}`;
  const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(OFFICIAL_COMMERCIAL_MESSAGE)}`;

  return {
    url,
    configured: true,
    phone: formatBrazilianPhone(digits.startsWith("55") ? digits.slice(2) : digits),
    formattedMessage: OFFICIAL_COMMERCIAL_MESSAGE,
  };
}
