"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DailyMetric = {
  purchase_day: string;
  count: number;
};

type CategoryMetric = {
  category: string;
  count: number;
};

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
        if (!response.ok) {
          throw new Error("Não foi possível carregar as métricas.");
        }
        return response.json();
      })
      .then((data: Metrics) => setMetrics(data))
      .catch(() => setError("Confira se a API está rodando e se o ETL gerou metrics.json."));
  }, []);

  const recentDays = metrics?.tickets_per_purchase_day.slice(-10).reverse() ?? [];

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-8 flex gap-5">
          <Link href="/tickets" className="font-medium text-blue-700 hover:underline">
            Tickets
          </Link>
          <Link href="/dashboard" className="font-medium text-blue-700 hover:underline">
            Dashboard
          </Link>
        </nav>

        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Métricas calculadas com pandas a partir do dataset do Kaggle.
        </p>

        {error && <p className="mt-6 text-red-700">{error}</p>}
        {!metrics && !error && <p className="mt-6">Carregando métricas...</p>}

        {metrics && (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              <article className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Tickets no dataset</p>
                <p className="mt-2 text-3xl font-bold">{metrics.total_tickets}</p>
              </article>
              <article className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Dias com compras registradas</p>
                <p className="mt-2 text-3xl font-bold">
                  {metrics.tickets_per_purchase_day.length}
                </p>
              </article>
              <article className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Campo de data</p>
                <p className="mt-2 font-semibold">{metrics.date_field}</p>
              </article>
            </section>

            <section className="mt-6 grid gap-6 md:grid-cols-2">
              <article className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold">Tipos de ticket mais comuns</h2>
                <ul className="mt-4 divide-y divide-slate-100">
                  {metrics.top_ticket_types.map((item) => (
                    <li
                      key={item.category}
                      className="flex justify-between gap-4 py-3"
                    >
                      <span>{item.category}</span>
                      <span className="font-semibold">{item.count}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold">
                  Tickets por dia de compra (10 dias mais recentes)
                </h2>
                <ul className="mt-4 divide-y divide-slate-100">
                  {recentDays.map((item) => (
                    <li
                      key={item.purchase_day}
                      className="flex justify-between gap-4 py-3"
                    >
                      <span>{item.purchase_day}</span>
                      <span className="font-semibold">{item.count}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </section>

            <p className="mt-6 text-sm text-slate-500">
              Fonte: {metrics.source}. A data representa a compra, não a criação do ticket.
            </p>
          </>
        )}
      </div>
    </main>
  );
}