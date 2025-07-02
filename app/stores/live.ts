import type { ReceivedEvents } from '@/types'

const ALLOWED_EVENTS = [
  'chat',
  'member',
  'gift',
  'roomUser',
  'like',
  'streamEnd',
  'disconnected',
  'connected',
  'error'
]

export const useLiveStore = defineStore('live', () => {
  const username = ref<string>()
  const max_events = ref<number>(500)

  const events = ref<ReceivedEvents[]>([])
  const debug = ref<boolean>(false)

  const toast = useToast()

  const websocket = useWebSocket('/ws/live', {
    immediate: false,
    heartbeat: true,
    async onMessage(ws, event) {
      try {
        const data = JSON.parse(event.data)
        if (data.error) {
          console.error('WebSocket error:', data.error)
          username.value = undefined
          toast.add({
            title: 'Error',
            description: data.error
          })
          ws.close()
          return
        }

        if (data.status === 'connected') {
          username.value = data.username
          console.log('[ws] Connected to TikTok Live:', username.value)
        } else if (data.event) {
          if (debug.value) console.log(`[ws] Event received: ${data.event}`, data.data)
          addEvent(data)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
        toast.add({
          title: 'Error',
          description: 'Failed to parse WebSocket message'
        })
        username.value = undefined
        ws.close()
      }
    }
  })

  const addEvent = (event: ReceivedEvents) => {
    if (!ALLOWED_EVENTS.includes(event.event)) {
      if (debug.value) console.warn(`[ws] Event not allowed: ${event.event}`)
      return
    }
    events.value.push(event)
    if (events.value.length > max_events.value) events.value.shift()
  }

  return { username, events, max_events, debug, ...websocket }
})
