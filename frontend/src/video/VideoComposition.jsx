import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { TitleSlide } from './components/TitleSlide';
import { AgentSlide } from './components/AgentSlide';
import { DeliverablesSlide } from './components/DeliverablesSlide';
import { TimelineSlide } from './components/TimelineSlide';
import { EndSlide } from './components/EndSlide';

export const VideoComposition = ({ 
  projectGoal, 
  deliverables, 
  agentsInvolved 
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  
  // Sequence timings (in frames)
  const titleDuration = 120; // 4 seconds
  const agentDuration = 150; // 5 seconds  
  const deliverablesDuration = 270; // 9 seconds
  const timelineDuration = 240; // 8 seconds
  const endDuration = 120; // 4 seconds

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f1419' }}>
      
      {/* Title Slide */}
      <Sequence from={0} durationInFrames={titleDuration}>
        <TitleSlide projectGoal={projectGoal} />
      </Sequence>

      {/* Agents Introduction */}
      <Sequence from={titleDuration} durationInFrames={agentDuration}>
        <AgentSlide agentsInvolved={agentsInvolved} />
      </Sequence>

      {/* Key Deliverables */}
      <Sequence from={titleDuration + agentDuration} durationInFrames={deliverablesDuration}>
        <DeliverablesSlide deliverables={deliverables} />
      </Sequence>

      {/* Implementation Timeline */}
      <Sequence from={titleDuration + agentDuration + deliverablesDuration} durationInFrames={timelineDuration}>
        <TimelineSlide deliverables={deliverables} />
      </Sequence>

      {/* End Slide */}
      <Sequence from={titleDuration + agentDuration + deliverablesDuration + timelineDuration} durationInFrames={endDuration}>
        <EndSlide />
      </Sequence>

    </AbsoluteFill>
  );
};