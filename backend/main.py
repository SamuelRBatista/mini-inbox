from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.schemas import TicketUpdateRequest
from application.ticket_service import TicketNotFoundError, TicketService
from domain.ticket import Ticket
from infrastructure.json_metrics_reader import JsonMetricsReader
from infrastructure.n8n_ticket_notifier import N8nTicketNotifier
from infrastructure.sqlite_ticket_repository import SQLiteTicketRepository


BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent
N8N_WEBHOOK_URL = "http://localhost:5678/webhook/mini-inbox-ticket-event"

ticket_repository = SQLiteTicketRepository(BACKEND_DIR / "tickets.db")
ticket_notifier = N8nTicketNotifier(N8N_WEBHOOK_URL)
ticket_service = TicketService(ticket_repository, ticket_notifier)
metrics_reader = JsonMetricsReader(PROJECT_DIR / "data" / "processed" / "metrics.json")


@asynccontextmanager
async def lifespan(_: FastAPI):
    ticket_repository.initialize()
    yield


app = FastAPI(title="Mini Inbox API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ticket_response(ticket: Ticket) -> dict[str, Any]:
    return {
        "id": ticket.id,
        "created_at": ticket.created_at,
        "customer_name": ticket.customer_name,
        "channel": ticket.channel,
        "subject": ticket.subject,
        "description": ticket.description,
        "status": ticket.status,
        "priority": ticket.priority,
    }


def get_ticket_or_404(ticket_id: int) -> Ticket:
    try:
        return ticket_service.get_ticket(ticket_id)
    except TicketNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@app.get("/tickets")
def list_tickets() -> list[dict[str, Any]]:
    return [ticket_response(ticket) for ticket in ticket_service.list_tickets()]


@app.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: int) -> dict[str, Any]:
    return ticket_response(get_ticket_or_404(ticket_id))


@app.patch("/tickets/{ticket_id}")
def update_ticket(ticket_id: int, update: TicketUpdateRequest) -> dict[str, Any]:
    changes = update.model_dump(exclude_unset=True, exclude_none=True)
    if not changes:
        raise HTTPException(
            status_code=400,
            detail="Informe status ou priority para alterar",
        )
    try:
        ticket = ticket_service.update_ticket(ticket_id, changes)
    except TicketNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return ticket_response(ticket)


@app.get("/metrics")
def get_metrics() -> dict[str, Any]:
    return metrics_reader.read()
