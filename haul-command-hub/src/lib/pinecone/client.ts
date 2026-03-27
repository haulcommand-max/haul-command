import { Pinecone } from '@pinecone-database/pinecone';

export const PINECONE_INDEX_NAME = 'haul-command-global-index';

// Initialize Pinecone client
export function getPineconeClient() {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY is missing from environment variables');
  }

  return new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
}

/**
 * Ensures the haul_command_global_index exists with dimension 1536 and cosine similarity.
 */
export async function initializePineconeIndex() {
  const pc = getPineconeClient();
  const existingIndexes = await pc.listIndexes();

  const indexExists = existingIndexes.indexes?.some(
    (idx) => idx.name === PINECONE_INDEX_NAME
  );

  if (!indexExists) {
    console.log(`[Pinecone] Creating index ${PINECONE_INDEX_NAME}...`);
    await pc.createIndex({
      name: PINECONE_INDEX_NAME,
      dimension: 1536,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      },
    });
    console.log(`[Pinecone] Index ${PINECONE_INDEX_NAME} created successfully.`);
  } else {
    console.log(`[Pinecone] Index ${PINECONE_INDEX_NAME} already exists.`);
  }
}

/**
 * Returns a reference to a specific Pinecone namespace
 */
export function getPineconeNamespace(namespace: 'operators' | 'loads' | 'conversations' | 'permits' | 'corridors') {
  const pc = getPineconeClient();
  return pc.index(PINECONE_INDEX_NAME).namespace(namespace);
}
