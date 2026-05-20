/**
 * Knowledge Processing Service
 * 
 * Handles file upload, parsing, chunking, embedding generation, and semantic retrieval.
 */

interface DocumentChunk {
  text: string;
  index: number;
  metadata?: any;
}

/**
 * Process uploaded file and generate embeddings
 */
export async function processKnowledgeFile(
  gptId: number,
  fileId: number,
  fileContent: string,
  fileType: string,
  db: D1Database,
  openaiKey: string
): Promise<void> {
  // Update status to processing
  await db
    .prepare("UPDATE gpt_knowledge_files SET indexing_status = 'processing' WHERE id = ?")
    .bind(fileId)
    .run();
  
  try {
    // Parse document
    const text = await parseDocument(fileContent, fileType);
    
    // Chunk document
    const chunks = chunkDocument(text);
    
    // Generate and store embeddings
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.text, openaiKey);
      
      await db
        .prepare(
          `INSERT INTO gpt_embeddings (gpt_id, knowledge_file_id, chunk_text, chunk_index, embedding_json)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(
          gptId,
          fileId,
          chunk.text,
          chunk.index,
          JSON.stringify(embedding)
        )
        .run();
    }
    
    // Update file status
    await db
      .prepare(
        `UPDATE gpt_knowledge_files 
         SET indexing_status = 'completed', chunk_count = ?, token_count = ?
         WHERE id = ?`
      )
      .bind(chunks.length, estimateTokens(text), fileId)
      .run();
  } catch (error) {
    // Update status to failed
    await db
      .prepare("UPDATE gpt_knowledge_files SET indexing_status = 'failed' WHERE id = ?")
      .bind(fileId)
      .run();
    
    throw error;
  }
}

/**
 * Parse document based on file type
 */
async function parseDocument(content: string, fileType: string): Promise<string> {
  // For now, handle plain text
  // In production, would use libraries for PDF, DOCX parsing
  
  if (fileType === "text/plain" || fileType === "text/markdown") {
    return content;
  }
  
  if (fileType === "text/csv") {
    // Simple CSV parsing
    return content;
  }
  
  // For other types, return as-is
  // TODO: Implement PDF, DOCX parsing
  return content;
}

/**
 * Chunk document into semantic pieces
 */
function chunkDocument(text: string, chunkSize: number = 1000, _overlap: number = 200): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = "";
  let chunkIndex = 0;
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length < chunkSize) {
      currentChunk += paragraph + "\n\n";
    } else {
      if (currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.trim(),
          index: chunkIndex++,
        });
      }
      currentChunk = paragraph + "\n\n";
    }
  }
  
  // Add remaining chunk
  if (currentChunk.length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      index: chunkIndex,
    });
  }
  
  return chunks;
}

/**
 * Generate embedding using OpenAI
 */
async function generateEmbedding(text: string, openaiKey: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.substring(0, 8000), // Limit input size
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to generate embedding: ${error}`);
  }
  
  const data = await response.json() as { data: Array<{ embedding: number[] }> };
  return data.data[0].embedding;
}

/**
 * Estimate token count
 */
function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Retrieve relevant chunks using semantic search
 */
export async function retrieveRelevantChunks(
  gptId: number,
  query: string,
  db: D1Database,
  openaiKey: string,
  topK: number = 5
): Promise<string[]> {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query, openaiKey);
  
  // Retrieve all embeddings for this GPT
  const result = await db
    .prepare(
      `SELECT chunk_text, embedding_json FROM gpt_embeddings 
       WHERE gpt_id = ?
       ORDER BY id DESC
       LIMIT 50`
    )
    .bind(gptId)
    .all();
  
  if (!result.results || result.results.length === 0) {
    return [];
  }
  
  // Calculate cosine similarity
  const scored = result.results.map((row: any) => {
    const embedding = JSON.parse(row.embedding_json);
    const similarity = cosineSimilarity(queryEmbedding, embedding);
    return {
      text: row.chunk_text,
      similarity,
    };
  });
  
  // Sort by similarity and return top K
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topK).map((s) => s.text);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have same length");
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
