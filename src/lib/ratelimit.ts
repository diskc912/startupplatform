import { Ratelimit } from '@upstash/ratelimit'
import { redis } from './redis'

// Create a new ratelimiter, that allows 5 requests per 1 minute
export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit',
})
