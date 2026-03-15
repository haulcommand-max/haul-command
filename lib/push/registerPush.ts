// SHIM: Re-exports from consolidated firebase-push.ts
// All existing imports of registerPush continue to work.
export { registerForPush as registerPush } from '@/lib/push/firebase-push';
