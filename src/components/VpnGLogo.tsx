import React from "react";

interface VpnGLogoProps {
  size?: number; // width and height in px
  showText?: boolean;
}

export const VpnGLogo: React.FC<VpnGLogoProps> = ({ size = 160, showText = true }) => {
  const scale = size / 200;

  return (
    <div 
      className="relative select-none flex flex-col items-center justify-center filter drop-shadow-[0_8px_24px_rgba(0,240,255,0.15)]"
      style={{ width: size, height: size }}
    >
      {/* Outer Squircle Container - Cropped background perfectly! */}
      <div 
        className="absolute inset-0 overflow-hidden bg-gradient-to-b from-[#131920] to-[#0a0d11] flex items-center justify-center shadow-2xl"
        style={{ 
          borderRadius: `${46 * scale}px`,
          border: "1.5px solid transparent",
          backgroundClip: "padding-box",
        }}
      >
        {/* Glow Border Effect */}
        <div 
          className="absolute inset-0 opacity-80 pointer-events-none rounded-inherit"
          style={{
            boxShadow: `inset 0 0 ${12 * scale}px rgba(0, 240, 255, 0.25), inset 0 0 ${20 * scale}px rgba(0, 255, 102, 0.15)`,
            borderRadius: `${46 * scale}px`,
          }}
        />

        {/* Dynamic Dual Glowing Border Overlay */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none" 
          viewBox="0 0 200 200"
          fill="none"
        >
          {/* Gradient definitions for borders and circuits */}
          <defs>
            <linearGradient id="outerBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00c6ff" />
              <stop offset="50%" stopColor="#0072ff" />
              <stop offset="100%" stopColor="#00ff87" />
            </linearGradient>
            <linearGradient id="shieldBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="100%" stopColor="#00ff66" />
            </linearGradient>
            <linearGradient id="circuitLeftGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0072ff" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="circuitRightGrad" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#00ff66" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0072ff" stopOpacity="0.1" />
            </linearGradient>
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Border Stroke */}
          <rect 
            x="3" y="3" width="194" height="194" 
            rx="45" 
            stroke="url(#outerBorderGrad)" 
            strokeWidth="2" 
            className="opacity-70"
          />

          {/* Circuit Traces Left Side (Glowing Blue) */}
          <g filter="url(#neonGlow)" stroke="url(#circuitLeftGrad)" strokeWidth="1.2" strokeLinecap="round">
            {/* Trace 1 */}
            <path d="M 10 50 L 35 50 L 48 63" />
            <circle cx="10" cy="50" r="1.5" fill="#00f0ff" />
            {/* Trace 2 */}
            <path d="M 12 85 L 38 85 L 45 92" />
            <circle cx="12" cy="85" r="1.5" fill="#00f0ff" />
            {/* Trace 3 */}
            <path d="M 15 120 L 32 120 L 40 112" />
            <circle cx="15" cy="120" r="1.5" fill="#00f0ff" />
            {/* Trace 4 */}
            <path d="M 22 145 L 42 145 L 47 140" />
            <circle cx="22" cy="145" r="1.5" fill="#00f0ff" />
          </g>

          {/* Circuit Traces Right Side (Glowing Green) */}
          <g filter="url(#neonGlow)" stroke="url(#circuitRightGrad)" strokeWidth="1.2" strokeLinecap="round">
            {/* Trace 1 */}
            <path d="M 190 70 L 165 70 L 152 83" />
            <circle cx="190" cy="70" r="1.5" fill="#00ff66" />
            {/* Trace 2 */}
            <path d="M 188 105 L 162 105 L 155 112" />
            <circle cx="188" cy="105" r="1.5" fill="#00ff66" />
            {/* Trace 3 */}
            <path d="M 185 135 L 168 135 L 160 127" />
            <circle cx="185" cy="135" r="1.5" fill="#00ff66" />
          </g>
        </svg>

        {/* Central Shield with VG Monogram */}
        <div 
          className="absolute flex flex-col items-center justify-center shadow-2xl overflow-hidden"
          style={{
            width: 82 * scale,
            height: 96 * scale,
            top: showText ? "32px" : "50%",
            transform: showText ? `scale(${scale})` : `translateY(-50%) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {/* Inner metallic shield base with dual glow borders */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#11171f] to-[#040608] border border-transparent flex items-center justify-center">
            {/* Shield SVG path overlay */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 110" fill="none">
              {/* Outer Glowing Border of Shield */}
              <path 
                d="M 50 5 C 68 5, 85 15, 90 35 C 90 70, 70 95, 50 105 C 30 95, 10 70, 10 35 C 15 15, 32 5, 50 5 Z" 
                fill="#0c1116"
                stroke="url(#shieldBorderGrad)" 
                strokeWidth="2.5"
                filter="url(#neonGlow)"
              />
              
              {/* Dark internal overlay for rich shield texture */}
              <path 
                d="M 50 10 C 65 10, 78 18, 83 35 C 83 65, 66 88, 50 97 C 34 88, 17 65, 17 35 C 22 18, 35 10, 50 10 Z" 
                fill="url(#shieldGrad)"
              />
              
              {/* Shield visual highlight divider */}
              <path 
                d="M 50 10 L 50 97" 
                stroke="rgba(255, 255, 255, 0.04)" 
                strokeWidth="1"
              />

              <defs>
                <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#18222b" />
                  <stop offset="100%" stopColor="#080b0f" />
                </linearGradient>
              </defs>
            </svg>

            {/* Glowing "VG" Logo letters custom rendered */}
            <div className="relative z-10 font-sans font-black tracking-tighter flex items-center justify-center gap-0.5 text-center mt-[-4px]">
              <span 
                className="text-cyan-400 font-sans font-extrabold italic select-none"
                style={{ 
                  fontSize: "30px", 
                  textShadow: "0 0 10px rgba(34, 211, 238, 0.8), 0 0 20px rgba(34, 211, 238, 0.4)",
                  letterSpacing: "-4px"
                }}
              >
                V
              </span>
              <span 
                className="text-cyan-400 font-sans font-extrabold italic select-none"
                style={{ 
                  fontSize: "30px", 
                  textShadow: "0 0 10px rgba(34, 211, 238, 0.8), 0 0 20px rgba(34, 211, 238, 0.4)",
                  marginLeft: "-4px"
                }}
              >
                G
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Text "VpnG" inside squircle exactly as uploaded */}
        {showText && (
          <div 
            className="absolute bottom-6 flex items-center justify-center gap-0.5 font-sans"
            style={{ transform: `scale(${scale})` }}
          >
            <span className="text-white text-2xl font-black tracking-wide font-sans select-none">
              Vpn
            </span>
            <span 
              className="text-[#00ff66] text-2xl font-black select-none font-sans"
              style={{ 
                textShadow: "0 0 12px rgba(0, 255, 102, 0.6)",
              }}
            >
              G
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
