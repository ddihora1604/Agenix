import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  useGLTF, 
  Float,
  PerspectiveCamera,
  Sparkles
} from '@react-three/drei';
import { Group } from 'three';

// Preload the model
useGLTF.preload('/models/blender_duck.glb');

// GLB Model component
function BlenderModel({ isAnimating }: { isAnimating: boolean }) {
  const group = useRef<Group>(null);
  const { nodes, materials } = useGLTF('/models/blender_duck.glb') as any;
  
  // Animation
  useFrame((state) => {
    if (group.current && isAnimating) {
      group.current.rotation.y += 0.01;
      // Add some subtle movement up and down
      group.current.position.y = Math.sin(state.clock.elapsedTime) * 0.05;
    }
  });

  return (
    <group ref={group} dispose={null} scale={1.5}>
      <primitive object={nodes.Scene || nodes.Root || Object.values(nodes)[0]} />
    </group>
  );
}

// A robot-like model using primitive shapes as fallback
function RobotModel({ isAnimating }: { isAnimating: boolean }) {
  const group = useRef<Group>(null);
  
  // Animation
  useFrame((state) => {
    if (group.current && isAnimating) {
      group.current.rotation.y += 0.01;
      // Add some subtle movement to simulate "thinking"
      if (group.current.children[1]) { // head
        group.current.children[1].rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      }
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      {/* Body */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[1.2, 1.5, 0.8]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#4f46e5" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[0.2, 0.7, 0.41]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#93c5fd" emissiveIntensity={1} />
      </mesh>
      <mesh position={[-0.2, 0.7, 0.41]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#93c5fd" emissiveIntensity={1} />
      </mesh>
      
      {/* Antenna */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 16]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.8} />
      </mesh>
      
      {/* "M" Logo on chest */}
      <group position={[0, -0.3, 0.41]}>
        <mesh position={[-0.2, 0, 0]}>
          <boxGeometry args={[0.1, 0.4, 0.05]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.2, 0, 0]}>
          <boxGeometry args={[0.1, 0.4, 0.05]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.1, 0.3, 0.05]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.1, 0.3, 0.05]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
      
      {/* Arms */}
      <mesh position={[0.7, -0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.8, 16]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[-0.7, -0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.8, 16]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
    </group>
  );
}

interface AIChatbotModelProps {
  isAnimating?: boolean;
}

const AIChatbotModel: React.FC<AIChatbotModelProps> = ({ isAnimating = false }) => {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);

  // Check if model loads
  useEffect(() => {
    const checkModelLoad = async () => {
      try {
        await fetch('/models/blender_duck.glb');
        setModelLoaded(true);
      } catch (error) {
        console.error('Error loading 3D model:', error);
        setModelError(true);
      }
    };
    
    checkModelLoad();
  }, []);

  return (
    <div className="h-full w-full">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={40} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} castShadow />
        <pointLight position={[-10, -10, -10]} />
        
        <Float 
          speed={isAnimating ? 3 : 1} 
          rotationIntensity={isAnimating ? 0.5 : 0.1} 
          floatIntensity={isAnimating ? 0.5 : 0.1}
        >
          {modelLoaded && !modelError ? (
            <BlenderModel isAnimating={isAnimating} />
          ) : (
            <RobotModel isAnimating={isAnimating} />
          )}
        </Float>
        
        {/* Add sparkles with colors matching the theme */}
        <Sparkles 
          count={50} 
          scale={5} 
          size={1} 
          speed={0.5} 
          opacity={0.5} 
          color="#ec4899" 
        />
        <Sparkles 
          count={30} 
          scale={3} 
          size={0.7} 
          speed={0.3} 
          opacity={0.3} 
          color="#3b82f6" 
        />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI / 1.5}
          enableRotate={false}
        />
        <Environment preset="night" />
      </Canvas>
    </div>
  );
};

export default AIChatbotModel; 