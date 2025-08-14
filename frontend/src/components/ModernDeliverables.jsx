import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  LineElement,
  PointElement,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  TrendingUpIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  LightBulbIcon,
  TargetIcon,
  PresentationChartBarIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  LineElement,
  PointElement
);

const ModernDeliverables = ({ projectId, onClose }) => {
  const [deliverables, setDeliverables] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedAgent, setExpandedAgent] = useState(null);

  useEffect(() => {
    fetchDeliverables();
  }, [projectId]);

  const fetchDeliverables = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/projects/${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch deliverables');
      const data = await response.json();
      setDeliverables(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const chartData = useMemo(() => {
    if (!deliverables?.collaboration_result?.deliverables) return null;

    const agents = deliverables.collaboration_result.deliverables;
    const agentInsights = Object.keys(agents)
      .filter(key => key !== 'feedback_history')
      .map(agentName => {
        const agentData = agents[agentName];
        const recommendations = agentData?.final?.recommendations || [];
        return {
          name: agentName,
          insights: recommendations.length,
          priority: Math.random() * 100 // Mock priority score
        };
      });

    // Budget breakdown mock data (would be extracted from actual deliverables)
    const budgetData = {
      labels: ['Digital Marketing', 'Content Creation', 'Paid Advertising', 'Analytics', 'Other'],
      datasets: [{
        data: [30, 25, 20, 15, 10],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        borderWidth: 0
      }]
    };

    // Timeline data
    const timelineData = {
      labels: ['Week 1-2', 'Week 3-4', 'Week 5-6', 'Week 7-8', 'Week 9-10'],
      datasets: [{
        label: 'Campaign Progress',
        data: [20, 45, 70, 85, 100],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };

    // Agent contribution data
    const agentContributionData = {
      labels: agentInsights.map(agent => agent.name.split(' ')[0]),
      datasets: [{
        label: 'Key Insights',
        data: agentInsights.map(agent => agent.insights),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#8B5CF6'].slice(0, agentInsights.length),
        borderRadius: 8
      }]
    };

    return { budgetData, timelineData, agentContributionData, agentInsights };
  }, [deliverables]);

  const sections = [
    { id: 'overview', name: 'Overview', icon: PresentationChartBarIcon },
    { id: 'budget', name: 'Budget', icon: CurrencyDollarIcon },
    { id: 'timeline', name: 'Timeline', icon: CalendarDaysIcon },
    { id: 'insights', name: 'Insights', icon: LightBulbIcon },
    { id: 'agents', name: 'Team Analysis', icon: UserGroupIcon }
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-center text-gray-600">Loading deliverables...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="text-red-500 text-center">
            <p className="font-semibold">Error loading deliverables</p>
            <p className="mt-2 text-sm">{error}</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded-md">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const collaboration = deliverables?.collaboration_result || {};
  const agents = collaboration.deliverables || {};
  const agentsInvolved = collaboration.agents_involved || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-full py-6 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">Marketing Strategy Deliverables</h1>
                <p className="text-blue-100">{deliverables.goal}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {agentsInvolved.map((agent, idx) => (
                    <span key={idx} className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                      {agent.name}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex h-[calc(90vh-140px)]">
            {/* Navigation Sidebar */}
            <div className="w-64 border-r border-gray-200 bg-gray-50">
              <nav className="p-4 space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-100 text-blue-700 border-blue-200 border'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{section.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeSection === 'overview' && (
                    <OverviewSection 
                      deliverables={deliverables} 
                      chartData={chartData}
                      agentsInvolved={agentsInvolved}
                    />
                  )}
                  
                  {activeSection === 'budget' && (
                    <BudgetSection chartData={chartData} agents={agents} />
                  )}
                  
                  {activeSection === 'timeline' && (
                    <TimelineSection chartData={chartData} agents={agents} />
                  )}
                  
                  {activeSection === 'insights' && (
                    <InsightsSection 
                      agents={agents} 
                      expandedAgent={expandedAgent}
                      setExpandedAgent={setExpandedAgent}
                    />
                  )}
                  
                  {activeSection === 'agents' && (
                    <AgentsSection 
                      chartData={chartData} 
                      agentsInvolved={agentsInvolved}
                      agents={agents}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Overview Section Component
const OverviewSection = ({ deliverables, chartData, agentsInvolved }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Team Size"
        value={agentsInvolved.length}
        icon={UserGroupIcon}
        color="blue"
        suffix=" experts"
      />
      <MetricCard
        title="Key Insights"
        value={chartData?.agentInsights?.reduce((sum, agent) => sum + agent.insights, 0) || 0}
        icon={LightBulbIcon}
        color="green"
        suffix=" recommendations"
      />
      <MetricCard
        title="Implementation Phases"
        value="5"
        icon={CalendarDaysIcon}
        color="purple"
        suffix=" weeks"
      />
      <MetricCard
        title="Success Metrics"
        value="12"
        icon={TrendingUpIcon}
        color="orange"
        suffix=" KPIs"
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Budget Allocation</h3>
        {chartData?.budgetData && (
          <div className="h-64">
            <Doughnut
              data={chartData.budgetData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Implementation Timeline</h3>
        {chartData?.timelineData && (
          <div className="h-64">
            <Line
              data={chartData.timelineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                  },
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  </div>
);

// Budget Section Component
const BudgetSection = ({ chartData, agents }) => (
  <div className="space-y-6">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Budget Analysis</h2>
      <p className="text-gray-600">Comprehensive budget breakdown and allocation strategy</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-6">Budget Distribution</h3>
        {chartData?.budgetData && (
          <div className="h-80">
            <Doughnut
              data={chartData.budgetData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                },
              }}
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Budget</p>
              <p className="text-3xl font-bold text-green-900">$125,000</p>
            </div>
            <CurrencyDollarIcon className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Budget Breakdown</h4>
          <div className="space-y-3">
            {[
              { category: 'Digital Marketing', amount: '$37,500', percentage: '30%', color: 'bg-blue-500' },
              { category: 'Content Creation', amount: '$31,250', percentage: '25%', color: 'bg-green-500' },
              { category: 'Paid Advertising', amount: '$25,000', percentage: '20%', color: 'bg-yellow-500' },
              { category: 'Analytics & Tools', amount: '$18,750', percentage: '15%', color: 'bg-red-500' },
              { category: 'Other Expenses', amount: '$12,500', percentage: '10%', color: 'bg-purple-500' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.category}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{item.amount}</div>
                  <div className="text-xs text-gray-500">{item.percentage}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Timeline Section Component
const TimelineSection = ({ chartData, agents }) => (
  <div className="space-y-6">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Implementation Timeline</h2>
      <p className="text-gray-600">10-week strategic implementation roadmap</p>
    </div>

    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-6">Campaign Progress Projection</h3>
      {chartData?.timelineData && (
        <div className="h-80">
          <Line
            data={chartData.timelineData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: function(value) {
                      return value + '%';
                    }
                  }
                },
              },
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return 'Progress: ' + context.parsed.y + '%';
                    }
                  }
                }
              },
            }}
          />
        </div>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {[
        { phase: 'Phase 1', weeks: '1-2', title: 'Foundation & Setup', progress: 20, color: 'blue' },
        { phase: 'Phase 2', weeks: '3-4', title: 'Content Development', progress: 45, color: 'green' },
        { phase: 'Phase 3', weeks: '5-6', title: 'Campaign Launch', progress: 70, color: 'yellow' },
        { phase: 'Phase 4', weeks: '7-8', title: 'Optimization', progress: 85, color: 'purple' },
        { phase: 'Phase 5', weeks: '9-10', title: 'Scale & Analyze', progress: 100, color: 'pink' }
      ].map((phase, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-white border border-gray-200 rounded-lg p-4"
        >
          <div className="text-center">
            <div className={`mx-auto w-16 h-16 rounded-full bg-${phase.color}-100 flex items-center justify-center mb-3`}>
              <span className={`text-${phase.color}-600 font-bold text-lg`}>{phase.progress}%</span>
            </div>
            <h4 className="font-semibold text-gray-900 text-sm">{phase.phase}</h4>
            <p className="text-xs text-gray-500 mb-1">Weeks {phase.weeks}</p>
            <p className="text-xs font-medium text-gray-700">{phase.title}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// Insights Section Component
const InsightsSection = ({ agents, expandedAgent, setExpandedAgent }) => (
  <div className="space-y-6">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Strategic Insights</h2>
      <p className="text-gray-600">Key recommendations from AI marketing experts</p>
    </div>

    <div className="space-y-4">
      {Object.entries(agents)
        .filter(([key]) => key !== 'feedback_history')
        .map(([agentName, agentData], idx) => {
          const recommendations = agentData?.final?.recommendations || [];
          const isExpanded = expandedAgent === agentName;
          
          return (
            <motion.div
              key={agentName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedAgent(isExpanded ? null : agentName)}
                className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {agentName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{agentName}</h3>
                      <p className="text-sm text-gray-500">
                        {recommendations.length} key insights
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {recommendations.length} insights
                    </span>
                    {isExpanded ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-200"
                  >
                    <div className="px-6 py-4">
                      <div className="space-y-3">
                        {recommendations.map((rec, recIdx) => (
                          <motion.div
                            key={recIdx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: recIdx * 0.1 }}
                            className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-shrink-0">
                              <ArrowRightIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{rec}</p>
                          </motion.div>
                        ))}
                      </div>

                      {agentData?.final?.key_outputs && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-2">Key Outputs</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(agentData.final.key_outputs).map(([key, value]) => (
                              <div key={key} className="bg-white border border-gray-200 rounded-md p-3">
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  {key.replace(/_/g, ' ')}
                                </dt>
                                <dd className="text-sm text-gray-900 mt-1">{value}</dd>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
    </div>
  </div>
);

// Agents Section Component
const AgentsSection = ({ chartData, agentsInvolved, agents }) => (
  <div className="space-y-6">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Team Analysis</h2>
      <p className="text-gray-600">AI expert contributions and performance metrics</p>
    </div>

    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-6">Agent Contribution Analysis</h3>
      {chartData?.agentContributionData && (
        <div className="h-80">
          <Bar
            data={chartData.agentContributionData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 1
                  }
                },
              },
            }}
          />
        </div>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agentsInvolved.map((agent, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
              <span className="text-white font-bold text-xl">
                {agent.name.charAt(0)}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">{agent.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{agent.role}</p>
            
            <div className="flex justify-center space-x-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-blue-600">
                  {agents[agent.name]?.final?.recommendations?.length || 0}
                </div>
                <div className="text-gray-500">Insights</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-600">High</div>
                <div className="text-gray-500">Impact</div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// Metric Card Component
const MetricCard = ({ title, value, icon: Icon, color, suffix = '' }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 text-blue-600',
    green: 'from-green-500 to-green-600 text-green-600',
    purple: 'from-purple-500 to-purple-600 text-purple-600',
    orange: 'from-orange-500 to-orange-600 text-orange-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value}{suffix}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorClasses[color]} bg-opacity-10 flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${colorClasses[color].split(' ')[2]}`} />
        </div>
      </div>
    </motion.div>
  );
};

export default ModernDeliverables;