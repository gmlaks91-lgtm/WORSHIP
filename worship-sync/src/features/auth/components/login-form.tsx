"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toastError, toastSuccess } from "@/lib/app-toast";
import { z } from "zod";

import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const signInSchema = z.object({
  email: z.string().email("올바른 이메일을 입력하세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
});

const signUpSchema = signInSchema.extend({
  confirm: z.string().min(6, "비밀번호 확인을 입력하세요"),
}).refine((data) => data.password === data.confirm, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirm"],
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

type Mode = "signin" | "signup";

export function LoginForm({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(() => searchParams.get("next") ?? "/", [searchParams]);
  const urlError = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("signin");

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirm: "" },
  });

  const onSignIn = signInForm.handleSubmit(async ({ email, password }) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toastError(error.message);
      return;
    }
    toastSuccess();
    router.push(next.startsWith("/") ? next : "/");
    router.refresh();
  });

  const onSignUp = signUpForm.handleSubmit(async ({ email, password }) => {
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      toastError(error.message);
      return;
    }
    toastSuccess("가입 메일을 확인해 주세요. 승인 후 로그인할 수 있어요.");
    setMode("signin");
  });

  const onGoogle = async () => {
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) toastError(error.message);
  };

  return (
    <Card className={cn("border-border/80 shadow-md ring-1 ring-border/50", className)}>
      <CardHeader className="gap-2">
        <CardTitle className="text-xl font-semibold tracking-tight">WorshipSync</CardTitle>
        <CardDescription>
          팀 계정으로 로그인하면 예습 콘티와 송리스트를 관리할 수 있습니다.
        </CardDescription>
        {urlError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            인증 오류:{" "}
            {(() => {
              try {
                return decodeURIComponent(urlError);
              } catch {
                return urlError;
              }
            })()}
          </p>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex rounded-lg bg-muted/50 p-1 ring-1 ring-border/60">
          <button
            type="button"
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              mode === "signin"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setMode("signin")}
          >
            로그인
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              mode === "signup"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setMode("signup")}
          >
            회원가입
          </button>
        </div>

        {mode === "signin" ? (
          <form onSubmit={onSignIn} className="flex flex-col gap-4">
            <FieldSet className="gap-3">
              <FieldGroup className="gap-3">
                <Field>
                  <FieldLabel htmlFor="email-in">이메일</FieldLabel>
                  <Input
                    id="email-in"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    aria-invalid={!!signInForm.formState.errors.email}
                    {...signInForm.register("email")}
                  />
                  <FieldError errors={[signInForm.formState.errors.email]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password-in">비밀번호</FieldLabel>
                  <Input
                    id="password-in"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={!!signInForm.formState.errors.password}
                    {...signInForm.register("password")}
                  />
                  <FieldError errors={[signInForm.formState.errors.password]} />
                </Field>
              </FieldGroup>
              <Button type="submit" className="w-full" disabled={signInForm.formState.isSubmitting}>
                {signInForm.formState.isSubmitting ? "처리 중…" : "로그인"}
              </Button>
            </FieldSet>
          </form>
        ) : (
          <form onSubmit={onSignUp} className="flex flex-col gap-4">
            <FieldSet className="gap-3">
              <FieldGroup className="gap-3">
                <Field>
                  <FieldLabel htmlFor="email-up">이메일</FieldLabel>
                  <Input
                    id="email-up"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    aria-invalid={!!signUpForm.formState.errors.email}
                    {...signUpForm.register("email")}
                  />
                  <FieldError errors={[signUpForm.formState.errors.email]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password-up">비밀번호</FieldLabel>
                  <Input
                    id="password-up"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!signUpForm.formState.errors.password}
                    {...signUpForm.register("password")}
                  />
                  <FieldError errors={[signUpForm.formState.errors.password]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password-confirm">비밀번호 확인</FieldLabel>
                  <Input
                    id="password-confirm"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!signUpForm.formState.errors.confirm}
                    {...signUpForm.register("confirm")}
                  />
                  <FieldError errors={[signUpForm.formState.errors.confirm]} />
                </Field>
              </FieldGroup>
              <Button type="submit" className="w-full" disabled={signUpForm.formState.isSubmitting}>
                {signUpForm.formState.isSubmitting ? "처리 중…" : "회원가입"}
              </Button>
            </FieldSet>
          </form>
        )}

        <FieldSeparator>또는</FieldSeparator>

        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" className="w-full gap-2" onClick={onGoogle}>
            <GoogleGlyph className="size-4" />
            Google로 계속하기
          </Button>
          <FieldDescription>
            Google 로그인은 Supabase 대시보드에서 Provider를 켠 뒤 Redirect URL에{" "}
            <span className="font-mono text-[11px]">/auth/callback</span>을 등록해야 합니다.
          </FieldDescription>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t border-border/60 bg-muted/20 px-4 py-4">
        <p className="text-center text-xs text-muted-foreground">
          계속하면{" "}
          <Link href="#" className="underline underline-offset-4">
            서비스 이용약관
          </Link>
          에 동의하는 것으로 간주됩니다.
        </p>
      </CardFooter>
    </Card>
  );
}

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
