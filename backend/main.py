import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Literal
from urllib.request import Request, urlopen

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


PROJECT_DIR = Path(__file__).resolve().parents[1]
DATABASE_PATH = Path(__file__).resolve().parent / "tickets.db"
METRICS_PATH = PROJECT_DIR / "data" / "processed" / "metrics.json"
N8N_WEBHOOK_URL = "http://localhost:5678/webhook/mini-inbox-ticket-event"

app = FastAPI(title="Mini Inbox API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CUSTOMERS = [
    "Ana Souza",
    "Bruno Lima",
    "Carla Mendes",
    "Diego Santos",
    "Elisa Costa",
    "Felipe Rocha",
    "Giovana Alves",
    "Hugo Martins",
    "Isabela Ribeiro",
    "João Oliveira",
]

SUBJECTS = [
    "Não consigo acessar minha conta",
    "Cobrança duplicada no cartão",
    "Produto chegou com defeito",
    "Pedido ainda não foi entregue",
    "Preciso atualizar meu endereço",
    "Solicitação de reembolso",
    "Dúvida sobre configuração",
    "Aplicativo fecha sozinho",
    "Quero cancelar meu pedido",
    "Como altero minha senha?",
]

CHANNELS = ["email", "chat", "phone", "social"]
STATUSES = ["open", "in_progress", "closed"]
PRIORITIES = ["low", "medium", "high"]


class TicketUpdate(BaseModel):
    status: Literal["open", "in_progress", "closed"] | None = None
    priority: Literal["low", "medium", "high"] | None = None


@contextmanager
def connect_to_database():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row

    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def notify_n8n(ticket):
    payload = {
        "event": "ticket_updated",
        "ticket_id": ticket["id"],
        "status": ticket["status"],
        "priority": ticket["priority"],
        "customer_name": ticket["customer_name"],
        "subject": ticket["subject"],
    }

    request = Request(
        N8N_WEBHOOK_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=3) as response:
            print(f"Webhook n8n enviado: HTTP {response.status}")
    except Exception as error:
        print(f"Falha ao chamar webhook n8n: {error}")


def initialize_database():
    with connect_to_database() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                customer_name TEXT NOT NULL,
                channel TEXT NOT NULL,
                subject TEXT NOT NULL,
                description TEXT NOT NULL,
                status TEXT NOT NULL,
                priority TEXT NOT NULL
            )
            """
        )

        ticket_count = connection.execute(
            "SELECT COUNT(*) FROM tickets"
        ).fetchone()[0]

        if ticket_count == 0:
            now = datetime.now(timezone.utc)
            seed_tickets = []

            for index in range(20):
                subject = SUBJECTS[index % len(SUBJECTS)]
                seed_tickets.append(
                    (
                        (now - timedelta(days=index)).isoformat(),
                        CUSTOMERS[index % len(CUSTOMERS)],
                        CHANNELS[index % len(CHANNELS)],
                        subject,
                        f"Mensagem de exemplo sobre: {subject}.",
                        STATUSES[index % len(STATUSES)],
                        PRIORITIES[index % len(PRIORITIES)],
                    )
                )

            connection.executemany(
                """
                INSERT INTO tickets (
                    created_at,
                    customer_name,
                    channel,
                    subject,
                    description,
                    status,
                    priority
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                seed_tickets,
            )


initialize_database()


@app.get("/tickets")
def list_tickets():
    with connect_to_database() as connection:
        rows = connection.execute(
            "SELECT * FROM tickets ORDER BY created_at DESC"
        ).fetchall()

    return [dict(row) for row in rows]


@app.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: int):
    with connect_to_database() as connection:
        row = connection.execute(
            "SELECT * FROM tickets WHERE id = ?",
            (ticket_id,),
        ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Ticket não encontrado",
        )

    return dict(row)


@app.patch("/tickets/{ticket_id}")
def update_ticket(ticket_id: int, update: TicketUpdate):
    changes = update.model_dump(exclude_unset=True, exclude_none=True)

    if not changes:
        raise HTTPException(
            status_code=400,
            detail="Informe status ou priority para alterar",
        )

    fields = ", ".join(f"{field} = ?" for field in changes)
    values = list(changes.values()) + [ticket_id]

    with connect_to_database() as connection:
        current_row = connection.execute(
            "SELECT * FROM tickets WHERE id = ?",
            (ticket_id,),
        ).fetchone()

        if current_row is None:
            raise HTTPException(
                status_code=404,
                detail="Ticket não encontrado",
            )

        current_ticket = dict(current_row)

        connection.execute(
            f"UPDATE tickets SET {fields} WHERE id = ?",
            values,
        )

        updated_row = connection.execute(
            "SELECT * FROM tickets WHERE id = ?",
            (ticket_id,),
        ).fetchone()

    updated_ticket = dict(updated_row)

    became_closed = (
        changes.get("status") == "closed"
        and current_ticket["status"] != "closed"
    )
    became_high_priority = (
        changes.get("priority") == "high"
        and current_ticket["priority"] != "high"
    )

    if became_closed or became_high_priority:
        notify_n8n(updated_ticket)

    return updated_ticket


@app.get("/metrics")
def get_metrics():
    if not METRICS_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="Arquivo de métricas não encontrado. Execute data/etl.py.",
        )

    return json.loads(METRICS_PATH.read_text(encoding="utf-8"))
