import React from 'react';
import { Target, Sparkles } from 'lucide-react';

const ProjectInput = ({ value, onChange, isLoading }) => {
  const exampleProjects = [
    "Launch a fitness app for busy professionals aged 25-45",
    "Rebrand a local coffee shop to compete with Starbucks",
    "Create a social media strategy for a new sustainable fashion brand",
    "Market a B2B SaaS tool for project management",
    "Develop a go-to-market strategy for an AI writing assistant",
    "Launch a premium pet food brand targeting health-conscious pet owners"
  ];

  return (
    <div className="project-input-section">
      <div className="input-header">
        <Target size={24} />
        <div>
          <h2>What's your marketing challenge?</h2>
          <p>Describe your business goal, and our AI marketing team will collaborate to create a comprehensive strategy</p>
        </div>
      </div>

      <div className="input-container">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe your marketing goal or challenge... (e.g., 'Launch a fitness app for busy professionals')"
          className="project-input"
          rows={4}
          disabled={isLoading}
        />
      </div>

      <div className="examples-section">
        <div className="examples-header">
          <Sparkles size={16} />
          <span>Try these examples:</span>
        </div>
        <div className="examples-grid">
          {exampleProjects.map((example, index) => (
            <button
              key={index}
              onClick={() => onChange(example)}
              className="example-chip"
              disabled={isLoading}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectInput;