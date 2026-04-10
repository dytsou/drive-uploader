"use client";

import React, { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Loader2, EyeOff } from "lucide-react";

export default function SecurityConfig() {
  const {
    hideAuthor,
    localStorageAuthEnabled,
    isConfigLoading,
    fetchAdminConfig,
    setConfig,
    addToast,
    user,
  } = useAppStore();

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    if (hideAuthor === null || localStorageAuthEnabled === null) {
      fetchAdminConfig();
    }
  }, [fetchAdminConfig, hideAuthor, localStorageAuthEnabled, user]);

  if (user?.role !== "ADMIN") return null;

  const handleToggle = async (
    key: "hideAuthor" | "localStorageAuthEnabled",
    value: boolean,
  ) => {
    try {
      await setConfig({ [key]: value });
      addToast({
        message: `Pengaturan ${key} berhasil ${value ? "diaktifkan" : "dinonaktifkan"}.`,
        type: "success",
      });
    } catch {
      addToast({
        message: "Gagal menyimpan pengaturan.",
        type: "error",
      });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">
        Pengaturan Tampilan & Privasi
      </h2>
      <div className="bg-card border rounded-lg p-6 space-y-4 divide-y divide-border">
        <div className="flex items-center justify-between pt-4 first:pt-0">
          <label
            htmlFor="hideAuthor"
            className="flex items-center gap-3 cursor-pointer"
          >
            <EyeOff className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-semibold">Sembunyikan Author</p>
              <p className="text-sm text-muted-foreground">
                Sembunyikan info &quot;Pemilik&quot; dan &quot;Diubah oleh&quot;
                untuk pengguna non-Admin.
              </p>
            </div>
          </label>
          {isConfigLoading ? (
            <Loader2 className="animate-spin text-muted-foreground" />
          ) : (
            <input
              id="hideAuthor"
              type="checkbox"
              checked={hideAuthor || false}
              disabled={isConfigLoading}
              onChange={(e) => handleToggle("hideAuthor", e.target.checked)}
              className="ml-auto h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:opacity-50"
            />
          )}
        </div>
      </div>
    </div>
  );
}
