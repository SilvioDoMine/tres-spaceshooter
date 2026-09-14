import { createSpatialAudio } from '~/utils/spatialAudio';
import { playUiSynth } from '~/utils/uiSynth';
import { playHeartSynth } from '~/utils/heartSynth';

// Efeitos da partida: nome usado no playSound -> arquivo. Registrados já na tela de
// loading, para tocarem desde o primeiro frame (ex.: levelup da seleção inicial de talentos).
export const GAME_SOUNDS = {
    'levelup': '/sounds/levelup.wav',
    'shoot-player': '/sounds/shoot-player.wav',
    'player-death': '/sounds/player-death.wav',
    'shoot2': '/sounds/shoot2.wav',
    'shoot7': '/sounds/shoot7.wav',
    'shoot1': '/sounds/shoot1.wav',
    'hit-soft1': '/sounds/hit-soft1.wav',
    'hit-soft2': '/sounds/hit-soft2.wav',
    'hit-soft3': '/sounds/hit-soft3.wav',
    'hit-soft4': '/sounds/hit-soft3.wav',
    'hit-soft5': '/sounds/hit-soft3.wav',
    'enemy-death1': '/sounds/enemy-death1.wav',
    'enemy-death2': '/sounds/enemy-death2.wav',
    'enemy-death3': '/sounds/enemy-death3.wav',
    'hit-hard1': '/sounds/hit-hard1.wav',
    'hit-hard2': '/sounds/hit-hard2.wav',
    'hit-hard3': '/sounds/hit-hard3.wav',
    'hit-hard4': '/sounds/hit-hard4.wav',
    'hit-hard5': '/sounds/hit-hard5.wav',
};

const defaultAudioSettings = () => ({
    volumeGeneral: 100,
    volumeBackground: 100,
    volumeEffects: 100,
    // Microinterações da interface (sons de toque/hover e vibração no mobile)
    volumeUi: 70,
    uiSoundsEnabled: true,
    hapticsEnabled: true,
});

// Carrega configurações do localStorage ou cria padrão
const loadAudioSettings = () => {
    const saved = localStorage.getItem('audioSettings');

    if (!saved) {
        // Não existe, cria padrão
        const defaultSettings = defaultAudioSettings();
        localStorage.setItem('audioSettings', JSON.stringify(defaultSettings));
        return defaultSettings;
    }

    try {
        // Mescla com o padrão para configurações salvas antes de chaves novas existirem
        return { ...defaultAudioSettings(), ...JSON.parse(saved) };
    } catch (error) {
        console.error('Failed to parse audio settings from localStorage:', error);
        // Se der erro no parse, retorna padrão
        return defaultAudioSettings();
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
// Buffers decodificados por URL (preenchidos pela tela de loading) e músicas já baixadas
const decodedByUrl = new Map();
const musicObjectUrls = new Map();
const isInitialized = ref(false);
const lastHeartSound = {};

export function useAudio() {
    let spatialAudio = null;
    function updateSpatialAudio(intensity, phase, notice, active) {
        if (!audioContext || audioContext.state !== 'running') return;
        if (!spatialAudio && active) spatialAudio = createSpatialAudio(audioContext);
        spatialAudio?.update(intensity, phase, notice, getGeneralVolume()*getEffectsVolume(), active);
    }
    function stopSpatialAudio() { spatialAudio?.dispose(); spatialAudio = null; }
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
        if (isInitialized.value) { if(audioContext?.state === 'suspended') await audioContext.resume(); return; }

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
        if (soundBuffers.has(name)) return;
        if (!audioContext) await init();

        try {
            if (!decodedByUrl.has(url)) {
                decodedByUrl.set(url, fetch(url).then(response => response.arrayBuffer()).then(data => audioContext.decodeAudioData(data)));
            }
            soundBuffers.set(name, await decodedByUrl.get(url));
            console.log(`Sound loaded: ${name}`);
        } catch (error) {
            decodedByUrl.delete(url);
            console.error(`Failed to load sound ${name}:`, error);
        }
    }

    // Decodifica um efeito já baixado. O contexto pode nascer suspenso (sem gesto do
    // usuário): decodificar funciona assim mesmo e o init() o retoma no primeiro toque.
    async function registerSoundData(url, arrayBuffer) {
        if (!audioContext) await init();
        if (!audioContext || decodedByUrl.has(url)) return;

        const pending = audioContext.decodeAudioData(arrayBuffer);
        decodedByUrl.set(url, pending);
        let buffer;
        try {
            buffer = await pending;
        } catch (error) {
            decodedByUrl.delete(url);
            throw error;
        }

        for (const [name, soundUrl] of Object.entries(GAME_SOUNDS)) {
            if (soundUrl === url && !soundBuffers.has(name)) soundBuffers.set(name, buffer);
        }
    }

    // Garante todos os efeitos da partida (reaproveita o que o preload já decodificou)
    function loadGameSounds() {
        return Promise.all(Object.entries(GAME_SOUNDS).map(([name, url]) => loadSound(name, url)));
    }

    // Guarda a música em memória; playBackgroundMusic toca dela sem baixar de novo
    function registerMusicData(url, arrayBuffer) {
        if (musicObjectUrls.has(url)) return;
        musicObjectUrls.set(url, URL.createObjectURL(new Blob([arrayBuffer], { type: 'audio/mpeg' })));
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

    // Som sintetizado do coração de cura: 'pull' durante o voo, 'heal' ao entrar na nave
    function playHeartSound(kind, duration) {
        if (!audioContext || audioContext.state !== 'running') return;
        // Vários corações no mesmo quadro tocam um som só
        const now = audioContext.currentTime;
        if (now - (lastHeartSound[kind] ?? -1) < 0.06) return;
        lastHeartSound[kind] = now;
        playHeartSynth(audioContext, kind, getGeneralVolume() * getEffectsVolume(), duration);
    }

    // Som sintetizado de microinteração da UI (tap, hover, toggle, modal...)
    function playUiSound(kind) {
        const settings = audioSettings.value;
        if (!settings.uiSoundsEnabled) return;

        const volume = getGeneralVolume() * (settings.volumeUi / 100);
        if (volume <= 0) return;

        // Chamado dentro de um gesto do usuário: pode criar/destravar o contexto aqui
        if (!audioContext) init();
        if (!audioContext) return;
        if (audioContext.state === 'suspended') audioContext.resume();

        playUiSynth(audioContext, kind, volume);
    }

    // Vibração curta no mobile (Android; o Safari do iOS não suporta a Vibration API)
    function vibrate(pattern) {
        if (!audioSettings.value.hapticsEnabled) return;
        if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
        navigator.vibrate(pattern);
    }

    const supportsVibration = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

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
            backgroundMusic = new Audio(musicObjectUrls.get(url) ?? url);
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
        const defaultSettings = defaultAudioSettings();

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
        loadGameSounds,
        registerSoundData,
        registerMusicData,
        playSound,
        playHeartSound,
        updateSpatialAudio,
        stopSpatialAudio,

        // UI microinteractions
        playUiSound,
        vibrate,
        supportsVibration,

        // Background music
        playBackgroundMusic,
        stopBackgroundMusic,
        startBackgroundMusicAbafado,
        stopBackgroundMusicAbafado,
    };
}
