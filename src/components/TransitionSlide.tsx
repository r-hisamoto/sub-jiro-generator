import React, { useEffect, useState } from 'react';
import type { TransitionEffect, AnimationEffect } from '../lib/transitions';

interface TransitionSlideProps {
  children: React.ReactNode;
  transition?: TransitionEffect;
  effect?: AnimationEffect;
  isActive: boolean;
  onTransitionEnd?: () => void;
}

export function TransitionSlide({
  children,
  transition,
  effect,
  isActive,
  onTransitionEnd,
}: TransitionSlideProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
      // トランジション終了後に非表示にする
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, (transition?.duration || 0) + 100);
      return () => clearTimeout(timer);
    }
  }, [isActive, transition?.duration]);

  const handleTransitionEnd = () => {
    setIsAnimating(false);
    onTransitionEnd?.();
  };

  const classes = [
    'transition-slide',
    isVisible ? 'visible' : 'hidden',
    isAnimating ? 'animating' : '',
    transition?.cssClass,
    effect?.cssClass,
  ]
    .filter(Boolean)
    .join(' ');

  const style = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: isActive ? 1 : 0,
    transition: `opacity ${transition?.duration || 0}ms ease-in-out`,
  };

  return (
    <div
      className={classes}
      style={style}
      onTransitionEnd={handleTransitionEnd}
      onAnimationEnd={handleTransitionEnd}
    >
      {children}
    </div>
  );
}

export type { TransitionSlideProps }; 