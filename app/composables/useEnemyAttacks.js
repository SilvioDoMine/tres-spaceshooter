import { attackProfile, attackDirections, canAttackFrom, chapterDamageMultiplier, ENEMY_VOLLEY_GATE, muzzlePosition } from '~/utils/combatPatterns';
import { playableRoomCount } from '~/utils/progression';

export function useEnemyAttacks() {
  const run=useCurrentRunStore(), shots=useProjectileStore();
  const view=useState('flight-view',()=>({x:0,z:0,width:30,height:23}));
  let volleyGate=0;
  function update(enemies,delta) {
    volleyGate=Math.max(0,volleyGate-delta);
    let bullets=shots.projectiles.filter(p=>p.ownerType==='enemy').length;
    const room=playableRoomCount(run.levelConfig,run.currentStageIndex);
    const chapterDamage=chapterDamageMultiplier(run.levelConfig?.chapter);
    const player=run.getPlayerPosition();
    for(const enemy of enemies) {
      // Atordoados não atiram; a Harpia não atira na investida; caças e a mini-colmeia lançando também seguram o fogo
      if(enemy.state!=='active' || enemy.type==='angel' || enemy.type==='kamikaze' || (enemy.stunTimer || 0) > 0 || enemy.dashState || enemy.holdFire) { enemy.attackCharge=0;continue; }
      if(!enemy.attackClock)enemy.attackClock={remaining:1+Math.random()*1.6,volley:0,charging:false};
      const clock=enemy.attackClock, profile=attackProfile(enemy.type,room,clock.volley,enemy);
      if(profile.movementSpeed)enemy.speed=profile.movementSpeed;
      const dx=player.x-enemy.position.x,dz=player.z-enemy.position.z,d=Math.hypot(dx,dz);
      const visible=Math.abs(enemy.position.x-view.value.x)<view.value.width*.5-.6
        && Math.abs(enemy.position.z-view.value.z)<view.value.height*.5-.6;
      // No unseen shots (bosses: distance only) or point-blank salvos, and no firing during a charge.
      if(!canAttackFrom(enemy,d,visible) || enemy.kamikazeState==='charging') {
        clock.charging=false;clock.remaining=Math.max(clock.remaining,.8);enemy.attackCharge=0;continue;
      }
      clock.remaining-=delta;
      if(clock.charging) {
        enemy.attackCharge=Math.min(1,1-clock.remaining/profile.charge);
        // Acompanha o jogador durante a carga e só trava a mira pouco antes do disparo
        if(profile.lockLead!==undefined&&clock.remaining>profile.lockLead){clock.aim={x:dx/d,z:dz/d};clock.target={x:player.x,z:player.z};}
        if(clock.remaining>0 || (volleyGate>0&&!profile.ignoreVolleyGate))continue;
        if(bullets+profile.count*(profile.muzzles?.length||1)>90){clock.charging=false;clock.remaining=.8;enemy.attackCharge=0;continue;}
        const directions=attackDirections(profile,clock.aim,clock.volley);
        // Canos fixos no casco (ex.: as duas saídas da Colmeia) disparam em paralelo
        const muzzles=profile.muzzles||[{side:0,forward:0}];
        const damage=enemy.exactStats?profile.damage:Math.round(profile.damage*chapterDamage);
        let fired=0;
        for(const direction of directions)for(const muzzle of muzzles) {
          const origin=muzzle.side||muzzle.forward
            ?muzzlePosition(enemy.position,direction,muzzle.side*enemy.size,muzzle.forward*enemy.size)
            :{...enemy.position};
          // Canos afastados (asas da Harpia) convergem no ponto mirado
          const tx=clock.target?.x-origin.x,tz=clock.target?.z-origin.z,td=Math.hypot(tx,tz);
          // (se o alvo ficou atrás do cano, segue a mira reta)
          const ahead=td>.001&&(tx*direction.x+tz*direction.z)/td>.5;
          const heading=profile.converge&&ahead?{x:tx/td,z:tz/td}:direction;
          shots.spawnProjectile(profile.projectile,origin,heading,enemy.id,'enemy',1,0,damage,[],
            {speed:profile.speed,range:profile.range,silent:fired++>0});
        }
        bullets+=fired;volleyGate=ENEMY_VOLLEY_GATE;
        // Grace period: a IA segura o movimento e o rumo na direção do disparo
        if(profile.recoil){enemy.recoilTimer=profile.recoil;enemy.recoilDirection={...clock.aim};}
        clock.volley++;clock.charging=false;enemy.attackCharge=0;
        clock.remaining=Math.max(.05,profile.interval-profile.charge);
      } else if(clock.remaining<=0) {
        clock.charging=true;clock.remaining=profile.charge;
        clock.aim={x:dx/d,z:dz/d}; // Lock aim before the visible wind-up (or track it until lockLead).
        clock.target={x:player.x,z:player.z};
      }
    }
  }
  return {update};
}
