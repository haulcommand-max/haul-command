import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MOTIVE_CLIENT_ID = process.env.MOTIVE_CLIENT_ID!
const MOTIVE_CLIENT_SECRET = process.env.MOTIVE_CLIENT_SECRET!
const MOTIVE_TOKEN_URL = 'https://api.gomotive.com/oauth/token'
const MOTIVE_AUTH_URL = 'https://api.gomotive.com/oauth/authorize'

export function getAuthorizationUrl(operatorId: string): string {
  const state = Buffer.from(JSON.stringify({ operatorId })).toString('base64')
  const params = new URLSearchParams({
    client_id: MOTIVE_CLIENT_ID,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/motive/oauth/callback`,
    response_type: 'code',
    scope: 'vehicles.read drivers.read hos.read locations.read',
    state,
  })
  return `${MOTIVE_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string, state: string) {
  const { operatorId } = JSON.parse(Buffer.from(state, 'base64').toString())

  const res = await axios.post(MOTIVE_TOKEN_URL, {
    client_id: MOTIVE_CLIENT_ID,
    client_secret: MOTIVE_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/motive/oauth/callback`,
  })

  const { access_token, refresh_token, expires_in } = res.data
  const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

  await supabase.from('motive_connections').upsert({
    operator_id: operatorId,
    access_token,
    refresh_token,
    expires_at: expiresAt,
    status: 'active',
    connected_at: new Date().toISOString(),
  }, { onConflict: 'operator_id' })

  return { operatorId, access_token }
}

export async function refreshMotiveToken(operatorId: string): Promise<string> {
  const { data } = await supabase
    .from('motive_connections')
    .select('refresh_token, expires_at')
    .eq('operator_id', operatorId)
    .single()

  if (!data) throw new Error('No Motive connection found')

  const isExpired = new Date(data.expires_at) <= new Date()
  if (!isExpired) {
    const { data: conn } = await supabase
      .from('motive_connections')
      .select('access_token')
      .eq('operator_id', operatorId)
      .single()
    return conn!.access_token
  }

  const res = await axios.post(MOTIVE_TOKEN_URL, {
    client_id: MOTIVE_CLIENT_ID,
    client_secret: MOTIVE_CLIENT_SECRET,
    refresh_token: data.refresh_token,
    grant_type: 'refresh_token',
  })

  const { access_token, refresh_token, expires_in } = res.data
  const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

  await supabase.from('motive_connections').upsert({
    operator_id: operatorId,
    access_token,
    refresh_token,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'operator_id' })

  return access_token
}

export async function getMotiveClient(operatorId: string) {
  const token = await refreshMotiveToken(operatorId)
  return axios.create({
    baseURL: 'https://api.gomotive.com/v1',
    headers: { Authorization: `Bearer ${token}` },
  })
}
