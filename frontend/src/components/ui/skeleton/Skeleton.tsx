import React from "react";

export interface SkeletonProps {
  className?: string;
  height?: string | number;
  width?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  height = "1rem",
  width = "100%",
}) => {
  const skeletonClasses = "rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse";

  const widthClass = typeof width === "number" ? `${width}px` : typeof width === "string" ? width : "100%";
  const heightClass = typeof height === "number" ? `${height}px` : `${height}`;

  return <div className={`${skeletonClasses} ${className}`} style={{ width: widthClass, height: heightClass }} />;
};