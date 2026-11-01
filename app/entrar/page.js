import { AuthForm } from "@/components/auth-form";

export const metadata = {
  title: "Entrar",
  description: "Acesse sua conta do cvopencode.",
};

export default function EntrarPage() {
  return <AuthForm mode="signin" />;
}
