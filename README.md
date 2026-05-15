# Teazzers Smart Brew

A dashboard for monitoring Teazzers Smart Brew issues with integrated Pinecone AI assistant for troubleshooting.

## Environment Variables

For the application to work correctly, the following environment variables must be set:

### Local Development
Create a `.env` file in the project root:
```
VITE_PINECONE_ASSISTANT_URL=https://prod-1-data.ke.pinecone.io/assistant/chat/teazzers-data
VITE_PINECONE_API_KEY=your_pinecone_api_key_here
```

### Vercel Deployment
In your Vercel project settings (Settings → Environment Variables), set for the **Production** environment:
- `VITE_PINECONE_ASSISTANT_URL`: `https://prod-1-data.ke.pinecone.io/assistant/chat/teazzers-data`
- `VITE_PINECONE_API_KEY`: `your_actual_pinecone_api_key_here`

**Important**: Variables must be prefixed with `VITE_` to be exposed to the client-side code.