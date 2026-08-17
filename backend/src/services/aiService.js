import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.ANTHROPIC_API_KEY;
let anthropic = null;

if (apiKey && apiKey.trim() !== '' && !apiKey.startsWith('your_')) {
  console.log('AI Service initialized with Anthropic API key.');
  anthropic = new Anthropic({ apiKey });
} else {
  console.log('AI Service initialized in DEMO mode (Mock responses active). Set ANTHROPIC_API_KEY to enable live Claude integration.');
}

// Helper to make Claude API calls
async function callClaude(systemPrompt, userPrompt, jsonMode = false) {
  if (!anthropic) {
    throw new Error('Claude API is not configured.');
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = response.content[0].text;
    if (jsonMode) {
      // Find JSON block if Claude wrapped it in markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    }
    return content;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}

/**
 * 1. RESUME PARSING
 */
export async function parseResumeText(text) {
  const systemPrompt = `You are an expert resume parser. Parse the raw text of a candidate's resume and extract key details into a structured JSON object.
Return ONLY a valid JSON object matching this schema:
{
  "skills": ["Skill1", "Skill2", ...],
  "education": [
    {
      "degree": "Degree (e.g. B.Tech Computer Science)",
      "institution": "Institution name",
      "year": "Graduation year or range",
      "cgpa": "CGPA or percentage if available"
    }
  ],
  "experience": [
    {
      "role": "Job role / Internship title",
      "company": "Company Name",
      "duration": "Duration or dates",
      "description": "Short description of tasks"
    }
  ],
  "cgpa": 8.5 // Number representing CGPA if found, or null
}
Ensure skills are normalized (e.g. "ReactJS" -> "React", "Python Programming" -> "Python"). Do not include markdown headers or conversational text.`;

  if (!anthropic) {
    // Generate intelligent mock parsed resume from text keywords
    console.log('Generating mock parsed resume...');
    const skills = [];
    const textLower = text.toLowerCase();
    
    // Simple rule-based extraction for fallback demo
    const commonSkills = ['python', 'javascript', 'react', 'node', 'express', 'sql', 'sqlite', 'mongodb', 'java', 'c++', 'html', 'css', 'git', 'machine learning', 'tableau', 'aws'];
    commonSkills.forEach(s => {
      if (textLower.includes(s)) {
        skills.push(s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      }
    });

    if (skills.length === 0) {
      skills.push('Java', 'SQL', 'DBMS', 'HTML', 'CSS');
    }

    let cgpa = 8.2;
    const cgpaMatch = text.match(/(?:cgpa|gpa|pointer)\s*[:\-]?\s*([0-9\.]+)/i);
    if (cgpaMatch) cgpa = parseFloat(cgpaMatch[1]);

    return {
      skills,
      education: [
        {
          degree: text.includes('B.E') || text.includes('B.Tech') ? 'B.Tech in Computer Science' : 'Bachelor of Engineering',
          institution: 'State Technical University',
          year: '2022 - 2026',
          cgpa: cgpa ? cgpa.toString() : '8.2'
        }
      ],
      experience: [
        {
          role: 'Web Development Intern',
          company: 'Acme Software Solutions',
          duration: '3 Months (Summer 2025)',
          description: 'Designed and built responsive dashboard widgets, fixed REST API bugs, and enhanced SQLite databases.'
        }
      ],
      cgpa
    };
  }

  return await callClaude(systemPrompt, `Here is the raw resume text:\n\n${text}`, true);
}

/**
 * 2. SKILL GAP DETECTION
 */
export async function compareSkillsAndScore(resumeSkills, targetRole, targetCompany) {
  // Common company role skillsets for quick processing
  const roleSkillMap = {
    'SDE at TCS': ['Java', 'C++', 'Python', 'SQL', 'DBMS', 'Data Structures', 'OOPs', 'Communication Skills'],
    'Software Engineer at Google': ['Go', 'C++', 'Java', 'Python', 'System Design', 'Advanced Algorithms', 'Dynamic Programming', 'Distributed Systems', 'Object-Oriented Design'],
    'Data Scientist at Amazon': ['Python', 'R', 'SQL', 'Machine Learning', 'Deep Learning', 'Statistics', 'Data Wrangling', 'A/B Testing', 'Tableau', 'Big Data'],
    'Systems Engineer at Infosys': ['Java', 'Python', 'SQL', 'Networking', 'Operating Systems', 'SDLC', 'Cloud Computing Basics', 'Problem Solving'],
    'SDE at Wipro': ['Java', 'C#', 'SQL', 'HTML/CSS', 'JavaScript', 'DBMS', 'Software Engineering Principles', 'Aptitude']
  };

  const key = `${targetRole} at ${targetCompany}`;
  const requiredSkills = roleSkillMap[key] || roleSkillMap[`SDE at TCS`];

  if (!anthropic) {
    // Demo mode: Calculate matching & missing skills using pure JS comparison
    const resumeSkillsLower = resumeSkills.map(s => s.toLowerCase());
    const matchingSkills = [];
    const missingSkills = [];

    requiredSkills.forEach(reqSkill => {
      const isMatched = resumeSkillsLower.some(resSkill => 
        resSkill.includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(resSkill)
      );
      if (isMatched) {
        matchingSkills.push(reqSkill);
      } else {
        missingSkills.push(reqSkill);
      }
    });

    const readinessScore = requiredSkills.length > 0 
      ? Math.round((matchingSkills.length / requiredSkills.length) * 100)
      : 50;

    return {
      readinessScore,
      matchingSkills,
      missingSkills
    };
  }

  const systemPrompt = `You are a skill gap analyzer. Compare a candidate's skills against the requirements for a target role at a specific company.
Calculate a numeric readiness score between 0 and 100%.
Return ONLY a valid JSON object matching this schema:
{
  "readinessScore": 75,
  "matchingSkills": ["Skill A", "Skill B"],
  "missingSkills": ["Skill C", "Skill D"]
}`;

  const userPrompt = `Target Role: ${targetRole}\nTarget Company: ${targetCompany}\nCandidate Skills: ${JSON.stringify(resumeSkills)}\nRequired Reference Skills: ${JSON.stringify(requiredSkills)}`;
  return await callClaude(systemPrompt, userPrompt, true);
}

/**
 * 3. ROADMAP GENERATION
 */
export async function generateRoadmap(resumeSkills, targetRole, targetCompany, missingSkills) {
  if (!anthropic) {
    // Generate high-quality mock week-by-week study plan
    console.log('Generating mock roadmap...');
    const weeks = [];
    const gaps = missingSkills.length > 0 ? missingSkills : ['Data Structures', 'System Design', 'DBMS'];

    gaps.forEach((skill, index) => {
      const weekNum = index + 1;
      let tasks = [];
      let resources = [];

      if (skill.toLowerCase().includes('data structures') || skill.toLowerCase().includes('algorithm') || skill.toLowerCase().includes('dynamic programming')) {
        tasks = [
          'Revise Arrays, LinkedLists, Stacks and Queues',
          'Solve 15 LeetCode Easy-Medium questions on Arrays/Strings',
          'Implement Binary Search and QuickSort from scratch'
        ];
        resources = [
          { title: 'Kunal Kushwaha - DSA BootCamp (YouTube)', url: 'https://www.youtube.com/playlist?list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ' },
          { title: 'LeetCode Top Interview Questions', url: 'https://leetcode.com/problemset/all/' }
        ];
      } else if (skill.toLowerCase().includes('sql') || skill.toLowerCase().includes('dbms')) {
        tasks = [
          'Understand database indexing and normal forms (1NF, 2NF, 3NF)',
          'Practice writing complex SQL queries using JOINs, aggregations, and subqueries',
          'Solve 10 SQL practice problems on HackerRank / LeetCode'
        ];
        resources = [
          { title: 'Kudvenkat SQL Tutorial (YouTube)', url: 'https://www.youtube.com/playlist?list=PL08903FB7ACA1C2FB' },
          { title: 'SQLZoo Interactive Tutorial', url: 'https://sqlzoo.net/' }
        ];
      } else if (skill.toLowerCase().includes('system design')) {
        tasks = [
          'Study System Design fundamentals: Horizontal vs Vertical Scaling, Load Balancers, Caching',
          'Understand Database Sharding and SQL vs NoSQL systems',
          'Review architectural diagrams of systems like URL Shortener or Netflix'
        ];
        resources = [
          { title: 'Gaurav Sen - System Design Basics (YouTube)', url: 'https://www.youtube.com/playlist?list=PLMCXHnjXnJeMhs6tEyiKfFbNpYIPYdBf7' },
          { title: 'ByteByteGo System Design primer', url: 'https://bytebytego.com/' }
        ];
      } else {
        tasks = [
          `Learn foundational concepts of ${skill}`,
          `Build a mini hands-on mini-project demonstrating ${skill}`,
          `Review commonly asked technical interview questions for ${skill}`
        ];
        resources = [
          { title: `FreeCodeCamp ${skill} Full Course (YouTube)`, url: 'https://www.youtube.com/' },
          { title: `GeeksforGeeks ${skill} Tutorial Guide`, url: 'https://www.geeksforgeeks.org/' }
        ];
      }

      weeks.push({
        weekNumber: weekNum,
        title: `Week ${weekNum}: Master ${skill}`,
        description: `This week is dedicated to filling your skill gap in ${skill} specifically for the ${targetRole} expectations at ${targetCompany}.`,
        tasks: tasks.map(t => ({ text: t, completed: false })),
        resources
      });
    });

    // Ensure we always have at least a 4-week roadmap
    if (weeks.length < 4) {
      for (let w = weeks.length + 1; w <= 4; w++) {
        weeks.push({
          weekNumber: w,
          title: `Week ${w}: Mock Interviews & Aptitude Refinement`,
          description: `Polishing your interview execution, timing, and behavioral responses for ${targetCompany}.`,
          tasks: [
            { text: 'Take 2 technical mock interviews on the dashboard', completed: false },
            { text: 'Practice 20 quantitative and logical reasoning aptitude questions', completed: false },
            { text: 'Prepare response templates for top behavioral questions (using the STAR method)', completed: false }
          ],
          resources: [
            { title: 'GeeksforGeeks Aptitude Preparation', url: 'https://www.geeksforgeeks.org/aptitude-questions-and-answers/' },
            { title: 'STAR Method Interview Guide', url: 'https://www.indeed.com/career-advice/interviewing/star-method' }
          ]
        });
      }
    }

    return { weeks };
  }

  const systemPrompt = `You are a technical career coach. Generate a personalized week-by-week study roadmap based on a candidate's skill gaps for a target role and company.
Each week should focus on a specific topic. Provide actionable tasks and 2-3 genuine free resource links (like YouTube tutorials, LeetCode, or GeeksforGeeks).
Return ONLY a valid JSON object matching this schema:
{
  "weeks": [
    {
      "weekNumber": 1,
      "title": "Week 1: Topic Name",
      "description": "Brief summary of what they will achieve",
      "tasks": [
        { "text": "Task to complete (e.g. practice 15 array problems)", "completed": false }
      ],
      "resources": [
        { "title": "Resource title (e.g. FreeCodeCamp SQL Course)", "url": "https://youtube.com/..." }
      ]
    }
  ]
}
Ensure the resources are realistic and useful.`;

  const userPrompt = `Target Role: ${targetRole}\nTarget Company: ${targetCompany}\nCandidate Skills: ${JSON.stringify(resumeSkills)}\nMissing Skills: ${JSON.stringify(missingSkills)}`;
  return await callClaude(systemPrompt, userPrompt, true);
}

/**
 * 4. MOCK INTERVIEW QUESTIONS
 */
export async function generateMockQuestions(resumeSkills, targetRole, targetCompany) {
  if (!anthropic) {
    console.log('Generating mock questions...');
    return [
      { id: 1, text: `Explain how you would optimize database queries in SQL, and how index structures help. Wipro relies heavily on backend engineers who understand this.`, category: 'Technical' },
      { id: 2, text: `Can you talk about a technical project where you faced a major challenge, and what specific steps you took to resolve it?`, category: 'Technical' },
      { id: 3, text: `Tell me about yourself, and why you are interested in joining ${targetCompany} as a ${targetRole}.`, category: 'HR' },
      { id: 4, text: `How would you explain the difference between REST API and GraphQL to a non-technical manager?`, category: 'Technical' },
      { id: 5, text: `Where do you see yourself in 5 years? Describe how this role fits into your career plans.`, category: 'HR' }
    ];
  }

  const systemPrompt = `You are an interviewer. Generate 5 interview questions (3 Technical and 2 HR/Behavioral) tailored to the candidate's resume/skills, and the target role/company.
Return ONLY a valid JSON array matching this schema:
[
  { "id": 1, "text": "Question text...", "category": "Technical" },
  { "id": 2, "text": "Question text...", "category": "HR" }
]`;

  const userPrompt = `Target Role: ${targetRole}\nTarget Company: ${targetCompany}\nCandidate Skills: ${JSON.stringify(resumeSkills)}`;
  return await callClaude(systemPrompt, userPrompt, true);
}

/**
 * 5. ANSWER EVALUATION (FEEDBACK)
 */
export async function evaluateMockAnswer(question, answer) {
  if (!anthropic) {
    console.log('Evaluating mock answer...');
    const score = answer.trim().length > 100 ? 8 : (answer.trim().length > 30 ? 6 : 4);
    const rating = score >= 8 ? 'Strong' : (score >= 6 ? 'Good' : 'Needs Improvement');

    return {
      rating,
      score,
      feedback: {
        strengths: [
          'Directly addressed the question core.',
          'Gave a structured response.'
        ],
        weaknesses: [
          answer.trim().length < 100 ? 'Response is too brief. Try to use the STAR method (Situation, Task, Action, Result) to add details.' : 'Could include more technical metrics or specific technologies.',
          'Missing a concrete example of implementation.'
        ],
        suggestedAnswer: `A stronger answer would be: "When answering, frame your project with context. For example: 'In my last project, I encountered a bottleneck where SQL queries took 3 seconds due to missing indexing on the foreign key. I solved this by running EXPLAIN queries, creating a composite index, and refactoring nested subqueries into JOINs, which reduced execution time by 85%.' This shows technical mastery, structured problem-solving, and measurable results."`
      }
    };
  }

  const systemPrompt = `You are a placement interviewer. Evaluate a student's answer to an interview question and provide structured feedback and a rating.
Return ONLY a valid JSON object matching this schema:
{
  "rating": "Strong" | "Good" | "Needs Improvement",
  "score": 8, // numeric 1-10
  "feedback": {
    "strengths": ["Strength 1", "Strength 2"],
    "weaknesses": ["Improvement area 1", "Improvement area 2"],
    "suggestedAnswer": "A professional-level response exemplifying what a top candidate would say."
  }
}`;

  const userPrompt = `Question: ${question}\nCandidate's Answer: ${answer}`;
  return await callClaude(systemPrompt, userPrompt, true);
}

/**
 * 6. CONTEXT-AWARE MENTOR CHAT
 */
export async function generateChatResponse(message, chatHistory, userProfile, resumeData, currentRoadmap) {
  if (!anthropic) {
    // Generate smart mock chat responses using basic routing
    console.log('Generating mock chat response...');
    const lowerMsg = message.toLowerCase();
    const company = userProfile?.target_company || 'TCS';
    const role = userProfile?.target_role || 'SDE';

    if (lowerMsg.includes('month') || lowerMsg.includes('day') || lowerMsg.includes('time left') || lowerMsg.includes('schedule') || lowerMsg.includes('plan')) {
      return `Based on your target of landing a **${role}** role at **${company}**, here is my advice:
      
1. **Focus on Core gaps**: From your resume, make sure you have fully checked off items on your roadmap. In particular, master database schema queries and basic data structure problems.
2. **Mock practice daily**: Try taking at least one mock interview question session every two days to refine your timing and structure.
3. **Aptitude**: Many service companies (like ${company}) use cognitive/aptitude rounds. Dedicate 30 minutes daily to practice quantitative reasoning.

What specific technical topic on your roadmap would you like to review first?`;
    }

    if (lowerMsg.includes('resume') || lowerMsg.includes('cv') || lowerMsg.includes('project')) {
      return `To make your resume stronger for **${company}**:
- Make sure your projects highlight the *impact*. Instead of saying "built a React app", say "Built a React dashboard that reduced load times by 20% and improved state handling using Redux."
- Highlight skills like **SQL** and **DBMS**, as they are highly requested in technical interviews.
- Keep descriptions crisp, using action verbs like *Spearheaded*, *Optimized*, and *Refactored*.

Would you like to review how to describe one of your specific projects?`;
    }

    return `Hello! As your placement mentor, I'm here to help you prepare for **${company}** as a **${role}**. 

I have analyzed your resume, and currently, your estimated readiness score is **${userProfile?.readiness_score || 0}%**. We have a clear week-by-week study roadmap laid out.

You can ask me questions like:
- "How can I improve my resume for this role?"
- "What topics does ${company} ask most in interviews?"
- "Give me a 30-day prep strategy."
- "Explain a SQL concept."

What's on your mind today?`;
  }

  const systemPrompt = `You are a warm, encouraging, and highly expert Placement Mentor.
You are helping the student prepare for a target role at a target company.
You are context-aware of their resume skills, their target role/company, and their current roadmap.
Keep your answer concise, structured, and friendly. Avoid generalities; give specific actionable advice.
Profile: Target role = ${userProfile?.target_role || 'SDE'}, Target company = ${userProfile?.target_company || 'TCS'}, Readiness Score = ${userProfile?.readiness_score || 0}%
Skills on resume: ${JSON.stringify(resumeData?.skills || [])}
Roadmap info: ${JSON.stringify(currentRoadmap || {})}`;

  // Format history for Claude
  const messages = chatHistory.map(h => ({
    role: h.role === 'user' ? 'user' : 'assistant',
    content: h.text
  }));
  messages.push({ role: 'user', content: message });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1500,
      system: systemPrompt,
      messages,
    });
    return response.content[0].text;
  } catch (error) {
    console.error('Claude Chat error:', error);
    throw error;
  }
}

/**
 * 7. SKILL VERIFICATION QUIZ GENERATOR
 */
export async function generateSkillQuiz(skillName) {
  if (!anthropic) {
    console.log(`Generating skill verification quiz for ${skillName}...`);
    return {
      skill: skillName,
      questions: [
        {
          id: 1,
          type: 'mcq',
          question: `Which of the following is true regarding memory management in ${skillName}?`,
          options: [
            'Objects are stored on stack, primitives on heap',
            'Garbage Collector manages heap memory automatically',
            'Memory must be manually freed using free() or delete',
            'No memory allocation occurs at runtime'
          ],
          correctIndex: 1,
          explanation: 'Automatic garbage collection handles unreferenced objects on the heap memory.'
        },
        {
          id: 2,
          type: 'conceptual',
          question: `Explain how polymorphism is implemented in ${skillName} and how method overriding works at runtime.`,
          options: [
            'Dynamic method dispatch at runtime via reference lookup',
            'Static binding compile-time replacement only',
            'Macro expansion before execution',
            'Bytecode recompilation for every invocation'
          ],
          correctIndex: 0,
          explanation: 'Overridden methods are dynamically resolved at runtime using the actual object reference.'
        },
        {
          id: 3,
          type: 'debugging',
          question: `Identify the bug in this code snippet:
String s1 = new String("test");
String s2 = new String("test");
if (s1 == s2) { System.out.println("Equal"); }`,
          options: [
            'String constructor is deprecated',
            'Comparing object references with == instead of s1.equals(s2)',
            'System.out.println requires string format',
            's2 is uninitialized'
          ],
          correctIndex: 1,
          explanation: '== compares memory addresses, not string values. Use .equals() for value comparison.'
        },
        {
          id: 4,
          type: 'coding',
          question: `What will be the output of a HashMap when two distinct keys produce the exact same hashCode()?`,
          options: [
            'NullPointerException is thrown',
            'The second key overwrites the first key value',
            'Items are stored in a linked list / tree bucket under the same hash index',
            'The map capacity doubles immediately'
          ],
          correctIndex: 2,
          explanation: 'Hash collisions place entries into the same bucket (linked list or balanced tree in Java 8+).'
        }
      ]
    };
  }

  const systemPrompt = `You are a technical assessment author. Generate 4 skill verification questions (1 MCQ, 1 Conceptual, 1 Debugging, 1 Scenario/Output) for the skill "${skillName}".
Return ONLY a valid JSON object matching:
{
  "skill": "${skillName}",
  "questions": [
    {
      "id": 1,
      "type": "mcq" | "conceptual" | "debugging" | "coding",
      "question": "Question text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why Option A is correct..."
    }
  ]
}`;

  return await callClaude(systemPrompt, `Generate skill verification test for: ${skillName}`, true);
}

/**
 * 8. RESUME CLAIM VERIFICATION QUESTION GENERATOR & EVALUATOR
 */
export async function generateResumeClaimQuestions(skills = [], projects = []) {
  if (!anthropic) {
    return [
      {
        id: 1,
        claim: `Project Architecture & Tech Stack (${skills.slice(0, 3).join(', ') || 'Java, SQL'})`,
        question: `Explain your project architecture. Why did you choose ${skills[0] || 'Java'} and how did you design the database schema to handle scale?`,
        focusArea: 'Architecture & System Design'
      },
      {
        id: 2,
        claim: 'Backend Development & Exception Handling',
        question: 'How did you handle errors and exceptions in your application? Describe a complex bug you resolved during development.',
        focusArea: 'Technical Depth'
      },
      {
        id: 3,
        claim: 'Database & Performance Tuning',
        question: 'How did you optimize slow queries or data persistence in your project? What indexing strategy was used?',
        focusArea: 'Database Mastery'
      }
    ];
  }

  const systemPrompt = `You are a senior technical recruiter verifying candidate resume claims. Generate 3 deep technical verification questions for the listed skills and projects.
Return ONLY a valid JSON array:
[
  { "id": 1, "claim": "Claim title", "question": "Question text...", "focusArea": "Focus area" }
]`;

  return await callClaude(systemPrompt, `Skills: ${JSON.stringify(skills)}\nProjects: ${JSON.stringify(projects)}`, true);
}

export async function evaluateResumeClaims(answers = []) {
  if (!anthropic) {
    let score = 80;
    if (answers.some(a => a.answer && a.answer.length > 50)) score = 85;
    return {
      credibilityScore: score,
      technicalConsistency: 'High',
      strongClaims: ['Core project architecture', 'Database query execution'],
      weakClaims: ['Scalability & load balancing'],
      needsVerification: ['Cloud deployment & Docker containerization'],
      verdictMessage: 'Candidate demonstrates solid understanding of project implementation details with minor scope for cloud optimization.'
    };
  }

  const systemPrompt = `Evaluate answers to resume claim verification questions.
Return JSON:
{
  "credibilityScore": 82,
  "technicalConsistency": "High" | "Moderate" | "Low",
  "strongClaims": ["Claim 1"],
  "weakClaims": ["Claim 2"],
  "needsVerification": ["Claim 3"],
  "verdictMessage": "Summary..."
}`;

  return await callClaude(systemPrompt, `Answers: ${JSON.stringify(answers)}`, true);
}

/**
 * 9. PROJECT PORTFOLIO ANALYZER
 */
export async function analyzeProjectPortfolio(projectName, description, techStack, githubUrl = '', liveUrl = '') {
  if (!anthropic) {
    return {
      projectScore: 84,
      technicalDepth: 'Strong',
      innovation: 'Good',
      resumeValue: 'High',
      interviewReadiness: 80,
      architectureQuality: 'Well Structured',
      technologyRelevance: 'Industry Standard',
      strengths: [
        'Uses standard multi-tier architecture pattern',
        'Relevant tech stack (React, Node/Express, Database persistence)',
        'Clear problem statement and solution scope'
      ],
      weaknesses: [
        'Lacks automated unit/integration test coverage details',
        'Could include explicit caching mechanism (Redis) for scalability'
      ],
      missingAreas: [
        'CI/CD pipeline configuration',
        'API documentation / Swagger OpenAPI spec'
      ],
      potentialInterviewQuestions: [
        `Why did you choose ${techStack} over alternative frameworks?`,
        `How do you secure user authentication and API endpoints in ${projectName}?`,
        `If traffic increases by 10x, what is the first bottleneck in ${projectName} and how would you resolve it?`
      ],
      improvementSuggestions: [
        'Add a Dockerfile and GitHub Actions workflow for automated testing.',
        'Include measurable metrics in resume bullet points (e.g. "Reduced API latency by 35%").'
      ]
    };
  }

  const systemPrompt = `You are a Principal Software Architect. Analyze a software project portfolio entry and evaluate its depth, resume impact, and interview readiness.
Return ONLY JSON:
{
  "projectScore": 85,
  "technicalDepth": "Strong",
  "innovation": "Good",
  "resumeValue": "High",
  "interviewReadiness": 82,
  "architectureQuality": "Well Structured",
  "technologyRelevance": "High",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "missingAreas": ["..."],
  "potentialInterviewQuestions": ["..."],
  "improvementSuggestions": ["..."]
}`;

  const userPrompt = `Project Name: ${projectName}\nDescription: ${description}\nTech Stack: ${techStack}\nGitHub: ${githubUrl}\nLive URL: ${liveUrl}`;
  return await callClaude(systemPrompt, userPrompt, true);
}

/**
 * 10. AI CODING EVALUATOR
 */
export async function evaluateCodingSolution(problemTitle, code, language = 'java') {
  if (!anthropic) {
    const isPython = language.toLowerCase() === 'python';
    const codeLen = code.trim().length;
    const passes = codeLen > 40 ? 5 : 2;
    const total = 5;
    const score = Math.round((passes / total) * 100);

    return {
      status: passes === total ? 'Accepted' : 'Partial Acceptance',
      score,
      testCasesPassed: passes,
      totalTestCases: total,
      runtimeMs: Math.floor(Math.random() * 30) + 15,
      memoryMb: 36.4,
      timeComplexity: isPython ? 'O(N log N)' : 'O(N)',
      spaceComplexity: 'O(N)',
      codeQuality: score >= 80 ? 'Excellent' : 'Needs Optimization',
      feedback: score >= 80 
        ? 'Great solution! Clean variable naming, optimal time complexity, and correct handling of boundary test cases.' 
        : 'Solution handles basic inputs but misses edge cases (empty array, null checks, large integer overflow).'
    };
  }

  const systemPrompt = `You are a competitive programming judge. Evaluate a student's code submission for a coding problem.
Return ONLY JSON:
{
  "status": "Accepted" | "Wrong Answer" | "Time Limit Exceeded",
  "score": 85,
  "testCasesPassed": 5,
  "totalTestCases": 5,
  "runtimeMs": 28,
  "memoryMb": 38.2,
  "timeComplexity": "O(N)",
  "spaceComplexity": "O(1)",
  "codeQuality": "Clean and idiomatic",
  "feedback": "Detailed feedback..."
}`;

  return await callClaude(systemPrompt, `Problem: ${problemTitle}\nLanguage: ${language}\nCode:\n${code}`, true);
}

/**
 * 11. COMPANY PLACEMENT SIMULATION EVALUATOR
 */
export async function evaluateSimulationRound(company, roundName, submissionData) {
  if (!anthropic) {
    const score = Math.min(95, Math.max(50, Math.floor(Math.random() * 25) + 70));
    return {
      roundName,
      score,
      passed: score >= 60,
      feedback: `Demonstrated solid proficiency in ${roundName} for ${company} recruitment requirements.`,
      keyTakeaway: score >= 80 ? 'Strong performance across all evaluated sections.' : 'Focus on time management in future rounds.'
    };
  }

  const systemPrompt = `You are an evaluation engine for recruitment round simulations. Evaluate the student's submission.
Return ONLY JSON:
{
  "roundName": "${roundName}",
  "score": 80,
  "passed": true,
  "feedback": "Summary...",
  "keyTakeaway": "Key advice..."
}`;

  return await callClaude(systemPrompt, `Company: ${company}\nRound: ${roundName}\nSubmission: ${JSON.stringify(submissionData)}`, true);
}

/**
 * 12. RESUME <-> JOB DESCRIPTION MATCHING (FEATURE 16)
 */
export async function matchResumeWithJobDescription(resumeText, jobDescription) {
  if (!anthropic) {
    const jdLower = (jobDescription || '').toLowerCase();
    const resumeLower = (resumeText || '').toLowerCase();

    const techCatalog = [
      'java', 'python', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust',
      'react', 'angular', 'vue', 'node', 'express', 'spring boot', 'django', 'flask',
      'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'git', 'microservices',
      'system design', 'rest api', 'graphql', 'dsa', 'unit testing', 'kafka'
    ];

    const jdSkills = techCatalog.filter(s => jdLower.includes(s));
    const matchedSkills = jdSkills.filter(s => resumeLower.includes(s));
    const missingSkills = jdSkills.filter(s => !resumeLower.includes(s));

    const totalJdSkills = jdSkills.length > 0 ? jdSkills.length : 6;
    const matchRatio = totalJdSkills > 0 ? matchedSkills.length / totalJdSkills : 0.7;
    const matchScore = Math.min(98, Math.max(45, Math.round(matchRatio * 100)));

    const capitalize = (str) => str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return {
      overallMatch: matchScore,
      atsScore: Math.min(95, matchScore + 5),
      matchedSkills: matchedSkills.map(capitalize),
      missingSkills: missingSkills.map(capitalize),
      skillPriority: missingSkills.slice(0, 3).map((s, idx) => ({
        skill: capitalize(s),
        priority: idx === 0 ? 'CRITICAL' : 'HIGH',
        importance: 'Appears multiple times in requirements and core job responsibilities.'
      })),
      resumeImprovements: [
        'Add quantifiable metrics for your top engineering projects (e.g. "Reduced query response time by 40%").',
        `Incorporate missing target keywords explicitly in your Technical Skills section (${missingSkills.slice(0, 3).map(capitalize).join(', ')}).`,
        'Ensure bullet points start with strong action verbs (Architected, Engineered, Implemented, Deployed).'
      ],
      recommendedLearning: missingSkills.slice(0, 4).map(s => `Build a mini-project or implement a feature using ${capitalize(s)}.`),
      interviewQuestions: [
        `How have you used ${matchedSkills[0] ? capitalize(matchedSkills[0]) : 'your primary tech stack'} in real-world production environments?`,
        `The role requires ${missingSkills[0] ? capitalize(missingSkills[0]) : 'modern architectures'}. How would you quickly ramp up and apply it here?`,
        'Explain how you design fault-tolerant and scalable REST APIs.'
      ]
    };
  }

  const systemPrompt = `You are an expert technical recruiter and ATS specialist. Compare a candidate's resume against a target job description.
Return ONLY valid JSON matching this schema:
{
  "overallMatch": 78,
  "atsScore": 82,
  "matchedSkills": ["Java", "SQL", "Git", "Spring Boot"],
  "missingSkills": ["Docker", "AWS", "Microservices"],
  "skillPriority": [
    {"skill": "Microservices", "priority": "CRITICAL", "importance": "Core architecture requirement"},
    {"skill": "Docker", "priority": "HIGH", "importance": "Required for CI/CD deployment"}
  ],
  "resumeImprovements": [
    "Add measurable project impact",
    "Improve project descriptions with action verbs",
    "Add missing core keywords"
  ],
  "recommendedLearning": [
    "Learn Docker containerization fundamentals",
    "Build a Spring Boot microservice with API Gateway"
  ],
  "interviewQuestions": [
    "Question 1 tailored to JD gap",
    "Question 2 tailored to candidate strengths"
  ]
}`;

  return await callClaude(systemPrompt, `Resume:\n${resumeText}\n\nJob Description:\n${jobDescription}`, true);
}

/**
 * 13. PROJECT INTERVIEW DEFENSE SIMULATOR (FEATURE 17)
 */
export async function generateProjectDefenseQuestion(project, previousRounds = []) {
  const roundNum = previousRounds.length + 1;

  if (!anthropic) {
    const questionsPool = [
      {
        question: `Why did you choose ${project.tech_stack || 'this tech stack'} for ${project.project_name || 'this project'} instead of alternative architectures?`,
        aspect: 'Architectural Decisions & Tech Stack Trade-offs',
        expectedPoints: ['Specific performance trade-offs', 'Ecosystem maturity', 'Developer velocity']
      },
      {
        question: `If ${project.project_name || 'your application'} receives 100,000 concurrent user requests suddenly, where will it break first and how will you scale it?`,
        aspect: 'Scalability, Concurrency & Bottleneck Analysis',
        expectedPoints: ['Database connection limits', 'Caching layer (Redis)', 'Stateless horizontal scaling']
      },
      {
        question: `How do you handle database transactions, data integrity, and potential race conditions in ${project.project_name || 'your system'}?`,
        aspect: 'Data Integrity, Locking & Concurrency',
        expectedPoints: ['ACID transactions', 'Optimistic/pessimistic locking', 'Idempotency']
      },
      {
        question: `Describe the end-to-end security architecture of ${project.project_name || 'this project'}. How do you prevent authentication bypass and SQL injection?`,
        aspect: 'Security Architecture & Vulnerability Defense',
        expectedPoints: ['JWT verification with expiration', 'Parameterized queries/ORMs', 'CORS & rate limiting']
      }
    ];

    const selected = questionsPool[(roundNum - 1) % questionsPool.length];
    return {
      roundNumber: roundNum,
      question: selected.question,
      aspect: selected.aspect,
      expectedPoints: selected.expectedPoints
    };
  }

  const systemPrompt = `You are a Principal Engineer and Tough Technical Interviewer conducting a Project Defense interview round.
Given the candidate's project details, generate a deep probing technical architecture question.
Return ONLY JSON:
{
  "roundNumber": ${roundNum},
  "question": "Deep technical probing question...",
  "aspect": "Architecture / Scalability / Concurrency / Security",
  "expectedPoints": ["Key point 1", "Key point 2"]
}`;

  return await callClaude(systemPrompt, `Project: ${JSON.stringify(project)}\nPrevious Rounds: ${JSON.stringify(previousRounds)}`, true);
}

export async function evaluateProjectDefenseAnswer(project, question, answer) {
  if (!anthropic) {
    const words = (answer || '').trim().split(/\s+/).length;
    let technicalDepth = words > 60 ? 8 : (words > 30 ? 6 : 4);
    let clarity = words > 40 ? 8 : 6;
    let architectureUnderstanding = words > 50 ? 8 : 5;

    const overallRating = Math.round(((technicalDepth + clarity + architectureUnderstanding) / 30) * 100);

    return {
      scores: {
        technicalDepth: `${technicalDepth}/10`,
        clarity: `${clarity}/10`,
        architectureUnderstanding: `${architectureUnderstanding}/10`,
        overallScore: overallRating
      },
      verdict: overallRating >= 70 ? 'Strong Defense' : 'Needs Greater Architectural Depth',
      strengths: [
        'Recognized the architectural context of the question',
        'Communicated the core flow with reasonable clarity'
      ],
      areasForImprovement: [
        'Quantify performance metrics or database throughput benchmarks',
        'Mention concrete failure recovery and monitoring strategies'
      ],
      followUpQuestion: `What specific metrics or alerts would you monitor in production to detect failures early in ${project.project_name || 'this system'}?`
    };
  }

  const systemPrompt = `You are an expert technical interviewer evaluating a student's answer to a project architecture defense question.
Return ONLY JSON:
{
  "scores": {
    "technicalDepth": "8/10",
    "clarity": "7/10",
    "architectureUnderstanding": "7/10",
    "overallScore": 75
  },
  "verdict": "Strong Defense / Moderate Defense / Weak Defense",
  "strengths": ["Strength 1"],
  "areasForImprovement": ["Improvement 1"],
  "followUpQuestion": "A sharp follow-up probing question..."
}`;

  return await callClaude(systemPrompt, `Project: ${JSON.stringify(project)}\nQuestion: ${question}\nCandidate Answer:\n${answer}`, true);
}

/**
 * 14. CODING WEAKNESS PROFILER (FEATURE 18)
 */
export async function getCodingWeaknessProfile(submissions = []) {
  const defaultTopics = [
    { topic: 'Arrays & Two Pointers', score: 82, status: 'Strong', solved: 14, total: 16 },
    { topic: 'Strings & Parsing', score: 76, status: 'Strong', solved: 10, total: 12 },
    { topic: 'HashMaps & Sets', score: 68, status: 'Moderate', solved: 7, total: 10 },
    { topic: 'Linked Lists', score: 65, status: 'Moderate', solved: 5, total: 8 },
    { topic: 'Binary Trees & BST', score: 48, status: 'Weak', solved: 4, total: 10 },
    { topic: 'Recursion & Backtracking', score: 42, status: 'Weak', solved: 3, total: 8 },
    { topic: 'Dynamic Programming', score: 30, status: 'Critical Weakness', solved: 2, total: 9 },
    { topic: 'Graphs & BFS/DFS', score: 25, status: 'Critical Weakness', solved: 1, total: 8 }
  ];

  if (submissions.length > 0) {
    // Dynamically adjust topic scores based on actual submissions
    const passedCount = submissions.filter(s => s.status === 'Accepted').length;
    const passRatio = submissions.length > 0 ? passedCount / submissions.length : 0.6;
    defaultTopics[0].score = Math.min(95, Math.round(75 + passRatio * 20));
  }

  const weakestTopics = defaultTopics.filter(t => t.score < 60).sort((a, b) => a.score - b.score);

  return {
    topicBreakdown: defaultTopics,
    weakestTopics,
    recommendedNextProblems: [
      { id: 'rec1', title: 'Lowest Common Ancestor in Binary Tree', topic: 'Binary Trees', difficulty: 'Medium', impact: '+6 DSA Score' },
      { id: 'rec2', title: 'Subarray Sum Equals K', topic: 'HashMaps & Prefix Sum', difficulty: 'Medium', impact: '+5 DSA Score' },
      { id: 'rec3', title: 'Coin Change (Minimum Coins)', topic: 'Dynamic Programming', difficulty: 'Medium', impact: '+8 DSA Score' }
    ]
  };
}

/**
 * 15. INTERVIEW WEAKNESS MEMORY (FEATURE 15)
 */
export async function getInterviewWeaknessMemory(userId, mockHistory = []) {
  const commonWeaknesses = [
    {
      topic: 'Java Collections & Concurrency',
      category: 'Core Java',
      detectedCount: 3,
      lastMistake: 'Confusion between ConcurrentHashMap bucket locking and synchronized map.',
      recommendation: 'Review Java 8 ConcurrentHashMap CAS operations and ReadWriteLocks.',
      severity: 'HIGH'
    },
    {
      topic: 'Database Indexing & B-Trees',
      category: 'Databases & SQL',
      detectedCount: 2,
      lastMistake: 'Could not explain composite index column ordering rules.',
      recommendation: 'Study Leftmost Prefix Rule and Clustered vs Non-Clustered Indexes.',
      severity: 'MEDIUM'
    },
    {
      topic: 'Time Complexity of Recursive Tree Traversal',
      category: 'Algorithms',
      detectedCount: 2,
      lastMistake: 'Estimated recursion stack space as O(1) instead of O(Height).',
      recommendation: 'Practice analyzing call stack memory for DFS & BFS algorithms.',
      severity: 'MEDIUM'
    }
  ];

  return {
    repeatedWeaknesses: commonWeaknesses,
    remediationPlan: [
      'Prioritize ConcurrentHashMap questions in your next mock interview session.',
      'Solve 2 tree recursion problems with explicit auxiliary space diagrams.',
      'Review SQL EXPLAIN queries and composite indexing.'
    ]
  };
}

/**
 * 16. CONTEXT-AWARE AI MENTOR CHAT (FEATURE 20)
 */
export async function generateContextAwareMentorResponse(userPrompt, studentContext = {}) {
  const {
    readiness = 72,
    targetRole = 'SDE',
    targetCompany = 'TCS',
    weakestArea = 'DSA & Coding',
    topBlocker = 'Binary Trees & Dynamic Programming',
    dailyHours = 4,
    userName = 'Student'
  } = studentContext;

  if (!anthropic) {
    const promptLower = (userPrompt || '').toLowerCase();

    if (promptLower.includes('study today') || promptLower.includes('what should i do') || promptLower.includes('schedule') || promptLower.includes('today')) {
      return `### 🎯 Targeted Placement Plan for Today

Hello ${userName}! Based on your current **${readiness}/100 Placement Readiness** and target role as **${targetRole} at ${targetCompany}**:

Your highest-leverage gap is **${weakestArea}** (specifically ${topBlocker}). Here is your personalized daily allocation:

1. **⏱ 30 mins — DSA Problem Solving**: Solve 2 Medium problems on *Binary Tree Traversals* & *HashMaps*.
2. **⏱ 25 mins — Core Technical Review**: Study *Database Indexing (B-Trees)* and *Java OOP / Concurrency*.
3. **⏱ 20 mins — Project Defense Prep**: Formulate concise answers for why you chose your tech stack.
4. **⏱ 15 mins — Quick Aptitude / Speed Math**: Practice 5 speed-distance-time drills.

> **💡 Mentor Tip**: Clearing your DSA blocker will increase your readiness score from **${readiness}% to ${Math.min(100, readiness + 7)}%** within 2 weeks!`;
    }

    if (promptLower.includes('block') || promptLower.includes('prevent') || promptLower.includes('weak')) {
      return `### 🛑 Your Top Placement Blockers

Looking at your active profile metrics:
1. **${weakestArea}**: Your problem solving accuracy is below target thresholds for tier-1 tech interviews.
2. **Project Architectural Depth**: Need clearer articulation of scalability trade-offs.
3. **ATS Keywords**: Tailor your resume explicitly to match **${targetCompany}** job listings.

Start by tackling the **Daily Mission** in your dashboard to systematically resolve these blockers!`;
    }

    return `### 🚀 Placement Strategy for ${targetRole} @ ${targetCompany}

Hello ${userName}! I am tracking your placement progress:
- **Overall Readiness**: ${readiness}/100
- **Target Company**: ${targetCompany}
- **Priority Focus**: ${weakestArea}

How can I help you today? You can ask me:
- *"What should I study today?"*
- *"Simulate an interview question for ${targetCompany}"*
- *"How do I explain my project architecture?"*
- *"What are the top hiring rounds for ${targetCompany}?"*`;
  }

  const systemPrompt = `You are the Lead 24/7 AI Placement Mentor and Career Coach for engineering students.
Student Context:
- Name: ${userName}
- Overall Placement Readiness: ${readiness}/100
- Target Role: ${targetRole}
- Target Company: ${targetCompany}
- Weakest Area: ${weakestArea}
- Active Blocker: ${topBlocker}
- Available Daily Hours: ${dailyHours}`;

  return await callClaude(systemPrompt, userPrompt, false);
}

