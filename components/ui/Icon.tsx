import React from "react";

// Define the list of icon names based on the sprite.svg file
const iconNames = ["icon-1", "icon-2", "icon-3", "icon-4", "icon-5"];

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  color?: string;
}

export function Icon({ name, color = "currentColor", ...props }: IconProps) {
  return (
    <svg {...props} fill={color} className="flex items-center justify-center">
      <use href={`/Images/sprites.svg#${name}`} />
    </svg>
  );
}

// Export the list of icon names for use in other components
export { iconNames };