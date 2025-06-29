<script setup lang="ts">
const { connection } = storeToRefs(useLiveStore())
watchEffect(() => {
  if (!connection.value) return
  connection.value.onmessage = (event) => {
    console.log('Message from server:', event.data)
  }
})
</script>

<template>
  <UContainer class="flex flex-col py-8 gap-5 items-center justify-center">
    <LiveForm />
  </UContainer>
</template>
