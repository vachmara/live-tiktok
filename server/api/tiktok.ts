import { TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector'

let clients: Set<any> = new Set()
let connection: TikTokLiveConnection | null = null
let isConnecting = false
const USERNAME = 'vachmara'

// Message deduplication
const seenMessages = new Map<string, number>()
const MESSAGE_EXPIRY = 30000 // 30 seconds

function cleanupOldMessages() {
  const now = Date.now()
  for (const [key, timestamp] of seenMessages) {
    if (now - timestamp > MESSAGE_EXPIRY) {
      seenMessages.delete(key)
    }
  }
}

function isDuplicateMessage(type: string, content: any): boolean {
  cleanupOldMessages()

  let messageKey: string

  if (type === 'chat') {
    messageKey = `chat:${content.user?.uniqueId}:${content.comment}:${Math.floor(content.timestamp / 1000)}`
  } else if (type === 'like') {
    messageKey = `like:${content.user?.uniqueId}:${Math.floor(content.timestamp / 5000)}` // Group likes within 5 seconds
  } else {
    return false
  }

  if (seenMessages.has(messageKey)) {
    return true
  }

  seenMessages.set(messageKey, content.timestamp)
  return false
}

function broadcastToClients(message: any) {
  const messageStr = JSON.stringify(message)

  clients.forEach(client => {
    try {
      client.send(messageStr)
    } catch (error) {
      console.error('Error sending message to client:', error)
      clients.delete(client)
    }
  })
}

async function initializeConnection() {
  if (connection || isConnecting) return

  isConnecting = true
  connection = new TikTokLiveConnection(USERNAME, {
    enableExtendedGiftInfo: true
  })

  // Set up chat event listener
  connection.on(WebcastEvent.CHAT, (chatData) => {
    const message = {
      type: 'chat',
      user: {
        uniqueId: chatData.user?.uniqueId,
        nickname: chatData.user?.nickname,
        profilePictureUrl: chatData.user?.backgroundImgUrl
      },
      comment: chatData.comment,
      timestamp: Date.now()
    }

    if (!isDuplicateMessage('chat', message)) {
      broadcastToClients(message)
    }
  })

  // Set up like event listener
  connection.on(WebcastEvent.LIKE, (likeData) => {
    const likeMessage = {
      type: 'like',
      user: likeData.user,
      count: likeData.likeCount,
      timestamp: Date.now()
    }

    if (!isDuplicateMessage('like', likeMessage)) {
      broadcastToClients(likeMessage)
    }
  })

  try {
    await connection.connect()
  } catch (error) {
    console.error('Connection error:', error)
    connection = null
    isConnecting = false

    broadcastToClients({
      type: 'error',
      message: `Failed to connect to ${USERNAME}: ${error}`
    })
  }
}

export default defineWebSocketHandler({
  async open(peer) {
    clients.add(peer)
    console.log(`Client connected. Total clients: ${clients.size}`)

    // Initialize connection only if it doesn't exist
    if (!connection && !isConnecting) {
      await initializeConnection()
    } else if (connection) {
      // Send connection status to new client
      try {
        peer.send(JSON.stringify({
          type: 'connected',
          username: USERNAME,
          message: `Connected to ${USERNAME}`
        }))
      } catch (error) {
        console.error('Error sending initial message to client:', error)
      }
    }
  },

  async close(peer) {
    clients.delete(peer)
    console.log(`Client disconnected. Total clients: ${clients.size}`)

    // Only disconnect if no clients are left
    if (clients.size === 0 && connection) {
      connection.disconnect()
      connection = null
      isConnecting = false
      console.log('No clients left, disconnected from TikTok')
    }
  }
})
