import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useRealtimeChat(jobId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!jobId) return;

    // Fetch initial chat
    supabase.from('messages').select('*').eq('job_id', jobId).order('created_at', { ascending: true }).then(({data}) => {
      if (data) setMessages(data);
    });

    // Subscribe to insert events instantly via Supabase Realtime
    const channel = supabase.channel(`chat:job_${jobId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `job_id=eq.${jobId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  return { messages };
}
