<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'

const messages = ref<any[]>([])
const connectionStatus = ref<'disconnected' | 'connected' | 'error'>('disconnected')
const statusMessage = ref('Disconnected')

// Game state
const gameActive = ref(false)
const gameTimeLeft = ref(0)
const likesCount = ref(0)
const gameResults = ref<any[]>([])
let gameTimer: NodeJS.Timeout | null = null
let ws: WebSocket | null = null

const connectWebSocket = () => {
  ws = new WebSocket('ws://localhost:3000/api/tiktok')

  ws.onopen = () => {
    connectionStatus.value = 'connected'
    statusMessage.value = 'Connected'
    console.log('WebSocket connected')
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    console.log('Received:', data)

    if (data.type === 'connected') {
      connectionStatus.value = 'connected'
      statusMessage.value = `Connected to ${data.username}`
    } else if (data.type === 'chat') {
      messages.value.unshift(data)

      // Check for game commands
      if (data.comment && data.comment.toLowerCase().includes('!startgame') && !gameActive.value) {
        startGame(data.username)
      }

      // Keep only last 50 messages
      if (messages.value.length > 50) {
        messages.value = messages.value.slice(0, 50)
      }
    } else if (data.type === 'like' && gameActive.value) {
      // Count likes during the game
      likesCount.value++
    } else if (data.type === 'error') {
      connectionStatus.value = 'error'
      statusMessage.value = `Error: ${data.message}`
    }
  }

  ws.onclose = () => {
    connectionStatus.value = 'disconnected'
    statusMessage.value = 'Disconnected'
    console.log('WebSocket disconnected')
  }

  ws.onerror = (error) => {
    connectionStatus.value = 'error'
    statusMessage.value = 'Connection Error'
    console.error('WebSocket error:', error)
  }
}

const startGame = (username: string) => {
  if (gameActive.value) return

  gameActive.value = true
  gameTimeLeft.value = 60
  likesCount.value = 0

  console.log(`Game started by ${username}!`)

  // Start countdown timer
  gameTimer = setInterval(() => {
    gameTimeLeft.value--

    if (gameTimeLeft.value <= 0) {
      endGame(username)
    }
  }, 1000)
}

const endGame = (username: string) => {
  if (!gameActive.value) return

  gameActive.value = false

  if (gameTimer) {
    clearInterval(gameTimer)
    gameTimer = null
  }

  // Save result
  const result = {
    username,
    likes: likesCount.value,
    timestamp: new Date(),
    id: Date.now()
  }

  gameResults.value.unshift(result)

  // Keep only top 10 results
  gameResults.value = gameResults.value
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 10)

  console.log(`Game ended! ${username} got ${likesCount.value} likes!`)
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

onMounted(() => {
  if (!ws){
    connectWebSocket()
  }
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
  if (gameTimer) {
    clearInterval(gameTimer)
  }
})
</script>

<template>
  <UContainer>
    <div class="py-10 flex flex-col gap-5">

      <!-- Chat message -->
      <UCard variant="subtle">
        <template #header>
          <h2 class="text-xl font-bold">Chat Messages</h2>
        </template>

        <div class="space-y-2">
          <UCard
            v-for="message in messages"
            :key="message.id"
            variant="subtle"
            class="p-3"
          >
            <div class="flex items-center gap-2 mb-1">
              <UAvatar
                :name="message.user.nickname"
                :src="message.user?.profilePicture?.url?.[0]"
              />
              <span class="font-medium">{{ message.user.nickname }}</span>
              <span class="text-xs text-gray-500">{{ new Date(message.timestamp).toLocaleTimeString() }}</span>
            </div>
            <div>{{ message.comment }}</div>
          </UCard>
        </div>
      </UCard>

      <!-- Game Status -->
      <UCard variant="subtle">
        <template #header>
          <h2 class="text-xl font-bold">Like Game</h2>
        </template>

        <div class="space-y-4">
          <div v-if="!gameActive" class="text-center">
            <p class="mb-2">Type <code>!startgame</code> in chat to start a 60-second like challenge!</p>
            <UBadge color="neutral">Waiting for game to start...</UBadge>
          </div>

          <div v-else class="text-center">
            <div class="text-3xl font-bold text-green-500 mb-2">
              {{ formatTime(gameTimeLeft) }}
            </div>
            <div class="text-xl mb-2">
              Likes: <span class="font-bold text-blue-500">{{ likesCount }}</span>
            </div>
            <UBadge color="success">Game Active!</UBadge>
          </div>
        </div>
      </UCard>

      <!-- Leaderboard -->
      <UCard  variant="subtle" v-if="gameResults.length > 0">
        <template #header>
          <h2 class="text-xl font-bold">Leaderboard</h2>
        </template>

        <div class="space-y-2">
          <div
            v-for="(result, index) in gameResults"
            :key="result.id"
            class="flex items-center justify-between p-3 rounded border"
            :class="index === 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'"
          >
            <div class="flex items-center gap-3">
              <UBadge
                color="neutral"
              >
                #{{ index + 1 }}
              </UBadge>
              <span class="font-medium">{{ result.username }}</span>
            </div>
            <div class="text-right">
              <div class="font-bold">{{ result.likes }} likes</div>
              <div class="text-xs text-gray-500">
                {{ new Date(result.timestamp).toLocaleTimeString() }}
              </div>
            </div>
          </div>
        </div>
      </UCard>


    </div>
  </UContainer>
</template>
