<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const store = useLiveStore()
const { connect, disconnect } = store
const { username, loading } = storeToRefs(store)

const schema = z.object({
  username: z.string().min(1, 'Username is required')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  username: ''
})

function onSubmit(event: FormSubmitEvent<Schema>) {
  username.value = event.data.username
  connect()
}

async function onReset() {
  if (loading.value) return
  disconnect()
  state.username = ''
  username.value = ''
}
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
          :disabled="loading || !!username"
        />
      </UFormField>

      <div class="flex gap-2">
        <UButton
          type="submit"
          class="w-24 flex items-center justify-center"
          variant="subtle"
          :disabled="loading || !!username"
        >
          Connect
        </UButton>
        <UButton
          type="reset"
          color="neutral"
          class="w-24 flex items-center justify-center"
          variant="subtle"
          :disabled="loading || !username"
          @click="onReset"
        >
          Reset
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>
