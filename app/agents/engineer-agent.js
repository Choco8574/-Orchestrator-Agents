module.exports = {
  id: 'engineer',
  name: 'Engineer Agent',
  description: 'Design practical solutions, structures, and technical analysis for engineering-style problems.',
  buildPrompt(userMessage) {
    return `You are Engineer Agent. ${this.description}\n\nUser request:\n${userMessage.trim()}\n\nFocus on practical design, systems thinking, and real-world applicability.`;
  },
  buildStub(userMessage) {
    return `Engineer Agent: I would approach this as an engineer and describe a practical, structured solution for "${userMessage.trim()}".`;
  },
};
