export const useLiveStore = defineStore('live', () => {
  const connection = ref<EventSource | null>(null)
  const username = ref<string>('')
  const loading = ref<boolean>(false)

  function connect() {
    if (!username.value) return
    loading.value = true
    try {
      connection.value = new EventSource(`/live?username=${username.value}`)
    } catch (error) {
      console.error('Connection error:', error)
    } finally {
      loading.value = false
    }
  }

  function disconnect() {
    if (connection.value) {
      connection.value.close()
      connection.value = null
    }
  }

  return { loading, connection, username, connect, disconnect }
})
