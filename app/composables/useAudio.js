// Carrega configurações do localStorage ou cria padrão
const loadAudioSettings = () => {
    const saved = localStorage.getItem('audioSettings');

    if (!saved) {
        // Não existe, cria padrão
        const defaultSettings = {
            volumeGeneral: 100,
            volumeBackground: 100,
            volumeEffects: 100,
        };
        localStorage.setItem('audioSettings', JSON.stringify(defaultSettings));
        return defaultSettings;
    }

    try {
        return JSON.parse(saved);
    } catch (error) {
        console.error('Failed to parse audio settings from localStorage:', error);
        // Se der erro no parse, retorna padrão
        return {
            volumeGeneral: 100,
            volumeBackground: 100,
            volumeEffects: 100,
        };
    }
};

const audioSettings = ref(loadAudioSettings());

watch(audioSettings, (newSettings) => {
    // Salva no localStorage sempre que mudar
    localStorage.setItem('audioSettings', JSON.stringify(newSettings));

    // Atualiza volume do gain node (Web Audio API) se existir
    if (backgroundMusicGain) {
        backgroundMusicGain.gain.value = (newSettings.volumeGeneral / 100) * (newSettings.volumeBackground / 100);
    }
}, { deep: true });

// Estado do áudio
let audioContext = null;
let backgroundMusic = null;
let backgroundMusicSource = null;
let backgroundMusicGain = null;
let backgroundMusicFilter = null;
const soundBuffers = new Map();
const isInitialized = ref(false);

export function useAudio() {
    function getGeneralVolume() {
        return audioSettings.value.volumeGeneral / 100;
    }

    function getBackgroundVolume() {
        return audioSettings.value.volumeBackground / 100;
    }

    function getEffectsVolume() {
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
    function playSound(name, volumeMultiplier = 1.0, pitch = 1.0) {
        if (!audioContext || !soundBuffers.has(name)) {
            console.warn(`Sound not loaded: ${name}`);
            return;
        }

        try {
            const source = audioContext.createBufferSource();
            const gainNode = audioContext.createGain();

            source.buffer = soundBuffers.get(name);

            // console.log(`Playing sound: ${name} with multiplier: ${volumeMultiplier}`);
            // Volume = geral * efeitos * multiplicador
            const finalVolume =
                getGeneralVolume() *
                getEffectsVolume() *
                volumeMultiplier;

            gainNode.gain.value = finalVolume;

            source.playbackRate.value = pitch;

            source.connect(gainNode);
            gainNode.connect(audioContext.destination);
            source.start(0);
        } catch (error) {
            console.error(`Failed to play sound ${name}:`, error);
        }
    }

    // Inicia música de fundo com Web Audio API (permite filtros e efeitos)
    async function playBackgroundMusic(url, loop = true) {
        try {
            if (!audioContext) await init();

            // Para música anterior se existir
            if (backgroundMusic) {
                backgroundMusic.pause();
                backgroundMusic.currentTime = 0;
            }

            // Cria elemento Audio
            backgroundMusic = new Audio(url);
            backgroundMusic.loop = loop;
            backgroundMusic.crossOrigin = 'anonymous';

            // Cria nodes do Web Audio API
            backgroundMusicSource = audioContext.createMediaElementSource(backgroundMusic);
            backgroundMusicGain = audioContext.createGain();
            backgroundMusicFilter = audioContext.createBiquadFilter();

            // Configura o filtro lowpass (inicialmente desligado - frequência alta)
            backgroundMusicFilter.type = 'lowpass';
            backgroundMusicFilter.frequency.value = 22050; // Frequência alta = sem filtro
            backgroundMusicFilter.Q.value = 1;

            // Configura volume
            backgroundMusicGain.gain.value = getGeneralVolume() * getBackgroundVolume();

            // Conecta: source -> filter -> gain -> destination
            backgroundMusicSource.connect(backgroundMusicFilter);
            backgroundMusicFilter.connect(backgroundMusicGain);
            backgroundMusicGain.connect(audioContext.destination);

            // Aguarda interação do usuário (browsers requerem isso)
            const playPromise = backgroundMusic.play();

            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn('Background music autoplay blocked, waiting for user interaction:', error);
                });
            }

            console.log('Background music initialized with Web Audio API filters');
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

    function startBackgroundMusicAbafado(fadeDuration = 1) {
        if (!backgroundMusicFilter || !backgroundMusicGain) return;

        const now = audioContext.currentTime;
        const targetVolume = (getGeneralVolume() * getBackgroundVolume()) * 0.4;

        // Cancela agendamentos anteriores
        backgroundMusicGain.gain.cancelScheduledValues(now);
        backgroundMusicFilter.frequency.cancelScheduledValues(now);

        // Fade-out do volume atual para o volume abafado
        backgroundMusicGain.gain.setValueAtTime(backgroundMusicGain.gain.value, now);
        backgroundMusicGain.gain.linearRampToValueAtTime(targetVolume, now + fadeDuration);

        // Fade do filtro: frequência alta → baixa (abafa gradualmente)
        backgroundMusicFilter.frequency.setValueAtTime(backgroundMusicFilter.frequency.value, now);
        backgroundMusicFilter.frequency.linearRampToValueAtTime(500, now);

        // Aumenta Q gradualmente para efeito de "caixa"
        backgroundMusicFilter.Q.setValueAtTime(backgroundMusicFilter.Q.value, now);
        backgroundMusicFilter.Q.linearRampToValueAtTime(2, now);

        console.log(`Background music muffled (bathroom effect) - fade in ${fadeDuration}s`);
    }

    function stopBackgroundMusicAbafado(fadeDuration = 1) {
        if (!backgroundMusicFilter || !backgroundMusicGain) return;

        const now = audioContext.currentTime;
        const targetVolume = getGeneralVolume() * getBackgroundVolume();

        // Cancela agendamentos anteriores
        backgroundMusicGain.gain.cancelScheduledValues(now);
        backgroundMusicFilter.frequency.cancelScheduledValues(now);

        // Fade-in do volume abafado para o volume normal
        backgroundMusicGain.gain.setValueAtTime(backgroundMusicGain.gain.value, now);
        backgroundMusicGain.gain.linearRampToValueAtTime(targetVolume, now + fadeDuration);

        // Fade do filtro: frequência baixa → alta (clareia gradualmente)
        backgroundMusicFilter.frequency.setValueAtTime(backgroundMusicFilter.frequency.value, now);
        backgroundMusicFilter.frequency.linearRampToValueAtTime(22050, now + fadeDuration);

        // Reduz Q gradualmente (remove efeito de "caixa")
        backgroundMusicFilter.Q.setValueAtTime(backgroundMusicFilter.Q.value, now);
        backgroundMusicFilter.Q.linearRampToValueAtTime(1, now + fadeDuration);

        console.log(`Background music restored (normal) - fade out ${fadeDuration}s`);
    }

    // Reseta as configurações de áudio para padrão
    function resetAudioSettings() {
        const defaultSettings = {
            volumeGeneral: 100,
            volumeBackground: 100,
            volumeEffects: 100,
        };

        audioSettings.value = defaultSettings;
        localStorage.setItem('audioSettings', JSON.stringify(defaultSettings));

        // Atualiza volume da música se estiver tocando
        if (backgroundMusicGain) {
            backgroundMusicGain.gain.value = 1.0; // 100% * 100% = 1.0
        }

        console.log('Audio settings reset to default');
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
        resetAudioSettings,

        // Audio system
        init,
        isInitialized,

        // Sound effects
        loadSound,
        playSound,

        // Background music
        playBackgroundMusic,
        stopBackgroundMusic,
        startBackgroundMusicAbafado,
        stopBackgroundMusicAbafado,
    };
}
