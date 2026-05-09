import { redis } from './redis'
import { createAnonClient } from './supabase/server'
import type { Idea, Problem } from './types'

export async function getTrendingIdeasCached(): Promise<Idea[]> {
  try {
    const cached = await redis.get<Idea[]>('trending_ideas')
    if (cached) return cached
  } catch (e) {
    console.error('Redis cache error:', e)
  }

  const supabase = createAnonClient()
  const { data, error } = await supabase.rpc('get_trending_ideas')
  
  if (error) {
    console.error('Feed fetch error (ideas):', error)
    return []
  }

  // Ensure we filter out hidden ideas
  const ideas = (data as Idea[] | null)?.filter(i => !(i as any).is_hidden) ?? []

  try {
    await redis.setex('trending_ideas', 30, ideas)
  } catch (e) {
    console.error('Redis set error:', e)
  }

  return ideas
}

export async function getTrendingProblemsCached(): Promise<Problem[]> {
  try {
    const cached = await redis.get<Problem[]>('trending_problems')
    if (cached) return cached
  } catch (e) {
    console.error('Redis cache error:', e)
  }

  const supabase = createAnonClient()
  const { data, error } = await supabase.rpc('get_trending_problems')
  
  if (error) {
    console.error('Feed fetch error (problems):', error)
    return []
  }

  // Ensure we filter out hidden problems
  const problems = (data as Problem[] | null)?.filter(p => !(p as any).is_hidden) ?? []

  try {
    await redis.setex('trending_problems', 30, problems)
  } catch (e) {
    console.error('Redis set error:', e)
  }

  return problems
}
