import AuthForm from "@/components/auth-form";
import { redirectAuthenticatedUser } from "@/services";

export default async function SignupPage() {
  await redirectAuthenticatedUser();
  return <AuthForm mode="signup" />;
}
