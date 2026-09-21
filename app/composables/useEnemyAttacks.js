import { attackProfile, attackDirections, canAttackFrom, enemyShotDamage, ENEMY_VOLLEY_GATE, muzzlePosition } from '~/utils/combatPatterns';
import { ENEMY_FLEET, fleetSalvo, fleetHeading, advanceFleetHeading } from '~/utils/enemyFleet';
import { playableRoomCount } from '~/utils/progression';
import { ENEMY_ELEMENT_PAYLOADS } from '~/utils/elementalStatus';

export function useEnemyAttacks() {
  const run=useCurrentRunStore(), shots=useProjectileStore();
  const view=useState('flight-view',()=>({x:0,z:0,width:30,height:23}));
  let volleyGate=0;
  function update(enemies,delta) {
    volleyGate=Math.max(0,volleyGate-delta);
    let bullets=shots.projectiles.filter(p=>p.ownerType==='enemy').length;
    const room=run.currentStage?.combatTier ?? playableRoomCount(run.levelConfig,run.currentStageIndex);
    const chapter=run.levelConfig?.chapter;
    const player=run.getPlayerPosition();
    for(const enemy of enemies) {
      enemy.fleetRecoil = Math.max(0, (enemy.fleetRecoil || 0) - delta);
      // O rumo da frota vira estado: gira suave aqui e tanto o modelo quanto a
      // salva leem o mesmo valor, em vez de saltar direto para o ângulo alvo.
      if (ENEMY_FLEET[enemy.type]) advanceFleetHeading(enemy, player, delta);
      if (enemy.beamLock?.remaining > 0) { enemy.beamLock.remaining = Math.max(0, enemy.beamLock.remaining - delta); continue; }
      // Atordoados não atiram; a Harpia não atira na investida; caças e a mini-colmeia lançando também seguram o fogo
      if(enemy.state!=='active' || enemy.type==='angel' || enemy.type==='kamikaze' || (enemy.stunTimer || 0) > 0 || enemy.elementState?.freeze || enemy.dashState || enemy.holdFire) { enemy.attackCharge=0;continue; }
      if(!enemy.attackClock)enemy.attackClock={remaining:1+Math.random()*1.6,volley:0,charging:false};
      const clock=enemy.attackClock, profile=clock.charging && clock.profile ? clock.profile : attackProfile(enemy.type,room,clock.volley,enemy);
      if (enemy.fleetRole === 'spiral') {
        const target = -clock.volley * (profile.twist ?? .42);
        const current = enemy.tacticalRotor ?? target;
        enemy.tacticalRotor = current + Math.max(-delta * 1.4, Math.min(delta * 1.4, target - current));
      }
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
        const physical = fleetSalvo(enemy, profile, clock.volley, player);
        // Canos fixos no casco (ex.: as duas saídas da Colmeia) disparam em paralelo
        const muzzles=profile.muzzles||[{side:0,forward:0}];
        // Tiro comum escala com sala e capítulo; tiro de boss bate como colisão (ENEMY_THREAT)
        const damage=enemyShotDamage(enemy.type,room,chapter,enemy);
        let fired=0;
        // Descrição da rajada para o som (leque, anel, bordada e canos duplos soam diferentes de um tiro só)
        const volleySize=physical?.length ?? directions.length*muzzles.length, volleyBoss=profile.category==='boss';
        const exits = physical ?? directions.flatMap(direction => muzzles.map(muzzle => ({ direction, muzzle })));
        for(const exit of exits) {
          const { direction, muzzle = {} } = exit;
          const origin=exit.origin ?? (muzzle.side||muzzle.forward
            ?muzzlePosition(enemy.position,direction,muzzle.side*enemy.size,muzzle.forward*enemy.size)
            :{...enemy.position});
          // Canos afastados (asas da Harpia) convergem no ponto mirado
          const tx=clock.target?.x-origin.x,tz=clock.target?.z-origin.z,td=Math.hypot(tx,tz);
          // (se o alvo ficou atrás do cano, segue a mira reta)
          const ahead=td>.001&&(tx*direction.x+tz*direction.z)/td>.5;
          const heading=profile.converge&&ahead?{x:tx/td,z:tz/td}:direction;
          shots.spawnProjectile(profile.projectile,origin,heading,enemy.id,'enemy',1,0,damage,[],
            // Inimigos elementais (ficha com `element: 'fire' | 'ice' | 'lightning'`) atiram com o efeito
            {speed:profile.speed,range:profile.range,silent:fired++>0,elements:enemy.element?ENEMY_ELEMENT_PAYLOADS[enemy.element]:undefined,
              beam: Boolean(profile.beam), beamAge: 0, beamDuration: profile.beamDuration, beamLength: profile.range, beamWidth: profile.beamWidth,
              muzzleRole: exit.role, beamYaw: fleetHeading(enemy, player), beamVolley: clock.volley,
              launchHeight: origin.y || 0,
              volleySize,volleyPattern:muzzles.length>1&&profile.pattern==='aim'?'twin':profile.pattern,volleyBoss});
        }
        if (ENEMY_FLEET[enemy.type]) {
          enemy.firedYaw = fleetHeading(enemy, player); enemy.firedVolley = clock.volley; enemy.firedProfile = profile; enemy.fleetRecoil = .12;
          if (profile.beam) enemy.beamLock = { yaw: enemy.firedYaw, remaining: profile.beamDuration, profile };
        }
        bullets+=fired;volleyGate=ENEMY_VOLLEY_GATE;
        // Grace period: a IA segura o movimento e o rumo na direção do disparo
        if(profile.recoil){enemy.recoilTimer=profile.recoil;enemy.recoilDirection={...clock.aim};}
        clock.volley++;clock.charging=false;enemy.attackCharge=0;
        clock.remaining=Math.max(.05,profile.interval-profile.charge);
      } else if(clock.remaining<=0) {
        clock.charging=true;clock.remaining=profile.charge;clock.profile=profile;
        clock.aim={x:dx/d,z:dz/d}; // Lock aim before the visible wind-up (or track it until lockLead).
        clock.target={x:player.x,z:player.z};
        if(profile.pattern==='broadside') {
          // Escolhe o bordo pelo giro mais curto: virar sempre para o mesmo
          // lado faria o casco atravessar meia volta à toa.
          const nose=Math.atan2(-clock.aim.x,-clock.aim.z);
          const current=enemy.fleetYaw ?? nose;
          const swing=side=>Math.abs(Math.atan2(Math.sin(nose+side*Math.PI/2-current),Math.cos(nose+side*Math.PI/2-current)));
          clock.broadsideSide=swing(1)<=swing(-1)?1:-1;
        }
      }
    }
  }
  return {update};
}
