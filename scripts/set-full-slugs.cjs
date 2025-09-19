// Node.js script: set-full-slugs.cjs
// Setzt Frontmatter-slugs für alle Markdown-Dateien in content/
// Slug = Pfad relativ zum Ordner, nicht vollständiger Content-Pfad

const fs = require("fs").promises;
const path = require("path");
const matter = require("gray-matter");

const CONTENT_DIR = path.join(process.cwd(), "content");

// Hilfsfunktion: rekursives Durchlaufen
async function walkDir(dir, cb) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const fullPath = path.join(dir, ent.name);
    if (ent.isDirectory()) await walkDir(fullPath, cb);
    else if (fullPath.endsWith(".md")) await cb(fullPath);
  }
}

function toUnixPath(p) {
  return p.replace(/\\/g, "/");
}

async function setSlugs() {
  await walkDir(CONTENT_DIR, async (file) => {
    const content = await fs.readFile(file, "utf8");
    const parsed = matter(content);

    // Pfad relativ zu content/
    const relativePath = path.relative(CONTENT_DIR, file);
    const dir = path.dirname(relativePath);
    const name = path.basename(file, ".md");

    // Slug relativ zum Ordner, also nur Unterordner und Dateiname
    const slug =
      dir === "."
        ? name.replace(/ /g, "-")
        : toUnixPath(path.join(dir, name.replace(/ /g, "-")));

    console.log(parsed.data.slug);
    // Nur setzen, wenn Slug anders ist
    if (parsed.data.slug !== slug) {
      parsed.data.slug = slug;
      const newContent = matter.stringify(parsed.content, parsed.data);
      await fs.writeFile(file, newContent, "utf8");
      console.log(`Set slug for ${file}: ${slug}`);
    }
  });
}

setSlugs()
  .then(() => console.log("All slugs set successfully!"))
  .catch((err) => console.error(err));
