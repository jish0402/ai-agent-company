import asyncio
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime
import random
from agents.marketing_agents import create_agent, BaseAgent

class ConversationManager:
    def __init__(self, selected_agents: List[str], project_context: str, update_callback: Optional[Callable] = None):
        self.agents: List[BaseAgent] = [create_agent(agent_type) for agent_type in selected_agents]
        self.project_context = project_context
        self.conversation_log: List[Dict[str, Any]] = []
        self.thinking_log: List[Dict[str, Any]] = []
        self.deliverables: Dict[str, Any] = {}
        self.conversation_rounds = 0
        self.max_rounds = 3  # Maximum conversation rounds - reduced for focused discussions
        self.discussed_topics = set()  # Track discussed topics to prevent repetition
        self.agent_insights = {}  # Track unique insights per agent to prevent overlap
        self.update_callback = update_callback  # Callback for real-time updates
    
    async def _send_update(self, update_type: str, data: Any):
        """Send real-time update via callback"""
        print(f"ConversationManager sending update: {update_type}")
        if self.update_callback:
            await self.update_callback({
                "type": update_type,
                "data": data,
                "timestamp": datetime.now().isoformat()
            })
        else:
            print("No update callback available")
        
    async def start_collaboration(self) -> Dict[str, Any]:
        """Start the agent collaboration process"""
        
        # Phase 1: Initial thinking phase - all agents think about the problem
        await self._thinking_phase()
        
        # Phase 2: Agent introduces themselves and shares initial thoughts
        await self._introduction_phase()
        
        # Phase 3: Multi-round conversation
        await self._conversation_phase()
        
        # Phase 4: Final deliverables compilation
        await self._finalization_phase()
        
        return {
            "conversation_log": self.conversation_log,
            "thinking_log": self.thinking_log,
            "deliverables": self.deliverables,
            "agents_involved": [{"name": agent.name, "role": agent.role} for agent in self.agents],
            "total_rounds": self.conversation_rounds
        }
    
    async def _thinking_phase(self):
        """All agents think about the problem simultaneously"""
        self._log_system_message("🧠 Phase 1: Agents are analyzing the project...")
        await self._send_update("phase_change", {"phase": "thinking", "message": "Agents are analyzing the project..."})
        
        thinking_tasks = []
        for agent in self.agents:
            thinking_tasks.append(self._agent_think_with_updates(agent))
        
        # Run thinking in parallel
        await asyncio.gather(*thinking_tasks)
    
    async def _agent_think_with_updates(self, agent: BaseAgent):
        """Agent thinking with real-time updates"""
        await self._send_update("agent_thinking", {"agent_name": agent.name, "agent_role": agent.role, "status": "thinking"})
        
        thinking = await agent.think(self.project_context, [])
        
        thinking_entry = {
            "agent_name": agent.name,
            "agent_role": agent.role,
            "timestamp": datetime.now().isoformat(),
            "thinking_process": thinking.get("thinking", ""),
            "insights": thinking.get("key_insights", []),
            "questions": thinking.get("questions_for_other_agents", []),
            "recommendations": thinking.get("recommendations", [])
        }
        
        self.thinking_log.append(thinking_entry)
        await self._send_update("thinking_complete", thinking_entry)
    
    async def _introduction_phase(self):
        """Each agent introduces themselves and shares initial analysis"""
        self._log_system_message("👋 Phase 2: Agents introducing themselves and sharing initial insights...")
        
        for agent in self.agents:
            response = await agent.initiate_conversation(self.project_context, self.conversation_log)
            
            message_data = {
                "agent_name": agent.name,
                "agent_role": agent.role,
                "message_type": "introduction",
                "content": response,
                "timestamp": datetime.now().isoformat(),
                "round": 0
            }
            
            self.conversation_log.append(message_data)
            await self._send_update("agent_message", message_data)
            
            # Add any deliverables with uniqueness check
            if response.get("deliverables"):
                unique_deliverables = self._ensure_unique_deliverables(agent.name, response["deliverables"])
                self.deliverables[agent.name] = unique_deliverables
            
            # Small delay for realism
            await asyncio.sleep(0.5)
    
    async def _conversation_phase(self):
        """Multi-round agent-to-agent conversation"""
        self._log_system_message("💬 Phase 3: Agents collaborating and discussing...")
        
        for round_num in range(self.max_rounds):
            self.conversation_rounds = round_num + 1
            
            # Determine conversation flow
            if round_num < 3:
                # Early rounds: structured responses
                await self._structured_round()
            else:
                # Later rounds: more dynamic conversation
                await self._dynamic_round()
            
            # Check if conversation should continue
            if await self._should_end_conversation():
                break
            
            await asyncio.sleep(0.3)  # Pause between rounds
    
    async def _structured_round(self):
        """Structured conversation round where each agent responds to previous agent"""
        for i, agent in enumerate(self.agents):
            if i == 0 and self.conversation_rounds == 1:
                continue  # First agent already introduced
            
            # Find the previous agent's message to respond to
            previous_messages = [msg for msg in self.conversation_log if msg.get("agent_name") != agent.name]
            if previous_messages:
                last_message = previous_messages[-1]
                # Check for topic repetition before responding
                last_message_content = last_message.get("content", {}).get("message", "")
                if not self._is_repetitive_topic(last_message_content):
                    response = await agent.respond_to_agent(
                        message_from=last_message.get("agent_name", "Unknown"),
                        message_content=last_message_content,
                        context=self.project_context,
                        conversation_history=self.conversation_log,
                        discussed_topics=self.discussed_topics
                    )
                    
                    # Track discussed topic
                    self._track_discussed_topic(response.get("contribution", ""))
                else:
                    continue  # Skip repetitive responses
                
                message_data = {
                    "agent_name": agent.name,
                    "agent_role": agent.role,
                    "message_type": "response",
                    "content": response,
                    "responding_to": last_message.get("agent_name"),
                    "timestamp": datetime.now().isoformat(),
                    "round": self.conversation_rounds
                }
                
                self.conversation_log.append(message_data)
                await self._send_update("agent_message", message_data)
                
                # Update deliverables
                if response.get("data_produced"):
                    if agent.name not in self.deliverables:
                        self.deliverables[agent.name] = {}
                    self.deliverables[agent.name].update(response["data_produced"])
                
                await asyncio.sleep(0.4)
    
    async def _dynamic_round(self):
        """Dynamic conversation with debates, challenges, and idea building"""
        
        # Analyze recent conversation for engagement opportunities
        recent_messages = self.conversation_log[-3:] if len(self.conversation_log) >= 3 else self.conversation_log
        
        # Priority 1: Respond to challenges or disagreements
        for msg in reversed(recent_messages):
            content = msg.get("content", {})
            if content.get("stance") in ["challenge", "disagree", "propose_alternative"] and msg.get("agent_name") != "System":
                challenger = msg.get("agent_name")
                
                # Find agent to respond to the challenge (prefer different expertise)
                responder = self._find_best_responder(challenger, content.get("contribution", ""))
                
                if responder:
                    response = await responder.respond_to_agent(
                        message_from=challenger,
                        message_content=content.get("message", ""),
                        context=self.project_context,
                        conversation_history=self.conversation_log
                    )
                    
                    message_data = {
                        "agent_name": responder.name,
                        "agent_role": responder.role,
                        "message_type": "debate_response",
                        "content": response,
                        "responding_to": challenger,
                        "timestamp": datetime.now().isoformat(),
                        "round": self.conversation_rounds
                    }
                    
                    self.conversation_log.append(message_data)
                    await self._send_update("agent_message", message_data)
                    return
        
        # Priority 2: Answer pending questions
        for msg in reversed(recent_messages):
            content = msg.get("content", {})
            questions = content.get("questions_for_team", [])
            if questions and msg.get("agent_name") != "System":
                questioner = msg.get("agent_name")
                
                # Find best agent to answer based on expertise
                responder = self._find_expert_for_question(questions[0], questioner)
                
                if responder:
                    response = await responder.respond_to_agent(
                        message_from=questioner,
                        message_content=f"You asked: {questions[0]}",
                        context=self.project_context,
                        conversation_history=self.conversation_log
                    )
                    
                    await self._log_agent_message(
                        agent_name=responder.name,
                        agent_role=responder.role,
                        message_type="expert_answer",
                        content=response,
                        responding_to=questioner
                    )
                    return
        
        # Priority 3: Build on ideas or add new perspectives
        if recent_messages:
            last_msg = recent_messages[-1]
            last_speaker = last_msg.get("agent_name")
            
            # Find agent who hasn't spoken recently and has relevant expertise
            responder = self._find_fresh_perspective_agent(last_speaker)
            
            if responder:
                response = await responder.respond_to_agent(
                    message_from=last_speaker,
                    message_content=last_msg.get("content", {}).get("message", ""),
                    context=self.project_context,
                    conversation_history=self.conversation_log
                )
                
                await self._log_agent_message(
                    agent_name=responder.name,
                    agent_role=responder.role,
                    message_type="build_on_idea",
                    content=response,
                    responding_to=last_speaker
                )
        else:
            # Fallback: Random agent provides insight
            agent = random.choice(self.agents)
            response = await agent.initiate_conversation(self.project_context, self.conversation_log)
            
            await self._log_agent_message(
                agent_name=agent.name,
                agent_role=agent.role,
                message_type="new_insight",
                content=response
            )
    
    async def _finalization_phase(self):
        """Final phase where agents summarize and finalize deliverables"""
        self._log_system_message("📋 Phase 4: Finalizing deliverables and summary...")
        
        # Each agent provides final summary
        for agent in self.agents:
            final_prompt = f"""
            Based on our team discussion about: {self.project_context}
            
            Provide your final deliverable and summary. What concrete outputs are you contributing to this project?
            
            Respond in JSON format:
            {{
                "final_deliverable": "Your main contribution to the project",
                "key_outputs": {{"output1": "description", "output2": "description"}},
                "summary": "Brief summary of your contribution",
                "recommendations": ["final recommendation 1", "final recommendation 2"]
            }}
            """
            
            try:
                response = await agent._get_ai_response(final_prompt, temperature=0.6)
                final_data = agent._parse_json_response(response)
                
                await self._log_agent_message(
                    agent_name=agent.name,
                    agent_role=agent.role,
                    message_type="final_deliverable",
                    content=final_data
                )
                
                # Store final deliverables
                if agent.name not in self.deliverables:
                    self.deliverables[agent.name] = {}
                self.deliverables[agent.name]["final"] = final_data
                
            except Exception as e:
                await self._log_agent_message(
                    agent_name=agent.name,
                    agent_role=agent.role,
                    message_type="final_deliverable",
                    content={"summary": f"Finalizing {agent.role} deliverables..."}
                )
    
    async def _should_end_conversation(self) -> bool:
        """Determine if conversation should end"""
        if self.conversation_rounds >= self.max_rounds:
            return True
        
        # End if recent messages are getting repetitive or agents are satisfied
        recent_messages = self.conversation_log[-3:] if len(self.conversation_log) >= 3 else []
        
        if len(recent_messages) >= 2:
            # Simple check for conversation completion signals
            completion_signals = ["finalize", "complete", "ready to", "final", "conclude"]
            recent_text = " ".join([msg.get("content", {}).get("message", "") for msg in recent_messages]).lower()
            
            signal_count = sum(1 for signal in completion_signals if signal in recent_text)
            if signal_count >= 2:
                return True
        
        return False
    
    async def process_user_feedback(self, user_feedback: str, requested_changes: List[str]) -> Dict[str, Any]:
        """Process user feedback and have agents adapt deliverables"""
        
        # Send update about feedback processing
        await self._send_update("user_feedback_processing", {
            "phase": "feedback_iteration", 
            "message": "Agents are reviewing your feedback and adapting the strategy..."
        })
        
        # Log user feedback as a special message
        user_message = {
            "agent_name": "User",
            "agent_role": "Client",
            "message_type": "feedback",
            "content": {
                "message": user_feedback,
                "requested_changes": requested_changes
            },
            "timestamp": datetime.now().isoformat(),
            "round": self.conversation_rounds + 1
        }
        self.conversation_log.append(user_message)
        await self._send_update("user_message", user_message)
        
        # Have agents respond to user feedback (focus on Implementation Specialist + 1-2 others)
        feedback_response_agents = []
        
        # Always include Implementation Specialist if available
        impl_agent = None
        for agent in self.agents:
            if "Implementation" in agent.role:
                impl_agent = agent
                break
        
        if impl_agent:
            feedback_response_agents.append(impl_agent)
        
        # Add 1-2 most relevant agents based on feedback content
        feedback_lower = user_feedback.lower()
        for agent in self.agents:
            if agent != impl_agent and len(feedback_response_agents) < 3:
                # Check if agent expertise matches feedback content
                expertise_match = False
                if any(word in feedback_lower for word in ["budget", "cost", "expensive", "cheap"]) and "media" in agent.role.lower():
                    expertise_match = True
                elif any(word in feedback_lower for word in ["creative", "content", "design", "visual"]) and "creative" in agent.role.lower():
                    expertise_match = True
                elif any(word in feedback_lower for word in ["data", "metrics", "analytics", "performance"]) and "data" in agent.role.lower():
                    expertise_match = True
                elif any(word in feedback_lower for word in ["brand", "message", "positioning"]) and "brand" in agent.role.lower():
                    expertise_match = True
                
                if expertise_match:
                    feedback_response_agents.append(agent)
        
        # If no specific matches, add the first available agent
        if len(feedback_response_agents) < 2:
            for agent in self.agents:
                if agent not in feedback_response_agents:
                    feedback_response_agents.append(agent)
                    break
        
        # Have selected agents respond to feedback
        for agent in feedback_response_agents:
            response = await agent.respond_to_agent(
                message_from="User",
                message_content=f"User feedback: {user_feedback}. Requested changes: {', '.join(requested_changes)}",
                context="Adapt the deliverables based on this user feedback",
                conversation_history=self.conversation_log
            )
            
            message_data = {
                "agent_name": agent.name,
                "agent_role": agent.role,
                "message_type": "feedback_response",
                "content": response,
                "responding_to": "User",
                "timestamp": datetime.now().isoformat(),
                "round": self.conversation_rounds + 1
            }
            
            self.conversation_log.append(message_data)
            await self._send_update("agent_message", message_data)
            
            # Update deliverables with agent's adapted response
            if response.get("data_produced"):
                if agent.name not in self.deliverables:
                    self.deliverables[agent.name] = {}
                self.deliverables[agent.name].update(response["data_produced"])
        
        # Implementation Specialist creates final adapted deliverable
        if impl_agent:
            final_prompt = f"""
            Based on user feedback: "{user_feedback}"
            Requested changes: {requested_changes}
            
            Create an updated, concrete implementation plan that addresses the user's feedback.
            Focus on their specific concerns and requested changes.
            
            Respond in JSON format with updated deliverables:
            {{
                "final_deliverable": "Updated plan based on user feedback",
                "key_outputs": {{"updated_timeline": "Revised timeline", "updated_budget": "Adjusted budget", "updated_content": "Modified content plan"}},
                "summary": "How the plan was adapted based on user input",
                "changes_made": ["change 1", "change 2", "change 3"],
                "user_feedback_addressed": {{
                    "original_feedback": "{user_feedback}",
                    "requested_changes": {requested_changes},
                    "how_addressed": "Detailed explanation of how each piece of feedback was incorporated"
                }}
            }}
            """
            
            try:
                final_response = await impl_agent._get_ai_response(final_prompt, temperature=0.6)
                final_data = impl_agent._parse_json_response(final_response)
                
                # Update final deliverables
                if impl_agent.name not in self.deliverables:
                    self.deliverables[impl_agent.name] = {}
                self.deliverables[impl_agent.name]["feedback_iteration"] = final_data
                
                await self._send_update("deliverables_updated", {
                    "agent_name": impl_agent.name,
                    "updated_deliverables": final_data
                })
                
            except Exception as e:
                print(f"Error creating final adapted deliverable: {e}")
        
        # Store feedback history in deliverables for reference
        if "feedback_history" not in self.deliverables:
            self.deliverables["feedback_history"] = []
        
        self.deliverables["feedback_history"].append({
            "timestamp": datetime.now().isoformat(),
            "user_feedback": user_feedback,
            "requested_changes": requested_changes,
            "agents_responded": [agent.name for agent in feedback_response_agents]
        })
        
        return self.deliverables
    
    async def _log_agent_message(self, agent_name: str, agent_role: str, message_type: str, content: Dict[str, Any], responding_to: str = None):
        """Log an agent message with real-time update"""
        message_data = {
            "agent_name": agent_name,
            "agent_role": agent_role,
            "message_type": message_type,
            "content": content,
            "responding_to": responding_to,
            "timestamp": datetime.now().isoformat(),
            "round": self.conversation_rounds
        }
        
        self.conversation_log.append(message_data)
        await self._send_update("agent_message", message_data)
    
    def _find_best_responder(self, challenger: str, contribution: str) -> Optional[BaseAgent]:
        """Find the best agent to respond to a challenge based on expertise overlap"""
        available_agents = [agent for agent in self.agents if agent.name != challenger]
        
        # Look for expertise matches in the contribution
        contribution_lower = contribution.lower()
        
        # Priority mapping based on common discussion topics
        expertise_keywords = {
            "market": ["MarketResearcher", "CustomerInsights"],
            "brand": ["BrandStrategist", "CreativeDirector"],
            "creative": ["CreativeDirector", "ContentStrategist"],
            "media": ["MediaPlanner", "DataAnalyst"],
            "data": ["DataAnalyst", "MarketResearcher"],
            "content": ["ContentStrategist", "BrandStrategist"],
            "customer": ["CustomerInsights", "MarketResearcher"]
        }
        
        for keyword, preferred_roles in expertise_keywords.items():
            if keyword in contribution_lower:
                for agent in available_agents:
                    if any(role in agent.__class__.__name__ for role in preferred_roles):
                        return agent
        
        # Fallback to random available agent
        return random.choice(available_agents) if available_agents else None
    
    def _find_expert_for_question(self, question: str, questioner: str) -> Optional[BaseAgent]:
        """Find the most relevant expert to answer a specific question"""
        available_agents = [agent for agent in self.agents if agent.name != questioner]
        question_lower = question.lower()
        
        # Map question keywords to agent types
        question_expertise = {
            "market": "MarketResearcher",
            "audience": "CustomerInsights",
            "competitor": "MarketResearcher",
            "brand": "BrandStrategist",
            "creative": "CreativeDirector",
            "design": "CreativeDirector",
            "media": "MediaPlanner",
            "budget": "MediaPlanner",
            "data": "DataAnalyst",
            "analytics": "DataAnalyst",
            "content": "ContentStrategist",
            "customer": "CustomerInsights",
            "user": "CustomerInsights"
        }
        
        for keyword, expert_type in question_expertise.items():
            if keyword in question_lower:
                for agent in available_agents:
                    if expert_type in agent.__class__.__name__:
                        return agent
        
        return random.choice(available_agents) if available_agents else None
    
    def _find_fresh_perspective_agent(self, last_speaker: str) -> Optional[BaseAgent]:
        """Find an agent who hasn't spoken recently to add fresh perspective"""
        # Get agents who spoke in last 3 messages
        recent_speakers = set()
        for msg in self.conversation_log[-3:]:
            if msg.get("agent_name") != "System":
                recent_speakers.add(msg.get("agent_name"))
        
        # Find agents who haven't spoken recently
        fresh_agents = [agent for agent in self.agents if agent.name not in recent_speakers]
        
        if fresh_agents:
            return random.choice(fresh_agents)
        
        # If all agents spoke recently, choose anyone except last speaker
        available_agents = [agent for agent in self.agents if agent.name != last_speaker]
        return random.choice(available_agents) if available_agents else None
    
    def _is_repetitive_topic(self, message_content: str) -> bool:
        """Check if a topic has already been extensively discussed"""
        message_lower = message_content.lower()
        
        # Key phrases that indicate repetitive content
        repetitive_indicators = [
            "budget", "timeline", "strategy", "approach", "plan", 
            "recommend", "suggest", "important", "key", "focus"
        ]
        
        # Count how many times core topics have been mentioned
        topic_mentions = 0
        for indicator in repetitive_indicators:
            if indicator in message_lower:
                if indicator in self.discussed_topics:
                    topic_mentions += 1
        
        # If more than 2 already-discussed topics are mentioned, it's likely repetitive
        return topic_mentions > 2
    
    def _track_discussed_topic(self, contribution: str):
        """Track topics that have been discussed to prevent repetition"""
        if not contribution:
            return
            
        contribution_lower = contribution.lower()
        
        # Extract key topics from contributions
        key_topics = [
            "budget", "timeline", "creative", "data", "media", "content", 
            "brand", "market", "customer", "implementation", "roi", "kpi"
        ]
        
        for topic in key_topics:
            if topic in contribution_lower:
                self.discussed_topics.add(topic)

    def _ensure_unique_deliverables(self, agent_name: str, deliverables: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure each agent provides unique deliverables without overlap"""
        
        # Track this agent's unique contribution areas
        if agent_name not in self.agent_insights:
            self.agent_insights[agent_name] = set()
        
        # Define unique responsibility areas for each agent type
        agent_unique_areas = {
            "Market Researcher": ["competitive_analysis", "market_insights", "competitor_threats", "market_positioning_opportunity"],
            "Brand Strategist": ["brand_positioning", "messaging_framework", "brand_story", "brand_equity_goals"],
            "Creative Director": ["creative_concepts", "creative_system", "virality_factors", "emotional_storytelling"],
            "Media Planner": ["media_strategy", "channel_optimization", "budget_allocation", "reach_frequency"],
            "Data Analyst": ["kpi_framework", "attribution_modeling", "conversion_optimization", "predictive_analytics"],
            "Content Strategist": ["content_strategy", "editorial_strategy", "seo_optimization", "content_distribution"],
            "Customer Insights": ["user_personas", "customer_journey", "behavioral_analysis", "user_experience"],
            "Implementation Specialist": ["execution_plan", "resource_requirements", "risk_mitigation", "phase_timeline"],
            "Angel Investor": ["investment_analysis", "funding_strategy", "valuation_assessment", "roi_expectations"]
        }
        
        # Filter deliverables to agent's unique areas
        unique_deliverables = {}
        agent_role_key = None
        
        # Find the agent's role
        for role_key in agent_unique_areas.keys():
            if role_key in agent_name or any(role_part in agent_name for role_part in role_key.split()):
                agent_role_key = role_key
                break
        
        if agent_role_key and agent_role_key in agent_unique_areas:
            allowed_areas = agent_unique_areas[agent_role_key]
            
            # Only include deliverables in this agent's unique area
            for key, value in deliverables.items():
                if any(area in key.lower() for area in [area.lower() for area in allowed_areas]):
                    unique_deliverables[key] = value
                    self.agent_insights[agent_name].add(key.lower())
        else:
            # Fallback - use all deliverables if role not found
            unique_deliverables = deliverables
        
        # Ensure we have at least some deliverables
        if not unique_deliverables and deliverables:
            # Take the first deliverable as a minimum
            first_key = list(deliverables.keys())[0]
            unique_deliverables[first_key] = deliverables[first_key]
        
        return unique_deliverables

    def _log_system_message(self, message: str):
        """Log a system message"""
        self.conversation_log.append({
            "agent_name": "System",
            "agent_role": "Orchestrator",
            "message_type": "system",
            "content": {"message": message},
            "timestamp": datetime.now().isoformat(),
            "round": self.conversation_rounds
        })