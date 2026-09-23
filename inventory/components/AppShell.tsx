import Link from "next/link";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/purchase", label: "购买" },
  { href: "/consume", label: "消耗" },
  { href: "/receiving", label: "待收货" },
];

export function AppShell({ children, title, eyebrow }: { children: React.ReactNode; title: string; eyebrow: string }) {
  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brandMark" aria-hidden="true">
            □
          </span>
          <span>仓库库存台</span>
        </Link>
        <nav className="nav" aria-label="主导航">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main>
        <section className="pageHead">
          <p>{eyebrow}</p>
          <h1>{title}</h1>
        </section>
        {children}
      </main>
    </div>
  );
}
