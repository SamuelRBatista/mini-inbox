import json
from pathlib import Path

import pandas as pd

ROOT_DIR = Path(__file__).resolve().parents[1]
INPUT_FILE = ROOT_DIR / "data" / "raw" / "customer_support_tickets.csv"
OUTPUT_FILE = ROOT_DIR / "data" / "processed" / "metrics.json"


def main():
    tickets = pd.read_csv(INPUT_FILE)

    tickets["Date of Purchase"] = pd.to_datetime(
        tickets["Date of Purchase"],
        errors="coerce",
    )

    valid_dates = tickets.dropna(subset=["Date of Purchase"]).copy()
    valid_dates["purchase_day"] = valid_dates["Date of Purchase"].dt.strftime(
        "%Y-%m-%d"
    )

    tickets_per_day = (
        valid_dates.groupby("purchase_day")
        .size()
        .rename("count")
        .reset_index()
        .to_dict(orient="records")
    )

    top_ticket_types = (
        tickets["Ticket Type"]
        .dropna()
        .value_counts()
        .head(5)
        .rename_axis("category")
        .reset_index(name="count")
        .to_dict(orient="records")
    )

    metrics = {
        "source": "Customer Support Ticket Dataset - Kaggle",
        "date_field": "Date of Purchase",
        "total_tickets": int(len(tickets)),
        "tickets_per_purchase_day": tickets_per_day,
        "top_ticket_types": top_ticket_types
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(
        json.dumps(metrics, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"Metricas salvas em : {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
