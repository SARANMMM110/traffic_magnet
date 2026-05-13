/** Single HTML document for SEO-wrapped tool — shared by download + iframe preview (parity). */

export interface SeoWrappedPageInput {
  name: string;
  html_content: string;
  seo_content: {
    intro_text: string;
    h2_sections: string;
    faqs: string;
    meta_title: string;
    meta_description: string;
    cta_text: string;
  };
}

export function buildSeoWrappedHtmlFromTool(tool: SeoWrappedPageInput): string {
  const h2Sections = JSON.parse(tool.seo_content.h2_sections) as { heading: string; content: string }[];
  const faqs = JSON.parse(tool.seo_content.faqs) as { question: string; answer: string }[];

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${tool.seo_content.meta_title}</title>
    <meta name="description" content="${tool.seo_content.meta_description}">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f9fafb;
        }
        .seo-content {
            background: white;
            padding: 40px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        h1 {
            color: #1a1a2e;
            font-size: 2.5em;
            margin-bottom: 20px;
        }
        h2 {
            color: #7c3aed;
            font-size: 1.8em;
            margin-top: 40px;
            margin-bottom: 15px;
        }
        h3 {
            color: #1a1a2e;
            font-size: 1.3em;
            margin-top: 25px;
            margin-bottom: 10px;
        }
        p {
            margin-bottom: 15px;
            font-size: 1.05em;
        }
        .tool-container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            margin: 30px 0;
            box-shadow: 0 2px 8px rgba(124, 58, 237, 0.1);
            border: 2px solid #7c3aed;
        }
        .faq-item {
            margin-bottom: 25px;
            padding: 20px;
            background: #f9fafb;
            border-radius: 6px;
        }
        .faq-question {
            font-weight: 600;
            color: #1a1a2e;
            font-size: 1.1em;
            margin-bottom: 10px;
        }
        .faq-answer {
            color: #555;
        }
        .cta {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            margin: 40px 0;
            font-size: 1.1em;
        }
    </style>
</head>
<body>
    <div class="seo-content">
        <h1>${tool.name}</h1>
        <p>${tool.seo_content.intro_text}</p>
    </div>

    <div class="tool-container">
        ${tool.html_content}
    </div>

    <div class="seo-content">
        ${h2Sections
          .map(
            (section) => `
            <h2>${section.heading}</h2>
            <p>${section.content}</p>
        `
          )
          .join("")}

        <h2>Frequently Asked Questions</h2>
        ${faqs
          .map(
            (faq) => `
            <div class="faq-item">
                <div class="faq-question">${faq.question}</div>
                <div class="faq-answer">${faq.answer}</div>
            </div>
        `
          )
          .join("")}

        <div class="cta">
            ${tool.seo_content.cta_text}
        </div>
    </div>
</body>
</html>`;
}
