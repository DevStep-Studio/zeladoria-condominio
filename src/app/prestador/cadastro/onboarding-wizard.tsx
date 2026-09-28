"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { registerProviderAction } from "@/lib/actions/prestador";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export function OnboardingWizard({
  condos,
}: {
  condos: { id: number; name: string; city: string | null }[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Etapa 1 - Conta
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Etapa 2 - Perfil
  const [providerType, setProviderType] = useState<"autonomo" | "empresa">("autonomo");
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [selectedCondoId, setSelectedCondoId] = useState<number>(condos[0]?.id || 1);

  // Etapa 3 - Serviços
  const [category, setCategory] = useState("eletrica");
  const [services, setServices] = useState<
    { id: string; name: string; description: string; priceFromCents: number | null; priceType: "a_partir" | "fixo" | "por_hora" | "sob_consulta" }[]
  >([
    {
      id: "svc-1",
      name: "Instalação / Troca de Chuveiro",
      description: "Substituição completa e teste de fiação",
      priceFromCents: 9000,
      priceType: "a_partir",
    },
  ]);
  const [newSvcName, setNewSvcName] = useState("");
  const [newSvcDesc, setNewSvcDesc] = useState("");
  const [newSvcPrice, setNewSvcPrice] = useState("80");
  const [newSvcType, setNewSvcType] = useState<"a_partir" | "fixo" | "por_hora" | "sob_consulta">("a_partir");

  // Etapa 4 - Região
  const [serviceArea, setServiceArea] = useState("São Paulo e Região Metropolitana");
  const [serviceRadiusKm, setServiceRadiusKm] = useState(15);

  // Etapa 5 - Experiência
  const [experienceYears, setExperienceYears] = useState(5);
  const [description, setDescription] = useState(
    "Profissional com ampla experiência em condomínios e residências, pontual e com ferramentas adequadas."
  );

  // Etapa 6 - Portfólio
  const [portfolio, setPortfolio] = useState<{ url: string; caption: string }[]>([
    {
      url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80",
      caption: "Instalação de quadro de distribuição e novos disjuntores",
    },
  ]);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");

  // Etapa 7 - Documentos
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentName, setDocumentName] = useState("RG / CNH Profissional");

  const addService = () => {
    if (!newSvcName.trim()) return;
    const priceCents = newSvcPrice ? Math.round(parseFloat(newSvcPrice) * 100) : null;
    setServices((prev) => [
      ...prev,
      {
        id: `svc-${Date.now()}`,
        name: newSvcName.trim(),
        description: newSvcDesc.trim() || "Serviço profissional",
        priceFromCents: priceCents,
        priceType: newSvcType,
      },
    ]);
    setNewSvcName("");
    setNewSvcDesc("");
    setNewSvcPrice("");
  };

  const removeService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const addPortfolioItem = () => {
    if (!newPhotoUrl.trim()) return;
    setPortfolio((prev) => [
      ...prev,
      {
        url: newPhotoUrl.trim(),
        caption: newPhotoCaption.trim() || "Serviço realizado",
      },
    ]);
    setNewPhotoUrl("");
    setNewPhotoCaption("");
  };

  const removePortfolioItem = (index: number) => {
    setPortfolio((prev) => prev.filter((_, idx) => idx !== index));
  };

  const validateStep = (): boolean => {
    setError(null);
    if (step === 1) {
      if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
        setError("Por favor, preencha todos os campos obrigatórios da conta.");
        return false;
      }
      if (password.length < 6) {
        setError("A senha deve ter no mínimo 6 caracteres.");
        return false;
      }
    }
    if (step === 2) {
      if (!companyName.trim()) {
        setError("Informe o nome profissional ou da empresa.");
        return false;
      }
    }
    if (step === 3) {
      if (services.length === 0) {
        setError("Adicione pelo menos um serviço ao seu catálogo inicial.");
        return false;
      }
    }
    if (step === 4) {
      if (!serviceArea.trim()) {
        setError("Informe as cidades e bairros atendidos.");
        return false;
      }
    }
    if (step === 5) {
      if (!description.trim()) {
        setError("Escreva uma breve apresentação profissional.");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep((prev) => Math.min(8, prev + 1) as Step);
  };

  const prevStep = () => {
    setError(null);
    setStep((prev) => Math.max(1, prev - 1) as Step);
  };

  const handleFinalSubmit = () => {
    setError(null);
    startTransition(async () => {
      const minPrice = services.reduce(
        (min, s) => (s.priceFromCents && s.priceFromCents < min ? s.priceFromCents : min),
        services[0]?.priceFromCents || 8000
      );

      const res = await registerProviderAction({
        name,
        lastName,
        email,
        phone,
        password,
        providerType,
        companyName,
        cnpj,
        photoUrl,
        category,
        services,
        priceFromCents: minPrice,
        serviceArea,
        serviceRadiusKm,
        experienceYears,
        description,
        portfolio,
        documentUrl,
        documentName,
        condoId: selectedCondoId,
      });

      if (!res.success) {
        setError(res.error || "Erro ao enviar cadastro.");
        return;
      }

      router.push("/prestador");
      router.refresh();
    });
  };

  const stepTitles = [
    "Conta",
    "Perfil",
    "Serviços",
    "Região",
    "Experiência",
    "Portfólio",
    "Documentação",
    "Revisão",
  ];

  return (
    <div className="space-y-6">
      {/* 8-Step Navigation Progress Bar */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
          <span>
            Etapa {step} de 8 — <strong className="text-[#0055D4]">{stepTitles[step - 1]}</strong>
          </span>
          <span>{Math.round((step / 8) * 100)}% concluído</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="bg-[#0055D4] transition-all duration-300 rounded-full"
            style={{ width: `${(step / 8) * 100}%` }}
          />
        </div>

        {/* Step dots for fast mobile & desktop navigation */}
        <div className="flex justify-between items-center mt-3 gap-1 overflow-x-auto">
          {stepTitles.map((title, i) => {
            const stepNum = (i + 1) as Step;
            const isCompleted = step > stepNum;
            const isCurrent = step === stepNum;
            return (
              <button
                key={title}
                type="button"
                onClick={() => {
                  if (stepNum < step) setStep(stepNum);
                }}
                disabled={stepNum > step}
                className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg transition-colors shrink-0 ${
                  isCurrent
                    ? "bg-blue-50 text-[#0055D4] border border-blue-200"
                    : isCompleted
                    ? "text-emerald-700 hover:bg-slate-100 cursor-pointer"
                    : "text-slate-300 cursor-not-allowed"
                }`}
              >
                {isCompleted ? (
                  <Icon name="check-circle" size={12} className="text-emerald-600" />
                ) : (
                  <span>{stepNum}.</span>
                )}
                <span className="hidden sm:inline">{title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium flex items-center gap-2">
          <Icon name="alert-triangle" size={14} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: CONTA */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Informações de Acesso</h3>
            <p className="text-xs text-slate-500">Crie sua conta para gerenciar serviços e propostas.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sobrenome <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ex: Eduardo Silva"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-mail Profissional <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos@eletrica.com.br"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telefone / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Senha de Acesso <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
            />
          </div>
        </div>
      )}

      {/* STEP 2: PERFIL */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Tipo de Perfil e Apresentação</h3>
            <p className="text-xs text-slate-500">Defina se atua como autônomo ou empresa credenciada.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProviderType("autonomo")}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                providerType === "autonomo"
                  ? "bg-blue-50/70 border-[#0055D4] text-[#0055D4]"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon name="user" size={18} className="mb-1" />
              <div className="font-bold text-xs">Profissional Autônomo</div>
              <div className="text-[10px] text-slate-500">Pessoa física ou MEI</div>
            </button>

            <button
              type="button"
              onClick={() => setProviderType("empresa")}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                providerType === "empresa"
                  ? "bg-blue-50/70 border-[#0055D4] text-[#0055D4]"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon name="building" size={18} className="mb-1" />
              <div className="font-bold text-xs">Empresa de Serviços</div>
              <div className="text-[10px] text-slate-500">Com equipe ou CNPJ ME/LTDA</div>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome Comercial / Vitrine <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Carlos Elétrica & Manutenções"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                CPF ou CNPJ (opcional)
              </label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Foto de Perfil ou Logo (URL de Imagem)
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://exemplo.com/minha-foto.jpg"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
            />
          </div>

          {condos.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Condomínio Base Inicial
              </label>
              <select
                value={selectedCondoId}
                onChange={(e) => setSelectedCondoId(Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
              >
                {condos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.city ? `(${c.city})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: SERVIÇOS & ESPECIALIDADES */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Especialidades e Catálogo de Preços</h3>
            <p className="text-xs text-slate-500">
              Moradores contratam muito mais quando encontram serviços claros com valores de referência.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Categoria Principal de Atuação
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
            >
              <option value="eletrica">Elétrica</option>
              <option value="hidraulica">Hidráulica</option>
              <option value="climatizacao">Climatização & Ar-condicionado</option>
              <option value="pintura">Pintura</option>
              <option value="marcenaria">Marcenaria</option>
              <option value="seguranca">Segurança & Fechaduras</option>
              <option value="limpeza">Limpeza especializada</option>
              <option value="jardinagem">Jardinagem</option>
              <option value="servicos">Serviços gerais</option>
            </select>
          </div>

          {/* Current Services List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Serviços no Catálogo:</span>
            {services.map((svc) => (
              <div
                key={svc.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs"
              >
                <div>
                  <div className="font-bold text-[#0F172A]">{svc.name}</div>
                  <div className="text-[11px] text-slate-500">{svc.description}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-[#0055D4]">
                    {svc.priceFromCents
                      ? `R$ ${(svc.priceFromCents / 100).toFixed(0)} (${svc.priceType === "a_partir" ? "a partir de" : svc.priceType})`
                      : "Sob consulta"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeService(svc.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Service Form */}
          <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-white space-y-3">
            <span className="text-xs font-bold text-slate-700 block">+ Adicionar Novo Serviço</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nome do serviço (ex: Troca de tomada)"
                value={newSvcName}
                onChange={(e) => setNewSvcName(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 px-2.5 text-xs text-slate-900 outline-none"
              />
              <input
                type="text"
                placeholder="Breve descrição"
                value={newSvcDesc}
                onChange={(e) => setNewSvcDesc(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 px-2.5 text-xs text-slate-900 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Valor (R$)"
                value={newSvcPrice}
                onChange={(e) => setNewSvcPrice(e.target.value)}
                className="h-9 w-28 rounded-lg border border-slate-200 px-2.5 text-xs text-slate-900 outline-none"
              />
              <select
                value={newSvcType}
                onChange={(e) => setNewSvcType(e.target.value as any)}
                className="h-9 rounded-lg border border-slate-200 px-2 text-xs text-slate-700 outline-none"
              >
                <option value="a_partir">A partir de</option>
                <option value="fixo">Preço Fixo</option>
                <option value="por_hora">Por Hora</option>
                <option value="sob_consulta">Sob Consulta</option>
              </select>
              <button
                type="button"
                onClick={addService}
                className="h-9 px-3 rounded-lg bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: REGIÃO DE ATENDIMENTO */}
      {step === 4 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Região e Raio de Atendimento</h3>
            <p className="text-xs text-slate-500">
              Você só receberá chamados e solicitações dentro da sua área delimitada.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Cidades e Bairros Atendidos <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              placeholder="Ex: Pinheiros, Perdizes, Vila Madalena, Itaim Bibi, Jardins..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Raio Máximo de Deslocamento:</span>
              <span className="text-[#0055D4] font-black">{serviceRadiusKm} km</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={serviceRadiusKm}
              onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
              className="w-full accent-[#0055D4] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>5 km (Local)</span>
              <span>25 km (Regional)</span>
              <span>50 km (Metropolitano)</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: EXPERIÊNCIA & QUALIFICAÇÃO */}
      {step === 5 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Experiência e Apresentação</h3>
            <p className="text-xs text-slate-500">
              Conte sobre seus anos de atuação e diferenciais para transmitir confiança aos condomínios.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Anos de Experiência no Setor
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              className="h-10 w-32 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descrição / Bio Profissional <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique suas qualificações, cuidados com o imóvel do morador, pontualidade e garantias..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
            />
          </div>
        </div>
      )}

      {/* STEP 6: PORTFÓLIO */}
      {step === 6 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Portfólio de Trabalhos Realizados</h3>
            <p className="text-xs text-slate-500">
              Fotos reais dos seus serviços aumentam as contratações em até 3x.
            </p>
          </div>

          {/* Current Portfolio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {portfolio.map((item, index) => (
              <div
                key={index}
                className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2 space-y-1.5"
              >
                <div className="h-32 w-full rounded-lg overflow-hidden bg-slate-200">
                  <img src={item.url} alt={item.caption} className="h-full w-full object-cover" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 truncate">{item.caption}</span>
                  <button
                    type="button"
                    onClick={() => removePortfolioItem(index)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add photo */}
          <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-white space-y-2">
            <span className="text-xs font-bold text-slate-700 block">+ Adicionar Foto ao Portfólio</span>
            <input
              type="url"
              placeholder="URL da foto (ex: https://images.unsplash.com/...)"
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs text-slate-900 outline-none"
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Legenda do trabalho (ex: Reforma completa de banheiro)"
                value={newPhotoCaption}
                onChange={(e) => setNewPhotoCaption(e.target.value)}
                className="h-9 flex-1 rounded-lg border border-slate-200 px-2.5 text-xs text-slate-900 outline-none"
              />
              <button
                type="button"
                onClick={addPortfolioItem}
                className="h-9 px-3 rounded-lg bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 7: DOCUMENTAÇÃO */}
      {step === 7 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Documentação para Credenciamento</h3>
            <p className="text-xs text-slate-500">
              O selo &quot;Verificado&quot; só é concedido após análise real de documento pelo condomínio ou administração.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 text-xs text-[#0055D4] space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Icon name="shield" size={14} />
              <span>Verificação de Segurança Condominial</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Para a segurança dos moradores e das portarias, comprovantes de identidade, certificados técnicos (CFT/CREA quando aplicável) ou cartão CNPJ são revisados antes da liberação do selo verificado.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tipo do Documento
            </label>
            <select
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
            >
              <option value="RG / CNH Profissional">RG ou CNH (Pessoa Física)</option>
              <option value="Cartão CNPJ / CCMEI">Cartão CNPJ / Certificado MEI</option>
              <option value="Certificação Técnica / Registro">Certificação Técnica (CFT/CREA/NR10)</option>
              <option value="Comprovante de Residência">Comprovante de Endereço Comercial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Link / URL do Documento Digitalizado
            </label>
            <input
              type="url"
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
              placeholder="https://exemplo.com/meu-documento.pdf"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-[#0055D4]"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Você também poderá anexar novos arquivos diretamente no seu painel mais tarde.
            </p>
          </div>
        </div>
      )}

      {/* STEP 8: REVISÃO & CONFIRMAÇÃO */}
      {step === 8 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Revisão do Cadastro</h3>
            <p className="text-xs text-slate-500">
              Confira os dados antes de submeter para aprovação da plataforma.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
              <div>
                <span className="text-slate-400">Profissional / Empresa:</span>
                <p className="font-bold text-[#0F172A]">{companyName || `${name} ${lastName}`}</p>
              </div>
              <div>
                <span className="text-slate-400">Categoria:</span>
                <p className="font-bold text-[#0F172A] capitalize">{category}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
              <div>
                <span className="text-slate-400">Contato:</span>
                <p className="font-bold text-[#0F172A]">{phone} · {email}</p>
              </div>
              <div>
                <span className="text-slate-400">Raio de Atendimento:</span>
                <p className="font-bold text-[#0F172A]">{serviceRadiusKm} km</p>
              </div>
            </div>

            <div className="border-b border-slate-200 pb-2">
              <span className="text-slate-400">Serviços Configurados ({services.length}):</span>
              <ul className="list-disc pl-4 text-slate-700 mt-1 space-y-0.5">
                {services.map((s) => (
                  <li key={s.id}>
                    <strong>{s.name}</strong> — {s.priceFromCents ? `R$ ${(s.priceFromCents / 100).toFixed(0)}` : "Sob consulta"}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="text-slate-400">Portfólio:</span>
              <p className="font-bold text-[#0F172A]">{portfolio.length} trabalho(s) cadastrado(s)</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <Icon name="alert-triangle" size={15} className="shrink-0 mt-0.5 text-amber-700" />
            <span>
              Ao enviar, seu cadastro entrará em análise e você terá acesso imediato ao painel do prestador para configurar sua agenda e catálogo.
            </span>
          </div>
        </div>
      )}

      {/* Action Footer Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        {step > 1 ? (
          <button
            type="button"
            onClick={prevStep}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            <Icon name="arrow-left" size={13} />
            <span>Voltar</span>
          </button>
        ) : (
          <div />
        )}

        {step < 8 ? (
          <button
            type="button"
            onClick={nextStep}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0055D4] hover:bg-[#0047BA] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <span>Avançar para Etapa {step + 1}</span>
            <Icon name="arrow-right" size={13} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Enviando cadastro...</span>
              </>
            ) : (
              <>
                <Icon name="check-circle" size={15} />
                <span>Finalizar e Enviar Cadastro</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
