import React from 'react';
import { Brain, Lightbulb, HelpCircle, Target } from 'lucide-react';

const ThinkingProcess = ({ thinkingLog, isLoading }) => {
  const getAgentColor = (agentRole) => {
    const colors = {
      'Market Researcher': '#3B82F6',
      'Brand Strategist': '#8B5CF6',
      'Creative Director': '#EC4899',
      'Media Planner': '#10B981',
      'Data Analyst': '#F59E0B',
      'Content Strategist': '#EF4444',
      'Customer Insights Specialist': '#06B6D4'
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
      'Customer Insights Specialist': '👥'
    };
    return emojis[agentRole] || '🧠';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (!thinkingLog.length && !isLoading) {
    return (
      <div className="thinking-empty">
        <Brain size={48} className="empty-icon" />
        <p>Agent thinking processes will appear here</p>
      </div>
    );
  }

  return (
    <div className="thinking-process">
      {thinkingLog.map((thinking, index) => {
        const agentColor = getAgentColor(thinking.agent_role);
        
        return (
          <div
            key={index}
            className="thinking-entry"
            style={{ '--agent-color': agentColor }}
          >
            <div className="thinking-header">
              <div className="agent-info">
                <div className="agent-avatar">
                  {getAgentEmoji(thinking.agent_role)}
                </div>
                <div className="agent-details">
                  <span className="agent-name">{thinking.agent_name}</span>
                  <span className="agent-role">{thinking.agent_role}</span>
                </div>
              </div>
              <div className="thinking-meta">
                <Brain size={16} />
                <span className="timestamp">
                  {formatTimestamp(thinking.timestamp)}
                </span>
              </div>
            </div>

            <div className="thinking-content">
              <div className="thought-process">
                <div className="thought-section">
                  <Brain size={16} className="section-icon" />
                  <div className="section-content">
                    <h4>Thought Process</h4>
                    <p>{thinking.thinking_process}</p>
                  </div>
                </div>
              </div>

              {thinking.insights && thinking.insights.length > 0 && (
                <div className="insights-section">
                  <Lightbulb size={16} className="section-icon" />
                  <div className="section-content">
                    <h4>Key Insights</h4>
                    <ul className="insights-list">
                      {thinking.insights.map((insight, idx) => (
                        <li key={idx}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {thinking.questions && thinking.questions.length > 0 && (
                <div className="questions-section">
                  <HelpCircle size={16} className="section-icon" />
                  <div className="section-content">
                    <h4>Questions to Explore</h4>
                    <ul className="questions-list">
                      {thinking.questions.map((question, idx) => (
                        <li key={idx}>{question}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {thinking.recommendations && thinking.recommendations.length > 0 && (
                <div className="recommendations-section">
                  <Target size={16} className="section-icon" />
                  <div className="section-content">
                    <h4>Initial Recommendations</h4>
                    <ul className="recommendations-list">
                      {thinking.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="thinking-loading">
          <div className="thinking-indicator">
            <Brain size={20} className="brain-pulse" />
            <span>Agents are thinking...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThinkingProcess;