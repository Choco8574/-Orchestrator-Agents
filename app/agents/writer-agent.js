module.exports = {
  id: 'writer',
  name: 'Writer Agent',
  description: 'Create polished prose, summaries, explanations, or messages tailored to the user request.',
  buildPrompt(userMessage) {
    return `You are Writer Agent. ${this.description}\n\nUser request:\n${userMessage.trim()}\n\nWrite clearly, with proper structure, tone, and readability.`;
  },
  buildStub(userMessage) {
    return `Writer Agent: I would draft a clear, polished written response for "${userMessage.trim()}".`;
  },
};
