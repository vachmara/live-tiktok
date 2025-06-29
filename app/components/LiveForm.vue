<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const store = useLiveStore()
const { connect, disconnect } = store
const { username: usernameStored } = storeToRefs(store)
const loading = ref<boolean>(false)

const schema = z.object({
  username: z.string().min(1, 'Username is required')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  username: ''
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  usernameStored.value = event.data.username
  try {
    await connect()
  } catch (error) {
    console.error('Connection failed:', error)
  } finally {
    loading.value = false
  }
}

async function onReset() {
  loading.value = true
  state.username = ''
  usernameStored.value = ''
  try {
    await disconnect()
  } catch (error) {
    console.error('Disconnection failed:', error)
  } finally {
    loading.value = false
  }
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
          :disabled="loading || !!usernameStored"
        />
      </UFormField>

      <div class="flex gap-2">
        <UButton
          type="submit"
          class="w-24 flex items-center justify-center"
          variant="subtle"
          :disabled="loading || !!usernameStored"
        >
          Connect
        </UButton>
        <UButton
          type="reset"
          color="neutral"
          class="w-24 flex items-center justify-center"
          variant="subtle"
          :disabled="loading || !usernameStored"
          @click="onReset"
        >
          Reset
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>
