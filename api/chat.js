export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.PINECONE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'PINECONE_API_KEY is not configured on the server.'
    });
  }

  const assistantUrl = 'https://prod-1-data.ke.pinecone.io/assistant/chat/teazzers-data';

  try {
    const body = req.body;

    const response = await fetch(assistantUrl, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
        'X-Pinecone-Api-Version': '2025-10',
      },
      body: JSON.stringify({
        messages: body.messages || [],
        model: body.model || 'gpt-4o',
        stream: body.stream || false,
      }),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
