"use server";
import { ApiError, backendRequest } from "@/lib/api/server";
import { buildHtmlTemplate, sendTransactionalEmail } from "@/lib/services/integrations/resend";

export async function forgotPasswordAction(email: string): Promise<{ error?: string }> {
  try {
    const res = await backendRequest<{ message?: string; resetUrl?: string }>("/auth/forgot-password", {
      method: "POST",
      body: { email: email.trim().toLowerCase() },
    });

    if (res?.resetUrl) {
      await sendTransactionalEmail({
        to: email.trim().toLowerCase(),
        subject: "Recuperação de Senha — Zeladoria Condomínio",
        html: buildHtmlTemplate({
          title: "Recuperação de Acesso",
          greeting: "Olá,",
          contentHtml: "<p>Recebemos uma solicitação para redefinir a senha da sua conta no Zeladoria Condomínio. Clique no botão abaixo para escolher uma nova senha com segurança:</p>",
          buttonText: "Redefinir Minha Senha",
          buttonUrl: res.resetUrl,
          footerNote: "Se você não solicitou a redefinição de senha, nenhuma ação é necessária; sua conta permanece segura.",
        }),
      }).catch((err) => {
        console.error("[Resend] Erro ao despachar link de recuperação:", err);
      });
    }

    return {};
  } catch (error) {
    return { error: error instanceof ApiError && error.status < 500 ? error.message : "Não foi possível enviar o e-mail. Tente novamente mais tarde." };
  }
}

export async function resetPasswordAction(email: string, token: string, password: string, confirmation: string): Promise<{ error?: string }> {
  try {
    await backendRequest("/auth/reset-password", { method: "POST", body: { email, token, password, password_confirmation: confirmation } });
    return {};
  } catch (error) {
    return { error: error instanceof ApiError && error.status < 500 ? error.message : "Não foi possível alterar a senha. Tente novamente mais tarde." };
  }
}
