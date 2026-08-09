const test = require('node:test');
const assert = require('node:assert/strict');
const { AGENTS, orchestrateMessage } = require('../agents');

function getAgentIds(result) {
  return result.selectedAgents;
}

test('selects only the math agent for a simple arithmetic question', async () => {
  const result = await orchestrateMessage('What is 2 + 2?');
  assert.deepEqual(getAgentIds(result), ['math']);
});

test('selects only the writer and comedian agents for a humorous writing request', async () => {
  const result = await orchestrateMessage('Write a funny birthday message for my friend');
  assert.deepEqual(getAgentIds(result), ['writer', 'comedian']);
});

test('does not select all agents when no explicit agent is required', async () => {
  const result = await orchestrateMessage('Explain how photosynthesis works');
  assert.ok(getAgentIds(result).length < AGENTS.length);
});
