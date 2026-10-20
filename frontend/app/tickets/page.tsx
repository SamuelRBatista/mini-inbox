"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell, PageHeading, PriorityBadge, StatusBadge } from "../components/app-shell";

type Ticket = {
  id: number;
  created_at: string;
  customer_name: string;
  channel: string;
  subject: string;
  status: string;
  priority: string;
};

const filters = [
  { key: "all", label: "Todos" },
  { key: "open", label: "Abertos" },
  { key: "in_progress", label: "Em andamento" },
  { key: "closed", label: "Fechados" },
];

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/tickets")
      .then((response) => {
        if (!response.ok) throw new Error("API indisponível");
        return response.json();
      })
      .then((data: Ticket[]) => setTickets(data))
      .catch(() => setError("Não foi possível carregar os tickets. Verifique se a API está em execução."))
      .finally(() => setLoading(false));
  }, []);

  const filteredTickets = useMemo(() => {
    const query = search.toLowerCase().trim();
    return tickets.filter((ticket) => {
      const matchesText = [ticket.customer_name, ticket.channel, ticket.subject, ticket.status, ticket.priority]
        .some((value) => value.toLowerCase().includes(query));
      return matchesText && (statusFilter === "all" || ticket.status === statusFilter);
    });
  }, [tickets, search, statusFilter]);

  const openCount = tickets.filter((ticket) => ticket.status === "open").length;
  const progressCount = tickets.filter((ticket) => ticket.status === "in_progress").length;
  const highPriorityCount = tickets.filter((ticket) => ticket.priority === "high").length;

  return (
    <AppShell>
      <PageHeading
        eyebrow="Atendimento"
        title="Caixa de entrada"
        description="Acompanhe as conversas e mantenha cada solicitação em movimento."
        action={<div className="flex items-center gap-2 rounded-full border border-[#e4e9e4] bg-white px-3.5 py-2 text-[11px] font-medium text-[#62716a]"><span className="size-2 rounded-full bg-emerald-500" /> Atualizado agora</div>}
      />

      <section aria-label="Resumo dos tickets" className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Tickets abertos", value: openCount, detail: "Aguardando atendimento", tint: "text-amber-700", icon: "○" },
          { label: "Em andamento", value: progressCount, detail: "Sendo acompanhados", tint: "text-sky-700", icon: "↗" },
          { label: "Prioridade alta", value: highPriorityCount, detail: "Precisam de atenção", tint: "text-rose-700", icon: "↑" },
        ].map((item) => (
          <article key={item.label} className="soft-shadow rounded-2xl border border-[#e9ece8] bg-white p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <p className="text-[12px] font-medium text-[#78827d]">{item.label}</p>
              <span className={`grid size-8 place-items-center rounded-lg bg-[#f5f7f4] text-base ${item.tint}`} aria-hidden="true">{item.icon}</span>
            </div>
            <p className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.04em] text-[#1b2824]">{item.value}</p>
            <p className="mt-2 text-[11px] text-[#9aa29e]">{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="soft-shadow overflow-hidden rounded-2xl border border-[#e9ece8] bg-white">
        <div className="border-b border-[#edf0ec] px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-[#26332e]">Todos os tickets <span className="ml-1 rounded-md bg-[#f1f4f1] px-1.5 py-0.5 text-[10px] font-medium text-[#748079]">{filteredTickets.length}</span></h2>
              <p className="mt-1 text-[11px] text-[#929c96]">Pesquise e abra uma conversa para ver os detalhes.</p>
            </div>
            <label className="relative block w-full sm:w-[280px]">
              <span className="sr-only">Buscar tickets</span>
              <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa39e]">⌕</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome ou assunto"
                className="h-10 w-full rounded-lg border border-[#e7ebe7] bg-[#fbfcfa] pl-9 pr-3 text-[12px] text-[#27342f] placeholder:text-[#a3aca7] focus:border-[#75a99d] focus:bg-white focus:outline-none"
              />
            </label>
          </div>
          <div className="mt-4 flex gap-1 overflow-x-auto" role="group" aria-label="Filtrar por status">
            {filters.map((filter) => {
              const selected = statusFilter === filter.key;
              return <button key={filter.key} onClick={() => setStatusFilter(filter.key)} aria-pressed={selected} className={`shrink-0 rounded-lg px-3 py-2 text-[11px] font-medium ${selected ? "bg-[#e8f3ee] text-[#286c5b]" : "text-[#858f89] hover:bg-[#f6f8f5] hover:text-[#45534c]"}`}>{filter.label}</button>;
            })}
          </div>
        </div>

        {loading && <div className="space-y-3 p-6" aria-live="polite"><div className="h-4 w-40 animate-pulse rounded bg-[#edf1ed]" /><div className="h-12 animate-pulse rounded-lg bg-[#f5f7f4]" /><div className="h-12 animate-pulse rounded-lg bg-[#f5f7f4]" /></div>}
        {error && <div role="alert" className="m-5 rounded-xl border border-rose-100 bg-rose-50 p-4 text-[13px] text-rose-700">{error}</div>}

        {!loading && !error && filteredTickets.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f1f5f1] text-xl text-[#74877d]">⌕</div>
            <h3 className="mt-4 text-[14px] font-semibold text-[#314039]">Nenhum ticket encontrado</h3>
            <p className="mt-1 text-[12px] text-[#8b9690]">Tente ajustar a busca ou escolher outro filtro.</p>
          </div>
        )}

        {!loading && !error && filteredTickets.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-[#fafbf9] text-[9px] font-semibold uppercase tracking-[0.11em] text-[#929c96]">
                <tr>
                  <th className="px-6 py-3.5">Cliente</th><th className="px-4 py-3.5">Assunto</th><th className="px-4 py-3.5">Canal</th><th className="px-4 py-3.5">Status</th><th className="px-4 py-3.5">Prioridade</th><th className="px-4 py-3.5">Criado</th><th className="px-5 py-3.5"><span className="sr-only">Abrir ticket</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2ef]">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="group hover:bg-[#fbfcfa]">
                    <td className="px-6 py-3.5"><div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e8f1ec] text-[10px] font-semibold text-[#4e7665]">{initials(ticket.customer_name)}</span><div><p className="text-[12px] font-medium text-[#34413b]">{ticket.customer_name}</p><p className="mt-0.5 text-[10px] text-[#a0a8a3]">Ticket #{ticket.id}</p></div></div></td>
                    <td className="max-w-[270px] px-4 py-3.5"><p className="truncate text-[12px] font-medium text-[#34413b]">{ticket.subject}</p></td>
                    <td className="px-4 py-3.5"><span className="text-[11px] capitalize text-[#76817a]">{ticket.channel}</span></td>
                    <td className="px-4 py-3.5"><StatusBadge status={ticket.status} /></td>
                    <td className="px-4 py-3.5"><PriorityBadge priority={ticket.priority} /></td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[11px] text-[#89938d]">{formatDate(ticket.created_at)}</td>
                    <td className="px-5 py-3.5"><Link href={`/tickets/${ticket.id}`} aria-label={`Abrir ticket de ${ticket.customer_name}`} className="grid size-8 place-items-center rounded-lg text-[#9aa49e] hover:bg-[#e8f3ee] hover:text-[#286c5b]">↗</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && filteredTickets.length > 0 && <div className="border-t border-[#edf0ec] px-6 py-3 text-[10px] text-[#9aa39e]">Exibindo {filteredTickets.length} de {tickets.length} tickets</div>}
      </section>
      <p className="mt-5 text-center text-[10px] text-[#a0a9a3]">Mini Inbox · Central de atendimento</p>
    </AppShell>
  );
}
