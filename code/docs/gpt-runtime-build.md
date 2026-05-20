# GPT Runtime Infrastructure Build

## Phase 1: Core Runtime Engine (PRIORITY 1)
- [x] Database schema complete
- [x] Create gptRuntime.ts - core execution orchestration
- [x] Implement provider abstraction layer
- [x] Build streaming response handler
- [x] Add prompt assembly pipeline
- [x] Implement token counting
- [x] Add conversation history management

## Phase 2: Preview Panel Functionality (PRIORITY 1)
- [x] Fix send button and input handling
- [x] Implement streaming in preview
- [x] Add markdown rendering (react-markdown installed)
- [x] Fix auto-scroll
- [x] Add typing indicators
- [x] Connect to runtime engine
- [ ] Add markdown rendering to preview panel UI

## Phase 3: Knowledge System (RAG) (PRIORITY 2)
- [ ] Implement file upload to R2
- [ ] Build document parser (PDF, DOCX, TXT, CSV, MD)
- [ ] Implement chunking strategy
- [ ] Generate embeddings via OpenAI
- [ ] Store embeddings in gpt_embeddings table
- [ ] Build semantic retrieval function
- [ ] Inject knowledge into runtime prompts

## Phase 4: Actions Execution (PRIORITY 2)
- [ ] Build OpenAPI schema parser
- [ ] Implement action executor
- [ ] Add function calling to runtime
- [ ] Build auth handler (API key, Bearer, OAuth)
- [ ] Add action testing endpoint

## Phase 5: Create Tab AI Builder (PRIORITY 3)
- [ ] Enhance builder assistant prompts
- [ ] Implement auto-config generation
- [ ] Add live sync to Configure tab
- [ ] Build capability suggestion logic

## Phase 6: Multi-Model Execution (PRIORITY 3)
- [ ] Implement OpenAI execution
- [ ] Implement Anthropic execution
- [ ] Implement Gemini execution
- [ ] Implement DeepSeek execution
- [ ] Add provider failover

## Phase 7: Memory System (PRIORITY 4)
- [ ] Implement memory storage
- [ ] Build contextual recall
- [ ] Add memory management UI

## Phase 8: Public GPT System (PRIORITY 4)
- [ ] Build public GPT page
- [ ] Add publish/unpublish workflow
- [ ] Create share links

## Phase 9: Polish & UX (PRIORITY 5)
- [ ] Add keyboard shortcuts
- [ ] Fix scrolling issues
- [ ] Add loading states
- [ ] Mobile responsive fixes
