const audioSettings = ref({
    volumeGeneral: 100,
    volumeBackground: 100,
    volumeEffects: 100,
});

watch(audioSettings, (newSettings) => {
    backgroundMusic.volume = (newSettings.volumeGeneral / 100) * (newSettings.volumeBackground / 100);
}, { deep: true });

// Estado do áudio
let audioContext = null;
let backgroundMusic = null;
const soundBuffers = new Map();
const isInitialized = ref(false);

export function useAudio() {
    function getGeneralVolume() {
        console.log('Getting general volume:', audioSettings.value.volumeGeneral / 100);
        return audioSettings.value.volumeGeneral / 100;
    }

    function getBackgroundVolume() {
        console.log('Getting background volume:', audioSettings.value.volumeBackground / 100);
        return audioSettings.value.volumeBackground / 100;
    }

    function getEffectsVolume() {
        console.log('Getting effects volume:', audioSettings.value.volumeEffects / 100);
        return audioSettings.value.volumeEffects / 100;
    }

    function setGeneralVolume(volume) {
        audioSettings.value.volumeGeneral = volume;
        if (backgroundMusic) {
            backgroundMusic.volume = volume * audioSettings.value.volumeBackground;
        }
    }

    function setBackgroundVolume(volume) {
        audioSettings.value.volumeBackground = volume;
        if (backgroundMusic) {
            backgroundMusic.volume = audioSettings.value.volumeGeneral * volume;
        }
    }

    function setEffectsVolume(volume) {
        audioSettings.value.volumeEffects = volume;
    }

    // Inicializa o sistema de áudio
    async function init() {
        if (isInitialized.value) return;

        try {
            // Web Audio API para efeitos sonoros
            const AudioContextClass = window.AudioContext || (window).webkitAudioContext;
            audioContext = new AudioContextClass();
            isInitialized.value = true;
            console.log('Audio system initialized');
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }

    // Carrega um efeito sonoro
    async function loadSound(name, url) {
        if (!audioContext) await init();

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            soundBuffers.set(name, audioBuffer);
            console.log(`Sound loaded: ${name}`);
        } catch (error) {
            console.error(`Failed to load sound ${name}:`, error);
        }
    }

    // Toca um efeito sonoro (permite múltiplos simultâneos)
    function playSound(name, volumeMultiplier = 1.0) {
        if (!audioContext || !soundBuffers.has(name)) {
            console.warn(`Sound not loaded: ${name}`);
            return;
        }

        try {
            const source = audioContext.createBufferSource();
            const gainNode = audioContext.createGain();

            source.buffer = soundBuffers.get(name);

            console.log(`Playing sound: ${name} with multiplier: ${volumeMultiplier}`);
            console.log('General Volume:', getGeneralVolume());
            console.log('Effects Volume:', getEffectsVolume());
            // Volume = geral * efeitos * multiplicador
            const finalVolume =
                getGeneralVolume() *
                getEffectsVolume() *
                volumeMultiplier;

            gainNode.gain.value = finalVolume;

            source.connect(gainNode);
            gainNode.connect(audioContext.destination);
            source.start(0);
        } catch (error) {
            console.error(`Failed to play sound ${name}:`, error);
        }
    }

    // Inicia música de fundo (HTML Audio API - melhor para loops longos)
    async function playBackgroundMusic(url, loop = true) {
        try {
            if (backgroundMusic) {
                backgroundMusic.pause();
                backgroundMusic.currentTime = 0;
            }

            backgroundMusic = new Audio(url);
            backgroundMusic.loop = loop;
            backgroundMusic.volume = getGeneralVolume() * getBackgroundVolume();

            // Aguarda interação do usuário (browsers requerem isso)
            const playPromise = backgroundMusic.play();

            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn('Background music autoplay blocked, waiting for user interaction:', error);
                });
            }

            return backgroundMusic;
        } catch (error) {
            console.error('Failed to play background music:', error);
        }
    }

    // Para música de fundo
    function stopBackgroundMusic() {
        if (backgroundMusic) {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
        }
    }

    return {
        // Volume controls
        audioSettings,
        getGeneralVolume,
        getBackgroundVolume,
        getEffectsVolume,
        setGeneralVolume,
        setBackgroundVolume,
        setEffectsVolume,

        // Audio system
        init,
        isInitialized,

        // Sound effects
        loadSound,
        playSound,

        // Background music
        playBackgroundMusic,
        stopBackgroundMusic,
    };
}
