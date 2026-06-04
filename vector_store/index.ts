export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

export interface SearchFilter {
  city?: string;
  propertyType?: string;
  riskCategory?: string;
  [key: string]: unknown;
}

export interface SearchResult {
  document: VectorDocument;
  score: number;
}

export interface IVectorStore {
  upsert(doc: VectorDocument): Promise<void>;
  upsertBatch(docs: VectorDocument[]): Promise<void>;
  search(embedding: number[], options: { topK: number; filter?: SearchFilter }): Promise<SearchResult[]>;
  delete(id: string): Promise<void>;
}

export class VectorStorePlaceholder implements IVectorStore {
  async upsert(_doc: VectorDocument): Promise<void> {
    throw new Error("Vector store not configured. See vector_store/index.ts for implementation guide.");
  }
  async upsertBatch(_docs: VectorDocument[]): Promise<void> {
    throw new Error("Vector store not configured.");
  }
  async search(_embedding: number[], _options: { topK: number; filter?: SearchFilter }): Promise<SearchResult[]> {
    throw new Error("Vector store not configured. Falling back to full-context RAG.");
  }
  async delete(_id: string): Promise<void> {
    throw new Error("Vector store not configured.");
  }
}
