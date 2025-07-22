# FILE: ./app/agent_chain.py
# UPDATED WITH A MORE ROBUST SQL CLEANING FUNCTION

from app.db_utils import validate_sql, safe_execute_sql, get_sql_database
from app.llm_agent import explain_data, get_llm
from app.plot_utils import generate_plot_if_needed

from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
import os

# --- 1. Get the Database and LLM objects ---
db = get_sql_database()
llm = get_llm()

# --- 2. Load the Enhanced Prompt from the text file ---
try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_file_path = os.path.join(current_dir, "prompt_template.txt")

    with open(prompt_file_path, "r") as f:
        ENHANCED_PROMPT_TEMPLATE = f.read()
except FileNotFoundError:
    print("FATAL ERROR: prompt_template.txt not found.")
    exit()

prompt = PromptTemplate(
    input_variables=["input", "table_info"],
    template=ENHANCED_PROMPT_TEMPLATE,
)

# --- 3. Create a dedicated SQL Generation Chain ---
sql_generation_chain = LLMChain(llm=llm, prompt=prompt, verbose=True)


def clean_generated_sql(raw: str) -> str:
    """
    More robustly cleans the raw output from the LLM.
    1. Removes markdown fences.
    2. Isolates the first SQL statement by splitting on the semicolon.
    """
    cleaned = raw.strip().removeprefix("```sql").removesuffix("```").strip()
    # Find the first SQL statement and discard any junk after it.
    return cleaned.split(';')[0] + ';'


def run_secure_query(user_question: str):
    """
    The main orchestration function.
    """
    generation_result = sql_generation_chain.invoke({
        "input": user_question,
        "table_info": db.get_table_info()
    })

    raw_sql = generation_result['text']
    generated_sql = clean_generated_sql(raw_sql)

    if not validate_sql(generated_sql):
        return {
            "error": "⚠️ Unsafe or unsupported SQL query was generated.",
            "generated_sql": generated_sql
        }

    try:
        data = safe_execute_sql(generated_sql)
    except Exception as e:
        return {
            "error": f"❌ SQL execution failed: {str(e)}",
            "generated_sql": generated_sql
        }

    explanation = explain_data(data, user_question)
    plot_path = generate_plot_if_needed(data, user_question)

    return {
        "question": user_question,
        "generated_sql": generated_sql,
        "result": data,
        "explanation": explanation,
        "plot_path": plot_path
    }