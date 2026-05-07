import { useDepthZone } from '../../lib/hooks/useDepthZone';
import { ZONE_BOUNDS } from '../../lib/motion/depth';

const ZONE_LABEL: Record<string, string> = {
  sunlit:   'Sunlit · Epipelagic',
  twilight: 'Twilight · Mesopelagic',
  midnight: 'Midnight · Bathypelagic',
  abyss:    'Abyss · Abyssopelagic',
  surface:  'Resurface',
};

export default function DepthMeter() {
  const { zone, depthM } = useDepthZone();

  function jumpTo(z: string) {
    const el = document.getElementById(`zone-${z}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <aside
      className="hidden md:flex fixed z-40 bottom-6 right-6 flex-col items-end gap-3 select-none pointer-events-none"
      aria-label="Current depth"
    >
      <div className="meta opacity-60 pointer-events-auto">{ZONE_LABEL[zone]}</div>
      <div
        className="font-mono tabular-nums text-3xl pointer-events-auto"
        style={{ color: 'var(--d-accent)' }}
      >
        {zone === 'surface' ? '↑' : `${depthM.toLocaleString()}m`}
      </div>
      <div className="flex gap-1.5 pointer-events-auto">
        {ZONE_BOUNDS.map((b) => {
          const active = zone === b.zone;
          return (
            <button
              key={b.zone}
              onClick={() => jumpTo(b.zone)}
              aria-label={`Jump to ${b.zone}`}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: active ? 28 : 12,
                background: active ? 'var(--d-accent)' : 'var(--d-fg-muted)',
                opacity: active ? 1 : 0.4,
              }}
            />
          );
        })}
      </div>
    </aside>
  );
}
