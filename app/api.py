from fastapi import FastAPI, Request
from pydantic import BaseModel
from app.agent_chain import run_secure_query

app = FastAPI()

class QueryRequest(BaseModel):
    question: str

@app.post("/ask")
async def ask_question(request: QueryRequest):
    response = run_secure_query(request.question)
    return response