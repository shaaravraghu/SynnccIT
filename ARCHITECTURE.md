# AI_CLI_IDE Project Architecture

### Overview
AI_CLI_IDE is a modular, full-stack application designed to provide an AI-powered developer environment with a modern frontend and multiple backend services. The project is organized into a main frontend app and several backend services, each responsible for a specific domain or page.


### Project Structure

```
AI_CLI_IDE/
│
├── src/                        # Frontend React application
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # Entry point
│   ├── App.css, index.css      # Global styles
│   ├── components/             # Shared and page-specific UI components
│   │   ├── NavLink.tsx
│   │   └── ...
│   ├── contexts/               # React context providers
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions
│   ├── pages/                  # Page components (AgentPage, StatusPage, etc.)
│   ├── test/                   # Frontend tests
│   └── types/                  # TypeScript types
│
├── AgentPage_Backend/          # Backend for Agent page
│   ├── app.py                  # FastAPI app entry
│   ├── agent.py, execution.py  # Agent logic and execution
│   ├── history.py, history.json# Agent history management
│   ├── requirements.txt        # Python dependencies
│   └── ...
│
├── StatusPage_Backend/         # Backend for Status page
│   ├── app/                    # FastAPI app and modules
│   │   ├── main.py             # App entry
│   │   ├── database.py         # Database logic
│   │   ├── models/             # ORM models
│   │   ├── routes/             # API routes
│   │   ├── schemas/            # Pydantic schemas
│   │   └── services/           # Business logic
│   └── requirements.txt        # Python dependencies
│
├── TestingPage_Backend/        # Backend for Testing page
│   ├── main.py                 # FastAPI app entry
│   ├── models/                 # Test and simulation models
│   ├── routers/                # API routers (evaluation, flowchart, simulation, testcase)
│   ├── services/               # Test runner, code executor, analyzers
│   ├── utils/                  # Helpers (AI, sanitizer, flowchart)
│   └── requirements.txt        # Python dependencies
│
├── package.json                # Frontend dependencies and scripts
├── README.md                   # Project overview
├── ARCHITECTURE.md             # Architecture documentation
├── REQUIREMENTS.md             # Requirements documentation
└── ...                         # Other config and root files
```

### Frontend
- Built with React, TypeScript, Vite, Tailwind CSS, shadcn/ui, and Radix UI
- Handles routing, authentication, and UI for developer tools (agent panel, chat, code editor, file explorer, terminal, etc.)
- Communicates with backend services via REST APIs

### Backend
- Each `<Page>_Backend/` folder is a standalone Python FastAPI service for a specific frontend page
  - **AgentPage_Backend/**: Integrates with AI/LLM APIs (LangChain, OpenAI), manages agent execution and history
  - **StatusPage_Backend/**: Handles status and monitoring endpoints
  - **TestingPage_Backend/**: Provides test execution, code evaluation, and flowchart generation
- Each backend has its own `requirements.txt` and may expose REST endpoints consumed by the frontend

### Communication
- The frontend interacts with each backend via HTTP REST APIs
- Each backend can be developed, deployed, and scaled independently

### Key Technologies
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI
- **Backend**: Python, FastAPI, Uvicorn, LangChain, OpenAI, SQLAlchemy (where needed)

### Extensibility
- New pages can be added by creating a new `<Page>_Backend/` and corresponding frontend page/component
- Backend services are decoupled and can be updated or replaced independently

---
This architecture enables rapid development, modular scaling, and clear separation of concerns between frontend and backend services.