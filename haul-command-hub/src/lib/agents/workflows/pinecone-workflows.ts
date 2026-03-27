import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/pinecone-activities';

// Proxy the activities using Temporal types
const {
  findCandidates,
  sendPushDispatch,
  waitForResponse,
  recordFeedback
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

interface MatchingInput {
  loadId: string;
  loadVector: number[];
  criteria: any;
}

export async function smartMatchingWorkflow(input: MatchingInput): Promise<string> {
  const candidates = await findCandidates(input.loadVector, input.criteria);
  let finalOperatorId = null;

  for (const candidate of candidates) {
    if (candidate.score < 50) {
      continue; // Skip weak matches
    }

    try {
      await sendPushDispatch(candidate.operator_id, input.loadId);
      
      const response = await waitForResponse(candidate.operator_id, input.loadId);
      
      if (response.accepted) {
        finalOperatorId = candidate.operator_id;
        await recordFeedback(candidate.operator_id, input.loadId, true, response.timeTaken);
        break; // Match found!
      } else {
        await recordFeedback(candidate.operator_id, input.loadId, false, response.timeTaken);
      }
    } catch (err) {
      // Escalation logic on timeout or failure
      console.warn(`[Temporal Workflow] Escalating from ${candidate.operator_id} to next candidate...`);
      await recordFeedback(candidate.operator_id, input.loadId, false, 0);
    }
  }

  if (!finalOperatorId) {
    throw new Error(`Failed to fill load ${input.loadId}`);
  }

  return finalOperatorId;
}
