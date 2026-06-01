import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pgywlbgrtcdznjxjcayf.supabase.co'
const supabaseAnonKey = 'sb_publishable_uWsYPxhfbsxNOB7fdqmeuA_mRA82pCX'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)