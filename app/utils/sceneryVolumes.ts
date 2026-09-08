import { Vector3 } from 'three'
export const sceneryVolumes = new Map<string,{center:Vector3,radius:number}>()
export function clearOfScenery(x:number,y:number,z:number,radius:number){
 for(const v of sceneryVolumes.values())if(v.center.distanceToSquared(new Vector3(x,y,z))<(v.radius+radius)**2)return false
 return true
}
