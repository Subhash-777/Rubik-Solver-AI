
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Solution } from '../types';

interface SolverDashboardProps {
  solutions: Solution[];
}

const SolverDashboard: React.FC<SolverDashboardProps> = ({ solutions }) => {
  const data = solutions.map(s => ({
    name: s.solverName.split(' ')[0],
    moves: s.moves.length,
    time: s.timeMs,
  }));

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h3 className="text-lg font-bold mb-4 text-slate-300">Move Efficiency (Lower is Better)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="moves" fill="#3B82F6">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h3 className="text-lg font-bold mb-4 text-slate-300">Inference Time (ms)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="time" fill="#10B981">
                 {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SolverDashboard;
