import type { ClientEventMap } from 'tiktok-live-connector'

// Extract the data type from EventHandler<T> to get T
type ExtractEventData<T> = T extends (event: infer U) => void | Promise<void> ? U : never

// Create a map of event names to their data types
export type ClientEventDataMap = {
  [K in keyof ClientEventMap]: ExtractEventData<ClientEventMap[K]>
}

export interface ReceivedEvents {
  event: keyof ClientEventMap
  data: ClientEventDataMap[keyof ClientEventMap]
}
