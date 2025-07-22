import pandas as pd
from sqlalchemy import create_engine, text
import os
os.makedirs("data", exist_ok=True)

# === FILE PATHS ===
ad_csv_path = 'Datasets/Product-Level Ad Sales and Metrics (mapped) - Product-Level Ad Sales and Metrics (mapped).csv'
sales_csv_path = 'Datasets/Product-Level Total Sales and Metrics (mapped) - Product-Level Total Sales and Metrics (mapped).csv'
elig_csv_path = 'Datasets/Product-Level Eligibility Table (mapped) - Product-Level Eligibility Table (mapped).csv'

# === CREATE SQLITE ENGINE ===
engine = create_engine('sqlite:///data/ecommerce.db', echo=False)

# === LOAD & CLEAN DATA ===
df_ad = pd.read_csv(ad_csv_path)
df_sales = pd.read_csv(sales_csv_path)
df_elig = pd.read_csv(elig_csv_path)

# Drop rows missing required keys
df_ad.dropna(subset=['item_id', 'date'], inplace=True)
df_sales.dropna(subset=['item_id', 'date'], inplace=True)
df_elig.dropna(subset=['item_id'], inplace=True)

# Optional type casting (SQLite is flexible, but this ensures consistency)
df_ad = df_ad.astype({
    'item_id': 'int64',
    'ad_sales': 'float64',
    'impressions': 'int64',
    'ad_spend': 'float64',
    'clicks': 'int64',
    'units_sold': 'int64'
})

df_sales = df_sales.astype({
    'item_id': 'int64',
    'total_sales': 'float64',
    'total_units_ordered': 'int64'
})

df_elig['item_id'] = df_elig['item_id'].astype('int64')

# === LOAD INTO SQLITE ===
df_ad.to_sql('ad_metrics', con=engine, if_exists='replace', index=False)
df_sales.to_sql('total_sales', con=engine, if_exists='replace', index=False)
df_elig.to_sql('eligibility', con=engine, if_exists='replace', index=False)

# === CREATE INDEXES ===
with engine.connect() as conn:
    index_statements = [
        "CREATE INDEX IF NOT EXISTS idx_ad_metrics_item ON ad_metrics(item_id);",
        "CREATE INDEX IF NOT EXISTS idx_ad_metrics_date_item ON ad_metrics(date, item_id);",
        "CREATE INDEX IF NOT EXISTS idx_total_sales_item ON total_sales(item_id);",
        "CREATE INDEX IF NOT EXISTS idx_total_sales_date_item ON total_sales(date, item_id);",
        "CREATE INDEX IF NOT EXISTS idx_eligibility_item ON eligibility(item_id);",
    ]
    for stmt in index_statements:
        conn.execute(text(stmt))

    conn.execute(text("VACUUM;"))

print("Data loaded, cleaned, indexed, and optimized successfully.")