import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion';

export const TitleSlide = ({ projectGoal }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const titleOpacity = spring({
    frame,
    fps,
    config: { damping: 100, stiffness: 200, mass: 0.5 },
  });
  
  const subtitleOpacity = spring({
    frame: frame - 30,
    fps,
    config: { damping: 100, stiffness: 200, mass: 0.5 },
  });

  const scale = interpolate(
    frame,
    [0, 30, 60],
    [0.8, 1.05, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
          transform: `scale(${scale})`,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: 'white',
            margin: 0,
            marginBottom: 30,
            textShadow: '0 4px 20px rgba(0,0,0,0.3)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          🎯 Marketing Strategy
        </h1>
        
        <div
          style={{
            opacity: subtitleOpacity,
            fontSize: 36,
            color: 'rgba(255,255,255,0.9)',
            maxWidth: 800,
            lineHeight: 1.3,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          {projectGoal}
        </div>
        
        <div
          style={{
            opacity: subtitleOpacity,
            fontSize: 24,
            color: 'rgba(255,255,255,0.7)',
            marginTop: 40,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          AI-Powered Strategy by Marketing Experts
        </div>
      </div>
    </AbsoluteFill>
  );
};