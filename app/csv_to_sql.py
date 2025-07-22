import pandas as pd
from sqlalchemy import create_engine, text
import os


DB_PATH = '../data/ecommerce.db'
DATA_DIR = '../data'
AD_CSV_PATH = '../Datasets/Product-Level Ad Sales and Metrics (mapped) - Product-Level Ad Sales and Metrics (mapped).csv'
SALES_CSV_PATH = '../Datasets/Product-Level Total Sales and Metrics (mapped) - Product-Level Total Sales and Metrics (mapped).csv'
ELIG_CSV_PATH = '../Datasets/Product-Level Eligibility Table (mapped) - Product-Level Eligibility Table (mapped).csv'

def clean_column_names(df):
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace('(', '').str.replace(')', '')
    return df

def process_data():
    """
    Loads, cleans, and transforms the CSV data into optimized pandas DataFrames.
    """
    print("Loading data from CSV files...")
    df_ad = pd.read_csv(AD_CSV_PATH)
    df_sales = pd.read_csv(SALES_CSV_PATH)
    df_elig = pd.read_csv(ELIG_CSV_PATH)

    df_ad = clean_column_names(df_ad)
    df_sales = clean_column_names(df_sales)
    df_elig = clean_column_names(df_elig)

    df_ad['date'] = pd.to_datetime(df_ad['date'])
    df_sales['date'] = pd.to_datetime(df_sales['date'])
    df_elig['eligibility_datetime_utc'] = pd.to_datetime(df_elig['eligibility_datetime_utc'])

    print("Processing product eligibility data...")

    df_elig.sort_values('eligibility_datetime_utc', ascending=True, inplace=True)

    df_products = df_elig.drop_duplicates(subset=['item_id'], keep='last').copy()

    df_products = df_products[['item_id', 'eligibility', 'message', 'eligibility_datetime_utc']].rename(columns={'eligibility_datetime_utc': 'last_updated_utc'})
    df_products.set_index('item_id', inplace=True)

    print("Merging ad metrics and total sales data...")
    df_metrics = pd.merge(
        df_ad,
        df_sales,
        on=['date', 'item_id'],
        how='outer'
    )

    metric_cols = [
        'ad_sales', 'impressions', 'ad_spend', 'clicks', 'units_sold',
        'total_sales', 'total_units_ordered'
    ]
    for col in metric_cols:
        if col in df_metrics.columns:
            df_metrics[col] = df_metrics[col].fillna(0)

    int_cols = ['impressions', 'clicks', 'units_sold', 'total_units_ordered']
    for col in int_cols:
         if col in df_metrics.columns:
            df_metrics[col] = df_metrics[col].astype('Int64')


    print("Data processing complete.")
    return df_products, df_metrics

def create_database(engine, df_products, df_metrics):
    """
    Creates the database schema, loads data, and sets up primary keys and indexes.
    """
    print(f"Creating database at {DB_PATH}...")
    
    df_products.to_sql('products', con=engine, if_exists='replace', index=True, index_label='item_id')
    
    df_metrics.to_sql('daily_metrics', con=engine, if_exists='replace', index=False)

    print("Data loaded. Creating primary keys and indexes...")
    with engine.connect() as conn:
        conn.execute(text('BEGIN TRANSACTION;'))
        try:
            conn.execute(text('CREATE TABLE daily_metrics_new AS SELECT * FROM daily_metrics;'))
            conn.execute(text('DROP TABLE daily_metrics;'))
            conn.execute(text('''
                CREATE TABLE daily_metrics (
                    date TEXT,
                    item_id INTEGER,
                    ad_sales REAL,
                    impressions INTEGER,
                    ad_spend REAL,
                    clicks INTEGER,
                    units_sold INTEGER,
                    total_sales REAL,
                    total_units_ordered INTEGER,
                    PRIMARY KEY (date, item_id),
                    FOREIGN KEY (item_id) REFERENCES products(item_id)
                );
            '''))
            conn.execute(text('INSERT INTO daily_metrics SELECT * FROM daily_metrics_new;'))
            conn.execute(text('DROP TABLE daily_metrics_new;'))

            conn.execute(text('CREATE INDEX IF NOT EXISTS idx_metrics_item_id ON daily_metrics(item_id);'))
            conn.execute(text('CREATE INDEX IF NOT EXISTS idx_metrics_date ON daily_metrics(date);'))
            conn.execute(text('COMMIT;'))
        except:
            conn.execute(text('ROLLBACK;'))
            raise

    print("Optimizing database file...")
    raw_conn = engine.raw_connection()
    try:
        cursor = raw_conn.cursor()
        cursor.execute("VACUUM;")
    finally:
        raw_conn.close()
    
    print("Database schema and indexes created successfully.")

def main():
    """Main function to run the ETL process."""
    os.makedirs(DATA_DIR, exist_ok=True)
    
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    engine = create_engine(f'sqlite:///{DB_PATH}')
    
    df_products, df_metrics = process_data()
    create_database(engine, df_products, df_metrics)
    
    print("\nETL process finished successfully!")
    print(f"Database created at: {DB_PATH}")

if __name__ == '__main__':
    main()