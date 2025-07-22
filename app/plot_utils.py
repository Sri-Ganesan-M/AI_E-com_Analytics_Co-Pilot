# app/plot_utils.py
from typing import Dict, Any, List, Optional

def prepare_chart_data(result: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Prepares data in a Chart.js-compatible format.
    This version is updated to be more flexible with data types.
    """
    if not result or len(result) < 2:
        return None

    headers = list(result[0].keys())
    if len(headers) != 2:
        return None

    col1_val, col2_val = result[0][headers[0]], result[0][headers[1]]
    label_header, value_header = None, None


    if isinstance(col1_val, (str, int)) and isinstance(col2_val, (int, float)):
        label_header, value_header = headers[0], headers[1]

    elif isinstance(col2_val, (str, int)) and isinstance(col1_val, (int, float)):
        label_header, value_header = headers[1], headers[0]
    else:

        return None


    labels = [str(row[label_header]) for row in result]
    data_values = [row[value_header] for row in result]
    dataset_label = value_header.replace('_', ' ').title()
    
    # --- Pie Chart Logic ---

    if 2 <= len(labels) <= 8:
        pie_colors = [
            '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e',
            '#e74a3b', '#858796', '#5a5c69', '#f8f9fc'
        ]
        return {
            "type": "pie",
            "data": {
                "labels": labels,
                "datasets": [{
                    "label": dataset_label,
                    "data": data_values,
                    "backgroundColor": pie_colors[:len(labels)],
                    "hoverOffset": 4
                }]
            }
        }

    # --- Line/Bar Chart Logic ---
    chart_type = 'line' if len(labels) > 15 else 'bar'
    
    return {
        "type": chart_type,
        "data": {
            "labels": labels,
            "datasets": [{
                "label": dataset_label,
                "data": data_values,
                "borderColor": '#4e73df',
                "backgroundColor": 'rgba(78, 115, 223, 0.2)',
                "fill": True,
                "tension": 0.1
            }]
        }
    }