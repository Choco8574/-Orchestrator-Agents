const express = require('express');
const path = require('path');
const { orchestrateMessage, AGENTS } = require('./agents');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.warn('WARNING: OPENAI_API_KEY is not set. Set it to your Bearer token before running the server.');
}

function normalizeAllowedAgents(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean).map(String);
  if (typeof input === 'string') return input.split(',').map((value) => value.trim()).filter(Boolean);
  return [];
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/agents', (req, res) => {
  res.json({
    availableAgents: AGENTS.map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
    })),
  });
});

app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;
  const allowedAgents = normalizeAllowedAgents(req.body.allowedAgents);

  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    return res.status(400).json({ error: 'A non-empty message is required.' });
  }

  console.log(`[API] /api/chat request; message length=${userMessage.length}; allowedAgents=${allowedAgents.join(', ') || 'none'}`);

  try {
    const result = await orchestrateMessage(userMessage, allowedAgents);
    res.json({
      request: {
        message: userMessage.trim(),
        allowedAgents,
        requestedAt: new Date().toISOString(),
      },
      orchestrator: result.orchestrator,
      selectedAgents: result.selectedAgents,
      strategy: result.selectionReason,
      agents: result.agents,
    });
  } catch (error) {
    console.error('Orchestration failed:', error);
    res.status(500).json({
      error: 'Failed to orchestrate the user request.',
      details: error.message,
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Orchestrator chatbox available at http://localhost:${port}`);
});
