"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Ticket = {
  id: number;
  created_at: string;
  customer_name: string;
  channel: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "closed";
  priority: "low" | "medium" | "high";
};

type TicketChange = Partial<Pick<Ticket, "status" | "priority">>;

function TicketDetailContent() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [status, setStatus] = useState<Ticket["status"]>("open");
  const [priority, setPriority] = useState<Ticket["priority"]>("low");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`http://localhost:8000/tickets/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Ticket não encontrado.");
        }
        return response.json();
      })
      .then((data: Ticket) => {
        setTicket(data);
        setStatus(data.status);
        setPriority(data.priority);
      })
      .catch(() => setError("Não foi possível carregar este ticket."))
      .finally(() => setLoading(false));
  }, [id]);

  async function saveChange(change: TicketChange) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`http://localhost:8000/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(change),
      });

      if (!response.ok) {
        throw new Error("Não foi possível salvar a alteração.");
      }

      const updatedTicket: Ticket = await response.json();
      setTicket(updatedTicket);
      setStatus(updatedTicket.status);
      setPriority(updatedTicket.priority);
      setMessage("Alteração salva.");
    } catch {
      setError("Não foi possível salvar. Confira se a API está rodando.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="p-10">Carregando ticket...</main>;
  }

  if (error && !ticket) {
    return <main className="p-10 text-red-700">{error}</main>;
  }

  if (!ticket) {
    return <main className="p-10">Ticket não encontrado.</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/tickets"
          className="font-medium text-blue-700 hover:underline"
        >
          ← Voltar para tickets
        </Link>

        <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Ticket #{ticket.id}</p>
          <h1 className="mt-2 text-2xl font-bold">{ticket.subject}</h1>
          <p className="mt-4 text-slate-700">{ticket.description}</p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-slate-500">Cliente</dt>
              <dd className="font-medium">{ticket.customer_name}</dd>
            </div>

            <div>
              <dt className="text-sm text-slate-500">Canal</dt>
              <dd className="font-medium capitalize">{ticket.channel}</dd>
            </div>

            <div>
              <dt className="text-sm text-slate-500">Criado em</dt>
              <dd className="font-medium">
                {new Date(ticket.created_at).toLocaleString("pt-BR")}
              </dd>
            </div>
          </dl>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="status" className="mb-2 block font-medium">
                Status
              </label>

              <select
                id="status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as Ticket["status"])
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="open">Aberto</option>
                <option value="in_progress">Em andamento</option>
                <option value="closed">Fechado</option>
              </select>

              <button
                onClick={() => saveChange({ status })}
                disabled={saving}
                className="mt-3 rounded-lg bg-blue-700 px-4 py-2 font-medium text-white disabled:opacity-50"
              >
                Salvar status
              </button>
            </div>

            <div>
              <label htmlFor="priority" className="mb-2 block font-medium">
                Prioridade
              </label>

              <select
                id="priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as Ticket["priority"])
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>

              <button
                onClick={() => saveChange({ priority })}
                disabled={saving}
                className="mt-3 rounded-lg bg-blue-700 px-4 py-2 font-medium text-white disabled:opacity-50"
              >
                Salvar prioridade
              </button>
            </div>
          </div>

          {message && <p className="mt-5 text-green-700">{message}</p>}
          {error && <p className="mt-5 text-red-700">{error}</p>}
        </section>
      </div>
    </main>
  );
}

export default function TicketDetailPage() {
  return (
    <Suspense fallback={<main className="p-10">Carregando ticket...</main>}>
      <TicketDetailContent />
    </Suspense>
  );
}