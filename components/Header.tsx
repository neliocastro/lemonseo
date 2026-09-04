import Link from "next/link";

export function Header({ site }: { site?: string }) {
  return (
    <header className="ls-header">
      <Link href="/" className="ls-header-logo">
        🍋 LemonSEO
      </Link>
      {site && <span className="ls-header-site">🌐 {site}</span>}
    </header>
  );
}
