import React from 'react';

export const SnowOverlay = () => {
  // Generate random snowflakes
  const snowflakes = React.useMemo(() => Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${Math.random() * 5 + 3}s`,
    animationDelay: `${Math.random() * 5}s`,
    opacity: Math.random() * 0.5 + 0.5,
    fontSize: `${Math.random() * 1.5 + 0.8}rem`
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {snowflakes.map(sf => (
        <div
          key={sf.id}
          className="snowflake"
          style={{
            left: sf.left,
            animationDuration: sf.animationDuration,
            animationDelay: sf.animationDelay,
            opacity: sf.opacity,
            fontSize: sf.fontSize,
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
};