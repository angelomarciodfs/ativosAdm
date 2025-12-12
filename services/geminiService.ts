
import { GoogleGenAI } from "@google/genai";
import { Rental, RentalStatus } from "../types";

const getClient = () => {
  // No Vite, acessamos variáveis via import.meta.env
  // Nota: A variável deve começar com VITE_ se for pública, ou configurar o envPrefix.
  // Neste caso, assumiremos que você usará VITE_API_KEY no .env
  const apiKey = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY; 
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateRentalInsights = async (rentals: Rental[]): Promise<string> => {
  const ai = getClient();
  if (!ai) {
    return "API Key não configurada. Configure a variável de ambiente VITE_API_KEY para receber insights inteligentes.";
  }

  // Filter relevant data to reduce token usage
  const activeRentals = rentals.filter(r => r.status === RentalStatus.ACTIVE || r.status === RentalStatus.OVERDUE);
  
  const dataSummary = JSON.stringify(activeRentals.map(r => ({
    model: r.radioModel,
    client: r.clientCompany,
    daysSinceStart: Math.floor((new Date().getTime() - new Date(r.startDate).getTime()) / (1000 * 3600 * 24)),
    status: r.status,
    revenuePotential: (r.dailyRate || 40) * 7 // projected weekly revenue (default 40 if missing)
  })));

  const prompt = `
    Você é um assistente de IA especialista em logística de equipamentos.
    Analise os seguintes dados de locação de rádios ativos e atrasados:
    ${dataSummary}

    Forneça um resumo curto (máximo 3 parágrafos) em Português do Brasil com:
    1. Riscos potenciais (ex: muitos atrasos, clientes com muitos equipamentos).
    2. Sugestões de ação rápida.
    3. Uma observação positiva sobre a receita ou utilização.
    Use formatação Markdown simples. Seja direto e profissional, estilo relatório militar/industrial.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Erro ao gerar insights:", error);
    return "Erro de conexão com o serviço de inteligência.";
  }
};
