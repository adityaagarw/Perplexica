import { Chunk } from '@/lib/types';
import BaseLLM from '@/lib/models/base/llm';
import { encodingForModel } from 'js-tiktoken';
import { getSummarizerPrompt } from '@/lib/prompts/search/summarizer';

export const summarizeContent = async (
  content: string | Chunk[],
  query: string,
  llm: BaseLLM<any>,
  maxTokens = 8000,
  chunkSize = 6000,
): Promise<string> => {
  try {
    const encoder = encodingForModel('gpt-4');
    let fullText = '';

    if (Array.isArray(content)) {
      fullText = content
        .map(
          (c) => `<title>${c.metadata.title}</title>\n${c.content}\n`
        )
        .join('\n');
    } else {
      fullText = content;
    }

    const totalTokens = encoder.encode(fullText).length;

    if (totalTokens <= maxTokens) {
      return fullText;
    }

    let chunks: string[] = [];
    
    // Helper function to split text by lines into chunks
    const splitTextIntoChunks = (text: string, limit: number) => {
        const textChunks: string[] = [];
        const lines = text.split('\n');
        let currentChunk = '';
        let currentTokens = 0;
        
        for (const line of lines) {
             const lineStr = line + '\n';
             const lineTokens = encoder.encode(lineStr).length;
             
             // If a single line is massive (unlikely but possible), split it hard
             if (lineTokens > limit) {
                 if (currentChunk.length > 0) {
                     textChunks.push(currentChunk);
                     currentChunk = '';
                     currentTokens = 0;
                 }
                 // Hard split the massive line
                 // 1 token approx 4 chars, so we slice by limit * 3 to be safe-ish or just accept it might be slightly over
                 // Better: just push it and hope or slice chars. Let's slice chars.
                 const charLimit = limit * 3;
                 for (let i = 0; i < lineStr.length; i += charLimit) {
                     textChunks.push(lineStr.slice(i, i + charLimit));
                 }
                 continue;
             }

             if (currentTokens + lineTokens > limit && currentChunk.length > 0) {
                 textChunks.push(currentChunk);
                 currentChunk = lineStr;
                 currentTokens = lineTokens;
             } else {
                 currentChunk += lineStr;
                 currentTokens += lineTokens;
             }
        }
        if (currentChunk.length > 0) {
            textChunks.push(currentChunk);
        }
        return textChunks;
    };

    if (Array.isArray(content)) {
        let currentChunk = '';
        let currentTokens = 0;

        for (const finding of content) {
          const findingContentStr = `<title>${finding.metadata.title}</title>\n${finding.content}\n`;
          const findingTokens = encoder.encode(findingContentStr).length;

          // If a single finding is larger than the chunk size, we must split it
          if (findingTokens > chunkSize) {
              // First, push whatever we have accumulated so far
              if (currentChunk.length > 0) {
                  chunks.push(currentChunk);
                  currentChunk = '';
                  currentTokens = 0;
              }
              // Now split this large finding
              const subChunks = splitTextIntoChunks(findingContentStr, chunkSize);
              chunks.push(...subChunks);
          } 
          // Normal case: check if adding this finding exceeds chunk size
          else if (currentTokens + findingTokens > chunkSize) {
            chunks.push(currentChunk);
            currentChunk = findingContentStr;
            currentTokens = findingTokens;
          } else {
            currentChunk += findingContentStr;
            currentTokens += findingTokens;
          }
        }
        if (currentChunk.length > 0) {
          chunks.push(currentChunk);
        }
    } else {
        chunks = splitTextIntoChunks(fullText, chunkSize);
    }

    const summaries = await Promise.all(
      chunks.map(async (chunk, i) => {
        const prompt = getSummarizerPrompt(
          query,
          chunk,
          i + 1,
          chunks.length,
        );
        const result = await llm.generateText({
          messages: [{ role: 'user', content: prompt }],
        });
        return result.content;
      }),
    );

    return summaries
      .map(
        (s, i) =>
          `<result index=${i + 1} title="Summary Part ${i + 1}">${s}</result>`,
      )
      .join('\n');

  } catch (err) {
    console.error('Error in summarization utils:', err);
    // Fallback to truncated original content if summarization fails
    // Approx 4 chars per token -> 24000 tokens ~= 96000 chars. Round to 100k.
    const FALLBACK_CHAR_LIMIT = 100000;
    if (Array.isArray(content)) {
        return content.map(c => c.content).join('\n').slice(0, FALLBACK_CHAR_LIMIT) + '... [Truncated due to error]';
    }
    return content.slice(0, FALLBACK_CHAR_LIMIT) + '... [Truncated due to error]';
  }
};
