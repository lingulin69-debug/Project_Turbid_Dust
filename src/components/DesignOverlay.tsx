import React from 'react';

/**
 * Props for the DesignOverlay component.
 * Allows external control over its visibility and appearance from a dev panel.
 */
interface DesignOverlayProps {
  // Controls whether the overlay is visible.
  enabled: boolean;
  // Controls the opacity of the grid columns, from 0 to 1.
  opacity?: number;
}

/**
 * A Figma-like design grid overlay for UI/UX designers to ensure layout consistency.
 * It displays a 12-column grid within a 1200px safe area and is controlled by external props.
 */
export const DesignOverlay: React.FC<DesignOverlayProps> = ({ enabled, opacity = 0.1 }) => {
  // If not enabled via props from a parent component (like a Dev Panel), render nothing.
  if (!enabled) {
    return null;
  }

  const gridColor = `rgba(0, 115, 255, ${opacity})`; // A standard, Figma-like blue for the grid columns.
  const boundaryColor = `rgba(255, 0, 0, 0.5)`; // A distinct, sharp red for the boundary lines.

  return (
    <div
      // Ensures the overlay covers the entire screen and stays on top, without blocking any mouse events.
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
      aria-hidden="true"
    >
      {/* Centered container defining the 1200px wide safe area. */}
      <div
        className="relative h-full mx-auto"
        style={{ maxWidth: '1200px' }}
      >
        {/* Left and Right boundary lines for the safe area */}
        <div
          className="absolute left-0 top-0 h-full"
          style={{ width: '1px', backgroundColor: boundaryColor }}
        />
        <div
          className="absolute right-0 top-0 h-full"
          style={{ width: '1px', backgroundColor: boundaryColor }}
        />

        {/* 12-column grid layout */}
        <div
          className="grid h-full items-start"
          style={{
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '24px', // A common gutter/gap size in design systems
            padding: '0 32px', // Standard side margins for the grid content
          }}
        >
          {/* Generate 12 semi-transparent columns for the visual grid guide. */}
          {[...Array(12)].map((_, index) => (
            <div
              key={index}
              className="h-full"
              style={{
                backgroundColor: gridColor,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};