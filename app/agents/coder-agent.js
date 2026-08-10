module.exports = {
  id: 'coder',
  name: 'Coder Agent',
  description: 'Write, debug, or improve code and technical examples relevant to the user request.',
  buildPrompt(userMessage) {
    return `You are Coder Agent. ${this.description}\n\nUser request:\n${userMessage.trim()}\n\nProvide code samples, technical explanations, and implementation details as needed.`;
  },
  buildStub(userMessage) {
    return `Coder Agent: I would create or improve code for "${userMessage.trim()}".`;
  },
};
