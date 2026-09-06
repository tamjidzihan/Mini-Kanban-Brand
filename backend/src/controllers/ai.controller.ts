import { Request, Response } from 'express';

const callGemini = async (prompt: string, apiKey?: string): Promise<string> => {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest'];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      });

      if (response.ok) {
        const data: any = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return candidate.trim();
      } else {
        const errorBody = await response.text();
        lastError = new Error(`Gemini ${model} failed with ${response.status}: ${errorBody.slice(0, 150)}`);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini model endpoints failed');
};

export const breakdownSubtasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, apiKey } = req.body;
    if (!title) {
      res.status(400).json({ message: 'Task title is required' });
      return;
    }

    const prompt = `You are an expert agile project management AI assistant.
Decompose this software/project task into 3 to 6 actionable, concise checklist subtasks.

Task Title: "${title}"
Task Description: "${description || 'None'}"

Respond ONLY with a valid JSON array of strings, without markdown backticks or commentary. Example format:
["Design database schema", "Create REST endpoints", "Add unit tests", "Implement UI components"]`;

    try {
      const rawResponse = await callGemini(prompt, apiKey);
      const cleaned = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      const subtasks: string[] = JSON.parse(cleaned);
      res.status(200).json({ subtasks });
      return;
    } catch (aiErr: any) {
      console.warn('Using intelligent heuristic fallback for subtasks:', aiErr.message);
      const fallbackSubtasks = [
        `Clarify requirements & edge cases for ${title}`,
        `Draft technical specification & architecture design`,
        `Implement core logic and data handling`,
        `Write comprehensive unit & integration tests`,
        `Review code and verify in QA environment`,
      ];
      res.status(200).json({
        subtasks: fallbackSubtasks,
        isFallback: true,
        notice: aiErr.message === 'GEMINI_API_KEY_MISSING' ? 'Set GEMINI_API_KEY for custom AI generation' : undefined,
      });
      return;
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to generate subtasks' });
  }
};

export const enhanceDescription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, apiKey } = req.body;
    if (!title) {
      res.status(400).json({ message: 'Task title is required' });
      return;
    }

    const prompt = `You are a senior product manager and engineering lead.
Enhance and expand the following task description with clear Context, User Story, and Acceptance Criteria.

Task Title: "${title}"
Current Draft: "${description || 'None'}"

Format in clean, professional markdown with concise bullet points.`;

    try {
      const enhanced = await callGemini(prompt, apiKey);
      res.status(200).json({ description: enhanced });
      return;
    } catch (aiErr: any) {
      console.warn('Using fallback template for description enhancement:', aiErr.message);
      const fallback = `### Objective\nDeliver robust functionality for **${title}** with complete test coverage.\n\n### User Story\nAs a user, I want ${title.toLowerCase()} so that my workflow is streamlined and reliable.\n\n### Acceptance Criteria\n- [ ] Core business requirements met\n- [ ] Proper error handling and input validation\n- [ ] Verified across light and dark modes\n- [ ] Automated tests passing`;
      res.status(200).json({
        description: fallback,
        isFallback: true,
      });
      return;
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to enhance description' });
  }
};

export const generateBoard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt: userPrompt, apiKey } = req.body;
    if (!userPrompt) {
      res.status(400).json({ message: 'Board prompt is required' });
      return;
    }

    const prompt = `You are an agile workflow designer.
Generate a structured Kanban project board based on the user's project description: "${userPrompt}".

Respond ONLY with a valid JSON object in this exact schema, without markdown backticks:
{
  "title": "Short Board Title",
  "description": "Brief description of the workspace",
  "columns": [
    {
      "title": "To Do",
      "tasks": [
        { "title": "Task 1", "description": "Details", "priority": "HIGH" },
        { "title": "Task 2", "description": "Details", "priority": "MEDIUM" }
      ]
    },
    {
      "title": "In Progress",
      "tasks": [
        { "title": "Task 3", "description": "Details", "priority": "URGENT" }
      ]
    },
    {
      "title": "Done",
      "tasks": []
    }
  ]
}`;

    try {
      const rawResponse = await callGemini(prompt, apiKey);
      const cleaned = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      const boardData = JSON.parse(cleaned);
      res.status(200).json({ boardData });
      return;
    } catch (aiErr: any) {
      console.warn('Using fallback board structure:', aiErr.message);
      const fallbackData = {
        title: userPrompt.length > 30 ? userPrompt.slice(0, 30) + '...' : userPrompt,
        description: `Sprint workspace generated for: ${userPrompt}`,
        columns: [
          {
            title: 'Backlog',
            tasks: [
              { title: 'Project kick-off & scoping', description: 'Define milestones and technical roadmap', priority: 'HIGH' },
              { title: 'Design system review', description: 'Verify UI/UX components and user journey', priority: 'MEDIUM' },
            ],
          },
          {
            title: 'In Progress',
            tasks: [
              { title: 'Core architecture setup', description: 'Initialize repository, database schemas, and baseline APIs', priority: 'URGENT' },
            ],
          },
          {
            title: 'Review / QA',
            tasks: [
              { title: 'Integration testing', description: 'Run automated end-to-end regression tests', priority: 'MEDIUM' },
            ],
          },
          {
            title: 'Done',
            tasks: [
              { title: 'Environment setup', description: 'Development configurations ready', priority: 'LOW' },
            ],
          },
        ],
      };
      res.status(200).json({ boardData: fallbackData, isFallback: true });
      return;
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to generate board' });
  }
};
