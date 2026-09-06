import Link from "next/link";
import { GlobeIcon } from "./icons";

export function Header({ site }: { site?: string }) {
  return (
    <header className="ls-header">
      <Link href="/" className="ls-header-logo">
        🍋 LemonSEO
      </Link>
      {site && (
        <span className="ls-header-site">
          <GlobeIcon size={13} style={{ verticalAlign: "-2px", marginRight: ".3rem" }} />
          {site}
        </span>
      )}
    </header>
  );
}
