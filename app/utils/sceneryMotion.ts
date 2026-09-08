type Body={position:{x:number,y:number,z:number},radius:number}
// Candidate positions are accepted only if their bounding volumes remain separate.
export function separatedPosition(body:Body,x:number,z:number,others:Body[],gap=1){
 for(const other of others){
  if(other===body)continue
  const dy=body.position.y-other.position.y,limit=body.radius+other.radius+gap
  if((x-other.position.x)**2+dy*dy+(z-other.position.z)**2<limit*limit)
   return {x:body.position.x,z:body.position.z}
 }
 return {x,z}
}
