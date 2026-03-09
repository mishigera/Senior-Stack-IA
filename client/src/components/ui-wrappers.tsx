import React from "react";
import { cn } from "@/lib/utils";

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-2xl font-bold tracking-tight text-foreground", className)}>{children}</h2>;
}

export function SectionDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-muted-foreground", className)}>{children}</p>;
}

export function PrimaryButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-primary/80 px-6 py-3",
        "text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25",
        "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("glass-card rounded-2xl p-6", className)}>
      {children}
    </div>
  );
}
