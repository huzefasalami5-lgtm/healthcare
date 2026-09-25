import React, { useState } from 'react';
import { 
  CalendarClock, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  MessageSquare, 
  ListChecks, 
  Bell, 
  ChevronRight,
  ShieldCheck,
  PhoneCall
} from 'lucide-react';
import { ContinuityAgentOutput, CareTimelineTask } from '../types';

interface CareTimelineProps {
  continuityData?: ContinuityAgentOutput;
  patientId: string;
  isProcessing: boolean;
  onUpdateTaskStatus: (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => Promise<void>;
}

export const CareTimeline: React.FC<CareTimelineProps> = ({
  continuityData,
  patientId,
  isProcessing,
  onUpdateTaskStatus
}) => {
  const [tasks, setTasks] = useState<CareTimelineTask[]>(
    continuityData?.timeline_tasks || []
  );

  // Sync tasks when continuityData changes
  React.useEffect(() => {
    if (continuityData?.timeline_tasks) {
      setTasks(continuityData.timeline_tasks);
    }
  }, [continuityData]);

  if (isProcessing && !continuityData) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 animate-pulse space-y-4">
        <div className="h-6 bg-slate-800 rounded w-1/3"></div>
        <div className="h-32 bg-slate-800/40 rounded-xl"></div>
      </div>
    );
  }

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.task_id === taskId ? { ...t, status: nextStatus } : t));
    try {
      await onUpdateTaskStatus(taskId, nextStatus);
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const ashaChecklist = continuityData?.asha_action_checklist || [
    'Household visit in rural community within 48 hours by organisation community worker',
    'Measure resting pulse oximetry with field pulse oximeter',
    'Confirm medication compliance and adherence to prescribed antibiotics',
    'Inspect for recurring respiratory distress or cyanosis'
  ];

  const smsText = continuityData?.patient_telephony_sms || 
    "CuraReach Alert: Coordinated care pathway active. Organisation community health worker will visit your household in 48h. For emergency ambulance, dial 108.";

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-teal-400" />
            <span>Agent 7: Longitudinal Care Continuum & Community Worker Grid</span>
          </h3>
          <p className="text-xs text-slate-400">
            End-to-end milestone tracker preventing lost-to-followup and coordinating organisation-appointed community health workers
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Next Review:</span>
          <span className="px-2.5 py-1 rounded bg-teal-950/60 border border-teal-800/50 text-teal-300 font-mono font-semibold">
            {continuityData?.next_review_target || '48 Hours post-triage'}
          </span>
        </div>
      </div>

      {/* Interactive Milestone Timeline Tasks */}
      <div className="space-y-2.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Longitudinal Pathway Milestones (Interactive Check-Off)</span>
          <span className="text-slate-500 font-normal">Click task checkmark to toggle status</span>
        </div>

        <div className="space-y-2">
          {tasks.map((task, idx) => {
            const isCompleted = task.status === 'completed';
            const isInProgress = task.status === 'in_progress';

            return (
              <div
                key={task.task_id}
                className={`p-3.5 rounded-xl border transition-all duration-150 flex items-start justify-between gap-3 ${
                  isCompleted
                    ? 'bg-slate-900/40 border-slate-800/80 opacity-80'
                    : isInProgress
                      ? 'bg-teal-950/20 border-teal-500/40 shadow-sm'
                      : 'bg-slate-900/70 border-slate-800'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Status Toggle Checkbox */}
                  <button
                    onClick={() => handleToggleTask(task.task_id, task.status)}
                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 border ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                        : isInProgress
                          ? 'bg-teal-950 border-teal-400 text-teal-400'
                          : 'bg-slate-800 border-slate-700 text-transparent hover:border-slate-500'
                    }`}
                    title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {task.phase}
                      </span>
                      <h4 className={`text-xs font-bold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                        {task.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-teal-400" />
                        <span>Owner: <strong className="text-slate-300 font-medium">{task.owner}</strong></span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>Due: {task.due_in}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    isCompleted
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                      : isInProgress
                        ? 'bg-teal-950/80 text-teal-300 border border-teal-800'
                        : 'bg-slate-800 text-slate-400'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Community Worker Action Checklist & Patient SMS Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Organisation Community Health Worker Checklist */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-purple-400" />
              <span>Organisation Community Worker Domiciliary Protocol</span>
            </span>
            <span className="text-[10px] font-mono text-purple-300 px-2 py-0.5 rounded bg-purple-950 border border-purple-800">
              Field Checklist
            </span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {ashaChecklist.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-1.5" />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Automated Patient SMS Notification */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-400" />
              <span>Patient Telephony / SMS Dispatch</span>
            </span>
            <span className="text-[10px] font-mono text-teal-300 px-2 py-0.5 rounded bg-teal-950 border border-teal-800">
              Automated SMS
            </span>
          </div>
          <div className="p-3 rounded-lg bg-black/50 border border-slate-800/80 text-xs text-slate-300 font-mono leading-relaxed">
            "{smsText}"
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <PhoneCall className="w-3 h-3 text-cyan-400" />
              <span>Carrier: BSNL / Local Rural Gateway</span>
            </span>
            <span className="text-emerald-400 font-medium">Status: Queued & Dispatched</span>
          </div>
        </div>
      </div>
    </div>
  );
};
