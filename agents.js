const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const API_URL = 'https://vibe-proxy-gqv4.onrender.com/v1/chat/completions';

const mathAgent = require('./agents/math-agent');
const scientistAgent = require('./agents/scientist-agent');
const writerAgent = require('./agents/writer-agent');
const comedianAgent = require('./agents/comedian-agent');
const engineerAgent = require('./agents/engineer-agent');
const coderAgent = require('./agents/coder-agent');
const detectiveAgent = require('./agents/detective-agent');
const zoologistAgent = require('./agents/zoologist-agent');
const doctorAgent = require('./agents/doctor-agent');
const paleontologistAgent = require('./agents/paleontologist-agent');

const AGENTS = [
  mathAgent,
  scientistAgent,
  writerAgent,
  comedianAgent,
  engineerAgent,
  coderAgent,
  detectiveAgent,
  zoologistAgent,
  doctorAgent,
  paleontologistAgent,
];

function chooseAgents(message, allowedAgents) {
  const allowedSet = Array.isArray(allowedAgents) && allowedAgents.length > 0
    ? new Set(allowedAgents.map((id) => id.toLowerCase()))
    : null;

  const normalized = message.toLowerCase();
  const scoredAgents = AGENTS
    .filter((agent) => !allowedSet || allowedSet.has(agent.id))
    .map((agent) => ({ agent, score: 0 }));

  const addScore = (agentId, pattern, score) => {
    if (pattern.test(normalized)) {
      const entry = scoredAgents.find((item) => item.agent.id === agentId);
      if (entry) {
        entry.score += score;
      }
    }
  };

  addScore('math', /(math|calculate|calculate|compute|equation|sum|total|average|percent|ratio|number|plus|minus|times|divide|difference|algebra|geometry|statistics|formula|solve|\b\d+\b)/, 5);
  addScore('scientist', /(science|scientific|biology|chemistry|physics|astronomy|evolution|experiment|hypothesis|photosynthesis|genetics|ecosystem|atom|molecule|cell|organism|theory)/, 5);
  addScore('coder', /(code|coding|programming|developer|javascript|python|api|bug|debug|function|implement|class|library|module|syntax|error|script|software|tool|build)/, 5);
  addScore('engineer', /(engineer|engineering|system|architecture|workflow|infrastructure|design|optimize|scalable|deploy|server|database|network|iot|safety)/, 5);
  addScore('writer', /(write|draft|compose|email|message|summary|summarize|document|article|story|paragraph|proposal|rewrite|rephrase|letter|script|explain)/, 4);
  addScore('comedian', /(funny|joke|humor|humorous|witty|playful|pun|comic|hilarious|laugh)/, 4);
  addScore('detective', /(detective|investigate|clue|mystery|suspect|evidence|infer|hidden|solve|find out|who did|why did|where did|when did)/, 4);
  addScore('zoologist', /(animal|animals|zoo|wildlife|habitat|ecosystem|species|bird|mammal|reptile|fish|insect|predator|prey|ecology)/, 5);
  addScore('doctor', /(doctor|health|medical|symptom|symptoms|disease|illness|medicine|hospital|treatment|diagnosis|wellness|patient)/, 5);
  addScore('paleontologist', /(fossil|fossils|prehistoric|dinosaur|dinosaurs|extinct|ancient life|evolution|paleo|paleontology)/, 5);

  const selected = scoredAgents
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  if (selected.length === 0) {
    const fallbackAgent = AGENTS.find((agent) => agent.id === 'writer') || AGENTS[0];
    return fallbackAgent ? [fallbackAgent] : [];
  }

  const strongestScore = selected[0].score;
  const topMatches = selected.filter((item) => item.score >= strongestScore - 1);
  return topMatches.map((item) => item.agent);
}

function buildOrchestratorInstructions(userMessage, agents) {
  const names = agents.map((agent) => agent.name).join(', ');
  return [
    `User request: "${userMessage.trim()}"`,
    `Selected agents: ${names}.`,
    'Only use the selected agents listed above; do not invoke other agents unless they are explicitly required.',
    'Coordinate each agent response by leveraging its specialization.',
    'Produce a short combined summary that explains what each agent contributed and why.',
    'If an agent is not relevant, explain why it was skipped.',
  ].join(' ');
}

function buildAgentPrompt(agent, userMessage) {
  if (typeof agent.buildPrompt === 'function') {
    return agent.buildPrompt(userMessage);
  }

  return [
    `You are ${agent.name}.`,
    agent.description,
    'Provide an answer that is informative, structured, and clearly labeled.',
    `User request:\n${userMessage.trim()}`,
    'If the request is outside your role, explain why and keep the response concise.',
  ].join('\n\n');
}

function buildAgentStub(agent, userMessage) {
  if (typeof agent.buildStub === 'function') {
    return agent.buildStub(userMessage);
  }

  return `Agent ${agent.name}: I would provide a response for "${userMessage.trim()}".`;
}

async function sendChatRequest(payload) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured in the environment.');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || JSON.stringify(data));
  }

  return data;
}

async function callAgent(agent, userMessage) {
  const startTime = Date.now();

  if (!OPENAI_API_KEY) {
    return {
      name: agent.name,
      role: agent.id,
      output: buildAgentStub(agent, userMessage),
      error: null,
      durationMs: 0,
      prompt: buildAgentPrompt(agent, userMessage),
    };
  }

  const prompt = buildAgentPrompt(agent, userMessage);
  const payload = {
    model: 'class-chat-model',
    messages: [
      {
        role: 'system',
        content: prompt,
      },
      {
        role: 'user',
        content: userMessage.trim(),
      },
    ],
    temperature: 0.3,
    max_tokens: 400,
  };

  const data = await sendChatRequest(payload);
  const output = data?.choices?.[0]?.message?.content?.trim() || '';
  const durationMs = Date.now() - startTime;

  return {
    name: agent.name,
    role: agent.id,
    output,
    error: null,
    raw: data,
    durationMs,
    prompt,
  };
}

async function orchestrateMessage(userMessage, allowedAgents) {
  const selectedAgents = chooseAgents(userMessage, allowedAgents);
  const orchestratorMessage = buildOrchestratorInstructions(userMessage, selectedAgents);
  const agentPromises = selectedAgents.map((agent) => callAgent(agent, userMessage));
  const agentResults = await Promise.all(agentPromises);

  return {
    orchestrator: orchestratorMessage,
    selectedAgents: selectedAgents.map((agent) => agent.id),
    selectionReason: `Selected agents based on prompt patterns and user preferences: ${selectedAgents.map((agent) => agent.name).join(', ')}.`,
    agents: agentResults,
  };
}

module.exports = {
  AGENTS,
  orchestrateMessage,
};
