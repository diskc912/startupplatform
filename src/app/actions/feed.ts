'use server'

import { createClient } from '@/lib/supabase/server'

export async function fetchFeedBatchAction(feedType: 'ideas' | 'problems', tabType: 'trending' | 'gang', page: number) {
  const supabase = await createClient()
  const pageSize = 50
  const from = page * pageSize
  const to = from + pageSize - 1

  if (tabType === 'trending') {
    const rpcName = feedType === 'ideas' ? 'get_trending_ideas' : 'get_trending_problems'
    const { data, error } = await supabase.rpc(rpcName).range(from, to)
    
    if (error) {
      console.error(`Feed fetch error (${tabType} ${feedType}):`, error)
      return []
    }
    
    // Filter out hidden posts to match cache.ts behavior
    return (data || []).filter((i: any) => !i.is_hidden)
  } else {
    // Gang tab
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return [] // should not happen on gang tab, but safe fallback

    const rpcName = feedType === 'ideas' ? 'get_ganged_ideas' : 'get_ganged_problems'
    const { data, error } = await supabase.rpc(rpcName).range(from, to)
    
    if (error) {
      console.error(`Feed fetch error (${tabType} ${feedType}):`, error)
      return []
    }
    return data || []
  }
}
