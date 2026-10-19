import RedefinirSenhaForm from "./reset-password-form";
export default async function RedefinirSenhaPage({ searchParams }: { searchParams: Promise<{ email?: string; token?: string }> }) {
  const params = await searchParams;
  return <RedefinirSenhaForm email={typeof params.email === "string" ? params.email : ""} token={typeof params.token === "string" ? params.token : ""} />;
}
