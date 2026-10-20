"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Ticket = {
  id: number;
  created_at: string;
  customer_name: string;
  channel: string;
  subject: string;
  status: string;
  priority: string;
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/tickets")
      .then((response) => {
        if (!response.ok) {
          throw new Error("A API não conseguiu carregar os tickets.");
        }
        return response.json();
      })
      .then((data: Ticket[]) => setTickets(data))
      .catch(() => setError("Não foi possível carregar os tickets. Confira se a API está rodando."))
      .finally(() => setLoading(false));
  }, []);

  const filteredTickets = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return tickets.filter((ticket) =>
      [
        ticket.customer_name,
        ticket.channel,
        ticket.subject,
        ticket.status,
        ticket.priority,
      ].some((value) => value.toLowerCase().includes(searchText)),
    );
  }, [tickets, search]);

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Mini Inbox
            </p>
            <h1 className="mt-2 text-3xl font-bold">Tickets</h1>
            <p className="mt-2 text-slate-600">
              Consulte e encontre tickets de atendimento.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800"
          >
            Ver dashboard
          </Link>
        </header>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <label htmlFor="ticket-search" className="mb-2 block font-medium">
            Buscar tickets
          </label>
          <input
            id="ticket-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome, assunto, canal, status ou prioridade"
            className="mb-6 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
          />

          {loading && <p>Carregando tickets...</p>}
          {error && <p className="text-red-700">{error}</p>}

          {!loading && !error && (
            <>
              <p className="mb-3 text-sm text-slate-600">
                {filteredTickets.length} ticket(s)
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="px-3 py-3">Criado em</th>
                      <th className="px-3 py-3">Cliente</th>
                      <th className="px-3 py-3">Canal</th>
                      <th className="px-3 py-3">Assunto</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Prioridade</th>
                      <th className="px-3 py-3">Detalhe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b border-slate-100">
                        <td className="whitespace-nowrap px-3 py-4">
                          {new Date(ticket.created_at).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-3 py-4">{ticket.customer_name}</td>
                        <td className="px-3 py-4 capitalize">{ticket.channel}</td>
                        <td className="px-3 py-4">{ticket.subject}</td>
                        <td className="px-3 py-4">{ticket.status}</td>
                        <td className="px-3 py-4">{ticket.priority}</td>
                        <td className="px-3 py-4">
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="font-medium text-blue-700 hover:underline"
                          >
                            Abrir
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}