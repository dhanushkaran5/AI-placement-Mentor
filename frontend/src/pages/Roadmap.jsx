import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Map, 
  CheckCircle, 
  ExternalLink,
  BookOpen,
  RefreshCw,
  Award
} from 'lucide-react';

export const Roadmap = () => {
  const { profile } = useAuth();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRoadmap();
  }, [profile?.target_role, profile?.target_company]);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/roadmap');
      if (res.needsGeneration) {
        setRoadmap(null);
      } else {
        setRoadmap(res.roadmap);
      }
    } catch (err) {
      console.error('Error loading roadmap:', err);
      setError(err.message || 'Failed to fetch roadmap.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      const res = await api.post('/roadmap/generate');
      setRoadmap(res.roadmap);
      // Wait, let's refresh the auth profile context so readiness matches
    } catch (err) {
      console.error('Error generating roadmap:', err);
      setError(err.message || 'Failed to generate study roadmap.');
    } finally {
      setGenerating(false);
    }
  };

  const handleTaskToggle = async (weekIndex, taskIndex, currentStatus) => {
    if (!roadmap) return;
    
    // Optimistic UI update
    const updatedWeeks = [...roadmap.weeks];
    updatedWeeks[weekIndex].tasks[taskIndex].completed = !currentStatus;
    setRoadmap({ ...roadmap, weeks: updatedWeeks });

    try {
      await api.post('/roadmap/task/status', {
        roadmapId: roadmap.id,
        weekIndex,
        taskIndex,
        completed: !currentStatus
      });
    } catch (err) {
      console.error('Error updating task status:', err);
      // Revert optimistic update on failure
      updatedWeeks[weekIndex].tasks[taskIndex].completed = currentStatus;
      setRoadmap({ ...roadmap, weeks: updatedWeeks });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-text-primary">Preparation Roadmap</h2>
          <p className="text-text-secondary mt-1">
            Personalized week-by-week roadmap to clear your skill gaps for <strong className="text-text-primary">{profile?.target_role} @ {profile?.target_company}</strong>.
          </p>
        </div>
        
        {roadmap && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-3.5 py-2 border border-primary text-primary hover:bg-primary/5 font-semibold rounded-button text-xs transition-colors"
          >
            <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
            Regenerate Roadmap
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-danger/5 text-danger border border-danger/10 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Content views */}
      {roadmap ? (
        <div className="relative border-l-2 border-border pl-8 space-y-12 ml-4 pt-4">
          {roadmap.weeks.map((week, wIdx) => {
            const completedCount = week.tasks.filter(t => t.completed).length;
            const isWeekFullyCompleted = completedCount === week.tasks.length && week.tasks.length > 0;

            return (
              <div key={week.weekNumber} className="relative">
                {/* Stepper Node Circle */}
                <div className={`absolute -left-[45px] top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-sm transition-all duration-300 ${
                  isWeekFullyCompleted 
                    ? 'bg-secondary border-secondary text-white' 
                    : 'bg-surface border-border text-text-secondary'
                }`}>
                  {isWeekFullyCompleted ? <CheckCircle size={16} /> : week.weekNumber}
                </div>

                <div className="bg-surface border border-border rounded-card p-6 shadow-subtle space-y-6">
                  {/* Week title & metadata */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-border pb-4">
                    <div>
                      <h3 className="font-bold text-text-primary text-lg">{week.title}</h3>
                      <p className="text-sm text-text-secondary mt-0.5">{week.description}</p>
                    </div>
                    <span className="text-xs font-semibold bg-background px-3 py-1.5 rounded-full border border-border text-text-primary whitespace-nowrap">
                      Completed: {completedCount}/{week.tasks.length}
                    </span>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Practice Targets</h4>
                    <div className="grid grid-cols-1 gap-2.5">
                      {week.tasks.map((task, tIdx) => (
                        <label 
                          key={tIdx} 
                          className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                            task.completed 
                              ? 'bg-success/5 border-success/20 text-text-secondary' 
                              : 'bg-background/25 border-border hover:border-primary/20 text-text-primary'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleTaskToggle(wIdx, tIdx, task.completed)}
                            className="mt-0.5 accent-secondary h-4 w-4 rounded border-gray-300 cursor-pointer"
                          />
                          <span className={`text-sm font-medium ${task.completed ? 'line-through' : ''}`}>
                            {task.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Resources section */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen size={13} />
                      Curated Study Material
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {week.resources.map((res, rIdx) => (
                        <a
                          key={rIdx}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3.5 bg-background border border-border hover:border-secondary/40 rounded-xl transition-all duration-200 group text-sm"
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="font-semibold text-text-primary truncate">{res.title}</span>
                            <span className="text-[10px] text-secondary font-medium uppercase mt-0.5">Free Platform Link</span>
                          </div>
                          <ExternalLink size={14} className="text-text-secondary group-hover:text-secondary flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-card p-12 shadow-subtle text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center text-text-secondary mb-4 border border-border">
            <Map size={24} />
          </div>
          <h3 className="font-bold text-text-primary text-lg">No Roadmap Active</h3>
          <p className="text-sm text-text-secondary mt-1.5 max-w-sm leading-relaxed">
            Generate a step-by-step, week-by-week placement study schedule customized around your skill gaps.
          </p>
          
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="mt-6 py-3 px-6 bg-primary text-white hover:bg-primary-hover font-semibold rounded-button text-sm shadow-md transition-all flex items-center gap-2"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Creating Your Roadmap...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Study Roadmap
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Roadmap;
