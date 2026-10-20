from pydantic import BaseModel

from domain.ticket import TicketPriority, TicketStatus


class TicketUpdateRequest(BaseModel):
    status: TicketStatus | None = None
    priority: TicketPriority | None = None
