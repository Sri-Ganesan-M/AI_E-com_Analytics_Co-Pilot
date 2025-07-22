# api.py
import json
import asyncio
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from app.db_utils import validate_sql, safe_execute_sql
from app.plot_utils import prepare_chart_data
from app.llm_agent import explain_data_stream
from app.agent_chain import create_sql_chain, clean_generated_sql

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the SQL generation chain when the app starts
sql_generation_chain = create_sql_chain()

class QueryRequest(BaseModel):
    question: str

@app.post("/ask-stream")
async def ask_question_stream(request: QueryRequest):
    """
    Handles a user's question by streaming the analysis steps:
    1. Sends initial data (SQL results, chart data).
    2. Streams the text explanation.
    3. Sends an end signal.
    """
    async def event_generator():
        try:
            # Step 1: Generate SQL from the user's question
            generation_result = await sql_generation_chain.ainvoke({"input": request.question})
            raw_sql = generation_result['text']
            generated_sql = clean_generated_sql(raw_sql)

            # Step 2: Validate the generated SQL
            if not validate_sql(generated_sql):
                error_data = {"error": "Unsafe or unsupported SQL query was generated.", "sql": generated_sql}
                yield {"event": "error", "data": json.dumps(error_data)}
                return

            # Step 3: Execute the SQL query
            try:
                data = safe_execute_sql(generated_sql)
            except Exception as e:
                error_data = {"error": f"SQL execution failed: {str(e)}", "sql": generated_sql}
                yield {"event": "error", "data": json.dumps(error_data)}
                return

            # Step 4: Prepare the initial data payload (results and chart data)
            chart_data = prepare_chart_data(data)
            initial_payload = {
                "generated_sql": generated_sql,
                "result": data,
                "chart_data": chart_data
            }
            # Yield the first event containing the initial data
            yield {"event": "initial_data", "data": json.dumps(initial_payload)}
            
            await asyncio.sleep(0.01) # A small pause for the frontend to process

            # Step 5: Stream the LLM explanation for the data
            async for chunk in explain_data_stream(data, request.question):
                if chunk: # Ensure we don't send empty chunks
                    yield {"event": "text_chunk", "data": chunk}
            
            # Step 6: Signal that the stream has finished
            yield {"event": "end", "data": "Stream finished"}

        except Exception as e:
            # Catch any other unexpected errors during the process
            error_data = {"error": f"An unexpected server error occurred: {str(e)}"}
            yield {"event": "error", "data": json.dumps(error_data)}

    return EventSourceResponse(event_generator())