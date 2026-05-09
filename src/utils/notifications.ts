import { Notification, GroupedNotification } from '@/lib/types'

export function groupNotifications(notifications: Notification[]): GroupedNotification[] {
  // Sort notifications by created_at descending first to ensure the most recent is processed first
  const sorted = [...notifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const groups: Record<string, GroupedNotification> = {}
  const orderedKeys: string[] = []

  for (const notif of sorted) {
    // For gangup, target_id is usually null, but we group by type + target_id
    const key = notif.target_id ? `${notif.type}-${notif.target_id}` : notif.type

    if (!groups[key]) {
      groups[key] = {
        id: notif.id,
        type: notif.type,
        target_id: notif.target_id,
        is_read: notif.is_read,
        created_at: notif.created_at,
        senders: notif.profiles ? [notif.profiles] : [],
        count: 1,
      }
      orderedKeys.push(key)
    } else {
      // Add sender if not already in the list to maintain unique senders
      if (notif.profiles && !groups[key].senders.find(s => s.id === notif.profiles!.id)) {
        groups[key].senders.push(notif.profiles)
      }
      groups[key].count += 1
      // If any notification in the group is unread, the whole group is unread
      if (!notif.is_read) {
        groups[key].is_read = false
      }
    }
  }

  // Return grouped notifications in the order they were first encountered (most recent first)
  return orderedKeys.map(k => groups[k])
}

export function getNotificationText(group: GroupedNotification): string {
  if (group.senders.length === 0) return 'Someone interacted with you.'

  const firstSender = group.senders[0].username || 'Someone'
  // Use unique senders length - 1 for "others" count to avoid "User and 2 others" if it was just User commenting 3 times.
  const othersCount = group.senders.length - 1

  let actionText = ''
  if (group.type === 'upvote') actionText = 'upvoted your post.'
  else if (group.type === 'comment') actionText = 'commented on your post.'
  else if (group.type === 'gangup') actionText = 'joined your gang.'
  else actionText = 'interacted with your profile.'

  if (othersCount === 0) {
    return `${firstSender} ${actionText}`
  } else if (othersCount === 1) {
    return `${firstSender} and 1 other ${actionText}`
  } else {
    return `${firstSender} and ${othersCount} others ${actionText}`
  }
}
