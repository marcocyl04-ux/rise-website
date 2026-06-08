-- Migration: Enable RLS on unprotected tables
-- Applied: June 8, 2026
-- 
-- 5 tables had RLS disabled with full anon access.
-- Now all 10 tables are protected.

-- Enable RLS
ALTER TABLE public.agent_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verified_facts ENABLE ROW LEVEL SECURITY;

-- agent_state: system config, only founders
CREATE POLICY "Founders can manage agent_state" ON public.agent_state
  FOR ALL USING (get_user_role() = 'founder');

-- client_config: client settings, only founders
CREATE POLICY "Founders can manage client_config" ON public.client_config
  FOR ALL USING (get_user_role() = 'founder');

-- content_queue: content pipeline, coaches and founders
CREATE POLICY "Coaches and founders can manage content_queue" ON public.content_queue
  FOR ALL USING (get_user_role() = ANY(ARRAY['coach', 'founder']));

-- conversation_messages: chat logs are business data, coaches and founders
CREATE POLICY "Coaches and founders can manage conversation_messages" ON public.conversation_messages
  FOR ALL USING (get_user_role() = ANY(ARRAY['coach', 'founder']));

-- verified_facts: anyone can read, coaches and founders can write
CREATE POLICY "Anyone can view verified_facts" ON public.verified_facts
  FOR SELECT USING (true);
CREATE POLICY "Coaches and founders can manage verified_facts" ON public.verified_facts
  FOR ALL USING (get_user_role() = ANY(ARRAY['coach', 'founder']));
