import { AuthShell } from "@/components/auth-shell";

export const metadata = {
  title: "Criar conta",
  description: "Crie sua conta do cvopencode e comece pelo caminho gratuito.",
};

export default function CriarContaPage() {
  return (
    <AuthShell
      title="Criar conta"
      description="O cadastro vai criar seu usuário, uma organização pessoal e o acesso ao studio. Ainda não está ativo."
    />
  );
}
