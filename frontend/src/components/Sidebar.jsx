import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  CheckCircle2,
  ShieldAlert, 
  Map, 
  CalendarCheck,
  Code2,
  MessageSquareCode, 
  Trophy, 
  Building2, 
  FolderGit2,
  Calculator,
  LineChart, 
  LogOut,
  GraduationCap,
  Sparkles,
  Target,
  Compass,
  Layers,
  BarChart2,
  ShieldCheck,
  AlertOctagon,
  Activity,
  FileSearch,
  Swords
} from 'lucide-react';

export const Sidebar = ({ currentView, setCurrentView, onOpenDiagnostics }) => {
  const { user, profile, logout } = useAuth();

  const navGroups = [
    {
      group: 'Command Center',
      items: [
        { id: 'dashboard', label: 'Placement Command Center', icon: LayoutDashboard },
        { id: 'blockers', label: 'Placement Blockers', icon: AlertOctagon, badge: 'Crucial' },
        { id: 'readiness', label: 'Readiness Index', icon: Target },
      ]
    },
    {
      group: 'Company Intelligence',
      items: [
        { id: 'companies', label: '30+ Company Intel', icon: Compass },
        { id: 'matcher', label: 'Company Match Engine', icon: Building2 },
        { id: 'matrix', label: 'Placement Matrix', icon: Layers },
        { id: 'compare', label: 'Compare Companies', icon: BarChart2 },
        { id: 'admin-companies', label: 'Company Data Admin', icon: ShieldCheck },
      ]
    },
    {
      group: 'Preparation & Practice',
      items: [
        { id: 'resume', label: 'Resume & Claims', icon: FileText },
        { id: 'resume-jd', label: 'Resume ↔ JD Matcher', icon: FileSearch, badge: 'New' },
        { id: 'verification', label: 'Skill Verification', icon: CheckCircle2 },
        { id: 'coding', label: 'Coding Lab & Weaknesses', icon: Code2 },
        { id: 'mission', label: 'Daily Mission Coach', icon: CalendarCheck },
        { id: 'roadmap', label: 'Adaptive Roadmap', icon: Map },
      ]
    },
    {
      group: 'Interview & Defense',
      items: [
        { id: 'mock', label: 'Mock Interview & Memory', icon: MessageSquareCode },
        { id: 'project-defense', label: 'Project Defense Simulator', icon: Swords, badge: 'New' },
        { id: 'projects', label: 'Project Portfolio Analyzer', icon: FolderGit2 },
        { id: 'simulator', label: 'Placement Drive Simulator', icon: Trophy },
      ]
    },
    {
      group: 'Analytics & Strategy',
      items: [
        { id: 'whatif', label: 'What-If ROI Simulator', icon: Calculator },
        { id: 'risks', label: 'Risk Analyzer', icon: ShieldAlert },
        { id: 'progress', label: 'Journey Timeline', icon: LineChart },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col justify-between h-screen sticky top-0 overflow-y-auto custom-scrollbar flex-shrink-0 z-20">
      <div className="flex flex-col">
        {/* Brand Logo */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary flex items-center justify-center rounded-xl text-white shadow-md shadow-primary/20">
              <GraduationCap size={20} />
            </div>
            <div>
              <h1 className="font-extrabold text-text-primary text-sm tracking-tight leading-none">Placement Mentor</h1>
              <span className="text-[10px] text-primary font-bold flex items-center gap-1 mt-1 bg-primary/10 px-1.5 py-0.5 rounded">
                <Sparkles size={9} /> AI Career OS
              </span>
            </div>
          </div>

          {/* System Diagnostics Trigger Button */}
          {onOpenDiagnostics && (
            <button
              onClick={onOpenDiagnostics}
              title="Open System Diagnostics"
              className="p-1.5 text-text-secondary hover:text-primary hover:bg-background rounded-lg transition-colors border border-border/60"
            >
              <Activity size={15} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-4">
          {navGroups.map((group) => (
            <div key={group.group}>
              <h2 className="px-3 text-[10px] font-extrabold text-text-secondary uppercase tracking-wider mb-1">
                {group.group}
              </h2>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        isActive 
                          ? 'bg-primary text-white shadow-md shadow-primary/20 font-bold' 
                          : 'text-text-secondary hover:bg-background hover:text-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon size={15} className={isActive ? 'text-white' : 'text-text-secondary'} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                          isActive 
                            ? 'bg-white text-primary' 
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-border bg-background/50">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary font-extrabold text-xs">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'ST'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-text-primary truncate">{user?.name || 'Student'}</p>
            <p className="text-[10px] text-text-secondary truncate">
              {profile?.target_role && profile?.target_company 
                ? `${profile.target_role} @ ${profile.target_company}` 
                : 'Target: SDE @ TCS'}
            </p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 border border-danger/20 rounded-lg text-xs font-bold text-danger hover:bg-danger/5 transition-colors"
        >
          <LogOut size={12} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
