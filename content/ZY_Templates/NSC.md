---
slug: ZY_Templates/NSC
---
<%*
let rolle = await tp.user.prompt("Rolle dieses NSCs?");
let ort = await tp.user.prompt("Wo lebt / wirkt der NSC?");
let fraktion = await tp.user.prompt("Zugehörige Fraktion (optional)");
let gefahr = await tp.user.prompt("Wie gefährlich ist der NSC?");
let alias = await tp.user.prompt("Alternativer Name / Spitzname (optional)");
let today = tp.date.now("YYYY-MM-DD");
-%>
---
aliases: ["<%= alias %>"]
tags: [NSC]
rolle: "<%= rolle %>"
ort: "<%= ort %>"
fraktion: "<%= fraktion %>"
gefährlichkeitsgrad: "<%= gefahr %>"
erstellt_am: <%= today %>
---

# <% tp.file.title %>

**Rolle:** <%= rolle %>  
**Ort:** [[<%= ort %>]]  
**Fraktion:** [[<%= fraktion %>]]  
**Gefährlichkeitsgrad:** <%= gefahr %>  
**Erstellt am:** <%= today %>

---

## 🧍 Beschreibung

_Aussehen, Verhalten, Hintergrundgeschichte_

---

## 🧭 Beziehungen

- Kennt: …
- Feind von: …
- Schuldet: …

---

## 🎭 Auftritte in Sessions

- Session XX – …
- Session YY – …
