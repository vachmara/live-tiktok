<script lang="ts" setup>
import type { WebcastChatMessage } from 'tiktok-live-connector'

const chatContainer = ref<HTMLElement | null>(null)
const store = useLiveStore()
const { events } = storeToRefs(store)
const { scrollToBottom, setupScrollListener, cleanup } = useSmartScroll()

const messages = computed(() => events.value?.filter(data => data.event === 'chat')?.map(data => data.data as WebcastChatMessage))

watch(messages, () => {
  nextTick(() => {
    if (chatContainer.value) {
      scrollToBottom(chatContainer.value)
    }
  })
}, { immediate: true })

onMounted(() => {
  if (chatContainer.value) {
    setupScrollListener(chatContainer.value)
  }
})

onUnmounted(() => {
  cleanup(chatContainer.value || undefined)
})
</script>

<template>
  <UCard
    variant="outline"
    :ui="{
      body: 'sm:p-0 p-0'
    }"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold">
            Chat Messages
          </h2>
          <p class="text-sm text-muted">
            Displaying {{ messages.length }} chat messages from TikTok Live.
          </p>
        </div>
        <USlideover
          side="bottom"
          title="🏆 Live Leaderboard"
          description="Top engaged viewers from the stream"
        >
          <UButton
            label="Leaderboard"
            color="neutral"
            variant="subtle"
          />

          <template #body>
            <ChatLeaderboard />
          </template>
        </USlideover>
      </div>
    </template>
    <div
      ref="chatContainer"
      class="h-[40vh] overflow-y-auto p-4"
    >
      <UChatMessage
        v-for="(message, index) in messages"
        :id="message.common?.msgId || `user-${index}`"
        :key="index"
        variant="subtle"
        :avatar="{
          src: message.user?.profilePicture?.url?.[0] || '',
          alt: message.user?.nickname || ''
        }"
        :content="message.comment"
        role="user"
      />
    </div>
  </UCard>
</template>
