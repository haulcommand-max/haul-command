/* ═══════════════════════════════════════════════════════════════════
   DISPATCH STATE MACHINE
   Deterministic state transitions for the Haul Command load board.
   Handles complex transitions like Operator Replacements, ETA updates,
   and Payment releases across the entire lifecycle of an Assignment.
   ═══════════════════════════════════════════════════════════════════ */

export type DispatchState = 
  | 'DRAFT'
  | 'PUBLISHED_POOL'
  | 'BIDDING_OPEN'
  | 'MATCHING_AUTO'
  | 'OPERATOR_ASSIGNED'
  | 'IN_TRANSIT'
  | 'DELAYED_INCIDENT'
  | 'DELIVERED_PENDING_DOCS'
  | 'SETTLED'
  | 'CANCELED_BROKER'
  | 'CANCELED_OPERATOR';

export type DispatchEvent =
  | { type: 'PUBLISH' }
  | { type: 'OPEN_BID' }
  | { type: 'ENABLE_AUTO_MATCH' }
  | { type: 'ASSIGN_OPERATOR'; operatorId: string }
  | { type: 'START_TRANSIT'; timestamp: string }
  | { type: 'REPORT_INCIDENT'; details: string }
  | { type: 'RESUME_TRANSIT' }
  | { type: 'MARK_DELIVERED'; documentHash?: string }
  | { type: 'APPROVE_PAYMENT' }
  | { type: 'CANCEL_BY_BROKER'; reason: string }
  | { type: 'OPERATOR_FALLOUT'; reason: string };

export interface DispatchContext {
  id: string;
  currentState: DispatchState;
  assignedOperator: string | null;
  history: { state: DispatchState; timestamp: string; note?: string }[];
}

export class DispatchStateMachine {
  
  /**
   * Deterministic transition logic enforcing business rules
   */
  static transition(ctx: DispatchContext, event: DispatchEvent): DispatchContext {
    const nextCtx = { ...ctx };
    const now = new Date().toISOString();

    const updateState = (newState: DispatchState, note?: string) => {
      nextCtx.history.push({ state: nextCtx.currentState, timestamp: now, note });
      nextCtx.currentState = newState;
    };

    switch (ctx.currentState) {
      case 'DRAFT':
        if (event.type === 'PUBLISH') updateState('PUBLISHED_POOL');
        if (event.type === 'CANCEL_BY_BROKER') updateState('CANCELED_BROKER', event.reason);
        break;

      case 'PUBLISHED_POOL':
        if (event.type === 'OPEN_BID') updateState('BIDDING_OPEN');
        if (event.type === 'ENABLE_AUTO_MATCH') updateState('MATCHING_AUTO');
        if (event.type === 'ASSIGN_OPERATOR') {
          nextCtx.assignedOperator = event.operatorId;
          updateState('OPERATOR_ASSIGNED');
        }
        if (event.type === 'CANCEL_BY_BROKER') updateState('CANCELED_BROKER', event.reason);
        break;

      case 'BIDDING_OPEN':
      case 'MATCHING_AUTO':
        if (event.type === 'ASSIGN_OPERATOR') {
          nextCtx.assignedOperator = event.operatorId;
          updateState('OPERATOR_ASSIGNED');
        }
        if (event.type === 'CANCEL_BY_BROKER') updateState('CANCELED_BROKER', event.reason);
        break;

      case 'OPERATOR_ASSIGNED':
        if (event.type === 'START_TRANSIT') updateState('IN_TRANSIT');
        if (event.type === 'OPERATOR_FALLOUT') {
          nextCtx.assignedOperator = null; // Operator broke the load
          updateState('PUBLISHED_POOL', `Operator fallout: ${event.reason}`);
        }
        if (event.type === 'CANCEL_BY_BROKER') updateState('CANCELED_BROKER', event.reason);
        break;

      case 'IN_TRANSIT':
        if (event.type === 'REPORT_INCIDENT') updateState('DELAYED_INCIDENT', event.details);
        if (event.type === 'MARK_DELIVERED') updateState('DELIVERED_PENDING_DOCS');
        break;

      case 'DELAYED_INCIDENT':
        if (event.type === 'RESUME_TRANSIT') updateState('IN_TRANSIT');
        if (event.type === 'MARK_DELIVERED') updateState('DELIVERED_PENDING_DOCS');
        if (event.type === 'CANCEL_BY_BROKER') updateState('CANCELED_BROKER', event.reason);
        break;

      case 'DELIVERED_PENDING_DOCS':
        if (event.type === 'APPROVE_PAYMENT') updateState('SETTLED');
        break;

      case 'SETTLED':
      case 'CANCELED_BROKER':
      case 'CANCELED_OPERATOR':
        // Terminal states - no further transitions allowed (unless reopened in edge cases)
        throw new Error(`Cannot transition from terminal state: ${ctx.currentState}`);

      default:
        throw new Error(`Unknown state: ${ctx.currentState}`);
    }

    return nextCtx;
  }
}
