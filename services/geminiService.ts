
import { GoogleGenAI, Type } from "@google/genai";
import { CubeState, Solution, Move } from "../types";

// Always initialize GoogleGenAI using the apiKey from process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiSolver = async (state: CubeState): Promise<Solution> => {
  const stateStr = JSON.stringify(state);
  const startTime = performance.now();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are an expert Rubik's Cube solver. Given this cube state (U, D, L, R, F, B faces): ${stateStr}, provide the shortest sequence of moves to solve it. 
      Use standard Singmaster notation (e.g., R, R', U2). 
      Return only the moves and a brief explanation of the strategy used (CFOP, Roux, etc.).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            moves: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of moves in Singmaster notation"
            },
            strategy: {
              type: Type.STRING,
              description: "Brief name of the strategy"
            },
            explanation: {
              type: Type.STRING,
              description: "Detailed step-by-step reasoning"
            }
          },
          required: ["moves", "strategy", "explanation"]
        }
      }
    });

    // Safely retrieve the text property and trim it before parsing as JSON.
    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from the Gemini API.");
    }
    const data = JSON.parse(text.trim());
    
    return {
      moves: data.moves as Move[],
      solverName: "Gemini AI (Deep Learning)",
      timeMs: Math.round(performance.now() - startTime),
      explanation: data.explanation
    };
  } catch (error) {
    console.error("AI Solve Error:", error);
    return { moves: [], solverName: "Gemini AI", timeMs: 0, explanation: "Error communicating with AI" };
  }
};

export const getTutorialHint = async (state: CubeState, currentMoves: Move[]): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The user is solving a Rubik's cube. Current state: ${JSON.stringify(state)}. 
      Moves they just did: ${currentMoves.join(', ')}. 
      Give a short, encouraging tutorial tip for the next step (e.g., 'Try solving the cross', 'F2L pair detected').`,
    });
    // Use the .text property directly as per the library guidelines.
    return response.text?.trim() || "Keep going! You're doing great.";
  } catch {
    return "Keep going! You're doing great.";
  }
};
