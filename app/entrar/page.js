import { AuthShell } from "@/components/auth-shell";

export const metadata = {
  title: "Entrar",
  description: "Acesse sua conta do cvopencode.",
};

export default function EntrarPage() {
  return (
    <AuthShell
      title="Entrar"
      description="A autenticação usa Better Auth com sessão no Neon. Enquanto ela não é publicada, a área da conta fica fechada."
    />
  );
}
