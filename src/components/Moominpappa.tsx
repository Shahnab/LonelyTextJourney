export default function Moominpappa() {
  return (
    <div 
      id="moominpappa-character" 
      className="absolute left-0 top-0 z-10 w-[320px] h-[320px] pointer-events-none"
      style={{ 
        transformOrigin: '160px 170px' 
      }}
    >
      <svg width="320" height="320" viewBox="0 0 130 130" style={{overflow: 'visible'}} xmlns="http://www.w3.org/2000/svg">
        
        {/* Back gunwale / Inside floor of boat */}
        <path d="M 23 56 Q 70 65 121 56 C 95 72 45 72 23 56 Z" fill="#ffffff" stroke="#080808" strokeWidth="2" strokeLinejoin="round" />

        {/* Stern Post (Left) */}
        <path d="M 25 58 L 21 44 L 25 42 L 29 54" fill="#ffffff" stroke="#080808" strokeWidth="1.5" strokeLinejoin="round" />
        
        {/* Bow Post (Right) */}
        <path d="M 119 58 L 124 43 L 120 41 L 115 54" fill="#ffffff" stroke="#080808" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Moominpappa Body */}
        <path 
          d="M 50 85 
             C 50 50 58 35 63 27
             C 70 29 73 30 77 31 
             C 79 38 91 45 89 57 
             C 87 64 77 63 73 64 
             C 68 65 65 70 61 85 Z" 
          fill="#ffffff" stroke="#080808" strokeWidth="2.5" strokeLinejoin="round" 
        />
        
        {/* Eye */}
        <ellipse cx="77" cy="40" rx="3.5" ry="5" fill="#ffffff" stroke="#080808" strokeWidth="2" />
        <circle cx="78.5" cy="40.5" r="1.5" fill="#080808" />

        {/* Mouth */}
        <path d="M 67 54 C 68 63 76 66 79 61" fill="none" stroke="#080808" strokeWidth="1.5" strokeLinecap="round" />

        {/* Top Hat */}
        <g transform="translate(68, 27) rotate(15)">
          {/* Brim */}
          <path d="M -17 0 L 15 0" fill="none" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M -17 0 L 15 0" fill="none" stroke="#080808" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Cylinder */}
          <path d="M -9 -1 L -7 -20 L 7 -20 L 9 -1 Z" fill="#080808" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" />
          
          {/* Band */}
          <path d="M -8 -4 L 8 -4" fill="none" stroke="#ffffff" strokeWidth="1.5" />
        </g>

        {/* Front Hull (Lapstrake Style) */}
        <path 
          d="M 23 56 Q 70 80 121 56 C 105 100 45 100 23 56 Z" 
          fill="#ffffff" stroke="#080808" strokeWidth="2.5" strokeLinejoin="round" 
        />
        {/* Planks */}
        <path d="M 27 66 Q 70 92 113 65" fill="none" stroke="#080808" strokeWidth="2" />
        <path d="M 32 75 Q 70 98 99 75" fill="none" stroke="#080808" strokeWidth="2" />

        {/* Oar - Rotates around oarlock/grip pivot */}
        <g id="moomin-oar" style={{ transformOrigin: '70px 71.5px' }}>
          <line x1="25" y1="85" x2="115" y2="58" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="25" y1="85" x2="115" y2="58" stroke="#080808" strokeWidth="3" strokeLinecap="round" />
          {/* Blade on the left */}
          <path d="M 29 83.5 L 7 90 C 4 91 4 98 7 98 L 24 91.5 Z" fill="#080808" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" />
        </g>

        {/* Arm / Hand */}
        <path d="M 63 60 C 63 66 67 76 75 72" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
        <path d="M 63 60 C 63 66 67 76 75 72" fill="none" stroke="#080808" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Fingers over the oar */}
        <path d="M 73 69 Q 77 67 77 73" fill="none" stroke="#080808" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 71 71 Q 75 69 75 75" fill="none" stroke="#080808" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 69 73 Q 73 71 73 77" fill="none" stroke="#080808" strokeWidth="1.5" strokeLinecap="round" />

      </svg>
    </div>
  );
}
