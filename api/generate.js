// Wadhifa — Vercel Serverless Function
// Route: POST /api/generate

const GEMINI_MODEL = "gemini-2.0-flash";

const PROMPTS = {
  offre: (data) => `Tu es un expert RH algérien qui aide les recruteurs à rédiger des offres d'emploi attractives et professionnelles pour la plateforme Wadhifa.

Voici les informations fournies par le recruteur :
- Poste : ${data.poste || "non précisé"}
- Entreprise : ${data.entreprise || "non précisé"}
- Wilaya : ${data.wilaya || "non précisé"}
- Type de contrat : ${data.contrat || "non précisé"}
- Détails / compétences souhaitées : ${data.details || "non précisé"}

Rédige une offre d'emploi complète, claire et engageante, structurée ainsi :
1. Un titre accrocheur
2. Un paragraphe de présentation du poste (2-3 phrases)
3. "Missions principales" : 4-5 puces
4. "Profil recherché" : 4-5 puces
5. "Ce que nous offrons" : 3-4 puces

Règles : français professionnel, adapté au marché algérien, 200-280 mots max, tirets pour les puces.`,

  cv: (data) => `Tu es un coach carrière algérien qui aide les candidats à valoriser leur parcours pour la plateforme d'emploi Wadhifa.

Voici les informations fournies par le candidat :
- Métier / poste visé : ${data.poste || "non précisé"}
- Expérience : ${data.experience || "non précisé"}
- Formation : ${data.formation || "non précisé"}
- Compétences : ${data.competences || "non précisé"}

Produis :
1. Un "Titre professionnel" percutant (1 ligne)
2. Un "Résumé de profil" prêt à copier dans un CV (3-4 phrases, 1ère personne)
3. "Compétences clés" : 5-6 puces professionnelles
4. "Conseils personnalisés" : 3 conseils concrets

Règles : français professionnel, adapté au marché algérien, 220-300 mots max, tirets pour les puces.`,
};

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée." });

  try {
    const { type, data } = req.body || {};

    if (!type || !PROMPTS[type]) {
      return res.status(400).json({ error: "Type invalide. Attendu : 'offre' ou 'cv'." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Assistant IA non configuré." });
    }

    const prompt = PROMPTS[type](data || {});
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error:", errText);
      return res.status(502).json({ error: "L'assistant IA est indisponible. Réessayez." });
    }

    const result = await geminiRes.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Aucune réponse générée.";

    return res.status(200).json({ result: text });

  } catch (err) {
    console.error("Erreur:", err);
    return res.status(500).json({ error: "Une erreur s'est produite. Réessayez." });
  }
};
