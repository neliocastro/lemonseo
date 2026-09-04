"use client";

import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className="lt-btn lt-btn-ghost" style={{ padding: ".5rem 1rem", fontSize: ".82rem" }}>
      Sair
    </button>
  );
}
