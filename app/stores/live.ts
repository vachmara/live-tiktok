import { TikTokLiveConnection } from 'tiktok-live-connector'

export const useLiveStore = defineStore('live', () => {
  const connection = ref<TikTokLiveConnection | null>(null)
  const username = ref<string>('')

  async function connect() {
    if (!username.value) {
      throw new Error('Username is required')
    }
    if (connection.value) {
      await connection.value.disconnect()
    }
    connection.value = new TikTokLiveConnection(username.value)
    await connection.value.connect()
  }

  async function disconnect() {
    if (connection.value) {
      await connection.value.disconnect()
      connection.value = null
    }
  }

  onBeforeUnmount(async () => {
    if (connection.value) {
      await connection.value.disconnect()
    }
  })

  return { connection, username, connect, disconnect }
})
