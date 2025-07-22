# app/plot_utils.py
import matplotlib.pyplot as plt
import os
from datetime import datetime

os.makedirs("static", exist_ok=True)  # For saving chart files

def generate_plot_if_needed(result: list[dict], question: str) -> str | None:
    if not result or len(result) < 2:
        return None

    first_row = result[0]
    columns = list(first_row.keys())

    # Check for 2-column pattern like [date, value] or [category, value]
    if len(columns) == 2:
        x_vals = [row[columns[0]] for row in result]
        y_vals = [row[columns[1]] for row in result]

        # Plot
        plt.figure(figsize=(10, 5))
        plt.plot(x_vals, y_vals, marker="o")
        plt.title(question)
        plt.xlabel(columns[0])
        plt.ylabel(columns[1])
        plt.xticks(rotation=45)
        plt.tight_layout()

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        path = f"static/plot_{timestamp}.png"
        plt.savefig(path)
        plt.close()
        return path

    return None