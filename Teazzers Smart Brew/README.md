# Teazzers Smart Brew

A React dashboard and AI assistant for monitoring and troubleshooting Teazzers Smart Brew issues.

## Features

- **Dashboard** with 6 issue categories:
  - Power & Electrical Issues
  - Brewing Issues
  - Heating Issues
  - Leaking Issues
  - Configuration Issues
  - Servicing & Maintenance

- **AI Chatbot** powered by Pinecone Assistant API

## Getting Started

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build
npm run preview
```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_PINECONE_ASSISTANT_URL=https://prod-1-data.ke.pinecone.io/assistant/chat/teazzers-data
```

Or use Vercel environment variables with `VITE_` prefix.

## Tech Stack

- React 19
- Vite
- Pinecone Assistant API
- Deployed on Vercel

## Repository

https://github.com/shanmugapriyag2196/Teazzers-Smart-Brew.git
