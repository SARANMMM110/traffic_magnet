// Prompts for blueprint and HTML generation
// Separated from openai.ts to improve maintainability and prevent file corruption

// ============================================================================
// BLUEPRINT GENERATION PROMPTS
// ============================================================================

export function generateBlueprintPrompt(
  toolName: string,
  niche: string,
  category: string | null,
  goal: string | null
): string {
  return `You are generating clean, professional blueprint content for a premium SaaS dashboard application.

═══════════════════════════════════════════════════════════
CRITICAL UI/UX REQUIREMENTS
═══════════════════════════════════════════════════════════

This blueprint must be:
✓ CLEAN and visually readable inside dashboard cards
✓ CONCISE but valuable (not bloated)
✓ PROFESSIONAL marketing language
✓ SEO-FOCUSED with strategic keywords
✓ FORMATTED for modern SaaS UI sections

DO NOT generate:
✗ Overly long paragraphs
✗ Technical dumps or raw JSON
✗ Broken formatting or serialized objects
✗ Weak one-line filler content
✗ Excessive or repetitive text

Return ONLY pure valid JSON. No markdown fences, no explanations.

Tool Name: ${toolName}
Niche: ${niche}
Category: ${category || "General"}
Goal: ${goal || "Generate traffic"}

Return the complete JSON structure with premium-quality content:`;
}

export function generateRegenerateBlueprintPrompt(
  currentBlueprint: any,
  niche: string,
  goal: string | null
): string {
  return `Regenerate an improved version of this blueprint with fresh variations.

REQUIREMENTS:
- Keep the same tool concept and structure
- Generate NEW variations for purpose, keywords, and monetization
- Maintain professional quality
- Return ONLY valid JSON (no markdown fences)

Current Blueprint:
${JSON.stringify(currentBlueprint, null, 2)}

Niche: ${niche}
Goal: ${goal || "Generate traffic"}

Return the complete improved JSON structure:`;
}

// ============================================================================
// OPTIMIZED HTML GENERATION PROMPTS
// ============================================================================

export function generateOptimizedLandingPagePrompt(blueprint: any): string {
  // Build input fields HTML
  const inputsHTML = Array.isArray(blueprint.inputs_required) && blueprint.inputs_required.length > 0
    ? blueprint.inputs_required.map((input: any, idx: number) => {
        const fieldName = typeof input === 'string' ? input : (input.name || input.label || `Input ${idx + 1}`);
        const fieldType = typeof input === 'object' && input.type === 'select' ? 'select' : 'text';
        
        if (fieldType === 'select') {
          return `
        <div class="input-group">
          <label><i class="fas fa-list"></i> ${fieldName}</label>
          <select id="input${idx}" required>
            <option value="">Select option</option>
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
        </div>`;
        }
        
        return `
        <div class="input-group">
          <label><i class="fas fa-calculator"></i> ${fieldName}</label>
          <input type="text" id="input${idx}" placeholder="Enter ${fieldName.toLowerCase()}" required>
        </div>`;
      }).join('\n')
    : `
        <div class="input-group">
          <label><i class="fas fa-calculator"></i> Input Value</label>
          <input type="text" id="input0" placeholder="Enter value" required>
        </div>`;

  return `Create a clean, optimized landing page for: ${blueprint.title}

CRITICAL: Output ONLY the complete HTML document. NO markdown fences.

OPTIMIZATION REQUIREMENTS:
- Use reusable CSS classes (NOT repeated inline styles)
- Minimal blur effects (max 2-3 backdrop-filters)
- Simple DOM structure (avoid deep nesting)
- Lightweight gradients (use CSS variables)
- Single shared <style> block
- Total HTML size under 50KB

TEMPLATE STRUCTURE:

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${blueprint.seo_title || blueprint.title}</title>
  <meta name="description" content="${blueprint.seo_description || blueprint.description || blueprint.purpose}">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --primary: #6E57E0;
      --primary-dark: #5B48E0;
      --gradient: linear-gradient(135deg, #6E57E0, #A78BFA);
      --text: #1A1E2B;
      --text-light: #4B5565;
      --bg: #ffffff;
      --border: #E9EDF4;
      --shadow: 0 15px 30px -10px rgba(0,0,0,0.1);
    }
    
    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }
    
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    
    /* Hero */
    .hero {
      padding: 100px 0 80px;
      text-align: center;
      background: radial-gradient(ellipse at top, rgba(110,87,224,0.04), transparent 70%);
    }
    .hero h1 {
      font-size: clamp(36px, 6vw, 64px);
      font-weight: 800;
      margin-bottom: 20px;
      letter-spacing: -0.02em;
    }
    .hero .gradient { background: var(--gradient); -webkit-background-clip: text; background-clip: text; color: transparent; }
    .hero p { font-size: 18px; color: var(--text-light); max-width: 600px; margin: 0 auto 32px; }
    
    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      border-radius: 12px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
      font-family: inherit;
      font-size: 16px;
    }
    .btn-primary {
      background: var(--gradient);
      color: white;
      box-shadow: 0 8px 20px -6px rgba(110,87,224,0.3);
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(110,87,224,0.4); }
    .btn-outline {
      background: transparent;
      border: 1.5px solid var(--border);
      color: var(--text);
    }
    .btn-outline:hover { border-color: var(--primary); background: rgba(110,87,224,0.04); }
    
    /* Tool Card */
    .tool-card {
      background: white;
      border-radius: 32px;
      padding: 40px;
      margin: 40px 0;
      box-shadow: var(--shadow);
    }
    .tool-card h2 { font-size: 28px; margin-bottom: 8px; text-align: center; }
    .tool-card > p { text-align: center; color: var(--text-light); margin-bottom: 32px; }
    
    /* Form */
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px; }
    .input-group { display: flex; flex-direction: column; gap: 8px; }
    .input-group label {
      font-weight: 600;
      font-size: 14px;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .input-group label i { color: var(--primary); }
    input, select {
      padding: 12px 16px;
      border: 1.5px solid var(--border);
      border-radius: 12px;
      font-family: inherit;
      font-size: 15px;
      transition: border-color 0.2s;
      background: #F9FAFE;
    }
    input:focus, select:focus {
      outline: none;
      border-color: var(--primary);
      background: white;
    }
    
    .btn-submit {
      width: 100%;
      padding: 16px;
      background: var(--text);
      color: white;
      border: none;
      border-radius: 16px;
      font-weight: 700;
      font-size: 17px;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 8px;
    }
    .btn-submit:hover { background: #2D2A5E; transform: scale(0.99); }
    
    /* Results */
    .results {
      margin-top: 32px;
      background: #F8F9FF;
      border-radius: 20px;
      padding: 24px;
      border-left: 4px solid var(--primary);
      display: none;
    }
    .results.show { display: block; }
    .results h3 { margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .results h3 i { color: var(--primary); }
    
    /* Grid Sections */
    .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin: 40px 0; }
    .card {
      background: white;
      border-radius: 20px;
      padding: 28px;
      border: 1px solid var(--border);
      transition: transform 0.2s;
    }
    .card:hover { transform: translateY(-4px); }
    .card-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #F5F3FF, #FFF);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: var(--primary);
      margin-bottom: 16px;
      border: 1px solid #E8E5FF;
    }
    .card h3 { font-size: 18px; margin-bottom: 8px; }
    .card p { color: var(--text-light); font-size: 15px; }
    
    /* FAQ */
    .faq { max-width: 800px; margin: 40px auto; }
    details {
      background: white;
      border: 1px solid var(--border);
      border-radius: 16px;
      margin-bottom: 12px;
      padding: 20px 24px;
    }
    summary {
      font-weight: 700;
      cursor: pointer;
      list-style: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    summary::-webkit-details-marker { display: none; }
    summary::after { content: '+'; font-size: 24px; color: var(--primary); }
    details[open] summary::after { content: '−'; }
    .faq-answer { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); color: var(--text-light); }
    
    /* CTA */
    .cta {
      background: linear-gradient(135deg, #1E2330, #2C3548);
      border-radius: 32px;
      padding: 48px 32px;
      text-align: center;
      color: white;
      margin: 60px 0;
    }
    .cta h3 { font-size: 32px; margin-bottom: 12px; }
    .cta p { color: rgba(255,255,255,0.8); margin-bottom: 24px; }
    
    /* Footer */
    footer { text-align: center; padding: 40px 24px; color: var(--text-light); font-size: 14px; border-top: 1px solid var(--border); }
    
    /* Mobile */
    @media (max-width: 768px) {
      .hero { padding: 60px 0 40px; }
      .tool-card { padding: 24px; }
      .form-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>

<!-- Hero -->
<section class="hero">
  <div class="container">
    <h1>${blueprint.title.split(' ').slice(0, -1).join(' ')} <span class="gradient">${blueprint.title.split(' ').slice(-1)[0]}</span></h1>
    <p>${blueprint.purpose}</p>
    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
      <a href="#tool" class="btn btn-primary"><i class="fas fa-calculator"></i> ${blueprint.cta_text || 'Get Started'}</a>
      <a href="#how" class="btn btn-outline"><i class="fas fa-play-circle"></i> How it works</a>
    </div>
  </div>
</section>

<!-- Tool -->
<div class="container" id="tool">
  <div class="tool-card">
    <h2>${blueprint.title}</h2>
    <p>${blueprint.description || blueprint.purpose}</p>
    <form id="form" onsubmit="event.preventDefault(); calculate();">
      <div class="form-grid">
        ${inputsHTML}
      </div>
      <button type="submit" class="btn-submit">
        <i class="fas fa-rocket"></i> ${blueprint.cta_text || 'Calculate Now'}
      </button>
    </form>
    <div id="results" class="results">
      <h3><i class="fas fa-check-circle"></i> Your Results</h3>
      <div id="resultsContent"></div>
    </div>
  </div>
</div>

<!-- How It Works -->
<section id="how" class="container">
  <h2 style="text-align: center; font-size: 32px; margin-bottom: 32px;">How It Works</h2>
  <div class="grid-3">
    <div class="card">
      <div class="card-icon">1</div>
      <h3>Enter Your Data</h3>
      <p>Fill in the form fields with your information</p>
    </div>
    <div class="card">
      <div class="card-icon">2</div>
      <h3>Get Results</h3>
      <p>Our algorithm calculates your personalized results instantly</p>
    </div>
    <div class="card">
      <div class="card-icon">3</div>
      <h3>Take Action</h3>
      <p>Use the insights to make informed decisions</p>
    </div>
  </div>
</section>

<!-- Benefits -->
<section class="container">
  <h2 style="text-align: center; font-size: 32px; margin-bottom: 32px;">Key Benefits</h2>
  <div class="grid-3">
    ${Array.isArray(blueprint.features) && blueprint.features.length > 0
      ? blueprint.features.slice(0, 6).map((f: any, i: number) => {
          const icons = ['bolt', 'chart-line', 'shield-alt', 'clock', 'users', 'check-circle'];
          const title = typeof f === 'string' ? f : (f.title || f.name || `Benefit ${i + 1}`);
          const desc = typeof f === 'object' && f.description ? f.description : 'Powerful feature to help you succeed';
          return `
    <div class="card">
      <div class="card-icon"><i class="fas fa-${icons[i % icons.length]}"></i></div>
      <h3>${title}</h3>
      <p>${desc}</p>
    </div>`;
        }).join('\n')
      : `
    <div class="card">
      <div class="card-icon"><i class="fas fa-bolt"></i></div>
      <h3>Fast & Accurate</h3>
      <p>Get instant, reliable results every time</p>
    </div>
    <div class="card">
      <div class="card-icon"><i class="fas fa-shield-alt"></i></div>
      <h3>Secure & Private</h3>
      <p>Your data stays private and secure</p>
    </div>
    <div class="card">
      <div class="card-icon"><i class="fas fa-check-circle"></i></div>
      <h3>Easy to Use</h3>
      <p>Simple interface, powerful results</p>
    </div>`}
  </div>
</section>

<!-- FAQ -->
<section class="container">
  <h2 style="text-align: center; font-size: 32px; margin-bottom: 32px;">Frequently Asked Questions</h2>
  <div class="faq">
    <details>
      <summary>How does this tool work?</summary>
      <div class="faq-answer">This tool uses advanced calculations based on ${blueprint.category || 'your input data'} to provide accurate results instantly.</div>
    </details>
    <details>
      <summary>Is it free to use?</summary>
      <div class="faq-answer">Yes, this tool is completely free with no sign-up required.</div>
    </details>
    <details>
      <summary>How accurate are the results?</summary>
      <div class="faq-answer">Our algorithm provides highly accurate results based on industry-standard calculations and real-time data.</div>
    </details>
    <details>
      <summary>Do I need to create an account?</summary>
      <div class="faq-answer">No account needed. Simply enter your data and get instant results.</div>
    </details>
  </div>
</section>

<!-- CTA -->
<div class="container">
  <div class="cta">
    <h3>${blueprint.cta_text || 'Ready to Get Started?'}</h3>
    <p>Join thousands using this tool every day</p>
    <a href="#tool" class="btn btn-primary">Get Started Now</a>
  </div>
</div>

<!-- Footer -->
<footer>
  <p>© 2025 ${blueprint.title} — ${blueprint.description || 'Professional calculations made simple'}</p>
</footer>

<script>
function calculate() {
  const results = document.getElementById('results');
  const content = document.getElementById('resultsContent');
  
  // Get input values
  const inputs = document.querySelectorAll('#form input, #form select');
  const values = Array.from(inputs).map(i => (i as HTMLInputElement).value);
  
  // Implement calculation logic from blueprint
  // ${blueprint.calculation_logic || 'const result = values.reduce((a, b) => Number(a) + Number(b), 0);'}
  
  // Display results
  content.innerHTML = '<p>Results calculated successfully! Your result is displayed above.</p>';
  results.classList.add('show');
  results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href') || '');
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
</script>
</body>
</html>

OUTPUT THE COMPLETE HTML NOW (no markdown, no explanations):`;
}

export function generateOptimizedToolHTMLPrompt(blueprint: any, action: 'standalone' | 'embed'): string {
  const isEmbed = action === 'embed';
  
  if (isEmbed) {
    return `Create a clean, embeddable calculator widget for: ${blueprint.title}

CRITICAL RULES:
- NO <!DOCTYPE>, <html>, <head>, or <body> tags
- NO full document structure
- Output ONLY the tool content in a single wrapper div
- NO markdown fences
- Lightweight inline CSS only
- Total output under 30KB

OUTPUT THIS STRUCTURE:

<div class="tool-wrapper" style="font-family:Inter,sans-serif;max-width:900px;margin:0 auto;padding:32px;background:white;border-radius:24px;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
  
  <div style="text-align:center;margin-bottom:28px;">
    <h2 style="font-size:28px;font-weight:700;color:#1A1E2B;margin-bottom:8px;">${blueprint.title}</h2>
    <p style="color:#5b677b;font-size:16px;">${blueprint.description || blueprint.purpose}</p>
  </div>
  
  <form id="calcForm" onsubmit="event.preventDefault();calc();" style="margin-bottom:24px;">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-bottom:20px;">
      ${generateInputFields(blueprint.inputs_required || [])}
    </div>
    <button type="submit" style="width:100%;padding:16px;background:#1A1E2B;color:white;border:none;border-radius:12px;font-weight:700;font-size:17px;cursor:pointer;transition:0.2s;" onmouseover="this.style.background='#2D2A5E'" onmouseout="this.style.background='#1A1E2B'">
      Calculate Now
    </button>
  </form>
  
  <div id="result" style="display:none;margin-top:24px;background:#F8F9FF;border-radius:16px;padding:20px;border-left:4px solid #6E57E0;">
    <div id="resultContent"></div>
  </div>
  
  <script>
  function calc() {
    const result = document.getElementById('result');
    const content = document.getElementById('resultContent');
    
    // Get inputs
    const form = document.getElementById('calcForm');
    const inputs = form.querySelectorAll('input, select');
    const vals = Array.from(inputs).map(i => i.value);
    
    // Calculate (implement from blueprint)
    ${blueprint.calculation_logic || 'const output = vals.join(", ");'}
    
    // Display
    content.innerHTML = '<p style="color:#1A1E2B;font-weight:600;">Result: ' + output + '</p>';
    result.style.display = 'block';
  }
  </script>
</div>

Generate the complete embed code now (wrapper div only):`;
  }
  
  // Standalone version
  return `Create a minimal standalone HTML page for: ${blueprint.title}

OPTIMIZATION RULES:
- Use CSS classes, NOT repeated inline styles
- Single <style> block with reusable classes
- Minimal blur/shadow effects
- Simple DOM structure
- Total size under 40KB
- NO markdown fences

${generateOptimizedLandingPagePrompt(blueprint).replace('Create a clean, optimized landing page for:', 'TEMPLATE:')}`;
}

function generateInputFields(inputs: any[]): string {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    return `
      <div style="display:flex;flex-direction:column;gap:8px;">
        <label style="font-weight:600;font-size:14px;color:#2C3A58;">Input Value</label>
        <input type="text" required style="padding:12px 16px;border:1.5px solid #E9EDF4;border-radius:12px;font-size:15px;background:#F9FAFE;">
      </div>`;
  }
  
  return inputs.map((input, idx) => {
    const fieldName = typeof input === 'string' ? input : (input.name || input.label || `Input ${idx + 1}`);
    const fieldType = typeof input === 'object' && input.type === 'select' ? 'select' : 'text';
    
    if (fieldType === 'select') {
      return `
      <div style="display:flex;flex-direction:column;gap:8px;">
        <label style="font-weight:600;font-size:14px;color:#2C3A58;">${fieldName}</label>
        <select id="input${idx}" required style="padding:12px 16px;border:1.5px solid #E9EDF4;border-radius:12px;font-size:15px;background:#F9FAFE;">
          <option value="">Select</option>
          <option>Option 1</option>
          <option>Option 2</option>
        </select>
      </div>`;
    }
    
    return `
      <div style="display:flex;flex-direction:column;gap:8px;">
        <label style="font-weight:600;font-size:14px;color:#2C3A58;">${fieldName}</label>
        <input type="text" id="input${idx}" placeholder="Enter ${fieldName.toLowerCase()}" required style="padding:12px 16px;border:1.5px solid #E9EDF4;border-radius:12px;font-size:15px;background:#F9FAFE;">
      </div>`;
  }).join('\n');
}
