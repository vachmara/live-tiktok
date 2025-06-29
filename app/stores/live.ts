import type { TikTokLiveConnection } from 'tiktok-live-connector'

export const useLiveStore = defineStore('live', () => {
  const connection = ref<TikTokLiveConnection | null>(null)
  const username = ref<string>('')
  const loading = ref<boolean>(false)

  return { loading, connection, username }
})
