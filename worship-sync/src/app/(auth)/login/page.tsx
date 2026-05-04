import { Suspense } from "react";

import { LoginForm } from "@/features/auth/components/login-form";

function LoginFallback() {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
      로그인 화면을 불러오는 중…
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
