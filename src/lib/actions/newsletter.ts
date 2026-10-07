"use server";

export async function subscribeNewsletterAction(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
    return { ok: false, error: "Por favor, informe um endereço de e-mail válido." };
  }

  // Registra a inscrição para controle e envio das promoções
  console.log(`[Newsletter] Novo lead cadastrado: ${cleanEmail} em ${new Date().toISOString()}`);

  return {
    ok: true,
    coupon: "PRIMEIRACOMPRA30",
    message: "Inscrição realizada com sucesso! Use o cupom para garantir seu desconto.",
  };
}
