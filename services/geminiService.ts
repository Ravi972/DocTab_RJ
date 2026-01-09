import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedTableData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractTableFromMedia = async (
  base64Data: string,
  mimeType: string
): Promise<ExtractedTableData[]> => {
  try {
    // Clean base64 string if it contains the data URI prefix
    const cleanBase64 = base64Data.split(',')[1] || base64Data;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: `Analyze this document. It may contain multiple pages with separate tables.
            
            Task: Extract tabular data from the document.
            
            Rules:
            1. Treat each page or distinct section as a separate table. DO NOT MERGE tables from different pages unless they are clearly one continuous table (e.g., page 1 ends with no bottom border and page 2 starts with no headers).
            2. If the document has multiple pages with independent tables (e.g. separate invoices, separate part lists), extract them as separate items in the returned list.
            3. For each table, extract headers and rows.
            4. Capture all numerical values exactly as strings.
            5. Provide a descriptive title for each table (e.g., "Page 1 - Invoice", "Page 2 - Parts List").
            
            Return a JSON ARRAY of table objects.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              tableTitle: {
                type: Type.STRING,
                description: "A short descriptive title for the extracted table",
              },
              headers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "The column headers of the table",
              },
              rows: {
                type: Type.ARRAY,
                items: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                description: "The data rows.",
              },
            },
            required: ["headers", "rows"],
          },
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as ExtractedTableData[];
      return data;
    } else {
      throw new Error("No text response from Gemini");
    }
  } catch (error) {
    console.error("Error extracting table:", error);
    throw error;
  }
};