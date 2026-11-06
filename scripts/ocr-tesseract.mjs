import fs from "fs/promises";
import path from "path";
import Tesseract from "tesseract.js";

const args = process.argv.slice(2);
const dir = args[0];

if (!dir) {
  console.error("Donne le dossier des images.");
  process.exit(1);
}

async function run() {
  const files = await fs.readdir(dir);
  const jpgs = files
    .filter(
      (f) =>
        f.toLowerCase().endsWith(".jpg") || f.toLowerCase().endsWith(".jpeg")
    )
    .sort();

  const outFile = path.join(process.cwd(), "ttcf_ocr_raw.txt");

  // Initialize worker once for performance
  const worker = await Tesseract.createWorker("fra");

  console.log(
    `Démarrage OCR sur ${jpgs.length} images... Résultat dans ${outFile}`
  );

  // Clear file
  await fs.writeFile(outFile, "");

  for (let i = 0; i < jpgs.length; i += 2) {
    const qFile = jpgs[i];
    const aFile = jpgs[i + 1];

    if (!aFile) break;

    console.log(`\nTraitement Paire ${i / 2 + 1}: ${qFile} & ${aFile}`);

    try {
      const qRes = await worker.recognize(path.join(dir, qFile));
      const aRes = await worker.recognize(path.join(dir, aFile));

      const chunk = `
=============================================
PAIRE ${i / 2 + 1}
=============================================
--- QUESTIONS (${qFile}) ---
${qRes.data.text}

--- RÉPONSES (${aFile}) ---
${aRes.data.text}

`;
      await fs.appendFile(outFile, chunk);
      console.log(`Paire ${i / 2 + 1} OK.`);
    } catch (err) {
      console.error(`Erreur OCR paire ${i / 2 + 1}:`, err);
    }
  }

  await worker.terminate();
  console.log("Fini. Lance la vérification manuelle !");
}

run();
