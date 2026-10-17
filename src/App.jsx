import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Shield, Swords, Heart, Zap, RotateCcw, Pause, Play, Trophy } from 'lucide-react';

const START_ENEMIES = [
 {id:1,x:-17,z:-17,hp:100,max:100,type:'hero'},
 {id:2,x:18,z:-23,hp:100,max:100,type:'hero'},
 {id:3,x:0,z:-31,hp:100,max:100,type:'hero'},
 {id:4,x:-8,z:-6,hp:65,max:65,type:'minion'},
 {id:5,x:9,z:-8,hp:65,max:65,type:'minion'},
 {id:6,x:0,z:-13,hp:65,max:65,type:'minion'}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function Arena({player,enemies,allyMinions,enemyCoreHp,playerHp,fx}) {
 const camera=useRef();
 useFrame((state,dt)=>{
  const desired=new THREE.Vector3(player.x,38,player.z+34);
  state.camera.position.lerp(desired,1-Math.exp(-3*dt));
  state.camera.lookAt(player.x,0,player.z-2);
 });
 return <>
  <color attach="background" args={['#101c2c']}/><fog attach="fog" args={['#101c2c',65,135]}/>
  <ambientLight intensity={1.25}/><hemisphereLight args={['#bdeaff','#294b38',1.4]}/>
  <directionalLight position={[-25,45,15]} intensity={2.1} castShadow shadow-mapSize={[2048,2048]}/>
  <Stars radius={150} depth={55} count={1000} factor={2} fade speed={.15}/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.35,0]} receiveShadow><planeGeometry args={[120,100]}/><meshStandardMaterial color="#315844" roughness={1}/></mesh>
  <gridHelper args={[120,30,'#66866c','#3e654c']} position={[0,-.32,0]}/>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.29,0]}><planeGeometry args={[13,100]}/><meshStandardMaterial color="#7b795f" roughness={1}/></mesh>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.26,0]}><planeGeometry args={[1.1,100]}/><meshStandardMaterial color="#d9d2a2"/></mesh>
  {Array.from({length:16},(_,i)=><group key={'tree'+i} position={[(i%2?1:-1)*(22+(i%4)*5),0,-43+i*5.7]}><mesh position={[0,1.4,0]}><cylinderGeometry args={[.35,.5,2.8,7]}/><meshStandardMaterial color="#554333"/></mesh><mesh position={[0,3.5,0]}><coneGeometry args={[2.2,4.2,8]}/><meshStandardMaterial color={i%2?'#286044':'#39734b'}/></mesh></group>)}
  {[-1,1].map(side=><group key={side}>{[-29,-8,15].map((z,i)=><group key={z} position={[side*28,0,z]}><mesh position={[0,1.1,0]}><boxGeometry args={[5,2.2,5]}/><meshStandardMaterial color="#455b70"/></mesh><mesh position={[0,2.6,0]}><coneGeometry args={[3.2,2.2,4]}/><meshStandardMaterial color="#5b7790"/></mesh></group>)}</group>)}
  <Base x={0} z={39} color="#48c5ff" hp={100} label="ALLIED CORE"/>
  <Base x={0} z={-39} color="#ff626f" hp={enemyCoreHp} label="ENEMY CORE"/>
  {[-1,1].map((side,i)=><Tower key={i} x={side*13} z={i===0?22:-22} color={i===0?'#48c5ff':'#ff626f'}/>)}
  <Hero x={player.x} z={player.z} color="#4dd7ff" hp={playerHp} player/>
  {enemies.map(e=><Hero key={e.id} x={e.x} z={e.z} color={e.type==='hero'?'#ff6576':'#e8a95c'} hp={e.hp/e.max*100} small={e.type==='minion'}/>)}
  {allyMinions.map(e=><Hero key={'a'+e.id} x={e.x} z={e.z} color="#72e5bd" hp={e.hp} small/>)}
  {fx&&<SpellEffect fx={fx}/>}
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.2,0]}><ringGeometry args={[5.4,5.65,64]}/><meshBasicMaterial color="#8cecff" transparent opacity={.55}/></mesh>
 </>;
}
function Base({x,z,color,hp,label}) {
 return <group position={[x,0,z]}><mesh position={[0,2,0]}><cylinderGeometry args={[4.5,5.2,4,8]}/><meshStandardMaterial color="#34495c" metalness={.5}/></mesh><mesh position={[0,5,0]}><octahedronGeometry args={[2.5,1]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1}/></mesh><mesh position={[0,7.5,0]}><sphereGeometry args={[.45,16,12]}/><meshBasicMaterial color={color}/></mesh><Text position={[0,9,0]} fontSize={1.15} color="white" anchorX="center">{label}</Text><mesh position={[0,8.2,0]}><boxGeometry args={[8,.25,.25]}/><meshBasicMaterial color="#182638"/></mesh><mesh position={[-4+8*hp/100,8.2,.16]}><boxGeometry args={[8*hp/100,.18,.08]}/><meshBasicMaterial color={color}/></mesh></group>;
}
function Tower({x,z,color}) {
 return <group position={[x,0,z]}><mesh position={[0,1.7,0]}><cylinderGeometry args={[1.3,1.8,3.4,8]}/><meshStandardMaterial color="#7e929e" metalness={.5}/></mesh><mesh position={[0,3.9,0]}><octahedronGeometry args={[1.5]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.9}/></mesh><mesh position={[0,5.4,0]}><sphereGeometry args={[.35,16,12]}/><meshBasicMaterial color={color}/></mesh></group>;
}
function Hero({x,z,color,hp,player,small}) {
 return <group position={[x,0,z]} scale={small?.72:1}>
  <mesh position={[0,.95,0]} castShadow><capsuleGeometry args={[.58,.85,5,10]}/><meshStandardMaterial color={color} metalness={.3} roughness={.38}/></mesh>
  <mesh position={[0,1.95,0]} castShadow><sphereGeometry args={[.48,18,16]}/><meshStandardMaterial color={player?'#d9f6ff':'#f2d5c2'} roughness={.55}/></mesh>
  <mesh position={[0,2.05,-.08]}><torusGeometry args={[.52,.12,8,20]}/><meshStandardMaterial color={color} metalness={.7}/></mesh>
  <mesh position={[0,.18,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.85,1,28]}/><meshBasicMaterial color={color} transparent opacity={.8}/></mesh>
  <mesh position={[0,2.75,0]}><boxGeometry args={[1.5,.12,.08]}/><meshBasicMaterial color="#172331"/></mesh>
  <mesh position={[-.75+1.5*clamp(hp,0,100)/100,2.75,.05]}><boxGeometry args={[1.5*clamp(hp,0,100)/100,.1,.05]}/><meshBasicMaterial color={hp>35?'#62e6a8':'#ff5b70'}/></mesh>
 </group>;
}
function SpellEffect({fx}) {
 return <group position={[fx.x,.35,fx.z]}><Float speed={4} floatIntensity={.4}><mesh><sphereGeometry args={[fx.kind==='R'?5:fx.kind==='Q'?3.2:1.4,24,16]}/><meshBasicMaterial color={fx.kind==='R'?'#e7a6ff':'#56eaff'} transparent opacity={.3}/></mesh><mesh><ringGeometry args={[fx.kind==='R'?4:2,fx.kind==='R'?4.5:2.4,48]}/><meshBasicMaterial color="#d7fbff" transparent opacity={.85}/></mesh></Float></group>;
}

export default function App(){
 const [player,setPlayer]=useState({x:0,z:28});
 const playerRef=useRef(player);
 const [hp,setHp]=useState(100),hpRef=useRef(100);
 const [enemies,setEnemies]=useState(START_ENEMIES),enemyRef=useRef(START_ENEMIES);
 const [allyMinions,setAllyMinions]=useState([]);
 const [kills,setKills]=useState(0),[coreHp,setCoreHp]=useState(100);
 const [fx,setFx]=useState(null),[notice,setNotice]=useState('BẮT ĐẦU TRẬN ĐẤU • PHÁ HỦY NHÀ CHÍNH ĐỊCH');
 const [cool,setCool]=useState({Q:0,E:0,R:0}),coolRef=useRef({Q:0,E:0,R:0});
 const [paused,setPaused]=useState(false),[dead,setDead]=useState(false),[won,setWon]=useState(false);
 const keys=useRef({}),lastAttack=useRef(0),lastSpawn=useRef(0),fxTimer=useRef(null);
 useEffect(()=>{
  const down=e=>{const k=e.key.toLowerCase();if(['w','a','s','d',' ','q','e','r','j'].includes(k))e.preventDefault();keys.current[k]=true;if(k==='p')setPaused(v=>!v);if(k==='q'||k==='e'||k==='r')cast(k.toUpperCase());};
  const up=e=>{keys.current[e.key.toLowerCase()]=false;};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);
  const timer=setInterval(()=>{
   if(paused||dead||won)return;
   const k=keys.current,p=playerRef.current;
   let dx=(k.d?1:0)-(k.a?1:0),dz=(k.s?1:0)-(k.w?1:0),len=Math.hypot(dx,dz)||1;
   const next={x:clamp(p.x+dx/len*.75,-48,48),z:clamp(p.z+dz/len*.75,-44,44)};
   playerRef.current=next;setPlayer(next);
   let list=enemyRef.current.map(e=>{
    const vx=next.x-e.x,vz=next.z-e.z,d=Math.hypot(vx,vz)||1;
    if(d>3.3)return {...e,x:e.x+vx/d*(e.type==='hero'?.12:.17),z:e.z+vz/d*(e.type==='hero'?.12:.17)};
    if(Math.random()<.13){hpRef.current=Math.max(0,hpRef.current-(e.type==='hero'?3:1.5));setHp(hpRef.current);}
    return e;
   });
   enemyRef.current=list;setEnemies(list);
   if(Date.now()-lastSpawn.current>8500){lastSpawn.current=Date.now();setAllyMinions(m=>[...m,{id:Date.now(),x:0,z:32,hp:100}]);}
   setAllyMinions(m=>m.map(a=>({...a,z:Math.max(-33,a.z-.18)})).filter(a=>a.z>-34));
   coolRef.current={Q:Math.max(0,coolRef.current.Q-.1),E:Math.max(0,coolRef.current.E-.1),R:Math.max(0,coolRef.current.R-.1)};setCool({...coolRef.current});
   if(hpRef.current<=0)setDead(true);
  },100);
  return()=>{clearInterval(timer);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);};
 },[paused,dead,won]);
 function showFx(kind,x,z){setFx({kind,x,z});clearTimeout(fxTimer.current);fxTimer.current=setTimeout(()=>setFx(null),650);}
 function attack(){if(paused||dead||won)return;const p=playerRef.current;let list=enemyRef.current.map(e=>Math.hypot(e.x-p.x,e.z-p.z)<9?{...e,hp:e.hp-25}:e).filter(e=>e.hp>0);if(list.length<enemyRef.current.length){setKills(v=>v+enemyRef.current.length-list.length);setNotice('ĐÒN ĐÁNH TRÚNG MỤC TIÊU!');}enemyRef.current=list;setEnemies(list);showFx('Q',p.x,p.z-4);lastAttack.current=Date.now();}
 function cast(kind){if(paused||dead||won||coolRef.current[kind]>0)return;const p=playerRef.current;const cd={Q:4,E:7,R:18}[kind];coolRef.current={...coolRef.current,[kind]:cd};setCool({...coolRef.current});if(kind==='E'){playerRef.current={x:clamp(p.x,-48,48),z:clamp(p.z-8,-44,44)};setPlayer(playerRef.current);}const radius=kind==='R'?18:kind==='Q'?10:6;const damage={Q:48,E:32,R:100}[kind];const list=enemyRef.current.map(e=>Math.hypot(e.x-p.x,e.z-p.z)<radius?{...e,hp:e.hp-damage}:e).filter(e=>e.hp>0);if(list.length<enemyRef.current.length){setKills(v=>v+enemyRef.current.length-list.length);setNotice(kind==='R'?'SIÊU CHIÊU! QUÉT SẠCH KHU VỰC':'KỸ NĂNG TRÚNG ĐÍCH!');}enemyRef.current=list;setEnemies(list);showFx(kind,p.x,p.z-2);}
 function reset(){playerRef.current={x:0,z:28};setPlayer(playerRef.current);hpRef.current=100;setHp(100);enemyRef.current=START_ENEMIES;setEnemies(START_ENEMIES);setKills(0);setCoreHp(100);setDead(false);setWon(false);setPaused(false);coolRef.current={Q:0,E:0,R:0};setCool({...coolRef.current});setNotice('TRẬN ĐẤU MỚI • TIẾN LÊN ĐƯỜNG GIỮA');}
 return <main className="moba-shell">
  <Canvas shadows camera={{position:[0,38,62],fov:48}}><Arena player={player} enemies={enemies} allyMinions={allyMinions} enemyCoreHp={coreHp} playerHp={hp} fx={fx}/></Canvas>
  <header className="moba-top"><div className="moba-logo">ARENA <b>ZERO</b><small>5V5 • FANTASY MOBA</small></div><div className="moba-score"><span>BLUE TEAM</span><strong>{kills}</strong><i>VS</i><strong>{Math.max(0,5-enemies.length)}</strong><span>RED TEAM</span></div><div className="moba-top-actions"><button onClick={()=>setPaused(v=>!v)}>{paused?<Play/>:<Pause/>}</button><button onClick={reset}><RotateCcw/></button></div></header>
  <div className="moba-objective"><Trophy size={14}/> MỤC TIÊU: PHÁ HỦY NHÀ CHÍNH ĐỎ <b>•</b> ĐƯỜNG GIỮA</div>
  <aside className="moba-stats"><div className="moba-player-name"><span className="hero-avatar">✦</span><div><b>AZURE KNIGHT</b><small>LEVEL 1 • WARRIOR</small></div></div><div className="stat-row"><Heart size={14}/><div className="stat-track"><i style={{width:hp+'%'}}/></div><b>{Math.ceil(hp)}/100</b></div><div className="stat-row mana"><Zap size={14}/><div className="stat-track"><i style={{width:'85%'}}/></div><b>85/100</b></div><div className="stat-row"><Shield size={14}/><span>ARMOR</span><b>12</b></div></aside>
  <div className="moba-notice">{notice}</div>
  <section className="moba-skills"><button className="attack-btn" onClick={attack}><Swords/><b>ĐÁNH THƯỜNG</b><small>CLICK / J</small></button>{['Q','E','R'].map((s,i)=><button key={s} className={'skill-btn skill-'+s} onClick={()=>cast(s)} disabled={cool[s]>0}><span>{s==='Q'?'✦':s==='E'?'➤':'✹'}</span><b>{s}</b><small>{cool[s]>0?cool[s].toFixed(1)+'s':['4s','7s','18s'][i]}</small></button>)}</section>
  <div className="moba-controls"><b>ĐIỀU KHIỂN</b><span>W A S D · DI CHUYỂN</span><span>CLICK / J · ĐÁNH</span><span>Q · KIẾM QUANG</span><span>E · LƯỚT</span><span>R · BÃO NĂNG LƯỢNG</span><span>P · TẠM DỪNG</span></div>
  <div className="moba-minimap"><div className="mini-diag"/><i className="mini-blue"/><i className="mini-red"/><span>MINIMAP</span></div>
  <div className="moba-bottom"><span>⚔ 5V5 ARENA</span><span>● MATCH IN PROGRESS</span><span>FPS SIMULATION</span></div>
  {(paused||dead||won)&&<div className="moba-overlay"><div><h1>{paused?'TẠM DỪNG':dead?'BẠN ĐÃ BỊ HẠ GỤC':'CHIẾN THẮNG!'}</h1><p>{paused?'Trận đấu đang tạm dừng.':dead?'Hãy thử lại và phối hợp kỹ năng hợp lý hơn.':'Nhà chính đối phương đã bị phá hủy.'}</p><button onClick={paused?()=>setPaused(false):reset}>{paused?'TIẾP TỤC':'CHƠI LẠI'}</button></div></div>}
 </main>;
}
