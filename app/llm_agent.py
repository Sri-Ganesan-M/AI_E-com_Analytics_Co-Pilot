# app/llm_agent.py
from langchain_google_genai import ChatGoogleGenerativeAI
from typing import List, Dict, Any, AsyncGenerator
from dotenv import load_dotenv
import os
import re
import asyncio

load_dotenv() 

llm_model = os.getenv("LLM_MODEL_NAME", "gemini-pro") 
llm_temp = float(os.getenv("LLM_TEMPERATURE", 0.1))

def get_llm():
    """
    Initializes and returns the LangChain LLM object for Google Gemini.
    """
    if "GOOGLE_API_KEY" not in os.environ:
        raise ValueError("GOOGLE_API_KEY not found in environment variables. Please set it in your .env file.")
        
    llm = ChatGoogleGenerativeAI(
        model=llm_model,
        temperature=llm_temp,
        convert_system_message_to_human=True 
    )
    return llm

async def explain_data_stream(result: List[Dict[str, Any]], question: str) -> AsyncGenerator[str, None]:
    """
    Generates an explanation based on the user's question (without sending data back)
    and streams it character-by-character for maximum speed and smoothness.
    """
    if not result:
        yield "The query returned no results."
        return

    llm = get_llm()

    # **LATENCY FIX**: We no longer send the 'sample_rows' back to the LLM.
    # The prompt is now much smaller and faster for the model to process.
    prompt = f"""
    A data query has been executed based on the user's question: "{question}"
    
    Concisely explain what the resulting data likely represents. For example, if the user asked for "sales last month", explain that the data shows the daily sales figures for the previous month.
    
    Keep the tone friendly and insightful. Do not repeat the user's question. Just provide a brief analysis.
    """
    
    # Stream the response from the LLM
    async for chunk in llm.astream(prompt):
        if chunk.content:
            # **SMOOTHNESS FIX**: Yield character-by-character with a tiny async sleep
            # to force the network to send each character as a separate event.
            for char in chunk.content:
                yield char
                await asyncio.sleep(0.001)