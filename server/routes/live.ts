import {
  TikTokLiveConnection,
  WebcastEvent,
  ControlEvent,
  type ClientEventMap
} from 'tiktok-live-connector'

export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event)
  const { username } = getQuery(event)

  const connection = new TikTokLiveConnection(username as string, {
    processInitialData: true,
    fetchRoomInfoOnConnect: true,
    enableExtendedGiftInfo: true,
    enableRequestPolling: true,
    requestPollingIntervalMs: 1000
  })

  try {
    await connection.connect()
  } catch (error) {
    console.error('Connection error:', error)
    return eventStream.send()
  }

  // Create a type-safe event handler using the ClientEventMap
  const createEventHandler = <K extends keyof ClientEventMap>(eventType: K) => {
    return async (data: Parameters<ClientEventMap[K]>[0]) => {
      await eventStream.push({
        event: eventType,
        data
      })
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

  // Expose connection methods through custom events
  eventStream.onClosed(async () => {
    await connection.disconnect()
  })

  return eventStream.send()
})
