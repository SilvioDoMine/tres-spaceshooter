import { attackProfile, attackDirections, ENEMY_VOLLEY_GATE } from '~/utils/combatPatterns';
import { playableRoomCount } from '~/utils/progression';

export function useEnemyAttacks() {
  const run=useCurrentRunStore(), shots=useProjectileStore();
  const view=useState('flight-view',()=>({x:0,z:0,width:30,height:23}));
  let volleyGate=0;
  function update(enemies,delta) {
    volleyGate=Math.max(0,volleyGate-delta);
    let bullets=shots.projectiles.filter(p=>p.ownerType==='enemy').length;
    const room=playableRoomCount(run.levelConfig,run.currentStageIndex);
    const player=run.getPlayerPosition();
    for(const enemy of enemies) {
      if(enemy.state!=='active' || enemy.type==='angel' || enemy.type==='kamikaze') { enemy.attackCharge=0;continue; }
      if(!enemy.attackClock)enemy.attackClock={remaining:1+Math.random()*1.6,volley:0,charging:false};
      const clock=enemy.attackClock, profile=attackProfile(enemy.type,room,clock.volley,enemy);
      if(profile.movementSpeed)enemy.speed=profile.movementSpeed;
      const dx=player.x-enemy.position.x,dz=player.z-enemy.position.z,d=Math.hypot(dx,dz);
      const visible=Math.abs(enemy.position.x-view.value.x)<view.value.width*.5-.6
        && Math.abs(enemy.position.z-view.value.z)<view.value.height*.5-.6;
      // No unseen shots or point-blank salvos, and no firing during a charge.
      if(!visible || d<3 || d>19 || enemy.kamikazeState==='charging') {
        clock.charging=false;clock.remaining=Math.max(clock.remaining,.8);enemy.attackCharge=0;continue;
      }
      clock.remaining-=delta;
      if(clock.charging) {
        enemy.attackCharge=Math.min(1,1-clock.remaining/profile.charge);
        if(clock.remaining>0 || volleyGate>0)continue;
        if(bullets+profile.count>90){clock.charging=false;clock.remaining=.8;enemy.attackCharge=0;continue;}
        const directions=attackDirections(profile,clock.aim,clock.volley);
        directions.forEach((direction,index)=>shots.spawnProjectile(profile.projectile,{...enemy.position},direction,
          enemy.id,'enemy',1,0,profile.damage,[],{speed:profile.speed,range:profile.range,silent:index>0}));
        bullets+=directions.length;volleyGate=ENEMY_VOLLEY_GATE;
        clock.volley++;clock.charging=false;enemy.attackCharge=0;
        clock.remaining=Math.max(.05,profile.interval-profile.charge);
      } else if(clock.remaining<=0) {
        clock.charging=true;clock.remaining=profile.charge;
        clock.aim={x:dx/d,z:dz/d}; // Lock aim before the visible wind-up.
      }
    }
  }
  return {update};
}
