import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ltmxyddqmarcknzhkmdb.supabase.co'
const supabaseKey = 'sb_publishable_XfQZgO3XR-LhZb04AWTCKA_sUB1gLZC'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.from('notifications').insert({
    receiver_id: '123e4567-e89b-12d3-a456-426614174000',
    sender_id: '123e4567-e89b-12d3-a456-426614174000',
    type: 'upvote',
    target_id: '123e4567-e89b-12d3-a456-426614174000'
  })
  console.log('Insert Error:', error)
}
test()
