import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { AdminNav } from "@/components/AdminNav";
import { LockIcon } from "@/components/icons";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh" }}>
      <header className="ls-header">
        <Link href="/" className="ls-header-logo">
          🍋 LemonSEO
        </Link>
        <span className="ls-header-site">
          <LockIcon size={13} style={{ verticalAlign: "-2px", marginRight: ".3rem" }} />
          Admin
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: ".6rem" }}>
          <ThemeToggle />
          <AdminLogoutButton />
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <AdminNav />
        {children}
      </main>
    </div>
  );
}
