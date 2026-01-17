# SupportWise AI Co-pilot for Support Ticket Analytics (MVP)

An AI-powered analytics and co-pilot for customer support teams, built with:

- Next.js (frontend)
- Supabase (Postgres + pgvector)
- Node.js scripts for data ingestion and processing
- Synthetic Zendesk-like ticket data (no real customer data)

This repository is designed as a portfolio-grade project to demonstrate:

- Data modeling and analytics over ticket data
- Semantic search and vector retrieval (pgvector)
- LLM-based question answering and routing between SQL metrics and semantic evidence
- A clean, extensible frontend architecture for analytics and chat-based exploration

## Overview
SupportWise is a conversational analytics platform designed to help support teams understand and act on ticket data. It combines LLM reasoning, vector semantic search, analytics dashboards, and natural‑language querying.

## Key Features
- Semantic search (pgvector)
- Local embeddings (MiniLM)
- Interactive 3D dashboard (ApexCharts)
- Vega-Lite SSR chart export
- AI co-pilot chat with query routing
- Supabase Postgres backend

## Architecture
UI (Next.js)
  - Dashboard
  - Search
  - Chat

API Layer
  - Query Router
  - Metrics Engine (SQL/RPC)
  - Semantic Engine (pgvector)

Database
  - tickets
  - ticket_embeddings (vector)

LLM (Gemini) for reasoning

## Database Schema
- `tickets` table for raw ticket data
- `ticket_embeddings` containing MiniLM vectors (384 dims)
- RPCs: `match_tickets`, `ticket_volume_daily`, `ticket_by_status`

## AI & Vector Stack
- Local MiniLM (Xenova) embeddings
- pgvector similarity search
- Gemini 2.5 Flash for insight generation and summary reasoning

## Dashboard
- ApexCharts interactive visualizations
- Vega-Lite SVG export
- Metrics: daily volume, status distribution, priority breakdown

## Chat Co-Pilot
- Natural language interface
- Intelligent Query Router
- Gemini-based summaries and recommendations

## Installation
```
npm install
npm run demo:setup
npm run dev
```

## Scripts
- importTickets.mjs
- generateTicketEmbeddingsLocal.mjs
- searchLocal.mjs

## Roadmap
- Multi-agent orchestration
- Forecasting engine
- SLA anomaly detection
- Zendesk webhook ingestion
- PDF reporting
