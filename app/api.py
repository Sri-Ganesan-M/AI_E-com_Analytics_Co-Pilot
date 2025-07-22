# api.py
import json
import asyncio
from typing import List, Dict # + Import List and Dict
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from app.db_utils import validate_sql, safe_execute_sql
from app.plot_utils import prepare_chart_data
from app.llm_agent import explain_data_stream
# + Import the new correction chain
from app.agent_chain import create_sql_chain, create_correction_chain, clean_generated_sql

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize chains when the app starts
sql_generation_chain = create_sql_chain()
correction_chain = create_correction_chain() # + Initialize correction chain

class QueryRequest(BaseModel):
    question: str
    # + Add history field to accept conversation from frontend
    history: List[Dict[str, str]] = []

def format_history(history: List[Dict[str, str]]) -> str:
    """Formats history list into a string for the prompt."""
    if not history:
        return "No previous conversation history."
    
    buffer = []
    for turn in history:
        # We only need the previous questions and the AI's explanation.
        # The AI doesn't need to see the data/SQL from previous turns.
        buffer.append(f"Human: {turn.get('question', '')}")
        buffer.append(f"AI: {turn.get('explanation', '')}")
    return "\n".join(buffer)

@app.post("/ask-stream")
async def ask_question_stream(request: QueryRequest):
    """
    Handles a user's question by streaming the analysis steps.
    Includes conversational memory and a self-correction loop.
    """
    async def event_generator():
        generated_sql = ""
        try:
            # Step 1: Format history and generate SQL
            chat_history_str = format_history(request.history)
            generation_result = await sql_generation_chain.ainvoke({
                "input": request.question,
                "chat_history": chat_history_str
            })
            raw_sql = generation_result['text']
            generated_sql = clean_generated_sql(raw_sql)

            # Step 2: Validate the generated SQL
            if not validate_sql(generated_sql):
                raise ValueError("Unsafe or unsupported SQL query was generated.")

            # Step 3: Execute the SQL query
            try:
                data = safe_execute_sql(generated_sql)
            except Exception as e:
                # --- SELF-CORRECTION LOGIC ---
                print(f"Initial SQL failed: {e}. Attempting self-correction.")
                
                # Step 3a: Call the correction chain
                correction_result = await correction_chain.ainvoke({
                    "question": request.question,
                    "faulty_sql": generated_sql,
                    "error_message": str(e)
                })
                corrected_raw_sql = correction_result['text']
                generated_sql = clean_generated_sql(corrected_raw_sql) # Update with corrected SQL
                
                print(f"Generated corrected SQL: {generated_sql}")
                
                # Step 3b: Execute the corrected SQL
                if not validate_sql(generated_sql):
                     raise ValueError("Corrected SQL is unsafe or unsupported.")
                data = safe_execute_sql(generated_sql)
            
            # Step 4: Prepare the initial data payload
            chart_data = prepare_chart_data(data)
            initial_payload = {
                "generated_sql": generated_sql,
                "result": data,
                "chart_data": chart_data
            }
            yield {"event": "initial_data", "data": json.dumps(initial_payload)}
            
            await asyncio.sleep(0.01)

            # Step 5: Stream the LLM explanation for the data
            async for chunk in explain_data_stream(data, request.question):
                if chunk:
                    yield {"event": "text_chunk", "data": chunk}
            
            yield {"event": "end", "data": "Stream finished"}

        except Exception as e:
            error_data = {
                "error": f"An error occurred: {str(e)}",
                "sql": generated_sql # Show the last attempted SQL
            }
            yield {"event": "error", "data": json.dumps(error_data)}

    return EventSourceResponse(event_generator())