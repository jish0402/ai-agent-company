import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion';

export const AgentSlide = ({ agentsInvolved }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const titleOpacity = spring({
    frame,
    fps,
    config: { damping: 100, stiffness: 200, mass: 0.5 },
  });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
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
          👥 Your AI Marketing Team
        </h2>
        
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 40,
            maxWidth: 1200,
          }}
        >
          {agentsInvolved.map((agent, index) => {
            const agentOpacity = spring({
              frame: frame - (index * 20 + 30),
              fps,
              config: { damping: 100, stiffness: 200, mass: 0.5 },
            });
            
            const agentScale = interpolate(
              frame,
              [index * 20 + 30, index * 20 + 60],
              [0.8, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );

            return (
              <div
                key={agent.name}
                style={{
                  opacity: agentOpacity,
                  transform: `scale(${agentScale})`,
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  padding: 30,
                  borderRadius: 20,
                  border: '1px solid rgba(255,255,255,0.2)',
                  textAlign: 'center',
                  minWidth: 280,
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    marginBottom: 15,
                  }}
                >
                  🤖
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: 8,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  }}
                >
                  {agent.name}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    color: 'rgba(255,255,255,0.8)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  }}
                >
                  {agent.role}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};