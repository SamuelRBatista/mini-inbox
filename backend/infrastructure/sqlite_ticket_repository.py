import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterator

from domain.ticket import Ticket


class SQLiteTicketRepository:
    CUSTOMERS = [
        "Ana Souza", "Bruno Lima", "Carla Mendes", "Diego Santos",
        "Elisa Costa", "Felipe Rocha", "Giovana Alves", "Hugo Martins",
        "Isabela Ribeiro", "João Oliveira",
    ]
    SUBJECTS = [
        "Não consigo acessar minha conta", "Cobrança duplicada no cartão",
        "Produto chegou com defeito", "Pedido ainda não foi entregue",
        "Preciso atualizar meu endereço", "Solicitação de reembolso",
        "Dúvida sobre configuração", "Aplicativo fecha sozinho",
        "Quero cancelar meu pedido", "Como altero minha senha?",
    ]
    CHANNELS = ["email", "chat", "phone", "social"]
    STATUSES = ["open", "in_progress", "closed"]
    PRIORITIES = ["low", "medium", "high"]

    def __init__(self, database_path: Path) -> None:
        self._database_path = database_path

    @contextmanager
    def _connect(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(self._database_path)
        connection.row_factory = sqlite3.Row
        try:
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def initialize(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """CREATE TABLE IF NOT EXISTS tickets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    created_at TEXT NOT NULL,
                    customer_name TEXT NOT NULL,
                    channel TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    description TEXT NOT NULL,
                    status TEXT NOT NULL,
                    priority TEXT NOT NULL
                )"""
            )
            count = connection.execute("SELECT COUNT(*) FROM tickets").fetchone()[0]
            if count == 0:
                connection.executemany(
                    """INSERT INTO tickets (
                        created_at, customer_name, channel, subject, description,
                        status, priority
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    self._seed_rows(),
                )

    def list_all(self) -> list[Ticket]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT * FROM tickets ORDER BY created_at DESC"
            ).fetchall()
        return [self._to_ticket(row) for row in rows]

    def get_by_id(self, ticket_id: int) -> Ticket | None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM tickets WHERE id = ?", (ticket_id,)
            ).fetchone()
        return self._to_ticket(row) if row else None

    def update(self, ticket_id: int, changes: dict[str, str]) -> Ticket | None:
        fields = ", ".join(f"{field} = ?" for field in changes)
        values = [*changes.values(), ticket_id]
        with self._connect() as connection:
            cursor = connection.execute(
                f"UPDATE tickets SET {fields} WHERE id = ?", values
            )
            if cursor.rowcount == 0:
                return None
            row = connection.execute(
                "SELECT * FROM tickets WHERE id = ?", (ticket_id,)
            ).fetchone()
        return self._to_ticket(row) if row else None

    def _seed_rows(self) -> list[tuple[str, ...]]:
        now = datetime.now(timezone.utc)
        return [
            (
                (now - timedelta(days=index)).isoformat(),
                self.CUSTOMERS[index % len(self.CUSTOMERS)],
                self.CHANNELS[index % len(self.CHANNELS)],
                self.SUBJECTS[index % len(self.SUBJECTS)],
                f"Mensagem de exemplo sobre: {self.SUBJECTS[index % len(self.SUBJECTS)]}.",
                self.STATUSES[index % len(self.STATUSES)],
                self.PRIORITIES[index % len(self.PRIORITIES)],
            )
            for index in range(20)
        ]

    @staticmethod
    def _to_ticket(row: sqlite3.Row) -> Ticket:
        return Ticket(**dict(row))
