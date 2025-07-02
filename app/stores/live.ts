export const useLiveStore = defineStore('live', () => {
  const username = ref<string>('')
  const toast = useToast()

  const websocket = useWebSocket('/ws/live', {
    immediate: false,
    heartbeat: true,
    async onMessage(ws, event) {
      try {
        const data = JSON.parse(event.data)
        if (data.error) {
          console.error('WebSocket error:', data.error)
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
          console.log(`[ws] Event received: ${data.event}`, data.data)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
        toast.add({
          title: 'Error',
          description: 'Failed to parse WebSocket message'
        })
        ws.close()
      }
    }
  })

  return { username, ...websocket }
})
