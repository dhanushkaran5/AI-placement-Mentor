import pdf from 'pdf-parse';
import multer from 'multer';
import { run, get } from '../config/db.js';
import { parseResumeText, compareSkillsAndScore, matchResumeWithJobDescription } from '../services/aiService.js';

// Configure multer for memory storage uploads
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF resumes are supported.'));
    }
  }
}).single('resume');

export const uploadAndParse = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please upload a PDF file.' });
  }

  try {
    console.log('Extracting text from PDF...');
    let text = '';
    
    try {
      const pdfData = await pdf(req.file.buffer);
      text = pdfData.text;
    } catch (pdfErr) {
      console.warn('PDF parsing error, falling back to raw buffer string conversion:', pdfErr);
      text = req.file.buffer.toString('utf-8');
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Unable to extract text from the PDF. Ensure it contains selectable text.' });
    }

    console.log('Parsing text with AI service...');
    const parsedData = await parseResumeText(text);

    // Fetch user profile to match skills immediately
    const profile = await get('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id]);
    const targetRole = profile?.target_role || 'SDE';
    const targetCompany = profile?.target_company || 'TCS';

    console.log(`Calculating skill gaps for ${targetRole} at ${targetCompany}...`);
    const gapAnalysis = await compareSkillsAndScore(parsedData.skills || [], targetRole, targetCompany);

    // Save structured resume to database
    const existingResume = await get('SELECT * FROM resumes WHERE user_id = ?', [req.user.id]);
    
    if (existingResume) {
      await run(
        `UPDATE resumes 
         SET raw_text = ?, skills = ?, education = ?, experience = ?, cgpa = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ?`,
        [
          text,
          JSON.stringify(parsedData.skills || []),
          JSON.stringify(parsedData.education || []),
          JSON.stringify(parsedData.experience || []),
          parsedData.cgpa || null,
          req.user.id
        ]
      );
    } else {
      await run(
        `INSERT INTO resumes (user_id, raw_text, skills, education, experience, cgpa) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          text,
          JSON.stringify(parsedData.skills || []),
          JSON.stringify(parsedData.education || []),
          JSON.stringify(parsedData.experience || []),
          parsedData.cgpa || null
        ]
      );
    }

    // Update profile with new readiness score
    await run(
      'UPDATE user_profiles SET readiness_score = ? WHERE user_id = ?',
      [gapAnalysis.readinessScore, req.user.id]
    );

    // Log progress activity
    await run(
      'INSERT INTO progress_logs (user_id, activity_type, description, metric_value) VALUES (?, ?, ?, ?)',
      [req.user.id, 'resume_upload', 'Uploaded and parsed resume', gapAnalysis.readinessScore]
    );

    res.json({
      message: 'Resume parsed and analyzed successfully.',
      parsedResume: parsedData,
      gapAnalysis
    });
  } catch (error) {
    console.error('Resume upload/parse error:', error);
    res.status(500).json({ error: error.message || 'Internal server error parsing resume.' });
  }
};

export const getResume = async (req, res) => {
  try {
    const resume = await get('SELECT * FROM resumes WHERE user_id = ?', [req.user.id]);
    
    if (!resume) {
      return res.status(404).json({ message: 'No resume uploaded yet.' });
    }

    res.json({
      raw_text: resume.raw_text,
      skills: JSON.parse(resume.skills || '[]'),
      education: JSON.parse(resume.education || '[]'),
      experience: JSON.parse(resume.experience || '[]'),
      cgpa: resume.cgpa,
      updated_at: resume.updated_at
    });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ error: 'Internal server error fetching resume.' });
  }
};

export const getGapAnalysis = async (req, res) => {
  try {
    const profile = await get('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id]);
    if (!profile || !profile.target_role || !profile.target_company) {
      return res.status(400).json({ error: 'Please set your target role and company first.' });
    }

    const resume = await get('SELECT * FROM resumes WHERE user_id = ?', [req.user.id]);
    const resumeSkills = resume ? JSON.parse(resume.skills || '[]') : [];

    const gaps = await compareSkillsAndScore(resumeSkills, profile.target_role, profile.target_company);
    res.json(gaps);
  } catch (error) {
    console.error('Get gap analysis error:', error);
    res.status(500).json({ error: 'Internal server error calculating skill gaps.' });
  }
};

/**
 * Match Resume with Job Description (Feature 16)
 */
export const matchWithJobDescription = async (req, res) => {
  const { jobDescription, customResumeText } = req.body;

  if (!jobDescription || jobDescription.trim().length === 0) {
    return res.status(400).json({ error: 'Job description text is required.' });
  }

  try {
    let resumeContent = customResumeText;

    if (!resumeContent) {
      const storedResume = await get('SELECT * FROM resumes WHERE user_id = ?', [req.user.id]);
      resumeContent = storedResume?.raw_text || (storedResume?.skills ? JSON.parse(storedResume.skills).join(', ') : 'Java, SQL, React, Node.js, DSA');
    }

    const matchResults = await matchResumeWithJobDescription(resumeContent, jobDescription);
    res.json(matchResults);
  } catch (error) {
    console.error('Match Job Description error:', error);
    res.status(500).json({ error: error.message || 'Internal server error matching resume with job description.' });
  }
};
