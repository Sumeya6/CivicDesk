export default function SkeletonBlock({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 ${className}`}
      {...props}
    />
  );
}
