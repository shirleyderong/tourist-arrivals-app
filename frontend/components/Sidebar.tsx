"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGES = [
  { href: "/", label: "Home" },
  { href: "/dataset", label: "1. Dataset" },
  { href: "/clean", label: "2. Clean" },
  { href: "/features", label: "3. Features" },
  { href: "/prepare", label: "4. Prepare" },
  { href: "/train", label: "5. Train" },
  { href: "/evaluate", label: "6. Evaluate" },
  { href: "/explain", label: "7. Explain" },
  { href: "/forecast", label: "8. Forecast" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="sidebar">
      <div className="sidebar-title">Tourist Arrivals</div>
      <ul>
        {PAGES.map((p) => (
          <li key={p.href}>
            <Link href={p.href} className={pathname === p.href ? "active" : ""}>
              {p.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
