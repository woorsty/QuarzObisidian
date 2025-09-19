// Node.js script
// Geht rekursiv durch `content/`, ersetzt [[Links]] durch [Link](/slug)
// Vermeidet doppelte Pfade
// Voraussetzung: jede Datei hat Frontmatter mit `slug: <relativer Pfad innerhalb content/>`

const fs = require("fs").promises;
const path = require("path");
const matter = require("gray-matter");

const CONTENT_DIR = path.join(process.cwd(), "content");

async function walkDir(dir, cb) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) await walkDir(full, cb);
    else if (full.endsWith(".md")) await cb(full);
  }
}

async function buildSlugMap() {
  const map = {};
  await walkDir(CONTENT_DIR, async (file) => {
    console.log(file.toString());
    const text = await fs.readFile(file, "utf8");
    const parsed = matter(text);
    if (parsed.data?.slug) {
      const name = path.basename(file, ".md");
      // Pfad in Unix-Style
      map[name] = parsed.data.slug.replace(/\\/g, "/");
    }
  });
  return map;
}

async function replaceLinks() {
  const slugMap = await buildSlugMap();
  await walkDir(CONTENT_DIR, async (file) => {
    let text = await fs.readFile(file, "utf8");
    let changed = false;

    const fileDir = path
      .relative(CONTENT_DIR, path.dirname(file))
      .replace(/\\/g, "/");

    text = text.replace(
      /\[\[([^\]\|]+)(\|[^\]]+)?\]\]/g,
      (match, linkName, alias) => {
        const slug = slugMap[linkName];
        if (!slug) return match;

        // Entfernt doppelten Pfad, falls Slug bereits den Dateipfad enthält
        let slugPath = slug;
        if (slug.startsWith(fileDir)) {
          slugPath = slug.slice(fileDir.length);
          if (slugPath.startsWith("/")) slugPath = slugPath.slice(1);
        }

        const label = alias ? alias.slice(1) : linkName;
        changed = true;
        return `[${label}](/${slugPath})`;
      }
    );

    if (changed) {
      await fs.writeFile(file, text, "utf8");
      console.log(`Updated links in: ${file}`);
    }
  });
}

replaceLinks()
  .then(() => console.log("Done!"))
  .catch(console.error);
