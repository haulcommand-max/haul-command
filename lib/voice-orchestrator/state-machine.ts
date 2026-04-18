/**
 * VOICE ORCHESTRATOR — State Machine
 * 
 * Manages voice session lifecycle:
 *   idle → listening → transcribing → thinking → speaking → idle
 * 
 * Native realtime path skips 'transcribing' (audio goes direct to model).
 * All transitions are validated — invalid transitions are rejected.
 */

import type { VoiceState, VoiceMode } from './types';

// ── Valid Transitions ──────────────────────────────────────────

type TransitionMap = Record<VoiceState, VoiceState[]>;

const SHARED_TRANSITIONS: TransitionMap = {
  idle:         ['listening', 'error'],
  listening:    ['idle', 'transcribing', 'thinking', 'error'],
  transcribing: ['thinking', 'idle', 'error'],
  thinking:     ['speaking', 'idle', 'error'],
  speaking:     ['idle', 'listening', 'error'],
  error:        ['idle'],
};

// Native realtime can go straight from listening → thinking (no transcribing step)
// and from speaking → listening (barge-in)
const NATIVE_TRANSITIONS: TransitionMap = {
  ...SHARED_TRANSITIONS,
  listening: ['idle', 'thinking', 'error'], // No transcribing
  speaking:  ['idle', 'listening', 'error'], // Barge-in
};

// Wrapper path must go through transcribing
const WRAPPER_TRANSITIONS: TransitionMap = {
  ...SHARED_TRANSITIONS,
  listening: ['idle', 'transcribing', 'error'], // Must transcribe
  speaking:  ['idle', 'error'], // No barge-in
};

// ── State Machine ──────────────────────────────────────────────

export class VoiceStateMachine {
  private _state: VoiceState = 'idle';
  private _mode: VoiceMode;
  private _listeners: Array<(state: VoiceState, prev: VoiceState) => void> = [];
  private _transitions: TransitionMap;

  constructor(mode: VoiceMode) {
    this._mode = mode;
    this._transitions = mode === 'native-realtime' 
      ? NATIVE_TRANSITIONS 
      : WRAPPER_TRANSITIONS;
  }

  get state(): VoiceState {
    return this._state;
  }

  get mode(): VoiceMode {
    return this._mode;
  }

  /**
   * Attempt a state transition. Returns true if valid, false if rejected.
   */
  transition(to: VoiceState): boolean {
    const validTargets = this._transitions[this._state];
    if (!validTargets.includes(to)) {
      console.warn(
        `[VoiceStateMachine] Invalid transition: ${this._state} → ${to}. ` +
        `Valid: [${validTargets.join(', ')}]`
      );
      return false;
    }

    const prev = this._state;
    this._state = to;

    for (const listener of this._listeners) {
      try {
        listener(to, prev);
      } catch (err) {
        console.error('[VoiceStateMachine] Listener error:', err);
      }
    }

    return true;
  }

  /**
   * Force transition to a state (bypasses validation).
   * Use sparingly — mainly for error recovery.
   */
  forceTransition(to: VoiceState): void {
    const prev = this._state;
    this._state = to;
    for (const listener of this._listeners) {
      try { listener(to, prev); } catch { /* swallow */ }
    }
  }

  /**
   * Register a state change listener.
   * Returns unsubscribe function.
   */
  onChange(listener: (state: VoiceState, prev: VoiceState) => void): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  /**
   * Check if a transition is valid without performing it.
   */
  canTransition(to: VoiceState): boolean {
    return this._transitions[this._state].includes(to);
  }

  /**
   * Reset to idle state.
   */
  reset(): void {
    this.forceTransition('idle');
  }

  /**
   * Clean up listeners.
   */
  destroy(): void {
    this._listeners = [];
    this._state = 'idle';
  }
}
