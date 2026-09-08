import { createDilationState, spatialMotion, advanceDilation, DILATION_CONFIG } from '~/utils/spatialDilation'
export function useSpatialDilation(){
  const state=useState('spatial-dilation',()=>createDilationState())
  function reset(stage:any){
    const center=stage.center ?? {x:0,z:0}
    // Existing rooms use centered XZ coordinates. Explicit centers remain supported.
    // Keep the room, its starting point and its portal inside stable space.
    const extent=Math.hypot((stage.width||0)/2,(stage.height||0)/2)
    const start=stage.playerStartPosition ?? center,door=stage.door?.position ?? center
    const radius=Math.max(DILATION_CONFIG.startRadius,extent+4,
      Math.hypot(start.x-center.x,start.z-center.z)+4,
      Math.hypot(door.x-center.x,door.z-center.z)+4)
    state.value=createDilationState(center.x,center.z,radius)
  }
  function update(position:{x:number,z:number},movement:{x:number,z:number},dt:number){
    const motion=spatialMotion(position.x,position.z,movement.x,movement.z,state.value)
    return {...motion,damage:advanceDilation(state.value,motion,dt)}
  }
  return {state,reset,update}
}
