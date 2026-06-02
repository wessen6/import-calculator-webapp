import Link from "next/link";

const navItems = [
  { href: "/calculations", label: "История" },
  { href: "/calculations/new", label: "Новый" },
  { href: "/settings/rates", label: "Ставки" }
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2 lg:max-w-2xl">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-full px-3 py-2 text-center text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
