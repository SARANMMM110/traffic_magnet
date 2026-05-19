# Todo

## Audience Engine - Production Infrastructure (ACTIVE BUILD)
- #121: DONE - Universal asset publishing system (published_assets, public routes, slug system)
- #122: DONE - Deployment pipeline (CREATE → GENERATE → DEPLOY → ACTIVATE workflow)
- #123: DONE - Runtime audience engine (audienceRuntime.ts, widget injection, trigger detection)
- #124: DONE - Flow execution system (timed/scroll/exit triggers that actually work)
- #125: DONE - Widget.js public runtime (auto-init, overlay rendering, OAuth, session management)
- #126: DONE - Centralized subscriber system (identity merging, engagement scoring, unified profiles)
- #127: DONE - Visitor journey tracking (page_view → interaction → gate → unlock → analytics)
- #128: AI assistant integration (gate after interaction, unlock triggers, conversation context)
- #129: WordPress deployment integration (auto script injection, shortcode support)
- #130: DONE - Hierarchical analytics engine (workspace/project/asset/flow/subscriber levels)
- #131: Live event system (real-time updates, websocket/polling, dashboard refresh)
- #132: DOING - Flow deployment UX (public URL, embed code, WordPress snippet, status display)
- #133: DONE - Security hardening (rate limiting, bot detection, JWT sessions, CSRF protection)
- #134: DONE - Flow management system (create/edit/duplicate/archive/pause/test flows)
- #135: DONE - Universal asset discovery (auto-detect tools/landing/wrappers/assistants)
- #136: Testing system (live preview, mobile preview, unlock simulation, OAuth test)

## AI Assistant Evolution - Operating System Integration
- #93: DONE - Platform awareness context (projects, tools, WordPress, deployments, flows)
- #94: DONE - Intent detection engine (6 intent types with workflow recommendations)
- #95: DONE - Context memory system (niche, tone, design preferences, goals)
- #96: DONE - Response layering structure (concise → actions → focused question)
- #97: Build workflow action execution system (trigger landing page generation, blueprint creation, etc.)
- #98: Implement assistant-initiated actions (proactive recommendations based on context)
- #99: Add conversation analytics and intent tracking dashboard
- #100: Build long-term project memory (cross-conversation context persistence)

## Audience Growth Engine - Real Connected Infrastructure (PRIORITY)
- #111: DONE - Build centralized asset registry API (GET /api/assets) aggregating tools, landing pages, wrappers, WordPress, assistants
- #112: DONE - Create capture_flow_deployments migration for flow-to-asset relationships
- #113: DONE - Replace hardcoded asset cards with dynamic real asset loading in CaptureFlowBuilder
- #114: DONE - Implement auto-deployment system (inject widget into HTML on flow deployment)
- #115: DONE - Build asset-specific analytics tracking and reporting (GET /api/assets/:id/analytics)
- #116: Add "Enable Audience Capture" integration to Content Wrapper page
- #117: Build WordPress deployment integration (auto-inject to connected sites)
- #118: Add pre/post-result gates to interactive tool pages
- #119: Implement assistant-audience integration (unlock triggers conversation)
- #120: Update AudienceGrowthEngine page to show real deployed flows with asset connections

## CRITICAL - Production Blockers
- #83: DONE - Assistant routes completed (restart sandbox to load)
- #84: DONE - All assistant CRUD endpoints implemented
- #85: DONE - Growth pipeline routes complete with deployment execution
- #86: Test and fix all API endpoints for production readiness
- #87: Comprehensive UI polish pass (loading states, error handling, empty states)
- #88: Mobile responsive fixes across all pages
- #89: Performance optimization (bundle size, lazy loading, query optimization)
- #90: Build AI Assistant creation flow UI
- #91: Build Growth Pipeline deployment UI
- #92: Connect frontend components to new API endpoints

## AI Assistant Studio - Core Infrastructure
- #75: Build Create Assistant multi-step flow UI
- #76: Implement assistant API endpoints and database operations
- #79: Build assistant deployment system (HTML injection)
- #80: Create analytics and insights engine
- #81: Integrate with Audience Growth Engine
- #82: Build live conversation interface and preview

## Complete Product Identity Redesign - Phase 1: Navigation & Shell
- #50: Redesign DashboardLayout shell with workspace-oriented architecture
- #51: Create new icon system and visual language (premium spacing, glassmorphism, gradients)
- #52: Build contextual quick actions and workspace switcher

## Phase 2: Dashboard & Onboarding Ecosystem
- #53: Rebuild Dashboard as AI business intelligence workspace (analytics cards, growth visualization, AI recommendations)
- #54: Redesign onboarding flow as AI assistant-style guided creation experience
- #55: Create premium empty states with visual guidance and opportunity discovery

## Phase 3: Generation Workflows
- #57: Redesign project creation as strategy-first interactive flow
- #58: Rebuild tool builder as AI creative studio workspace with live preview
- #59: Redesign Content Wrapper as editorial workspace with real-time rendering
- #60: Create immersive preview system (browser-style rendering surface)

## Phase 4: Content Management & Collections
- #61: Redesign My Magnets as asset organization system with workspace collections
- #62: DONE - Rebuild project view as AI asset intelligence workspace
- #63: Create blueprint management as project intelligence view
- #64: Build campaign management with visual strategy boards

## Phase 5: Design System & Components
- #65: Build unified premium component library (dashboard primitives, AI workspace components)
- #66: Create centralized design token architecture (colors, spacing, typography, shadows)
- #67: Implement motion system and interaction states
- #68: Build responsive layout framework

## Phase 6: HTML Generation Engine - Premium Startup Quality
- #69: Rebuild landing page generation with original premium SaaS structure
- #70: Create realistic product preview dashboard sections
- #71: Build premium tool form sections with modern AI interactions
- #72: Optimize HTML for lightweight delivery and iframe preview
