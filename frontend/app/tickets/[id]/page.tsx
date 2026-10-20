"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell, PageHeading, PriorityBadge, StatusBadge } from "../../components/app-shell";

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
        if (!response.ok) throw new Error("Ticket não encontrado.");
        return response.json();
      })
      .then((data: Ticket) => {
        setTicket(data);
        setStatus(data.status);
        setPriority(data.priority);
      })
      .catch(() => setError("Não foi possível carregar este ticket. Verifique se a API está em execução."))
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
      if (!response.ok) throw new Error("Não foi possível salvar a alteração.");
      const updatedTicket: Ticket = await response.json();
      setTicket(updatedTicket);
      setStatus(updatedTicket.status);
      setPriority(updatedTicket.priority);
      setMessage("Alteração salva com sucesso.");
    } catch {
      setError("Não foi possível salvar. Confira se a API está rodando.");
    } finally {
      setSaving(false);
    }
  }

  const formattedDate = ticket
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date(ticket.created_at))
    : "";

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/tickets" className="inline-flex items-center gap-2 text-[12px] font-medium text-[#66736b] hover:text-[#1b7162]"><span aria-hidden="true">←</span> Voltar para caixa de entrada</Link>
        {ticket && <span className="font-mono text-[11px] text-[#99a39d]">#{String(ticket.id).padStart(4, "0")}</span>}
      </div>

      {loading && <div className="space-y-4" aria-live="polite"><div className="h-32 animate-pulse rounded-2xl bg-white" /><div className="h-64 animate-pulse rounded-2xl bg-white" /></div>}
      {!loading && !ticket && <div role="alert" className="rounded-2xl border border-rose-100 bg-white p-8 text-center"><div className="mx-auto grid size-12 place-items-center rounded-full bg-rose-50 text-xl text-rose-500">!</div><h1 className="mt-4 text-[16px] font-semibold text-[#29362f]">Ticket indisponível</h1><p className="mx-auto mt-2 max-w-md text-[12px] text-[#7f8b84]">{error || "Não encontramos este ticket."}</p><Link href="/tickets" className="mt-5 inline-flex rounded-lg bg-[#1b7162] px-4 py-2.5 text-[12px] font-medium text-white hover:bg-[#155c50]">Voltar aos tickets</Link></div>}

      {ticket && (
        <>
          <PageHeading eyebrow={`Ticket #${ticket.id}`} title={ticket.subject} description="Detalhes da solicitação e atualização do atendimento." action={<StatusBadge status={ticket.status} />} />
          {error && <div role="alert" className="mb-4 rounded-xl border border-rose-100 bg-rose-50 p-3 text-[12px] text-rose-700">{error}</div>}

          <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <section className="soft-shadow rounded-2xl border border-[#e9ece8] bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between border-b border-[#edf0ec] pb-4"><div><h2 className="text-[13px] font-semibold text-[#29362f]">Mensagem do cliente</h2><p className="mt-1 text-[10px] text-[#9aa39e]">Recebida em {formattedDate}</p></div><span className="rounded-lg bg-[#f4f6f3] px-2.5 py-1.5 text-[10px] capitalize text-[#707d75]">{ticket.channel}</span></div>
                <div className="flex gap-3 pt-5"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e8f1ec] text-[10px] font-semibold text-[#4e7665]">{ticket.customer_name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><div><p className="text-[12px] font-semibold text-[#37443d]">{ticket.customer_name}</p><p className="mt-3 whitespace-pre-line text-[13px] leading-6 text-[#68756d]">{ticket.description}</p></div></div>
              </section>

              <section className="soft-shadow rounded-2xl border border-[#e9ece8] bg-white p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3"><div><h2 className="text-[13px] font-semibold text-[#29362f]">Atualizar ticket</h2><p className="mt-1 text-[10px] text-[#929c96]">As alterações são salvas imediatamente.</p></div><PriorityBadge priority={ticket.priority} /></div>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#edf0ec] bg-[#fcfdfb] p-4">
                    <label htmlFor="status" className="text-[11px] font-semibold text-[#58655e]">Status</label>
                    <select id="status" value={status} onChange={(event) => setStatus(event.target.value as Ticket["status"])} className="mt-2 h-10 w-full rounded-lg border border-[#e4e9e4] bg-white px-3 text-[12px] text-[#35433b] focus:border-[#75a99d] focus:outline-none">
                      <option value="open">Aberto</option><option value="in_progress">Em andamento</option><option value="closed">Fechado</option>
                    </select>
                    <button onClick={() => saveChange({ status })} disabled={saving || status === ticket.status} className="mt-3 h-9 w-full rounded-lg bg-[#1b7162] px-3 text-[11px] font-semibold text-white hover:bg-[#155c50] disabled:cursor-not-allowed disabled:bg-[#dce6e1] disabled:text-[#83938b]">{saving ? "Salvando…" : "Salvar status"}</button>
                  </div>
                  <div className="rounded-xl border border-[#edf0ec] bg-[#fcfdfb] p-4">
                    <label htmlFor="priority" className="text-[11px] font-semibold text-[#58655e]">Prioridade</label>
                    <select id="priority" value={priority} onChange={(event) => setPriority(event.target.value as Ticket["priority"])} className="mt-2 h-10 w-full rounded-lg border border-[#e4e9e4] bg-white px-3 text-[12px] text-[#35433b] focus:border-[#75a99d] focus:outline-none">
                      <option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option>
                    </select>
                    <button onClick={() => saveChange({ priority })} disabled={saving || priority === ticket.priority} className="mt-3 h-9 w-full rounded-lg bg-[#1b7162] px-3 text-[11px] font-semibold text-white hover:bg-[#155c50] disabled:cursor-not-allowed disabled:bg-[#dce6e1] disabled:text-[#83938b]">{saving ? "Salvando…" : "Salvar prioridade"}</button>
                  </div>
                </div>
                {message && <p role="status" className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-700">✓ {message}</p>}
              </section>
            </div>

            <aside className="soft-shadow rounded-2xl border border-[#e9ece8] bg-white p-5">
              <h2 className="text-[13px] font-semibold text-[#29362f]">Informações do ticket</h2>
              <dl className="mt-4 divide-y divide-[#edf0ec]">
                <div className="py-3"><dt className="text-[10px] text-[#98a19b]">Cliente</dt><dd className="mt-1 text-[12px] font-medium text-[#45524b]">{ticket.customer_name}</dd></div>
                <div className="py-3"><dt className="text-[10px] text-[#98a19b]">Canal</dt><dd className="mt-1 text-[12px] font-medium capitalize text-[#45524b]">{ticket.channel}</dd></div>
                <div className="py-3"><dt className="text-[10px] text-[#98a19b]">Criado em</dt><dd className="mt-1 text-[12px] font-medium text-[#45524b]">{formattedDate}</dd></div>
                <div className="py-3"><dt className="text-[10px] text-[#98a19b]">Status atual</dt><dd className="mt-2"><StatusBadge status={ticket.status} /></dd></div>
                <div className="py-3"><dt className="text-[10px] text-[#98a19b]">Prioridade atual</dt><dd className="mt-2"><PriorityBadge priority={ticket.priority} /></dd></div>
              </dl>
            </aside>
          </div>
        </>
      )}
    </AppShell>
  );
}

export default function TicketDetailPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#f5f6f3] p-10 text-sm text-[#78827d]">Carregando ticket…</main>}><TicketDetailContent /></Suspense>;
}
