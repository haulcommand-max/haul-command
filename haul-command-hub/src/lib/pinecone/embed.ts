import { ModelRouter } from '../modelRouter';
import { getPineconeNamespace } from './client';

/**
 * Types and schema representations for embeddings
 */

export interface OperatorProfile {
  operator_id: string;
  location: any;
  certifications: string[];
  equipment_type: string;
  availability_status: string;
  acceptance_rate: number;
  completion_rate: number;
  avg_response_time: number;
  preferred_job_types: string[];
  price_sensitivity: number;
  reliability_score: number;
  historical_routes: string[];
  behavioral_tags: string[];
  last_active_timestamp: string;
  tier: string;
}

export interface LoadProfile {
  load_id: string;
  origin: string;
  destination: string;
  corridor_id: string;
  load_type: string;
  dimensions: any;
  escort_requirements: string[];
  urgency_level: string;
  price: number;
  difficulty_score: number;
  completion_outcome?: string;
  time_to_fill?: number;
  region: string;
  country: string;
}

/**
 * Generates an operator embedding using the specific strategy
 */
export async function embedOperator(profile: OperatorProfile): Promise<void> {
  const inputString = `
    Behavior History: ${profile.behavioral_tags.join(', ')}
    Job Types: ${profile.preferred_job_types.join(', ')}
    Routes: ${profile.historical_routes.join(', ')}
    Reliability: ${profile.reliability_score}
    Tier: ${profile.tier}
  `.trim();

  // Model Router uses Gemini 3.1 Pro for embeddings
  const vector = await ModelRouter.getEmbeddings(inputString);

  const namespace = getPineconeNamespace('operators');
  
  await (namespace as any).upsert([{
    id: profile.operator_id,
    values: vector,
    metadata: {
      location: profile.location ? JSON.stringify(profile.location) : '',
      certifications: profile.certifications,
      equipment_type: profile.equipment_type,
      availability_status: profile.availability_status,
      acceptance_rate: profile.acceptance_rate,
      completion_rate: profile.completion_rate,
      avg_response_time: profile.avg_response_time,
      price_sensitivity: profile.price_sensitivity,
      reliability_score: profile.reliability_score,
      tier: profile.tier,
      last_active_timestamp: profile.last_active_timestamp
    }
  }]);
}

/**
 * Generates a load embedding using the specific strategy
 */
export async function embedLoad(load: LoadProfile): Promise<void> {
  const inputString = `
    Load Type: ${load.load_type}
    Route: ${load.origin} to ${load.destination}
    Requirements: ${load.escort_requirements.join(', ')}
    Urgency: ${load.urgency_level}
  `.trim();

  const vector = await ModelRouter.getEmbeddings(inputString);
  const namespace = getPineconeNamespace('loads');

  await (namespace as any).upsert([{
    id: load.load_id,
    values: vector,
    metadata: {
      origin: load.origin,
      destination: load.destination,
      corridor_id: load.corridor_id,
      load_type: load.load_type,
      urgency_level: load.urgency_level,
      price: load.price,
      difficulty_score: load.difficulty_score,
      region: load.region,
      country: load.country
    }
  }]);
}

export async function embedConversation(convo: any): Promise<void> {
  const inputString = `
    Transcript: ${convo.transcript}
    Sentiment: ${convo.sentiment}
    Negotiation Behavior: ${convo.negotiation_behavior}
  `.trim();

  const vector = await ModelRouter.getEmbeddings(inputString);

  await (getPineconeNamespace('conversations') as any).upsert([{
    id: convo.conversation_id,
    values: vector,
    metadata: {
      operator_id: convo.operator_id,
      broker_id: convo.broker_id,
      sentiment: convo.sentiment,
      negotiation_style: convo.negotiation_style,
      outcome: convo.outcome,
      timestamp: convo.timestamp
    }
  }]);
}

export async function embedCorridor(corridor: any): Promise<void> {
  const inputString = `
    Historical Performance: ${corridor.historical_performance}
    Pricing Patterns: ${corridor.pricing_patterns}
    Route Demand: ${corridor.route_demand}
  `.trim();

  const vector = await ModelRouter.getEmbeddings(inputString);

  await (getPineconeNamespace('corridors') as any).upsert([{
    id: corridor.corridor_id,
    values: vector,
    metadata: {
      origin: corridor.origin,
      destination: corridor.destination,
      avg_price: corridor.avg_price,
      avg_fill_time: corridor.avg_fill_time,
      operator_density: corridor.operator_density,
      demand_level: corridor.demand_level,
      failure_rate: corridor.failure_rate,
      best_operator_types: corridor.best_operator_types
    }
  }]);
}
