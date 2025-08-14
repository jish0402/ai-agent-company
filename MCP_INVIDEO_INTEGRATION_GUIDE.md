# MCP InVideo Integration Guide for AI Agent Company

## Overview
The AI Agent Company now integrates with MCP InVideo to generate professional marketing videos from the AI-generated strategies. This replaces the previous Remotion-based system with a professional video service.

## How It Works

### 1. **Automatic Script Generation**
- When users click "Generate Video", the system automatically:
  - Extracts key insights from all agent deliverables
  - Identifies budget and timeline information
  - Creates a compelling 30-second professional marketing script
  - Formats the content for video production

### 2. **MCP InVideo Integration**
The system now calls the MCP InVideo tool with these parameters:

```javascript
{
    "script": "Generated marketing script from AI agents",
    "topic": "User's project goal",
    "vibe": "professional", // Can be: professional, creative, analytical
    "targetAudience": "business professionals and marketing decision makers",
    "platform": "youtube" // Can be: youtube, instagram, tiktok
}
```

### 3. **Video Generation Process**
```
1. User clicks "Generate Video" 
   ↓
2. System extracts strategy data from AI agents
   ↓
3. OpenAI generates professional video script
   ↓
4. MCP InVideo tool creates professional video
   ↓
5. Video URL returned and made available for download
   ↓
6. User receives professional MP4 marketing video
```

## Example Usage in Claude Code

When running the AI Agent Company in Claude Code with MCP InVideo available:

```python
# This is automatically called by the backend when user requests video generation:

video_url = mcp__invideo__generate_video_from_script(
    script="Discover the power of AI-driven marketing strategy! Our expert team has developed a comprehensive business solution with strategic insights, budget optimization, and clear implementation timeline. Ready to transform your marketing with data-driven excellence.",
    topic="AI-Powered Marketing Strategy Development", 
    vibe="professional",
    targetAudience="business professionals and marketing decision makers",
    platform="youtube"
)
```

## Features Enhanced

### ✅ **Professional Video Generation**
- Replaces React component rendering with actual professional video service
- Generates high-quality MP4 videos suitable for social media
- Scripts are dynamically created from actual agent strategy content

### ✅ **Platform Optimization**
- YouTube: 1920x1080, optimized for professional sharing
- Instagram: Square format for social media
- TikTok: Vertical format for short-form content

### ✅ **Dynamic Content Integration**
- Budget information from Implementation Specialist
- Timeline data from project management
- Key insights from all participating agents
- Competitive intelligence from Market Researcher

### ✅ **Audience Targeting**
Smart audience detection based on project goals:
- **Startup projects** → "entrepreneurs and startup founders"
- **E-commerce projects** → "online retailers and business owners" 
- **SaaS projects** → "software companies and tech professionals"
- **General projects** → "business professionals and marketing decision makers"

## File Structure Changes

### New Files:
- `backend/mcp_video_integration.py` - MCP integration utilities
- `backend/main.py` - Updated with MCP InVideo endpoints

### Modified Files:
- Video generation now uses `mcp__invideo__generate_video_from_script`
- Professional script generation with OpenAI
- Enhanced video download system with proper caching prevention

## API Endpoints

### `/generate-video/{project_id}` (POST)
- Generates professional marketing video using MCP InVideo
- Returns WebSocket updates during generation
- Creates downloadable MP4 file

### `/process-mcp-video/{project_id}` (POST) 
- Processes MCP InVideo generation requests
- Returns structured data for MCP tool integration

### `/complete-mcp-video/{project_id}` (POST)
- Completes video generation with returned video URL
- Downloads and stores final video locally

## Testing the Integration

1. **Start the application**: Run `python backend/main.py`
2. **Create a marketing strategy** with AI agents
3. **Click "Generate Video"** button
4. **System will**:
   - Generate professional script from strategy
   - Call MCP InVideo tool (if available in Claude Code)
   - Return professional marketing video URL
   - Enable download of MP4 file

## Professional Video Output

The generated videos include:
- **Opening hook** about the marketing project
- **Key strategic insights** from AI team collaboration  
- **Budget and timeline** information presented professionally
- **Call-to-action** for business transformation
- **Professional branding** and visual presentation

## Benefits Over Previous System

| Feature | Old System (Remotion) | New System (MCP InVideo) |
|---------|----------------------|--------------------------|
| Video Quality | React component render | Professional video service |
| Content | Static template | Dynamic strategy content |
| Platforms | Single format | Multi-platform optimization |
| Professional Appeal | Basic | Broadcast quality |
| Customization | Limited | Full script customization |

---

**This integration transforms the AI Agent Company from a strategy generator into a complete marketing solution that produces professional video content ready for immediate business use.**