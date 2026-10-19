"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";
import { BrandLogo } from "@/components/brand-logo";
import { registerProviderAction } from "@/lib/actions/prestador";
import { lookupCep } from "@/lib/services/cep";
import { OFFICIAL_CATEGORIES, type CatalogCategory, type CatalogServiceItem } from "@/lib/services/categories-catalog";
import { ProviderCoverageMap } from "@/components/map/provider-coverage-map";

// Funções utilitárias de validação de CPF e CNPJ
function isValidCpf(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11 || !!clean.match(/(\d)\1{10}/)) return false;
  let sum = 0;
  let rest: number;
  for (let i = 1; i <= 9; i++) sum += parseInt(clean.substring(i - 1, i)) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(clean.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(clean.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === parseInt(clean.substring(10, 11));
}

function isValidCnpj(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, "");
  if (clean.length !== 14 || !!clean.match(/(\d)\1{13}/)) return false;
  let length = clean.length - 2;
  let numbers = clean.substring(0, length);
  const digits = clean.substring(length);
  let sum = 0;
  let pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  length = length + 1;
  numbers = clean.substring(0, length);
  sum = 0;
  pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
}

function maskCpf(val: string): string {
  const c = val.replace(/\D/g, "").slice(0, 11);
  return c
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskCnpj(val: string): string {
  const c = val.replace(/\D/g, "").slice(0, 14);
  return c
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function maskPhone(val: string): string {
  const c = val.replace(/\D/g, "").slice(0, 11);
  if (c.length <= 10) {
    return c.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }
  return c.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

function maskCep(val: string): string {
  const c = val.replace(/\D/g, "").slice(0, 8);
  return c.replace(/(\d{5})(\d{1,3})/, "$1-$2");
}

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export function OnboardingWizard({
  condos,
}: {
  condos: { id: number; name: string; city: string | null }[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Tela 2 — Dados Pessoais
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Tela 3 — Tipo de Profissional
  const [providerType, setProviderType] = useState<"autonomo" | "empresa">("autonomo");
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [selectedCondoId, setSelectedCondoId] = useState<number>(condos[0]?.id || 1);

  // Tela 4 — Especialidades (Catálogo Oficial)
  const [selectedCategory, setSelectedCategory] = useState<string>("eletricista");
  const [specialties, setSpecialties] = useState<string[]>(["eletricista"]);

  // Tela 5 — Seleção Detalhada de Serviços
  const [selectedServices, setSelectedServices] = useState<CatalogServiceItem[]>([
    OFFICIAL_CATEGORIES[0].services[0],
  ]);

  // Tela 6 — Localização & Cobertura
  const [cep, setCep] = useState("01452-000");
  const [street, setStreet] = useState("Avenida Brigadeiro Faria Lima");
  const [number, setNumber] = useState("2000");
  const [neighborhood, setNeighborhood] = useState("Itaim Bibi");
  const [city, setCity] = useState("São Paulo");
  const [state, setState] = useState("SP");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: -23.5855, lng: -46.6784 });
  const [serviceRadiusKm, setServiceRadiusKm] = useState(15);
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  // Tela 7 — Recebimentos
  const [payoutMethod, setPayoutMethod] = useState<"pix" | "bank">("pix");
  const [pixKeyType, setPixKeyType] = useState<"cpf" | "cnpj" | "email" | "phone" | "random">("cpf");
  const [pixKey, setPixKey] = useState("");
  const [bankCode, setBankCode] = useState("001");
  const [bankName, setBankName] = useState("Banco do Brasil");
  const [bankAgency, setBankAgency] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccountType, setBankAccountType] = useState<"corrente" | "poupanca">("corrente");

  // Tela 8 — Verificação de Identidade
  const [documentType, setDocumentType] = useState<"cnh" | "rg">("cnh");
  const [docFrontUrl, setDocFrontUrl] = useState("");
  const [docBackUrl, setDocBackUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");

  const handleCepSearch = async () => {
    if (cep.replace(/\D/g, "").length !== 8) return;
    setIsSearchingCep(true);
    setError(null);
    try {
      const res = await lookupCep(cep);
      if (res) {
        setStreet(res.street || street);
        setNeighborhood(res.neighborhood || neighborhood);
        setCity(res.city || city);
        setState(res.state || state);
        setCoords({ lat: res.lat, lng: res.lng });
      } else {
        setError("CEP não encontrado. Preencha os campos de endereço manualmente.");
      }
    } finally {
      setIsSearchingCep(false);
    }
  };

  const toggleSpecialty = (catId: string) => {
    setSpecialties((prev) => {
      if (prev.includes(catId)) {
        if (prev.length === 1) return prev; // Mantém ao menos uma
        return prev.filter((id) => id !== catId);
      }
      return [...prev, catId];
    });
  };

  const toggleService = (svc: CatalogServiceItem) => {
    setSelectedServices((prev) => {
      const exists = prev.some((s) => s.id === svc.id);
      if (exists) {
        if (prev.length === 1) return prev; // Mantém ao menos um
        return prev.filter((s) => s.id !== svc.id);
      }
      return [...prev, svc];
    });
  };

  const validateStep = (): boolean => {
    setError(null);
    if (step === 2) {
      if (!name.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !cpf.trim()) {
        setError("Preencha todos os dados pessoais obrigatórios.");
        return false;
      }
      if (!isValidCpf(cpf)) {
        setError("O CPF informado é inválido. Verifique os dígitos.");
        return false;
      }
      if (password.length < 6) {
        setError("A senha deve ter no mínimo 6 caracteres.");
        return false;
      }
      if (password !== confirmPassword) {
        setError("A confirmação de senha não confere com a senha digitada.");
        return false;
      }
    }
    if (step === 3) {
      if (providerType === "empresa") {
        if (!cnpj.trim() || !isValidCnpj(cnpj)) {
          setError("O CNPJ informado é inválido.");
          return false;
        }
        if (!companyName.trim()) {
          setError("Informe a Razão Social ou Nome Fantasia da empresa.");
          return false;
        }
      }
    }
    if (step === 4) {
      if (specialties.length === 0) {
        setError("Selecione ao menos uma especialidade de atuação.");
        return false;
      }
    }
    if (step === 5) {
      if (selectedServices.length === 0) {
        setError("Selecione ao menos um serviço no catálogo.");
        return false;
      }
    }
    if (step === 6) {
      if (!street.trim() || !city.trim() || !cep.trim()) {
        setError("Informe o endereço completo de base do atendimento.");
        return false;
      }
    }
    if (step === 7) {
      if (payoutMethod === "pix" && !pixKey.trim()) {
        setError("Informe a sua chave PIX para repasse.");
        return false;
      }
      if (payoutMethod === "bank" && (!bankAgency.trim() || !bankAccount.trim())) {
        setError("Informe a agência e conta bancária para recebimentos.");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep((prev) => Math.min(9, prev + 1) as Step);
  };

  const prevStep = () => {
    setError(null);
    setStep((prev) => Math.max(1, prev - 1) as Step);
  };

  const handleFinalSubmit = () => {
    setError(null);
    startTransition(async () => {
      const minPrice = selectedServices.reduce(
        (min, s) => (s.priceFromCents && s.priceFromCents < min ? s.priceFromCents : min),
        selectedServices[0]?.priceFromCents || 8000
      );

      const res = await registerProviderAction({
        name,
        lastName,
        email,
        phone,
        cpf,
        password,
        photoUrl: photoUrl.trim() || undefined,
        providerType,
        companyName: companyName.trim() || `${name} ${lastName}`,
        cnpj: providerType === "empresa" ? cnpj : cpf,
        category: selectedCategory,
        specialties,
        services: selectedServices.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          priceFromCents: s.priceFromCents,
          priceType: s.priceType,
          estimatedDurationMinutes: s.estimatedDurationMinutes,
          warrantyDays: s.warrantyDays,
        })),
        priceFromCents: minPrice,
        cep,
        addressStreet: street,
        addressNumber: number,
        addressNeighborhood: neighborhood,
        addressCity: city,
        addressState: state,
        serviceArea: `${neighborhood}, ${city} - ${state} (${serviceRadiusKm} km)`,
        serviceRadiusKm,
        lat: coords.lat,
        lng: coords.lng,
        pixInfo:
          payoutMethod === "pix"
            ? {
                keyType: pixKeyType,
                key: pixKey.trim(),
              }
            : undefined,
        bankInfo:
          payoutMethod === "bank"
            ? {
                bankCode,
                bankName,
                agency: bankAgency.trim(),
                account: bankAccount.trim(),
                accountType: bankAccountType,
                holderName: `${name} ${lastName}`,
                holderDocument: cpf,
              }
            : undefined,
        identityVerification: {
          documentType,
          frontUrl: docFrontUrl.trim() || undefined,
          backUrl: docBackUrl.trim() || undefined,
          selfieUrl: selfieUrl.trim() || undefined,
        },
        condoId: selectedCondoId,
      });

      if (!res.success) {
        setError(res.error || "Erro ao registrar cadastro.");
        return;
      }

      router.push("/prestador");
      router.refresh();
    });
  };

  const stepLabels: Record<Step, string> = {
    1: "Boas-vindas",
    2: "Dados Pessoais",
    3: "Tipo Profissional",
    4: "Especialidades",
    5: "Serviços",
    6: "Cobertura",
    7: "Recebimentos",
    8: "Identidade",
    9: "Revisão",
  };

  return (
    <div className="space-y-6">
      {/* Barra de Progresso Superior */}
      {step > 1 && (
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>
              Etapa {step} de 9 — <strong className="text-[#1355FF]">{stepLabels[step]}</strong>
            </span>
            <span>{Math.round((step / 9) * 100)}% concluído</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="bg-[#1355FF] transition-all duration-300 rounded-full"
              style={{ width: `${(step / 9) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-3 gap-1 overflow-x-auto pb-1">
            {([1, 2, 3, 4, 5, 6, 7, 8, 9] as Step[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (s < step) setStep(s);
                }}
                disabled={s > step}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors shrink-0 ${
                  s === step
                    ? "bg-blue-50 text-[#1355FF] border border-blue-200"
                    : s < step
                    ? "text-slate-600 hover:text-slate-900 cursor-pointer"
                    : "text-slate-300 cursor-not-allowed"
                }`}
              >
                {stepLabels[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <Icon name="alert-triangle" size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* =====================================================================
          TELA 1 — BOAS-VINDAS
      ===================================================================== */}
      {step === 1 && (
        <div className="text-center py-6 sm:py-8 space-y-6">
          <div className="flex justify-center mb-2">
            <BrandLogo size="lg" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Credenciamento de Prestadores
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Conecte-se aos condomínios da sua região, receba chamados qualificados de moradores e síndicos, com remuneração protegida e agenda organizada.
            </p>
          </div>

          {/* Destaques / Vantagens */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-left pt-2">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-[#1355FF]">
                <Icon name="shield" size={14} />
              </span>
              <p className="text-xs font-bold text-slate-900">Zeladoria Protege</p>
              <p className="text-[11px] text-slate-500">Repasses pontuais via PIX e segurança contratual.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-[#1355FF]">
                <Icon name="calendar" size={14} />
              </span>
              <p className="text-xs font-bold text-slate-900">Agenda Flexível</p>
              <p className="text-[11px] text-slate-500">Defina seu raio e horários de disponibilidade.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-[#1355FF]">
                <Icon name="wallet" size={14} />
              </span>
              <p className="text-xs font-bold text-slate-900">Zero Mensalidade</p>
              <p className="text-[11px] text-slate-500">Cadastro gratuito. Pague apenas comissão por serviço executado.</p>
            </div>
          </div>

          <div className="pt-4 max-w-xs mx-auto space-y-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full h-11 rounded-xl bg-[#1355FF] text-white text-xs font-bold hover:bg-[#0D47E6] transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Cadastrar como Prestador</span>
              <Icon name="arrow-right" size={14} />
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <Link href="/prestador/login" className="font-semibold text-slate-600 hover:text-[#1355FF]">
                Já é parceiro? Entrar
              </Link>
              <Link href="/esqueci-senha" className="text-slate-400 hover:text-slate-600">
                Esqueceu a senha?
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TELA 2 — DADOS PESSOAIS
      ===================================================================== */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Dados Pessoais e Acesso</h3>
            <p className="text-xs text-slate-500">Crie sua credencial de acesso ao Portal do Parceiro.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos"
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sobrenome *</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ex: Silva"
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">E-mail de Acesso *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos@exemplo.com.br"
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Telefone com DDD *</label>
              <input
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                placeholder="(11) 98765-4321"
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CPF do Titular *</label>
              <input
                value={cpf}
                onChange={(e) => setCpf(maskCpf(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-mono outline-none focus:border-[#1355FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Foto de Perfil (URL ou avatar)</label>
              <input
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://... ou deixe em branco"
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Senha de Acesso *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar Senha *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF]"
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TELA 3 — TIPO DE PROFISSIONAL
      ===================================================================== */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Modalidade de Atuação</h3>
            <p className="text-xs text-slate-500">Como você ou sua empresa emite recibos e atende condomínios?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProviderType("autonomo")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                providerType === "autonomo"
                  ? "border-[#1355FF] bg-blue-50/50 ring-2 ring-blue-500/10"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-[#1355FF]">
                  <Icon name="user" size={16} />
                </span>
                {providerType === "autonomo" && (
                  <span className="h-4 w-4 rounded-full bg-[#1355FF] text-white flex items-center justify-center text-[10px]">✓</span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-900">Pessoa Física / Autônomo</p>
              <p className="text-[11px] text-slate-500 mt-1">Atua como profissional liberal utilizando CPF e recibo autônomo (RPA).</p>
            </button>

            <button
              type="button"
              onClick={() => setProviderType("empresa")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                providerType === "empresa"
                  ? "border-[#1355FF] bg-blue-50/50 ring-2 ring-blue-500/10"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-[#1355FF]">
                  <Icon name="building" size={16} />
                </span>
                {providerType === "empresa" && (
                  <span className="h-4 w-4 rounded-full bg-[#1355FF] text-white flex items-center justify-center text-[10px]">✓</span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-900">MEI ou Empresa com CNPJ</p>
              <p className="text-[11px] text-slate-500 mt-1">Emite nota fiscal de prestação de serviços como pessoa jurídica.</p>
            </button>
          </div>

          {providerType === "empresa" && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ da Empresa *</label>
                  <input
                    value={cnpj}
                    onChange={(e) => setCnpj(maskCnpj(e.target.value))}
                    placeholder="00.000.000/0001-00"
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-mono outline-none focus:border-[#1355FF] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Razão Social / Nome da Empresa *</label>
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: Carlos Elétrica & Manutenções ME"
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF] bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Condomínio Parceiro de Referência</label>
            <select
              value={selectedCondoId}
              onChange={(e) => setSelectedCondoId(Number(e.target.value))}
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF] bg-white"
            >
              {condos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city || "SP"})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* =====================================================================
          TELA 4 — ESPECIALIDADES (14 CATEGORIAS OFICIAIS)
      ===================================================================== */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Catálogo de Especialidades</h3>
              <p className="text-xs text-slate-500">Selecione suas áreas de atuação técnica.</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1355FF]">
              {specialties.length} selecionada(s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
            {OFFICIAL_CATEGORIES.map((cat) => {
              const isSelected = specialties.includes(cat.id);
              const isPrimary = selectedCategory === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    toggleSpecialty(cat.id);
                    if (!isSelected) setSelectedCategory(cat.id);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? "border-[#1355FF] bg-blue-50/40 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      isSelected ? "bg-[#1355FF] text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      <Icon name={cat.icon} size={14} />
                    </span>

                    {isSelected && (
                      <span className="h-4 w-4 rounded-full bg-[#1355FF] text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-slate-900 leading-snug">{cat.name}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{cat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          TELA 5 — SELEÇÃO DETALHADA DE SERVIÇOS
      ===================================================================== */}
      {step === 5 && (
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Seleção Detalhada de Serviços</h3>
              <p className="text-xs text-slate-500">
                Serviços pré-configurados com garantia legal de 90 dias (Zeladoria Protege).
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#1355FF]">
              {selectedServices.length} serviço(s) ativo(s)
            </span>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {OFFICIAL_CATEGORIES.filter((c) => specialties.includes(c.id)).map((cat) => (
              <div key={cat.id} className="space-y-2">
                <div className="flex items-center gap-2 pt-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-[#1355FF]">
                    <Icon name={cat.icon} size={12} />
                  </span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    {cat.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {cat.services.map((svc) => {
                    const isSelected = selectedServices.some((s) => s.id === svc.id);

                    return (
                      <div
                        key={svc.id}
                        onClick={() => toggleService(svc)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#1355FF] bg-blue-50/30"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-[#1355FF] focus:ring-[#1355FF]"
                            />
                            <p className="text-xs font-bold text-slate-900">{svc.name}</p>
                          </div>
                          <p className="text-[11px] text-slate-500 pl-5">{svc.description}</p>
                          <div className="flex items-center gap-3 pl-5 text-[10px] text-slate-400 pt-0.5">
                            <span>⏱ ~{svc.estimatedDurationMinutes} min</span>
                            <span>🛡 Garantia: {svc.warrantyDays} dias</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs font-black text-slate-900">
                            R$ {(svc.priceFromCents / 100).toFixed(2).replace(".", ",")}
                          </p>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {svc.priceType.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TELA 6 — LOCALIZAÇÃO & COBERTURA INTERATIVA
      ===================================================================== */}
      {step === 6 && (
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Área Geográfica de Atendimento</h3>
            <p className="text-xs text-slate-500">
              Informe seu CEP base. O sistema calculará a distância real por coordenadas geográficas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CEP Base *</label>
              <div className="flex gap-1.5">
                <input
                  value={cep}
                  onChange={(e) => setCep(maskCep(e.target.value))}
                  placeholder="00000-000"
                  className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-mono outline-none focus:border-[#1355FF]"
                />
                <button
                  type="button"
                  onClick={handleCepSearch}
                  disabled={isSearchingCep}
                  className="px-3 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors shrink-0 cursor-pointer"
                >
                  {isSearchingCep ? "..." : "Buscar"}
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Logradouro / Rua *</label>
              <input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Número</label>
              <input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bairro</label>
              <input
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cidade / UF</label>
              <input
                value={`${city} - ${state}`}
                readOnly
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none bg-slate-50 text-slate-600"
              />
            </div>
          </div>

          {/* Slider de Raio em km */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-800">Raio de Cobertura de Atendimento</span>
              <span className="text-[#1355FF] bg-blue-50 px-2 py-0.5 rounded-full font-mono">
                {serviceRadiusKm} km ao redor
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="60"
              step="1"
              value={serviceRadiusKm}
              onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
              className="w-full accent-[#1355FF] cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Você receberá oportunidades de condomínios situados a até {serviceRadiusKm} km de distância desta base.
            </p>
          </div>

          {/* Mapa Leaflet Interativo com Marcador e Círculo */}
          <ProviderCoverageMap
            lat={coords.lat}
            lng={coords.lng}
            radiusKm={serviceRadiusKm}
            onLocationChange={(newCoords) => setCoords(newCoords)}
          />
        </div>
      )}

      {/* =====================================================================
          TELA 7 — DADOS DE RECEBIMENTO FINANCEIRO
      ===================================================================== */}
      {step === 7 && (
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Dados para Recebimento</h3>
            <p className="text-xs text-slate-500">
              Como você deseja receber o repasse financeiro dos serviços concluídos no condomínio?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPayoutMethod("pix")}
              className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                payoutMethod === "pix"
                  ? "border-[#1355FF] bg-blue-50/50 text-[#1355FF] font-bold"
                  : "border-slate-200 text-slate-600 bg-white"
              }`}
            >
              Chave PIX (Imediato)
            </button>
            <button
              type="button"
              onClick={() => setPayoutMethod("bank")}
              className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                payoutMethod === "bank"
                  ? "border-[#1355FF] bg-blue-50/50 text-[#1355FF] font-bold"
                  : "border-slate-200 text-slate-600 bg-white"
              }`}
            >
              Conta Bancária (TED)
            </button>
          </div>

          {payoutMethod === "pix" ? (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Chave PIX</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["cpf", "cnpj", "email", "phone"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPixKeyType(t)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold uppercase transition-colors ${
                        pixKeyType === t
                          ? "bg-[#1355FF] text-white"
                          : "bg-white border border-slate-200 text-slate-600"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chave PIX *</label>
                <input
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder={pixKeyType === "cpf" ? cpf : "Digite sua chave..."}
                  className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF] bg-white font-mono"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Banco / Instituição</label>
                  <select
                    value={bankCode}
                    onChange={(e) => {
                      setBankCode(e.target.value);
                      const opt = e.target.selectedOptions[0]?.text;
                      if (opt) setBankName(opt);
                    }}
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF] bg-white"
                  >
                    <option value="001">001 — Banco do Brasil</option>
                    <option value="237">237 — Bradesco</option>
                    <option value="341">341 — Itaú Unibanco</option>
                    <option value="104">104 — Caixa Econômica</option>
                    <option value="033">033 — Santander</option>
                    <option value="260">260 — Nubank</option>
                    <option value="077">077 — Banco Inter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Conta</label>
                  <select
                    value={bankAccountType}
                    onChange={(e) => setBankAccountType(e.target.value as any)}
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF] bg-white"
                  >
                    <option value="corrente">Conta Corrente</option>
                    <option value="poupanca">Conta Poupança</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Agência</label>
                  <input
                    value={bankAgency}
                    onChange={(e) => setBankAgency(e.target.value)}
                    placeholder="Ex: 1234"
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF] bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Conta com Dígito</label>
                  <input
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="Ex: 12345-6"
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1355FF] bg-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TELA 8 — VERIFICAÇÃO DE IDENTIDADE E DOCUMENTAÇÃO
      ===================================================================== */}
      {step === 8 && (
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Verificação de Identidade</h3>
            <p className="text-xs text-slate-500">
              Para segurança dos condomínios e moradores, solicitamos a comprovação documental do profissional.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
            <Icon name="shield" size={16} className="text-[#1355FF] shrink-0" />
            <span>
              Seus documentos são criptografados e utilizados exclusivamente para análise de credenciamento, em conformidade com a LGPD.
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Documento Apresentado</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="docType"
                    checked={documentType === "cnh"}
                    onChange={() => setDocumentType("cnh")}
                  />
                  <span>CNH (Carteira Nacional de Habilitação)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="docType"
                    checked={documentType === "rg"}
                    onChange={() => setDocumentType("rg")}
                  />
                  <span>RG com CPF</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">Frente do Documento (ou PDF)</label>
                <input
                  value={docFrontUrl}
                  onChange={(e) => setDocFrontUrl(e.target.value)}
                  placeholder="URL do arquivo / foto frontal"
                  className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs outline-none focus:border-[#1355FF] bg-white"
                />
                <p className="text-[10px] text-slate-400">Certifique-se de que o nome e foto estejam legíveis.</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">Verso do Documento</label>
                <input
                  value={docBackUrl}
                  onChange={(e) => setDocBackUrl(e.target.value)}
                  placeholder="URL do verso (opcional para CNH digital)"
                  className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs outline-none focus:border-[#1355FF] bg-white"
                />
                <p className="text-[10px] text-slate-400">Onde constam os números de registro e filiação.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">Selfie com Documento</label>
              <input
                value={selfieUrl}
                onChange={(e) => setSelfieUrl(e.target.value)}
                placeholder="URL da selfie segurando o documento ao lado do rosto"
                className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs outline-none focus:border-[#1355FF] bg-white"
              />
              <p className="text-[10px] text-slate-400">Utilizado para verificação humana de autenticidade.</p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TELA 9 — REVISÃO E CONFIRMAÇÃO
      ===================================================================== */}
      {step === 9 && (
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Revisão do Cadastro Profissional</h3>
            <p className="text-xs text-slate-500">Confirme as informações antes de enviar para ativação.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Profissional / Empresa</p>
              <p className="text-xs font-bold text-slate-900">{name} {lastName}</p>
              <p className="text-[11px] text-slate-600">{email} · {phone}</p>
              <p className="text-[11px] font-mono text-slate-500">
                {providerType === "empresa" ? `CNPJ: ${cnpj}` : `CPF: ${cpf}`}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Região & Cobertura</p>
              <p className="text-xs font-bold text-slate-900">{neighborhood}, {city} - {state}</p>
              <p className="text-[11px] text-[#1355FF] font-bold">{serviceRadiusKm} km de raio de atendimento</p>
              <p className="text-[10px] text-slate-400 font-mono">
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Especialidades e Serviços</p>
              <p className="text-xs font-bold text-slate-900">{selectedServices.length} serviço(s) configurado(s)</p>
              <p className="text-[11px] text-slate-600">
                {specialties.map((s) => s.replace("_", " ")).join(", ")}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Recebimento Financeiro</p>
              <p className="text-xs font-bold text-slate-900">
                {payoutMethod === "pix" ? `PIX (${pixKeyType.toUpperCase()})` : bankName}
              </p>
              <p className="text-[11px] text-slate-600 font-mono">
                {payoutMethod === "pix" ? (pixKey || cpf) : `Ag: ${bankAgency} · Cc: ${bankAccount}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botões de Ação Inferiores */}
      {step > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={prevStep}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Voltar
          </button>

          {step < 9 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-5 py-2 rounded-xl bg-[#1355FF] text-white text-xs font-bold hover:bg-[#0D47E6] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Continuar</span>
              <Icon name="chevron-right" size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isPending}
              className="px-6 py-2.5 rounded-xl bg-[#1355FF] text-white text-xs font-bold hover:bg-[#0D47E6] transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <span>Enviando cadastro...</span>
              ) : (
                <>
                  <Icon name="check-circle" size={16} />
                  <span>Finalizar Credenciamento</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
