"use client";

import React from "react";
import { 
  AlertCircle, 
  RefreshCw, 
  Settings, 
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface SetupRequiredProps {
  message?: string;
  type?: "expired" | "config";
}

export default function SetupRequired({ message, type = "expired" }: SetupRequiredProps) {
  const router = useRouter();
  const t = useTranslations("AuthForm");

  const isExpired = type === "expired";

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full px-4 animate-in fade-in zoom-in duration-500">
      <div className="relative mb-8">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="p-8 bg-destructive/10 rounded-full ring-1 ring-destructive/20 relative z-10"
        >
          {isExpired ? (
            <ShieldAlert size={64} className="text-destructive" strokeWidth={1.5} />
          ) : (
            <Settings size={64} className="text-destructive" strokeWidth={1.5} />
          )}
        </motion.div>
        
        <div className="absolute -inset-4 bg-destructive/5 blur-3xl rounded-full -z-10 animate-pulse" />
      </div>

      <div className="text-center max-w-md">
        <h2 className="text-3xl font-bold text-foreground tracking-tight mb-4">
          {isExpired ? "Sesi Berakhir" : "Setup Diperlukan"}
        </h2>
        
        <p className="text-muted-foreground text-lg leading-relaxed mb-10">
          {message || "Koneksi ke Google Drive terputus atau tidak valid. Silakan lakukan konfigurasi ulang untuk melanjutkan akses file."}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => router.push("/setup")}
            className="group flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-all font-semibold shadow-lg shadow-primary/25 active:scale-[0.98] w-full sm:w-auto"
          >
            <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
            <span>Buka Halaman Setup</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-secondary text-secondary-foreground rounded-2xl hover:bg-secondary/80 transition-all font-semibold border border-border/50 active:scale-[0.98] w-full sm:w-auto"
          >
            <RefreshCw size={18} />
            <span>Coba Lagi</span>
          </button>
        </div>

        <p className="mt-12 text-xs text-muted-foreground/60 flex items-center justify-center gap-1">
          <AlertCircle size={12} />
          Status Error: <span className="font-mono">{isExpired ? "INVALID_GRANT" : "MISSING_CONFIG"}</span>
        </p>
      </div>
    </div>
  );
}
