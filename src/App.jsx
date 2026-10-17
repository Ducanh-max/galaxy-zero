import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { BatteryCharging, Compass, Crosshair, Gem, Heart, Map, Package, Pause, Play, Radio, Rocket, Shield, Volume2, VolumeX, Zap } from 'lucide-react';

const PLANETS = [
  { id: 'elysium', name: 'ELYSIUM-4', title: 'Echoes of Elysium', ground: '#17233b', grid: '#294568', sky: '#4b4a9c', glow: '#8c79ff', resource: 'ENERGY SHARDS' },
  { id: 'vulcan', name: 'VULCAN-9', title: 'The Ember Signal', ground: '#38202a', grid: '#75404a', sky: '#a94d3d', glow: '#ff805b', resource: 'EMBER CORES' },
  { id: 'cryon', name: 'CRYON-2', title: 'Whispers of Ice', ground: '#183642', grid: '#347080', sky: '#4d9db5', glow: '#8cecff', resource: 'FROST CRYSTALS' }
];

const CRYSTALS = [
  [-5.5, 0.4, -3.5], [-2.8, 0.4, -6.2], [1.2, 0.4, -5.5],
  [5.4, 0.4, -2.2], [4.2, 0.4, 3.8], [-1.8, 0.4, 5.1]
];

function Ground({ planet }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[17, 80]} />
        <meshStandardMaterial color={planet.ground} roughness={0.94} />
      </mesh>
      <gridHelper args={[34, 34, planet.grid, '#1c2d49']} position={[0, 0.015, 0]} />
      {Array.from({ length: 26 }).map((_, i) => {
        const angle = i * 2.4;
        const radius = 7 + (i % 5) * 1.55;
        return <mesh key={i} position={[Math.cos(angle) * radius, 0.22, Math.sin(angle) * radius]} rotation={[0, angle, 0]} castShadow>
          <dodecahedronGeometry args={[0.28 + (i % 3) * 0.13, 0]} />
          <meshStandardMaterial color={i % 2 ? '#334766' : '#263d5d'} roughness={0.8} />
        </mesh>;
      })}
    </group>
  );
}

function PlanetBackdrop({ planet }) {
  return (
    <group position={[12, 8, -24]}>
      <mesh>
        <sphereGeometry args={[7, 48, 48]} />
        <meshStandardMaterial color={planet.sky} roughness={0.88} />
      </mesh>
      <mesh scale={1.018}>
        <sphereGeometry args={[7, 48, 48]} />
        <meshBasicMaterial color={planet.glow} transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
      <mesh rotation={[0.55, 0.1, -0.35]}>
        <torusGeometry args={[9.5, 0.12, 8, 100]} />
        <meshBasicMaterial color={planet.glow} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function Astronaut({ position }) {
  const group = useRef();
  useFrame((state, delta) => {
    if (group.current) {
      group.current.position.x = THREE.MathUtils.damp(group.current.position.x, position[0], 12, delta);
      group.current.position.z = THREE.MathUtils.damp(group.current.position.z, position[2], 12, delta);
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, Math.atan2(-position[0], -position[2]), 5, delta);
    }
  });
  return <group ref={group} position={position}>
    <mesh position={[0, 0.86, 0]} castShadow>
      <capsuleGeometry args={[0.34, 0.62, 6, 12]} />
      <meshStandardMaterial color="#dce8f5" metalness={0.35} roughness={0.34} />
    </mesh>
    <mesh position={[0, 1.55, 0]} castShadow>
      <sphereGeometry args={[0.38, 24, 24]} />
      <meshStandardMaterial color="#f1f6ff" metalness={0.25} roughness={0.22} />
    </mesh>
    <mesh position={[0, 1.57, 0.31]}>
      <sphereGeometry args={[0.265, 24, 18]} />
      <meshStandardMaterial color="#142c4b" metalness={0.8} roughness={0.12} />
    </mesh>
    <mesh position={[-0.43, 0.94, 0]} rotation={[0, 0, -0.22]} castShadow>
      <capsuleGeometry args={[0.13, 0.45, 4, 8]} />
      <meshStandardMaterial color="#a9c5df" metalness={0.3} />
    </mesh>
    <mesh position={[0.43, 0.94, 0]} rotation={[0, 0, 0.22]} castShadow>
      <capsuleGeometry args={[0.13, 0.45, 4, 8]} />
      <meshStandardMaterial color="#a9c5df" metalness={0.3} />
    </mesh>
    <mesh position={[0, 0.76, -0.34]}>
      <boxGeometry args={[0.42, 0.42, 0.18]} />
      <meshStandardMaterial color="#36d9ff" emissive="#168bb0" emissiveIntensity={1.2} />
    </mesh>
    <pointLight position={[0, 1.5, 0.5]} color="#55dfff" intensity={0.7} distance={2.5} />
  </group>;
}

function Crystal({ position, collected, onCollect, index, color }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current && !collected) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.9 + index;
      ref.current.position.y = 0.65 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.12;
    }
  });
  if (collected) return null;
  return <group ref={ref} position={position} onClick={onCollect}>
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.3}>
      <mesh castShadow>
        <octahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.3} metalness={0.35} roughness={0.18} />
      </mesh>
      <pointLight color={color} intensity={0.7} distance={2.4} />
    </Float>
  </group>;
}

function Drone({ position, index, planet }) {
  const droneColor = planet.id === 'vulcan' ? '#d87542' : planet.id === 'cryon' ? '#5aaec4' : '#9b536e';
  const eyeColor = planet.id === 'vulcan' ? '#ffb45e' : planet.id === 'cryon' ? '#9cf3ff' : '#ff536f';
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = 0.9 + Math.sin(state.clock.elapsedTime * 1.4 + index) * 0.22;
      ref.current.rotation.y = state.clock.elapsedTime * 0.35 + index;
    }
  });
  return <group ref={ref} position={position}>
    <mesh castShadow><icosahedronGeometry args={[0.52, 1]} /><meshStandardMaterial color={droneColor} metalness={0.72} roughness={0.3} /></mesh>
    <mesh position={[0, 0, 0.43]}><sphereGeometry args={[0.16, 16, 16]} /><meshBasicMaterial color={eyeColor} /></mesh>
    <pointLight color={eyeColor} intensity={0.8} distance={2.4} />
    <mesh position={[0, -0.42, 0]}><torusGeometry args={[0.42, 0.045, 8, 24]} /><meshBasicMaterial color={droneColor} /></mesh>
  </group>;
}

function Spaceship({ position, flying }) {
  const ref = useRef();
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.position.x = THREE.MathUtils.damp(ref.current.position.x, position[0], 7, delta);
    ref.current.position.z = THREE.MathUtils.damp(ref.current.position.z, position[2], 7, delta);
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, flying ? 2.4 : 0.15, 7, delta);
    ref.current.rotation.z = THREE.MathUtils.damp(ref.current.rotation.z, flying ? -0.08 : 0, 5, delta);
  });
  return <group ref={ref} position={[0, 0.15, 7]}>
    <mesh castShadow rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[0.48, 2.3, 8, 16]} /><meshStandardMaterial color="#dce9f7" metalness={0.72} roughness={0.24} /></mesh>
    <mesh position={[0, 0.18, -0.1]}><sphereGeometry args={[0.43, 24, 16]} /><meshStandardMaterial color="#183b61" metalness={0.8} roughness={0.12} /></mesh>
    <mesh position={[0, -0.02, 1.25]} rotation={[0, 0, Math.PI / 2]}><coneGeometry args={[0.34, 0.9, 8]} /><meshStandardMaterial color="#5bdfff" emissive="#168bb0" emissiveIntensity={1.2} /></mesh>
    {[-1, 1].map((side) => <group key={side} position={[side * 0.72, -0.18, 0]}>
      <mesh rotation={[0, 0, side * -0.12]}><boxGeometry args={[0.12, 0.9, 1.1]} /><meshStandardMaterial color="#8ba7c5" metalness={0.6} /></mesh>
      <mesh position={[0, -0.12, -0.56]}><cylinderGeometry args={[0.12, 0.2, 0.28, 12]} /><meshBasicMaterial color="#54dfff" /></mesh>
    </group>)}
    <pointLight position={[0, 0, -1.2]} color="#39cfff" intensity={flying ? 3 : 0.7} distance={4} />
  </group>;
}

function World({ player, collected, onCollect, flying, planet }) {
  return <>
    <color attach="background" args={['#050816']} />
    <fog attach="fog" args={['#070d20', 18, 48]} />
    <ambientLight intensity={0.62} />
    <directionalLight position={[-5, 12, 7]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
    <pointLight position={[0, 5, 0]} color="#4a6dff" intensity={1.5} distance={18} />
    <Stars radius={90} depth={55} count={2600} factor={4} saturation={0.4} fade speed={0.35} />
    <Sparkles count={90} scale={25} size={2} speed={0.25} color="#8d9eff" />
    <PlanetBackdrop planet={planet} />
    <Ground planet={planet} />
    {!flying && <Astronaut position={player} />}
    <Spaceship position={player} flying={flying} />
    {CRYSTALS.map((p, i) => <Crystal key={i} position={p} index={i} collected={collected.includes(i)} onCollect={() => onCollect(i)} color={planet.glow} />)}
    <Drone position={[-7, 0, 2]} index={1} planet={planet} />
    <Drone position={[7, 0, 5]} index={2} planet={planet} />
    <mesh position={[0, 0.05, -10]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[2.2, 2.35, 48]} />
      <meshBasicMaterial color="#42dfff" transparent opacity={0.55} />
    </mesh>
  </>;
}

export default function App() {
  const [player, setPlayer] = useState([0, 0, 0]);
  const [planetIndex, setPlanetIndex] = useState(0);
  const planet = PLANETS[planetIndex];
  const [collectedByPlanet, setCollectedByPlanet] = useState({});
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const collected = collectedByPlanet[planet.id] || [];
  const [paused, setPaused] = useState(false);
  const [flying, setFlying] = useState(false);
  const [sound, setSound] = useState(false);
  const [health] = useState(100);
  const [energy] = useState(86);
  const keys = useRef({});
  const playerRef = useRef([0, 0, 0]);
  const collectedCount = collected.length;

  const collect = useCallback((index) => {
    setCollectedByPlanet((old) => {
      const current = old[planet.id] || [];
      if (current.includes(index)) return old;
      return { ...old, [planet.id]: [...current, index] };
    });
  }, [planet.id]);

  useEffect(() => {
    const down = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      keys.current[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'p' || e.key === 'Escape') setPaused((v) => !v);
      if (e.key.toLowerCase() === 'e' && !e.repeat) setFlying((v) => !v);
      if (e.key.toLowerCase() === 'i' && !e.repeat) setInventoryOpen((v) => !v);
    };
    const up = (e) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    let frame;
    let previous = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - previous) / 1000, 0.04);
      previous = now;
      if (!paused) {
        const k = keys.current;
        let x = (k.d || k.arrowright ? 1 : 0) - (k.a || k.arrowleft ? 1 : 0);
        let z = (k.s || k.arrowdown ? 1 : 0) - (k.w || k.arrowup ? 1 : 0);
        const length = Math.hypot(x, z) || 1;
        x /= length; z /= length;
        const next = [
          THREE.MathUtils.clamp(playerRef.current[0] + x * dt * (flying ? 9 : 5.2), -14, 14),
          0,
          THREE.MathUtils.clamp(playerRef.current[2] + z * dt * (flying ? 9 : 5.2), -14, 14)
        ];
        playerRef.current = next;
        setPlayer(next);
        CRYSTALS.forEach((p, i) => {
          if (!collected.includes(i) && Math.hypot(next[0] - p[0], next[2] - p[2]) < 0.85) collect(i);
        });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      cancelAnimationFrame(frame);
    };
  }, [paused, collected, collect, flying]);

  const progress = Math.round((collectedCount / CRYSTALS.length) * 100);
  return <main className="game-shell">
    <Canvas shadows camera={{ position: [0, 7.5, 11], fov: 48 }} dpr={[1, 1.7]}>
      <Suspense fallback={null}>
        <World player={player} collected={collected} onCollect={collect} flying={flying} planet={planet} />
      </Suspense>
    </Canvas>
    <div className="vignette" />
    <header className="topbar">
      <a className="brand" href="#"><span className="brand-mark"><Rocket size={19} /></span><span>GALAXY<span className="brand-accent">ZERO</span><small>THE FRONTIER AWAITS</small></span></a>
      <div className="sector-pill"><span className="live-dot" /> SECTOR 07 <i /> {planet.name} <i /> {flying ? "FLIGHT MODE" : "ON FOOT"}</div>
      <div className="top-actions">
        <button className="icon-button" onClick={() => setSound(!sound)} aria-label="Toggle sound">{sound ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
        <button className="icon-button" onClick={() => setPaused(!paused)} aria-label="Pause">{paused ? <Play size={18} /> : <Pause size={18} />}</button>
        <div className="pilot-avatar">P</div>
      </div>
    </header>

    <section className="planet-selector glass">
      <div className="eyebrow"><span className="eyebrow-line" /> STAR CHART</div>
      <div className="planet-options">
        {PLANETS.map((item, index) => <button key={item.id} className={planetIndex === index ? 'planet-option active' : 'planet-option'} onClick={() => { setPlanetIndex(index); setPlayer([0, 0, 0]); playerRef.current = [0, 0, 0]; }}>
          <span className={'planet-orb ' + item.id} />
          <span><strong>{item.name}</strong><small>{index === 0 ? 'HABITABLE' : index === 1 ? 'VOLCANIC' : 'FROZEN'}</small></span>
          <i>{planetIndex === index ? '●' : '○'}</i>
        </button>)}
      </div>
    </section>
    <button className="inventory-trigger glass" onClick={() => setInventoryOpen((v) => !v)}><Package size={15} /> INVENTORY <span>{Object.values(collectedByPlanet).reduce((sum, items) => sum + items.length, 0)}</span></button>
    <section className="mission-card glass">
      <div className="eyebrow"><span className="eyebrow-line" /> CURRENT OBJECTIVE</div>
      <div className="mission-title">{planet.title}</div>
      <p>Explore the surface and recover rare planetary resources.</p>
      <div className="progress-row"><span>MISSION PROGRESS</span><strong>{progress}%</strong></div>
      <div className="progress-track"><span style={{ width: progress + '%' }} /></div>
      <div className="shard-count"><Gem size={15} /> {collectedCount} <span>/ {CRYSTALS.length} {planet.resource} RECOVERED</span></div>
      {progress === 100 && <div className="mission-complete">✦ OBJECTIVE COMPLETE</div>}
    </section>

    <section className="status-card glass">
      <div className="eyebrow"><span className="eyebrow-line" /> SUIT STATUS</div>
      <div className="stat-line"><span><Heart size={14} /> VITALS</span><strong>{health}%</strong></div>
      <div className="mini-track"><span className="health-fill" style={{ width: health + '%' }} /></div>
      <div className="stat-line"><span><BatteryCharging size={14} /> ENERGY</span><strong>{energy}%</strong></div>
      <div className="mini-track"><span className="energy-fill" style={{ width: energy + '%' }} /></div>
      <div className="stat-footer"><Shield size={13} /> LIFE SUPPORT ONLINE</div>
    </section>

    <div className="coordinates glass"><Compass size={15} /><span>POSITION</span><strong>{player[0].toFixed(1)} / {player[2].toFixed(1)}</strong></div>

    <aside className="controls glass">
      <div className="eyebrow"><span className="eyebrow-line" /> FLIGHT MANUAL</div>
      <div className="control-row"><div className="keycap">W</div><span>Move forward</span></div>
      <div className="control-row"><div className="keycap">A</div><div className="keycap">S</div><div className="keycap">D</div><span>Move around</span></div>
      <div className="control-row"><div className="keycap">E</div><span>Enter / exit ship</span></div><div className="control-row"><div className="keycap">I</div><span>Open inventory</span></div><div className="control-row"><div className="keycap">P</div><span>Pause mission</span></div>
    </aside>


    {inventoryOpen && <section className="inventory-panel glass"><div className="inventory-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> EXPLORER STORAGE</div><h3>RESOURCE INVENTORY</h3></div><button className="inventory-close" onClick={() => setInventoryOpen(false)}>×</button></div>{PLANETS.map((item) => { const count = (collectedByPlanet[item.id] || []).length; return <div className="inventory-item" key={item.id}><span className={'planet-orb ' + item.id} /><div><strong>{item.name}</strong><small>{item.resource}</small></div><b>{count} / {CRYSTALS.length}</b></div>; })}<p className="inventory-note">Resources remain stored when you travel between planets.</p></section>}
    <div className="bottom-center"><span className="bottom-line" /><Radio size={14} /><span>DEEP SPACE NETWORK</span><b>CONNECTED</b><span className="bottom-line" /></div>
    {paused && <div className="pause-overlay"><div className="pause-panel glass"><div className="pause-icon"><Pause size={24} /></div><div className="eyebrow">MISSION SUSPENDED</div><h1>TAKE A BREATH,<br /><span>EXPLORER.</span></h1><p>Your journey is waiting.</p><button className="primary-button" onClick={() => setPaused(false)}><Play size={16} fill="currentColor" /> RESUME MISSION</button></div></div>}
    <div className="crosshair"><Crosshair size={18} /></div>
    <div className="toast"><Zap size={14} /> {flying ? "Flight mode active — explore faster" : "Press E to board your ship, then explore the surface"}</div>
  </main>;
}