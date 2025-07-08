<script lang="ts" setup>
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'
import type { WebcastLikeMessage } from 'tiktok-live-connector'

const canvasRef = ref<HTMLCanvasElement>()
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let mixer: THREE.AnimationMixer
let monster: THREE.Group
const animationActions: Record<string, THREE.AnimationAction> = {}
const clock = new THREE.Clock()

// Game state
const maxHP = ref(1000)
const currentHP = ref(1000)
const isLoading = ref(true)
const loadingProgress = ref(0)
const animationsLoaded = ref(0)
const isPlaying = ref(false)

// Connect to live store
const store = useLiveStore()
const { events, debug } = storeToRefs(store)

// Available animations to load
const animationFiles = [
  'Dying.glb',
  'Hit Reaction.glb',
  'Hit To Body.glb',
  'Kidney Hit.glb',
  'Standing Death Forward 01.glb'
]

const totalAnimations = ref(animationFiles.length)

// HP bar computed properties
const hpPercentage = computed(() => (currentHP.value / maxHP.value) * 100)
const hpColor = computed(() => {
  if (hpPercentage.value > 60) return 'bg-green-500'
  if (hpPercentage.value > 30) return 'bg-yellow-500'
  return 'bg-red-500'
})

// Init Three.js scene
const initThreeJS = () => {
  if (!canvasRef.value) return

  // Scene setup
  scene = new THREE.Scene()
  // Set Background color more lightly
  scene.background = new THREE.Color(0xe8ab69)

  // Camera setup - zoomed in closer
  camera = new THREE.PerspectiveCamera(
    75,
    canvasRef.value.clientWidth / canvasRef.value.clientHeight,
    0.1,
    1000
  )
  camera.position.set(0, 0.5, 3.5) // Moved closer and adjusted height

  // Renderer setup
  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true
  })
  renderer.setSize(canvasRef.value.clientWidth, canvasRef.value.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMappingExposure = 1.2

  // Enhanced lighting for better visuals
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
  directionalLight.position.set(5, 10, 5)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  scene.add(directionalLight)

  // Add some atmospheric lighting
  const pointLight = new THREE.PointLight(0xff4444, 0.5, 100)
  pointLight.position.set(-5, 5, -5)
  scene.add(pointLight)

  // Load the monster model and animations
  loadMonster()

  // Start animation loop
  animate()
}

// Load monster model
const loadMonster = () => {
  const loader = new GLTFLoader()

  // Load main monster model
  loader.load(
    '/monster.glb',
    (gltf) => {
      monster = gltf.scene
      scene.add(monster)

      // Set up animation mixer
      mixer = new THREE.AnimationMixer(monster)

      // Enable shadows
      monster.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })

      // Center and scale the model - larger scale for better visibility
      const box = new THREE.Box3().setFromObject(monster)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())

      monster.position.sub(center)
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = 3 / maxDim // Increased scale from 2 to 3
      monster.scale.setScalar(scale)

      // Load all animation files
      loadAnimations()
    },
    (progress) => {
      loadingProgress.value = (progress.loaded / progress.total) * 50 // 50% for model
    },
    (error) => {
      console.error('Error loading monster model:', error)
      isLoading.value = false
    }
  )
}

// Load animations
const loadAnimations = async () => {
  const loader = new GLTFLoader()

  for (let i = 0; i < animationFiles.length; i++) {
    const fileName = animationFiles[i]
    if (!fileName) continue // Skip if fileName is undefined

    try {
      const gltf = await new Promise<GLTF>((resolve, reject) => {
        loader.load(
          `/animation/${fileName}`,
          resolve,
          undefined,
          reject
        )
      })

      if (gltf.animations.length > 0 && gltf.animations[0]) {
        const animationName = fileName.replace('.glb', '') // Remove optional chaining since we checked above
        const action = mixer.clipAction(gltf.animations[0])
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
        animationActions[animationName] = action
      }

      animationsLoaded.value++
      loadingProgress.value = 50 + (animationsLoaded.value / totalAnimations.value) * 50
    } catch (error) {
      console.error(`Error loading animation ${fileName}:`, error)
      animationsLoaded.value++
    }
  }

  isLoading.value = false
  console.log('Loaded animations:', Object.keys(animationActions))
}

// Start the game
const startGame = () => {
  isPlaying.value = true
  resetHP()
}

// Reset the game
const resetGame = () => {
  isPlaying.value = false
  resetHP()

  // Stop all animations
  Object.values(animationActions).forEach((action) => {
    action.stop()
  })

  console.log('Game reset')
}

// Deal damage to the monster
const dealDamage = (amount: number) => {
  if (!isPlaying.value) return // Only deal damage when game is playing

  currentHP.value = Math.max(0, currentHP.value - amount)

  // Check if monster is dead
  if (currentHP.value <= 0) {
    triggerDeathAnimation()
    isPlaying.value = false // Stop game when monster dies
  }
}

// Heal the monster
const healMonster = (amount: number) => {
  currentHP.value = Math.min(maxHP.value, currentHP.value + amount)
}

// Reset monster HP
const resetHP = () => {
  currentHP.value = maxHP.value
}

// Trigger a random hit animation
const triggerRandomHitAnimation = () => {
  const hitAnimations = [
    'Hit Reaction',
    'Hit To Body',
    'Kidney Hit'
  ]

  const randomHit = hitAnimations[Math.floor(Math.random() * hitAnimations.length)] || 'Hit Reaction'
  playAnimation(randomHit)
}

// Trigger the death animation
const triggerDeathAnimation = () => {
  const deathAnimations = ['Dying', 'Standing Death Forward 01']
  const randomDeath = deathAnimations[Math.floor(Math.random() * deathAnimations.length)] || 'Dying'
  playAnimation(randomDeath)
}

// Play a specific animation
const playAnimation = (animationName: string) => {
  if (!isPlaying.value) return // Only play animations when game is active

  if (animationActions[animationName]) {
    // Stop all other animations
    Object.values(animationActions).forEach((action) => {
      action.stop()
    })

    // Play the requested animation
    const action = animationActions[animationName]
    action.reset().play()

    console.log(`Playing animation: ${animationName}`)
  }
}

// Animation loop
const animate = () => {
  requestAnimationFrame(animate)

  // Update mixer
  if (mixer) {
    mixer.update(clock.getDelta())
  }

  renderer.render(scene, camera)
}

// Handle window resize
const handleResize = () => {
  if (!canvasRef.value || !camera || !renderer) return

  const width = canvasRef.value.clientWidth
  const height = canvasRef.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// Get available animations
const getAvailableAnimations = () => {
  return Object.keys(animationActions)
}

// Watch for like events and deal damage - only when game is playing
watch(events, (newEvents) => {
  if (!newEvents || !isPlaying.value) return

  const likeEvents = newEvents.filter(event => event.event === 'like')
  if (likeEvents.length > 0) {
    // Get the latest like event
    const latestLike = likeEvents[likeEvents.length - 1]
    const likeData = latestLike?.data as WebcastLikeMessage
    const likeCount = likeData.likeCount || 1

    // Deal damage based on like count
    dealDamage(likeCount * 2) // 2 damage per like

    // Trigger random hit animation
    triggerRandomHitAnimation()
  }
}, { deep: true })

onMounted(() => {
  initThreeJS()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (renderer) {
    renderer.dispose()
  }
})

// Expose methods for parent components
defineExpose({
  playAnimation,
  getAvailableAnimations,
  dealDamage,
  healMonster,
  resetHP,
  startGame,
  resetGame,
  currentHP: readonly(currentHP),
  maxHP: readonly(maxHP),
  isPlaying: readonly(isPlaying)
})
</script>

<template>
  <div class="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
    <!-- Loading indicator -->
    <div
      v-if="isLoading"
      class="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-10"
    >
      <div class="text-center text-white">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
        <p>Loading Monster...</p>
        <p class="text-sm opacity-75">
          {{ Math.round(loadingProgress) }}%
        </p>
        <p class="text-xs opacity-50">
          Animations: {{ animationsLoaded }}/{{ totalAnimations }}
        </p>
      </div>
    </div>

    <!-- Game Controls -->
    <div class="absolute top-4 right-4 z-20 space-x-2">
      <UButton
        v-if="!isPlaying"
        color="success"
        size="sm"
        :disabled="isLoading"
        @click="startGame"
      >
        ▶️ Play
      </UButton>
      <UButton
        v-if="isPlaying || currentHP <= 0"
        color="info"
        size="sm"
        @click="resetGame"
      >
        🔄 Reset
      </UButton>
    </div>

    <!-- HP Bar -->
    <div class="absolute top-4 left-4 right-24 z-20">
      <div class="bg-black bg-opacity-50 rounded-lg p-3">
        <div class="flex items-center justify-between mb-2">
          <span class="text-white font-bold">Monster HP</span>
          <div class="flex items-center space-x-2">
            <span class="text-white text-sm">{{ currentHP }}/{{ maxHP }}</span>
            <div
              v-if="isPlaying"
              class="w-2 h-2 bg-green-500 rounded-full animate-pulse"
            />
            <div
              v-else
              class="w-2 h-2 bg-gray-500 rounded-full"
            />
          </div>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            class="h-full transition-all duration-500 ease-out"
            :class="hpColor"
            :style="{ width: `${hpPercentage}%` }"
          />
        </div>
        <div
          v-if="currentHP <= 0"
          class="text-red-500 text-center mt-2 font-bold animate-pulse"
        >
          💀 MONSTER DEFEATED! 💀
        </div>
        <div
          v-else-if="!isPlaying && !isLoading"
          class="text-yellow-500 text-center mt-2 font-bold"
        >
          🎮 Press Play to Start!
        </div>
      </div>
    </div>

    <!-- Three.js Canvas -->
    <canvas
      ref="canvasRef"
      class="w-full h-full"
      style="display: block;"
    />

    <!-- Controls overlay -->
    <div class="absolute bottom-4 left-4 text-white text-sm bg-black bg-opacity-50 px-3 py-2 rounded">
      <p v-if="isPlaying">
        💖 Likes deal damage!
      </p>
      <p v-else>
        🎮 Game paused
      </p>
      <p class="text-xs opacity-75">
        {{ Object.keys(animationActions).length }} animations loaded
      </p>
    </div>

    <!-- Debug controls -->
    <div
      v-if="debug"
      class="absolute bottom-4 right-4 space-y-2"
    >
      <UButton
        size="xs"
        color="error"
        :disabled="!isPlaying"
        @click="dealDamage(10)"
      >
        Deal Damage
      </UButton>
      <UButton
        size="xs"
        color="success"
        :disabled="!isPlaying"
        @click="healMonster(20)"
      >
        Heal
      </UButton>
      <UButton
        size="xs"
        color="warning"
        :disabled="!isPlaying"
        @click="playAnimation('Kidney Hit')"
      >
        Test Animation
      </UButton>
    </div>
  </div>
</template>
