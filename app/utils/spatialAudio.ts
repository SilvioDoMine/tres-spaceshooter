// Shared game context: textured pressure and broadband alarms, without melodic beeps.
export function createSpatialAudio(context:AudioContext){
 const output=context.createGain();output.gain.value=0;output.connect(context.destination)
 const noise=context.createBuffer(1,context.sampleRate*3,context.sampleRate)
 const samples=noise.getChannelData(0)
 let brown=0
 for(let i=0;i<samples.length;i++){
  const white=Math.random()*2-1
  brown=(brown+.025*white)/1.025
  samples[i]=brown*2.8+white*.18
 }
 const wind=context.createBufferSource(),filter=context.createBiquadFilter(),windGain=context.createGain()
 wind.buffer=noise;wind.loop=true;filter.type='lowpass';filter.frequency.value=300;filter.Q.value=.5
 windGain.gain.value=0;wind.connect(filter);filter.connect(windGain);windGain.connect(output);wind.start()
 const rumble=context.createOscillator(),rumbleGain=context.createGain()
 rumble.type='sine';rumble.frequency.value=47;rumbleGain.gain.value=0
 rumble.connect(rumbleGain);rumbleGain.connect(output);rumble.start()
 const voices=new Set<AudioBufferSourceNode>()
 let lastPhase='SAFE',lastNotice='',nextAlarm=0,disposed=false
 function pressureBurst(critical:boolean,structural=false){
  const source=context.createBufferSource(),band=context.createBiquadFilter(),gain=context.createGain()
  const now=context.currentTime,duration=structural?.72:critical?.95:1.3
  source.buffer=noise
  band.type='bandpass';band.frequency.value=structural?390:critical?270:190;band.Q.value=.65
  gain.gain.setValueAtTime(0,now)
  gain.gain.linearRampToValueAtTime(structural?.62:critical?.48:.36,now+.045)
  gain.gain.exponentialRampToValueAtTime(.09,now+duration*.4)
  gain.gain.exponentialRampToValueAtTime(.001,now+duration)
  source.connect(band);band.connect(gain);gain.connect(output);voices.add(source)
  source.onended=()=>{voices.delete(source);source.disconnect();band.disconnect();gain.disconnect()}
  source.start(now,Math.random());source.stop(now+duration)
 }
 return {
  update(intensity:number,phase:string,notice:string,volume:number,active:boolean){
   if(disposed)return
   const now=context.currentTime,amount=Math.max(0,Math.min(1,intensity))
   const danger=phase==='CRITICAL'||phase==='STRUCTURAL_DAMAGE',structural=phase==='STRUCTURAL_DAMAGE'
   output.gain.setTargetAtTime(active?Math.max(0,Math.min(1,volume)):0,now,.08)
   // Pressure breathes faster under damage; pitch never alternates between notes.
   const breath=.8+.2*Math.sin(now*(structural?8:danger?4:1.7))
   windGain.gain.setTargetAtTime(active?amount*(danger?.34:.22)*breath:0,now,.18)
   filter.frequency.setTargetAtTime(220+amount*580+(structural?220:0),now,.35)
   rumbleGain.gain.setTargetAtTime(active?amount*.065*breath:0,now,.25)
   if(!active){
    for(const voice of voices)voice.stop()
    voices.clear();nextAlarm=0;return
   }
   if(danger && (phase!==lastPhase || now>=nextAlarm)){
    pressureBurst(true,structural);nextAlarm=now+(structural?1.5:2.8)
   }else if(notice && notice!==lastNotice && phase!=='SAFE' && !danger){
    pressureBurst(false)
   }
   lastPhase=phase;lastNotice=notice
  },
  dispose(){
   if(disposed)return
   disposed=true;wind.stop();rumble.stop()
   wind.disconnect();filter.disconnect();windGain.disconnect();rumble.disconnect();rumbleGain.disconnect();output.disconnect()
   for(const voice of voices)voice.stop()
   voices.clear()
  }
 }
}
