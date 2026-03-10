import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ActivitySquare, ShieldCheck, Users as UsersIcon, CircleAlert } from "lucide-react";

const authSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().email("Invalid email").optional()
  ),
});

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    shouldUnregister: true,
    defaultValues: {
      username: "",
      password: "",
      email: "",
    },
  });

  if (!isLoading && user) {
    setLocation("/dashboard");
    return null;
  }

  const handleAuthModeToggle = () => {
    setIsLogin((current) => !current);
    setAuthError(null);
    form.clearErrors();
    form.resetField("email", { defaultValue: "" });
  };

  const onSubmit = async (values: z.infer<typeof authSchema>) => {
    setAuthError(null);

    if (!isLogin && !values.email?.trim()) {
      form.setError("email", {
        type: "manual",
        message: "Email is required",
      });
      return;
    }

    try {
      const endpoint = isLogin ? "/api/login" : "/api/register";
      const payload = isLogin
        ? {
            username: values.username.trim(),
            password: values.password,
          }
        : {
            username: values.username.trim(),
            password: values.password,
            email: values.email?.trim(),
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = data?.message || "Authentication failed";

        if (isLogin && res.status === 401) {
          setAuthError("Usuario o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.");
          return;
        }

        throw new Error(message);
      }

      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/10">
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-bold text-xl tracking-tight text-primary">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
              <ActivitySquare className="h-4 w-4 text-white" />
            </div>
            TokaAI
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Enterprise Ready
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight text-foreground">
              Enterprise <span className="text-primary italic">Intelligence</span> at Scale
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
              A comprehensive user management system integrated with distributed JWT authentication and advanced AI agents.
            </p>
          </div>

          <div className="animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
            <Card className="w-full max-w-md mx-auto shadow-2xl border-primary/10">
              <CardHeader>
                <CardTitle className="text-2xl font-display">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
                <CardDescription>
                  {isLogin ? "Enter your credentials to access your workspace" : "Fill in the details to get started"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {authError && (
                      <Alert variant="destructive" className="border-destructive/40 bg-destructive/5">
                        <CircleAlert className="h-4 w-4" />
                        <AlertTitle>Credenciales inválidas</AlertTitle>
                        <AlertDescription>{authError}</AlertDescription>
                      </Alert>
                    )}
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="johndoe"
                              {...field}
                              onChange={(event) => {
                                setAuthError(null);
                                field.onChange(event);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {!isLogin && (
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              onChange={(event) => {
                                setAuthError(null);
                                field.onChange(event);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full h-11" disabled={form.formState.isSubmitting}>
                      {isLogin ? "Sign In" : "Register"}
                    </Button>
                  </form>
                </Form>
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={handleAuthModeToggle}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <section className="py-24 bg-muted/30 border-y border-border/50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-colors duration-300">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3 text-foreground">Secure Auth</h3>
              <p className="text-muted-foreground leading-relaxed">
                Distributed authentication using industry-standard JWT protocols for enterprise security.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-colors duration-300">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <UsersIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3 text-foreground">User Audit</h3>
              <p className="text-muted-foreground leading-relaxed">
                Complete traceability with detailed audit logs for every user action.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-colors duration-300">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <ActivitySquare className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3 text-foreground">AI Intelligence</h3>
              <p className="text-muted-foreground leading-relaxed">
                Native integration with OpenAI agents to automate workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-border/50 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-display font-bold text-lg text-muted-foreground">
            <ActivitySquare className="h-4 w-4" />
            TokaAI
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Toka Technologies.
          </p>
        </div>
      </footer>
    </div>
  );
}
