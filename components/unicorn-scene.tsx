'use client'

import React, { useRef, useEffect, useState } from 'react';

interface UnicornSceneProps {
  className?: string;
}

interface UnicornStudioScene {
  destroy?: () => void;
  resize?: () => void;
}

export function UnicornScene({ className = "" }: UnicornSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [scene, setScene] = useState<UnicornStudioScene | null>(null);

  // Load the Unicorn Studio SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.25/dist/unicornStudio.umd.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Unicorn Studio SDK loaded');
      setIsLoaded(true);
    };
    
    script.onerror = () => {
      console.error('Failed to load Unicorn Studio SDK');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize the Unicorn Studio scene
  useEffect(() => {
    if (!isLoaded || !containerRef.current) return;

    const initScene = async () => {
      try {
        console.log('Initializing Unicorn Studio scene...');
        
        const unicornStudio = (window as { UnicornStudio?: { addScene: (config: unknown) => Promise<UnicornStudioScene> } })?.UnicornStudio;
        if (!unicornStudio) {
          console.error('UnicornStudio not found on window');
          return;
        }

        const unicornScene = await unicornStudio.addScene({
          elementId: containerRef.current!.id,
          fps: 60,
          scale: 0.8,
          dpi: 1,
          filePath: '/unicorn-scene.json', // Point to our JSON file
          lazyLoad: false,
          fixed: false,
          interactivity: {
            mouse: {
              disableMobile: false,
            },
          },
        });

        console.log('Unicorn Studio scene initialized:', unicornScene);
        setScene(unicornScene);
        
      } catch (error) {
        console.error('Failed to initialize Unicorn Studio scene:', error);
      }
    };

    initScene();
  }, [isLoaded]);

  // Cleanup scene on unmount
  useEffect(() => {
    return () => {
      if (scene?.destroy) {
        console.log('Destroying Unicorn Studio scene');
        scene.destroy();
      }
    };
  }, [scene]);

  return (
    <div 
      ref={containerRef}
      id="unicorn-scene-container"
      className={`w-full rounded-xl ${className}`}
      style={{ 
        minWidth: '300px', 
        minHeight: '200px',
        aspectRatio: '4/3',
        overflow: 'hidden',
        backgroundColor: 'transparent'
      }}
    >
      {!isLoaded && (
        <div className="w-full h-full flex items-center justify-center bg-transparent rounded-xl">
          {/* Transparent loading placeholder */}
        </div>
      )}
    </div>
  );
} 