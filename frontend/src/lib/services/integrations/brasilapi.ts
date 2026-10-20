/**
 * Integração BrasilAPI — Consulta Cadastral de CNPJ
 * Documentação: https://brasilapi.com.br/docs
 * 
 * 100% Gratuito, sem necessidade de chave de API e sem cobranças.
 * Conformidade com LGPD: Não armazena dados de sócios (QSA) ou informações pessoais desnecessárias.
 */

import { canMakeApiCall, recordApiUsage } from "./usage-tracker";

export interface CompanyDetails {
  cnpj: string;
  cnpjMasked: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacaoCadastral: string;
  dataAbertura: string;
  cnaePrincipal: {
    codigo: number;
    descricao: string;
  };
  endereco: {
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
  };
  telefone?: string;
  email?: string;
}

const companyCache = new Map<string, { data: CompanyDetails; expiresAt: number }>();
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

export function validateCnpj(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, "");
  if (clean.length !== 14 || !!clean.match(/(\d)\1{13}/)) return false;

  let length = clean.length - 2;
  let numbers = clean.substring(0, length);
  const digits = clean.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0), 10)) return false;

  length = length + 1;
  numbers = clean.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1), 10);
}

export function formatCnpj(cnpj: string): string {
  const c = cnpj.replace(/\D/g, "").slice(0, 14);
  return c
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/**
 * Consulta informações públicas de uma empresa pelo CNPJ via BrasilAPI.
 */
export async function lookupCompanyByCnpj(rawCnpj: string): Promise<CompanyDetails | null> {
  const clean = rawCnpj.replace(/\D/g, "");
  if (!validateCnpj(clean)) {
    return null;
  }

  // Verifica cache
  const cached = companyCache.get(clean);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const { allowed, reason } = canMakeApiCall("brasilapi");
  if (!allowed) {
    console.warn(`[BrasilAPI] Bloqueado pelo controlador de cotas: ${reason}`);
    return null;
  }

  const startTime = Date.now();
  const url = `https://brasilapi.com.br/api/cnpj/v1/${clean}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "ZeladoriaCondominio/1.0 (Integracao Cadastral)",
      },
      signal: AbortSignal.timeout(5000),
    });

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      recordApiUsage({
        service: "brasilapi",
        action: "lookupCompanyByCnpj",
        success: false,
        statusCode: response.status,
        durationMs,
        message: `HTTP ${response.status}: Empresa não localizada ou serviço indisponível`,
      });
      return null;
    }

    const data = await response.json();

    // Normalização com filtragem de dados pessoais de sócios (LGPD)
    const details: CompanyDetails = {
      cnpj: clean,
      cnpjMasked: formatCnpj(clean),
      razaoSocial: data.razao_social || "",
      nomeFantasia: data.nome_fantasia || data.razao_social || "",
      situacaoCadastral: data.descricao_situacao_cadastral || "ATIVA",
      dataAbertura: data.data_inicio_atividade || "",
      cnaePrincipal: {
        codigo: Number(data.cnae_fiscal || 0),
        descricao: data.cnae_fiscal_descricao || "Serviços Gerais",
      },
      endereco: {
        logradouro: `${data.descricao_tipo_de_logradouro || ""} ${data.logradouro || ""}`.trim(),
        numero: data.numero || "S/N",
        complemento: data.complemento || "",
        bairro: data.bairro || "",
        municipio: data.municipio || "",
        uf: data.uf || "",
        cep: (data.cep || "").replace(/\D/g, ""),
      },
      telefone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.slice(0, 2)}) ${data.ddd_telefone_1.slice(2)}` : undefined,
      email: data.email || undefined,
    };

    recordApiUsage({
      service: "brasilapi",
      action: "lookupCompanyByCnpj",
      success: true,
      statusCode: 200,
      durationMs,
      creditsConsumed: 1,
      message: `CNPJ localizado: ${details.razaoSocial.slice(0, 30)}`,
    });

    // Salva em cache
    companyCache.set(clean, { data: details, expiresAt: Date.now() + CACHE_TTL_MS });

    return details;
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    recordApiUsage({
      service: "brasilapi",
      action: "lookupCompanyByCnpj",
      success: false,
      durationMs,
      message: error?.message || "Timeout na consulta BrasilAPI",
    });
    return null;
  }
}
