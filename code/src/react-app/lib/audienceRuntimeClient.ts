/**
 * Audience Runtime Engine - Client Side
 * 
 * This module provides the runtime logic for audience capture flows.
 * It handles trigger detection, overlay injection, session management,
 * and unlock state persistence.
 */

export interface FlowConfig {
  flowId: string;
  flowPublicId: string;
  captureMethod: "email" | "google_oauth";
  triggerType: "timed" | "scroll" | "exit_intent" | "click" | "idle" | "tool_result" | "assistant_response";
  triggerValue?: number; // milliseconds for timed, percentage for scroll
  unlockMessage: string;
  ctaText: string;
  position?: "center" | "bottom-right" | "fullscreen" | "sticky-bottom";
  theme?: "light" | "dark";
}

export interface UnlockSession {
  sessionToken: string;
  assetId: string;
  flowId: string;
  unlocked: boolean;
  subscriberId?: number;
  email?: string;
  provider?: string;
  expiresAt: number;
}

export class AudienceRuntime {
  private flowConfig: FlowConfig;
  private assetId: string;
  private triggered = false;
  private unlocked = false;
  private session: UnlockSession | null = null;
  private listeners: Array<() => void> = [];

  constructor(flowConfig: FlowConfig, assetId: string) {
    this.flowConfig = flowConfig;
    this.assetId = assetId;
  }

  /**
   * Initialize the runtime - set up triggers and check existing session
   */
  async initialize(): Promise<void> {
    // Check for existing unlock session
    await this.restoreSession();

    if (this.unlocked) {
      return; // Already unlocked, no need to set up triggers
    }

    // Set up appropriate trigger
    this.setupTrigger();
  }

  /**
   * Set up trigger based on flow configuration
   */
  private setupTrigger(): void {
    switch (this.flowConfig.triggerType) {
      case "timed":
        this.setupTimedTrigger();
        break;
      case "scroll":
        this.setupScrollTrigger();
        break;
      case "exit_intent":
        this.setupExitIntentTrigger();
        break;
      case "idle":
        this.setupIdleTrigger();
        break;
      case "click":
        this.setupClickTrigger();
        break;
      default:
        console.warn(`Unknown trigger type: ${this.flowConfig.triggerType}`);
    }
  }

  /**
   * Timed trigger - show gate after X milliseconds
   */
  private setupTimedTrigger(): void {
    const delay = this.flowConfig.triggerValue || 3000;
    setTimeout(() => {
      this.triggerGate();
    }, delay);
  }

  /**
   * Scroll trigger - show gate when user scrolls to X%
   */
  private setupScrollTrigger(): void {
    const targetPercentage = this.flowConfig.triggerValue || 50;

    const checkScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = (scrollTop / docHeight) * 100;

      if (scrollPercentage >= targetPercentage && !this.triggered) {
        this.triggerGate();
        window.removeEventListener("scroll", checkScroll);
      }
    };

    window.addEventListener("scroll", checkScroll);
  }

  /**
   * Exit intent trigger - show gate when user attempts to leave
   */
  private setupExitIntentTrigger(): void {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !this.triggered) {
        this.triggerGate();
        document.removeEventListener("mouseleave", handleMouseLeave);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
  }

  /**
   * Idle trigger - show gate after user is inactive for X seconds
   */
  private setupIdleTrigger(): void {
    const idleTime = this.flowConfig.triggerValue || 10000;
    let idleTimer: number | null = null;

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        if (!this.triggered) {
          this.triggerGate();
        }
      }, idleTime);
    };

    ["mousemove", "keydown", "scroll", "click"].forEach((event) => {
      document.addEventListener(event, resetIdleTimer);
    });

    resetIdleTimer();
  }

  /**
   * Click trigger - show gate when user clicks specific element
   */
  private setupClickTrigger(): void {
    // This can be customized to target specific elements
    document.addEventListener("click", (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.hasAttribute("data-trigger-audience-gate") && !this.triggered) {
        this.triggerGate();
      }
    });
  }

  /**
   * Trigger the gate overlay
   */
  private triggerGate(): void {
    this.triggered = true;
    this.notifyListeners();

    // Track gate opened event
    this.trackEvent("gate_opened");
  }

  /**
   * Handle successful unlock
   */
  async handleUnlock(subscriberId: number, email: string, provider: string): Promise<void> {
    this.unlocked = true;
    
    // Create session
    this.session = {
      sessionToken: this.generateSessionToken(),
      assetId: this.assetId,
      flowId: this.flowConfig.flowId,
      unlocked: true,
      subscriberId,
      email,
      provider,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };

    // Store session in localStorage
    this.saveSession();

    // Track unlock completed event
    this.trackEvent("unlock_completed", { subscriberId, email, provider });

    this.notifyListeners();
  }

  /**
   * Check if currently unlocked
   */
  isUnlocked(): boolean {
    return this.unlocked;
  }

  /**
   * Check if gate has been triggered
   */
  isTriggered(): boolean {
    return this.triggered;
  }

  /**
   * Get current session
   */
  getSession(): UnlockSession | null {
    return this.session;
  }

  /**
   * Subscribe to state changes
   */
  onChange(callback: () => void): void {
    this.listeners.push(callback);
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback());
  }

  /**
   * Save session to localStorage
   */
  private saveSession(): void {
    if (this.session) {
      localStorage.setItem(`audience_session_${this.assetId}`, JSON.stringify(this.session));
    }
  }

  /**
   * Restore session from localStorage
   */
  private async restoreSession(): Promise<void> {
    const stored = localStorage.getItem(`audience_session_${this.assetId}`);
    if (!stored) return;

    try {
      const session = JSON.parse(stored) as UnlockSession;
      
      // Check if session is expired
      if (session.expiresAt < Date.now()) {
        localStorage.removeItem(`audience_session_${this.assetId}`);
        return;
      }

      // Verify session with backend
      const valid = await this.verifySession(session.sessionToken);
      if (valid) {
        this.session = session;
        this.unlocked = true;
      } else {
        localStorage.removeItem(`audience_session_${this.assetId}`);
      }
    } catch (error) {
      console.error("Failed to restore session:", error);
      localStorage.removeItem(`audience_session_${this.assetId}`);
    }
  }

  /**
   * Verify session with backend
   */
  private async verifySession(sessionToken: string): Promise<boolean> {
    try {
      const response = await fetch("/api/audience/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, assetId: this.assetId }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Track analytics event
   */
  private async trackEvent(eventType: string, data?: any): Promise<void> {
    try {
      await fetch("/api/audience/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: this.assetId,
          flowId: this.flowConfig.flowId,
          eventType,
          data,
          sessionToken: this.session?.sessionToken,
        }),
      });
    } catch (error) {
      console.error("Failed to track event:", error);
    }
  }

  /**
   * Generate random session token
   */
  private generateSessionToken(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Manual trigger for testing
   */
  manualTrigger(): void {
    if (!this.triggered) {
      this.triggerGate();
    }
  }
}
