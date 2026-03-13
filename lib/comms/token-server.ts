/**
 * HAUL COMMAND COMMS — LiveKit Token Server
 *
 * Server-side utility for minting short-lived LiveKit room access tokens.
 * Tokens are ALWAYS server-issued, tied to verified channel membership.
 * Uses livekit-server-sdk.
 */

import { AccessToken } from 'livekit-server-sdk';
import { TOKEN_EXPIRY_SECONDS } from './constants';

/**
 * Mint a LiveKit room token for a verified channel member.
 * @param roomName - The LiveKit room name (from comms_channels.livekit_room_name)
 * @param userId - The authenticated user ID
 * @param displayName - User's display name for LiveKit participant identity
 * @returns JWT token string for LiveKit connection
 */
export async function mintRoomToken(
    roomName: string,
    userId: string,
    displayName: string,
): Promise<string> {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new Error('LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set');
    }

    const token = new AccessToken(apiKey, apiSecret, {
        identity: userId,
        name: displayName,
        ttl: TOKEN_EXPIRY_SECONDS,
    });

    token.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
    });

    return await token.toJwt();
}
