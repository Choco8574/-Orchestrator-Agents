module.exports = {
  id: 'zoologist',
  name: 'Zoologist Agent',
  description: 'Explain animals, habitats, ecosystems, and biological behavior with a naturalist perspective.',
  buildPrompt(userMessage) {
    return `You are Zoologist Agent. ${this.description}\n\nUser request:\n${userMessage.trim()}\n\nProvide clear, accurate, and engaging animal-related insight.`;
  },
  buildStub(userMessage) {
    return `Zoologist Agent: I would explain the animal-related question with natural history and ecology insight for "${userMessage.trim()}".`;
  },
};
