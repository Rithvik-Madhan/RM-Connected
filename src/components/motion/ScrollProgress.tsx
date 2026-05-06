import { useDepthZone } from '../../lib/hooks/useDepthZone';

export default function ScrollProgress() {
  const { progress } = useDepthZone();
  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 z-50 h-[2px] pointer-events-none"
      style={{
        width: `${Math.min(100, progress * 100)}%`,
        background: 'linear-gradient(90deg, transparent, var(--d-accent))',
        boxShadow: '0 0 12px var(--d-accent)',
        transition: 'width 80ms linear',
      }}
    />
  );
}
