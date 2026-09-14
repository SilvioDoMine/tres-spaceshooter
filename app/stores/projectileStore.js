import { emitImpact } from '~/utils/combatEffects';
import { emitMuzzleFlash } from '~/utils/weaponVisuals';
import { defineStore } from 'pinia';
import { shallowRef } from 'vue';
import { useEnemyManager, baseStats } from '~/composables/useEnemyManager';
import { useCurrentRunStore, PlayerBaseStats } from '~/stores/currentRunStore';
import { usePlayerStats } from '~/stores/playerStats';
import { useSkillStore, SkillsList } from '~/stores/SkillStore';
import { worldHardpoint, advanceShot, bastionShieldBlocks, PLAYER_HITBOX_RADIUS, PROJECTILE_IFRAME, segmentHit } from '~/utils/combatPatterns';

const orb = { speed: 4, damage: 18, size: .22, range: 25, color: '#52caff' };
export const projectilesType = {
  player: { speed: PlayerBaseStats.projectiles.shotSpeed, damage: PlayerBaseStats.projectiles.damage,
    size: PlayerBaseStats.projectiles.size, range: PlayerBaseStats.projectiles.range, color: '#38cfff' },
  enemyOrb: {...orb}, ufo: {...orb}, ufofast: {...orb}, boss: {...orb}, miniboss: {...orb},
  enemyPlasma: {...orb, color: '#ff719c'},
  enemyMissile: {...orb, color: '#ffbf66'},
  // Colmeia: tiro do modo caça e lança da torreta (grandes, para não passar raspando)
  hiveShot: {...orb, size: .42, color: '#ffa53d'},
  enemyLance: {...orb, size: .45, color: '#fff06a'},
  // Harpia: rápido e com hitbox grande
  harpyShot: {...orb, size: .42, color: '#ff5fb0'},
};
export const useProjectileStore = defineStore('projectileStore', () => {
  const enemyManager = useEnemyManager(), currentRunStore = useCurrentRunStore();
  const playerStats = usePlayerStats(), skillStore = useSkillStore();
  const projectiles = shallowRef([]);
  let hitGrace = 0, serial = 0;

  function spawnProjectile(type, position, direction, ownerId, ownerType, hits=1, bounces=0, damage=0, ignoreEnemies=[], options={}) {
    const config = projectilesType[type], norm = Math.hypot(direction.x,direction.z);
    if (!config || !norm || projectiles.value.length >= 480) return null;
    if (!options.silent) {
      if (ownerType === 'player') useAudio().playSound('shoot-player', .65, 1);
      else if (baseStats[type]?.shotSound) useAudio().playSound(baseStats[type].shotSound,.35);
      emitImpact(position.x,position.z,false,'shot',ownerType !== 'player');
    }
    const projectile = {
      ...config, ...options, id: 'projectile-'+(++serial), type, ownerId, ownerType,
      position: {...position}, direction: {x:direction.x/norm,z:direction.z/norm},
      distanceTraveled: 0, originalHits: hits, currentHits: hits, hitsList: [...ignoreEnemies],
      bounces, damage: damage || config.damage, trail: [],
      power: options.power ?? (ownerType === 'player' ? playerStats.getDamageMultiplier : 1),
    };
    projectiles.value.push(projectile);
    return projectile;
  }
  function nearestEnemyFromPosition(position, maxRange=Infinity, ownerId=null, ignore=[]) {
    let nearest=null,min=maxRange;
    for(const enemy of enemyManager.activeEnemies.value) {
      if(enemy.state!=='active' || enemy.id===ownerId || ignore.includes(enemy.id))continue;
      const distance=Math.hypot(enemy.position.x-position.x,enemy.position.z-position.z);
      if(distance<min){nearest=enemy;min=distance;}
    }
    return nearest;
  }
  function nearestEnemyFromPlayer() {
    return nearestEnemyFromPosition(currentRunStore.getPlayerPosition(),projectilesType.player.range*playerStats.getRangeMultiplier);
  }
  function collide(projectile,start) {
    if(projectile.ownerType==='enemy') {
      // A volley cannot cause several damage events in one instant.
      if(segmentHit(start,projectile.position,currentRunStore.getPlayerPosition(),PLAYER_HITBOX_RADIUS+projectile.size)!==null) {
        projectile._markedForRemoval=true;
        if(hitGrace<=0){hitGrace=PROJECTILE_IFRAME;currentRunStore.takeDamage(projectile.damage, {source:'attack',attackerId:projectile.ownerId});}
      }
      return;
    }
    const contacts=[];
    for(const enemy of enemyManager.activeEnemies.value) {
      if(enemy.state!=='active'||projectile.hitsList.includes(enemy.id))continue;
      const t=segmentHit(start,projectile.position,enemy.position,Math.max(.38,enemy.size*.48)+.12);
      if(t!==null)contacts.push({enemy,t});
    }
    contacts.sort((a,b)=>a.t-b.t);
    for(const {enemy,t} of contacts) {
      if(projectile._markedForRemoval)break;
      // Escudos do Bastião absorvem o tiro que chega pela placa
      const contact={x:start.x+(projectile.position.x-start.x)*t,z:start.z+(projectile.position.z-start.z)*t};
      if(bastionShieldBlocks(enemy,contact)) {
        projectile._markedForRemoval=true;
        emitImpact(contact.x,contact.z,false,'shot',true);
        break;
      }
      projectile.hitsList.push(enemy.id);
      enemyManager.takeDamage(enemy.id,projectile.damage,'shot',{
        canCrit: projectile.canCrit !== false,
        aoe: false,
      });
      if(projectile.aoeRadius>0 && !projectile.aoeTriggered) {
        projectile.aoeTriggered=true;
        enemyManager.damageArea(enemy.position,projectile.aoeRadius,projectile.damage,enemy.id,{
          canCrit: projectile.canCrit !== false,
        });
      }
      if(projectile.bounces>0) {
        const target=nearestEnemyFromPosition(enemy.position,projectile.range*playerStats.getRangeMultiplier,enemy.id,projectile.hitsList);
        if(target) {
          projectile.position.x=start.x+(projectile.position.x-start.x)*t;
          projectile.position.z=start.z+(projectile.position.z-start.z)*t;
          const dx=target.position.x-projectile.position.x,dz=target.position.z-projectile.position.z,length=Math.hypot(dx,dz);
          if(length>.001) {
            projectile.direction={x:dx/length,z:dz/length};projectile.bounces--;
            const level=skillStore.getSkillLevel('ricochet_shot')||1;
            projectile.damage*=SkillsList.ricochet_shot.levels[level].value;
            projectile.ricochet=true;projectile.rearTurn=null;
            projectile.trail.push({...projectile.position});
            break;
          }
        }
      }
      projectile.currentHits--;
      if(projectile.currentHits<=0)projectile._markedForRemoval=true;
    }
  }
  function update(deltaTime) {
    hitGrace=Math.max(0,hitGrace-deltaTime);
    const keep=[];
    for(const projectile of projectiles.value) {
      if(projectile._markedForRemoval)continue;
      if(projectile.spawnDelay>0){
        projectile.spawnDelay-=deltaTime;
        // Repetições do multishot: clarão e som só quando o tiro realmente sai
        if(projectile.spawnDelay<=0&&projectile.muzzleId){
          emitMuzzleFlash(projectile.muzzleId,false);
          if(projectile.releaseSound)useAudio().playSound('shoot-player',.65,1);
        }
        keep.push(projectile);continue;
      }
      if(projectile.beam) {
        const {origin,direction}=worldHardpoint(currentRunStore.getPlayerPosition(),currentRunStore.getPlayerRotation().y,projectile.beamMount);
        projectile.position=origin;projectile.direction=direction;
        projectile.beamAge+=deltaTime;
        const maxLength=projectile.range*playerStats.getRangeMultiplier;
        const end={x:origin.x+direction.x*maxLength,z:origin.z+direction.z*maxLength};
        const contacts=enemyManager.activeEnemies.value.filter(e=>e.state==='active')
          .map(e=>({e,t:segmentHit(origin,end,e.position,Math.max(.38,e.size*.48)+.16)}))
          .filter(c=>c.t!==null).sort((a,b)=>a.t-b.t);
        const hit=contacts[0];projectile.beamLength=hit?maxLength*hit.t:maxLength;
        // Five pulses divide the existing burst budget, independent of frame rate.
        while(projectile.beamTick<5 && projectile.beamAge>=projectile.beamTick*.13) {
          projectile.beamTick++;
          if(hit) {
            const contact={x:origin.x+direction.x*projectile.beamLength,z:origin.z+direction.z*projectile.beamLength};
            if(!bastionShieldBlocks(hit.e,contact))enemyManager.takeDamage(hit.e.id,projectile.damage/5,'shot',{canCrit:true});
            emitImpact(contact.x,contact.z,false,'hit');
          }
        }
        if(projectile.beamAge<projectile.beamDuration)keep.push(projectile);
        continue;
      }
      const distance=projectile.speed*deltaTime*(projectile.ownerType==='player'?playerStats.getProjectileSpeedMultiplier:1);
      // Curves use short segments; faster straight shots use swept collisions.
      const steps=projectile.rearTurn?Math.max(1,Math.ceil(distance/.22)):1;
      for(let step=0;step<steps;step++) {
        const start={...projectile.position};
        advanceShot(projectile,distance/steps);projectile.distanceTraveled+=distance/steps;
        collide(projectile,start);
        if(projectile._markedForRemoval)break;
      }
      if(projectile.ion || projectile.echo || projectile.ricochet || projectile.rearTurn) {
        projectile.trail.push({...projectile.position});
        while(projectile.trail.length>14)projectile.trail.shift();
      }
      const range=projectile.range*(projectile.ownerType==='player'?playerStats.getRangeMultiplier:1)
        +(projectile.rearTurn?(Math.PI+3)*projectile.rearTurn.radius:0);
      if(!projectile._markedForRemoval && projectile.distanceTraveled<range)keep.push(projectile);
    }
    projectiles.value=keep;
  }
  function checkCollisions(){for(const p of projectiles.value)if(!p._markedForRemoval&&!p.beam&&!(p.spawnDelay>0))collide(p,p.position);}
  function cleanup(){projectiles.value=[];hitGrace=0;}
  return {update,cleanup,spawnProjectile,checkCollisions,projectiles,nearestEnemyFromPlayer,nearestEnemyFromPosition};
});
if(import.meta.hot)import.meta.hot.accept(acceptHMRUpdate(useProjectileStore,import.meta.hot));
