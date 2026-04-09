import { Routes, Route, Navigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

function PlaceholderHome() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div
        className={cn(
          "w-full max-w-xl rounded-xl border border-border bg-card shadow-sm",
          "p-8 flex flex-col items-center text-center gap-4"
        )}
      >
        <div className="h-12 w-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Talent Management System
        </h1>
        <p className="text-sm text-muted-foreground">
          Module 0 — Project setup complete. React + TypeScript + Vite +
          TailwindCSS + shadcn tokens + lucide-react are wired and ready.
        </p>
        <div className="mt-2 flex gap-3">
          <button className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition">
            Primary
          </button>
          <button className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition">
            Secondary
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PlaceholderHome />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
