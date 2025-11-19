import { GoogleGenAI } from "@google/genai";
import { Product, Invoice } from "../types";

// Initialize Gemini
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const GeminiService = {
  /**
   * Generate a creative product description based on name and category.
   */
  generateProductDescription: async (name: string, category: string): Promise<string> => {
    try {
      const model = 'gemini-2.5-flash';
      const prompt = `Escribe una descripción corta, atractiva y profesional para un producto llamado "${name}" que pertenece a la categoría "${category}". Máximo 2 frases. En español.`;
      
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      
      return response.text?.trim() || "No se pudo generar la descripción.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Error al conectar con el asistente de IA.";
    }
  },

  /**
   * Analyze sales data and provide business insights.
   */
  analyzeBusinessData: async (invoices: Invoice[], products: Product[]): Promise<string> => {
    try {
      const model = 'gemini-2.5-flash';
      
      // Prepare a summary of data to save tokens
      const totalSales = invoices.reduce((acc, inv) => acc + inv.total, 0);
      const salesCount = invoices.length;
      const lowStockProducts = products.filter(p => p.stock < 5).map(p => p.name);
      
      const dataSummary = `
        Total Ventas: ${totalSales}
        Cantidad Facturas: ${salesCount}
        Productos con bajo stock: ${lowStockProducts.join(', ')}
      `;

      const prompt = `
        Actúa como un consultor de negocios experto. Analiza los siguientes datos resumidos de una pequeña empresa:
        ${dataSummary}
        
        Proporciona 3 consejos breves y estratégicos para mejorar el negocio, enfocándote en ventas e inventario.
        Formato: Lista con viñetas. En español.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      return response.text || "No se pudo generar el análisis.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Error al analizar los datos.";
    }
  }
};