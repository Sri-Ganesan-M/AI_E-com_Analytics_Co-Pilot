# app/api.py
import json
import asyncio
from typing import List, Dict
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

# This will ignore the LangChain deprecation warnings
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

from app.db_utils import validate_sql, safe_execute_sql
from app.plot_utils import prepare_chart_data
from app.llm_agent import explain_data_stream
from app.agent_chain import create_sql_chain, create_correction_chain, create_router_chain, clean_generated_sql

app = FastAPI()

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")


render_preview_pattern = r"https://your-frontend-name-.*\.onrender\.com"

origins = [
    frontend_url,
    "http://localhost:5173", # For local development
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=render_preview_pattern, # Allow Render's PR preview URLs
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"], # Explicitly allow OPTIONS
    allow_headers=["*"],
)

# Initialize all chains when the app starts
sql_generation_chain = create_sql_chain()
correction_chain = create_correction_chain()
router_chain = create_router_chain()

class QueryRequest(BaseModel):
    question: str
    history: List[Dict[str, str]] = []

def format_history(history: List[Dict[str, str]]) -> str:
    if not history:
        return "No previous conversation history."
    buffer = [f"Human: {turn.get('question', '')}\nAI: {turn.get('explanation', '')}" for turn in history]
    return "\n".join(buffer)

@app.post("/ask-stream")
async def ask_question_stream(request: QueryRequest):
    async def event_generator():
        # --- 1. Router Chain Invocation ---
        print("\n--- 1. ROUTING ---")
        router_input = {"input": request.question}
        print(f"Router Input: {router_input}")
        classification_result = await router_chain.ainvoke(router_input)
        classification = classification_result.content.strip()
        print(f"Router Output: {classification}")
        print("---------------------\n")

        if classification == 'greeting':
            greeting_text = "Hello! I am the AI E-commerce Analyst. I can answer questions about your sales and advertising data. How can I help you?"
            initial_payload = {"generated_sql": "N/A", "result": [], "chart_data": None}
            yield {"event": "initial_data", "data": json.dumps(initial_payload)}
            await asyncio.sleep(0.01)
            yield {"event": "text_chunk", "data": greeting_text}
            yield {"event": "end", "data": "Stream finished"}
            return

        if classification == 'off_topic':
            off_topic_text = "I apologize, but I can only answer questions related to the e-commerce data I have access to. Please ask me about your sales, advertising metrics, or product performance."
            initial_payload = {"generated_sql": "N/A", "result": [], "chart_data": None}
            yield {"event": "initial_data", "data": json.dumps(initial_payload)}
            await asyncio.sleep(0.01)
            yield {"event": "text_chunk", "data": off_topic_text}
            yield {"event": "end", "data": "Stream finished"}
            return

        if classification == 'sql_query':
            generated_sql = ""
            try:
                # --- 2. SQL Generation Chain Invocation ---
                print("\n--- 2. SQL GENERATION ---")
                chat_history_str = format_history(request.history)
                sql_gen_input = { "input": request.question, "chat_history": chat_history_str }
                print(f"SQL Gen Input: {sql_gen_input['input']}")
                generation_result = await sql_generation_chain.ainvoke(sql_gen_input)
                raw_sql = generation_result.content
                print(f"SQL Gen Raw Output:\n{raw_sql}")
                generated_sql = clean_generated_sql(raw_sql)
                print(f"SQL Gen Cleaned Output: {generated_sql}")
                print("-------------------------\n")


                if not validate_sql(generated_sql):
                    raise ValueError("Unsafe or unsupported SQL query was generated.")

                try:
                    data = safe_execute_sql(generated_sql)
                except Exception as e:
                    # --- 3. Correction Chain Invocation ---
                    print("\n--- 3. SQL CORRECTION ---")
                    print(f"Initial SQL failed: {e}. Attempting self-correction.")
                    correction_input = { "question": request.question, "faulty_sql": generated_sql, "error_message": str(e) }
                    print(f"Correction Input: {correction_input}")
                    correction_result = await correction_chain.ainvoke(correction_input)
                    corrected_raw_sql = correction_result.content
                    print(f"Correction Raw Output:\n{corrected_raw_sql}")
                    generated_sql = clean_generated_sql(corrected_raw_sql)
                    print(f"Correction Cleaned Output: {generated_sql}")
                    print("-------------------------\n")
                    
                    if not validate_sql(generated_sql):
                            raise ValueError("Corrected SQL is unsafe or unsupported.")
                    data = safe_execute_sql(generated_sql)
                
                chart_data = prepare_chart_data(data)
                initial_payload = {
                    "generated_sql": generated_sql,
                    "result": data,
                    "chart_data": chart_data
                }
                yield {"event": "initial_data", "data": json.dumps(initial_payload)}
                await asyncio.sleep(0.01)

                # --- 4. Explanation Stream ---
                print("\n--- 4. EXPLANATION STREAM ---")
                async for chunk in explain_data_stream(data, request.question):
                    if chunk:
                        yield {"event": "text_chunk", "data": chunk}
                print("Explanation stream finished.")
                print("---------------------------\n")

                yield {"event": "end", "data": "Stream finished"}

            except Exception as e:
                error_data = {"error": f"An error occurred: {str(e)}", "sql": generated_sql}
                yield {"event": "error", "data": json.dumps(error_data)}
                return
        
        else:
            fallback_text = "I'm sorry, I was unable to process that request. Please try rephrasing your question."
            initial_payload = {"generated_sql": "N/A", "result": [], "chart_data": None}
            yield {"event": "initial_data", "data": json.dumps(initial_payload)}
            yield {"event": "text_chunk", "data": fallback_text}
            yield {"event": "end", "data": "Stream finished"}

    return EventSourceResponse(event_generator())