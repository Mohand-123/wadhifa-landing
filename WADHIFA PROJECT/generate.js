// ============================================================
//  Wadhifa — Backend IA (Vercel Serverless Function)
//  Appelle l'API Google Gemini pour générer offres et CV.
//  La clé API est lue depuis les variables d'environnement
//  Vercel (process.env.GEMINI_API_KEY) — jamais exposée au client.
// ============================================================

// Modèle Gemini utilisé (rapide + gratuit)
const GEMINI_MODEL = "gemini-2.0-flash";

// ---- Les deux "personnalités" de l'assistant ----
const PROMPTS = {
  // Assistant pour les RECRUTEURS : rédige une offre d'emploi
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

Règles :
- Français professionnel mais chaleureux
- Adapté au marché du travail algérien
- Pas de promesses irréalistes
- Format texte clair avec des tirets pour les puces (pas de markdown lourd)
- Reste concis : l'offre complète doit faire 200-280 mots maximum`,

  // Assistant pour les CANDIDATS : aide à structurer un CV
  cv: (data) => `Tu es un coach carrière algérien qui aide les candidats à valoriser leur parcours pour la plateforme d'emploi Wadhifa.

Voici les informations fournies par le candidat :
- Métier / poste visé : ${data.poste || "non précisé"}
- Expérience : ${data.experience || "non précisé"}
- Formation : ${data.formation || "non précisé"}
- Compétences : ${data.competences || "non précisé"}

Aide ce candidat en produisant :
1. Un "Titre professionnel" percutant (1 ligne)
2. Un "Résumé de profil" prêt à copier dans un CV (3-4 phrases, à la première personne, valorisant)
3. "Compétences clés" : reformule ses compétences en 5-6 puces professionnelles
4. "Conseils personnalisés" : 3 conseils concrets pour améliorer son CV vu son profil

Règles :
- Français professionnel et bienveillant
- Adapté au marché algérien
- Encourage sans mentir
- Format texte clair avec tirets pour les puces (pas de markdown lourd)
- Reste concis : 220-300 mots maximum`,
};

export default async function handler(req, res) {
  // --- CORS (autorise les appels depuis le site) ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    const { type, data } = req.body || {};

    // Vérifie le type demandé
    if (!type || !PROMPTS[type]) {
      return res.status(400).json({
        error: "Type invalide. Attendu : 'offre' ou 'cv'.",
      });
    }

    // Vérifie que la clé API est configurée
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Clé API non configurée sur le serveur.",
      });
    }

    // Construit le prompt selon le type
    const prompt = PROMPTS[type](data || {});

    // Appelle l'API Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Erreur Gemini:", errText);
      return res.status(502).json({
        error: "L'assistant IA est momentanément indisponible. Réessayez.",
      });
    }

    const result = await geminiResponse.json();

    // Extrait le texte généré
    const generatedText =
      result?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Désolé, aucune réponse n'a pu être générée. Réessayez.";

    return res.status(200).json({ result: generatedText });
  } catch (err) {
    console.error("Erreur serveur:", err);
    return res.status(500).json({
      error: "Une erreur s'est produite. Réessayez dans un instant.",
    });
  }
}
