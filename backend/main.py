import json
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


PROJECT_DIR = Path(__file__).resolve().parents[1]
DATABASE_PATH = Path(__file__).resolve().parent / "tickets.db"
METRICS_PATH = PROJECT_DIR / "data" / "processed" / "metrics.json"

app = FastAPI(title="Mini Inbox API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CUSTOMERS = [
    "Ana Souza", "Bruno Lima", "Carla Mendes", "Diego Santos",
    "Elisa Costa", "Felipe Rocha", "Giovana Alves", "Hugo Martins",
    "Isabela Ribeiro", "João Oliveira",
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


def connect_to_database():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


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
                    created_at, customer_name, channel, subject,
                    description, status, priority
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                seed_tickets,
            )


initialize_database()


class TicketUpdate(BaseModel):
    status: Literal["open", "in_progress", "closed"] | None = None
    priority: Literal["low", "medium", "high"] | None = None


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
        raise HTTPException(status_code=404, detail="Ticket não encontrado")

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
        cursor = connection.execute(
            f"UPDATE tickets SET {fields} WHERE id = ?",
            values,
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Ticket não encontrado",
            )

        row = connection.execute(
            "SELECT * FROM tickets WHERE id = ?",
            (ticket_id,),
        ).fetchone()

    return dict(row)


@app.get("/metrics")
def get_metrics():
    if not METRICS_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="Arquivo de métricas não encontrado. Execute data/etl.py.",
        )

    return json.loads(METRICS_PATH.read_text(encoding="utf-8"))