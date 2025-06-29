<script lang="ts" setup>
import { TikTokLiveConnection } from 'tiktok-live-connector'

const { username, loading, connection } = storeToRefs(useLiveStore())

async function connect() {
  if (!username.value) return

  loading.value = true

  try {
    connection.value = new TikTokLiveConnection(username.value)
    await connection.value.connect()
  } catch (error) {
    console.error('Connection failed:', error)
  } finally {
    loading.value = false
  }
}

async function disconnect() {
  if (!connection.value) return
  loading.value = true
  try {
    await connection.value.disconnect()
    connection.value = null
    username.value = ''
  } catch (error) {
    console.error('Disconnection failed:', error)
  } finally {
    loading.value = false
  }
}

watch(username, async (newUsername) => {
  if (newUsername) {
    await connect()
  } else {
    await disconnect()
  }
})
</script>

<template>
  <div>
    SSR - {{ username }} - {{ connection }}
  </div>
</template>
