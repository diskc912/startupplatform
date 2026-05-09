import { Redis } from '@upstash/redis'

// Provide a dummy url/token if they are missing or invalid so it doesn't crash on build
const envUrl = process.env.UPSTASH_REDIS_REST_URL || ''
const url = envUrl.startsWith('https://') ? envUrl : 'https://dummy.upstash.io'
const token = process.env.UPSTASH_REDIS_REST_TOKEN || 'dummy'

export const redis = new Redis({
  url,
  token,
})
