import { ArrowRight, ShieldCheck, Zap, Users as UsersIcon } from "lucide-react";
import { PrimaryButton } from "@/components/ui-wrappers";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left Panel - Branding */}
      <div className="flex-1 relative hidden md:flex flex-col justify-between p-12 bg-primary/5 border-r border-border overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[80px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent/10 blur-[100px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 font-display font-bold text-2xl text-primary">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            NexusAI
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <h1 className="text-5xl lg:text-6xl font-display font-bold text-foreground leading-[1.1] mb-6 tracking-tight">
            Intelligent <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              User Management
            </span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-12 max-w-md">
            Streamline your administrative workflows with our AI-powered control center. Manage roles, audit logs, and users securely.
          </p>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Secure Roles</h3>
                <p className="text-sm text-muted-foreground mt-1">Granular permissions</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 rounded-lg bg-accent/10 text-accent">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Audit Trails</h3>
                <p className="text-sm text-muted-foreground mt-1">Track every action</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-muted-foreground">
          © {new Date().getFullYear()} NexusAI Technologies.
        </div>
      </div>

      {/* Right Panel - Auth */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background relative">
        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="text-center">
            <div className="md:hidden flex items-center justify-center gap-3 font-display font-bold text-2xl text-primary mb-8">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              NexusAI
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground tracking-tight">Welcome back</h2>
            <p className="mt-3 text-muted-foreground">
              Sign in to access your administrative dashboard.
            </p>
          </div>

          <div className="bg-card p-8 rounded-3xl border border-border/50 shadow-xl shadow-black/5">
            <PrimaryButton 
              onClick={handleLogin}
              className="w-full text-lg h-14"
            >
              Continue with Replit <ArrowRight className="ml-2 h-5 w-5" />
            </PrimaryButton>
            
            <p className="mt-6 text-center text-sm text-muted-foreground">
              By logging in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
