<script lang="ts" setup>
import type { WebcastChatMessage, WebcastLikeMessage } from 'tiktok-live-connector'

const chatContainer = ref<HTMLElement | null>(null)
const store = useLiveStore()
const { events } = storeToRefs(store)
const { scrollToBottom, setupScrollListener, cleanup } = useSmartScroll()
const toast = useToast()

const messages = computed(() => events.value?.filter(data => data.event === 'chat')?.map(data => data.data as WebcastChatMessage))

const likeEvents = computed(() => events.value?.filter(data => data.event === 'like')?.map(data => data.data as WebcastLikeMessage))

// Watch for new like events and show toast notifications
watch(likeEvents, (newLikes, oldLikes) => {
  if (newLikes && oldLikes && newLikes.length > oldLikes.length) {
    const newLikeEvent = newLikes[newLikes.length - 1]
    if (newLikeEvent) {
      const likeCount = newLikeEvent.likeCount || 1
      const username = newLikeEvent.user?.nickname || newLikeEvent.user?.uniqueId || 'Someone'
      const avatarUrl = newLikeEvent.user?.profilePicture?.url?.[0]

      toast.add({
        title: '❤️ New Like!',
        description: `${username} liked the stream${likeCount > 1 ? ` (${likeCount} likes)` : ''}`,
        icon: 'i-lucide-heart',
        avatar: avatarUrl ? { src: avatarUrl, alt: username } : undefined
      })
    }
  }
}, { immediate: false })

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
      <div>
        <h2 class="text-lg font-semibold">
          Chat Messages
        </h2>
        <p class="text-sm text-muted">
          Displaying {{ messages.length }} chat messages from TikTok Live.
        </p>
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
