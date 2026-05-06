import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'

const LK_API_KEY = process.env.LIVEKIT_API_KEY!
const LK_API_SECRET = process.env.LIVEKIT_API_SECRET!
const LK_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? 'wss://haulcommand.livekit.cloud'

export const roomService = new RoomServiceClient(
  LK_URL.replace('wss://', 'https://'),
  LK_API_KEY,
  LK_API_SECRET
)

export function createAgentToken(roomName: string, participantName: string): string {
  const at = new AccessToken(LK_API_KEY, LK_API_SECRET, {
    identity: participantName,
    ttl: '1h',
  })
  at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true })
  return at.toJwt()
}

export function createOutboundRoom(operatorId: string): string {
  return `outreach-${operatorId}-${Date.now()}`
}

export async function createRoom(roomName: string) {
  return roomService.createRoom({ name: roomName, emptyTimeout: 300, maxParticipants: 5 })
}

export async function deleteRoom(roomName: string) {
  return roomService.deleteRoom(roomName)
}
