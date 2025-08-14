import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion';

export const DeliverablesSlide = ({ deliverables }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const titleOpacity = spring({
    frame,
    fps,
    config: { damping: 100, stiffness: 200, mass: 0.5 },
  });

  // Extract key insights from deliverables
  const getKeyInsights = () => {
    const insights = [];
    
    Object.values(deliverables).forEach(agentData => {
      if (agentData.final) {
        const final = agentData.final;
        
        // Extract budget info
        if (final.key_outputs?.budget_breakdown) {
          insights.push({
            icon: '💰',
            title: 'Budget Allocation',
            content: final.key_outputs.budget_breakdown
          });
        }
        
        // Extract timeline
        if (final.key_outputs?.campaign_timeline) {
          insights.push({
            icon: '📅',
            title: 'Campaign Timeline',
            content: final.key_outputs.campaign_timeline
          });
        }
        
        // Extract KPIs
        if (final.key_outputs?.kpi_targets) {
          insights.push({
            icon: '🎯',
            title: 'Target KPIs',
            content: final.key_outputs.kpi_targets
          });
        }
        
        // Extract market insights
        if (final.key_outputs?.market_size) {
          insights.push({
            icon: '📊',
            title: 'Market Opportunity',
            content: final.key_outputs.market_size
          });
        }
      }
    });
    
    return insights.slice(0, 4); // Limit to 4 key insights
  };

  const insights = getKeyInsights();

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
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
          📋 Key Strategy Deliverables
        </h2>
        
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 40,
            maxWidth: 1200,
          }}
        >
          {insights.map((insight, index) => {
            const itemOpacity = spring({
              frame: frame - (index * 30 + 40),
              fps,
              config: { damping: 100, stiffness: 200, mass: 0.5 },
            });
            
            const itemTranslateY = interpolate(
              frame,
              [index * 30 + 40, index * 30 + 70],
              [30, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );

            return (
              <div
                key={index}
                style={{
                  opacity: itemOpacity,
                  transform: `translateY(${itemTranslateY}px)`,
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  padding: 30,
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.2)',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 15,
                  }}
                >
                  <span style={{ fontSize: 32, marginRight: 15 }}>
                    {insight.icon}
                  </span>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 'bold',
                      color: 'white',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    }}
                  >
                    {insight.title}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 16,
                    color: 'rgba(255,255,255,0.9)',
                    lineHeight: 1.4,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  }}
                >
                  {insight.content}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};