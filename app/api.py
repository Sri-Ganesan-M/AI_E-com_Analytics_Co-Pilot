from fastapi import FastAPI, Request
from pydantic import BaseModel
from app.agent_chain import run_secure_query
from fastapi.middleware.cors import CORSMiddleware
import os
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (e.g., your React app)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (POST, GET, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers
)

# This makes the 'static' folder accessible so the frontend can load plot images.
# os.makedirs("static", exist_ok=True)
# app.mount("/static", StaticFiles(directory="static"), name="static")

class QueryRequest(BaseModel):
    question: str

@app.post("/ask")
async def ask_question(request: QueryRequest):
    response = run_secure_query(request.question)
    return response