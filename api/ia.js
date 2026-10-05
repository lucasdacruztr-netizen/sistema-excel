export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      erro: "Método não permitido."
    });
  }

  try {
    const { mensagem } = req.body || {};

    if (!mensagem || typeof mensagem !== "string") {
      return res.status(400).json({
        erro: "Mensagem não informada."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        erro: "A chave da API Gemini não foi configurada na Vercel."
      });
    }

    const resposta = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: `
Você é o Assistente de Planilhas de um sistema chamado
"Sistema de Organização de Alunos".

Sua função é ajudar o usuário a criar, organizar e analisar
planilhas de forma simples, clara e objetiva.

Quando o usuário pedir ajuda para criar uma planilha,
explique quais colunas seriam necessárias e como os dados
poderiam ser organizados.

Não invente informações que o usuário não forneceu.

Responda sempre em português do Brasil.
                `
              }
            ]
          },
          contents: [
            {
              parts: [
                {
                  text: mensagem
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1000
          }
        })
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      console.error("Erro Gemini:", dados);

      return res.status(resposta.status).json({
        erro: "A API do Gemini retornou um erro.",
        detalhes: dados
      });
    }

    const texto =
      dados?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!texto) {
      return res.status(500).json({
        erro: "O Gemini não retornou uma resposta."
      });
    }

    return res.status(200).json({
      resposta: texto
    });

  } catch (erro) {
    console.error("Erro no servidor:", erro);

    return res.status(500).json({
      erro: "Erro interno ao conversar com o Gemini."
    });
  }
}
