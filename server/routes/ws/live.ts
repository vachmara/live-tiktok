import {
  TikTokLiveConnection,
  WebcastEvent,
  ControlEvent,
  type ClientEventMap
} from 'tiktok-live-connector'

export default defineWebSocketHandler({

  open(peer) {
    console.log('[ws] TikTok Live connection opened', peer.id)
  },

  async message(peer, message) {
    if (message.text().includes('ping')) {
      peer.send(JSON.stringify({ pong: true }))
      return
    }
    const data = JSON.parse(message.text())
    const { username } = data
    console.log('[ws] TikTok Live connection request', username)
    if (!username) {
      peer.send(JSON.stringify({ error: 'Username is required' }))
      return
    }

    if (peer.context.tiktokConnection) {
      console.log('[ws] Closing existing TikTok Live connection')

      await (peer.context.tiktokConnection as TikTokLiveConnection)?.disconnect()
      delete peer.context.tiktokConnection
    }

    const connection = new TikTokLiveConnection(username)

    try {
      await connection.connect()
      peer.send(JSON.stringify({ status: 'connected' }))
    } catch (error) {
      console.error('Connection error:', error)
      peer.send(JSON.stringify({ error: 'Failed to connect to TikTok Live' }))
      return
    }

    // Create a type-safe event handler using the ClientEventMap
    const createEventHandler = <K extends keyof ClientEventMap>(eventType: K) => {
      return async (data: Parameters<ClientEventMap[K]>[0]) => {
        peer.send(JSON.stringify({
          event: eventType,
          data
        }))
      }
    }

    // Register handlers for all WebcastEvent types
    Object.values(WebcastEvent).forEach((eventType) => {
      connection.on(eventType, createEventHandler(eventType))
    })

    // Register handlers for ControlEvent types for connection monitoring
    Object.values(ControlEvent).forEach((eventType) => {
      connection.on(eventType, createEventHandler(eventType))
    })

    // Store connection reference on peer for cleanup
    peer.context.tiktokConnection = connection
  },

  async close(peer, _) {
    console.log('[ws] TikTok Live connection closed', peer.id)
    await (peer.context.tiktokConnection as TikTokLiveConnection)?.disconnect()
  },

  error(_, error) {
    console.log('[ws] TikTok Live connection error', error)
  }
})
