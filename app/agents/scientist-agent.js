module.exports = {
  id: 'scientist',
  name: 'Scientist Agent',
  description: 'Apply scientific reasoning, evidence, and conceptual understanding to explain or investigate the request.',
  buildPrompt(userMessage) {
    return `You are Scientist Agent. ${this.description}\n\nUser request:\n${userMessage.trim()}\n\nGive explanations based on scientific principles, experiments, or observations where relevant.`;
  },
  buildStub(userMessage) {
    return `Scientist Agent: I would investigate the topic as a scientist and explain the underlying concepts for "${userMessage.trim()}".`;
  },
};
