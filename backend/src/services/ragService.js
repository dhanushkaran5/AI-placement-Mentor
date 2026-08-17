import { query } from '../config/db.js';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.ANTHROPIC_API_KEY;
let anthropic = null;

if (apiKey && apiKey.trim() !== '' && !apiKey.startsWith('your_')) {
  anthropic = new Anthropic({ apiKey });
}

/**
 * Perform custom term frequency ranking on SQLite insights
 */
export async function searchInsights(queryStr, companyFilter = null) {
  let rows;
  if (companyFilter && companyFilter.trim() !== '') {
    rows = await query('SELECT * FROM company_insights WHERE LOWER(company) = LOWER(?)', [companyFilter.trim()]);
  } else {
    rows = await query('SELECT * FROM company_insights');
  }

  if (rows.length === 0) {
    // Fallback if no matching company found, get all
    rows = await query('SELECT * FROM company_insights');
  }

  const keywords = queryStr.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (keywords.length === 0) {
    return rows.slice(0, 3);
  }

  const scoredRows = rows.map(row => {
    let score = 0;
    const textToSearch = `${row.company} ${row.role} ${row.title} ${row.content}`.toLowerCase();
    
    keywords.forEach(keyword => {
      if (textToSearch.includes(keyword)) {
        score += 1;
        if (row.company.toLowerCase().includes(keyword)) score += 3;
        if (row.title.toLowerCase().includes(keyword)) score += 2;
      }
    });

    return { ...row, score };
  });

  let results = scoredRows.filter(r => r.score > 0).sort((a, b) => b.score - a.score);
  if (results.length === 0) {
    results = rows.slice(0, 3);
  }

  return results.slice(0, 4);
}

/**
 * Core RAG Answer Generator
 */
export async function answerWithRAG(queryStr, companyFilter = null) {
  const docs = await searchInsights(queryStr, companyFilter);
  
  const contextText = docs.map(doc => {
    return `[Source: ${doc.source || 'Placement Log'}, Company: ${doc.company}, Topic: ${doc.title}]\n${doc.content}`;
  }).join('\n\n');

  if (!anthropic) {
    // Offline/Demo RAG synthesis
    console.log('Synthesizing RAG response offline...');
    
    // Choose the best document to echo or summarize
    const topDoc = docs[0];
    if (!topDoc) {
      return `I couldn't find any specific articles in my knowledge base. However, generally for placements, I recommend focusing on Data Structures, SQL, and practicing Mock Interviews.`;
    }

    let citations = `[Source: ${topDoc.source || 'Placement Archive'}]`;
    return `Based on our placement insights database for **${topDoc.company}**:

**${topDoc.title}**
${topDoc.content.split('\n').slice(0, 3).join('\n')}

*For more details, check out the full article from ${citations}.*

*(Demo mode: Set your ANTHROPIC_API_KEY for a fully synthesized multi-document AI answer.)*`;
  }

  // Live Claude RAG
  const systemPrompt = `You are a RAG (Retrieval-Augmented Generation) assistant for the AI Placement Mentor.
Answer the user's question about placements, companies, or interview patterns using the provided retrieved knowledge base articles.
You MUST cite the source of your information using brackets (e.g. "[Placement Cell Guide 2025]" or "[Senior Alumni Interview Logs]").
If the context doesn't contain the answer, you can use your training data, but explicitly state that this is general industry advice not present in the local database.
Keep your response clear, structured, and easy to read.`;

  const userPrompt = `Retrieved Context:\n${contextText}\n\nUser Question: ${queryStr}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
    return response.content[0].text;
  } catch (error) {
    console.error('RAG synthesis error:', error);
    throw error;
  }
}
