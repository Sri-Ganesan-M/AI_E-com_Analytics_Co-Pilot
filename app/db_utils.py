from langchain_experimental.sql import SQLDatabaseChain
from langchain_community.utilities import SQLDatabase
from app.llm_agent import get_llm
from sqlalchemy import create_engine
import sqlparse
import sqlite3

ALLOWED_KEYWORDS = {"SELECT", "FROM", "WHERE", "AND", "OR", "GROUP", "BY", "ORDER", "LIMIT", "JOIN", "ON"}
BLOCKED_KEYWORDS = {"DROP", "DELETE", "UPDATE", "INSERT", "ALTER"}


def get_sql_database(db_path='data/ecommerce.db'):
    return SQLDatabase.from_uri(f"sqlite:///{db_path}")

def get_sql_chain():
    engine = create_engine("sqlite:///data/ecommerce.db")
    db = SQLDatabase(engine)
    llm = get_llm()

    return SQLDatabaseChain.from_llm(
        llm=llm,
        db=db,
        verbose=True,
        return_intermediate_steps=True
    )

def validate_sql(query: str) -> bool:
    parsed = sqlparse.parse(query)[0]
    tokens = [token.value.upper() for token in parsed.tokens if not token.is_whitespace]

    for token in tokens:
        if any(bad in token for bad in BLOCKED_KEYWORDS):
            return False

    if not query.strip().upper().startswith("SELECT"):
        return False

    return True

def safe_execute_sql(query: str, db_path: str = "data/ecommerce.db"):
    if not validate_sql(query):
        raise ValueError("Unsafe or invalid SQL query detected.")

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(query)
        rows = cursor.fetchall()
        col_names = [desc[0] for desc in cursor.description]
        return [dict(zip(col_names, row)) for row in rows]