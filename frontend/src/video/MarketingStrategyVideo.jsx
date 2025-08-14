import { Composition } from 'remotion';
import { VideoComposition } from './VideoComposition';

export const MarketingStrategyVideo = () => {
  // Try to read props from global variable set by backend, fallback to sample data
  const defaultProps = typeof window !== 'undefined' && window.remotionProps ? window.remotionProps : {
    projectGoal: "Sample Marketing Strategy",
    deliverables: {
      "Jordan Rivera": {
        final: {
          final_deliverable: "Complete 12-week marketing implementation plan",
          key_outputs: {
            campaign_timeline: "Week 1-4: Strategy & Content, Week 5-8: Launch & Execution, Week 9-12: Optimization",
            budget_breakdown: "Content: $15K, Paid Media: $50K, Analytics: $5K",
            kpi_targets: "Brand Awareness: 25% lift, Lead Generation: 500 leads, ROI: 4:1"
          },
          recommendations: [
            "Focus 60% budget on high-converting channels",
            "Implement A/B testing for all creative assets",
            "Weekly performance reviews and optimization"
          ]
        }
      },
      "Sarah Chen": {
        final: {
          final_deliverable: "Comprehensive market analysis and competitive positioning",
          key_outputs: {
            market_size: "TAM: $2.5B, SAM: $150M, SOM: $15M",
            key_competitors: "3 direct competitors identified with strategic gaps",
            target_audience: "Primary: B2B decision makers 35-55, Secondary: Influencers 28-45"
          }
        }
      }
    },
    agentsInvolved: [
      { name: "Jordan Rivera", role: "Implementation Specialist" },
      { name: "Sarah Chen", role: "Market Researcher" }
    ]
  };

  return (
    <>
      <Composition
        id="MarketingStrategy"
        component={VideoComposition}
        durationInFrames={900} // 30 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
      />
    </>
  );
};