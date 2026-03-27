import { Client as TypesenseClient } from 'typesense';
import { ModelRouter } from '../modelRouter';
import { getPineconeNamespace } from './client';

// Initialize Typesense Client
export const getTypesenseClient = () => {
  return new TypesenseClient({
    nodes: [
      {
        host: process.env.TYPESENSE_API_HOST || 'local-typesense',
        port: parseInt(process.env.TYPESENSE_API_PORT || '8108', 10),
        protocol: process.env.TYPESENSE_API_PROTOCOL || 'http',
      },
    ],
    apiKey: process.env.TYPESENSE_SEARCH_ONLY_API_KEY || 'xyz',
    connectionTimeoutSeconds: 2,
  });
};

export interface MatchingCriteria {
  loadId: string;
  lat: number;
  lng: number;
  radiusMiles: number;
  certifications: string[];
  equipmentType: string;
  availability: boolean;
}

/**
 * Step 1: Typesense Filtering + Step 2: Pinecone Vector Search + Step 3: Scoring + Step 4: Ranking
 */
export async function smartMatchingFlow(loadVector: number[], criteria: MatchingCriteria) {
  const tsClient = getTypesenseClient();

  console.log('[SmartMatch] Step 1: Typesense Filtering Layer');
  
  // Create Typesense filter string
  const filters: string[] = [];
  
  if (criteria.certifications.length > 0) {
    filters.push(`certifications:[${criteria.certifications.join(',')}]`);
  }
  if (criteria.equipmentType) {
    filters.push(`equipment_type:=${criteria.equipmentType}`);
  }
  if (criteria.availability) {
    filters.push(`availability_status:=true`);
  }
  // Simplified location filter logic for Typesense (requires location facet logic setup)
  filters.push(`location:(${criteria.lat}, ${criteria.lng}, ${criteria.radiusMiles} mi)`);
  
  // NOTE: This assumes the collection "provider_directory" matches the instructions
  const typesenseResults = await tsClient.collections('provider_directory').documents().search({
    q: '*',
    filter_by: filters.join(' && '),
    per_page: 200,
  });

  const filteredOperatorIds = typesenseResults.hits?.map(h => (h.document as any).operator_id) || [];

  if (filteredOperatorIds.length === 0) {
    return []; // No candidates passed hard filters
  }

  console.log(`[SmartMatch] ${filteredOperatorIds.length} candidate operators passed filtering. Moving to Pinecone.`);

  console.log('[SmartMatch] Step 2: Vector Search via Pinecone');
  
  const operatorNamespace = getPineconeNamespace('operators');
  const pcResults = await operatorNamespace.query({
    vector: loadVector,
    topK: 20,
    includeMetadata: true,
    filter: {
      operator_id: { $in: filteredOperatorIds }
    }
  });

  const matches = pcResults.matches || [];

  console.log('[SmartMatch] Step 3: Scoring & Step 4: Ranking');

  const rankedCandidates = await Promise.all(matches.map(async match => {
    const md = match.metadata as any;
    
    // We send payload to Model Router for structured scoring
    const scoringInput = {
      similarity_score: match.score,
      acceptance_rate: md.acceptance_rate,
      completion_rate: md.completion_rate,
      response_time: md.avg_response_time,
      reliability_score: md.reliability_score,
      route_corridor_experience: md.historical_routes
    };

    const prompt = `Analyze this operator for match confidence on a 0-100 scale: ${JSON.stringify(scoringInput)}`;
    
    // Fallback to OpenAI for structured scoring per instruction
    const scoreResult = await ModelRouter.structuredScoring(prompt, {
      match_confidence_score: "number",
      reasoning: "string"
    });

    return {
      operator_id: md.operator_id || match.id,
      score: scoreResult.match_confidence_score || 0,
      base_similarity: match.score,
      reasoning: scoreResult.reasoning,
      tier: md.tier
    };
  }));

  // Step 4 Ranking: Sort by match_confidence_score, boost high-reliability and corridor experience
  const finalRanking = rankedCandidates.sort((a, b) => {
    // Basic sorting by score
    let aBoost = a.score;
    let bBoost = b.score;
    // Boost corridor experience implicitly done by scoring LLM
    return bBoost - aBoost;
  });

  return finalRanking;
}
