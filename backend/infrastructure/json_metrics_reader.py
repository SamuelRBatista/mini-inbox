import json
from pathlib import Path
from typing import Any

from fastapi import HTTPException


class JsonMetricsReader:
    def __init__(self, metrics_path: Path) -> None:
        self._metrics_path = metrics_path

    def read(self) -> dict[str, Any]:
        if not self._metrics_path.exists():
            raise HTTPException(
                status_code=404,
                detail="Arquivo de métricas não encontrado. Execute data/etl.py.",
            )
        return json.loads(self._metrics_path.read_text(encoding="utf-8"))
