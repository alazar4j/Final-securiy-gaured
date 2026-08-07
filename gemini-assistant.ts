import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import express from "express";

export function createAssistantRouter(users: any[], devices: any[], auditLogs: any[]) {
  const router = express.Router();
  let ai: GoogleGenAI;

  const initAI = () => {
    if (!ai) {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY not configured");
      }
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
    }
    return ai;
  };

  const getDevicesDecl: FunctionDeclaration = {
    name: "getDevices",
    description: "Get a list of registered devices in the system. Use this to find information about devices, their owners, status, etc.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, description: "Filter by status: 'active', 'reported_stolen', or 'under_maintenance'." },
        limit: { type: Type.NUMBER, description: "Max records to return. Default 50." }
      }
    }
  };

  const getAuditLogsDecl: FunctionDeclaration = {
    name: "getAuditLogs",
    description: "Get recent audit logs and security events.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: { type: Type.NUMBER, description: "Max logs to return. Default 50." }
      }
    }
  };

  const getUsersDecl: FunctionDeclaration = {
    name: "getUsers",
    description: "Get a list of users (security guards, admins).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        role: { type: Type.STRING, description: "Filter by role: 'admin' or 'security'." },
        limit: { type: Type.NUMBER, description: "Max users to return. Default 50." }
      }
    }
  };

  router.post("/assistant", async (req, res) => {
    try {
      const { prompt, history = [] } = req.body;
      if (!prompt) return res.status(400).json({ error: "Prompt required" });

      const genAI = initAI();
      
      const mappedHistory = history.map((msg: any) => ({
        role: msg.role === "model" ? "model" : "user",
        parts: msg.parts || [{ text: msg.text || "" }]
      }));

      const chat = genAI.chats.create({
        model: "gemini-3.6-flash",
        history: mappedHistory,
        config: {
          systemInstruction: "You are a helpful and knowledgeable system administrator assistant for a security asset tracking platform. You answer questions about devices, audit logs, and users. You can speak English and Amharic. Use the provided tools to fetch live data. Do not hallucinate data that is not returned by the tools. Keep your answers concise, accurate, and professional.",
          tools: [{ functionDeclarations: [getDevicesDecl, getAuditLogsDecl, getUsersDecl] }]
        }
      });

      let response = await chat.sendMessage({ message: prompt });

      // Handle function calls if any
      while (response.functionCalls && response.functionCalls.length > 0) {
        const functionResponses: any[] = [];
        
        for (const call of response.functionCalls) {
          if (call.name === "getDevices") {
            const args = call.args as any;
            let devs = devices;
            if (args.status) devs = devs.filter(d => d.status === args.status);
            const limit = args.limit || 50;
            functionResponses.push({
              name: call.name,
              response: { result: devs.slice(0, limit) }
            });
          } else if (call.name === "getAuditLogs") {
            const args = call.args as any;
            const limit = args.limit || 50;
            functionResponses.push({
              name: call.name,
              response: { result: auditLogs.slice(0, limit) }
            });
          } else if (call.name === "getUsers") {
            const args = call.args as any;
            let usrs = users.map(u => ({ ...u, password_hash: undefined }));
            if (args.role) usrs = usrs.filter(u => u.role === args.role);
            const limit = args.limit || 50;
            functionResponses.push({
              name: call.name,
              response: { result: usrs.slice(0, limit) }
            });
          }
        }
        
        if (functionResponses.length > 0) {
          response = await chat.sendMessage({ message: functionResponses });
        } else {
          break;
        }
      }

      return res.json({ text: response.text });
    } catch (err: any) {
      console.error("Assistant Error:", err);
      return res.status(500).json({ error: err.message || "Internal Assistant Error" });
    }
  });

  return router;
}
