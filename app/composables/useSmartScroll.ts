export function useSmartScroll() {
  const isUserScrolling = ref(false)
  const scrollTimeout = ref<NodeJS.Timeout | null>(null)

  // Check if user is near the bottom of the container
  const isNearBottom = (container: HTMLElement, threshold = 50) => {
    const { scrollTop, scrollHeight, clientHeight } = container
    return scrollHeight - scrollTop - clientHeight < threshold
  }

  // Handle scroll events to detect user scrolling
  const handleScroll = () => {
    isUserScrolling.value = true

    // Clear existing timeout
    if (scrollTimeout.value) {
      clearTimeout(scrollTimeout.value)
    }

    // Reset scrolling state after user stops scrolling
    scrollTimeout.value = setTimeout(() => {
      isUserScrolling.value = false
    }, 1000) // 1 second delay
  }

  // Auto-scroll to bottom only if user isn't scrolling and was near bottom
  const scrollToBottom = (container: HTMLElement) => {
    if (container && (!isUserScrolling.value || isNearBottom(container))) {
      container.scrollTop = container.scrollHeight
    }
  }

  // Setup scroll listener
  const setupScrollListener = (container: HTMLElement) => {
    container.addEventListener('scroll', handleScroll)
  }

  // Cleanup scroll listener and timeout
  const cleanup = (container?: HTMLElement) => {
    if (container) {
      container.removeEventListener('scroll', handleScroll)
    }
    if (scrollTimeout.value) {
      clearTimeout(scrollTimeout.value)
    }
  }

  return {
    isUserScrolling: readonly(isUserScrolling),
    isNearBottom,
    scrollToBottom,
    setupScrollListener,
    cleanup
  }
}
