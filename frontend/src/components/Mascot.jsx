import React from 'react';
import './Mascot.css';

export default function Mascot({ scene = 1 }) {
  // Determine mascot expression and animation state based on scene
  let expressionClass = "mascot-idle";
  if (scene === 1) expressionClass = "mascot-confused"; // Mess
  else if (scene === 2) expressionClass = "mascot-curious"; // Need
  else if (scene === 6) expressionClass = "mascot-nervous"; // Approval waiting
  else if (scene === 7) expressionClass = "mascot-celebrate"; // PO
  else if (scene === 10) expressionClass = "mascot-proud"; // Done

  return (
    <div className={`mascot-container ${expressionClass}`}>
      <svg width="120" height="150" viewBox="0 0 120 150" className="mascot-svg">
        {/* Hover Base */}
        <ellipse cx="60" cy="140" rx="30" ry="10" fill="rgba(0,0,0,0.1)" className="mascot-shadow" />
        
        {/* Antennas */}
        <g className="mascot-antenna">
          <line x1="60" y1="40" x2="60" y2="20" stroke="#6C63FF" strokeWidth="4" />
          <circle cx="60" cy="20" r="6" fill="#6C63FF" className="mascot-bulb" />
        </g>
        
        {/* Arms */}
        <g className="mascot-arms">
          <path d="M 25 80 Q 10 100 20 110" fill="none" stroke="#6B7280" strokeWidth="6" strokeLinecap="round" className="arm-left" />
          <path d="M 95 80 Q 110 100 100 110" fill="none" stroke="#6B7280" strokeWidth="6" strokeLinecap="round" className="arm-right" />
        </g>

        {/* Body (Screen) */}
        <rect x="25" y="45" width="70" height="60" rx="15" fill="#E0E5EC" stroke="#3D4852" strokeWidth="4" className="mascot-body" />
        <rect x="35" y="55" width="50" height="40" rx="8" fill="#3D4852" className="mascot-screen" />
        
        {/* Face (Eyes) */}
        <g className="mascot-face">
          <path d="M 45 70 Q 50 65 55 70" fill="none" stroke="#6C63FF" strokeWidth="4" strokeLinecap="round" className="eye-left" />
          <path d="M 65 70 Q 70 65 75 70" fill="none" stroke="#6C63FF" strokeWidth="4" strokeLinecap="round" className="eye-right" />
        </g>
      </svg>
    </div>
  );
}
