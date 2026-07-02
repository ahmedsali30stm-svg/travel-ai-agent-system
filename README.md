# Travel AI Agent System

> Enterprise-grade multi-agent travel platform with AI-powered search, booking, and itinerary management.

## Overview

The Travel AI Agent System is a comprehensive platform that uses multiple specialized AI agents to handle all aspects of travel planning, from searching for hotels and activities to generating complete itineraries and handling bookings.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TRAVEL AI AGENT SYSTEM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    AGENT ORCHESTRATION LAYER                        │    │
│  │                                                                      │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │    │
│  │  │Supervisor │  │  Planner  │  │  Router   │  │  Session  │       │    │
│  │  │  Agent    │  │   Agent   │  │   Agent   │  │  Manager  │       │    │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      ↓                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       CORE BOOKING LAYER                            │    │
│  │                                                                      │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │    │
│  │  │  Hotel    │  │  Flight   │  │ Activities│  │Transport  │       │    │
│  │  │  Agent    │  │   Agent   │  │   Agent   │  │  Agent    │       │    │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      ↓                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      INTELLIGENCE LAYER                             │    │
│  │                                                                      │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │    │
│  │  │  Search   │  │  Price    │  │ Duplicate │  │  ranking  │       │    │
│  │  │  Engine   │  │ Intelligence│ │ Detection │  │  Engine   │       │    │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      ↓                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     PROVIDER INTEGRATION LAYER                      │    │
│  │                                                                      │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │    │
│  │  │Hotelbeds│ │ Booking │ │Expedia  │ │ Viator  │ │Amadeus  │     │    │
│  │  │         │ │  .com   │ │         │ │         │ │         │     │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Features

### Multi-Agent System
- **25 Specialized Agents** across 5 layers
- **Parallel Execution** for faster results
- **Error Recovery** with automatic retry and fallback
- **Memory Persistence** across sessions

### Search Intelligence
- **12 Provider Integrations** (Hotelbeds, Booking.com, Expedia, Viator, etc.)
- **Multi-factor Ranking** (price, rating, value, location)
- **Duplicate Detection** with fuzzy and semantic matching
- **Price Intelligence** with historical tracking and alerts
- **3-Layer Caching** (memory, Redis, database)

### Browser Automation
- **Playwright Framework** for web scraping
- **Browser Pool Management** with smart allocation
- **Proxy Rotation** with health monitoring
- **CAPTCHA Detection** for 7 types
- **Session Persistence** with encryption

### API & Integration
- **RESTful API** with OpenAPI specification
- **JWT Authentication** with role-based access
- **Rate Limiting** and request throttling
- **Comprehensive Error Handling**

### Infrastructure
- **Docker Compose** for local development
- **Kubernetes Ready** for production deployment
- **Prometheus + Grafana** monitoring
- **CI/CD Pipeline** with GitHub Actions

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8+
- PostgreSQL 16+
- Redis 7+

### Installation

```bash
# Clone the repository
git clone https://github.com/ahmedsali30stm-svg/travel-ai-agent-system.git
cd travel-ai-agent-system

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env

# Start services
docker-compose up -d

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Start development server
pnpm dev
```

### API Usage

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Search hotels
curl -X POST http://localhost:3000/api/v1/search/hotels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "destination": "Paris, France",
    "checkIn": "2024-06-01",
    "checkOut": "2024-06-07",
    "guests": 2
  }'

# Process with agents
curl -X POST http://localhost:3000/api/v1/agents/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "Plan a 7-day trip to Paris for 2 people",
    "context": {
      "userId": "user_123"
    }
  }'
```

## Project Structure

```
travel-ai-agent-system/
├── src/                    # Source code
│   ├── api/               # Express routes and middleware
│   ├── agents/            # Agent orchestrator
│   ├── config/            # Configuration
│   ├── memory/            # Memory engine
│   ├── prompts/           # LLM prompts
│   ├── schemas/           # Zod schemas
│   ├── services/          # Business logic
│   ├── tools/             # Tool implementations
│   └── utils/             # Utilities
├── prisma/                # Database schema
├── tests/                 # Test files
├── playwright-framework/  # Browser automation
├── search-engine/         # Search intelligence
├── memory/                # Memory engine docs
├── rendering-engine/      # HTML/CSS/JS templates
├── monitoring/            # Prometheus & Grafana
├── security/              # Security policies
├── environments/          # Environment configs
├── openapi.yaml          # API specification
├── docker-compose.yml    # Docker services
└── package.json          # Dependencies
```

## Testing

```bash
# Run unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run integration tests
pnpm test:integration

# Run e2e tests
pnpm test:e2e
```

## Documentation

- **[AGENTS.md](./AGENTS.md)** - 25-agent architecture overview
- **[MEMORY.md](./MEMORY.md)** - Shared memory engine design
- **[SYSTEM.md](./SYSTEM.md)** - System architecture
- **[RULES.md](./RULES.md)** - Operational rules
- **[PROJECT_REPORT.md](./PROJECT_REPORT.md)** - Full project report

## License

MIT License - see [LICENSE](./LICENSE) for details.
