const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const API_URL = 'https://vibe-proxy-gqv4.onrender.com/v1/chat/completions';

const mathAgent = require('./agents/math-agent');
const scientistAgent = require('./agents/scientist-agent');
const writerAgent = require('./agents/writer-agent');
const comedianAgent = require('./agents/comedian-agent');
const engineerAgent = require('./agents/engineer-agent');
const coderAgent = require('./agents/coder-agent');
const detectiveAgent = require('./agents/detective-agent');

const AGENTS = [
  mathAgent,
  scientistAgent,
  writerAgent,
  comedianAgent,
  engineerAgent,
  coderAgent,
  detectiveAgent,
];

const ROLE_MAPPING = {
  planner: ['engineer', 'writer', 'scientist'],
  researcher: ['scientist', 'detective'],
  writer: ['writer', 'coder'],
  coder: ['coder', 'engineer'],
  reviewer: ['writer', 'engineer', 'coder'],
  tester: ['engineer', 'coder'],
  translator: ['writer'],
  communicator: ['writer', 'comedian'],
};

function chooseAgents(message, allowedAgents) {
  if (Array.isArray(allowedAgents) && allowedAgents.length > 0) {
    const allowedSet = new Set(allowedAgents.map((id) => id.toLowerCase()));
    return AGENTS.filter((agent) => allowedSet.has(agent.id));
  }

  const normalized = message.toLowerCase();
  const selectedIds = new Set();

  const addRoles = (pattern, roleKeys) => {
    if (pattern.test(normalized)) {
      roleKeys.forEach((id) => selectedIds.add(id));
    }
  };

  addRoles(/(plan|roadmap|strategy|steps|organize|outline|structure)/, ROLE_MAPPING.planner);
  addRoles(/(research|discover|find out|what is|who|where|why|when|information|context)/, ROLE_MAPPING.researcher);
  addRoles(/(write|draft|compose|blog|email|summary|summarize|explain|document|message|proposal|story|rewrite|rephrase)/, ROLE_MAPPING.writer);
  addRoles(/(coder|code|script|function|implement|debug|bug|app|api|program|tool|software|library)/, ROLE_MAPPING.coder);
  addRoles(/(review|check|validate|audit|inspect|quality|edit|proofread|critique|feedback|suggest)/, ROLE_MAPPING.reviewer);
  addRoles(/(test|tester|unit test|integration|scenario|case|verify|validate|assert|run|bug)/, ROLE_MAPPING.tester);
  addRoles(/(translate|rewrite|rephrase|simplify|convert|style|tone|language)/, ROLE_MAPPING.translator);
  addRoles(/(joke|funny|humor|storytelling|creative|playful)/, ROLE_MAPPING.communicator);

  if (selectedIds.size === 0) {
    AGENTS.forEach((agent) => selectedIds.add(agent.id));
  }

  const selected = AGENTS.filter((agent) => selectedIds.has(agent.id));
  return selected.length ? selected : AGENTS;
}

function buildOrchestratorInstructions(userMessage, agents) {
  const names = agents.map((agent) => agent.name).join(', ');
  return [
    `User request: "${userMessage.trim()}"`,
    `Selected agents: ${names}.`,
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
