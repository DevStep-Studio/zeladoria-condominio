"use server";
import { ApiError, backendRequest } from "@/lib/api/server";

export async function forgotPasswordAction(email: string): Promise<{ error?: string }> {
  try {
    await backendRequest("/auth/forgot-password", { method: "POST", body: { email } });
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
