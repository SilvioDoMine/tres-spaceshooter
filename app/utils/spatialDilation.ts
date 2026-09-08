export const DILATION_CONFIG = {
  startRadius:24, warningRadius:32, criticalRadius:44,
  curveWidth:18, curvePower:2, minimumOutwardSpeed:.002,
  warningDelay:1.5, criticalDelay:3, damageDelay:4,
  damagePerSecond:8, damageInterval:1, alertCooldown:12,
  noticeDuration:6, recoveryDuration:3, visualSmoothing:3,
  shipShake:.028, cameraShake:.045, particleIntensity:1,
  outwardEpsilon:.025, hysteresis:2,
  sceneryStretch:.13, sceneryResponseRadius:28, cometResistance:.16,
}
export type DilationPhase='SAFE'|'DILATION'|'WARNING'|'CRITICAL'|'STRUCTURAL_DAMAGE'
export function createDilationState(centerX=0,centerZ=0,startRadius=DILATION_CONFIG.startRadius){
  return {centerX,centerZ,startRadius,phase:'SAFE' as DilationPhase,
    intensity:0,visual:0,shake:0,outward:0,distance:0,
    warningTime:0,criticalTime:0,damageTime:0,cooldown:0,
    warned:false,criticalWarned:false,notice:'',noticeTime:0}
}
export type DilationState=ReturnType<typeof createDilationState>
export function sceneryDilation(x:number,z:number,s:DilationState){
  const local=spatialMotion(x,z,0,0,s).intensity
  return local*s.visual
}
export function spatialMotion(x:number,z:number,mx:number,mz:number,state:DilationState){
  const c=DILATION_CONFIG,dx=x-state.centerX,dz=z-state.centerZ,distance=Math.hypot(dx,dz)
  const nx=distance?dx/distance:0,nz=distance?dz/distance:0
  const radial=mx*nx+mz*nz
  const excess=Math.max(0,distance-state.startRadius)/c.curveWidth
  const multiplier=c.minimumOutwardSpeed+(1-c.minimumOutwardSpeed)*Math.exp(-Math.pow(excess,c.curvePower))
  const outward=Math.max(0,radial),loss=outward*(1-multiplier)
  return {x:mx-nx*loss,z:mz-nz*loss,distance,outward,intensity:1-multiplier}
}
// Pure state machine, advanced exclusively by the existing gameplay loop.
export function advanceDilation(s:DilationState,m:ReturnType<typeof spatialMotion>,dt:number){
  const c=DILATION_CONFIG,offset=s.startRadius-c.startRadius
  const warning=c.warningRadius+offset,critical=c.criticalRadius+offset
  s.distance=m.distance;s.intensity=m.intensity;s.outward=m.outward
  s.cooldown=Math.max(0,s.cooldown-dt);s.noticeTime=Math.max(0,s.noticeTime-dt)
  if(!s.noticeTime)s.notice=''
  const announce=(text:string,duration=c.noticeDuration)=>{s.notice=text;s.noticeTime=duration;s.cooldown=c.alertCooldown}
  const pushing=m.outward>c.outwardEpsilon
  let damage=0
  if(m.distance<=s.startRadius){
    if(s.warned && s.phase!=='SAFE')announce('ESTABILIDADE ESPACIAL RESTAURADA',c.recoveryDuration)
    s.phase='SAFE';s.warningTime=0;s.criticalTime=0;s.damageTime=0
    s.warned=false;s.criticalWarned=false
  }else{
    s.warningTime=m.distance>=warning?s.warningTime+dt:0
    if(!s.warned && s.warningTime>=c.warningDelay && s.cooldown===0){
      announce('DILATAÇÃO ESPACIAL DETECTADA');s.warned=true
    }
    // Returning or releasing thrust immediately stops structural stress and damage.
    // Hysteresis avoids flickering when hovering around the critical radius.
    const criticalThreshold=s.criticalTime>0?critical-c.hysteresis:critical
    const previousCriticalTime=s.criticalTime
    s.criticalTime=pushing && m.distance>=criticalThreshold?s.criticalTime+dt:0
    s.phase=s.warned?'WARNING':'DILATION'
    if(s.criticalTime>=c.criticalDelay){
      s.phase='CRITICAL'
      if(!s.criticalWarned){announce('ALERTA CRÍTICO — INSTABILIDADE ESPACIAL');s.criticalWarned=true}
      if(s.criticalTime>=c.criticalDelay+c.damageDelay){
        const start=c.criticalDelay+c.damageDelay
        s.phase='STRUCTURAL_DAMAGE'
        s.damageTime+=Math.max(0,s.criticalTime-start)-Math.max(0,previousCriticalTime-start)
        while(s.damageTime+1e-9>=c.damageInterval){s.damageTime=Math.max(0,s.damageTime-c.damageInterval);damage+=c.damagePerSecond*c.damageInterval*(.75+.25*m.intensity)}
      }else s.damageTime=0
    }else{
      s.damageTime=0
      if(s.criticalWarned){s.notice='';s.noticeTime=0}
      if(s.cooldown===0)s.criticalWarned=false
    }
  }
  const blend=1-Math.exp(-dt*c.visualSmoothing)
  s.visual+=(m.intensity*m.outward-s.visual)*blend
  const stress=s.phase==='CRITICAL'||s.phase==='STRUCTURAL_DAMAGE'?m.intensity:0
  s.shake+=(stress-s.shake)*blend
  return damage
}
