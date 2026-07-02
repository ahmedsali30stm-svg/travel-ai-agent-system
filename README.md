# Enterprise Travel AI Agent Platform

> A comprehensive multi-agent system for travel booking automation with AI-powered search, quotation generation, and browser automation.

---

## Overview

This is a production-grade enterprise platform that orchestrates 25+ specialized AI agents to handle complete travel booking workflows—from initial client request through quotation delivery.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          ENTERPRISE TRAVEL AI AGENT PLATFORM                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│  │   CLIENT LAYER  │───▶│  API GATEWAY    │───▶│  ORCHESTRATION  │              │
│  │  Web/Mobile/API │    │  Rate Limiting  │    │  SUPERVISOR     │              │
│  └─────────────────┘    │  Authentication │    │  AGENT          │              │
│                          └─────────────────┘    └────────┬────────┘              │
│                                                          │                       │
│                    ┌─────────────────────────────────────┼──────────────┐       │
│                    │                                     ▼              │       │
│                    │  ┌─────────────────────────────────────────────┐   │       │
│                    │  │            DOMAIN AGENTS LAYER              │   │       │
│                    │  │                                             │   │       │
│                    │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │   │       │
│                    │  │  │Hotel│ │Flight│ │Activ│ │Trans│ │Visa │ │   │       │
│                    │  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ │   │       │
│                    │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │   │       │
│                    │  │  │Weather│Currency│Price│ │Valid│ │Rsrch│ │   │       │
│                    │  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ │   │       │
│                    │  └─────────────────────────────────────────────┘   │       │
│                    │                         │                          │       │
│                    │                         ▼                          │       │
│                    │  ┌─────────────────────────────────────────────┐   │       │
│                    │  │              TOOL LAYER                     │   │       │
│                    │  │  Hotelbeds │ Booking │ Viator │ Amadeus    │   │       │
│                    │  └─────────────────────────────────────────────┘   │       │
│                    └─────────────────────────────────────────────────────┘       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Features

### Core Capabilities
- **25 Specialized Agents** - Complete travel booking automation
- **16 Integration Tools** - Hotel, flight, activity, and payment APIs
- **120 Prompt Templates** - XML-formatted prompts for all agents
- **Memory Engine** - Long-term, short-term, and session memory with synchronization
- **Search Intelligence** - Multi-provider search with ranking, scoring, and deduplication

### Rendering Engine
- **HTML/CSS/JS Quotation Templates** - Professional, responsive designs
- **PDF Generation** - Print-optimized quotation documents
- **Dark Mode & RTL Support** - Full internationalization
- **Interactive Demos** - Live preview capabilities

### Browser Automation
- **Enterprise Playwright Framework** - Production-ready web scraping
- **Browser Pool Management** - Efficient instance recycling
- **Proxy Rotation** - Intelligent proxy switching with health checks
- **CAPTCHA Detection** - Support for 7+ CAPTCHA types
- **Session Persistence** - Encrypted cookie/storage management

### Infrastructure
- **Multi-Environment Support** - Dev, staging, production configs
- **Monitoring & Alerting** - Prometheus + Grafana dashboards
- **Security Policies** - Comprehensive security guidelines
- **Disaster Recovery** - Backup and recovery procedures

---

## Project Structure

```
travel-ai-agent-system/
├── AGENTS.md                    # 25 agents overview
├── MEMORY.md                    # Memory engine design
├── SYSTEM.md                    # System architecture
├── RULES.md                     # 30 operational rules
│
├── playbooks/                   # 13 workflow files
│   ├── WORKFLOW.md
│   └── 01-12-*.md
│
├── runtime/                     # 20 agent specifications
│   └── 01-20-*.md
│
├── tools/                       # 17 tool documentation
│   ├── TOOL_LAYER.md
│   └── 16 tool files
│
├── schemas/                     # 6 JSON schemas
├── templates/                   # 3 HTML/PDF templates
├── configs/                     # 3 YAML configs
│
├── prompts/                     # 22 prompt files
│   ├── PROMPT_LIBRARY.md
│   ├── common/UTILITIES.md
│   └── agents/ (20 files)
│
├── memory/                      # 16 memory engine files
│   ├── MEMORY_ENGINE.md
│   ├── LONG_TERM_MEMORY.md
│   ├── SHORT_TERM_MEMORY.md
│   ├── CACHES/ (5 files)
│   └── ... (11 more files)
│
├── rendering-engine/            # 7 rendering files
│   ├── styles.css
│   ├── components.css
│   ├── engine.js
│   ├── enhanced.js
│   ├── quotation.html
│   ├── demo.html
│   └── README.md
│
├── search-engine/               # 14 search engine files
│   ├── SEARCH_ENGINE.md
│   ├── SEARCH_PIPELINE.md
│   ├── RANKING_ENGINE.md
│   └── ... (11 more files)
│
├── playwright-framework/        # 15 framework files
│   ├── PLAYWRIGHT_FRAMEWORK.md
│   ├── BROWSER_POOL.md
│   ├── API_REFERENCE.md
│   └── ... (12 more files)
│
├── environments/                # 4 environment files
│   ├── development.md
│   ├── staging.md
│   ├── production.md
│   └── README.md
│
├── monitoring/                  # 2 monitoring files
│   ├── prometheus.yml
│   └── grafana-dashboards.md
│
└── security/                    # 1 security file
    └── SECURITY_POLICIES.md
```

---

## Components

| Component | Files | Description |
|-----------|-------|-------------|
| Core Docs | 4 | System architecture, rules, memory |
| Playbooks | 13 | 12-step workflow pipeline |
| Runtime Agents | 20 | Complete agent specifications |
| Tools | 17 | Integration tool documentation |
| Schemas | 6 | JSON schema definitions |
| Templates | 3 | HTML/PDF templates |
| Configs | 3 | YAML configurations |
| Prompts | 22 | 120 XML-formatted prompts |
| Memory Engine | 16 | Memory management system |
| Rendering Engine | 7 | HTML/CSS/JS quotation system |
| Search Engine | 14 | Search intelligence system |
| Playwright Framework | 15 | Browser automation framework |
| Environments | 4 | Environment configurations |
| Monitoring | 2 | Prometheus + Grafana |
| Security | 1 | Security policies |
| **Total** | **~147 files** | **Complete platform** |

---

## Agents

| Agent | ID | Purpose |
|-------|-----|---------|
| Supervisor | agent_supervisor_01 | Top-level orchestrator |
| Planner | agent_planner_02 | Task decomposition |
| Hotel | agent_hotel_03 | Hotel search & booking |
| Flight | agent_flight_04 | Flight search & booking |
| Activities | agent_activities_05 | Activity discovery |
| Transportation | agent_transportation_06 | Ground transport |
| Visa | agent_visa_07 | Visa requirements |
| Weather | agent_weather_08 | Weather forecasts |
| Currency | agent_currency_09 | Currency conversion |
| Price Intelligence | agent_price_intelligence_10 | Price tracking |
| Validation | agent_validation_11 | Data validation |
| QA | agent_qa_12 | Quality assurance |
| HTML Renderer | agent_html_renderer_13 | HTML generation |
| PDF Generator | agent_pdf_generator_14 | PDF generation |
| Image Collector | agent_image_collector_15 | Image collection |
| SEO Content | agent_seo_content_16 | SEO optimization |
| Research | agent_research_17 | Destination research |
| Memory | agent_memory_18 | Memory operations |
| Logging | agent_logging_19 | Logging operations |
| Error Recovery | agent_error_recovery_20 | Error recovery |

---

## Tools

| Tool | ID | API |
|------|-----|-----|
| Hotel Search | tool_hotel_search | Hotelbeds, Booking.com, Agoda |
| Hotel Details | tool_hotel_details | Hotelbeds, Booking.com |
| Flight Search | tool_flight_search | Amadeus, Skyscanner |
| Activity Search | tool_activity_search | Viator, GetYourGuide |
| Booking Create | tool_booking_create | Hotelbeds, Booking.com |
| Payment Process | tool_payment_process | Stripe |
| Currency Convert | tool_currency_convert | OpenExchange |
| Weather Get | tool_weather_get | WeatherAPI |
| Image Search | tool_image_search | Unsplash, Pexels |
| Geo Encode | tool_geo_encode | Google Maps |
| Send Email | tool_send_email | SendGrid |
| Generate PDF | tool_generate_pdf | Puppeteer |
| Cache Get/Set | tool_cache_get/set | Redis |
| Log Write | tool_log_write | ELK Stack |
| Validate Data | tool_validate_data | JSON Schema |

---

## Memory System

### Memory Types
- **Long-Term Memory** - Persistent user preferences and historical data
- **Short-Term Memory** - Session-scoped working memory
- **Conversation Memory** - Chat history with summarization
- **Trip Memory** - Trip lifecycle management
- **Search History** - Search query tracking

### Cache Systems
- **Price Cache** - Real-time price tracking with alerts
- **Hotel Cache** - Hotel search results with TTL
- **Image Cache** - Image storage with CDN integration
- **Validation Cache** - Validation results caching
- **Research Cache** - Destination research data

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/ahmedsali30stm-svg/travel-ai-agent-system.git
cd travel-ai-agent-system

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Start services
docker-compose up -d

# Run migrations
npm run db:migrate

# Start application
npm run dev
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/travel_ai

# Redis
REDIS_URL=redis://localhost:6379

# API Keys
HOTELBEDS_API_KEY=your_key
HOTELBEDS_API_SECRET=your_secret
BOOKING_API_KEY=your_key
VIATOR_API_KEY=your_key
AMADEUS_API_KEY=your_key
AMADEUS_API_SECRET=your_secret

# Services
WEATHER_API_KEY=your_key
GOOGLE_MAPS_API_KEY=your_key
STRIPE_SECRET_KEY=your_key
SENDGRID_API_KEY=your_key
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [AGENTS.md](AGENTS.md) | Complete agent specifications |
| [MEMORY.md](MEMORY.md) | Memory engine architecture |
| [SYSTEM.md](SYSTEM.md) | System architecture |
| [RULES.md](RULES.md) | Operational rules |
| [Playbooks](playbooks/) | Workflow documentation |
| [Runtime](runtime/) | Agent runtime specs |
| [Tools](tools/) | Tool documentation |
| [Prompts](prompts/) | Prompt templates |
| [Memory](memory/) | Memory system docs |
| [Rendering](rendering-engine/) | HTML/CSS/JS engine |
| [Search](search-engine/) | Search intelligence |
| [Playwright](playwright-framework/) | Browser automation |
| [Environments](environments/) | Environment configs |
| [Monitoring](monitoring/) | Monitoring setup |
| [Security](security/) | Security policies |

---

## License

Enterprise use only. Proprietary.

---

## Contact

For questions or support, please contact:
- Email: ahmed.sali30@example.com
- GitHub: [@ahmedsali30stm-svg](https://github.com/ahmedsali30stm-svg)
