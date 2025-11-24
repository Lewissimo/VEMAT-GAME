import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BonusType } from '../types';

export const Tree: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.3, 1, 8]} />
        <meshStandardMaterial color="#5c4033" />
      </mesh>
      {/* Leaves */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <coneGeometry args={[1, 2, 8]} />
        <meshStandardMaterial color="#1a472a" />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.8, 1.5, 8]} />
        <meshStandardMaterial color="#2d5a3f" />
      </mesh>
    </group>
  );
};

export const Sleigh: React.FC<{ color: string }> = ({ color }) => {
  return (
    <group>
      {/* Runners */}
      <mesh position={[-0.4, 0.1, 0]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.1, 0.1, 1.5]} />
        <meshStandardMaterial color="#888" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0.4, 0.1, 0]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.1, 0.1, 1.5]} />
        <meshStandardMaterial color="#888" metalness={0.6} roughness={0.2} />
      </mesh>

      {/* Body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1, 0.5, 1.2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Seat/Back */}
      <mesh position={[0, 0.8, -0.4]} castShadow>
        <boxGeometry args={[0.9, 0.6, 0.2]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Sack of toys/snowballs */}
      <mesh position={[0, 0.8, 0.3]} castShadow>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
    </group>
  );
};

export const Snowman: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
       <mesh position={[0, 1.5, 0.15]} castShadow>
        <coneGeometry args={[0.05, 0.2, 8]} rotation={[Math.PI/2, 0, 0]}/>
        <meshStandardMaterial color="orange" />
      </mesh>
    </group>
  );
};

export const BonusItem: React.FC<{ position: [number, number, number]; type: BonusType }> = ({ position, type }) => {
  const ref = useRef<any>(null);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 2;
      ref.current.position.y = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
  });

  const color = type === BonusType.HEALTH ? '#22c55e' : type === BonusType.DAMAGE ? '#ef4444' : '#eab308';

  return (
    <group position={[position[0], 0, position[2]]}>
      <mesh ref={ref} castShadow receiveShadow>
        {type === BonusType.HEALTH && <boxGeometry args={[0.6, 0.6, 0.6]} />}
        {type === BonusType.DAMAGE && <octahedronGeometry args={[0.5, 0]} />}
        {type === BonusType.MULTI_SHOT && <torusGeometry args={[0.3, 0.1, 16, 32]} />}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>
      {/* Shadow Blob */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="black" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};