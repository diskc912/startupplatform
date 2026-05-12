import type { MetadataRoute } from 'next'
import { createAnonClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lcombinator.com'
  const supabase = createAnonClient()

  // Fetch all idea IDs
  const { data: ideas } = await supabase.from('ideas').select('id')
  
  // Fetch all problem IDs
  const { data: problems } = await supabase.from('problems').select('id')

  const ideaUrls: MetadataRoute.Sitemap = (ideas || []).map((idea) => ({
    url: `${baseUrl}/ideas/${idea.id}`,
    lastModified: new Date(),
  }))

  const problemUrls: MetadataRoute.Sitemap = (problems || []).map((problem) => ({
    url: `${baseUrl}/problems/${problem.id}`,
    lastModified: new Date(),
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    ...ideaUrls,
    ...problemUrls,
  ]
}
