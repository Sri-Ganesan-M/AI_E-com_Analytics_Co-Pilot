<h1 align="center">🚀 AI E-commerce Analytics Co-Pilot</h1>

<p align="center">
  <b>Ask natural questions. Get real insights. Instantly.</b><br>
  Conversational Business Intelligence for your E-commerce data.
</p>

<p align="center">
  <a href="https://your-deployment-link.com"><img src="https://img.shields.io/badge/Live-Demo-blue?logo=vercel" alt="Live Demo"></a>
  <img src="https://img.shields.io/badge/Powered%20By-LangChain-blueviolet" alt="LangChain">
  <img src="https://img.shields.io/badge/LLM-Gemini%20%7C%20Phi3-orange" alt="LLM">
  <img src="https://img.shields.io/badge/Database-SQLite-lightgrey" alt="Database">
  <img src="https://img.shields.io/github/license/your-username/your-repo-name" alt="License">
</p>

---

![App Screenshot or GIF Placeholder](https://via.placeholder.com/900x400.png?text=Insert+Demo+GIF+or+Screenshot+Here)

---

## 🌐 Try It Live

Experience the AI E-commerce Co-Pilot in action:  
👉 **[Click here to open the live demo](https://ai-e-com-analytics-co-pilot.vercel.app)**

---

## ✨ What This App Does

**AI E-commerce Analytics Co-Pilot** is your intelligent data assistant. Built for business users and analysts, it lets you ask natural questions like:

> “What was the click-through rate of my top 5 products last week?”

And instantly receive:
- Clean tabular results
- A visual chart
- A plain-English explanation from the AI

All without writing a single SQL query.

This tool brings **real-time insights** to your fingertips by connecting LLMs to your structured e-commerce data.

---

## 🔍 Key Features

### 💬 Natural Language Interface
Ask questions in plain English. The system converts them into SQL, runs the query on your database, and returns rich, interactive results.

### 🧠 AI-Powered Query Engine
Built on **LangChain**, the agent uses either:
- **Google Gemini Pro API** (in production)
- **Phi-3 via Ollama** (locally)

...to generate SQL and explain results clearly.

### 🔄 Intelligent Routing
User input is classified into:
- Queries (generate SQL)
- Casual chat (friendly replies)
- Off-topic input (graceful fallback)

This avoids unnecessary LLM calls and ensures a fast experience.

### 🛠 Self-Healing SQL Generation
If a generated query fails (e.g., bad column name), the agent automatically:
- Analyzes the error
- Fixes the query
- Re-executes it

No need for user retries.

### 📊 Beautiful Visual Output
- Auto-generated bar/line/pie charts using **Chart.js**
- Full data tables with sorting
- Optional CSV export

### 🔐 Security & Reliability
- Only `SELECT` queries allowed — no mutations
- Unsafe SQL is blocked at validation
- Prompt is hard-coded with schema & rules
- Metrics like RoAS use `NULLIF` to avoid crashes

---

## 🧱 Built With

| Layer         | Technologies                                                                 |
| ------------- | ---------------------------------------------------------------------------- |
| **Frontend**  | React, TypeScript, Vite, Chart.js, Bootstrap, Lucide React                   |
| **Backend**   | FastAPI, Python, LangChain, SQLAlchemy, Pandas                               |
| **LLM Options** | Phi-3 via [Ollama](https://ollama.com) (locally), Google Gemini API (deployed) |
| **Database**  | SQLite                                                                        |
| **Deployment**| Render, `.env`-based configuration                                            |

---

## 🛠 Arch Diagram

![App Screenshot or GIF Placeholder](https://via.placeholder.com/900x400.png?text=Insert+Demo+GIF+or+Screenshot+Here)
