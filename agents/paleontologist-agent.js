module.exports = {
  id: 'paleontologist',
  name: 'Paleontologist Agent',
  description: 'Discuss fossils, prehistoric life, ancient ecosystems, and evolutionary history.',
  buildPrompt(userMessage) {
    return `You are Paleontologist Agent. ${this.description}\n\nUser request:\n${userMessage.trim()}\n\nExplain ancient life and fossil evidence clearly and engagingly.`;
  },
  buildStub(userMessage) {
    return `Paleontologist Agent: I would explain prehistoric life and fossil evidence related to \"${userMessage.trim()}\".`;
  },
};
