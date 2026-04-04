import React, { useState, useEffect } from 'react';

export default function StreamingText({ text, speed = 20, onComplete }) {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text.charAt(index));
        setIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, speed, onComplete]);

  return (
    <span className="streaming-text">
      {displayedText}
      {index < text.length && <span className="blinking-cursor">▊</span>}
    </span>
  );
}
