# Marketing Agents Documentation

This document provides detailed information about the marketing agents available in the system, their capabilities, required inputs, and expected outputs.

## Overview

The marketing workflow system includes five specialized agents designed to handle different aspects of marketing analysis and content generation:

1. **Competitor Watchdog** - Analyzes competitors and market positioning
2. **Product Recommender** - Suggests product strategies and improvements
3. **Trend Analyst** - Identifies market trends and opportunities
4. **Content Creator** - Generates marketing content strategies
5. **Sales Strategist** - Develops sales enablement plans and strategies

Each agent can be used individually or combined in a workflow to create a comprehensive marketing strategy.

## Agent Details

### Competitor Watchdog

**Agent ID:** `competitor_analysis`

**Description:**  
The Competitor Watchdog agent analyzes your competitors to identify strengths, weaknesses, market positioning, and opportunities for differentiation.

**Input Parameters:**
- **Market Type** (required) - The type of market for analysis (e.g., B2B SaaS, Retail, Healthcare)
- **Brand Tone** (required) - The tone of voice for your brand (professional, casual, technical, friendly, authoritative)
- **Competitors** (required) - List of major competitors to analyze
- **Competitor Strengths** (optional) - Areas of strength to analyze for each competitor (pricing, features, market share, brand reputation, customer service)

**Output:**
Generates a comprehensive competitor analysis report that includes:
- Market overview
- Key competitor analysis
- Competitive positioning analysis
- Recommended focus areas for differentiation

**Example Use Case:**
A SaaS company entering a new market segment wants to understand the competitive landscape to position their product effectively against established players.

### Product Recommender

**Agent ID:** `product_recommendations`

**Description:**
The Product Recommender agent analyzes your current products and market segments to provide strategic recommendations for product development, enhancements, and market positioning.

**Input Parameters:**
- **Market Type** (required) - The type of market for analysis (e.g., B2B SaaS, Retail, Healthcare)
- **Brand Tone** (required) - The tone of voice for your brand (professional, casual, technical, friendly, authoritative)
- **Products** (required) - List of your current products to analyze
- **Target Market Segments** (required) - Market segments you want to target

**Output:**
Generates a product recommendations report that includes:
- Strategic product opportunities
- Short-term and medium-term recommendations
- Feature enhancement suggestions
- Pricing strategy recommendations
- Expected outcomes

**Example Use Case:**
A product manager seeking to identify new features or product extensions to increase market share or address specific customer segment needs.

### Trend Analyst

**Agent ID:** `trend_identification`

**Description:**
The Trend Analyst agent identifies emerging market trends, shifts in customer behavior, and industry developments that could impact your business or create new opportunities.

**Input Parameters:**
- **Market Type** (required) - The type of market for analysis (e.g., B2B SaaS, Retail, Healthcare)
- **Brand Tone** (required) - The tone of voice for your brand (professional, casual, technical, friendly, authoritative)
- **Industry Focus** (required) - Specific industry to analyze (e.g., Technology, Healthcare, Finance)
- **Time Horizon** (required) - Time frame for trend analysis (short-term, medium-term, long-term)

**Output:**
Generates a market trend analysis report that includes:
- Emerging market trends
- Technology trends affecting the industry
- Business model shifts
- Consumer behavior changes
- Strategic implications for your business

**Example Use Case:**
A business strategy team conducting annual planning needs to understand emerging trends that could impact their product roadmap or go-to-market strategy.

### Content Creator

**Agent ID:** `content_creation`

**Description:**
The Content Creator agent develops content strategies and frameworks to effectively reach your target audience with messaging that aligns with your brand and business objectives.

**Input Parameters:**
- **Market Type** (required) - The type of market for analysis (e.g., B2B SaaS, Retail, Healthcare)
- **Brand Tone** (required) - The tone of voice for your brand (professional, casual, technical, friendly, authoritative)
- **Target Audience** (required) - Primary audience for your content (e.g., Tech decision-makers, HR professionals)
- **Content Type** (required) - Type of content to generate strategies for (blog post, social media, email campaign, white paper, case study)
- **Key Message** (required) - Core message you want to convey through your content

**Output:**
Generates a content creation strategy that includes:
- Content framework with thematic pillars
- Content calendar suggestions
- Distribution channel recommendations
- Success metrics for measuring content effectiveness

**Example Use Case:**
A marketing team needs to develop a comprehensive content strategy for a product launch that will engage prospects at different stages of the buyer's journey.

### Sales Strategist

**Agent ID:** `sales_enablement`

**Description:**
The Sales Strategist agent creates sales enablement plans to optimize your sales process, improve conversion rates, and provide tools to help your sales team succeed.

**Input Parameters:**
- **Market Type** (required) - The type of market for analysis (e.g., B2B SaaS, Retail, Healthcare)
- **Brand Tone** (required) - The tone of voice for your brand (professional, casual, technical, friendly, authoritative)
- **Marketing Channels** (required) - Marketing channels you utilize (email, social media, search ads, content marketing, events)
- **Pricing Strategy** (required) - Your current pricing approach (premium, competitive, freemium, subscription, value-based)
- **Sales Cycle Length** (optional) - Typical length of your sales cycle (short, medium, long)

**Output:**
Generates a sales enablement plan that includes:
- Sales approach framework
- Customer segmentation recommendations
- Sales tools and resources
- Implementation timeline
- Expected performance improvements

**Example Use Case:**
A sales director wants to improve team performance by providing better tools, processes, and alignment with marketing to increase close rates.

## Using Multiple Agents in a Workflow

For a comprehensive marketing strategy, you can configure a workflow that chains multiple agents together. For example:

1. Start with the **Trend Analyst** to identify market opportunities
2. Use the **Competitor Watchdog** to analyze how competitors are addressing these trends
3. Add the **Product Recommender** to identify product improvements based on trends and competition
4. Follow with the **Content Creator** to develop messaging that highlights your product advantages
5. Finish with the **Sales Strategist** to equip your sales team with effective tools and approaches

This comprehensive approach ensures all aspects of your marketing strategy are aligned and informed by market intelligence.

## Viewing Agent Results

Each agent generates a markdown (.md) file in the `marketing_ai/marketing_ai/output` directory. The filenames correspond to the agent IDs:
- `competitor_analysis.md`
- `product_recommendations.md`
- `trend_identification.md`
- `content_creation.md`
- `sales_enablement.md`

These files are automatically displayed in the Workflow Results section of the application interface.

## Best Practices

1. **Provide Detailed Inputs** - The quality of agent outputs depends on the specificity and quality of your inputs
2. **Use Consistent Brand Tone** - Maintain a consistent brand voice across all agents for cohesive messaging
3. **Configure Logical Workflows** - Order your agents in a logical sequence that builds on previous insights
4. **Review and Refine** - Use agent outputs as a starting point and refine based on your specific market knowledge
5. **Update Regularly** - Rerun analyses periodically to capture changing market conditions and trends 