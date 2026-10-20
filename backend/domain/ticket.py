from dataclasses import dataclass
from datetime import datetime
from typing import Literal


TicketStatus = Literal["open", "in_progress", "closed"]
TicketPriority = Literal["low", "medium", "high"]


@dataclass(frozen=True)
class Ticket:
    id: int
    created_at: str
    customer_name: str
    channel: str
    subject: str
    description: str
    status: TicketStatus
    priority: TicketPriority

    def triggers_alert_when_updated_to(self, status: str, priority: str) -> bool:
        """Return whether this update crosses an alert threshold."""
        return (
            (status == "closed" and self.status != "closed")
            or (priority == "high" and self.priority != "high")
        )
