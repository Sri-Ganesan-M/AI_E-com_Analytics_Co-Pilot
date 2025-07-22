from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from .llm_agent import get_llm
from .db_utils import get_sql_database
import os

def create_sql_chain() -> LLMChain:
    """
    Loads the prompt template for SQL generation and creates the chain.
    """
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

    return LLMChain(llm=llm, prompt=prompt, verbose=True)

def create_correction_chain() -> LLMChain:
    """
    Creates a chain that attempts to correct a faulty SQL query given an error message.
    """
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
    return LLMChain(llm=llm, prompt=prompt, verbose=True)


# Add this function to agent_chain.py

def create_router_chain() -> LLMChain:
    """
    Loads the router prompt and creates the classification chain.
    """
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

    return LLMChain(llm=llm, prompt=prompt, verbose=True)


def clean_generated_sql(raw_sql: str) -> str:
    """
    More robustly cleans the raw output from the LLM.
    1. Removes markdown fences.
    2. Isolates the first SQL statement by splitting on the semicolon.
    """
    cleaned = raw_sql.strip().removeprefix("```sql").removesuffix("```").strip()
    return cleaned.split(';')[0] + ';'