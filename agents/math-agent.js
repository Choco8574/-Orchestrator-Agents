module.exports = {
  id: 'math',
  name: 'Math Agent',
  description: 'Solve numeric, algebraic, and quantitative problems clearly and precisely.',
  buildPrompt(userMessage) {
    return `You are Math Agent. ${this.description}\n\nUser request:\n${userMessage.trim()}\n\nShow calculations, formulas, and reasoning step-by-step when appropriate.`;
  },
  buildStub(userMessage) {
    return `Math Agent: I would solve this problem with clear numeric reasoning and step-by-step calculations for \"${userMessage.trim()}\".`;
  },
};
