import React from 'react';
import Nibras1Icon from '../assets/logos/nibras 1.svg?react';
import Nibras2Icon from '../assets/logos/nibras 2.svg?react';

interface NibrasAnimatedMarkProps {
  className?: string;
}

const NibrasAnimatedMark: React.FC<NibrasAnimatedMarkProps> = ({ className = 'h-6 w-6' }) => (
  <span className={`relative grid shrink-0 place-items-center ${className}`} aria-hidden="true">
    <span className="nibras-breathe-layer h-full w-full">
      <Nibras1Icon className="block h-full w-full" />
    </span>
    <span className="nibras-breathe-layer nibras-breathe-layer--alt h-full w-full">
      <Nibras2Icon className="block h-full w-full" />
    </span>
  </span>
);

export default NibrasAnimatedMark;
