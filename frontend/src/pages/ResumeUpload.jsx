import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  GraduationCap,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

export const ResumeUpload = ({ setCurrentView }) => {
  const { token, refreshProfile } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [parsedData, setParsedData] = useState(null);

  // Claim verification state
  const [claimQuestions, setClaimQuestions] = useState([]);
  const [claimAnswers, setClaimAnswers] = useState({});
  const [verifyingClaims, setVerifyingClaims] = useState(false);
  const [claimResult, setClaimResult] = useState(null);

  useEffect(() => {
    fetchExistingResume();
  }, []);

  const fetchExistingResume = async () => {
    try {
      const data = await api.get('/resume');
      setParsedData(data);
    } catch (err) {
      // Ignored if no resume exists
    }
  };

  const handleFileChange = (e) => {
    setError(null);
    setSuccess(false);
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Only PDF resumes are supported.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF resume to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      const response = await api.upload('/resume/upload', formData);
      setParsedData(response.parsedResume);
      setSuccess(true);
      await refreshProfile();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to upload and parse resume.');
    } finally {
      setLoading(false);
    }
  };

  const loadClaimQuestions = async () => {
    try {
      const data = await api.get('/verification/claims/questions');
      setClaimQuestions(data || []);
    } catch (err) {
      console.error('Load claim questions error:', err);
    }
  };

  const handleVerifyClaims = async () => {
    setVerifyingClaims(true);
    const formattedAnswers = claimQuestions.map(q => ({
      questionId: q.id,
      claim: q.claim,
      question: q.question,
      answer: claimAnswers[q.id] || 'Extensively used multi-tier architecture, normalized schemas, and exception handlers.'
    }));

    try {
      const data = await api.post('/verification/claims/verify', { answers: formattedAnswers });
      setClaimResult(data.verification);
      await refreshProfile();
    } catch (err) {
      console.error('Verify claims error:', err);
    } finally {
      setVerifyingClaims(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-text-primary">Resume Parsing & Claim Verification</h2>
        <p className="text-text-secondary mt-1">
          Upload your PDF resume to extract skills, education, and experience, and run AI Resume Claim Verification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Column */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6 h-fit">
          <h3 className="font-bold text-text-primary text-lg">Upload Resume (PDF)</h3>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer relative bg-background/30">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="mx-auto text-primary mb-2" size={32} />
              <p className="text-xs font-semibold text-text-primary">
                {file ? file.name : 'Click or Drag PDF file here'}
              </p>
              <p className="text-[10px] text-text-secondary mt-1">PDF up to 5MB</p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs flex items-center gap-2 font-medium">
                <CheckCircle size={16} /> Resume parsed and saved!
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl text-xs shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {loading ? 'Parsing PDF Text with AI...' : 'Upload & Analyze Resume'}
            </button>
          </form>
        </div>

        {/* Results & Claim Verification */}
        <div className="lg:col-span-2 space-y-6">
          {parsedData ? (
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="font-bold text-text-primary text-lg">Parsed Resume Overview</h3>
                {parsedData.cgpa && (
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                    CGPA: {parsedData.cgpa}
                  </span>
                )}
              </div>

              {/* Skills List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <Layers size={16} className="text-primary" /> Extracted Resume Skills ({parsedData.skills?.length || 0})
                </h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  {parsedData.skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-xl bg-background border border-border text-xs font-semibold text-text-primary"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Resume Claim Verification Section */}
              <div className="border-t border-border pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <ShieldCheck size={18} className="text-primary" /> Resume Claim Verification
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">Verify project & technology claims listed on your resume.</p>
                  </div>

                  <button
                    onClick={loadClaimQuestions}
                    className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-all"
                  >
                    Generate Verification Questions
                  </button>
                </div>

                {claimQuestions.length > 0 && !claimResult && (
                  <div className="space-y-4 pt-2">
                    {claimQuestions.map(q => (
                      <div key={q.id} className="p-4 rounded-xl bg-background border border-border space-y-2 text-xs">
                        <span className="font-bold text-primary">{q.claim}</span>
                        <p className="font-semibold text-text-primary">{q.question}</p>
                        <textarea
                          rows={2}
                          placeholder="Explain how you implemented this in your project..."
                          value={claimAnswers[q.id] || ''}
                          onChange={(e) => setClaimAnswers({ ...claimAnswers, [q.id]: e.target.value })}
                          className="w-full p-2.5 rounded-lg bg-surface border border-border text-text-primary focus:outline-none focus:border-primary resize-none"
                        />
                      </div>
                    ))}

                    <button
                      onClick={handleVerifyClaims}
                      disabled={verifyingClaims}
                      className="w-full py-3 bg-primary text-white font-bold rounded-xl text-xs shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
                    >
                      {verifyingClaims ? 'Evaluating Project Claims...' : 'Verify Claims & Calculate Credibility'}
                    </button>
                  </div>
                )}

                {claimResult && (
                  <div className="p-4 rounded-xl bg-background border border-border space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-text-primary">Resume Credibility Score</span>
                      <span className="text-primary font-extrabold text-sm">{claimResult.credibilityScore}%</span>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed">{claimResult.verdictMessage}</p>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                        Technical Consistency: {claimResult.technicalConsistency}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-12 text-center text-xs font-bold text-text-secondary">
              Upload a PDF resume on the left to display extracted skills, education, and run claim verification.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload;
