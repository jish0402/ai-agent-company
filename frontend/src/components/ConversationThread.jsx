import React, { useRef, useEffect } from 'react';
import { MessageSquare, ArrowRight, ThumbsUp, ThumbsDown, HelpCircle, Lightbulb, AlertCircle } from 'lucide-react';

const ConversationThread = ({ messages, isLoading }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getStanceIcon = (stance) => {
    const stanceIcons = {
      'agree': <ThumbsUp size={16} className="stance-icon agree" />,
      'disagree': <ThumbsDown size={16} className="stance-icon disagree" />,
      'build_on': <Lightbulb size={16} className="stance-icon build" />,
      'question': <HelpCircle size={16} className="stance-icon question" />,
      'challenge': <AlertCircle size={16} className="stance-icon challenge" />,
      'propose_alternative': <ArrowRight size={16} className="stance-icon alternative" />
    };
    return stanceIcons[stance] || null;
  };

  const getStanceLabel = (stance) => {
    const stanceLabels = {
      'agree': 'Agrees',
      'disagree': 'Disagrees', 
      'build_on': 'Builds on idea',
      'question': 'Questions',
      'challenge': 'Challenges',
      'propose_alternative': 'Proposes alternative'
    };
    return stanceLabels[stance] || 'Responds';
  };

  const getAgentColor = (agentRole) => {
    const colors = {
      'Market Researcher': '#3B82F6',
      'Brand Strategist': '#8B5CF6',
      'Creative Director': '#EC4899',
      'Media Planner': '#10B981',
      'Data Analyst': '#F59E0B',
      'Content Strategist': '#EF4444',
      'Customer Insights Specialist': '#06B6D4',
      'Orchestrator': '#6B7280'
    };
    return colors[agentRole] || '#6B7280';
  };

  const getAgentEmoji = (agentRole) => {
    const emojis = {
      'Market Researcher': '📊',
      'Brand Strategist': '🎯',
      'Creative Director': '🎨',
      'Media Planner': '📺',
      'Data Analyst': '📈',
      'Content Strategist': '📝',
      'Customer Insights Specialist': '👥',
      'Orchestrator': '🎭'
    };
    return emojis[agentRole] || '🤖';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (!messages.length && !isLoading) {
    return (
      <div className="conversation-empty">
        <MessageSquare size={48} className="empty-icon" />
        <p>Agent conversations will appear here</p>
      </div>
    );
  }

  return (
    <div className="conversation-thread">
      {messages.map((message, index) => {
        const isSystem = message.agent_name === 'System';
        const agentColor = getAgentColor(message.agent_role);
        const content = message.content || {};
        const stance = content.stance;
        const reasoning = content.reasoning;
        const contribution = content.contribution;
        const questions = content.questions_for_team || [];
        const challenges = content.challenges_raised || [];

        return (
          <div
            key={index}
            className={`conversation-message ${isSystem ? 'system-message' : 'agent-message'}`}
            style={{ '--agent-color': agentColor }}
          >
            <div className="message-header">
              <div className="agent-info">
                <div className="agent-avatar">
                  {getAgentEmoji(message.agent_role)}
                </div>
                <div className="agent-details">
                  <span className="agent-name">{message.agent_name}</span>
                  <span className="agent-role">{message.agent_role}</span>
                  {message.responding_to && (
                    <span className="responding-to">
                      <ArrowRight size={12} />
                      responding to {message.responding_to}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="message-meta">
                {stance && (
                  <div className="stance-indicator">
                    {getStanceIcon(stance)}
                    <span>{getStanceLabel(stance)}</span>
                  </div>
                )}
                <span className="timestamp">
                  {formatTimestamp(message.timestamp)}
                </span>
              </div>
            </div>

            <div className="message-content">
              {content.message && (
                <div className="main-message">
                  {content.message}
                </div>
              )}

              {reasoning && (
                <div className="reasoning-section">
                  <strong>💭 Reasoning:</strong>
                  <p>{reasoning}</p>
                </div>
              )}

              {contribution && (
                <div className="contribution-section">
                  <strong>💡 Contribution:</strong>
                  <p>{contribution}</p>
                </div>
              )}

              {questions.length > 0 && (
                <div className="questions-section">
                  <strong>❓ Questions for the team:</strong>
                  <ul>
                    {questions.map((question, idx) => (
                      <li key={idx}>{question}</li>
                    ))}
                  </ul>
                </div>
              )}

              {challenges.length > 0 && (
                <div className="challenges-section">
                  <strong>⚠️ Concerns raised:</strong>
                  <ul>
                    {challenges.map((challenge, idx) => (
                      <li key={idx}>{challenge}</li>
                    ))}
                  </ul>
                </div>
              )}

              {content.data_produced && Object.keys(content.data_produced).length > 0 && (
                <div className="data-section">
                  <strong>📊 Insights:</strong>
                  {Object.entries(content.data_produced).map(([key, value], idx) => (
                    <div key={idx} className="data-item">
                      <strong>{key.replace('_', ' ')}:</strong> {value}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {message.round && (
              <div className="round-indicator">
                Round {message.round}
              </div>
            )}
          </div>
        );
      })}

      {isLoading && (
        <div className="typing-indicator">
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span>Agents are discussing...</span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ConversationThread;