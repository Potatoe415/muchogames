# 0002 — Stack: Next.js + Supabase + Vercel

Date: 2026-06-09
Status: Accepted
Decision: Build the app with Next.js 16 (App Router, TypeScript, Tailwind 4), Supabase (Postgres + Realtime + anonymous auth), deployed on Vercel.
Context: User wants a mobile web Coinche game, 4 players online, preference for Supabase, deploy via Git + Vercel.
Rationale: Next.js Server Actions give a serverless authority on Vercel; Supabase covers DB, realtime and anonymous auth with minimal glue.
Consequences: Locks in these vendors. Game logic must run in Server Actions (no separate backend service).
Alternatives_Rejected: Dedicated Node/WebSocket server (more infra); client-authoritative logic (cheating, hidden-hand leaks).
