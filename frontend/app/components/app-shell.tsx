"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navigation = [
  { href: "/tickets", label: "Caixa de entrada", icon: "▤" },
  { href: "/dashboard", label: "Visão geral", icon: "◫" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen md:flex">
      <aside className="flex shrink-0 flex-col bg-[#182522] text-white md:sticky md:top-0 md:h-screen md:w-[248px]">
        <div className="flex items-center gap-3 px-5 py-5 md:px-7 md:py-8">
          <div className="grid size-10 place-items-center rounded-xl bg-[#d9eee6] text-lg font-bold text-[#1b7162]">m</div>
          <div>
            <p className="text-[15px] font-semibold tracking-tight">mini inbox</p>
            <p className="mt-0.5 text-[11px] text-white/50">Atendimento ao cliente</p>
          </div>
        </div>

        <p className="px-7 pb-3 pt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Workspace</p>
        <nav aria-label="Navegação principal" className="flex gap-1 px-3 pb-4 md:flex-col md:px-4">
          {navigation.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 flex-1 items-center gap-3 rounded-lg px-3 text-[13px] font-medium md:flex-none ${active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
              >
                <span aria-hidden="true" className={`grid size-7 place-items-center rounded-md text-base ${active ? "bg-[#d9eee6] text-[#1b7162]" : "text-white/55"}`}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden border-t border-white/10 p-5 md:block">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
            <div className="grid size-9 place-items-center rounded-full bg-[#d9eee6] text-xs font-semibold text-[#1b7162]">MI</div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">Mini Inbox</p>
              <p className="mt-0.5 text-[10px] text-white/45">Workspace local</p>
            </div>
            <span className="ml-auto size-2 rounded-full bg-emerald-400" aria-label="Aplicação local" />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-[1240px]">{children}</div>
      </main>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = { open: "Aberto", in_progress: "Em andamento", closed: "Fechado" };
  const styles: Record<string, string> = {
    open: "bg-amber-50 text-amber-700 ring-amber-200/80",
    in_progress: "bg-sky-50 text-sky-700 ring-sky-200/80",
    closed: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${styles[status] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}><span className="size-1.5 rounded-full bg-current" />{labels[status] ?? status}</span>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const labels: Record<string, string> = { low: "Baixa", medium: "Média", high: "Alta" };
  const styles: Record<string, string> = {
    low: "bg-slate-100 text-slate-600",
    medium: "bg-orange-50 text-orange-700",
    high: "bg-rose-50 text-rose-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${styles[priority] ?? "bg-slate-100 text-slate-600"}`}>{labels[priority] ?? priority}</span>;
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1b7162]">{eyebrow}</p>
        <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-[#1b2824] sm:text-[32px]">{title}</h1>
        <p className="mt-1.5 text-[13px] text-[#78827d]">{description}</p>
      </div>
      {action}
    </header>
  );
}
