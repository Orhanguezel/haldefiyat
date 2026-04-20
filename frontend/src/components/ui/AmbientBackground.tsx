/**
 * Ambient arkaplan: 3 yumusak orb + ince dot grid.
 * Server component - zero JS, tamamen CSS animation.
 */
export default function AmbientBackground() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden
      >
        <div className="ambient-orb-1" />
        <div className="ambient-orb-2" />
        <div className="ambient-orb-3" />
      </div>

      <div
        className="dot-grid pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        aria-hidden
      />
    </>
  );
}
