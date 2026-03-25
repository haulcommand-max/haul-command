/**
 * Firebase Admin SDK — Deprecated in favor of Novu/Supabase
 * 
 * SCOPE: Firebase has been intentionally uninstalled to eliminate redundancy.
 * We are consolidating all push notifications and auth under Supabase and Novu.
 * These stubs prevent existing imports from breaking during the transition.
 */

export function getAdminMessaging(): any {
    return {
        send: async () => console.log('[FCM:stub] send called - Firebase uninstalled'),
        sendEachForMulticast: async (msg: any) => {
            console.log('[FCM:stub] multicast called - Firebase uninstalled');
            return {
                responses: msg.tokens.map(() => ({ success: true, messageId: 'stub' }))
            };
        }
    };
}

export async function sendPushToToken() {}
export async function sendPushToTopic() {}
export async function sendPushMulticast() {}

export const messaging = new Proxy({}, {
    get(_, prop) { return () => {}; },
});
