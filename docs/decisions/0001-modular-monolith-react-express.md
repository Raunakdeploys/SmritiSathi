# ADR 0001: Modular Monolith with React 19 and Express

## Status
Accepted

## Context
SmritiSaathi requires low ops maintenance, sub-second latency for elder GPS alerts, and easy local and cloud deployment. A microservices architecture would introduce excessive operational burden, distributed tracing overhead, and failure modes during critical emergency alerts.

## Decision
We adopt a modular monolith architecture:
- React 19 + TypeScript + Vite frontend
- Server-side Express API mounted alongside Vite middlewares
- Dedicated services directory (`src/services/` and server-side service modules) separating business logic from transport route handlers.

## Alternatives Considered
- *Microservices (NestJS + Python AI Worker + Go Geofence Service)*: Rejected due to orchestration complexity and network latency during critical wandering events.
- *Serverless Next.js 14*: Rejected due to cold-starts on GPS webhooks and unpredictable streaming latency.

## Consequences
- Single container deployment on port 3000.
- Shared TypeScript types between frontend and server.
- Easy local reproduction and testing.
