<script setup lang="ts">
import type { TalentDefinition } from '~/data/talents';

// Sem `talent` a carta aparece virada (verso), para talentos ainda não obtidos.
withDefaults(defineProps<{ talent?: TalentDefinition | null; stars?: number; isNew?: boolean }>(), {
  talent: null,
  stars: 0,
  isNew: false,
});
</script>

<template>
  <!-- O wrapper é o container: tudo dentro escala em cqw com a largura da carta -->
  <div class="tcard-wrap">
    <div v-if="talent" class="tcard" :class="`tcard--${talent.rarity}`">
      <div class="tcard__art">
        <LobbyTalentsIcon :icon="talent.icon" class="tcard__icon" />
        <span v-if="talent.badge" class="tcard__badge">{{ talent.badge }}</span>
      </div>

      <div class="tcard__ribbon">
        <span>{{ talent.name }}</span>
      </div>

      <div v-if="stars > 0" class="tcard__stars" :aria-label="`${stars} de ${talent.maxStars} estrelas`">
        <svg v-for="n in stars" :key="n" class="tcard__star" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 1.8 15 8.4l7.2.7-5.4 4.8 1.6 7.1L12 17.3 5.6 21l1.6-7.1L1.8 9.1 9 8.4z"/>
        </svg>
      </div>

      <span v-if="isNew" class="tcard__new">NOVO!</span>
    </div>

    <div v-else class="tcard tcard--back" aria-label="Talento ainda não obtido">
      <div class="tcard__art">
        <svg class="tcard__back" viewBox="0 0 60 80" aria-hidden="true">
          <path d="M8 4v8M4 8h8M52 4v8M48 8h8M8 68v8M4 72h8M52 68v8M48 72h8" stroke="rgba(255,255,255,.45)" stroke-width="2" stroke-linecap="round"/>
          <path d="M30 8 54 40 30 72 6 40z" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="3" stroke-linejoin="round"/>
          <path d="M30 19 46 40 30 61 14 40z" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.25)" stroke-width="2" stroke-linejoin="round"/>
          <text x="30" y="49" text-anchor="middle" font-family="'Lilita One', sans-serif" font-size="26" fill="rgba(255,255,255,.55)">?</text>
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tcard-wrap{container-type:inline-size;width:100%}
.tcard{
  --frame:#eef2f5;--frame-dark:#8d99a4;--frame-light:#fff;
  --art-light:#fbfcfd;--art-dark:#c3cdd5;--ribbon:#e6ecf0;--ribbon-dark:#a3afb9;
  position:relative;aspect-ratio:3/4;padding:5cqw 5cqw 6cqw;border-radius:9cqw;
  background:linear-gradient(var(--frame-light),var(--frame) 35%);
  box-shadow:0 3cqw 0 var(--frame-dark),0 5cqw 9cqw rgba(0,0,0,.3);
}
.tcard--rare{--frame:#6cc0fa;--frame-dark:#2767ad;--frame-light:#b8e4ff;--art-light:#5ab6f6;--art-dark:#1d56a3;--ribbon:#7ccaff;--ribbon-dark:#3a86d6}
.tcard--epic{--frame:#d38cf8;--frame-dark:#7a36bd;--frame-light:#f1d3ff;--art-light:#c870f3;--art-dark:#6526ae;--ribbon:#e39bff;--ribbon-dark:#a452e0}
.tcard--legendary{--frame:#ffd65c;--frame-dark:#b86a00;--frame-light:#fff3bf;--art-light:#ffc53d;--art-dark:#d9690b;--ribbon:#ffe07a;--ribbon-dark:#f09a1a}
.tcard--back{--frame:#a9afba;--frame-dark:#6c7280;--frame-light:#c7ccd4;--art-light:#9ea4af;--art-dark:#7b818d}

.tcard__art{
  position:relative;height:100%;overflow:hidden;border-radius:6cqw;border:1.8cqw solid var(--frame-dark);
  background:
    repeating-conic-gradient(from -6deg at 50% 40%,rgba(255,255,255,.13) 0 10deg,transparent 10deg 30deg),
    radial-gradient(circle at 50% 40%,var(--art-light) 0,var(--art-dark) 78%);
}
.tcard__icon{position:absolute;left:50%;top:38%;width:68cqw;height:68cqw;translate:-50% -50%;filter:drop-shadow(0 2cqw 0 rgba(0,0,0,.25))}
.tcard__badge{position:absolute;top:4cqw;right:4cqw;width:20cqw;height:20cqw;display:grid;place-items:center;border-radius:50%;background:#fff;border:1.5cqw solid #3a3a4a;font:10cqw/1 'Lilita One',sans-serif;color:#3a3a4a}
.tcard__back{position:absolute;inset:6cqw;width:calc(100% - 12cqw);height:calc(100% - 12cqw)}

.tcard__ribbon{
  position:absolute;left:1.5cqw;right:1.5cqw;bottom:6cqw;min-height:24cqw;padding:2cqw 5cqw;
  display:flex;align-items:center;justify-content:center;border-radius:4cqw;
  background:linear-gradient(var(--ribbon),var(--ribbon-dark));border:1.5cqw solid var(--frame-dark);
  box-shadow:0 2cqw 0 rgba(0,0,0,.25),inset 0 1.5cqw rgba(255,255,255,.35);
}
.tcard__ribbon span{
  font:11cqw/1 'Lilita One',sans-serif;color:#fff;text-align:center;
  text-shadow:-.8cqw -.8cqw 0 #2a1f3d,.8cqw -.8cqw 0 #2a1f3d,-.8cqw .8cqw 0 #2a1f3d,.8cqw .8cqw 0 #2a1f3d,0 1.6cqw 0 #2a1f3d;
}

.tcard__stars{position:absolute;top:-9cqw;left:0;right:0;display:flex;justify-content:center}
.tcard__star{width:18cqw;height:18cqw;margin:0 -1.4cqw;fill:#ffd23f;stroke:#a85f00;stroke-width:1.6;stroke-linejoin:round;filter:drop-shadow(0 1cqw 0 rgba(0,0,0,.3))}

.tcard__new{position:absolute;top:10cqw;left:-5cqw;rotate:-12deg;padding:1cqw 4cqw;border-radius:3cqw;background:#ff4d5e;color:#fff;font:10cqw 'Lilita One',sans-serif;box-shadow:0 1.5cqw 0 #a3162a}
</style>
