# app/agent_chain.py
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from .llm_agent import get_llm
from .db_utils import get_sql_database
import os

def create_sql_chain() -> LLMChain:
    """
    Loads the prompt template and creates the SQL generation chain.
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
        input_variables=["input", "table_info"],
        template=template.replace("{table_info}", db.get_table_info()),
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