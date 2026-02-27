# SynnccIT | AI-Powered Cloud IDE

SynnccIT is a modern, modular, and AI-driven Integrated Development Environment (IDE) built for the next generation of developers. It combines a sleek, responsive frontend with a distributed backend architecture to provide powerful coding, testing, and AI assistant capabilities.

## Demo Video Link:
https://youtu.be/6MdZ4L3TBNQ

## Deployment Link:
https://synncc-it.vercel.app/

## 🚀 Key Features

- **AI Agent Integration**: Built-in AI assistant to help with code generation, terminal command translation, and planning.
- **Cross-Platform Terminal**: Real-time WebSocket-based terminal that works seamlessly on Windows (cmd/powershell) and Unix/macOS (bash/zsh).
- **Interactive File Explorer**: Full file system management with native file system access support.
- **Modern Code Editor**: Syntax highlighting and multi-file editing capabilities.
- **Testing & Simulation**: Dedicated backend services for running test cases, simulations, and flowcharting.
- **Rich Aesthetics**: Premium UI built with React, Tailwind CSS, and shadcn/ui.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS, shadcn/ui, Radix UI
- **Build Tool**: Vite
- **Terminal**: xterm.js

### Backend
- **Framework**: Python 3.10+ & FastAPI
- **AI**: Google Generative AI (Gemini Flash 1.5)
- **Utilities**: asyncio, PTY (Unix), watchfiles

## 📂 Project Structure

```text
SynnccIT/
├── src/                        # Frontend React Application
├── DeveloperPage_Backend/      # Core IDE Backend (File System, Terminal)
├── AgentPage_Backend/          # AI Agent Service
├── TestingPage_Backend/        # Testing & Evaluation Service
└── StatusPage_Backend/         # Monitoring Service
```

## 🚥 Getting Started

### Prerequisites
- Node.js (v18 or later)
- Python (v3.10 or later)
- Google/Gemini API Key (Optional, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/SynnccIT.git
   cd SynnccIT
   ```

2. **Frontend Setup**
   ```bash
   npm install
   ```

3. **Backend Setup**
   Each backend service has its own requirements. For the core IDE features:
   ```bash
   cd DeveloperPage_Backend
   pip install -r requirements.txt
   ```

### Running the Application

1. **Start the Frontend**
   ```bash
   npm run dev
   ```

2. **Start the Backend**
   ```bash
   cd DeveloperPage_Backend
   uvicorn app:app --host 127.0.0.1 --port 8000 --reload
   ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
