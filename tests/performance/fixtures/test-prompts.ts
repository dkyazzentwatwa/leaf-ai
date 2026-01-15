export const TEST_PROMPTS = {
  short: 'What is the capital of France?',

  medium: `Explain the concept of machine learning in simple terms.
Include examples of how it's used in everyday applications like
recommendation systems, voice assistants, and image recognition.`,

  long: `You are a helpful AI assistant. Analyze this scenario:
A small startup is developing a task management app. They have 5 developers,
$100,000 budget, and 6 months timeline. Should they use React Native for
cross-platform or native iOS/Android? Consider: development speed, performance,
maintenance, cost, team expertise, and scalability. Provide comprehensive
analysis with pros/cons and recommendations.`,

  code: `Write a Python function that implements binary search on a sorted array.
Include error handling, type hints, and docstrings.`,
}

export const EXPECTED_OUTPUT_TOKENS = {
  short: 50,
  medium: 200,
  long: 500,
  code: 150,
}
