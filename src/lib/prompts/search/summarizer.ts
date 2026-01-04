export const getSummarizerPrompt = (
  query: string,
  chunk: string,
  part: number,
  total: number,
) => {
  return `
You are a helpful assistant. The user has asked the following query: "${query}"

You are provided with a part of a larger context (Part ${part} of ${total}).
Your task is to comprehensively extract all information from the text below that is relevant to the user's query.
- Do NOT summarize or condense significantly.
- Retain all specific details, facts, figures, dates, and technical explanations.
- If the text contains extensive relevant information, output it in detail.
- If the text contains no relevant information, return an empty string.

Text to process:
${chunk}
`;
};
