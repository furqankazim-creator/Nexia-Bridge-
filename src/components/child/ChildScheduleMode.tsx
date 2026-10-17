import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  Check, 
  Star, 
  ArrowRight, 
  Volume2, 
  RotateCcw, 
  Smile, 
  Award,
  X
} from 'lucide-react';

interface ScheduleTask {
  id: string;
  title: string;
  icon: string;
  completed: boolean;
  color: string;
}

export const ChildScheduleMode: React.FC = () => {
  const { activeChild, setChildScheduleMode, triggerConfetti, showNotification } = useApp();

  const [starsEarned, setStarsEarned] = useState(3);
  const [tasks, setTasks] = useState<ScheduleTask[]>([
    { id: '1', title: 'Put on Shoes', icon: '👟', completed: true, color: 'bg-emerald-100 border-emerald-300' },
    { id: '2', title: 'Say 3 Words', icon: '🗣️', completed: true, color: 'bg-indigo-100 border-indigo-300' },
    { id: '3', title: 'Math Puzzle', icon: '🧩', completed: true, color: 'bg-purple-100 border-purple-300' },
    { id: '4', title: 'Button Shirt', icon: '👕', completed: false, color: 'bg-amber-100 border-amber-300' },
    { id: '5', title: 'Snack Time', icon: '🍎', completed: false, color: 'bg-rose-100 border-rose-300' },
  ]);

  // First-Then Board
  const [firstTask, setFirstTask] = useState({ title: 'Finish 5 Button Vest', icon: '👕' });
  const [thenReward, setThenReward] = useState({ title: 'Apple Slices & Play', icon: '🍎' });
  const [firstCompleted, setFirstCompleted] = useState(false);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const next = !t.completed;
        if (next) {
          setStarsEarned(s => s + 1);
          triggerConfetti();
        }
        return { ...t, completed: next };
      }
      return t;
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FBF7F2] dark:bg-[#14122B] overflow-y-auto p-4 sm:p-6 md:p-10 flex flex-col justify-between max-w-md md:max-w-4xl mx-auto">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌟</span>
            <div>
              <h2 className="font-heading text-xl font-bold text-[#1F1B3A] dark:text-white">
                Hi, {activeChild.name}!
              </h2>
              <p className="text-xs text-[#6B6785] dark:text-gray-300">
                Today's Picture Schedule
              </p>
            </div>
          </div>
          <button
            onClick={() => setChildScheduleMode(false)}
            className="p-2 rounded-full bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-gray-700 shadow-xs hover:bg-gray-100 text-gray-500"
            title="Exit Child Mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Star Reward Bar */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 p-4 rounded-3xl text-white shadow-warm flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Award className="w-8 h-8 text-amber-100" />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-100 block">
                Star Bank
              </span>
              <span className="font-heading text-2xl font-black">
                {starsEarned} Stars Earned!
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((st) => (
              <Star
                key={st}
                className={`w-6 h-6 ${
                  st <= starsEarned
                    ? 'fill-amber-100 text-amber-100 animate-bounce'
                    : 'text-amber-300/60'
                }`}
              />
            ))}
          </div>
        </div>

        {/* First-Then Board */}
        <div className="mb-6">
          <h3 className="font-heading font-bold text-sm text-[#1F1B3A] dark:text-white mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>First — Then Board</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {/* FIRST */}
            <div
              onClick={() => {
                setFirstCompleted(!firstCompleted);
                if (!firstCompleted) {
                  triggerConfetti();
                  setStarsEarned(s => s + 1);
                }
              }}
              className={`p-4 rounded-3xl border-3 flex flex-col items-center justify-center text-center cursor-pointer transition active:scale-95 shadow-card ${
                firstCompleted
                  ? 'bg-emerald-100 border-emerald-400 dark:bg-emerald-950 text-emerald-800'
                  : 'bg-white dark:bg-[#1F1B3A] border-indigo-300 dark:border-indigo-700'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5] mb-1">
                1. First
              </span>
              <span className="text-4xl my-2">{firstTask.icon}</span>
              <span className="text-xs font-bold text-[#1F1B3A] dark:text-white">
                {firstTask.title}
              </span>
              {firstCompleted && (
                <span className="mt-2 text-xs font-bold text-emerald-600 bg-white dark:bg-emerald-900 px-2 py-0.5 rounded-full">
                  Done! ✓
                </span>
              )}
            </div>

            {/* THEN */}
            <div className="p-4 rounded-3xl border-3 border-amber-300 bg-amber-50/60 dark:bg-amber-950/40 flex flex-col items-center justify-center text-center shadow-card">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
                2. Then
              </span>
              <span className="text-4xl my-2">{thenReward.icon}</span>
              <span className="text-xs font-bold text-[#1F1B3A] dark:text-white">
                {thenReward.title}
              </span>
              <span className="mt-2 text-xs font-semibold text-amber-700 bg-amber-100 dark:bg-amber-900 px-2 py-0.5 rounded-full">
                Reward
              </span>
            </div>
          </div>
        </div>

        {/* Visual Picture Schedule */}
        <h3 className="font-heading font-bold text-sm text-[#1F1B3A] dark:text-white mb-2.5">
          Step-by-Step Schedule
        </h3>

        <div className="space-y-2.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition active:scale-98 shadow-xs ${
                task.completed
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 line-through opacity-75'
                  : 'bg-white dark:bg-[#1F1B3A] border-[#E8E2D9] dark:border-[#38325E]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{task.icon}</span>
                <span className="font-heading font-bold text-sm text-[#1F1B3A] dark:text-white">
                  {task.title}
                </span>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                task.completed
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-300'
              }`}>
                {task.completed ? '✓' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exit Child Mode Button */}
      <div className="pt-6">
        <button
          onClick={() => setChildScheduleMode(false)}
          className="w-full py-3.5 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-heading font-semibold text-sm shadow-warm flex items-center justify-center gap-2"
        >
          <Smile className="w-4 h-4" />
          <span>Back to Adult Portal</span>
        </button>
      </div>
    </div>
  );
};
