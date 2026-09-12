export default function SkeletonBlock({ className = "", ...props }) {
  return (
    <div
      className={`civic-skeleton ${className}`}
      {...props}
    />
  );
}
