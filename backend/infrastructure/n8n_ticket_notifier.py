import json
from urllib.request import Request, urlopen

from domain.ticket import Ticket


class N8nTicketNotifier:
    def __init__(self, webhook_url: str, timeout_seconds: int = 3) -> None:
        self._webhook_url = webhook_url
        self._timeout_seconds = timeout_seconds

    def notify(self, ticket: Ticket) -> None:
        payload = {
            "event": "ticket_updated",
            "ticket_id": ticket.id,
            "status": ticket.status,
            "priority": ticket.priority,
            "customer_name": ticket.customer_name,
            "subject": ticket.subject,
        }
        request = Request(
            self._webhook_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urlopen(request, timeout=self._timeout_seconds) as response:
                print(f"Webhook n8n enviado: HTTP {response.status}")
        except Exception as error:
            # The ticket update remains successful if the optional automation is down.
            print(f"Falha ao chamar webhook n8n: {error}")
