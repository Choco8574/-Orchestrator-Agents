const AGENTS = [
  {
    id: 'math',
    name: 'Math Agent',
    description:
      'Solve numeric, algebraic, and quantitative problems using clear formulas, step-by-step explanations, and concise conclusions.',
  },
  {
    id: 'scientist',
    name: 'Scientist Agent',
    description:
      'Analyze concepts using scientific reasoning, evidence, and conceptual clarity to help the user understand complex ideas.',
  },
  {
    id: 'writer',
    name: 'Writer Agent',
    description:
      'Draft polished prose, summaries, explanations, and recommendations with proper structure, tone, and readability.',
  },
  {
    id: 'comedian',
    name: 'Comedian Agent',
    description:
      'Add light humor, creative analogies, and engaging phrasing while keeping responses relevant and safe.',
  },
  {
    id: 'engineer',
    name: 'Engineer Agent',
    description:
      'Design practical systems, workflows, and technical solutions with a real-world engineering perspective.',
  },
  {
    id: 'coder',
    name: 'Coder Agent',
    description:
      'Generate code examples, implementation guidance, debugging advice, and developer-focused explanations.',
  },
  {
    id: 'detective',
    name: 'Detective Agent',
    description:
      'Investigate hidden details, infer context, and uncover relevant facts from the user prompt.',
  },
];

const chatWindow = document.getElementById('chatWindow');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const agentToggles = document.getElementById('agentToggles');
const workflowTrace = document.getElementById('workflowTrace');
const statusText = document.querySelector('.status');

function formatTimestamp() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function appendMessage(role, text, label = null) {
  const container = document.createElement('div');
  container.className = `message ${role}`;

  const roleLabel = document.createElement('div');
  roleLabel.className = 'role';
  roleLabel.textContent = label || (role === 'user' ? 'You' : 'Orchestrator AI');

  const meta = document.createElement('div');
  meta.className = 'message-meta';
  meta.textContent = `Sent ${formatTimestamp()}`;

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;

  container.appendChild(roleLabel);
  container.appendChild(meta);
  container.appendChild(bubble);
  chatWindow.appendChild(container);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function appendTrace(title, details) {
  const entry = document.createElement('div');
  entry.className = 'workflow-entry';

  const heading = document.createElement('strong');
  heading.textContent = title;
  entry.appendChild(heading);

  const content = document.createElement('pre');
  content.className = 'trace-content';
  content.textContent = details;
  entry.appendChild(content);

  workflowTrace.appendChild(entry);
  workflowTrace.scrollTop = workflowTrace.scrollHeight;
}

function renderAgentToggles() {
  agentToggles.innerHTML = '';
  AGENTS.forEach((agent) => {
    const row = document.createElement('div');
    row.className = 'toggle-row';

    const label = document.createElement('label');
    label.htmlFor = `agent-${agent.id}`;
    label.innerHTML = `<span>${agent.name}</span><small>${agent.description}</small>`;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = `agent-${agent.id}`;
    input.value = agent.id;
    input.checked = true;

    row.appendChild(label);
    row.appendChild(input);
    agentToggles.appendChild(row);
  });
}

function getEnabledAgents() {
  return AGENTS.filter((agent) => {
    const checkbox = document.getElementById(`agent-${agent.id}`);
    return checkbox && checkbox.checked;
  });
}

function getEnabledAgentIds() {
  return getEnabledAgents().map((agent) => agent.id);
}

function getEnabledAgentNames() {
  return getEnabledAgents().map((agent) => agent.name);
}

function updateStatus() {
  const enabledNames = getEnabledAgentNames();

  if (enabledNames.length === 0) {
    statusText.textContent = 'No agents enabled. Enable an agent to orchestrate richer replies.';
  } else {
    statusText.textContent = `Enabled agents: ${enabledNames.join(', ')}.`;
  }
}

async function fetchChatResponse(message, agentIds) {
  const payload = {
    model: 'class-chat-model',
    messages: [
      {
        role: 'user',
        content: `User request:\n${message}\n\nSelected agents:\n${agentIds.join(', ')}\n\nPlease answer using the chosen agent expertise.`,
      },
    ],
  };

  appendTrace('Proxy request body', JSON.stringify(payload, null, 2));

  const startTime = Date.now();
  const response = await fetch('https://vibe-proxy-gqv4.onrender.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer sk-vibe-summer-2026',
    },
    body: JSON.stringify(payload),
  });

  const elapsedMs = Date.now() - startTime;
  appendTrace('Proxy response status', `HTTP ${response.status} (${elapsedMs} ms)`);

  const data = await response.json();
  if (!response.ok) {
    const errorMessage = data?.error?.message || JSON.stringify(data);
    appendTrace('Proxy error details', errorMessage);
    throw new Error(errorMessage);
  }

  const answer = data?.choices?.[0]?.message?.content?.trim() || '';
  appendTrace('Proxy raw reply', answer || 'No assistant text returned');

  return answer;
}

async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  const enabledAgents = getEnabledAgents();
  if (enabledAgents.length === 0) {
    appendMessage('assistant', 'Please enable at least one agent before sending your message.', 'Orchestrator');
    return;
  }

  appendMessage('user', message);
  appendTrace('User prompt', message);
  appendTrace('Selected agents', getEnabledAgentNames().join(', '));

  messageInput.value = '';
  appendMessage('assistant', 'Orchestrator is preparing the request and aligning agent expertise...', 'Orchestrator');

  try {
    const reply = await fetchChatResponse(message, getEnabledAgentIds());
    appendMessage('assistant', `Orchestrator reply:\n\n${reply}`, 'Classroom AI');
    appendTrace('Final assistant reply', reply);
  } catch (error) {
    appendMessage('assistant', `⚠️ Failed to get a response: ${error.message}`, 'Orchestrator');
    appendTrace('Error during chat request', error.stack || error.message);
    console.error(error);
  }
}

renderAgentToggles();
updateStatus();
agentToggles.addEventListener('change', updateStatus);

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});
