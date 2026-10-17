import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, Sparkles, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Battery, Camera, Gauge, Navigation, Pause, Play, RotateCcw, Signal, Wind, Smartphone, Wifi, Copy, Check } from 'lucide-react';

const GATES = [[0,3,-18],[11,5,-34],[-10,7,-50],[2,4,-68],[16,8,-86],[-13,5,-105]];
const RACE_GATES = [[0,5,-22],[13,6,-35],[0,7,-49],[-13,6,-35]];
function loadPeerJS(){
 return new Promise((resolve,reject)=>{
  if(window.Peer)return resolve(window.Peer);
  const old=document.querySelector('script[data-peerjs]');
  if(old){old.addEventListener('load',()=>resolve(window.Peer),{once:true});old.addEventListener('error',reject,{once:true});return;}
  const script=document.createElement('script');script.src='https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';script.dataset.peerjs='1';
  script.onload=()=>window.Peer?resolve(window.Peer):reject(new Error('PeerJS unavailable'));
  script.onerror=()=>reject(new Error('Could not load PeerJS'));document.head.appendChild(script);
 });
}
function PhoneController({peerId}){
 const [status,setStatus]=useState('CONNECTING');
 const [speed,setSpeed]=useState(8.5);
 const connRef=useRef(null), controls=useRef({forward:0,side:0,vertical:0,yaw:0});
 useEffect(()=>{
  let peer, timer;
  loadPeerJS().then(Peer=>{
   peer=new Peer();
   peer.on('open',()=>{const c=peer.connect(peerId,{reliable:true});connRef.current=c;c.on('open',()=>setStatus('CONNECTED'));c.on('close',()=>setStatus('DISCONNECTED'));c.on('error',()=>setStatus('CONNECTION ERROR'));});
   peer.on('error',()=>setStatus('CONNECTION ERROR'));
   timer=setInterval(()=>{if(connRef.current?.open)connRef.current.send({...controls.current,speed});},40);
  }).catch(()=>setStatus('NETWORK ERROR'));
  return()=>{clearInterval(timer);try{peer?.destroy();}catch{}};
 },[peerId,speed]);
 const press=(key,value)=>e=>{e.preventDefault();controls.current[key]=value;};
 const pad=(label,key,value,cls='')=><button className={'phone-pad '+cls} onPointerDown={press(key,value)} onPointerUp={press(key,0)} onPointerLeave={press(key,0)} onContextMenu={e=>e.preventDefault()}>{label}</button>;
 return <main className="phone-controller"><header><div className="phone-logo">✦ SKY<span>CTRL</span></div><div className={'phone-status '+(status==='CONNECTED'?'is-connected':'')}>{status}</div></header>
 <section className="phone-speed"><label>FLIGHT SPEED <b>{speed.toFixed(1)} m/s</b></label><input type="range" min="1" max="20" step=".5" value={speed} onChange={e=>setSpeed(Number(e.target.value))}/><div><span>SLOW</span><span>FAST</span></div></section>
 <section className="phone-flight"><div className="phone-section-title">MOVEMENT</div><div className="phone-pad-grid">{pad('▲','forward',1,'up')}{pad('◀','side',-1)}{pad('▼','forward',-1)}{pad('▶','side',1)}</div>
 <div className="phone-section-title">ALTITUDE & ROTATION</div><div className="phone-actions">{pad('＋ UP','vertical',1)}{pad('－ DOWN','vertical',-1)}{pad('↶ YAW','yaw',-1)}{pad('YAW ↷','yaw',1)}</div></section>
 <p className="phone-hint">Giữ nút để điều khiển • Thả tay để dừng</p></main>;
}

function World({ position, yaw, fpv, paused, onGate, passed, raceGate }) {
  const drone = useRef();
  const cameraTarget = useRef(new THREE.Vector3());
  useFrame((state, dt) => {
    if (!drone.current) return;
    drone.current.position.lerp(new THREE.Vector3(...position), 1 - Math.exp(-10 * dt));
    drone.current.rotation.y = THREE.MathUtils.damp(drone.current.rotation.y, yaw, 7, dt);
    drone.current.rotation.z = THREE.MathUtils.damp(drone.current.rotation.z, THREE.MathUtils.clamp(-Math.sin(yaw) * 0.13, -.18, .18), 4, dt);

    const target = drone.current.position;
    const smoothYaw = drone.current.rotation.y;
    const offset = fpv ? new THREE.Vector3(0, .10, -.34) : new THREE.Vector3(0, 4.2, 9.5);
    offset.applyAxisAngle(new THREE.Vector3(0,1,0), smoothYaw);
    const desired = target.clone().add(offset);
    state.camera.position.lerp(desired, 1 - Math.exp(-5.0*dt));
    cameraTarget.current.copy(target).add(new THREE.Vector3(0, fpv ? 0 : .2, 0));
    state.camera.lookAt(cameraTarget.current);
  });
  return <>
    <color attach="background" args={['#a9c9d8']} />
    <fog attach="fog" args={['#a9c9d8', 45, 155]} />
    <ambientLight intensity={1.15} />
    <hemisphereLight args={['#d8f2ff','#526b49',1.1]} />
    <directionalLight position={[-30,45,20]} intensity={2.2} castShadow shadow-mapSize={[2048,2048]} />
    <Stars radius={180} depth={80} count={1600} factor={2.4} fade speed={0.2}/>
    <mesh position={[-48,38,-115]}><sphereGeometry args={[13,32,24]}/><meshBasicMaterial color="#ffd9a1"/></mesh>
    {Array.from({length:9},(_,i)=><group key={'cloud'+i} position={[Math.sin(i*8)*42,15+(i%3)*5,-18-i*15]}>{[0,1,2].map(j=><mesh key={j} position={[(j-1)*2.4,Math.sin(j*2+i)*.5,0]} scale={[1.8,1,.9]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color="#e9f5f4" transparent opacity={.34} roughness={1}/></mesh>)}</group>)}
    {Array.from({length:32},(_,i)=><group key={'ridge'+i} position={[(i-16)*9,-.5,-118-(i%4)*5]}><mesh><coneGeometry args={[8+(i%5)*2,12+(i%4)*4,5]}/><meshStandardMaterial color={i%2?'#456c70':'#567b7b'} roughness={1}/></mesh><mesh position={[0,3,0]}><coneGeometry args={[4+(i%3),7,5]}/><meshStandardMaterial color="#78938b" roughness={1}/></mesh></group>)}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.5,-45]} receiveShadow>
      <planeGeometry args={[260,260]} /><meshStandardMaterial color="#55745e" roughness={1}/>
    </mesh>
    <gridHelper args={[220,44,'#b7d0bb','#78947d']} position={[0,-.48,-45]}/>
    {Array.from({length:34},(_,i)=>[-1,1].map(side=><mesh key={'edge'+i+'-'+side} position={[side*7,.05,-i*4-8]}><cylinderGeometry args={[.09,.09,.12,12]}/><meshStandardMaterial color="#8af5ff" emissive="#37ddec" emissiveIntensity={2.2}/></mesh>))}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.39,-44]}><ringGeometry args={[18,18.35,96]}/><meshBasicMaterial color="#54e5ef" transparent opacity={.6}/></mesh>
    {Array.from({length:38},(_,i)=>{
      const x=Math.sin(i*12.3)*42, z=-i*4-10, h=4+(i%5)*2.5;
      return <group key={i} position={[x,h/2,z]}>
        <mesh castShadow><cylinderGeometry args={[.25,.55,h,7]}/><meshStandardMaterial color="#526b65"/></mesh>
        <mesh position={[0,h*.45,0]} castShadow><coneGeometry args={[1.8+(i%3),h*.48,7]}/><meshStandardMaterial color={i%2?'#527b66':'#64876b'}/></mesh>
      </group>;
    })}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.43,-52]}><planeGeometry args={[13,145]}/><meshStandardMaterial color="#303f42" roughness={.95}/></mesh>
    {Array.from({length:70},(_,i)=>{const x=Math.sin(i*8.71)*48,z=-i*1.85-7,h=3.5+(i%6)*1.5;return <group key={'forest'+i} position={[x,0,z]}><mesh position={[0,h*.32,0]} castShadow><cylinderGeometry args={[.18,.32,h*.65,7]}/><meshStandardMaterial color="#584b3c"/></mesh><mesh position={[0,h*.83,0]} castShadow><coneGeometry args={[1.2+(i%4)*.3,h*.75,8]}/><meshStandardMaterial color={i%3===0?'#315c50':'#3e7059'}/></mesh></group>;})}
    {Array.from({length:18},(_,i)=>{const x=-42+(i%9)*10,z=-92-Math.floor(i/9)*15,h=7+(i%5)*3;return <group key={'tower'+i} position={[x,h/2,z]}><mesh castShadow><boxGeometry args={[5,h,5]}/><meshStandardMaterial color={i%2?'#647d8c':'#536c7c'} metalness={.35} roughness={.5}/></mesh>{Array.from({length:Math.floor(h/2)},(_,r)=><mesh key={r} position={[0,-h/2+1.3+r*1.8,2.53]}><boxGeometry args={[3.7,.55,.05]}/><meshStandardMaterial color="#72d8e8" emissive="#276e8b" emissiveIntensity={.55}/></mesh>)}</group>;})}
    <group position={[-17,0,-28]}><mesh position={[0,.2,0]}><cylinderGeometry args={[5,5,.4,32]}/><meshStandardMaterial color="#4c5c66" metalness={.4}/></mesh><mesh position={[0,1.3,0]}><cylinderGeometry args={[1.3,1.8,2.2,12]}/><meshStandardMaterial color="#b5c5cc" metalness={.7}/></mesh><mesh position={[0,2.5,0]}><sphereGeometry args={[.8,20,16]}/><meshStandardMaterial color="#55d9e7" emissive="#168c9a" emissiveIntensity={.8}/></mesh></group>
    <group position={[23,0,-74]}><mesh position={[0,1,0]}><boxGeometry args={[13,2,8]}/><meshStandardMaterial color="#677984" metalness={.4}/></mesh>{[-4,4].map(x=><mesh key={x} position={[x,2.2,0]}><cylinderGeometry args={[.2,.2,2.5,12]}/><meshStandardMaterial color="#e3b75c" emissive="#926c28" emissiveIntensity={.4}/></mesh>)}</group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[27,-.35,-38]}><circleGeometry args={[12,48]}/><meshStandardMaterial color="#367f91" roughness={.18} transparent opacity={.9}/></mesh>
    {RACE_GATES.map((p,i)=><group key={'race'+i} position={p}><mesh><torusGeometry args={[2.65,.13,12,48]}/><meshStandardMaterial color={raceGate===i?'#6affdc':'#4aaec7'} emissive={raceGate===i?'#36ffcf':'#176d9a'} emissiveIntensity={raceGate===i?2.5:1.1} metalness={.65}/></mesh><pointLight color={raceGate===i?'#62ffd9':'#36b9ed'} intensity={raceGate===i?2.1:.7} distance={7}/><Html distanceFactor={18} position={[0,3.2,0]} center><div style={{color:'#eaffff',font:'bold 10px Arial',textShadow:'0 2px 5px #00131d'}}>LAP {i+1}</div></Html></group>)}
    {GATES.map((p,i)=><group key={i} position={p}>
      <mesh rotation={[0,0,0]}>
        <torusGeometry args={[2.2,.16,12,48]}/>
        <meshStandardMaterial color={passed.includes(i)?'#56e6ae':'#ffb84d'} emissive={passed.includes(i)?'#24b981':'#d47a18'} emissiveIntensity={1.3} metalness={.6}/>
      </mesh>
      <pointLight color={passed.includes(i)?'#56e6ae':'#ffbd58'} intensity={1.2} distance={5}/>
      <Html distanceFactor={18} position={[0,2.8,0]} center><div style={{color:'white',font:'bold 11px Arial',textShadow:'0 2px 5px #000'}}>GATE {i+1}</div></Html>
    </group>)}
    <group ref={drone}>
      <mesh castShadow><boxGeometry args={[.72,.22,.92]}/><meshStandardMaterial color="#172536" metalness={.82} roughness={.22}/></mesh>
      <mesh position={[0,.015,-.04]}><boxGeometry args={[1.02,.10,.48]}/><meshStandardMaterial color="#263c50" metalness={.72} roughness={.28}/></mesh>
      <mesh position={[0,.13,.13]}><sphereGeometry args={[.25,24,16]}/><meshStandardMaterial color="#102d43" metalness={.9} roughness={.12}/></mesh>
      <mesh position={[0,.015,.52]} rotation={[.35,0,0]}><sphereGeometry args={[.16,20,16]}/><meshStandardMaterial color="#07131f" metalness={.6}/></mesh>
      <mesh position={[0,.015,.64]}><sphereGeometry args={[.075,16,12]}/><meshStandardMaterial color="#48eaff" emissive="#20cce8" emissiveIntensity={2.5}/></mesh>
      {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([x,z],i)=><group key={i} position={[x*.78,0,z*.66]}>
        <mesh rotation={[0,Math.PI/4,0]}><boxGeometry args={[1.12,.075,.13]}/><meshStandardMaterial color="#526779" metalness={.85} roughness={.25}/></mesh>
        <mesh position={[0,.10,0]}><cylinderGeometry args={[.19,.16,.15,20]}/><meshStandardMaterial color="#101b29" metalness={.8}/></mesh>
        <Rotor position={[0,.20,0]}/>
        <mesh position={[0,-.13,0]}><cylinderGeometry args={[.035,.045,.22,10]}/><meshStandardMaterial color="#a9bbc8" metalness={.8}/></mesh>
        <mesh position={[0,-.24,0]}><sphereGeometry args={[.055,12,10]}/><meshStandardMaterial color={i%2?'#ff604f':'#48eaff'} emissive={i%2?'#ff3020':'#16b9df'} emissiveIntensity={1.5}/></mesh>
      </group>)}
      <pointLight position={[0,0,.7]} color="#40eaff" intensity={1.5} distance={4}/>
    </group>
    <Float speed={1.2} floatIntensity={.15}><mesh position={[-22,14,-65]}><sphereGeometry args={[7,32,32]}/><meshStandardMaterial color="#d7e4df" roughness={1}/></mesh></Float>
    <Sparkles count={100} scale={[65,25,130]} position={[0,8,-55]} size={1.4} speed={.2} color="#ffffff"/>
  </>;
}
function Rotor({position}) {
 const ref=useRef();
 useFrame((s)=>{if(ref.current)ref.current.rotation.y=s.clock.elapsedTime*28;});
 return <group ref={ref} position={position}><mesh><cylinderGeometry args={[.08,.08,.12,12]}/><meshStandardMaterial color="#d9e6ee" metalness={.8}/></mesh><mesh position={[0,.08,0]}><boxGeometry args={[1.45,.035,.1]}/><meshStandardMaterial color="#263747" metalness={.5}/></mesh></group>;
}

export default function App(){
 const controllerId=new URLSearchParams(window.location.search).get('controller');
 if(controllerId)return <PhoneController peerId={controllerId}/>;
 const [pos,setPos]=useState([0,5,4]); const posRef=useRef([0,5,4]); const velocity=useRef([0,0,0]);
 const [yaw,setYaw]=useState(0); const yawRef=useRef(0); const keys=useRef({});
 const [paused,setPaused]=useState(false),[fpv,setFpv]=useState(false),[passed,setPassed]=useState([]);
 const [battery,setBattery]=useState(100),[speed,setSpeed]=useState(0);
 const [maxSpeed,setMaxSpeed]=useState(8.5),[peerId,setPeerId]=useState(''),[phoneConnected,setPhoneConnected]=useState(false),[copied,setCopied]=useState(false);
 const [missionId,setMissionId]=useState('laps'),[missionStatus,setMissionStatus]=useState('READY'),[missionTime,setMissionTime]=useState(0),[lapCount,setLapCount]=useState(0),[raceGate,setRaceGate]=useState(0);
 const missionActive=useRef(false),missionStart=useRef(0),lapRef=useRef(0),raceGateRef=useRef(0);
 const remote=useRef({forward:0,side:0,vertical:0,yaw:0}); const maxSpeedRef=useRef(8.5);maxSpeedRef.current=maxSpeed;
 useEffect(()=>{
  let peer;
  loadPeerJS().then(Peer=>{
   peer=new Peer();
   peer.on('open',id=>setPeerId(id));
   peer.on('connection',conn=>{
    conn.on('open',()=>setPhoneConnected(true));
    conn.on('data',data=>{if(data&&typeof data==='object'){remote.current={forward:data.forward||0,side:data.side||0,vertical:data.vertical||0,yaw:data.yaw||0};if(Number.isFinite(data.speed))setMaxSpeed(data.speed);}});
    conn.on('close',()=>{setPhoneConnected(false);remote.current={forward:0,side:0,vertical:0,yaw:0};});
   });
   peer.on('error',()=>setNotice('PHONE CONNECTION ERROR — RELOAD TO RETRY'));
  }).catch(()=>setNotice('PHONE LINK UNAVAILABLE — CHECK INTERNET'));
  return()=>{try{peer?.destroy();}catch{}};
 },[]);
 const phoneUrl=peerId?window.location.origin+window.location.pathname+'?controller='+encodeURIComponent(peerId):'';
 const copyPhoneLink=async()=>{try{await navigator.clipboard.writeText(phoneUrl);setCopied(true);setTimeout(()=>setCopied(false),1800);}catch{setNotice('COPY FAILED — USE QR CODE');}};
 const [notice,setNotice]=useState('READY TO FLY — CHECK YOUR SURROUNDINGS');
 useEffect(()=>{
  const down=e=>{const k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();keys.current[k]=true;if(k==='p'||k==='escape')setPaused(v=>!v);if(k==='c')setFpv(v=>!v);};
  const up=e=>{keys.current[e.key.toLowerCase()]=false;};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);
  let frame,last=performance.now(),ui=0;
  const tick=now=>{const dt=Math.min((now-last)/1000,.04);last=now;
   if(!paused){const k=keys.current;let p=posRef.current;let y=yawRef.current;
    y+=((k.q?1:0)-(k.e?1:0)+remote.current.yaw)*dt*1.5;
    const forward=THREE.MathUtils.clamp((((k.w||k.arrowup)?1:0)-((k.s||k.arrowdown)?1:0))+remote.current.forward,-1,1);
    const side=THREE.MathUtils.clamp((((k.d||k.arrowright)?1:0)-((k.a||k.arrowleft)?1:0))+remote.current.side,-1,1);
    const vertical=THREE.MathUtils.clamp((((k[' ']||k.r)?1:0)-((k.shift||k.f)?1:0))+remote.current.vertical,-1,1);
    const v=maxSpeedRef.current;const desired=[(Math.sin(y)*forward+Math.cos(y)*side)*v,vertical*v*.72,(-Math.cos(y)*forward+Math.sin(y)*side)*v];velocity.current=velocity.current.map((value,i)=>THREE.MathUtils.damp(value,desired[i],(forward||side||vertical)?5.5:2.2,dt));const nx=THREE.MathUtils.clamp(p[0]+velocity.current[0]*dt,-55,55);
    const nz=THREE.MathUtils.clamp(p[2]+velocity.current[2]*dt,-125,18);
    const ny=THREE.MathUtils.clamp(p[1]+velocity.current[1]*dt,1,35);
    posRef.current=[nx,ny,nz];yawRef.current=y;
    if(missionActive.current){
      const elapsed=(now-missionStart.current)/1000;
      if(now%100<45)setMissionTime(elapsed);
      if(missionId==='laps'){
        const rg=RACE_GATES[raceGateRef.current];
        if(Math.hypot(nx-rg[0],ny-rg[1],nz-rg[2])<3.1){
          const next=(raceGateRef.current+1)%RACE_GATES.length;raceGateRef.current=next;setRaceGate(next);
          if(next===0){lapRef.current+=1;setLapCount(lapRef.current);setNotice('LAP '+lapRef.current+' / 5 COMPLETE');}else setNotice('RACE CHECKPOINT '+next+' / 4');
          if(lapRef.current>=5){missionActive.current=false;setMissionStatus('COMPLETE');setNotice('MISSION COMPLETE — 5 LAPS!');}
        }
      }else if(missionId==='gates'){
        GATES.forEach((g,i)=>{if(!passed.includes(i)&&Math.hypot(nx-g[0],ny-g[1],nz-g[2])<2.5){setPassed(old=>old.includes(i)?old:[...old,i]);setNotice('CHECKPOINT '+(i+1)+' CLEARED');}});
        const finalGateHit=GATES.some((g,i)=>!passed.includes(i)&&Math.hypot(nx-g[0],ny-g[1],nz-g[2])<2.5);
        if(passed.length>=5&&finalGateHit){missionActive.current=false;setMissionStatus('COMPLETE');setNotice('MISSION COMPLETE — GATE RUN!');}
      }
      const limit=missionId==='laps'?60:45;
      if(elapsed>limit&&missionActive.current){missionActive.current=false;setMissionStatus('FAILED');setNotice('TIME UP — TRY AGAIN');}
    }
    if(now-ui>50){setPos([...posRef.current]);setYaw(y);setSpeed(Math.round(Math.hypot(...velocity.current)));setBattery(b=>Math.max(0,b-dt*.12));ui=now;}
   }
   frame=requestAnimationFrame(tick);
  };frame=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up)};
 },[paused,passed,missionId]);
 const startMission=()=>{posRef.current=[0,5,4];yawRef.current=0;setPos([0,5,4]);setYaw(0);velocity.current=[0,0,0];missionActive.current=true;missionStart.current=performance.now();lapRef.current=0;raceGateRef.current=0;setLapCount(0);setRaceGate(0);setMissionTime(0);setPassed([]);setMissionStatus('RUNNING');setNotice('MISSION START — GOOD LUCK!');};
 const reset=()=>{missionActive.current=false;posRef.current=[0,5,4];yawRef.current=0;setPos([0,5,4]);setYaw(0);velocity.current=[0,0,0];setPassed([]);lapRef.current=0;raceGateRef.current=0;setLapCount(0);setRaceGate(0);setMissionTime(0);setMissionStatus('READY');setBattery(100);setNotice('FLIGHT RESET — READY');};
 return <main className="sim-shell">
  <Canvas shadows dpr={[1,1.5]} camera={{position:[0,9,14],fov:65}}><Suspense fallback={null}><World position={pos} yaw={yaw} fpv={fpv} paused={paused} passed={passed} raceGate={raceGate}/></Suspense></Canvas>
  <div className="sim-top"><div className="sim-brand"><span>✦</span> SKY<span>CTRL</span><small>DRONE FLIGHT SIMULATOR</small></div><div className="sim-live"><i/> SIMULATION ONLINE <b>• TRAINING MODE</b></div><div className="sim-buttons"><button onClick={()=>setFpv(v=>!v)}><Camera size={16}/>{fpv?'CHASE CAM':'FPV VIEW'}</button><button onClick={()=>setPaused(v=>!v)}>{paused?<Play size={16}/>:<Pause size={16}/>}</button><button onClick={reset}><RotateCcw size={16}/></button></div></div>
  <section className="sim-card sim-left"><div className="sim-label">FLIGHT TELEMETRY</div><div className="sim-metric"><span>ALTITUDE</span><strong>{pos[1].toFixed(1)} <small>m</small></strong></div><div className="sim-metric"><span>GROUND SPEED</span><strong>{speed.toFixed(0)} <small>m/s</small></strong></div><div className="sim-metric"><span>HEADING</span><strong>{((yaw*180/Math.PI+360)%360).toFixed(0)}°</strong></div><div className="sim-divider"/><div className="sim-battery"><Battery size={15}/><span>BATTERY</span><b>{battery.toFixed(0)}%</b></div><div className="sim-batbar"><i style={{width:battery+'%'}}/></div><div className="sim-signal"><Signal size={14}/> GPS LOCK <b>STRONG</b></div></section>
  <section className="sim-card sim-right"><div className="sim-label">FLIGHT PLAN</div><h3>GATE RUN</h3><p>Fly through the illuminated checkpoints in sequence.</p><div className="sim-progress"><i style={{width:(passed.length/6*100)+'%'}}/></div><div className="sim-gates"><b>{String(passed.length).padStart(2,'0')}</b> / 06 CHECKPOINTS</div>{passed.length===8&&<div className="sim-success">✦ FLIGHT COMPLETE</div>}</section>
  <section className="sim-card sim-speed-panel"><div className="sim-label"><Gauge size={13}/> SPEED CONTROL</div><div className="sim-speed-value">{maxSpeed.toFixed(1)} <small>m/s</small></div><input aria-label="Maximum flight speed" type="range" min="1" max="20" step=".5" value={maxSpeed} onChange={e=>setMaxSpeed(Number(e.target.value))}/><div className="sim-speed-scale"><span>1 SLOW</span><span>20 FAST</span></div><div className="sim-speed-presets">{[3,8.5,14,20].map(v=><button key={v} className={maxSpeed===v?'active':''} onClick={()=>setMaxSpeed(v)}>{v===3?'SLOW':v===8.5?'NORMAL':v===14?'FAST':'MAX'}</button>)}</div></section>
  <section className="sim-card sim-phone-panel"><div className="sim-label"><Smartphone size={13}/> PHONE LINK</div><div className="sim-phone-state"><i className={phoneConnected?'connected':''}/>{phoneConnected?'PHONE CONNECTED':'PAIR YOUR PHONE'}</div>{peerId?<><img className="sim-qr" alt="QR code to connect phone controller" src={'https://api.qrserver.com/v1/create-qr-code/?size=132x132&data='+encodeURIComponent(phoneUrl)}/><button className="sim-copy-link" onClick={copyPhoneLink}>{copied?<Check size={13}/>:<Copy size={13}/>} {copied?'COPIED':'COPY PHONE LINK'}</button><small>Quét mã QR bằng điện thoại cùng mạng internet.</small></>:<small>Đang tạo mã kết nối...</small>}</section>
  <section className="sim-card sim-mission-panel"><div className="sim-label"><Navigation size={13}/> MISSION CONTROL</div><div className="mission-tabs"><button className={missionId==='laps'?'selected':''} onClick={()=>{missionActive.current=false;setMissionId('laps');setMissionStatus('READY');setMissionTime(0);setLapCount(0);setRaceGate(0);}}>LAP CHALLENGE</button><button className={missionId==='gates'?'selected':''} onClick={()=>{missionActive.current=false;setMissionId('gates');setMissionStatus('READY');setMissionTime(0);setPassed([]);}}>GATE RUN</button></div><h3>{missionId==='laps'?'5 LAPS / 60 SECONDS':'6 GATES / 45 SECONDS'}</h3><p>{missionId==='laps'?'Hoàn thành 5 vòng qua 4 cổng đua phát sáng.':'Bay qua đủ 6 checkpoint theo đường bay.'}</p><div className="mission-progress"><i style={{width:(missionId==='laps'?lapCount/5:passed.length/6)*100+'%'}}/></div><div className="mission-stats"><b>{missionId==='laps'?lapCount+'/5':passed.length+'/8'}</b><strong>{missionTime.toFixed(1)}s</strong></div><div className={'mission-status '+missionStatus.toLowerCase()}>{missionStatus==='RUNNING'?'● IN PROGRESS':missionStatus==='COMPLETE'?'✦ MISSION COMPLETE':missionStatus==='FAILED'?'TIME EXPIRED':'READY TO START'}</div><button className="mission-start" onClick={startMission}>{missionStatus==='RUNNING'?'RESTART MISSION':'START MISSION'}</button></section>
  <div className="sim-notice">{notice}</div>
  <div className="sim-controls"><div className="sim-label">CONTROLS</div><div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>MOVE</span></div><div><kbd>SPACE</kbd><kbd>SHIFT</kbd><span>UP / DOWN</span></div><div><kbd>Q</kbd><kbd>E</kbd><span>YAW LEFT / RIGHT</span></div><div><kbd>C</kbd><span>FPV / CHASE CAMERA</span></div><div><kbd>P</kbd><span>PAUSE</span></div></div>
  <div className="sim-crosshair">＋</div>
  {paused&&<div className="sim-pause"><div><div className="sim-label">SIMULATION PAUSED</div><h1>FLIGHT <span>PAUSED</span></h1><button onClick={()=>setPaused(false)}><Play size={16}/> RESUME FLIGHT</button></div></div>}
  <div className="sim-footer"><Wind size={14}/> WIND 3.2 M/S <span>•</span> CLEAR SKY <span>•</span> TRAINING AIRSPACE</div>
 </main>;
}