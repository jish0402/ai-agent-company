from openai import OpenAI
from typing import Dict, List, Any, Optional
import json
import asyncio
import os
from datetime import datetime

class BaseAgent:
    def __init__(self, name: str, role: str, expertise: str, personality: str):
        self.name = name
        self.role = role
        self.expertise = expertise
        self.personality = personality
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        self.client = OpenAI(api_key=self.api_key)
        self.conversation_history = []
        self.thinking_process = []
        
    async def think(self, context: str, previous_messages: List[Dict]) -> Dict[str, str]:
        """Internal thinking process - chain of thought"""
        thinking_prompt = f"""
        You are {self.name}, a {self.role} with expertise in {self.expertise}.
        Your personality: {self.personality}
        
        Context: {context}
        
        Previous agent messages:
        {self._format_previous_messages(previous_messages)}
        
        Think through this step by step. What's your analysis? What questions do you have? 
        What insights can you provide? Be thoughtful and show your reasoning process.
        
        Respond in JSON format:
        {{
            "thinking": "Your internal thought process and analysis",
            "key_insights": ["insight 1", "insight 2", "insight 3"],
            "questions_for_other_agents": ["question 1", "question 2"],
            "recommendations": ["recommendation 1", "recommendation 2"]
        }}
        """
        
        try:
            response = await self._get_ai_response(thinking_prompt, temperature=0.7)
            thinking_data = self._parse_json_response(response)
            
            # Store thinking process
            self.thinking_process.append({
                "timestamp": datetime.now().isoformat(),
                "thinking": thinking_data.get("thinking", "Processing..."),
                "insights": thinking_data.get("key_insights", []),
                "questions": thinking_data.get("questions_for_other_agents", []),
                "recommendations": thinking_data.get("recommendations", [])
            })
            
            return thinking_data
        except Exception as e:
            return {
                "thinking": f"Error in thinking process: {str(e)}",
                "key_insights": [],
                "questions_for_other_agents": [],
                "recommendations": []
            }
    
    async def respond_to_agent(self, message_from: str, message_content: str, context: str, conversation_history: List[Dict], discussed_topics: set = None) -> Dict[str, Any]:
        """Respond to another agent's message - can agree, disagree, build on ideas, or debate"""
        
        # Analyze the previous message to determine response type
        response_type = await self._determine_response_type(message_content, conversation_history)
        
        # Get unique expertise angle to avoid repetition
        expertise_focus = self._get_unique_expertise_angle(discussed_topics or set())
        
        response_prompt = f"""
        You are {self.name}, a {self.role} with expertise in {self.expertise}.
        Your personality: {self.personality}
        
        EXPERTISE FOCUS: {expertise_focus} (focus on this specific angle to avoid repetition)
        
        {message_from} just said: "{message_content}"
        
        Project context: {context}
        
        Previous conversation:
        {self._format_previous_messages(conversation_history)}
        
        Response mode: {response_type}
        
        IMPORTANT RULES:
        - Focus ONLY on your unique {expertise_focus} perspective
        - Provide SPECIFIC, ACTIONABLE insights, not general recommendations
        - If you disagree, offer concrete alternatives with numbers/details
        - Keep responses concise and business-focused
        - Avoid repeating what others have already covered
        
        Respond in JSON format:
        {{
            "message": "Your specific, expert response (max 2 sentences, be direct and actionable)",
            "stance": "agree|disagree|build_on|question|challenge|propose_alternative",
            "reasoning": "ONE specific reason based on your {expertise_focus} expertise",
            "contribution": "ONE concrete, measurable contribution you're adding",
            "data_produced": {{"specific_metric": "exact number or detail", "actionable_step": "precise next action"}},
            "questions_for_team": ["ONE specific question that drives decision-making"],
            "challenges_raised": ["ONE specific concern with proposed solution"]
        }}
        """
        
        try:
            response = await self._get_ai_response(response_prompt, temperature=0.8)
            response_data = self._parse_json_response(response)
            
            # Store in conversation history
            self.conversation_history.append({
                "timestamp": datetime.now().isoformat(),
                "responding_to": message_from,
                "message": response_data.get("message", ""),
                "stance": response_data.get("stance", "respond"),
                "reasoning": response_data.get("reasoning", ""),
                "contribution": response_data.get("contribution", ""),
                "data": response_data.get("data_produced", {}),
                "challenges": response_data.get("challenges_raised", [])
            })
            
            return response_data
        except Exception as e:
            return {
                "message": f"I'm having trouble processing that. Let me think about it more.",
                "action_taken": "error_handling",
                "data_produced": {},
                "next_steps": ["retry analysis"],
                "questions_for_team": []
            }
    
    async def initiate_conversation(self, context: str, conversation_history: List[Dict]) -> Dict[str, Any]:
        """Start a conversation or provide initial input"""
        initiate_prompt = f"""
        You are {self.name}, a {self.role} with expertise in {self.expertise}.
        Your personality: {self.personality}
        
        Project context: {context}
        
        Previous conversation:
        {self._format_previous_messages(conversation_history)}
        
        Either start the conversation or provide your initial analysis/input for this project.
        Be proactive and share your expert perspective.
        
        Respond in JSON format:
        {{
            "message": "Your opening message or analysis",
            "action_taken": "What you're doing (analyzing, researching, strategizing, etc.)",
            "deliverables": {{"item": "description", "another_item": "description"}},
            "insights": ["key insight 1", "key insight 2"],
            "questions_for_team": ["question 1", "question 2"]
        }}
        """
        
        try:
            response = await self._get_ai_response(initiate_prompt, temperature=0.7)
            return self._parse_json_response(response)
        except Exception as e:
            return {
                "message": f"Hello team! I'm {self.name}, and I'll be handling {self.role} for this project.",
                "action_taken": "introduction",
                "deliverables": {},
                "insights": [],
                "questions_for_team": []
            }
    
    async def _get_ai_response(self, prompt: str, temperature: float = 0.7) -> str:
        """Get response from OpenAI"""
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=1500
        )
        return response.choices[0].message.content.strip()
    
    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """Parse JSON response with fallback"""
        try:
            if response.startswith('```json'):
                response = response.split('```json')[1].split('```')[0].strip()
            elif response.startswith('```'):
                response = response.split('```')[1].split('```')[0].strip()
            
            return json.loads(response)
        except json.JSONDecodeError:
            return {"message": response, "action_taken": "response", "data_produced": {}}
    
    async def _determine_response_type(self, message_content: str, conversation_history: List[Dict]) -> str:
        """Determine how this agent should respond based on the message and context"""
        # Simple heuristics to determine response type
        message_lower = message_content.lower()
        
        # Look for disagreement indicators
        if any(word in message_lower for word in ["disagree", "but", "however", "instead", "alternative", "different approach"]):
            return "challenge_or_debate"
        
        # Look for questions
        if "?" in message_content or any(word in message_lower for word in ["what do you think", "thoughts", "opinion"]):
            return "answer_question"
        
        # Look for proposals or recommendations
        if any(word in message_lower for word in ["recommend", "suggest", "propose", "think we should"]):
            return "evaluate_and_respond"
        
        # Look for data or analysis
        if any(word in message_lower for word in ["data shows", "research indicates", "analysis", "insights"]):
            return "build_on_analysis"
        
        # Default to collaborative building
        return "collaborative_building"
    
    def _format_previous_messages(self, messages: List[Dict]) -> str:
        """Format conversation history"""
        if not messages:
            return "No previous messages."
        
        formatted = []
        for msg in messages[-5:]:  # Last 5 messages
            agent_name = msg.get("agent_name", "Unknown")
            content = msg.get("content", {}).get("message", "")
            stance = msg.get("content", {}).get("stance", "")
            if stance:
                formatted.append(f"{agent_name} ({stance}): {content}")
            else:
                formatted.append(f"{agent_name}: {content}")
        
        return "\n".join(formatted)
    
    def _get_unique_expertise_angle(self, discussed_topics: set) -> str:
        """Get a unique expertise angle based on role to avoid repetition"""
        role_angles = {
            "Market Researcher": ["competitive intelligence", "consumer behavior analysis", "market sizing", "trend forecasting"],
            "Brand Strategist": ["brand positioning", "messaging hierarchy", "competitive differentiation", "brand architecture"],
            "Creative Director": ["visual storytelling", "creative concept development", "brand expression", "campaign ideation"],
            "Media Planner": ["channel optimization", "budget allocation", "media mix modeling", "reach and frequency"],
            "Data Analyst": ["performance metrics", "ROI analysis", "attribution modeling", "predictive analytics"],
            "Content Strategist": ["editorial strategy", "SEO optimization", "content distribution", "audience engagement"],
            "Customer Insights Specialist": ["user journey mapping", "persona development", "behavioral segmentation", "customer lifetime value"],
            "Implementation Specialist": ["project management", "timeline optimization", "resource allocation", "execution planning"],
            "Angel Investor": ["investment thesis", "market opportunity", "scalability assessment", "funding strategy"]
        }
        
        # Get available angles for this role
        available_angles = role_angles.get(self.role, ["strategic analysis"])
        
        # Find an angle that hasn't been heavily discussed
        for angle in available_angles:
            angle_keywords = angle.split()
            if not any(keyword in discussed_topics for keyword in angle_keywords):
                return angle
        
        # Fallback to first angle if all have been discussed
        return available_angles[0]


# Define specific marketing agents
class MarketResearcher(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Sarah Chen",
            role="Market Researcher",
            expertise="Market analysis, competitor research, consumer behavior, trend identification, real-time market intelligence",
            personality="Analytical, detail-oriented, data-driven, curious about market dynamics, proactive in gathering competitive intelligence"
        )
    
    async def conduct_competitor_research(self, project_goal: str, competitors: List[str] = None) -> Dict[str, Any]:
        """Conduct real-time competitor research using web search and analysis"""
        
        # Extract competitor names from project goal if not provided
        if not competitors:
            competitors = self._extract_competitors_from_goal(project_goal)
        
        competitor_data = {}
        
        for competitor in competitors[:3]:  # Limit to top 3 competitors
            try:
                # Use OpenAI to generate competitor research insights
                research_prompt = f"""
                As a market researcher, analyze the competitive landscape for {competitor} in the context of: {project_goal}
                
                Provide detailed competitive intelligence covering:
                1. Market positioning and differentiation
                2. Pricing strategy (estimate based on typical market rates)
                3. Key strengths and weaknesses
                4. Recent market moves or trends
                5. Opportunities to compete against them
                
                Respond in JSON format:
                {{
                    "competitor_name": "{competitor}",
                    "market_position": "Detailed positioning analysis",
                    "pricing_strategy": "Pricing insights and estimates",
                    "strengths": ["strength 1", "strength 2", "strength 3"],
                    "weaknesses": ["weakness 1", "weakness 2"],
                    "recent_moves": ["recent development 1", "recent development 2"],
                    "competitive_opportunities": ["opportunity 1", "opportunity 2"],
                    "threat_level": "high|medium|low",
                    "differentiation_strategy": "How to compete against them effectively"
                }}
                """
                
                response = await self._get_ai_response(research_prompt, temperature=0.6)
                competitor_analysis = self._parse_json_response(response)
                competitor_data[competitor] = competitor_analysis
                
            except Exception as e:
                competitor_data[competitor] = {
                    "error": f"Could not analyze {competitor}: {str(e)}",
                    "competitor_name": competitor,
                    "threat_level": "unknown"
                }
        
        return {
            "research_type": "competitive_intelligence",
            "competitors_analyzed": list(competitor_data.keys()),
            "detailed_analysis": competitor_data,
            "research_timestamp": datetime.now().isoformat(),
            "market_insights": self._generate_market_insights(competitor_data, project_goal)
        }
    
    def _extract_competitors_from_goal(self, project_goal: str) -> List[str]:
        """Extract competitor names from project goal"""
        goal_lower = project_goal.lower()
        
        # Common patterns for competitor mentions
        competitor_patterns = [
            "compete with", "against", "vs", "versus", "beat", "outperform"
        ]
        
        competitors = []
        
        # Look for specific competitor mentions
        if any(pattern in goal_lower for pattern in competitor_patterns):
            # Extract company names that might be competitors
            words = project_goal.split()
            for i, word in enumerate(words):
                if any(pattern in word.lower() for pattern in competitor_patterns):
                    # Look for capitalized words after the pattern (likely company names)
                    for j in range(i+1, min(i+4, len(words))):
                        if words[j][0].isupper() and len(words[j]) > 2:
                            competitors.append(words[j])
        
        # If no specific competitors found, add industry-generic ones
        if not competitors:
            if "saas" in goal_lower or "software" in goal_lower:
                competitors = ["Salesforce", "HubSpot", "Microsoft"]
            elif "ecommerce" in goal_lower or "retail" in goal_lower:
                competitors = ["Amazon", "Shopify", "BigCommerce"]
            elif "startup" in goal_lower:
                competitors = ["Y Combinator companies", "TechStars portfolio", "Industry leaders"]
            else:
                competitors = ["Market leader", "Key competitor", "Industry incumbent"]
        
        return competitors[:3]  # Limit to 3 competitors
    
    def _generate_market_insights(self, competitor_data: Dict, project_goal: str) -> List[str]:
        """Generate actionable market insights from competitor research"""
        insights = []
        
        # Analyze threat levels
        high_threat_competitors = [name for name, data in competitor_data.items() 
                                 if data.get("threat_level") == "high"]
        
        if high_threat_competitors:
            insights.append(f"High-threat competitors identified: {', '.join(high_threat_competitors)}")
        
        # Look for common weaknesses
        all_weaknesses = []
        for competitor, data in competitor_data.items():
            if "weaknesses" in data and isinstance(data["weaknesses"], list):
                all_weaknesses.extend(data["weaknesses"])
        
        if all_weaknesses:
            insights.append(f"Market gap opportunity: {all_weaknesses[0]}")
        
        # Pricing insights
        insights.append("Competitive pricing analysis completed - use for strategic positioning")
        
        return insights
    
    async def initiate_conversation(self, context: str, conversation_history: List[Dict]) -> Dict[str, Any]:
        """Enhanced market research with real-time competitive intelligence"""
        
        # Check if competitors are mentioned in context
        needs_competitor_research = any(keyword in context.lower() 
                                      for keyword in ["compete", "competitor", "vs", "against", "beat"])
        
        if needs_competitor_research:
            # Conduct real-time competitor research
            competitor_research = await self.conduct_competitor_research(context)
            
            return {
                "message": f"I've conducted real-time competitive intelligence research for this project. Found {len(competitor_research['competitors_analyzed'])} key competitors to analyze.",
                "action_taken": "competitive_intelligence_research",
                "deliverables": {
                    "competitive_analysis": competitor_research,
                    "market_positioning_opportunity": "Based on competitor weaknesses identified",
                    "competitive_threats": competitor_research.get("competitors_analyzed", []),
                    "market_intelligence": competitor_research.get("market_insights", [])
                },
                "insights": competitor_research.get("market_insights", ["Real-time market research completed"]),
                "questions_for_team": [
                    "Which competitor poses the biggest threat to our strategy?",
                    "How should we position against their key strengths?"
                ]
            }
        else:
            # Regular market research initiation
            return await super().initiate_conversation(context, conversation_history)

class BrandStrategist(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Marcus Rivera",
            role="Brand Strategist", 
            expertise="Brand architecture, messaging frameworks, competitive positioning, brand equity valuation, multi-touchpoint consistency",
            personality="Visionary brand architect who thinks 5 years ahead, obsessed with authentic brand storytelling and emotional connection. Challenges conventional wisdom and pushes for breakthrough positioning."
        )
    
    async def initiate_conversation(self, context: str, conversation_history: List[Dict]) -> Dict[str, Any]:
        """Brand strategist focuses on unique positioning and differentiation"""
        brand_prompt = f"""
        You are Marcus Rivera, a visionary Brand Strategist. Your expertise is creating breakthrough brand positioning that cuts through market noise.
        
        Project: {context}
        
        Create a BOLD brand strategy that's completely different from what competitors are doing. Focus on:
        1. Unique brand positioning angle (not "quality" or "innovation")
        2. Specific messaging framework with 3 pillars
        3. Brand differentiation strategy with measurable brand equity goals
        4. Authentic brand story that connects emotionally
        
        BE BOLD AND SPECIFIC - no generic "increase brand awareness" - give exact positioning strategies.
        
        Respond in JSON format:
        {{
            "message": "Here's my breakthrough brand positioning strategy...",
            "action_taken": "breakthrough_brand_positioning",
            "deliverables": {{
                "brand_positioning": "Specific unique position in market (not generic)",
                "messaging_framework": "3-pillar messaging architecture with specific themes",
                "differentiation_strategy": "Concrete ways to stand apart from all competitors",
                "brand_story": "Authentic narrative that drives emotional connection",
                "brand_equity_goals": "Measurable brand value targets (awareness %, sentiment scores, etc.)"
            }},
            "insights": ["Brand insight 1 with specific market angle", "Brand insight 2 with differentiation focus"],
            "questions_for_team": ["How do we ensure this positioning is sustainable long-term?", "What budget allocation supports this brand differentiation?"]
        }}
        """
        
        try:
            response = await self._get_ai_response(brand_prompt, temperature=0.8)
            return self._parse_json_response(response)
        except Exception as e:
            return {
                "message": f"I'm developing a breakthrough brand positioning strategy for: {context}. This won't be another generic 'premium quality' approach - we're going bold.",
                "action_taken": "strategic_brand_architecture",
                "deliverables": {
                    "brand_positioning": "Developing unique market position that competitors can't replicate",
                    "messaging_framework": "Building 3-pillar messaging architecture for consistent communication",
                    "differentiation_strategy": "Creating sustainable competitive brand advantages",
                    "brand_story": "Crafting authentic narrative for emotional market connection",
                    "brand_equity_goals": "Setting measurable brand value and recognition targets"
                },
                "insights": ["Brand differentiation must be authentic and defensible", "Emotional connection drives premium pricing power"],
                "questions_for_team": ["What's our brand's authentic truth that competitors can't copy?", "How do we measure brand equity growth over time?"]
            }

class CreativeDirector(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Elena Vasquez",
            role="Creative Director",
            expertise="Breakthrough creative concepts, viral content architecture, emotional storytelling, cross-platform creative systems, award-winning campaign development",
            personality="Fearless creative visionary who turns ordinary ideas into extraordinary experiences. Obsessed with creating content that people actually want to share. Challenges boring marketing and demands creative courage."
        )
    
    async def initiate_conversation(self, context: str, conversation_history: List[Dict]) -> Dict[str, Any]:
        """Creative director develops breakthrough creative concepts"""
        creative_prompt = f"""
        You are Elena Vasquez, a fearless Creative Director known for creating campaigns that people actually remember and share.
        
        Project: {context}
        
        Create BREAKTHROUGH creative concepts that will cut through the noise. NO boring corporate marketing - we need ideas that:
        1. Make people stop scrolling and pay attention
        2. Generate organic social sharing and word-of-mouth
        3. Create emotional connection, not just awareness
        4. Work across all platforms with adaptation, not duplication
        
        Give me 3 BOLD creative concepts with specific execution details.
        
        Respond in JSON format:
        {{
            "message": "Here are 3 breakthrough creative concepts that will dominate attention...",
            "action_taken": "breakthrough_creative_development",
            "deliverables": {{
                "concept_1": {{
                    "name": "Specific creative concept name",
                    "description": "What makes this concept breakthrough and sharable",
                    "execution": "How this gets executed across platforms",
                    "emotional_hook": "What emotion this triggers in audience"
                }},
                "concept_2": {{
                    "name": "Second creative concept name", 
                    "description": "Why this concept will generate buzz",
                    "execution": "Specific tactical execution plan",
                    "emotional_hook": "Emotional response this creates"
                }},
                "concept_3": {{
                    "name": "Third creative concept name",
                    "description": "How this concept differentiates from competition", 
                    "execution": "Multi-platform execution strategy",
                    "emotional_hook": "Core emotional driver"
                }},
                "creative_system": "How these concepts work together as a cohesive creative system",
                "virality_factors": "Specific elements designed to drive organic sharing"
            }},
            "insights": ["Creative insight about breakthrough attention-getting", "Insight about emotional connection driving sharing"],
            "questions_for_team": ["Which concept has highest viral potential?", "What creative budget supports breakthrough execution?"]
        }}
        """
        
        try:
            response = await self._get_ai_response(creative_prompt, temperature=0.9)
            return self._parse_json_response(response)
        except Exception as e:
            return {
                "message": f"I'm developing breakthrough creative concepts for: {context}. We're not doing another boring corporate campaign - these concepts will demand attention.",
                "action_taken": "breakthrough_creative_architecture",
                "deliverables": {
                    "creative_concepts": "3 breakthrough concepts designed for viral sharing",
                    "emotional_storytelling": "Narrative frameworks that create deep connection",
                    "attention_architecture": "Creative systems designed to stop scrolling and drive engagement",
                    "cross_platform_adaptation": "How concepts scale across all marketing channels",
                    "shareability_design": "Elements specifically crafted for organic amplification"
                },
                "insights": ["Breakthrough creative requires emotional courage", "Shareable content solves problems or sparks emotions"],
                "questions_for_team": ["Are we brave enough to stand out from competitors?", "What's our creative risk tolerance?"]
            }

class MediaPlanner(BaseAgent):
    def __init__(self):
        super().__init__(
            name="David Kim",
            role="Media Planner",
            expertise="Media strategy, channel optimization, budget allocation, reach and frequency planning",
            personality="Strategic, numbers-focused, practical, efficient with budgets"
        )

class DataAnalyst(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Priya Patel",
            role="Data Analyst",
            expertise="Advanced attribution modeling, predictive customer lifetime value, conversion optimization, statistical significance testing, real-time performance optimization",
            personality="Data-driven detective who uncovers hidden growth opportunities through numbers. Obsessed with statistical accuracy and finding the metrics that actually matter for business growth. Challenges assumptions with hard data."
        )
    
    async def initiate_conversation(self, context: str, conversation_history: List[Dict]) -> Dict[str, Any]:
        """Data analyst provides specific metrics and measurement frameworks"""
        analytics_prompt = f"""
        You are Priya Patel, a data analyst who uncovers business growth opportunities through advanced analytics.
        
        Project: {context}
        
        Design a comprehensive measurement framework with SPECIFIC metrics. No generic "track ROI" - give exact:
        1. Primary KPIs with target numbers and benchmarks
        2. Attribution model recommendations for this specific business
        3. Conversion optimization opportunities with expected impact
        4. Predictive analytics approach for scaling
        5. Real-time dashboard structure
        
        Be SPECIFIC with numbers, percentages, and measurement methods.
        
        Respond in JSON format:
        {{
            "message": "Here's the advanced analytics framework that will drive growth optimization...",
            "action_taken": "advanced_analytics_architecture",
            "deliverables": {{
                "primary_kpis": {{
                    "metric_1": {{"name": "Specific KPI name", "target": "Exact target number", "benchmark": "Industry benchmark"}},
                    "metric_2": {{"name": "Second KPI name", "target": "Specific target", "benchmark": "Comparison standard"}},
                    "metric_3": {{"name": "Third KPI name", "target": "Numerical target", "benchmark": "Industry average"}}
                }},
                "attribution_model": "Specific attribution approach for this business model",
                "conversion_optimization": {{
                    "opportunity_1": "Specific optimization with % impact estimate",
                    "opportunity_2": "Second optimization with expected improvement",
                    "opportunity_3": "Third optimization with quantified results"
                }},
                "predictive_framework": "Machine learning approach for scaling predictions",
                "dashboard_structure": "Real-time monitoring system with specific metrics"
            }},
            "insights": ["Data insight with specific statistical finding", "Analytics insight with business impact quantification"],
            "questions_for_team": ["What's our minimum acceptable statistical significance level?", "Which metrics drive the highest business value?"]
        }}
        """
        
        try:
            response = await self._get_ai_response(analytics_prompt, temperature=0.6)
            return self._parse_json_response(response)
        except Exception as e:
            return {
                "message": f"I'm building an advanced analytics framework for: {context}. We'll track specific metrics that drive business growth, not vanity metrics.",
                "action_taken": "performance_measurement_architecture",
                "deliverables": {
                    "kpi_framework": "Primary metrics with specific targets and industry benchmarks",
                    "attribution_modeling": "Advanced attribution system for accurate ROI measurement",
                    "conversion_optimization": "Data-driven opportunities to improve performance by 20-40%",
                    "predictive_analytics": "Machine learning framework for scaling predictions",
                    "real_time_dashboard": "Live performance monitoring with actionable insights"
                },
                "insights": ["Focus on metrics that directly correlate with revenue growth", "Attribution models must account for multi-touch customer journeys"],
                "questions_for_team": ["What's our customer acquisition cost threshold?", "Which conversion metrics drive highest LTV?"]
            }

class ContentStrategist(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Jake Thompson",
            role="Content Strategist",
            expertise="Content planning, editorial strategy, SEO optimization, content distribution",
            personality="Strategic storyteller, organized, audience-focused, content quality obsessed"
        )

class CustomerInsights(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Amy Wong",
            role="Customer Insights Specialist",
            expertise="User personas, customer journey mapping, behavioral analysis, user experience research",
            personality="Empathetic, user-centric, research-focused, great at understanding customer needs"
        )

class ImplementationSpecialist(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Jordan Rivera",
            role="Implementation Specialist",
            expertise="Campaign execution, project management, timeline creation, budget allocation, content calendar development, KPI tracking, vendor coordination",
            personality="Results-driven execution expert who transforms strategic discussions into detailed, actionable implementation plans with specific timelines, budgets, and concrete deliverables"
        )
    
    async def initiate_conversation(self, context: str, conversation_history: List[Dict]) -> Dict[str, Any]:
        """Create concrete implementation deliverables based on strategic discussions"""
        implementation_prompt = f"""
        You are {self.name}, the Implementation Specialist who turns strategies into executed results.

        Project: {context}
        
        Previous strategic discussions:
        {self._format_previous_messages(conversation_history)}
        
        Create a DETAILED, WEEK-BY-WEEK execution plan with:
        - Specific timeline with actual dates (start next Monday)
        - Exact budget allocations with line-item costs
        - Detailed task assignments with owners
        - Risk mitigation with backup plans
        - Success metrics with measurement intervals
        
        Be EXTREMELY specific - this plan should be executable immediately.
        
        Respond in JSON format:
        {{
            "message": "Here's the week-by-week execution roadmap with specific tasks and owners...",
            "action_taken": "detailed_execution_planning",
            "deliverables": {{
                "phase_1_foundation": {{
                    "weeks": "Week 1-2",
                    "budget": "Exact dollar amounts for setup",
                    "tasks": ["Specific task 1 with owner", "Specific task 2 with deadline", "Specific task 3 with deliverable"],
                    "success_criteria": "Measurable completion metrics"
                }},
                "phase_2_launch": {{
                    "weeks": "Week 3-6", 
                    "budget": "Specific spending allocation",
                    "tasks": ["Launch task 1", "Launch task 2", "Launch task 3"],
                    "success_criteria": "Launch performance benchmarks"
                }},
                "phase_3_optimization": {{
                    "weeks": "Week 7-12",
                    "budget": "Optimization budget allocation", 
                    "tasks": ["Optimization task 1", "Optimization task 2", "Optimization task 3"],
                    "success_criteria": "Performance improvement targets"
                }},
                "resource_requirements": "Exact team requirements and external vendors needed",
                "risk_mitigation": "Specific backup plans for potential issues"
            }},
            "insights": ["Implementation insight with execution timeline", "Resource insight with specific requirements"],
            "questions_for_team": ["Who owns each implementation phase?", "What's our go-live date for phase 1?"]
        }}
        """
        
        try:
            response = await self._get_ai_response(implementation_prompt, temperature=0.6)
            return self._parse_json_response(response)
        except Exception as e:
            return {
                "message": f"I'm creating a detailed implementation plan for: {context}",
                "action_taken": "implementation_planning", 
                "deliverables": {
                    "timeline": "12-week implementation roadmap",
                    "budget": "Cost breakdown by channel and activity",
                    "content_plan": "Detailed content calendar with specific deliverables",
                    "kpis": "Measurable success metrics with target numbers",
                    "checklist": "Step-by-step implementation guide"
                },
                "insights": ["Focus on concrete deliverables over high-level strategy"],
                "questions_for_team": ["What's our budget range?", "What's our timeline?"]
            }


class Investor(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Robert Chen",
            role="Angel Investor",
            expertise="Investment analysis, funding strategies, business valuation, ROI assessment, market opportunity evaluation",
            personality="Strategic, financially-focused, risk-aware, results-driven, always evaluating investment potential and scalability"
        )
    
    async def initiate_conversation(self, context: str, conversation_history: List[Dict]) -> Dict[str, Any]:
        """Provide investment perspective and funding analysis"""
        investment_prompt = f"""
        You are {self.name}, a {self.role}. Your job is to evaluate the business opportunity from an investment perspective.

        Business/Project: {context}
        
        Previous strategic discussions:
        {self._format_previous_messages(conversation_history)}
        
        Analyze this from an investor's viewpoint. Consider:
        - Market size and opportunity
        - Potential investment amounts you'd consider
        - Expected ROI and timeline
        - Risk factors and mitigation strategies
        - Funding stages (seed, Series A, etc.)
        - Valuation considerations
        
        Respond in JSON format:
        {{
            "message": "Here's my investment analysis and funding perspective...",
            "action_taken": "investment_analysis",
            "deliverables": {{
                "investment_range": "Potential investment amounts I'd consider (e.g., $50K - $500K seed round)",
                "valuation_assessment": "Business valuation range based on market opportunity",
                "funding_stages": "Recommended funding progression (seed, Series A, B, etc.)",
                "roi_expectations": "Expected return timeline and multiples",
                "investment_terms": "Key terms and conditions I'd require"
            }},
            "insights": ["Market opportunity assessment", "Investment readiness evaluation"],
            "questions_for_team": ["What's the revenue model?", "What's the go-to-market timeline?", "What are the key growth metrics?"]
        }}
        """
        
        try:
            response = await self._get_ai_response(investment_prompt, temperature=0.6)
            return self._parse_json_response(response)
        except Exception as e:
            return {
                "message": f"As an investor, I'm evaluating the funding potential for: {context}",
                "action_taken": "investment_evaluation", 
                "deliverables": {
                    "investment_range": "$100K - $2M depending on stage and traction",
                    "valuation_range": "Based on revenue multiples and market comparables",
                    "funding_strategy": "Multi-stage approach starting with seed funding",
                    "roi_timeline": "3-7 year exit strategy with 10x+ return target",
                    "due_diligence": "Financial model, market validation, team assessment"
                },
                "insights": ["Focus on scalable revenue model", "Market size is critical for investment decision"],
                "questions_for_team": ["What's the total addressable market?", "What's the customer acquisition cost?"]
            }


# Agent factory
AVAILABLE_AGENTS = {
    "market_researcher": MarketResearcher,
    "brand_strategist": BrandStrategist,
    "creative_director": CreativeDirector,
    "media_planner": MediaPlanner,
    "data_analyst": DataAnalyst,
    "content_strategist": ContentStrategist,
    "customer_insights": CustomerInsights,
    "implementation_specialist": ImplementationSpecialist,
    "investor": Investor
}

def create_agent(agent_type: str) -> BaseAgent:
    """Create an agent instance"""
    if agent_type in AVAILABLE_AGENTS:
        return AVAILABLE_AGENTS[agent_type]()
    else:
        raise ValueError(f"Unknown agent type: {agent_type}")