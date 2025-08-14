import React from 'react';
import { Users, Play, CheckCircle, User } from 'lucide-react';

const AgentSelection = ({ 
  availableAgents, 
  selectedAgents, 
  onAgentToggle, 
  onStartCollaboration, 
  canStart, 
  isLoading 
}) => {
  const getAgentIcon = (role) => {
    const icons = {
      'Market Researcher': '📊',
      'Brand Strategist': '🎯',
      'Creative Director': '🎨',
      'Media Planner': '📺',
      'Data Analyst': '📈',
      'Content Strategist': '📝',
      'Customer Insights Specialist': '👥'
    };
    return icons[role] || '🤖';
  };

  const getAgentColor = (role) => {
    const colors = {
      'Market Researcher': '#3B82F6',      // Blue
      'Brand Strategist': '#8B5CF6',       // Purple  
      'Creative Director': '#EC4899',      // Pink
      'Media Planner': '#10B981',          // Green
      'Data Analyst': '#F59E0B',           // Orange
      'Content Strategist': '#EF4444',     // Red
      'Customer Insights Specialist': '#06B6D4' // Cyan
    };
    return colors[role] || '#6B7280';
  };

  return (
    <div className="agent-selection-section">
      <div className="selection-header">
        <Users size={24} />
        <div>
          <h2>Choose Your AI Marketing Team</h2>
          <p>Select 2-5 expert agents to collaborate on your project. Each brings unique expertise and personality.</p>
        </div>
      </div>

      <div className="agents-grid">
        {availableAgents.map((agent) => {
          const isSelected = selectedAgents.includes(agent.id);
          const agentColor = getAgentColor(agent.role);
          
          return (
            <div
              key={agent.id}
              className={`agent-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onAgentToggle(agent.id)}
              style={{ '--agent-color': agentColor }}
            >
              <div className="agent-header">
                <div className="agent-avatar">
                  <span className="agent-emoji">{getAgentIcon(agent.role)}</span>
                  {isSelected && (
                    <div className="selection-indicator">
                      <CheckCircle size={20} />
                    </div>
                  )}
                </div>
                <div className="agent-info">
                  <h3 className="agent-name">{agent.name}</h3>
                  <p className="agent-role">{agent.role}</p>
                </div>
              </div>
              
              <div className="agent-details">
                <div className="expertise">
                  <strong>Expertise:</strong>
                  <p>{agent.expertise}</p>
                </div>
                <div className="personality">
                  <strong>Personality:</strong>
                  <p>{agent.personality}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="selection-summary">
        <div className="selected-count">
          <User size={20} />
          <span>{selectedAgents.length} agents selected (2-5 required)</span>
        </div>

        {selectedAgents.length > 0 && (
          <div className="selected-agents">
            <strong>Your team:</strong>
            {selectedAgents.map((agentId) => {
              const agent = availableAgents.find(a => a.id === agentId);
              return agent ? (
                <span key={agentId} className="selected-agent-chip">
                  {getAgentIcon(agent.role)} {agent.name}
                </span>
              ) : null;
            })}
          </div>
        )}

        <button
          onClick={onStartCollaboration}
          disabled={!canStart || isLoading}
          className={`start-collaboration-btn ${canStart ? 'ready' : ''}`}
        >
          {isLoading ? (
            <>
              <div className="spinner-small"></div>
              Starting Collaboration...
            </>
          ) : (
            <>
              <Play size={20} />
              Start AI Collaboration
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AgentSelection;