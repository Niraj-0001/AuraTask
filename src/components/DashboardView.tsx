import React from 'react';
import type { Task, TaskCategory } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  Flame, 
  TrendingUp, 
  AlertCircle,
  FolderOpen
} from 'lucide-react';

interface DashboardViewProps {
  tasks: Task[];
  totalFocusTime: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ tasks, totalFocusTime }) => {
  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t => t.status !== 'completed' && t.dueDate && t.dueDate < todayStr).length;

  const getStreak = () => {
    const completedDates = tasks
      .filter(t => t.status === 'completed')
      .map(t => t.createdAt.split('T')[0]);
    
    if (completedDates.length === 0) return 0;
    
    const uniqueDates = Array.from(new Set(completedDates)).sort().reverse();
    let currentStreak = 0;
    let checkDate = new Date();
    
    const today = checkDate.toISOString().split('T')[0];
    let hasToday = uniqueDates.includes(today);
    
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterday = checkDate.toISOString().split('T')[0];
    let hasYesterday = uniqueDates.includes(yesterday);
    
    if (!hasToday && !hasYesterday) return 0;
    
    let index = 0;
    if (hasToday) {
      currentStreak++;
      index = uniqueDates.indexOf(today);
    } else {
      index = uniqueDates.indexOf(yesterday);
    }
    
    let streakCount = currentStreak;
    let lastDate = new Date(uniqueDates[index]);
    
    for (let i = index + 1; i < uniqueDates.length; i++) {
      const nextDate = new Date(uniqueDates[i]);
      const diffTime = Math.abs(lastDate.getTime() - nextDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streakCount++;
        lastDate = nextDate;
      } else if (diffDays > 1) {
        break;
      }
    }
    return streakCount || (hasToday ? 1 : 0);
  };

  const currentStreak = getStreak();

  const formatFocusTime = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hrs === 0) return `${mins} mins`;
    return `${hrs}h ${mins}m`;
  };

  const getWeeklyData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const completedOnDay = tasks.filter(t => t.status === 'completed' && t.createdAt.startsWith(dateStr)).length;
      
      data.push({
        dayName: d.toLocaleDateString([], { weekday: 'short' }),
        count: completedOnDay
      });
    }
    return data;
  };
  
  const weeklyData = getWeeklyData();
  const maxWeeklyCount = Math.max(...weeklyData.map(d => d.count), 3);

  const getCategoryData = () => {
    const categoryCounts: Record<TaskCategory, number> = {
      study: 0,
      personal: 0,
      shopping: 0,
      health: 0,
      ideas: 0,
      other: 0
    };
    
    tasks.forEach(t => {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });

    return Object.entries(categoryCounts).map(([key, value]) => ({
      category: key as TaskCategory,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      count: value,
      color: `var(--cat-${key})`
    })).filter(c => c.count > 0);
  };

  const categoryData = getCategoryData();
  const totalCategoryTasks = categoryData.reduce((acc, curr) => acc + curr.count, 0);

  // SVG Area Chart Calculations
  const width = 500;
  const height = 150;
  const paddingX = 40;
  const paddingY = 20;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = weeklyData.map((d, i) => {
    const x = paddingX + (i / 6) * chartWidth;
    const y = height - paddingY - (d.count / maxWeeklyCount) * chartHeight;
    return { x, y, label: d.dayName, value: d.count };
  });

  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  // SVG Doughnut segment calculation
  let accumulatedPercent = 0;
  const doughnutSegments = categoryData.map(c => {
    const percent = totalCategoryTasks > 0 ? c.count / totalCategoryTasks : 0;
    const startPercent = accumulatedPercent;
    accumulatedPercent += percent;
    
    const getCoordinatesForPercent = (p: number) => {
      const x = Math.cos(2 * Math.PI * p);
      const y = Math.sin(2 * Math.PI * p);
      return [x, y];
    };

    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(accumulatedPercent);
    const largeArcFlag = percent > 0.5 ? 1 : 0;
    
    const r = 38;
    const sx = 50 + startX * r;
    const sy = 50 + startY * r;
    const ex = 50 + endX * r;
    const ey = 50 + endY * r;

    const pathData = percent === 1
      ? `M 50 12 A 38 38 0 1 1 49.99 12 Z`
      : `M ${sx} ${sy} A 38 38 0 ${largeArcFlag} 1 ${ex} ${ey}`;

    return {
      ...c,
      percent: Math.round(percent * 100),
      pathData
    };
  });

  return (
    <div className="dashboard-view animate-slide-up">
      {/* Title */}
      <div className="dashboard-title-area">
        <h1>Welcome Back!</h1>
        <p>Here's a breakdown of your focus sessions and workspace stats.</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {/* Completion Ring Card */}
        <div className="dashboard-stat-card">
          <div className="stat-card-info">
            <span className="stat-card-title">Completion Rate</span>
            <h3 className="stat-card-value">{completionRate}%</h3>
            <span className="stat-card-sub">{completedTasks} of {totalTasks} completed</span>
          </div>
          <div className="ring-container">
            <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 36 36">
              <path
                className="text-[var(--bg-tertiary)]"
                strokeWidth="3.5"
                stroke="var(--border-color)"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                style={{ transition: 'stroke-dasharray 0.5s ease', color: 'var(--accent)' }}
                strokeDasharray={`${completionRate}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="dashboard-stat-card">
          <div className="stat-card-info">
            <span className="stat-card-title">Work Streak</span>
            <h3 className="stat-card-value">{currentStreak} Days</h3>
            <span className="stat-card-sub">Keep finishing tasks to grow!</span>
          </div>
          <div className="stat-card-icon-wrapper amber">
            <Flame className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Focus Duration */}
        <div className="dashboard-stat-card">
          <div className="stat-card-info">
            <span className="stat-card-title">Focus Duration</span>
            <h3 className="stat-card-value">{formatFocusTime(totalFocusTime)}</h3>
            <span className="stat-card-sub">Time logged via Pomodoro timer</span>
          </div>
          <div className="stat-card-icon-wrapper accent">
            <Clock className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Attention Card */}
        <div className="dashboard-stat-card">
          <div className="stat-card-info">
            <span className="stat-card-title">Attention Required</span>
            <h3 className="stat-card-value">{overdueTasks} Overdue</h3>
            <span className="stat-card-sub">{pendingTasks} tasks remaining in total</span>
          </div>
          <div className={`stat-card-icon-wrapper ${overdueTasks > 0 ? 'red' : 'emerald'}`}>
            <AlertCircle className="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {/* Analytics SVG Charts */}
      <div className="analytics-grid">
        {/* Weekly Productivity Area Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title-group">
              <h4>Productivity Flow</h4>
              <p>Tasks completed daily over the past week</p>
            </div>
            <div className="chart-filter-tag">
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} /> 
              <span>Past 7 Days</span>
            </div>
          </div>

          <div className="svg-chart-container">
            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.5, 1].map((ratio, index) => {
                const y = paddingY + ratio * chartHeight;
                return (
                  <line
                    key={index}
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="var(--border-color)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Area Path */}
              {areaD && <path d={areaD} fill="url(#chartGradient)" />}

              {/* Line Path */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Dots */}
              {points.map((p, i) => (
                <g key={i} className="group" style={{ cursor: 'pointer' }}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4.5"
                    fill="var(--bg-secondary)"
                    stroke="var(--accent)"
                    strokeWidth="3"
                  />
                  {/* Custom Tooltip */}
                  <rect
                    x={p.x - 12}
                    y={p.y - 22}
                    width="24"
                    height="14"
                    rx="3"
                    fill="var(--bg-tertiary)"
                    stroke="var(--border-color)"
                    style={{ opacity: 0, transition: 'opacity 0.15s' }}
                    className="group-hover:opacity-100"
                  />
                  <text
                    x={p.x}
                    y={p.y - 12}
                    textAnchor="middle"
                    fill="var(--text-primary)"
                    style={{ fontSize: '8px', fontWeight: 'bold', opacity: 0, transition: 'opacity 0.15s', fontFamily: 'monospace' }}
                    className="group-hover:opacity-100"
                  >
                    {p.value}
                  </text>
                </g>
              ))}

              {/* X axis */}
              {points.map((p, i) => (
                <text
                  key={i}
                  x={p.x}
                  y={height - 2}
                  textAnchor="middle"
                  fill="var(--text-secondary)"
                  style={{ fontSize: '9px', fontWeight: '500' }}
                >
                  {p.label}
                </text>
              ))}

              {/* Y axis limits */}
              <text x={10} y={paddingY + 3} fill="var(--text-muted)" style={{ fontSize: '9px', fontFamily: 'monospace' }}>
                {maxWeeklyCount}
              </text>
              <text x={10} y={height - paddingY + 3} fill="var(--text-muted)" style={{ fontSize: '9px', fontFamily: 'monospace' }}>
                0
              </text>
            </svg>
          </div>
        </div>

        {/* Project Workload Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title-group">
              <h4>Project Workload</h4>
              <p>Distribution of tasks across projects</p>
            </div>
          </div>

          <div className="doughnut-container">
            {totalCategoryTasks > 0 ? (
              <div className="doughnut-graphic-wrapper">
                <svg className="transform -rotate-90" style={{ width: '100%', height: '100%' }} viewBox="0 0 100 100">
                  {doughnutSegments.map((seg, i) => (
                    <path
                      key={i}
                      d={seg.pathData}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="11"
                      style={{ transition: 'stroke-width 0.2s ease' }}
                    />
                  ))}
                </svg>
                <div className="doughnut-center-text">
                  <span className="doughnut-center-count">{totalCategoryTasks}</span>
                  <span className="doughnut-center-label">Tasks</span>
                </div>
              </div>
            ) : (
              <div style={{ width: '120px', height: '120px', borderRadius: '999px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '16px' }}>
                <FolderOpen className="w-5 h-5" style={{ color: 'var(--text-muted)', marginBottom: '4px' }} />
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '500' }}>No tasks found</span>
              </div>
            )}

            {/* Legend breakdown */}
            <div className="legend-list">
              {categoryData.length > 0 ? (
                categoryData.map((c, i) => {
                  const percent = totalCategoryTasks > 0 ? Math.round((c.count / totalCategoryTasks) * 100) : 0;
                  return (
                    <div key={i} className="legend-row">
                      <div className="legend-label-group">
                        <span className="legend-color-dot" style={{ backgroundColor: c.color }} />
                        <span className="legend-label-name">{c.label}</span>
                      </div>
                      <div className="legend-value-group">
                        <span>{c.count}</span>
                        <span className="legend-percent">({percent}%)</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>Create tasks to see breakdown</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
