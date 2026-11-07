import fs from "fs/promises";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Utilisation:
// $env:GEMINI_API_KEY="ton_api_key"
// node scripts/import-cards.mjs "C:\Users\rfaucompret\Documents\DEV\dev-projects\muchogames\tmp-resources\drive-download-20261102T171532Z-1-001"

const args = process.argv.slice(2);
const dir = args[0];

if (!dir) {
  console.error("Donne dossier.");
  process.exit(1);
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Manque GEMINI_API_KEY.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

async function run() {
  const files = await fs.readdir(dir);
  const jpgs = files
    .filter(
      (f) =>
        f.toLowerCase().endsWith(".jpg") || f.toLowerCase().endsWith(".jpeg")
    )
    .sort();

  const outFile = path.join(
    process.cwd(),
    "public",
    "data",
    "ttcf",
    "ttcf_data_fr.json"
  );

  let existingData = { cards: [] };
  try {
    const raw = await fs.readFile(outFile, "utf8");
    existingData = JSON.parse(raw);
  } catch {
    // Ignore if not exists
  }

  // Par paires: Q et A
  for (let i = 0; i < jpgs.length; i += 2) {
    const qFile = path.join(dir, jpgs[i]);
    const aFile = path.join(dir, jpgs[i + 1]);

    if (!aFile) break;

    console.log(`Lecture paire ${i / 2 + 1}: ${jpgs[i]} & ${jpgs[i + 1]}...`);

    const prompt = `
Tu es un extracteur de données JSON. 
Je te fournis 2 images d'une planche de cartes du jeu TTCF. 
L'image 1 contient les questions. L'image 2 contient les réponses exactes correspondantes.
Extrais TOUTES les cartes présentes sur ces planches.
Pour chaque carte, identifie:
- theme (Scolaire, Mature, Plaisir, Improbable, etc.)
- subject (le sujet de la carte)
- questions: un tableau de 10 objets { level: 1..10, q: "question", a: "réponse" }.

Réponds UNIQUEMENT un tableau JSON valide de ce format:
[
  {
    "theme": "...",
    "subject": "...",
    "questions": [
      { "level": 1, "q": "...", "a": "..." },
      ...
    ]
  }
]
Ne mets pas de markdown \`\`\`json, juste le tableau pur.`;

    try {
      // Lazy require for fs sync inside loop is bad, let's read async
      const qBuf = await fs.readFile(qFile);
      const aBuf = await fs.readFile(aFile);

      const qPart = {
        inlineData: { data: qBuf.toString("base64"), mimeType: "image/jpeg" }
      };
      const aPart = {
        inlineData: { data: aBuf.toString("base64"), mimeType: "image/jpeg" }
      };

      const result = await model.generateContent([prompt, qPart, aPart]);
      const response = await result.response;
      let text = response.text().trim();

      if (text.startsWith("```json")) text = text.replace(/```json/g, "");
      if (text.startsWith("```")) text = text.replace(/```/g, "");

      const parsed = JSON.parse(text);
      existingData.cards.push(...parsed);

      // Save progress
      await fs.writeFile(outFile, JSON.stringify(existingData, null, 2));
      console.log(`OK. Total cartes: ${existingData.cards.length}`);
    } catch (err) {
      console.error(`Erreur sur paire ${i / 2 + 1}:`, err.message);
    }
  }

  console.log("Fini. Fichier mis à jour.");
}

run();
