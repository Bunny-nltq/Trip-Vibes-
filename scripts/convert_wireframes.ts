import fs from "fs";
import path from "path";

const wireframesDir = path.join(process.cwd(), "wireframes");
const outputDir = path.join(process.cwd(), "src/app/demo");

const files = fs.readdirSync(wireframesDir).filter(f => f.endsWith(".html"));

function convertHtmlToReact(html: string): string {
  // Extract body content
  const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
  if (!bodyMatch) return "";
  
  let content = bodyMatch[1];
  
  // Clean up
  content = content.replace(/class=/g, "className=");
  content = content.replace(/style="([^"]*)"/g, (match, styleStr) => {
    // Basic inline style to object converter
    const styles = styleStr.split(";").filter((s: string) => s.trim());
    const styleObj = styles.reduce((acc: string[], s: string) => {
      const [rawKey, value] = s.split(":");
      if (!rawKey || !value) return acc;
      const key = rawKey.trim().replace(/-([a-z])/g, (g: string) => g[1].toUpperCase());
      acc.push(`"${key}": "${value.trim()}"`);
      return acc;
    }, []);
    return `style={{${styleObj.join(", ")}}}`;
  });

  // Self closing tags
  content = content.replace(/<img([^>]*)>/g, "<img$1 />");
  content = content.replace(/<input([^>]*)>/g, "<input$1 />");
  content = content.replace(/<br>/g, "<br />");
  content = content.replace(/<hr>/g, "<hr />");

  // Map to components (Simple mapping, can be expanded)
  // We won't map everything to components automatically because it's too complex for regex, 
  // but we can replace standard classes with Tailwind + Design System classes.
  
  // Actually, wait. The user has 28 files. Instead of a perfect component mapping,
  // let's map the CSS classes to Tailwind equivalents in a global stylesheet, or just 
  // leave the classes and provide a CSS file that maps them to the Design System!
  // Yes! The HTML files share the EXACT SAME `<style>` block.
  
  return content;
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const routes = [];

for (const file of files) {
  const html = fs.readFileSync(path.join(wireframesDir, file), "utf8");
  
  // Extract title
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1].replace(" - Trip Vibes", "") : file;
  
  const id = file.replace(".html", "").toLowerCase();
  routes.push({ id, title });
  
  const reactContent = convertHtmlToReact(html);
  
  const pageDir = path.join(outputDir, id);
  if (!fs.existsSync(pageDir)) fs.mkdirSync(pageDir, { recursive: true });
  
  const tsxContent = `import React from "react";
import "@/app/wireframes.css"; // We will create this

export default function Page_${id.replace(/[^a-zA-Z0-9]/g, "")}() {
  return (
    <div className="wireframe-container">
      ${reactContent}
    </div>
  );
}
`;
  
  fs.writeFileSync(path.join(pageDir, "page.tsx"), tsxContent);
}

// Generate index page
const indexContent = `import React from "react";
import Link from "next/link";

export default function DemoIndex() {
  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-8 text-[var(--color-primary-500)]">Trip Vibes - Giao diện Demo</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${routes.map(r => `
        <Link href="/demo/${r.id}" className="p-4 border rounded-xl hover:border-[var(--color-primary-500)] hover:shadow-md transition-all bg-white">
          <div className="font-semibold text-lg text-[var(--color-neutral-navy)]">${r.title}</div>
          <div className="text-sm text-[var(--color-neutral-500)] mt-2">Xem chi tiết &rarr;</div>
        </Link>
        `).join("")}
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path.join(outputDir, "page.tsx"), indexContent);
console.log("Generated " + files.length + " demo pages.");
