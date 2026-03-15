// SHIM: Re-exports from consolidated notifications.ts
// All existing imports of booking-notifications continue to work.
export {
  notifyOffersCreated,
  notifyBookingConfirmed,
  requestReviews,
  notifyJobCompleted,
} from '@/lib/marketplace/notifications';
