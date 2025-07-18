<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { USwitch } from '#components'

const store = useLiveStore()
const { close, open, send } = store
const { username, debug } = storeToRefs(store)

const schema = z.object({
  username: z.string().min(1, 'Username is required')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  username: username.value || ''
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
</script>

<template>
  <UCard variant="outline">
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold">
            Connect to TikTok Live
          </h2>
          <p class="text-sm text-muted">
            Enter your TikTok username to start receiving live events.
          </p>
        </div>

        <UModal>
          <UButton
            icon="i-lucide-settings"
            color="neutral"
            variant="subtle"
          />

          <template #content>
            <div class="p-4">
              <UFormField
                label="Debug Mode"
                description="Enable debug mode to see raw event data in the console."
              >
                <USwitch
                  v-model="debug"
                  :label="debug ? 'Enabled' : 'Disabled'"
                />
              </UFormField>
            </div>
          </template>
        </UModal>
      </div>
    </template>
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
          :disabled="!!username"
        />
      </UFormField>

      <div class="flex gap-2">
        <UButton
          type="submit"
          class="w-24 flex items-center justify-center"
          variant="subtle"
          :disabled="!!username"
        >
          Connect
        </UButton>
        <UButton
          type="reset"
          color="neutral"
          class="w-24 flex items-center justify-center"
          variant="subtle"
          :disabled="!username"
          @click="
            onReset"
        >
          Reset
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>
