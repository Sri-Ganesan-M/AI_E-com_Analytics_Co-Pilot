from langchain_community.llms import Ollama
from langchain.chat_models import ChatOpenAI
from typing import List


def get_llm(model_name="phi3", temperature=0):
    return Ollama(model=model_name, temperature=temperature)
def explain_data(result: List[dict], question: str) -> str:
    if not result:
        return "There are no results to explain."

    sample_rows = result[:5]  # show LLM a preview
    llm = get_llm()

    prompt = f"""
You are a helpful assistant that explains database results.

User question: {question}

Sample result rows:
{sample_rows}

Explain what this result likely means in plain English.
"""

    return llm.predict(prompt).strip()