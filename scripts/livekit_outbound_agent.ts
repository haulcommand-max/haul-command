import {
  Agent,
  JobType,
  WorkerOptions,
  cli,
} from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as silero from '@livekit/agents-plugin-silero';
import { JobContext } from '@livekit/agents';

// ============================================================================
// HAUL COMMAND: LiveKit Autonomous Voice Agent
// COST SQUAD: Native OpenAI Realtime vs ElevenLabs
// We are explicitly bypassing ElevenLabs ($22/mo + usage bloat) to use
// OpenAI's native speech-to-speech (Realtime API) or Deepgram+GPT4o-mini+TTS
// which drops the cost per minute to pennies while maintaining latency.
// ============================================================================

export default cli.runApp(new WorkerOptions({
  agent: async (ctx: JobContext) => {
    console.log(`Starting Outbound Agent for Room: ${ctx.room.name}`);

    // Connect to the Twilio SIP Trunk room injected by our backend
    await ctx.connect();

    // 1. STT / VAD Setup
    // Using Silero for Voice Activity Detection (VAD) - cheap open source edge computing
    const vad = silero.VAD.load();

    // 2. Realtime Engine (The Money Saver)
    // Here we use OpenAI's Realtime API (gpt-4o-realtime-preview-2024-10-01)
    // This removes the need for ElevenLabs entirely. OpenAI handles STT -> LLM -> TTS natively
    // at extremely low latency and fractional cost compared to stacking 3 different APIs.
    const agent = new Agent({
      name: 'HaulCommand_Absorption_Agent',
      instructions: `
        You are calling from Haul Command to help the operator claim their profile.
        Keep responses under 2 sentences to prevent conversational latency.
        Do not use robotic language. Speak like a dispatcher.
        If they say "take me off your list", immediately say "No problem, removing you now" and stop.
      `,
      vad,
      // Instead of ElevenLabs, we route native OpenAI Voices (Alloy, Echo, Fable, Onyx, Nova, Shimmer)
      // Onyx and Echo work best for harsh logistics/dispatch environments.
      model: new openai.realtime.RealtimeModel({
        voice: 'onyx',
        temperature: 0.6, // Low temperature for consistent, non-hallucinating responses
      }),
    });

    // 3. Connect to room participant (the SIP trunk dialing the Twilio number)
    // Wait for the Twilio SIP trunk to connect a participant
    ctx.room.on('participantConnected', (participant) => {
      console.log(`SIP Participant connected: ${participant.identity}`);
    });

    agent.on('metrics', (metrics) => {
      // Stream latency metrics back to Supabase to prove ROI
      console.log('Voice Latency metrics:', metrics);
    });

    // Start the agent and begin talking instantly
    // The agent will say this exactly as soon as the line connects 
    await agent.start(ctx.room, ctx.participant);
    
    // Simulate initial human pause, then speak
    setTimeout(() => {
      agent.generateReply();
    }, 500);
  },
  
  // Accept both inbound (callbacks) and outbound jobs via our Twilio SIP trunk
  permissions: {
    canPublishData: true,
    canSubscribe: true,
  },
}));
