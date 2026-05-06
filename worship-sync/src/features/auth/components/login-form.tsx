"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { TEAM_ROLE_OPTIONS } from "@/lib/team-roles";
import { toastError, toastSuccess } from "@/lib/app-toast";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = signInSchema.extend({
  username: z.string().trim().min(1, "Name is required").max(80),
  rolePriority1: z.string().min(1, "Select primary role"),
  rolePriority2: z.string().optional(),
  rolePriority3: z.string().optional(),
  confirm: z.string().min(6, "Confirm password"),
}).refine((data) => data.password === data.confirm, {
  message: "Passwords do not match",
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
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirm: "",
      rolePriority1: "",
      rolePriority2: "",
      rolePriority3: "",
    },
  });

  const onSignIn = signInForm.handleSubmit(async ({ email, password }) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return toastError(error.message);
    toastSuccess();
    router.push(next.startsWith("/") ? next : "/");
    router.refresh();
  });

  const onSignUp = signUpForm.handleSubmit(async (values) => {
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        data: {
          username: values.username.trim(),
          role_priority_1: values.rolePriority1,
          role_priority_2: values.rolePriority2 || null,
          role_priority_3: values.rolePriority3 || null,
        },
      },
    });
    if (error) return toastError(error.message);
    toastSuccess("Check your inbox to complete signup.");
    setMode("signin");
  });

  const onGoogle = async () => {
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) toastError(error.message);
  };

  return (
    <Card className={cn("border-border/80 shadow-md ring-1 ring-border/50", className)}>
      <CardHeader className="gap-2">
        <CardTitle className="text-xl font-semibold tracking-tight">Ahaba</CardTitle>
        <CardDescription>Sign in to manage setlists, lineup, and sheets.</CardDescription>
        {urlError ? <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">Auth error: {decodeMaybe(urlError)}</p> : null}
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex rounded-lg bg-muted/50 p-1 ring-1 ring-border/60">
          <button type="button" className={cn("flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors", mode === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")} onClick={() => setMode("signin")}>Sign in</button>
          <button type="button" className={cn("flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors", mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")} onClick={() => setMode("signup")}>Sign up</button>
        </div>

        {mode === "signin" ? (
          <form onSubmit={onSignIn} className="flex flex-col gap-4">
            <FieldSet className="gap-3">
              <FieldGroup className="gap-3">
                <Field><FieldLabel>Email</FieldLabel><Input type="email" {...signInForm.register("email")} /><FieldError errors={[signInForm.formState.errors.email]} /></Field>
                <Field><FieldLabel>Password</FieldLabel><Input type="password" {...signInForm.register("password")} /><FieldError errors={[signInForm.formState.errors.password]} /></Field>
              </FieldGroup>
              <Button type="submit" className="w-full" disabled={signInForm.formState.isSubmitting}>{signInForm.formState.isSubmitting ? "Processing..." : "Sign in"}</Button>
            </FieldSet>
          </form>
        ) : (
          <form onSubmit={onSignUp} className="flex flex-col gap-4">
            <FieldSet className="gap-3">
              <FieldGroup className="gap-3">
                <Field><FieldLabel>Name</FieldLabel><Input {...signUpForm.register("username")} /><FieldError errors={[signUpForm.formState.errors.username]} /></Field>
                <Field><FieldLabel>Email</FieldLabel><Input type="email" {...signUpForm.register("email")} /><FieldError errors={[signUpForm.formState.errors.email]} /></Field>
                <Field><FieldLabel>Password</FieldLabel><Input type="password" {...signUpForm.register("password")} /><FieldError errors={[signUpForm.formState.errors.password]} /></Field>
                <Field><FieldLabel>Confirm</FieldLabel><Input type="password" {...signUpForm.register("confirm")} /><FieldError errors={[signUpForm.formState.errors.confirm]} /></Field>
                {["rolePriority1", "rolePriority2", "rolePriority3"].map((key, idx) => (
                  <Field key={key}>
                    <FieldLabel>Role Priority {idx + 1}</FieldLabel>
                    <select className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40" {...signUpForm.register(key as "rolePriority1" | "rolePriority2" | "rolePriority3")}>
                      <option value="">None</option>
                      {TEAM_ROLE_OPTIONS.map((role) => <option key={role.code} value={role.code}>{role.label}</option>)}
                    </select>
                  </Field>
                ))}
              </FieldGroup>
              <Button type="submit" className="w-full" disabled={signUpForm.formState.isSubmitting}>{signUpForm.formState.isSubmitting ? "Processing..." : "Sign up"}</Button>
            </FieldSet>
          </form>
        )}

        <FieldSeparator>or</FieldSeparator>
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" className="w-full gap-2" onClick={onGoogle}><GoogleGlyph className="size-4" /> Continue with Google</Button>
          <FieldDescription>Enable Google provider in Supabase and register /auth/callback.</FieldDescription>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t border-border/60 bg-muted/20 px-4 py-4">
        <p className="text-center text-xs text-muted-foreground">By continuing, you agree to the <Link href="#" className="underline underline-offset-4">terms</Link>.</p>
      </CardFooter>
    </Card>
  );
}

function decodeMaybe(v: string) {
  try { return decodeURIComponent(v); } catch { return v; }
}

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
