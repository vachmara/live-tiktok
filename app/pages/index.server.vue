<script lang="ts" setup>
import { TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector'

const tiktokUsername = 'robybilly00'
const connection = new TikTokLiveConnection(tiktokUsername)

// Connect to the chat (await can be used as well)
connection.connect().then((state) => {
  console.info(`Connected to roomId ${state.roomId}`)
}).catch((err) => {
  console.error('Failed to connect', err)
})

// Define the events that you want to handle
// In this case we listen to chat messages (comments)
connection.on(WebcastEvent.CHAT, (data) => {
  console.log(`${data.user!.uniqueId} (userId:${data.user!.uniqueId}) writes: ${data.comment}`)
})

// And here we receive gifts sent to the streamer
connection.on(WebcastEvent.GIFT, (data) => {
  console.log(`${data.user!.uniqueId} (userId:${data.user!.userId}) sends ${data.giftId}`)
})

onUnmounted(() => {
  // Disconnect when the component is unmounted
  connection.disconnect().then(() => {
    console.info('Disconnected from TikTok Live')
  }).catch((err) => {
    console.error('Failed to disconnect', err)
  })
})
</script>

<template>
  <UContainer />
</template>
