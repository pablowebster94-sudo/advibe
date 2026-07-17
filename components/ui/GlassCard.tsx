import type { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
};

export default function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_40px_120px_-80px_rgba(0,212,255,0.35)] backdrop-blur-3xl ${className}`}
    >
      {children}
    </div>
  );
}
