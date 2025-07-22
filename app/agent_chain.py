# app/agent_chain.py
from langchain.prompts import PromptTemplate
from .llm_agent import get_llm
from .db_utils import get_sql_database
import os
import re

def create_sql_chain():
    db = get_sql_database()
    llm = get_llm()
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        prompt_file_path = os.path.join(current_dir, "prompt_template.txt")
        with open(prompt_file_path, "r") as f:
            template = f.read()
    except FileNotFoundError:
        raise RuntimeError("FATAL ERROR: prompt_template.txt not found.")
    prompt = PromptTemplate(
        input_variables=["input", "chat_history", "table_info"],
        template=template.replace("{table_info}", db.get_table_info()),
    )
    return prompt | llm

def create_correction_chain():
    llm = get_llm()
    correction_template = """
    The user asked the following question: "{question}"
    We tried to answer it with this SQL query:
    ```sql
    {faulty_sql}
    ```
    But the query failed with this error: "{error_message}"
    Your task is to fix the SQL query. Do not apologize or explain.
    Just return a new, corrected SQL query in a single ```sql code block.
    Corrected SQL Query:
    """
    prompt = PromptTemplate(
        input_variables=["question", "faulty_sql", "error_message"],
        template=correction_template,
    )
    return prompt | llm

def create_router_chain():
    llm = get_llm()
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        prompt_file_path = os.path.join(current_dir, "router_prompt_template.txt")
        with open(prompt_file_path, "r") as f:
            template = f.read()
    except FileNotFoundError:
        raise RuntimeError("FATAL ERROR: router_prompt_template.txt not found.")
    prompt = PromptTemplate(
        input_variables=["input"],
        template=template,
    )
    return prompt | llm

def clean_generated_sql(raw_sql: str) -> str:
    """
    An even more aggressive cleaning function to isolate the SQL query.
    It prioritizes finding the 'SELECT' statement directly.
    """
    # First, try to find the SQL markdown block, as it's the most explicit.
    sql_match = re.search(r"```sql(.*?)```", raw_sql, re.DOTALL)
    if sql_match:
        cleaned_sql = sql_match.group(1).strip()
        return cleaned_sql.split(';')[0].strip() + ';'

    # If no markdown block, find the first occurrence of 'SELECT' (case-insensitive).
    # This is a very strong fallback for conversational model outputs.
    search_str = raw_sql.lower()
    select_pos = search_str.find('select')

    if select_pos != -1:
        # Slice the original string from the found position of 'SELECT'.
        cleaned_sql = raw_sql[select_pos:].strip()
        # Ensure only one statement is returned.
        return cleaned_sql.split(';')[0].strip() + ';'

    # If neither method works, the output is likely not a valid query.
    print(f"Warning: Could not extract a valid SQL query from raw output: {raw_sql}")
    return "" # Return empty to trigger validation error cleanly.