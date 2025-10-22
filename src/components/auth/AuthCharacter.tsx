import React, { useState, useEffect, useRef } from 'react';

type CharacterState = 'idle' | 'watching' | 'lookingAway' | 'error';

interface AuthCharacterProps {
  state: CharacterState;
}

const AuthCharacter: React.FC<AuthCharacterProps> = ({ state }) => {
  const characterRef = useRef<SVGSVGElement>(null);
  const [pupilTransform, setPupilTransform] = useState('translate(0, 0)');

  // Eye tracking effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!characterRef.current || state === 'lookingAway') {
        setPupilTransform('translate(0, 0)');
        return;
      }

      const svg = characterRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;

      const svgPoint = pt.matrixTransform(svg.getScreenCTM()?.inverse());
      
      const centerX = 50;
      const centerY = 45;
      
      const deltaX = svgPoint.x - centerX;
      const deltaY = svgPoint.y - centerY;

      const moveX = Math.max(-2.5, Math.min(2.5, deltaX * 0.05));
      const moveY = Math.max(-1.5, Math.min(1.5, deltaY * 0.05));
      
      setPupilTransform(`translate(${moveX}, ${moveY})`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    if (state !== 'watching' && state !== 'idle') {
        setPupilTransform('translate(0, 0)');
    }

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [state]);

  const isLookingAway = state === 'lookingAway';
  
  // Entire character rotation
  const characterTransform = isLookingAway ? 'rotateY(180deg)' : 'rotateY(0deg)';
  
  const mouthPath = state === 'error' ? "M 42 63 L 58 63" : "M 45 62 Q 50 65 55 62";
  
  return (
    <div className="auth-character-container">
      <svg viewBox="0 0 100 120" ref={characterRef} className="w-full h-full">
        <defs>
            <linearGradient id="robotBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4A5568" />
                <stop offset="100%" stopColor="#2D3748" />
            </linearGradient>
            <linearGradient id="robotHeadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E2E8F0" />
                <stop offset="100%" stopColor="#CBD5E0" />
            </linearGradient>
        </defs>

        <g className={state === 'error' ? 'shake-animation' : ''}>
            {/* The whole character group for rotation */}
            <g style={{ 
                transform: characterTransform, 
                transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)', 
                transformOrigin: '50px 65px', // Center of the character
                transformStyle: 'preserve-3d' 
            }}>
                
                {/* Back of Character */}
                <g style={{ transform: 'rotateY(180deg) translateZ(1px)', backfaceVisibility: 'hidden' }}>
                    {/* Back Body */}
                    <path d="M 25 110 C 25 90, 30 70, 50 70 C 70 70, 75 90, 75 110 L 25 110 Z" fill="#2D3748" />
                    <rect x="35" y="65" width="30" height="10" rx="3" fill="#2D3748" />
                    {/* Back Head */}
                    <rect x="28" y="20" width="44" height="50" rx="10" fill="#CBD5E0" />
                    <circle cx="50" cy="45" r="8" fill="none" stroke="#A0AEC0" strokeWidth="2" />
                    <circle cx="50" cy="45" r="3" fill="#A0AEC0" />
                </g>

                {/* Front of Character */}
                <g style={{ backfaceVisibility: 'hidden' }}>
                    {/* Body */}
                    <g>
                        <path d="M 25 110 C 25 90, 30 70, 50 70 C 70 70, 75 90, 75 110 L 25 110 Z" fill="url(#robotBodyGradient)" />
                        <rect x="35" y="65" width="30" height="10" rx="3" fill="#4A5568" />
                    </g>

                    {/* Head */}
                    <g>
                        <rect x="28" y="20" width="44" height="50" rx="10" fill="url(#robotHeadGradient)" />
                        
                        {/* Eyes */}
                        <g>
                            <rect x="35" y="40" width="12" height="6" rx="3" fill="#2D3748" />
                            <rect x="53" y="40" width="12" height="6" rx="3" fill="#2D3748" />
                            
                            <g transform={pupilTransform} style={{ transition: 'transform 0.1s linear' }}>
                               <rect x="38" y="42" width="6" height="2" fill="#38BDF8" />
                               <rect x="56" y="42" width="6" height="2" fill="#38BDF8" />
                            </g>

                             {/* Blinking Eyelids */}
                             <rect x="35" y="40" width="12" height="6" rx="3" fill="#E2E8F0" className={`eyelid ${state === 'idle' ? 'blink' : ''}`}/>
                             <rect x="53" y="40" width="12" height="6" rx="3" fill="#E2E8F0" className={`eyelid ${state === 'idle' ? 'blink' : ''}`} style={{animationDelay: '0.1s'}}/>
                        </g>

                        {/* Mouth */}
                        <path d={mouthPath} stroke="#4A5568" strokeWidth="1.5" fill="none" strokeLinecap="round" style={{ transition: 'd 0.3s ease' }} />
                        
                        {/* Antenna */}
                        <g>
                           <line x1="50" y1="20" x2="50" y2="10" stroke="#A0AEC0" strokeWidth="2" />
                           <circle cx="50" cy="8" r="3" fill="#38BDF8" />
                        </g>
                    </g>
                </g>
            </g>
        </g>
      </svg>
    </div>
  );
};

export default AuthCharacter;