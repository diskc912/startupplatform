export interface Profile {
  id: string
  username: string
  bio: string | null
  avatar_url: string | null
  youtube_pitch_url: string | null
  twitter_url: string | null
  github_url: string | null
  linkedin_url: string | null
  website_url: string | null
  created_at: string
}

export interface Idea {
  id: string
  author_id: string
  title: string
  description: string
  image_url: string | null
  upvote_count: number
  created_at: string
  // Flat fields returned by get_trending_ideas RPC
  author_username?: string
  author_avatar_url?: string | null
  has_upvoted?: boolean
  // Joined from profiles (for standard queries)
  profiles?: Profile
}


export interface Comment {
  id: string
  idea_id: string
  author_id: string
  parent_id: string | null
  content: string
  created_at: string
  // Joined from profiles
  profiles?: Profile
}

export type AuthFormState = {
  error?: string
  message?: string
} | undefined

export interface Problem {
  id: string
  author_id: string
  title: string
  description: string
  // Note: No image_url according to SQL
  upvote_count: number
  created_at: string
  // Flat fields returned by get_trending_problems RPC
  author_username?: string
  author_avatar_url?: string | null
  has_upvoted?: boolean
  // Joined from profiles
  profiles?: Profile
}

export interface ProblemComment {
  id: string
  problem_id: string
  author_id: string
  parent_id: string | null
  content: string
  created_at: string
  // Joined from profiles
  profiles?: Profile
}

export interface Notification {
  id: string
  receiver_id: string
  sender_id: string
  type: 'gangup' | 'upvote' | 'comment'
  target_id: string | null
  is_read: boolean
  created_at: string
  profiles?: Profile
}

export interface GroupedNotification {
  id: string
  type: 'gangup' | 'upvote' | 'comment'
  target_id: string | null
  is_read: boolean
  created_at: string
  senders: Profile[]
  count: number
}
