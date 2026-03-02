/* src/config/gemini.js */

// 1. Use the STANDARD package (NOT @google/genai)
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("Missing Gemini API Key in .env file");
}

// 2. Initialize the standard client
const genAI = new GoogleGenerativeAI(API_KEY);

// 3. Use the standard model name
export const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });