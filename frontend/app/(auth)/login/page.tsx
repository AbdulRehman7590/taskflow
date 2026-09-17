import AuthForm from "@/components/auth-form";
import { redirectAuthenticatedUser } from "@/services";

export default async function LoginPage() {
  await redirectAuthenticatedUser();
  return <AuthForm mode="login" />;
}
