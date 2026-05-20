/**
 * Knowledge Processing Service
 * Handles document parsing, chunking, embeddings, and retrieval
 */

interface ChunkResult {
  chunks: string[];
  metadata: {
    totalChunks: number;
    avgChunkSize: number;
  };
}

/**
 * Parse and extract text from uploaded files
 */
export async function extractTextFromFile(
  fileContent: ArrayBuffer,
  fileType: string,
  filename: string
): Promise<string> {
  const decoder = new TextDecoder();

  // Handle text files
  if (
    fileType === "text/plain" ||
    fileType === "text/markdown" ||
    filename.endsWith(".txt") ||
    filename.endsWith(".md")
  ) {
    return decoder.decode(fileContent);
  }

  // Handle CSV
  if (fileType === "text/csv" || filename.endsWith(".csv")) {
    return decoder.decode(fileContent);
  }

  // Handle JSON
  if (fileType === "application/json" || filename.endsWith(".json")) {
    return decoder.decode(fileContent);
  }

  // For PDF, DOCX - return raw text for now
  // In production, you'd use a library like pdf-parse or mammoth
  // For now, just decode as text (will be gibberish but demonstrates flow)
  if (filename.endsWith(".pdf") || filename.endsWith(".docx")) {
    // TODO: Implement proper PDF/DOCX parsing
    throw new Error(
      "PDF and DOCX parsing not yet implemented. Please use TXT, MD, CSV, or JSON files."
    );
  }

  return decoder.decode(fileContent);
}

/**
 * Chunk text into manageable pieces for embedding
 * Uses a combination of semantic (paragraph) and size-based chunking
 */
export function chunkText(text: string, maxChunkSize: number = 1000): ChunkResult {
  const chunks: string[] = [];

  // Split by paragraphs first
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  let currentChunk = "";

  for (const paragraph of paragraphs) {
    // If paragraph itself is too large, split it
    if (paragraph.length > maxChunkSize) {
      // Save current chunk if not empty
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }

      // Split large paragraph by sentences
      const sentences = paragraph.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      let sentenceChunk = "";

      for (const sentence of sentences) {
        if ((sentenceChunk + sentence).length > maxChunkSize) {
          if (sentenceChunk.length > 0) {
            chunks.push(sentenceChunk.trim());
          }
          sentenceChunk = sentence;
        } else {
          sentenceChunk += (sentenceChunk.length > 0 ? ". " : "") + sentence;
        }
      }

      if (sentenceChunk.length > 0) {
        chunks.push(sentenceChunk.trim());
      }
    } else {
      // Add paragraph to current chunk if it fits
      if ((currentChunk + "\n\n" + paragraph).length > maxChunkSize) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + paragraph;
      }
    }
  }

  // Add final chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);

  return {
    chunks,
    metadata: {
      totalChunks: chunks.length,
      avgChunkSize: chunks.length > 0 ? Math.round(totalSize / chunks.length) : 0,
    },
  };
}

/**
 * Generate embeddings using OpenAI's embedding API
 */
export async function generateEmbeddings(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: texts,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI embeddings API error: ${response.status} - ${error}`);
  }

  const data: any = await response.json();
  return data.data.map((item: any) => item.embedding);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Retrieve relevant knowledge chunks based on query
 */
export async function retrieveRelevantKnowledge(
  query: string,
  gptId: number,
  db: D1Database,
  openaiKey: string,
  topK: number = 5
): Promise<string[]> {
  try {
    // Generate embedding for query
    const queryEmbeddings = await generateEmbeddings([query], openaiKey);
    const queryVector = queryEmbeddings[0];

    // Get all embeddings for this GPT
    const result = await db
      .prepare(
        `SELECT chunk_text, embedding_json 
         FROM gpt_embeddings 
         WHERE gpt_id = ?
         ORDER BY id`
      )
      .bind(gptId)
      .all();

    if (!result.results || result.results.length === 0) {
      return [];
    }

    // Calculate similarity scores
    const scored = result.results.map((row: any) => {
      const vector = JSON.parse(row.embedding_json as string);
      const similarity = cosineSimilarity(queryVector, vector);
      return {
        text: row.chunk_text as string,
        score: similarity,
      };
    });

    // Sort by score and return top K
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map((item) => item.text);
  } catch (error) {
    console.error("Error retrieving knowledge:", error);
    return [];
  }
}

/**
 * Process uploaded file: extract text, chunk, generate embeddings, store
 */
export async function processKnowledgeFile(
  fileId: number,
  gptId: number,
  fileContent: ArrayBuffer,
  fileType: string,
  filename: string,
  db: D1Database,
  openaiKey: string
): Promise<void> {
  try {
    // Update status to processing
    await db
      .prepare("UPDATE gpt_knowledge_files SET indexing_status = ? WHERE id = ?")
      .bind("processing", fileId)
      .run();

    // Extract text
    const text = await extractTextFromFile(fileContent, fileType, filename);

    // Chunk text
    const { chunks } = chunkText(text, 1000);

    if (chunks.length === 0) {
      throw new Error("No text content found in file");
    }

    // Generate embeddings in batches (OpenAI allows up to 2048 inputs)
    const batchSize = 100;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embeddings = await generateEmbeddings(batch, openaiKey);
      allEmbeddings.push(...embeddings);
    }

    // Store embeddings in database
    for (let i = 0; i < chunks.length; i++) {
      await db
        .prepare(
          `INSERT INTO gpt_embeddings (gpt_id, knowledge_file_id, chunk_text, chunk_index, embedding_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
        )
        .bind(
          gptId,
          fileId,
          chunks[i],
          i,
          JSON.stringify(allEmbeddings[i])
        )
        .run();
    }

    // Update file status
    await db
      .prepare(
        "UPDATE gpt_knowledge_files SET indexing_status = ?, chunk_count = ?, updated_at = datetime('now') WHERE id = ?"
      )
      .bind("completed", chunks.length, fileId)
      .run();
  } catch (error) {
    console.error("Error processing knowledge file:", error);

    // Update status to failed
    await db
      .prepare(
        "UPDATE gpt_knowledge_files SET indexing_status = ?, processing_error = ?, updated_at = datetime('now') WHERE id = ?"
      )
      .bind("failed", (error as Error).message, fileId)
      .run();

    throw error;
  }
}
