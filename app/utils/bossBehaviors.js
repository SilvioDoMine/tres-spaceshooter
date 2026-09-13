import { finalBossPhase } from './combatPatterns.js';

// Movimento e ações especiais dos bosses dos capítulos 2 e 3 e das suas versões em miniatura.
// Os tiros ficam em useEnemyAttacks/attackProfile, que leem o estado escrito aqui.

/** COLMEIA: caça (avança devagar atirando) → torreta (para, lança caças e dispara salvas). */
export const HIVE = Object.freeze({ huntDuration: 8, stopDistance: 5, launchDelay: .6, launchCount: 4, launchInterval: .35, turretMinimum: 3, droneDamage: 70, holdFireInTurret: false });
/** Mini-colmeia: o mesmo ciclo, com 2 caças e sem atirar enquanto lança. */
export const MINI_HIVE = Object.freeze({ huntDuration: 7, stopDistance: 6, launchDelay: .5, launchCount: 2, launchInterval: .45, turretMinimum: 2, droneDamage: 35, holdFireInTurret: true });
/** Caça kamikaze: sai rápido do hangar, desacelera, persegue acelerando e curva menos quanto mais rápido. */
export const HIVE_DRONE = Object.freeze({ launchSpeed: 11, launchTime: .35, cruiseSpeed: 3.2, maxSpeed: 10.5, acceleration: 3.2, turnFactor: 7, maxTurnRate: 3.5, lifetime: 6 });
/**
 * HARPIA: plana rápido ao redor do jogador → acelera e vira 180° → pausa.
 * Voltas ímpares: rajada seguida. Voltas pares: carrega e executa a investida (longa, larga e rápida).
 * Listas por fase (1, 2, 3).
 */
export const HARPY = Object.freeze({
  glideSpeed: 7.5, glideTurnRate: 2.2, orbitNear: 9, orbitFar: 12, glideDuration: Object.freeze([4.5, 4, 3.5]),
  turnSpeed: 11, turnTime: .7, brake: 28,
  // Grace periods: parada e sem atirar entre uma etapa e outra (os pós-ataque são longos para punir a Harpia)
  graceAfterTurn: .8, graceAfterBurst: 2.2, recover: 2.8,
  burstShots: Object.freeze([12, 14, 18]), burstTimeout: 10,
  // Pegar a investida é quase um hitkill
  dashCharge: 1.3, dashLockAt: .65, dashLength: 26, dashSpeed: 30, dashHitRadius: 2.2, dashDamage: 350,
});
/** Mini-harpia: o mesmo ciclo, mais lenta, com rajada curta e investida menor. */
export const MINI_HARPY = Object.freeze({
  glideSpeed: 5.5, glideTurnRate: 2.4, orbitNear: 7, orbitFar: 10, glideDuration: Object.freeze([4, 4, 4]),
  turnSpeed: 8, turnTime: .6, brake: 24,
  graceAfterTurn: .7, graceAfterBurst: 1, recover: 1.2,
  burstShots: Object.freeze([4, 4, 4]), burstTimeout: 4,
  dashCharge: 1.1, dashLockAt: .65, dashLength: 14, dashSpeed: 20, dashHitRadius: 1.1, dashDamage: 40,
});
export const BASTION_SPIN = Object.freeze({ calm: .7, enraged: 1.1 });
export const COLOSSUS_ESCORTS = Object.freeze({ every: 11, count: 2, max: 3, reactorExposed: 1.35 });

// Baias dos hangares no casco da Colmeia (ângulo no plano local XZ, raio em múltiplos do tamanho; ver buildHive).
// As da frente saem primeiro.
export const HANGAR_LAUNCH_ORDER = Object.freeze([Math.PI * 7 / 6, Math.PI * 11 / 6, Math.PI * 5 / 6, Math.PI / 6]);
export const HANGAR_RADIUS = .76;

// Gira a direção de voo em direção a `want`, no máximo `maxTurn` radianos
function steer(flight, want, maxTurn) {
  const current = Math.atan2(flight.dir.z, flight.dir.x);
  const wanted = Math.atan2(want.z, want.x) - current;
  const diff = Math.atan2(Math.sin(wanted), Math.cos(wanted));
  const angle = current + Math.max(-maxTurn, Math.min(maxTurn, diff));
  flight.dir = { x: Math.cos(angle), z: Math.sin(angle) };
}

function rotate(flight, angle) {
  const next = Math.atan2(flight.dir.z, flight.dir.x) + angle;
  flight.dir = { x: Math.cos(next), z: Math.sin(next) };
}

// Rumo visual (EnemyManager): o nariz é o -Z local
const headingOf = dir => Math.atan2(-dir.x, -dir.z);

export function createBossBehaviors({ enemyManager, activeEnemies, playerPosition, applyCollisionDamage }) {
  function toPlayer(enemy) {
    const dx = playerPosition.value.x - enemy.position.x;
    const dz = playerPosition.value.z - enemy.position.z;
    return { dx, dz, d: Math.hypot(dx, dz) || 1e-6 };
  }

  // Mantém uma faixa de distância do jogador enquanto circula devagar
  function orbit(enemy, dt, near, far, strafe) {
    const { dx, dz, d } = toPlayer(enemy);
    enemy.orbitTime = (enemy.orbitTime || 0) + dt;
    const radial = d > far ? 1 : d < near ? -1 : 0;
    const side = Math.sin(enemy.orbitTime * .5) * strafe;
    const length = Math.max(1, Math.hypot(radial, side));
    enemy.position.x += (dx * radial - dz * side) / d / length * enemy.speed * dt;
    enemy.position.z += (dz * radial + dx * side) / d / length * enemy.speed * dt;
    return toPlayer(enemy).d;
  }

  // Encostar no boss machuca, mas o boss não se destrói (a trava de i-frames evita dano contínuo)
  function contact(enemy, distance) {
    if (distance <= enemy.size * .6) applyCollisionDamage(enemy.onHitDamage);
  }

  function liveSummons(enemy) {
    return activeEnemies.value.filter(e => e.summonerId === enemy.id && e.state !== 'dying').length;
  }

  function summon(enemy, type, count, max) {
    const amount = Math.min(count, Math.max(0, max - liveSummons(enemy)));
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = enemy.size * .8;
      enemyManager.spawnEnemy(type, {
        position: { x: enemy.position.x + Math.cos(angle) * radius, y: 0, z: enemy.position.z + Math.sin(angle) * radius },
        delay: .6,
        overrides: { summonerId: enemy.id },
      });
    }
  }

  // O casco encara o jogador (EnemyManager): local -Z é a frente e local +X fica à direita dela
  function launchDrone(enemy, index, config) {
    const { dx, dz, d } = toPlayer(enemy);
    const forward = { x: dx / d, z: dz / d };
    const angle = HANGAR_LAUNCH_ORDER[index % HANGAR_LAUNCH_ORDER.length];
    const lx = Math.cos(angle), lz = Math.sin(angle);
    const out = { x: -lx * forward.z - lz * forward.x, z: lx * forward.x - lz * forward.z };
    const dirX = out.x * .7 + forward.x * .7, dirZ = out.z * .7 + forward.z * .7;
    const norm = Math.hypot(dirX, dirZ) || 1;
    return enemyManager.spawnEnemy('hiveDrone', {
      position: { x: enemy.position.x + out.x * HANGAR_RADIUS * enemy.size, y: 0, z: enemy.position.z + out.z * HANGAR_RADIUS * enemy.size },
      delay: 0,
      state: 'active',
      overrides: { summonerId: enemy.id, onHitDamage: config.droneDamage, launchDirection: { x: dirX / norm, z: dirZ / norm } },
    });
  }

  function hiveCycle(enemy, dt, config) {
    const state = enemy.hive ??= { mode: 'hunt', timer: config.huntDuration, launched: 0, launchTimer: 0 };
    // Grace period depois de cada disparo (useEnemyAttacks liga recoilTimer): parada, apontando para o tiro
    if (enemy.recoilTimer > 0) enemy.recoilTimer = Math.max(0, enemy.recoilTimer - dt);
    const recoiling = enemy.recoilTimer > 0 && enemy.recoilDirection;

    if (state.mode === 'hunt') {
      const { dx, dz, d } = toPlayer(enemy);
      if (!recoiling && d > config.stopDistance) {
        enemy.position.x += dx / d * enemy.speed * dt;
        enemy.position.z += dz / d * enemy.speed * dt;
      }
      state.timer -= dt;
      if (state.timer <= 0) {
        Object.assign(state, { mode: 'turret', timer: config.turretMinimum, launched: 0, launchTimer: config.launchDelay });
        // Recomeça a mira: o primeiro tiro carregado vem depois das portas abrirem
        enemy.attackClock = { remaining: config.launchDelay + 1, volley: 0, charging: false };
        enemy.attackCharge = 0;
      }
    } else {
      // Estacionário enquanto os caças vivem
      state.timer -= dt;
      if (state.launched < config.launchCount) {
        state.launchTimer -= dt;
        if (state.launchTimer <= 0) {
          launchDrone(enemy, state.launched, config);
          state.launched += 1;
          state.launchTimer = config.launchInterval;
        }
      } else if (state.timer <= 0 && liveSummons(enemy) === 0) {
        Object.assign(state, { mode: 'hunt', timer: config.huntDuration });
        enemy.attackClock = { remaining: 1, volley: 0, charging: false };
        enemy.attackCharge = 0;
      }
    }

    enemy.hiveMode = state.mode;
    enemy.visualHeading = recoiling ? headingOf(enemy.recoilDirection) : undefined;
    enemy.hangarOpen = state.mode === 'turret';
    enemy.holdFire = config.holdFireInTurret && state.mode === 'turret';
    contact(enemy, toPlayer(enemy).d);
  }

  function harpyCycle(enemy, dt, config) {
    const phase = finalBossPhase(enemy);
    const { dx, dz, d } = toPlayer(enemy);
    const toward = { x: dx / d, z: dz / d };
    const harpy = enemy.harpy ??= {
      mode: 'glide', timer: config.glideDuration[0], cycle: 0, orbitSign: 1,
      speed: config.glideSpeed, dir: { x: -toward.z, z: toward.x }, turned: 0, dashDir: toward, traveled: 0,
    };
    const setMode = (mode, timer) => { harpy.mode = mode; harpy.timer = timer; };
    const resetAim = remaining => { enemy.attackClock = { remaining, volley: 0, charging: false }; enemy.attackCharge = 0; };

    if (harpy.mode === 'glide') {
      // Circula como um planador fugindo: tangente ao jogador, corrigindo a distância aos poucos
      const correction = d < config.orbitNear ? -1 : d > config.orbitFar ? 1 : 0;
      steer(harpy, {
        x: -toward.z * harpy.orbitSign + toward.x * correction * .8,
        z: toward.x * harpy.orbitSign + toward.z * correction * .8,
      }, config.glideTurnRate * dt);
      harpy.speed += (config.glideSpeed - harpy.speed) * Math.min(1, dt * 2);
      harpy.timer -= dt;
      if (harpy.timer <= 0) {
        setMode('turn', config.turnTime);
        harpy.turned = 0;
      }
    } else if (harpy.mode === 'turn') {
      // Acelera e vira 180° (abrindo para fora da órbita)
      const step = Math.min(Math.PI - harpy.turned, Math.PI / config.turnTime * dt);
      rotate(harpy, step * harpy.orbitSign);
      harpy.turned += step;
      harpy.speed += (config.turnSpeed - harpy.speed) * Math.min(1, dt * 4);
      if (harpy.turned >= Math.PI - 1e-6) {
        harpy.orbitSign *= -1;
        harpy.cycle += 1;
        setMode('settle', config.graceAfterTurn);
      }
    } else if (harpy.mode === 'settle') {
      // Grace period: freia e se ajeita antes de atacar (voltas ímpares: rajada; pares: investida)
      harpy.speed = Math.max(0, harpy.speed - config.brake * dt);
      harpy.timer -= dt;
      if (harpy.timer <= 0) {
        if (harpy.cycle % 2 === 0) {
          setMode('charge', config.dashCharge);
          harpy.dashDir = toward;
        } else {
          setMode('burst', config.burstTimeout);
          resetAim(.2);
        }
      }
    } else if (harpy.mode === 'rest') {
      // Grace period depois da rajada, antes de voltar a planar
      harpy.speed = Math.max(0, harpy.speed - config.brake * dt);
      harpy.timer -= dt;
      if (harpy.timer <= 0) {
        setMode('glide', config.glideDuration[phase - 1]);
        resetAim(1.2);
      }
    } else if (harpy.mode === 'burst') {
      // Freia e dispara várias vezes seguidas (useEnemyAttacks conta as rajadas em attackClock.volley)
      harpy.speed = Math.max(0, harpy.speed - config.brake * dt);
      harpy.timer -= dt;
      if ((enemy.attackClock?.volley ?? 0) >= config.burstShots[phase - 1] || harpy.timer <= 0) {
        setMode('rest', config.graceAfterBurst);
      }
    } else if (harpy.mode === 'charge') {
      // Parada carregando: acompanha o jogador e trava a direção no fim do aviso (dá para desviar)
      harpy.speed = Math.max(0, harpy.speed - config.brake * dt);
      harpy.timer -= dt;
      if (1 - harpy.timer / config.dashCharge < config.dashLockAt) harpy.dashDir = toward;
      if (harpy.timer <= 0) {
        setMode('dash', 0);
        harpy.traveled = 0;
        harpy.speed = 0;
      }
    } else if (harpy.mode === 'dash') {
      const step = Math.min(config.dashSpeed * dt, config.dashLength - harpy.traveled);
      enemy.position.x += harpy.dashDir.x * step;
      enemy.position.z += harpy.dashDir.z * step;
      harpy.traveled += step;
      // Hitbox larga durante toda a investida
      if (toPlayer(enemy).d <= config.dashHitRadius) applyCollisionDamage(config.dashDamage);
      if (harpy.traveled >= config.dashLength - 1e-6) setMode('recover', config.recover);
    } else {
      harpy.timer -= dt;
      if (harpy.timer <= 0) {
        setMode('glide', config.glideDuration[phase - 1]);
        harpy.dir = { x: -toward.z * harpy.orbitSign, z: toward.x * harpy.orbitSign };
        harpy.speed = config.glideSpeed * .5;
        resetAim(1.2);
      }
    }

    if (harpy.mode !== 'dash') {
      enemy.position.x += harpy.dir.x * harpy.speed * dt;
      enemy.position.z += harpy.dir.z * harpy.speed * dt;
      contact(enemy, toPlayer(enemy).d);
    }

    const flying = harpy.mode === 'glide' || harpy.mode === 'turn';
    enemy.harpyMode = harpy.mode;
    enemy.speed = harpy.mode === 'dash' ? config.dashSpeed : harpy.speed;
    // Voando aponta para onde vai; parada encara o jogador; na investida segue a linha
    enemy.visualHeading = flying ? headingOf(harpy.dir) : harpy.mode === 'dash' ? headingOf(harpy.dashDir) : undefined;
    enemy.holdFire = harpy.mode !== 'glide' && harpy.mode !== 'burst';
    enemy.dashState = harpy.mode === 'charge' ? 'aim' : harpy.mode === 'dash' ? 'dash' : null;
    enemy.dashDirection = harpy.dashDir;
    enemy.dashLength = config.dashLength;
    enemy.dashWidth = config.dashHitRadius * 2;
    enemy.dashCharge = harpy.mode === 'charge' ? 1 - harpy.timer / config.dashCharge : 0;
  }

  return {
    hiveBoss(enemy, dt) {
      hiveCycle(enemy, dt, HIVE);
    },

    miniHive(enemy, dt) {
      hiveCycle(enemy, dt, MINI_HIVE);
    },

    hiveDrone(enemy, dt) {
      const { dx, dz, d } = toPlayer(enemy);
      const flight = enemy.flight ??= { age: 0, speed: HIVE_DRONE.launchSpeed, dir: enemy.launchDirection ?? { x: dx / d, z: dz / d } };
      flight.age += dt;

      if (flight.age < HIVE_DRONE.launchTime) {
        // Saída rápida do hangar, perdendo velocidade até a de cruzeiro
        const braking = (HIVE_DRONE.launchSpeed - HIVE_DRONE.cruiseSpeed) / HIVE_DRONE.launchTime;
        flight.speed = Math.max(HIVE_DRONE.cruiseSpeed, flight.speed - braking * dt);
      } else {
        flight.speed = Math.min(HIVE_DRONE.maxSpeed, flight.speed + HIVE_DRONE.acceleration * dt);
        // Curva limitada: quanto mais rápido, mais aberta (dá para desviar)
        steer(flight, { x: dx, z: dz }, Math.min(HIVE_DRONE.maxTurnRate, HIVE_DRONE.turnFactor / flight.speed) * dt);
      }

      enemy.speed = flight.speed;
      enemy.position.x += flight.dir.x * flight.speed * dt;
      enemy.position.z += flight.dir.z * flight.speed * dt;
      enemy.visualHeading = headingOf(flight.dir);

      if (toPlayer(enemy).d <= enemy.size * .5 + .45) {
        applyCollisionDamage(enemy.onHitDamage);
        enemyManager.takeDamage(enemy.id, enemy.health, 'collision');
      } else if (flight.age >= HIVE_DRONE.lifetime) {
        enemyManager.takeDamage(enemy.id, enemy.health, 'systemkill');
      }
    },

    harpyBoss(enemy, dt) {
      harpyCycle(enemy, dt, HARPY);
    },

    miniHarpy(enemy, dt) {
      harpyCycle(enemy, dt, MINI_HARPY);
    },

    /** BASTIÃO: quase parado; o anel de escudos gira (mais rápido abaixo de 50%) e bloqueia tiros. */
    bastionBoss(enemy, dt) {
      contact(enemy, orbit(enemy, dt, 6, 11, .25));
      const enraged = enemy.maxHealth ? enemy.health / enemy.maxHealth <= .5 : false;
      enemy.shieldRotation = (enemy.shieldRotation ?? 0) + dt * (enraged ? BASTION_SPIN.enraged : BASTION_SPIN.calm);
    },

    /** COLOSSO: mantém distância; chama escoltas a partir da fase 2 e expõe o reator na fase 3. */
    colossusBoss(enemy, dt) {
      const phase = finalBossPhase(enemy);
      contact(enemy, orbit(enemy, dt, 9, 12, .35));
      enemy.damageTakenMultiplier = phase === 3 ? COLOSSUS_ESCORTS.reactorExposed : 1;
      if (phase >= 2) {
        enemy.escortTimer = (enemy.escortTimer ?? 2) - dt;
        if (enemy.escortTimer <= 0) {
          summon(enemy, 'ufofast', COLOSSUS_ESCORTS.count, COLOSSUS_ESCORTS.max);
          enemy.escortTimer = COLOSSUS_ESCORTS.every;
        }
      }
    },
  };
}
