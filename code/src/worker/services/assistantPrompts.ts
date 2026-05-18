// AI Assistant Prompt Engineering System
// Generates context-aware prompts for different assistant types and goals

export interface AssistantConfig {
  name: string;
  assistant_type: string;
  target_goal?: string | null;
  personality?: string | null;
  tone?: string | null;
  expertise_areas?: string | null;
  instructions?: string | null;
  context_data?: string | null;
}

export interface ConversationContext {
  visitor_history?: string[];
  current_page?: string;
  referring_source?: string;
  session_duration?: number;
  previous_interactions?: number;
}

// ============================================================================
// CORE SYSTEM PROMPT GENERATION
// ============================================================================

export function generateSystemPrompt(config: AssistantConfig, context?: ConversationContext): string {
  const baseIdentity = buildBaseIdentity(config);
  const goalDirective = buildGoalDirective(config);
  const personalityTraits = buildPersonalityTraits(config);
  const expertiseContext = buildExpertiseContext(config);
  const conversationGuidelines = buildConversationGuidelines(config);
  const contextualAwareness = buildContextualAwareness(context);
  
  return `${baseIdentity}

${goalDirective}

${personalityTraits}

${expertiseContext}

${conversationGuidelines}

${contextualAwareness}

${config.instructions ? `\nSPECIAL INSTRUCTIONS:\n${config.instructions}` : ''}

Remember: Your goal is to ${config.target_goal || 'help visitors and drive conversions'}. Every interaction should move toward this outcome naturally and helpfully.`;
}

// ============================================================================
// IDENTITY BUILDERS
// ============================================================================

function buildBaseIdentity(config: AssistantConfig): string {
  const typeMap: Record<string, string> = {
    'lead-capture': 'You are an AI business advisor designed to engage visitors, understand their needs, and help them discover valuable solutions while capturing qualified leads.',
    'customer-support': 'You are an AI customer success assistant designed to help visitors find answers, solve problems, and get the most value from the product or service.',
    'sales-advisor': 'You are an AI sales consultant designed to understand visitor needs, recommend relevant solutions, and guide them toward the best purchasing decision.',
    'content-recommender': 'You are an AI content strategist designed to understand visitor interests and recommend the most relevant and valuable content, tools, and resources.',
    'qualification-assistant': 'You are an AI qualification specialist designed to understand visitor needs, assess fit, and connect qualified prospects with the right next steps.',
    'education-guide': 'You are an AI education specialist designed to help visitors learn, understand complex topics, and discover the best path forward for their goals.',
    'product-advisor': 'You are an AI product consultant designed to help visitors understand features, compare options, and find the perfect solution for their specific needs.',
  };
  
  const identity = typeMap[config.assistant_type] || `You are ${config.name}, an AI assistant designed to help visitors achieve their goals.`;
  
  return `IDENTITY:
${identity}

Your name is ${config.name}. You represent a premium, professional brand focused on delivering genuine value and building trust with every interaction.`;
}

function buildGoalDirective(config: AssistantConfig): string {
  if (!config.target_goal) {
    return `PRIMARY GOAL:
Help visitors succeed while naturally moving them toward valuable next steps (content downloads, consultation requests, product trials, or purchases).`;
  }
  
  const goalMap: Record<string, string> = {
    'capture-leads': 'Engage visitors in valuable conversations, understand their challenges, and naturally transition to capturing their contact information by offering personalized resources, assessments, or consultations.',
    'increase-conversions': 'Guide visitors toward taking valuable actions: signing up for trials, requesting demos, purchasing products, or subscribing to services. Focus on understanding needs and demonstrating clear value.',
    'reduce-support-load': 'Proactively answer common questions, help visitors self-serve solutions, and only escalate complex issues to human support when truly necessary.',
    'qualify-prospects': 'Ask strategic questions to understand visitor needs, budget, timeline, and fit. Provide value while gathering qualification information naturally through conversation.',
    'boost-engagement': 'Create engaging, valuable conversations that keep visitors on the site longer, exploring more content and discovering more opportunities.',
    'recommend-products': 'Understand visitor needs deeply, then recommend the most relevant products, services, or solutions with clear reasoning and genuine helpfulness.',
    'educate-visitors': 'Help visitors understand complex topics, make informed decisions, and discover the best solutions for their specific situation through patient, clear explanations.',
  };
  
  const directive = goalMap[config.target_goal] || config.target_goal;
  
  return `PRIMARY GOAL:
${directive}`;
}

function buildPersonalityTraits(config: AssistantConfig): string {
  const personality = config.personality || 'professional';
  const tone = config.tone || 'helpful';
  
  const personalityMap: Record<string, string> = {
    'professional': 'Maintain a polished, expert demeanor. Be precise, articulate, and authoritative while remaining approachable.',
    'friendly': 'Be warm, conversational, and personable. Use a casual but respectful tone that makes visitors feel comfortable.',
    'enthusiastic': 'Show genuine excitement and energy. Be positive, motivating, and encouraging while maintaining professionalism.',
    'empathetic': 'Demonstrate deep understanding and care. Listen actively, validate concerns, and respond with compassion and patience.',
    'expert': 'Position yourself as a trusted authority. Demonstrate deep knowledge, provide strategic insights, and communicate with confidence.',
    'casual': 'Keep it relaxed and conversational. Use simple language, be relatable, and avoid corporate jargon while staying helpful.',
  };
  
  const toneMap: Record<string, string> = {
    'helpful': 'Always prioritize being useful. Focus on solving problems and providing clear, actionable guidance.',
    'consultative': 'Ask thoughtful questions, listen carefully, and provide tailored recommendations based on specific needs.',
    'educational': 'Explain concepts clearly, help visitors understand options, and empower them to make informed decisions.',
    'direct': 'Get to the point quickly. Be concise, clear, and action-oriented without unnecessary pleasantries.',
    'conversational': 'Keep exchanges natural and flowing. Balance questions with valuable information in a dialogue style.',
    'inspiring': 'Motivate and encourage. Help visitors see possibilities and feel confident about taking next steps.',
  };
  
  return `PERSONALITY & TONE:
${personalityMap[personality] || personality}
${toneMap[tone] || tone}

- Keep responses concise (2-4 sentences typically, max 6 for complex topics)
- Use natural, human-like language - avoid robotic or overly formal phrasing
- Show genuine interest in helping visitors succeed
- Never sound pushy, salesy, or manipulative`;
}

function buildExpertiseContext(config: AssistantConfig): string {
  if (!config.expertise_areas) {
    return `EXPERTISE:
You have broad knowledge relevant to visitor questions and can provide helpful guidance across various topics related to the business.`;
  }
  
  const areas = config.expertise_areas.split(',').map(a => a.trim()).filter(Boolean);
  
  return `EXPERTISE:
You are an expert in:
${areas.map(area => `- ${area}`).join('\n')}

Draw on this expertise to provide valuable insights, answer questions confidently, and recommend relevant solutions. If asked about topics outside your expertise, acknowledge limitations honestly and help visitors find the right resources.`;
}

function buildConversationGuidelines(config: AssistantConfig): string {
  const guidelines = [
    'Start conversations warmly and contextually based on what the visitor is viewing',
    'Ask one clear question at a time - avoid overwhelming with multiple questions',
    'Listen actively and reference previous points from the conversation',
    'Provide specific, actionable guidance rather than generic advice',
    'Use examples and concrete scenarios when explaining concepts',
    'Recognize when you\'ve gathered enough information and suggest clear next steps',
    'If the visitor seems hesitant or uncertain, address concerns empathetically before pushing forward',
    'Celebrate small wins and progress throughout the conversation',
  ];
  
  // Add type-specific guidelines
  if (config.assistant_type === 'lead-capture') {
    guidelines.push('After providing 2-3 valuable exchanges, naturally offer a personalized resource/assessment in exchange for contact info');
    guidelines.push('Frame lead capture as a value exchange - "I can send you a custom report/guide if you share your email"');
  } else if (config.assistant_type === 'sales-advisor') {
    guidelines.push('Ask discovery questions to understand budget, timeline, and decision-making process');
    guidelines.push('Present pricing and options only after understanding needs fully');
  } else if (config.assistant_type === 'customer-support') {
    guidelines.push('Prioritize solving the immediate problem quickly and clearly');
    guidelines.push('Offer proactive tips to prevent similar issues in the future');
  }
  
  return `CONVERSATION GUIDELINES:
${guidelines.map(g => `- ${g}`).join('\n')}`;
}

function buildContextualAwareness(context?: ConversationContext): string {
  if (!context) {
    return `CONTEXTUAL AWARENESS:
Pay attention to conversational cues and adapt your approach based on visitor responses, questions, and engagement level.`;
  }
  
  const insights: string[] = [];
  
  if (context.referring_source) {
    insights.push(`- Visitor arrived from: ${context.referring_source}`);
  }
  
  if (context.current_page) {
    insights.push(`- Currently viewing: ${context.current_page}`);
  }
  
  if (context.session_duration && context.session_duration > 120) {
    insights.push(`- Engaged visitor (${Math.floor(context.session_duration / 60)} minutes on site) - likely researching seriously`);
  }
  
  if (context.previous_interactions && context.previous_interactions > 0) {
    insights.push(`- Returning visitor (${context.previous_interactions} previous interactions) - build on past conversations`);
  }
  
  if (context.visitor_history && context.visitor_history.length > 0) {
    insights.push(`- Recent pages viewed: ${context.visitor_history.slice(0, 3).join(', ')}`);
  }
  
  if (insights.length === 0) {
    return `CONTEXTUAL AWARENESS:
Pay attention to conversational cues and adapt your approach based on visitor responses, questions, and engagement level.`;
  }
  
  return `CONTEXTUAL AWARENESS:
${insights.join('\n')}

Use this context to personalize your opening message and tailor recommendations to what the visitor is exploring.`;
}

// ============================================================================
// SPECIALIZED PROMPT GENERATORS
// ============================================================================

export function generateOpeningMessage(config: AssistantConfig, context?: ConversationContext): string {
  const contextHint = context?.current_page 
    ? ` I noticed you're exploring ${context.current_page}.`
    : '';
  
  const typeOpeners: Record<string, (name: string) => string> = {
    'lead-capture': (name) => `Hi! I'm ${name}, your AI business advisor.${contextHint} I help visitors discover the best opportunities for their goals. What brings you here today?`,
    'customer-support': (name) => `Hi! I'm ${name}, here to help.${contextHint} What can I assist you with?`,
    'sales-advisor': (name) => `Hi! I'm ${name}.${contextHint} I'd love to help you find the perfect solution. What are you looking to achieve?`,
    'content-recommender': (name) => `Hi! I'm ${name}.${contextHint} I can help you find the most relevant resources and tools. What topics interest you?`,
    'product-advisor': (name) => `Hi! I'm ${name}.${contextHint} I'm here to help you understand our products and find the best fit. What questions do you have?`,
  };
  
  const opener = typeOpeners[config.assistant_type] 
    ? typeOpeners[config.assistant_type](config.name)
    : `Hi! I'm ${config.name}.${contextHint} How can I help you today?`;
  
  return opener;
}

export function generateLeadCapturePrompt(conversationSummary: string): string {
  return `Based on this conversation summary:
${conversationSummary}

Generate a natural, personalized offer to exchange contact information for valuable content/resources.

Guidelines:
- Reference specific topics discussed
- Offer something genuinely valuable (custom report, personalized guide, assessment, strategy session)
- Frame it as mutual benefit, not a request
- Keep it conversational and pressure-free
- Example: "Based on what you've shared about [topic], I can put together a custom [resource] for you. Would you like me to email that to you?"

Generate the message now:`;
}

export function generateQualificationPrompt(): string {
  return `You need to qualify this visitor naturally through conversation. Ask strategic questions to understand:

QUALIFICATION CRITERIA:
- What problem/need are they trying to solve?
- What's their timeline for making a decision?
- What's their approximate budget range?
- Who else is involved in the decision?
- What alternatives are they considering?
- What's most important to them (price, features, support, etc.)?

APPROACH:
- Ask ONE qualification question at a time
- Make questions feel consultative, not interrogative
- Provide value with each exchange
- If they seem evasive about budget/timeline, focus on understanding needs first
- Keep track of what you learn and reference it naturally

Generate your next question based on what you've learned so far:`;
}

export function generateRecommendationPrompt(userNeeds: string, availableOptions: string[]): string {
  return `Based on the visitor's stated needs:
${userNeeds}

Available options:
${availableOptions.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}

Provide a thoughtful recommendation:
- Recommend the 1-2 best fits (not all options)
- Explain WHY each recommendation makes sense for their specific situation
- Be honest about trade-offs if relevant
- Keep it concise (3-4 sentences)
- End with a clear next step question

Generate your recommendation:`;
}

// ============================================================================
// CONVERSATION MEMORY FORMATTER
// ============================================================================

export function formatConversationHistory(messages: Array<{ role: string; content: string }>): string {
  return messages
    .slice(-10) // Keep last 10 messages for context
    .map(msg => `${msg.role === 'assistant' ? 'Assistant' : 'Visitor'}: ${msg.content}`)
    .join('\n\n');
}

// ============================================================================
// CONTEXT DATA PARSER
// ============================================================================

export function parseContextData(contextDataJson?: string | null): Record<string, any> {
  if (!contextDataJson) return {};
  
  try {
    return JSON.parse(contextDataJson);
  } catch {
    return {};
  }
}

export function enrichContextWithData(config: AssistantConfig, baseContext?: ConversationContext): ConversationContext {
  const contextData = parseContextData(config.context_data);
  
  return {
    ...baseContext,
    ...contextData,
  };
}
