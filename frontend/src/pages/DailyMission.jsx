import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CalendarCheck, CheckCircle2, Circle, ArrowRight, Zap, Target } from 'lucide-react';

export default function DailyMission({ setCurrentView }) {
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTodayMission();
  }, []);

  const fetchTodayMission = async () => {
    setLoading(true);
    try {
      const data = await api.get('/mission/today');
      setMission(data);
    } catch (e) {
      console.error('Fetch mission error:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId, currentStatus) => {
    if (!mission) return;
    try {
      const data = await api.patch('/mission/update-task', {
        missionId: mission.id,
        taskId,
        completed: !currentStatus
      });
      setMission(prev => ({
        ...prev,
        completionPercentage: data.completionPercentage,
        tasks: data.tasks
      }));
    } catch (e) {
      console.error('Update task error:', e);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-2">
            <CalendarCheck size={14} /> Daily Placement Checklist
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Today's Placement Mission</h1>
          <p className="text-text-secondary text-sm mt-1">
            Personalized daily tasks calculated from your weaknesses, readiness score, target company, and placement countdown.
          </p>
        </div>

        {mission && (
          <div className="flex items-center gap-3 bg-background p-4 rounded-xl border border-border">
            <Target className="text-primary" size={28} />
            <div>
              <div className="text-xs font-bold text-text-secondary">Today's Progress</div>
              <div className="text-lg font-extrabold text-text-primary">{mission.completionPercentage}% Completed</div>
            </div>
          </div>
        )}
      </div>

      {/* Checklist Grid */}
      <div className="bg-surface border border-border p-6 rounded-2xl space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-text-secondary">Loading today's placement mission...</div>
        ) : mission ? (
          <div className="space-y-3">
            {mission.tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id, task.completed)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  task.completed
                    ? 'bg-emerald-500/5 border-emerald-500/30 text-text-primary'
                    : 'bg-background border-border text-text-primary hover:border-primary/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  {task.completed ? (
                    <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={20} />
                  ) : (
                    <Circle className="text-text-secondary flex-shrink-0" size={20} />
                  )}
                  <div>
                    <div className={`text-sm font-semibold ${task.completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                      {task.text}
                    </div>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded mt-1 inline-block">
                      {task.category}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (task.category === 'DSA') setCurrentView && setCurrentView('coding');
                    else if (task.category === 'Technical') setCurrentView && setCurrentView('verification');
                    else if (task.category === 'Interview') setCurrentView && setCurrentView('mock');
                    else if (task.category === 'Resume') setCurrentView && setCurrentView('resume');
                  }}
                  className="px-3 py-1.5 bg-surface border border-border text-text-secondary rounded-lg text-xs font-bold hover:text-text-primary flex items-center gap-1"
                >
                  Start <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
