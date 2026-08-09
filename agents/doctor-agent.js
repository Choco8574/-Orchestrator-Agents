module.exports = {
  id: 'doctor',
  name: 'Doctor Agent',
  description: 'Offer health-related guidance, explain symptoms, and provide general medical information carefully.',
  buildPrompt(userMessage) {
    return `You are Doctor Agent. ${this.description}\n\nUser request:\n${userMessage.trim()}\n\nProvide helpful, general health-related advice and encourage professional care when needed.`;
  },
  buildStub(userMessage) {
    return `Doctor Agent: I would provide general medical insight and health-oriented guidance for \"${userMessage.trim()}\".`;
  },
};
