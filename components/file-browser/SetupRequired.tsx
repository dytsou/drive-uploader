"use client";

import React from "react";
import {
  AlertCircle,
  RefreshCw,
  Settings,
  ShieldAlert,
  ArrowRight,
  Database,
} from "lucide-react";
import { motion } from "framer-motion";

interface SetupRequiredProps {
  message?: string;
  type?: "expired" | "config";
}

export default function SetupRequired({
  message,
  type = "expired",
}: SetupRequiredProps) {
  const isExpired = type === "expired";

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full px-6 bg-background">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center text-center max-w-[420px]"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-secondary/30 text-muted-foreground">
            {isExpired ? (
              <ShieldAlert size={28} strokeWidth={1.5} />
            ) : (
              <Database size={28} strokeWidth={1.5} />
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3 mb-10">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {isExpired ? "Sesi Berakhir" : "Setup Diperlukan"}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {message ||
              "Koneksi ke Google Drive terputus atau tidak valid. Silakan lakukan konfigurasi ulang untuk melanjutkan akses file Anda."}
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center w-full gap-3 mb-12"
        >
          <button
            onClick={() => (window.location.href = "/setup")}
            className="flex items-center justify-center gap-2 w-full sm:flex-1 h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded-lg transition-colors"
          >
            <Settings size={16} />
            <span>Buka Halaman Setup</span>
            <ArrowRight size={16} className="ml-1" />
          </button>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 w-full sm:flex-1 h-11 px-6 bg-transparent hover:bg-secondary/50 text-foreground border border-border text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            <span>Coba Lagi</span>
          </button>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider"
        >
          <AlertCircle size={12} />
          <span>
            Status Error: {isExpired ? "INVALID_GRANT" : "MISSING_CONFIG"}
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
