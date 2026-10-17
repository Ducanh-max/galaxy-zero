import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, Sparkles, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Battery, Camera, Gauge, Navigation, Pause, Play, RotateCcw, Signal, Wind } from 'lucide-react';

const GATES = [[0,3,-18],[11,5,-34],[-10,7,-50],[2,4,-68],[16,8,-86],[-13,5,-105]];

function World({ position, yaw, fpv, paused, onGate, passed }) {
  const drone = useRef();
  const cameraTarget = useRef(new THREE.Vector3());
  useFrame((state, dt) => {
    if (!drone.current) return;
    drone.current.position.lerp(new THREE.Vector3(...position), 1 - Math.exp(-10 * dt));
    drone.current.rotation.y = THREE.MathUtils.damp(drone.current.rotation.y, yaw, 7, dt);
    drone.current.rotation.z = THREE.MathUtils.damp(drone.current.rotation.z, THREE.MathUtils.clamp(-Math.sin(yaw) * 0.13, -.18, .18), 4, dt);
    drone.current.rotation.z = THREE.MathUtils.damp(drone.current.rotation.z, 0, 5, dt);
    const target = new THREE.Vector3(position[0], position[1], position[2]);
    const offset = fpv ? new THREE.Vector3(0, .08, -.28) : new THREE.Vector3(0, 5.8, 12);
    offset.applyAxisAngle(new THREE.Vector3(0,1,0), yaw);
    const desired = target.clone().add(offset);
    state.camera.position.lerp(desired, 1 - Math.exp(-3.2*dt));
    cameraTarget.current.copy(target).add(new THREE.Vector3(0, fpv ? 0 : .2, 0));
    state.camera.lookAt(cameraTarget.current);
  });
  return <>
    <color attach="background" args={['#a9c9d8']} />
    <fog attach="fog" args={['#a9c9d8', 45, 155]} />
    <ambientLight intensity={1.15} />
    <hemisphereLight args={['#d8f2ff','#526b49',1.1]} />
    <directionalLight position={[-30,45,20]} intensity={2.2} castShadow shadow-mapSize={[2048,2048]} />
    <Stars radius={180} depth={80} count={900} factor={2} fade speed={0.15}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.5,-45]} receiveShadow>
      <planeGeometry args={[260,260]} /><meshStandardMaterial color="#55745e" roughness={1}/>
    </mesh>
    <gridHelper args={[220,44,'#b7d0bb','#78947d']} position={[0,-.48,-45]}/>
    {Array.from({length:38},(_,i)=>{
      const x=Math.sin(i*12.3)*42, z=-i*4-10, h=4+(i%5)*2.5;
      return <group key={i} position={[x,h/2,z]}>
        <mesh castShadow><cylinderGeometry args={[.25,.55,h,7]}/><meshStandardMaterial color="#526b65"/></mesh>
        <mesh position={[0,h*.45,0]} castShadow><coneGeometry args={[1.8+(i%3),h*.48,7]}/><meshStandardMaterial color={i%2?'#527b66':'#64876b'}/></mesh>
      </group>;
    })}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.43,-52]}><planeGeometry args={[13,145]}/><meshStandardMaterial color="#303f42" roughness={.95}/></mesh>
    {Array.from({length:70},(_,i)=>{const x=Math.sin(i*8.71)*48,z=-i*1.85-7,h=3.5+(i%6)*1.5;return <group key={'forest'+i} position={[x,0,z]}><mesh position={[0,h*.32,0]} castShadow><cylinderGeometry args={[.18,.32,h*.65,7]}/><meshStandardMaterial color="#584b3c"/></mesh><mesh position={[0,h*.83,0]} castShadow><coneGeometry args={[1.2+(i%4)*.3,h*.75,8]}/><meshStandardMaterial color={i%3===0?'#315c50':'#3e7059'}/></mesh></group>;})}
    <group position={[-17,0,-28]}><mesh position={[0,.2,0]}><cylinderGeometry args={[5,5,.4,32]}/><meshStandardMaterial color="#4c5c66" metalness={.4}/></mesh><mesh position={[0,1.3,0]}><cylinderGeometry args={[1.3,1.8,2.2,12]}/><meshStandardMaterial color="#b5c5cc" metalness={.7}/></mesh><mesh position={[0,2.5,0]}><sphereGeometry args={[.8,20,16]}/><meshStandardMaterial color="#55d9e7" emissive="#168c9a" emissiveIntensity={.8}/></mesh></group>
    <group position={[23,0,-74]}><mesh position={[0,1,0]}><boxGeometry args={[13,2,8]}/><meshStandardMaterial color="#677984" metalness={.4}/></mesh>{[-4,4].map(x=><mesh key={x} position={[x,2.2,0]}><cylinderGeometry args={[.2,.2,2.5,12]}/><meshStandardMaterial color="#e3b75c" emissive="#926c28" emissiveIntensity={.4}/></mesh>)}</group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[27,-.35,-38]}><circleGeometry args={[12,48]}/><meshStandardMaterial color="#367f91" roughness={.18} transparent opacity={.9}/></mesh>
    {GATES.map((p,i)=><group key={i} position={p}>
      <mesh rotation={[0,0,0]}>
        <torusGeometry args={[2.2,.16,12,48]}/>
        <meshStandardMaterial color={passed.includes(i)?'#56e6ae':'#ffb84d'} emissive={passed.includes(i)?'#24b981':'#d47a18'} emissiveIntensity={1.3} metalness={.6}/>
      </mesh>
      <pointLight color={passed.includes(i)?'#56e6ae':'#ffbd58'} intensity={1.2} distance={5}/>
      <Html distanceFactor={18} position={[0,2.8,0]} center><div style={{color:'white',font:'bold 11px Arial',textShadow:'0 2px 5px #000'}}>GATE {i+1}</div></Html>
    </group>)}
    <group ref={drone}>
      <mesh castShadow><boxGeometry args={[1.25,.22,.85]}/><meshStandardMaterial color="#202d3c" metalness={.8} roughness={.25}/></mesh>
      <mesh position={[0,.13,.13]}><sphereGeometry args={[.28,24,16]}/><meshStandardMaterial color="#1b4056" metalness={.9} roughness={.12}/></mesh>
      <mesh position={[0,0,.48]}><boxGeometry args={[.48,.09,.28]}/><meshStandardMaterial color="#35d8e8" emissive="#168da8" emissiveIntensity={1.3}/></mesh>
      {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([x,z],i)=><group key={i} position={[x*.82,0,z*.62]}>
        <mesh><boxGeometry args={[.95,.09,.12]}/><meshStandardMaterial color="#9caebd" metalness={.7}/></mesh>
        <Rotor position={[x*.46,.12,0]}/>
        <mesh position={[0,-.1,0]}><cylinderGeometry args={[.09,.13,.2,12]}/><meshStandardMaterial color="#ffb84d" emissive="#d87820" emissiveIntensity={.6}/></mesh>
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
 const [pos,setPos]=useState([0,5,4]); const posRef=useRef([0,5,4]);
 const [yaw,setYaw]=useState(0); const yawRef=useRef(0); const keys=useRef({});
 const [paused,setPaused]=useState(false),[fpv,setFpv]=useState(false),[passed,setPassed]=useState([]);
 const [battery,setBattery]=useState(100),[speed,setSpeed]=useState(0);
 const [notice,setNotice]=useState('READY TO FLY — CHECK YOUR SURROUNDINGS');
 useEffect(()=>{
  const down=e=>{const k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();keys.current[k]=true;if(k==='p'||k==='escape')setPaused(v=>!v);if(k==='c')setFpv(v=>!v);};
  const up=e=>{keys.current[e.key.toLowerCase()]=false;};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);
  let frame,last=performance.now(),ui=0;
  const tick=now=>{const dt=Math.min((now-last)/1000,.04);last=now;
   if(!paused){const k=keys.current;let p=posRef.current;let y=yawRef.current;
    y+=((k.q?1:0)-(k.e?1:0))*dt*1.5;
    const forward=((k.w||k.arrowup)?1:0)-((k.s||k.arrowdown)?1:0);
    const side=((k.d||k.arrowright)?1:0)-((k.a||k.arrowleft)?1:0);
    const vertical=((k[' ']||k.r)?1:0)-((k.shift||k.f)?1:0);
    const v=10;const desired=[(Math.sin(y)*forward+Math.cos(y)*side)*v,vertical*v*.72,(-Math.cos(y)*forward+Math.sin(y)*side)*v];velocity.current=velocity.current.map((value,i)=>THREE.MathUtils.damp(value,desired[i],(forward||side||vertical)?13:3.8,dt));const nx=THREE.MathUtils.clamp(p[0]+velocity.current[0]*dt,-55,55);
    const nz=THREE.MathUtils.clamp(p[2]+velocity.current[2]*dt,-125,18);
    const ny=THREE.MathUtils.clamp(p[1]+velocity.current[1]*dt,1,35);
    posRef.current=[nx,ny,nz];yawRef.current=y;
    setBattery(b=>Math.max(0,b-dt*.12));
    GATES.forEach((g,i)=>{if(!passed.includes(i)&&Math.hypot(nx-g[0],ny-g[1],nz-g[2])<2.5){setPassed(old=>old.includes(i)?old:[...old,i]);setNotice('CHECKPOINT '+(i+1)+' CLEARED');}});
    if(now-ui>90){setPos([...posRef.current]);setYaw(y);setSpeed(Math.round(Math.hypot(...velocity.current)));ui=now;}
   }
   frame=requestAnimationFrame(tick);
  };frame=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up)};
 },[paused,passed]);
 const reset=()=>{posRef.current=[0,5,4];yawRef.current=0;setPos([0,5,4]);setYaw(0);velocity.current=[0,0,0];setPassed([]);setBattery(100);setNotice('FLIGHT RESET — READY');};
 return <main className="sim-shell">
  <Canvas shadows dpr={[1,1.5]} camera={{position:[0,9,14],fov:65}}><Suspense fallback={null}><World position={pos} yaw={yaw} fpv={fpv} paused={paused} passed={passed}/></Suspense></Canvas>
  <div className="sim-top"><div className="sim-brand"><span>✦</span> SKY<span>CTRL</span><small>DRONE FLIGHT SIMULATOR</small></div><div className="sim-live"><i/> SIMULATION ONLINE <b>• TRAINING MODE</b></div><div className="sim-buttons"><button onClick={()=>setFpv(v=>!v)}><Camera size={16}/>{fpv?'CHASE CAM':'FPV VIEW'}</button><button onClick={()=>setPaused(v=>!v)}>{paused?<Play size={16}/>:<Pause size={16}/>}</button><button onClick={reset}><RotateCcw size={16}/></button></div></div>
  <section className="sim-card sim-left"><div className="sim-label">FLIGHT TELEMETRY</div><div className="sim-metric"><span>ALTITUDE</span><strong>{pos[1].toFixed(1)} <small>m</small></strong></div><div className="sim-metric"><span>GROUND SPEED</span><strong>{speed.toFixed(0)} <small>m/s</small></strong></div><div className="sim-metric"><span>HEADING</span><strong>{((yaw*180/Math.PI+360)%360).toFixed(0)}°</strong></div><div className="sim-divider"/><div className="sim-battery"><Battery size={15}/><span>BATTERY</span><b>{battery.toFixed(0)}%</b></div><div className="sim-batbar"><i style={{width:battery+'%'}}/></div><div className="sim-signal"><Signal size={14}/> GPS LOCK <b>STRONG</b></div></section>
  <section className="sim-card sim-right"><div className="sim-label">FLIGHT PLAN</div><h3>GATE RUN</h3><p>Fly through the illuminated checkpoints in sequence.</p><div className="sim-progress"><i style={{width:(passed.length/6*100)+'%'}}/></div><div className="sim-gates"><b>{String(passed.length).padStart(2,'0')}</b> / 06 CHECKPOINTS</div>{passed.length===6&&<div className="sim-success">✦ FLIGHT COMPLETE</div>}</section>
  <div className="sim-notice">{notice}</div>
  <div className="sim-controls"><div className="sim-label">CONTROLS</div><div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>MOVE</span></div><div><kbd>SPACE</kbd><kbd>SHIFT</kbd><span>UP / DOWN</span></div><div><kbd>Q</kbd><kbd>E</kbd><span>YAW LEFT / RIGHT</span></div><div><kbd>C</kbd><span>FPV / CHASE CAMERA</span></div><div><kbd>P</kbd><span>PAUSE</span></div></div>
  <div className="sim-crosshair">＋</div>
  {paused&&<div className="sim-pause"><div><div className="sim-label">SIMULATION PAUSED</div><h1>FLIGHT <span>PAUSED</span></h1><button onClick={()=>setPaused(false)}><Play size={16}/> RESUME FLIGHT</button></div></div>}
  <div className="sim-footer"><Wind size={14}/> WIND 3.2 M/S <span>•</span> CLEAR SKY <span>•</span> TRAINING AIRSPACE</div>
 </main>;
}