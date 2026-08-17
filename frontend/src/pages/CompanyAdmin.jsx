import React, { useState, useEffect } from 'react';
import api from '../services/api';
import CompanyLogo from '../components/CompanyLogo';
import {
  Building2,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
  Layers,
  Briefcase,
  Search,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function CompanyAdmin({ setCurrentView }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [error, setError] = useState(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    category: 'IT / SERVICE',
    description: '',
    website: '',
    logo: '',
    industry: 'Technology',
    headquarters: 'India',
    difficulty: 'Medium',
    roleTitle: 'Software Engineer',
    techSkills: 'Java, SQL, Data Structures',
    progLangs: 'Java, Python',
    frameworks: 'Spring Boot',
    dbSkills: 'MySQL',
    dsaImportance: 'HIGH',
    assessmentName: 'National Hiring Drive',
    assessmentStages: 'Aptitude, Coding, Interview',
    interviewRounds: 'Technical Round, HR Round'
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/company/list');
      setCompanies(res);
    } catch (err) {
      console.error('Error fetching companies for admin:', err);
      setError('Failed to load companies database for administration.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const payload = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        website: formData.website,
        logo: formData.logo || formData.name.substring(0, 4).toUpperCase(),
        industry: formData.industry,
        headquarters: formData.headquarters,
        difficulty: formData.difficulty,
        roles: [
          {
            id: `${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-role-1`,
            title: formData.roleTitle,
            requirements: {
              technicalSkills: formData.techSkills.split(',').map(s => s.trim()),
              programmingLanguages: formData.progLangs.split(',').map(s => s.trim()),
              frameworks: formData.frameworks.split(',').map(s => s.trim()),
              databaseSkills: formData.dbSkills.split(',').map(s => s.trim()),
              dsaImportance: formData.dsaImportance,
              aptitudeImportance: 'HIGH',
              communicationImportance: 'MEDIUM',
              projectsImportance: 'HIGH',
              systemDesignImportance: 'MEDIUM',
              cloudImportance: 'LOW',
              testingImportance: 'LOW',
              experienceLevel: 'Entry Level'
            }
          }
        ],
        assessmentPattern: {
          name: formData.assessmentName,
          stages: formData.assessmentStages.split(',').map(s => s.trim()),
          timings: '120 minutes',
          focusAreas: ['Coding', 'Aptitude']
        },
        interviewPattern: {
          rounds: formData.interviewRounds.split(',').map(s => s.trim()),
          format: 'Technical & HR Loops',
          focusAreas: ['CS Fundamentals', 'Coding Logic']
        },
        preparationTopics: formData.techSkills.split(',').map(s => s.trim())
      };

      await api.post('/company/admin/add', payload);
      alert(`Company "${formData.name}" created successfully without frontend code changes!`);
      setShowAddModal(false);
      fetchCompanies();
    } catch (err) {
      console.error('Error adding company:', err);
      setError(err.error || err.message || 'Failed to add company.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.delete(`/company/admin/delete/${id}`);
      alert(`Company ${name} deleted successfully.`);
      fetchCompanies();
    } catch (err) {
      console.error('Error deleting company:', err);
      alert('Failed to delete company.');
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-surface border border-border p-6 rounded-2xl shadow-subtle flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-2">
            <ShieldCheck size={14} /> Scalable Multi-Company Engine Admin
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            Company Data Administration
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Add, modify, or delete companies, roles, and skill requirements live in database without frontend deployments.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-hover transition-all flex items-center gap-2"
        >
          <PlusCircle size={16} /> Add New Company Live
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-surface border border-border p-4 rounded-2xl shadow-subtle">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-text-secondary" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company database by name or category..."
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <PlusCircle size={18} className="text-primary" /> Add New Company (Structured Data)
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-text-secondary hover:text-text-primary font-bold">
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-danger/5 border border-danger/20 rounded-lg text-danger text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateCompany} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-text-primary block mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Stripe"
                    className="w-full p-2.5 bg-background border border-border rounded-xl text-text-primary"
                  />
                </div>

                <div>
                  <label className="font-bold text-text-primary block mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 bg-background border border-border rounded-xl text-text-primary font-semibold"
                  >
                    <option value="IT / SERVICE">IT / SERVICE</option>
                    <option value="PRODUCT / TECHNOLOGY">PRODUCT / TECHNOLOGY</option>
                    <option value="INDIAN PRODUCT / TECHNOLOGY">INDIAN PRODUCT / TECHNOLOGY</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-text-primary block mb-1">Industry</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="e.g., Fintech & Payments"
                    className="w-full p-2.5 bg-background border border-border rounded-xl text-text-primary"
                  />
                </div>

                <div>
                  <label className="font-bold text-text-primary block mb-1">Hiring Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full p-2.5 bg-background border border-border rounded-xl text-text-primary font-semibold"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Very Hard">Very Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-text-primary block mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Overview of company technology and hiring focus..."
                  rows={2}
                  className="w-full p-2.5 bg-background border border-border rounded-xl text-text-primary"
                ></textarea>
              </div>

              {/* Role & Skills Data */}
              <div className="border-t border-border pt-3 space-y-3">
                <h4 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                  <Briefcase size={14} className="text-primary" /> Initial Role & Skill Requirements
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-text-primary block mb-1">Role Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.roleTitle}
                      onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                      placeholder="e.g., Software Development Engineer"
                      className="w-full p-2.5 bg-background border border-border rounded-xl text-text-primary"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-text-primary block mb-1">DSA Importance</label>
                    <select
                      value={formData.dsaImportance}
                      onChange={(e) => setFormData({ ...formData, dsaImportance: e.target.value })}
                      className="w-full p-2.5 bg-background border border-border rounded-xl text-text-primary font-semibold"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="VERY HIGH">VERY HIGH</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-text-primary block mb-1">Required Technical Skills (Comma separated)</label>
                  <input
                    type="text"
                    value={formData.techSkills}
                    onChange={(e) => setFormData({ ...formData, techSkills: e.target.value })}
                    placeholder="Java, SQL, Data Structures, OOP"
                    className="w-full p-2.5 bg-background border border-border rounded-xl text-text-primary"
                  />
                </div>

                <div>
                  <label className="font-bold text-text-primary block mb-1">Programming Languages (Comma separated)</label>
                  <input
                    type="text"
                    value={formData.progLangs}
                    onChange={(e) => setFormData({ ...formData, progLangs: e.target.value })}
                    placeholder="Java, Python, C++"
                    className="w-full p-2.5 bg-background border border-border rounded-xl text-text-primary"
                  />
                </div>
              </div>

              {/* Assessment & Interview Patterns */}
              <div className="border-t border-border pt-3 space-y-3">
                <h4 className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                  <Layers size={14} className="text-secondary" /> Recruitment Patterns
                </h4>

                <div>
                  <label className="font-bold text-text-primary block mb-1">Assessment Drive Name</label>
                  <input
                    type="text"
                    value={formData.assessmentName}
                    onChange={(e) => setFormData({ ...formData, assessmentName: e.target.value })}
                    placeholder="e.g., Stripe Coding Assessment"
                    className="w-full p-2.5 bg-background border border-border rounded-xl text-text-primary"
                  />
                </div>

                <div>
                  <label className="font-bold text-text-primary block mb-1">Selection Stages (Comma separated)</label>
                  <input
                    type="text"
                    value={formData.assessmentStages}
                    onChange={(e) => setFormData({ ...formData, assessmentStages: e.target.value })}
                    placeholder="Cognitive Aptitude, Coding Challenge, Technical Interview"
                    className="w-full p-2.5 bg-background border border-border rounded-xl text-text-primary"
                  />
                </div>

                <div>
                  <label className="font-bold text-text-primary block mb-1">Interview Rounds (Comma separated)</label>
                  <input
                    type="text"
                    value={formData.interviewRounds}
                    onChange={(e) => setFormData({ ...formData, interviewRounds: e.target.value })}
                    placeholder="DSA Round, System Architecture, HR Round"
                    className="w-full p-2.5 bg-background border border-border rounded-xl text-text-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold text-text-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-hover"
                >
                  Save Company to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Companies List Table */}
      {loading ? (
        <div className="p-16 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-xs font-bold text-text-secondary mt-3">Loading Database Records...</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl shadow-subtle overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-background/50 text-[11px] font-extrabold text-text-secondary uppercase">
                <th className="p-4">Company Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Supported Roles</th>
                <th className="p-4">Difficulty</th>
                <th className="p-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredCompanies.map((comp) => (
                <tr key={comp.id} className="hover:bg-background/40 transition-colors">
                  <td className="p-4 font-extrabold text-text-primary">
                    <div className="flex items-center gap-3">
                      <CompanyLogo company={comp} size="sm" />
                      <div>
                        <div>{comp.name}</div>
                        <span className="text-[10px] text-text-secondary font-normal">{comp.industry}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-text-secondary">
                    <span className="text-[10px] bg-secondary/10 text-secondary font-bold px-2 py-0.5 rounded">
                      {comp.category}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-text-primary">
                    {comp.roles.map(r => r.title).join(', ')}
                  </td>
                  <td className="p-4 font-bold text-text-primary">
                    {comp.difficulty}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleDelete(comp.id, comp.name)}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Company"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
