import { ArrowRight, ShieldCheck, ActivitySquare, Users as UsersIcon } from "lucide-react";
import { PrimaryButton } from "@/components/ui-wrappers";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/10">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-bold text-xl tracking-tight text-primary">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
              <ActivitySquare className="h-4 w-4 text-white" />
            </div>
            NexusAI
          </div>
          <div className="flex items-center gap-4">
            <a href="/api/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </a>
            <a href="/api/login">
              <PrimaryButton size="sm">Get Started</PrimaryButton>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Now in Public Beta
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight text-foreground">
              Enterprise <span className="text-primary italic">Intelligence</span> at Scale
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
              A comprehensive user management system integrated with distributed OIDC authentication and advanced AI agents. Secure, scalable, and ready for production.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a href="/api/login">
                <PrimaryButton className="h-12 px-8 text-base shadow-xl shadow-primary/20 group">
                  Start Your Workspace
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </PrimaryButton>
              </a>
              <button className="h-12 px-8 rounded-xl border border-border bg-background hover:bg-muted transition-colors text-sm font-semibold">
                View Enterprise Docs
              </button>
            </div>

            <div className="flex items-center gap-8 pt-8">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-muted overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="Avatar" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Trusted by <span className="font-bold text-foreground">500+</span> engineering teams
              </p>
            </div>
          </div>

          <div className="relative group animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-accent/30 rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80" 
                alt="Dashboard Preview"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
            </div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="py-24 bg-muted/30 border-y border-border/50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-colors duration-300">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3 text-foreground">Secure OIDC</h3>
              <p className="text-muted-foreground leading-relaxed">
                Distributed authentication using industry-standard OAuth2 and OIDC protocols for enterprise security.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-colors duration-300">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <UsersIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3 text-foreground">User Audit</h3>
              <p className="text-muted-foreground leading-relaxed">
                Complete traceability with detailed audit logs for every user action and permission change.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-colors duration-300">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                <ActivitySquare className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3 text-foreground">AI Intelligence</h3>
              <p className="text-muted-foreground leading-relaxed">
                Native integration with OpenAI agents to automate workflows and assist team members.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-display font-bold text-lg text-muted-foreground">
            <ActivitySquare className="h-4 w-4" />
            NexusAI
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} NexusAI Technologies. Built for the modern enterprise.
          </p>
          <div className="flex gap-6 text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
