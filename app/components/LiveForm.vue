<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const store = useLiveStore()
const { close, open, send, status } = store
const { username } = storeToRefs(store)

const schema = z.object({
  username: z.string().min(1, 'Username is required')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  username: ''
})

function onSubmit(event: FormSubmitEvent<Schema>) {
  username.value = event.data.username
  open()
  console.log('[LiveForm] Connecting to TikTok Live with username:', username.value)
  send(JSON.stringify({ username: username.value }))
}

async function onReset() {
  close()
  state.username = ''
  username.value = ''
}

const isOpen = computed(() => status === 'OPEN')
</script>

<template>
  <UCard variant="outline">
    <UForm
      :schema="schema"
      :state="state"
      class="space-y-4"
      @submit="onSubmit"
    >
      <UFormField
        label="TikTok Username"
        name="username"
        description="Enter the TikTok username you want to connect to."
      >
        <UInput
          v-model="state.username"
          placeholder="vachmara"
          :disabled="isOpen"
        />
      </UFormField>

      <div class="flex gap-2">
        <UButton
          type="submit"
          class="w-24 flex items-center justify-center"
          variant="subtle"
          :disabled="isOpen"
        >
          Connect
        </UButton>
        <UButton
          type="reset"
          color="neutral"
          class="w-24 flex items-center justify-center"
          variant="subtle"
          :disabled="!isOpen"
          @click="onReset"
        >
          Reset
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>
