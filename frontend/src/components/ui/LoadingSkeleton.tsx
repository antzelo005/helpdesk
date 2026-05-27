import type { HTMLAttributes } from "react";

type LoadingSkeletonProps = HTMLAttributes<HTMLDivElement> & {
  lines?: number;
};

export function LoadingSkeleton({
  className = "",
  lines,
  ...props
}: LoadingSkeletonProps) {
  if (lines && lines > 1) {
    return (
      <div className={["space-y-3", className].filter(Boolean).join(" ")} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="skeleton h-4 rounded-xl"
            style={{ width: `${100 - index * 10}%` }}
          />
        ))}
      </div>
    );
  }

  return <div className={["skeleton rounded-2xl", className].filter(Boolean).join(" ")} {...props} />;
}
