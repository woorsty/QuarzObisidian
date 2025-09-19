import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import yaml from "js-yaml"
import fs, { readFileSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"

// Hilfsfunktion: sichere HTML-ID aus Text machen
function makeSafeId(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^\w-]/g, "")
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Pfad, wo das init-Skript erzeugt wird
const leafletInitPath = path.resolve(__dirname, "../../public/leaflet-init.js")
const publicDir = path.dirname(leafletInitPath)
// Ordner anlegen, falls nicht existent
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}
// Init-Skript schreiben
if (!fs.existsSync(leafletInitPath)) {
  const scriptContent = `
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('.leaflet-map').forEach(div => {
    const c = JSON.parse(div.dataset.config)
    const map = L.map(div.id, { crs: L.CRS.Simple, minZoom: c.minZoom, maxZoom: c.maxZoom })
    const bounds = c.bounds
    const image = L.imageOverlay(decodeURIComponent('/ZZ_Images/' + c.img), bounds).addTo(map)
    map.fitBounds(bounds)
    map.setView([c.lat, c.long], c.defaultZoom)
    
    if(c.markers){
      c.markers.forEach(m => {
       const popupContent = m.popup ? \`<div>\${m.popup}</div>\` : '';
        L.marker([m.y, m.x]).addTo(map).bindPopup(popupContent)
      })
    }
  })
})
`
  fs.writeFileSync(leafletInitPath, scriptContent, "utf-8")
}

export const LeafletObsidian: QuartzTransformerPlugin = () => {
  let leafletData: any = { mapMarkers: [] }
  try {
    const dataPath = path.resolve("content/.obsidian/plugins/obsidian-leaflet-plugin/data.json")
    if (fs.existsSync(dataPath)) {
      const fileContent = fs.readFileSync(dataPath, "utf-8")
      leafletData = JSON.parse(fileContent)
    }
    console.log("LeafletData:", leafletData, "von", dataPath)
  } catch (e) {
    console.error("Fehler beim Laden der Obsidian Leaflet data.json:", e)
  }

  return {
    name: "LeafletObsidian",
    markdownPlugins() {
      return [
        () => (tree, file) => {
          visit(tree, "code", (node: any, index, parent) => {
            if (node.lang === "leaflet") {
              let config: any
              try {
                config = yaml.load(node.value)
              } catch (e) {
                console.error("Leaflet YAML error in", file.path, e)
                return
              }

              const id = makeSafeId(config.id || "map-" + Math.random().toString(36).substring(2))

              let img = ""
              if (config.image) {
                img =
                  typeof config.image === "string"
                    ? config.image.replace(/^!?\[\[(.*?)\]\]$/, "$1")
                    : String(config.image).replace(/^!?\[\[(.*?)\]\]$/, "$1")
                img = encodeURIComponent(img)
              }

              const bounds = config.bounds || [
                [0, 0],
                [1000, 1000],
              ]
              const height = config.height || "600px"
              const width = config.width || "100%"

              const mapMarkersEntry = leafletData.mapMarkers.find((m: any) => m.id === config.id)
              const markers = mapMarkersEntry?.markers || []

              const scriptData = {
                bounds,
                img,
                minZoom: config.minZoom ?? -2,
                maxZoom: config.maxZoom ?? 2,
                lat: config.lat ?? 0,
                long: config.long ?? 0,
                defaultZoom: config.defaultZoom ?? 0,
                markers: markers.map((m: any) => ({
                  x: m.loc[1],
                  y: m.loc[0],
                  popup: m.link ?? "",
                })),
              }

              parent!.children[index!] = {
                type: "html",
                value: `<div id="${id}" class="leaflet-map" style="height:${height};width:${width}" data-config='${JSON.stringify(scriptData)}'></div>`,
              }
            }
          })
        },
      ]
    },
    externalResources() {
      return {
        css: [],
        js: [
          {
            src: "https://unpkg.com/leaflet/dist/leaflet.js",
            loadTime: "afterDOMReady",
            contentType: "external",
          },
          {
            src: "/leaflet-init.js",
            loadTime: "afterDOMReady",
            contentType: "external",
          },
        ],
      }
    },
  }
}
