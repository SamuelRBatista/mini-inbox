"use client";

import { useEffect, useState } from "react";
import { AppShell, PageHeading } from "../components/app-shell";

type DailyMetric = { purchase_day: string; count: number };
type CategoryMetric = { category: string; count: number };
type Metrics = {
  source: string;
  date_field: string;
  total_tickets: number;
  tickets_per_purchase_day: DailyMetric[];
  top_ticket_types: CategoryMetric[];
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/metrics")
      .then((response) => {
        if (!response.ok) throw new Error("Não foi possível carregar as métricas.");
        return response.json();
      })
      .then((data: Metrics) => setMetrics(data))
      .catch(() => setError("Confira se a API está rodando e se o ETL gerou o arquivo de métricas."));
  }, []);

  const recentDays = metrics?.tickets_per_purchase_day.slice(-10) ?? [];
  const maxDaily = Math.max(...recentDays.map((day) => day.count), 1);
  const maxCategory = Math.max(...(metrics?.top_ticket_types.map((item) => item.count) ?? []), 1);
  const formatDay = (value: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`));

  return (
    <AppShell>
      <PageHeading eyebrow="Visão geral" title="Dashboard" description="Um resumo dos dados de atendimento do seu dataset." />

      {error && <div role="alert" className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-[13px] text-rose-700">{error}</div>}
      {!metrics && !error && <div className="space-y-3" aria-live="polite"><div className="h-28 animate-pulse rounded-2xl bg-white" /><div className="h-72 animate-pulse rounded-2xl bg-white" /></div>}

      {metrics && (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <article className="soft-shadow rounded-2xl border border-[#e9ece8] bg-white p-5">
              <p className="text-[11px] font-medium text-[#87918b]">Tickets no dataset</p>
              <div className="mt-3 flex items-end justify-between"><p className="text-[30px] font-semibold leading-none tracking-[-0.05em] text-[#1b2824]">{metrics.total_tickets.toLocaleString("pt-BR")}</p><span className="grid size-9 place-items-center rounded-xl bg-[#e8f3ee] text-[#1b7162]">▤</span></div>
              <p className="mt-3 text-[10px] text-[#9aa39e]">Registros processados pelo ETL</p>
            </article>
            <article className="soft-shadow rounded-2xl border border-[#e9ece8] bg-white p-5">
              <p className="text-[11px] font-medium text-[#87918b]">Dias com registros</p>
              <div className="mt-3 flex items-end justify-between"><p className="text-[30px] font-semibold leading-none tracking-[-0.05em] text-[#1b2824]">{metrics.tickets_per_purchase_day.length.toLocaleString("pt-BR")}</p><span className="grid size-9 place-items-center rounded-xl bg-[#eef2fa] text-[#566da4]">▦</span></div>
              <p className="mt-3 text-[10px] text-[#9aa39e]">Agrupados por data de compra</p>
            </article>
            <article className="soft-shadow rounded-2xl border border-[#e9ece8] bg-white p-5">
              <p className="text-[11px] font-medium text-[#87918b]">Categorias analisadas</p>
              <div className="mt-3 flex items-end justify-between"><p className="text-[30px] font-semibold leading-none tracking-[-0.05em] text-[#1b2824]">{metrics.top_ticket_types.length}</p><span className="grid size-9 place-items-center rounded-xl bg-[#fff3e8] text-[#b57637]">◌</span></div>
              <p className="mt-3 text-[10px] text-[#9aa39e]">Principais tipos de solicitação</p>
            </article>
          </section>

          <section className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="soft-shadow rounded-2xl border border-[#e9ece8] bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="text-[14px] font-semibold text-[#29362f]">Volume ao longo do tempo</h2><p className="mt-1 text-[11px] text-[#929c96]">Tickets por dia de compra · últimos 10 dias</p></div>
                <span className="rounded-lg bg-[#f5f7f4] px-2.5 py-1.5 text-[10px] text-[#7f8b83]">{metrics.date_field}</span>
              </div>
              <div className="mt-8 flex h-[210px] items-end gap-2 border-b border-[#edf0ec] px-1 sm:gap-3">
                {recentDays.map((day) => {
                  const height = Math.max((day.count / maxDaily) * 100, 5);
                  return <div key={day.purchase_day} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-[9px] font-medium text-[#89958e] opacity-0 transition-opacity group-hover:opacity-100">{day.count}</span>
                    <div className="w-full max-w-8 rounded-t-md bg-[#c5dfd3] transition-colors group-hover:bg-[#4f927b]" style={{ height: `${height}%` }} title={`${day.count} tickets em ${formatDay(day.purchase_day)}`} />
                    <span className="pb-2 text-[8px] text-[#9aa39e] sm:text-[9px]">{formatDay(day.purchase_day)}</span>
                  </div>;
                })}
              </div>
              <p className="mt-3 text-[10px] text-[#a0a9a3]">A data representa a compra, não a abertura do ticket.</p>
            </article>

            <article className="soft-shadow rounded-2xl border border-[#e9ece8] bg-white p-5 sm:p-6">
              <div><h2 className="text-[14px] font-semibold text-[#29362f]">Principais categorias</h2><p className="mt-1 text-[11px] text-[#929c96]">Tipos de solicitação mais frequentes</p></div>
              <div className="mt-6 space-y-5">
                {metrics.top_ticket_types.map((item, index) => (
                  <div key={item.category}>
                    <div className="mb-2 flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><span className="grid size-6 shrink-0 place-items-center rounded-md bg-[#f4f6f3] text-[9px] font-semibold text-[#748079]">0{index + 1}</span><span className="truncate text-[11px] font-medium text-[#56635c]">{item.category}</span></div><span className="shrink-0 text-[10px] font-semibold text-[#55635b]">{item.count.toLocaleString("pt-BR")}</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#f0f3ef]"><div className="h-full rounded-full bg-[#74a995]" style={{ width: `${(item.count / maxCategory) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </article>
          </section>
          <p className="mt-5 text-center text-[10px] text-[#a0a9a3]">Fonte: {metrics.source} · Métricas calculadas com pandas</p>
        </>
      )}
    </AppShell>
  );
}
