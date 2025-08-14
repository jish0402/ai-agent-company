import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion';

export const TimelineSlide = ({ deliverables }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const titleOpacity = spring({
    frame,
    fps,
    config: { damping: 100, stiffness: 200, mass: 0.5 },
  });

  // Extract timeline phases from deliverables
  const getTimelinePhases = () => {
    const phases = [
      { phase: 'Phase 1', title: 'Strategy & Planning', duration: 'Weeks 1-2', color: '#3b82f6' },
      { phase: 'Phase 2', title: 'Content Creation', duration: 'Weeks 3-4', color: '#8b5cf6' },
      { phase: 'Phase 3', title: 'Campaign Launch', duration: 'Weeks 5-8', color: '#10b981' },
      { phase: 'Phase 4', title: 'Optimization', duration: 'Weeks 9-12', color: '#f59e0b' },
    ];

    // Try to extract actual timeline from deliverables
    Object.values(deliverables).forEach(agentData => {
      if (agentData.final?.key_outputs?.campaign_timeline) {
        const timeline = agentData.final.key_outputs.campaign_timeline;
        // This could parse the timeline string and update phases
        // For now, we'll use the default phases
      }
    });

    return phases;
  };

  const phases = getTimelinePhases();

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
      }}
    >
      <div
        style={{
          opacity: titleOpacity,
          textAlign: 'center',
          width: '100%',
        }}
      >
        <h2
          style={{
            fontSize: 54,
            fontWeight: 'bold',
            color: 'white',
            margin: 0,
            marginBottom: 60,
            textShadow: '0 4px 20px rgba(0,0,0,0.3)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          🚀 Implementation Timeline
        </h2>
        
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: 1100,
            position: 'relative',
          }}
        >
          {/* Timeline line */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: 4,
              background: 'rgba(255,255,255,0.3)',
              borderRadius: 2,
              zIndex: 1,
            }}
          />
          
          {phases.map((phase, index) => {
            const phaseOpacity = spring({
              frame: frame - (index * 40 + 60),
              fps,
              config: { damping: 100, stiffness: 200, mass: 0.5 },
            });
            
            const phaseScale = interpolate(
              frame,
              [index * 40 + 60, index * 40 + 90],
              [0.8, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );

            return (
              <div
                key={index}
                style={{
                  opacity: phaseOpacity,
                  transform: `scale(${phaseScale})`,
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  padding: 25,
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.2)',
                  textAlign: 'center',
                  minWidth: 200,
                  zIndex: 2,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    background: phase.color,
                    borderRadius: '50%',
                    margin: '0 auto 15px',
                    border: '3px solid white',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                  }}
                />
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: 8,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  }}
                >
                  {phase.phase}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    color: 'rgba(255,255,255,0.9)',
                    marginBottom: 4,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  }}
                >
                  {phase.title}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  }}
                >
                  {phase.duration}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};