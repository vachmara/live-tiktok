<script lang="ts" setup>
import type { WebcastChatMessage, WebcastLikeMessage, WebcastGiftMessage, WebcastRoomUserSeqMessage } from 'tiktok-live-connector'

interface LeaderboardUser {
  userId: string
  uniqueId: string
  nickname: string
  profilePicture?: string
  likes: number
  messages: number
  gifts: number
  follows: number
  totalScore: number
}

const store = useLiveStore()
const { events } = storeToRefs(store)
const totalLikes = ref(0)

const viewerCount = computed(() => {
  if (!events.value?.length) return 0

  const roomUserEvents = events.value
    .filter(event => event.event === 'roomUser')
    .map(event => event.data as WebcastRoomUserSeqMessage)
    .filter(data => data.common?.createTime)
    .sort((a, b) => Number(BigInt(b.common?.createTime || '0') - BigInt(a.common?.createTime || '0')))

  return roomUserEvents[0]?.viewerCount || 0
})

const selectedCategory = ref<'total' | 'likes' | 'messages' | 'gifts' | 'follows'>('total')

const categories = [
  { key: 'total' as const, label: 'Overall', icon: 'i-lucide-trophy' },
  { key: 'likes' as const, label: 'Likes', icon: 'i-lucide-heart' },
  { key: 'messages' as const, label: 'Messages', icon: 'i-lucide-message-circle' },
  { key: 'gifts' as const, label: 'Gifts', icon: 'i-lucide-gift' },
  { key: 'follows' as const, label: 'Follows', icon: 'i-lucide-user-plus' }
]

// Compute leaderboard data from events
// Fix: Remove side effects from computed and handle undefined values properly
const leaderboardData = computed(() => {
  const userMap = new Map<string, LeaderboardUser>()
  let currentTotalLikes = 0

  events.value?.forEach((event) => {
    const { event: eventType, data } = event
    let user: WebcastChatMessage['user'] | WebcastLikeMessage['user'] | WebcastGiftMessage['user'] | null = null

    // Extract user data based on event type
    switch (eventType) {
      case 'chat':
        user = (data as WebcastChatMessage).user
        break
      case 'like': {
        // Fix: Wrap in braces to allow variable declarations
        user = (data as WebcastLikeMessage).user
        const likeData = data as WebcastLikeMessage
        if (likeData.totalLikeCount !== undefined) {
          currentTotalLikes = likeData.totalLikeCount
        }
        break
      }
      case 'gift':
        user = (data as WebcastGiftMessage).user
        break
      case 'follow':
        // Follow events might have different structure, using generic approach
        user = (data as { user?: typeof user }).user || null
        break
      default:
        return
    }

    if (!user?.uniqueId) return

    // Get or create user entry
    const userId = user.uniqueId
    if (!userMap.has(userId)) {
      userMap.set(userId, {
        userId: user.userId,
        uniqueId: userId,
        nickname: user.nickname || userId,
        profilePicture: user.profilePicture?.url?.[0],
        likes: 0,
        messages: 0,
        gifts: 0,
        follows: 0,
        totalScore: 0
      })
    }

    const userEntry = userMap.get(userId)!

    // Update counters based on event type
    switch (eventType) {
      case 'chat':
        userEntry.messages++
        break
      case 'like': {
        // Fix: Handle undefined likeCount with braces
        const likeCount = (data as WebcastLikeMessage).likeCount
        userEntry.likes += (typeof likeCount === 'number' ? likeCount : 1)
        break
      }
      case 'gift': {
        // Fix: Handle undefined repeatCount with braces
        const repeatCount = (data as WebcastGiftMessage).repeatCount
        userEntry.gifts += (typeof repeatCount === 'number' ? repeatCount : 1)
        break
      }
      case 'follow':
        userEntry.follows++
        break
    }

    // Calculate total score (weighted)
    userEntry.totalScore = userEntry.likes * 1
      + userEntry.messages * 2
      + userEntry.gifts * 10
      + userEntry.follows * 5
  })

  // Update totalLikes outside of computed
  nextTick(() => {
    totalLikes.value = currentTotalLikes
  })

  return Array.from(userMap.values())
})

// Sort data based on selected category
const sortedLeaderboard = computed(() => {
  const data = [...leaderboardData.value]

  switch (selectedCategory.value) {
    case 'total':
      return data.sort((a, b) => b.totalScore - a.totalScore)
    case 'likes':
      return data.sort((a, b) => b.likes - a.likes)
    case 'messages':
      return data.sort((a, b) => b.messages - a.messages)
    case 'gifts':
      return data.sort((a, b) => b.gifts - a.gifts)
    case 'follows':
      return data.sort((a, b) => b.follows - a.follows)
    default:
      return data
  }
})

// Get top performers
const topPerformers = computed(() => sortedLeaderboard.value.slice(0, 10))

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return '🥇'
    case 2: return '🥈'
    case 3: return '🥉'
    default: return `#${rank}`
  }
}

const getCurrentValue = (user: LeaderboardUser) => {
  switch (selectedCategory.value) {
    case 'total': return user.totalScore
    case 'likes': return user.likes
    case 'messages': return user.messages
    case 'gifts': return user.gifts
    case 'follows': return user.follows
    default: return 0
  }
}
</script>

<template>
  <div class="bg-blue-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
    <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
      <UIcon
        name="i-lucide-info"
        class="w-4 h-4"
      />
      Point Values
    </h3>
    <div class="grid grid-cols-2 gap-3 text-sm">
      <div class="flex justify-between">
        <span class="flex items-center gap-1">
          <UIcon
            name="i-lucide-heart"
            class="w-3 h-3 text-red-500"
          />
          Likes
        </span>
        <span class="font-semibold">1 pt</span>
      </div>
      <div class="flex justify-between">
        <span class="flex items-center gap-1">
          <UIcon
            name="i-lucide-message-circle"
            class="w-3 h-3 text-blue-500"
          />
          Messages
        </span>
        <span class="font-semibold">2 pts</span>
      </div>
      <div class="flex justify-between">
        <span class="flex items-center gap-1">
          <UIcon
            name="i-lucide-user-plus"
            class="w-3 h-3 text-green-500"
          />
          Follows
        </span>
        <span class="font-semibold">5 pts</span>
      </div>
      <div class="flex justify-between">
        <span class="flex items-center gap-1">
          <UIcon
            name="i-lucide-gift"
            class="w-3 h-3 text-purple-500"
          />
          Gifts
        </span>
        <span class="font-semibold">10 pts</span>
      </div>
    </div>
  </div>
  <!-- Leaderboard List -->
  <div class="space-y-3 max-h-96 overflow-y-auto py-2">
    <div
      v-for="(user, index) in topPerformers"
      :key="user.uniqueId"
      class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <div class="flex items-center gap-3">
        <!-- Rank -->
        <div class="w-8 text-center font-bold">
          {{ getRankIcon(index + 1) }}
        </div>

        <!-- Avatar -->
        <UAvatar
          :src="user.profilePicture"
          :alt="user.nickname"
          size="sm"
        />

        <!-- User Info -->
        <div>
          <p class="font-medium">
            {{ user.nickname }}
          </p>
          <p class="text-xs text-muted">
            @{{ user.uniqueId }}
          </p>
        </div>
      </div>

      <!-- Score -->
      <div class="text-right">
        <p class="font-bold text-lg">
          {{ getCurrentValue(user) }}
        </p>
        <p class="text-xs text-muted">
          {{ selectedCategory === 'total' ? 'points' : categories.find(c => c.key === selectedCategory)?.label.toLowerCase() }}
        </p>
      </div>
    </div>

    <div
      v-if="topPerformers.length === 0"
      class="text-center py-8 text-muted"
    >
      <p>No data available yet</p>
      <p class="text-sm">
        Start your stream to see the leaderboard!
      </p>
    </div>
  </div>
  <USeparator />

  <div class="grid grid-cols-4 gap-4 pt-4 border-t">
    <div class="text-center">
      <p class="text-lg font-bold">
        {{ new Intl.NumberFormat().format(totalLikes) }}
      </p>
      <p class="text-xs text-muted">
        Total Likes
      </p>
    </div>
    <div class="text-center">
      <p class="text-lg font-bold">
        {{ leaderboardData.reduce((sum, user) => sum + user.messages, 0) }}
      </p>
      <p class="text-xs text-muted">
        Total Messages
      </p>
    </div>
    <div class="text-center">
      <p class="text-lg font-bold">
        {{ leaderboardData.reduce((sum, user) => sum + user.gifts, 0) }}
      </p>
      <p class="text-xs text-muted">
        Total Gifts
      </p>
    </div>
    <div class="text-center">
      <p class="text-lg font-bold">
        {{ viewerCount }}
      </p>
      <p class="text-xs text-muted">
        Active Users
      </p>
    </div>
  </div>
</template>
