import React from "react";
import * as Lucide from "lucide-react";

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

export const DynamicIcon: React.FC<IconProps> = ({ name, className = "", size = 20 }) => {
  // Find matching Lucide icon, fallback to HelpCircle
  const IconComponent = (Lucide as any)[name] || Lucide.HelpCircle;
  return <IconComponent className={className} size={size} />;
};
