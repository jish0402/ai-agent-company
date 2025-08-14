import React, { useState, useEffect } from 'react';
import AgentSelection from './components/AgentSelection';
import ConversationThread from './components/ConversationThread';
import ThinkingProcess from './components/ThinkingProcess';
import ProjectInput from './components/ProjectInput';
import ModernDeliverables from './components/ModernDeliverables';
import { Users, Brain, MessageSquare, Target, Sparkles, Video, Download } from 'lucide-react';
import { API_BASE_URL, WS_BASE_URL } from './config';

function App() {
  const [availableAgents, setAvailableAgents] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [projectGoal, setProjectGoal] = useState('');
  const [collaboration, setCollaboration] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('setup'); // setup, collaborating, completed, feedback_iteration
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [userFeedback, setUserFeedback] = useState('');
  const [requestedChanges, setRequestedChanges] = useState(['']);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoDownloadUrl, setVideoDownloadUrl] = useState(null);
  const [showModernDeliverables, setShowModernDeliverables] = useState(false);
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    fetchAvailableAgents();
    
    // Auto-test mode: check if URL contains test parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test') === 'deliverables') {
      setTestMode(true);
      setShowModernDeliverables(true);
      // Set up mock collaboration data for testing
      setCollaboration({
        project_id: 'test-project-123',
        status: 'completed'
      });
    }
  }, []);

  const fetchAvailableAgents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/available-agents`);
      const data = await response.json();
      setAvailableAgents(data.available_agents || []);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load available agents');
    }
  };

  const handleStartCollaboration = async () => {
    if (!projectGoal.trim() || selectedAgents.length < 2) return;

    setIsLoading(true);
    setError(null);
    setCurrentPhase('collaborating');

    try {
      // First, get the project ID
      const response = await fetch(`${API_BASE_URL}/start-collaboration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_goal: projectGoal.trim(),
          selected_agents: selectedAgents
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Initialize collaboration state
      setCollaboration({
        project_id: data.project_id,
        conversation_log: [],
        thinking_log: [],
        deliverables: {},
        agents_involved: selectedAgents.map(agentId => {
          const agent = availableAgents.find(a => a.id === agentId);
          return { name: agent?.name || 'Unknown', role: agent?.role || 'Agent' };
        }),
        status: 'collaborating'
      });

      // Connect to WebSocket first, THEN trigger collaboration
      await connectWebSocketAndStart(data.project_id);

    } catch (err) {
      console.error('Error:', err);
      setError(`Failed to start collaboration: ${err.message}`);
      setCurrentPhase('setup');
      setIsLoading(false);
    }
  };

  const connectWebSocketAndStart = async (projectId) => {
    return new Promise((resolve, reject) => {
      const wsUrl = `${WS_BASE_URL}/ws/${projectId}`;
      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        // Now that WebSocket is connected, trigger the actual collaboration
        triggerCollaboration(projectId);
        resolve(ws);
      };

      ws.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        const update = JSON.parse(event.data);
        handleRealtimeUpdate(update);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Failed to establish real-time connection');
        reject(error);
      };
    });
  };

  const triggerCollaboration = async (projectId) => {
    // Send a signal to start the actual collaboration
    try {
      await fetch(`${API_BASE_URL}/trigger-collaboration/${projectId}`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Error triggering collaboration:', err);
      setError('Failed to start collaboration');
    }
  };


  const handleRealtimeUpdate = (update) => {
    setCollaboration(prev => {
      if (!prev) return prev;

      const newCollaboration = { ...prev };

      switch (update.type) {
        case 'collaboration_started':
          console.log('Collaboration started:', update.data);
          break;

        case 'phase_change':
          // Handle phase changes
          console.log('Phase change:', update.data);
          break;

        case 'agent_thinking':
          console.log('Agent thinking:', update.data);
          break;

        case 'thinking_complete':
          // Add to thinking log
          newCollaboration.thinking_log = [...prev.thinking_log, update.data];
          break;

        case 'agent_speaking':
          console.log('Agent speaking:', update.data);
          break;

        case 'agent_message':
          // Add to conversation log
          newCollaboration.conversation_log = [...prev.conversation_log, update.data];
          break;

        case 'collaboration_complete':
          // Final results
          newCollaboration.deliverables = update.data.deliverables;
          setCurrentPhase('completed');
          setIsLoading(false);
          break;

        case 'user_feedback_received':
          // User feedback acknowledged
          setCurrentPhase('feedback_iteration');
          setIsLoading(true);
          break;

        case 'user_feedback_processing':
          console.log('Processing user feedback:', update.data);
          break;

        case 'user_message':
          // Add user feedback to conversation log
          newCollaboration.conversation_log = [...prev.conversation_log, update.data];
          break;

        case 'deliverables_updated':
          // Updated deliverables based on user feedback
          newCollaboration.deliverables = update.data.deliverables;
          setCurrentPhase('completed');
          setIsLoading(false);
          setFeedbackMode(false);
          // Reset feedback form
          setUserFeedback('');
          setRequestedChanges(['']);
          break;

        case 'video_generation_started':
          setVideoGenerating(true);
          setVideoReady(false);
          break;

        case 'video_generation_complete':
          setVideoGenerating(false);
          setVideoReady(true);
          setVideoDownloadUrl(update.data.download_url);
          break;

        case 'video_generation_error':
          setVideoGenerating(false);
          setError(`Video generation failed: ${update.data.message}`);
          break;

        case 'error':
          setError(update.data.message);
          setIsLoading(false);
          break;

        default:
          console.log('Unknown update type:', update.type, update.data);
      }

      return newCollaboration;
    });
  };

  const handleReset = () => {
    setSelectedAgents([]);
    setProjectGoal('');
    setCollaboration(null);
    setError(null);
    setCurrentPhase('setup');
    setIsLoading(false);
  };

  const handleViewDeliverables = () => {
    if (collaboration?.project_id) {
      setShowModernDeliverables(true);
    }
  };

  const handleProvideFeedback = () => {
    setFeedbackMode(true);
  };

  const handleCancelFeedback = () => {
    setFeedbackMode(false);
    setUserFeedback('');
    setRequestedChanges(['']);
  };

  const handleAddChange = () => {
    setRequestedChanges([...requestedChanges, '']);
  };

  const handleRemoveChange = (index) => {
    setRequestedChanges(requestedChanges.filter((_, i) => i !== index));
  };

  const handleChangeUpdate = (index, value) => {
    const updated = [...requestedChanges];
    updated[index] = value;
    setRequestedChanges(updated);
  };

  const handleSubmitFeedback = async () => {
    if (!userFeedback.trim() || !collaboration?.project_id) return;

    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/user-feedback/${collaboration.project_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: userFeedback.trim(),
          requested_changes: requestedChanges.filter(change => change.trim())
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Feedback submission handled via WebSocket updates
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(`Failed to submit feedback: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!collaboration?.project_id) return;

    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/generate-video/${collaboration.project_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Video generation status handled via WebSocket updates
    } catch (err) {
      console.error('Error generating video:', err);
      setError(`Failed to generate video: ${err.message}`);
    }
  };

  const handleDownloadVideo = () => {
    if (videoDownloadUrl && collaboration?.project_id) {
      const downloadUrl = `${API_BASE_URL}${videoDownloadUrl}`;
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Sparkles size={36} />
            <div>
              <h1>AI Marketing Agency</h1>
              <p>Watch expert AI agents collaborate, debate, and strategize in real-time</p>
            </div>
          </div>
          
          {currentPhase !== 'setup' && (
            <div className="phase-indicator">
              <div className={`phase ${currentPhase === 'collaborating' ? 'active' : ''}`}>
                <MessageSquare size={20} />
                <span>Collaborating</span>
              </div>
              <div className={`phase ${currentPhase === 'feedback_iteration' ? 'active' : ''}`}>
                <Brain size={20} />
                <span>Iterating</span>
              </div>
              <div className={`phase ${currentPhase === 'completed' ? 'active' : ''}`}>
                <Target size={20} />
                <span>Strategy Ready</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        {currentPhase === 'setup' && (
          <>
            {/* Test button for Modern Deliverables */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <button
                onClick={() => {
                  setShowModernDeliverables(true);
                  setCollaboration({ project_id: 'test-project-123', status: 'completed' });
                }}
                style={{
                  background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginBottom: '10px'
                }}
              >
                🧪 Test Modern Deliverables UI
              </button>
            </div>
            
            <ProjectInput 
              value={projectGoal}
              onChange={setProjectGoal}
              isLoading={isLoading}
            />
            
            <AgentSelection
              availableAgents={availableAgents}
              selectedAgents={selectedAgents}
              onAgentToggle={(agentId) => {
                if (selectedAgents.includes(agentId)) {
                  setSelectedAgents(selectedAgents.filter(id => id !== agentId));
                } else if (selectedAgents.length < 5) {
                  setSelectedAgents([...selectedAgents, agentId]);
                }
              }}
              onStartCollaboration={handleStartCollaboration}
              canStart={projectGoal.trim() && selectedAgents.length >= 2}
              isLoading={isLoading}
            />
          </>
        )}

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {(currentPhase === 'collaborating' || currentPhase === 'completed') && (
          <div className="collaboration-view">
            {collaboration && (
              <>
                <div className="collaboration-header">
                  <h2>
                    <Users size={24} />
                    Team Collaboration: {projectGoal}
                  </h2>
                  <div className="team-members">
                    {collaboration.agents_involved?.map((agent, idx) => (
                      <div key={idx} className="team-member">
                        <strong>{agent.name}</strong>
                        <span>{agent.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="collaboration-content">
                  <div className="conversation-section">
                    <h3>
                      <MessageSquare size={20} />
                      Agent Conversations
                    </h3>
                    <ConversationThread 
                      messages={collaboration.conversation_log || []}
                      isLoading={isLoading}
                    />
                  </div>

                  <div className="thinking-section">
                    <h3>
                      <Brain size={20} />
                      Chain of Thought
                    </h3>
                    <ThinkingProcess 
                      thinkingLog={collaboration.thinking_log || []}
                      isLoading={isLoading}
                    />
                  </div>
                </div>

                {currentPhase === 'completed' && !feedbackMode && (
                  <>
                    <div className="result-actions">
                      <button
                        onClick={handleViewDeliverables}
                        className="action-btn primary"
                      >
                        <Target size={18} />
                        View Marketing Strategy
                      </button>
                      
                      <button
                        onClick={handleGenerateVideo}
                        className="action-btn video-btn"
                        disabled={videoGenerating}
                      >
                        {videoGenerating ? (
                          <>
                            <div className="spinner-small"></div>
                            Generating Video...
                          </>
                        ) : (
                          <>
                            <Video size={18} />
                            Generate Video
                          </>
                        )}
                      </button>
                      
                      {videoReady && (
                        <button
                          onClick={handleDownloadVideo}
                          className="action-btn download-btn"
                        >
                          <Download size={18} />
                          Download Video
                        </button>
                      )}
                      
                      <button
                        onClick={handleProvideFeedback}
                        className="action-btn feedback-btn"
                      >
                        <MessageSquare size={18} />
                        Provide Feedback & Iterate
                      </button>
                      
                      <button
                        onClick={handleReset}
                        className="action-btn"
                      >
                        <Users size={18} />
                        New Project
                      </button>
                    </div>

                    {(videoGenerating || videoReady) && (
                      <div className="video-status">
                        {videoGenerating && (
                          <div className="video-status-message generating">
                            <Video size={20} />
                            <div>
                              <strong>Creating Your Marketing Video</strong>
                              <p>AI agents are turning your strategy into a professional video presentation...</p>
                            </div>
                          </div>
                        )}
                        
                        {videoReady && (
                          <div className="video-status-message ready">
                            <Download size={20} />
                            <div>
                              <strong>Video Ready!</strong>
                              <p>Your marketing strategy video is ready for download and sharing on social media.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {feedbackMode && (
                  <div className="feedback-interface">
                    <div className="feedback-header">
                      <h3>💬 Provide Feedback to Agents</h3>
                      <p>Share your thoughts on the strategy. The agents will adapt in real-time based on your input.</p>
                    </div>
                    
                    <div className="feedback-form">
                      <div className="feedback-input-group">
                        <label htmlFor="user-feedback">Your Feedback:</label>
                        <textarea
                          id="user-feedback"
                          value={userFeedback}
                          onChange={(e) => setUserFeedback(e.target.value)}
                          placeholder="e.g., 'The budget seems too high, can we reduce it by 30%?' or 'I love the creative direction but need more focus on social media...'"
                          rows={4}
                        />
                      </div>
                      
                      <div className="changes-section">
                        <label>Specific Changes Requested:</label>
                        {requestedChanges.map((change, index) => (
                          <div key={index} className="change-input">
                            <input
                              type="text"
                              value={change}
                              onChange={(e) => handleChangeUpdate(index, e.target.value)}
                              placeholder="e.g., Reduce budget to $50K, Add TikTok to media plan..."
                            />
                            <button 
                              onClick={() => handleRemoveChange(index)}
                              className="remove-change-btn"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button onClick={handleAddChange} className="add-change-btn">
                          + Add Another Change
                        </button>
                      </div>
                      
                      <div className="feedback-actions">
                        <button
                          onClick={handleSubmitFeedback}
                          className="action-btn primary"
                          disabled={!userFeedback.trim() || isLoading}
                        >
                          {isLoading ? (
                            <>
                              <div className="spinner-small"></div>
                              Agents Adapting...
                            </>
                          ) : (
                            <>
                              <MessageSquare size={18} />
                              Submit Feedback
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={handleCancelFeedback}
                          className="action-btn"
                          disabled={isLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {isLoading && (
              <div className="loading-indicator">
                <div className="spinner"></div>
                <span className="loading-text">AI marketing experts are collaborating...</span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modern Deliverables Modal */}
      {showModernDeliverables && collaboration?.project_id && (
        <ModernDeliverables
          projectId={collaboration.project_id}
          onClose={() => setShowModernDeliverables(false)}
        />
      )}
    </div>
  );
}

export default App;