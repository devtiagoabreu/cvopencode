import { AuthForm } from "@/components/auth-form";

export const metadata = {
  title: "Criar conta",
  description: "Crie sua conta do cvopencode e comece pelo caminho gratuito.",
};

export default function CriarContaPage() {
  return <AuthForm mode="signup" />;
}
