from application.ports import TicketNotifier, TicketRepository
from domain.ticket import Ticket


class TicketNotFoundError(Exception):
    pass


class TicketService:
    """Coordinates ticket use cases without depending on infrastructure."""

    def __init__(
        self,
        repository: TicketRepository,
        notifier: TicketNotifier,
    ) -> None:
        self._repository = repository
        self._notifier = notifier

    def list_tickets(self) -> list[Ticket]:
        return self._repository.list_all()

    def get_ticket(self, ticket_id: int) -> Ticket:
        ticket = self._repository.get_by_id(ticket_id)
        if ticket is None:
            raise TicketNotFoundError("Ticket não encontrado")
        return ticket

    def update_ticket(self, ticket_id: int, changes: dict[str, str]) -> Ticket:
        current = self.get_ticket(ticket_id)
        updated = self._repository.update(ticket_id, changes)
        if updated is None:
            raise TicketNotFoundError("Ticket não encontrado")

        if current.triggers_alert_when_updated_to(updated.status, updated.priority):
            self._notifier.notify(updated)
        return updated
