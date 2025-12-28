
import React, { useState, useCallback, useEffect } from 'react';
import { CubeState, Move, Solution, Stats, Face } from './types';
import { INITIAL_CUBE_STATE } from './constants';
import { geminiSolver, getTutorialHint } from './services/geminiService';
import Cube3D from './components/Cube3D';
import Scanner from './components/Scanner';
import SolverDashboard from './components/SolverDashboard';
import { Layers, Play, Camera, GraduationCap, BarChart2, ChevronRight, Settings, RotateCcw, SkipForward, Pause } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'scan' | 'solve' | 'stats'>('home');
  const [cubeState, setCubeState] = useState<CubeState>(INITIAL_CUBE_STATE);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [tutorialHint, setTutorialHint] = useState<string>('');
  const [isSolving, setIsSolving] = useState(false);
  const [activeSolutionIdx, setActiveSolutionIdx] = useState<number | null>(null);
  const [playbackIdx, setPlaybackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleFaceScan = useCallback((faceKey: string, faceData: Face) => {
    setCubeState(prev => ({
      ...prev,
      [faceKey]: faceData
    }));
  }, []);

  const handleAllFacesComplete = useCallback(() => {
    setView('solve');
  }, []);

  const runComparison = async () => {
    setIsSolving(true);
    const geminiSolution = await geminiSolver(cubeState);
    
    const kociembaMock: Solution = {
      moves: ['U', 'R', 'L2', 'F\'', 'B', 'D2'] as Move[],
      solverName: 'Kociemba WASM',
      timeMs: 45,
      explanation: "Heuristic-based optimization focusing on coordinate reduction."
    };
    
    const korfMock: Solution = {
      moves: ['R', 'U', 'R\'', 'U\''] as Move[],
      solverName: 'Korf Optimal',
      timeMs: 2500,
      explanation: "Iterative Deepening A* search for the shortest possible path."
    };

    setSolutions([geminiSolution, kociembaMock, korfMock]);
    setIsSolving(false);
    
    const hint = await getTutorialHint(cubeState, []);
    setTutorialHint(hint);
  };

  const startPlayback = (idx: number) => {
    setActiveSolutionIdx(idx);
    setPlaybackIdx(0);
    setIsPlaying(true);
  };

  const triggerHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(40);
    }
  };

  useEffect(() => {
    let timer: number;
    if (isPlaying && activeSolutionIdx !== null) {
      const solution = solutions[activeSolutionIdx];
      if (playbackIdx < solution.moves.length) {
        timer = window.setTimeout(() => {
          setPlaybackIdx(prev => prev + 1);
          triggerHaptic();
        }, 1200);
      } else {
        setIsPlaying(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, playbackIdx, activeSolutionIdx, solutions]);

  const NavItem = ({ id, icon: Icon, label }: { id: typeof view, icon: any, label: string }) => (
    <button 
      onClick={() => setView(id)}
      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
        view === id ? 'text-blue-500 bg-blue-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      <Icon size={24} />
      <span className="text-[10px] mt-1 font-semibold uppercase tracking-wider">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col w-full mx-auto shadow-2xl overflow-x-hidden">
      {/* Header */}
      <header className="px-6 py-6 flex justify-between items-center border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[1.2rem] flex items-center justify-center shadow-2xl shadow-blue-500/20">
            <Layers className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter">CubeMaster AI</h1>
            <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.3em]">Augmented Learning v2.5</p>
          </div>
        </div>
        <div className="hidden lg:flex items-center space-x-12 px-12">
          {['home', 'scan', 'solve', 'stats'].map((v) => (
            <button 
              key={v}
              onClick={() => setView(v as any)}
              className={`text-xs font-black uppercase tracking-[0.2em] transition-all hover:scale-105 ${view === v ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-5">
          <button className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <Settings size={20} />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-12 pb-32">
        {view === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="lg:col-span-8 space-y-12">
              <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-900 rounded-[3rem] p-12 md:p-20 shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 space-y-8 max-w-2xl">
                  <div className="flex items-center space-x-3">
                    <span className="bg-white/20 backdrop-blur-md text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">Module Active: LAB Vision</span>
                  </div>
                  <h2 className="text-5xl md:text-8xl font-black leading-none tracking-tighter">Pro Solver. <br/><span className="text-white/40">Powered by AI.</span></h2>
                  <p className="text-blue-100 text-xl opacity-80 leading-relaxed max-w-xl">Zero-latency AR scanning with perceptual color clustering. Solve any scramble with optimal precision.</p>
                  <div className="flex flex-wrap gap-6 pt-4">
                    <button 
                      onClick={() => setView('scan')}
                      className="bg-white text-blue-600 px-10 py-5 rounded-[1.5rem] font-black shadow-2xl hover:scale-105 transition-all flex items-center group"
                    >
                      Scan Cube <ChevronRight className="ml-3 group-hover:translate-x-1 transition-transform" size={24} />
                    </button>
                    <button className="bg-blue-500/20 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-[1.5rem] font-black hover:bg-blue-500/30 transition-all">
                      Demo Scramble
                    </button>
                  </div>
                </div>
                <div className="absolute top-1/2 right-[-10%] transform -translate-y-1/2 opacity-10 group-hover:rotate-12 group-hover:scale-110 transition-all duration-1000">
                  <Layers size={600} strokeWidth={0.2} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div onClick={() => setView('scan')} className="bg-slate-900/40 p-10 rounded-[2.5rem] border border-slate-800 hover:border-blue-500/50 cursor-pointer transition-all group hover:bg-slate-800/40 shadow-xl">
                  <div className="w-20 h-20 bg-blue-500/10 rounded-[1.8rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    <Camera className="text-blue-500" size={40} />
                  </div>
                  <h3 className="font-black text-2xl tracking-tight">AR Scan Hub</h3>
                  <p className="text-slate-500 text-sm mt-3 leading-relaxed">Multi-point CIELAB color detection with ambient light compensation.</p>
                </div>
                <div onClick={() => setView('solve')} className="bg-slate-900/40 p-10 rounded-[2.5rem] border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all group hover:bg-slate-800/40 shadow-xl">
                  <div className="w-20 h-20 bg-indigo-500/10 rounded-[1.8rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    <GraduationCap className="text-indigo-500" size={40} />
                  </div>
                  <h3 className="font-black text-2xl tracking-tight">Academy</h3>
                  <p className="text-slate-500 text-sm mt-3 leading-relaxed">Advanced CFOP finger-trick guides and pattern recognition training.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-10">
              <section className="bg-slate-900/30 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-black tracking-tight">Activity</h3>
                  <button onClick={() => setView('stats')} className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-blue-400 transition-colors">Full Report</button>
                </div>
                <div className="space-y-6">
                  {[
                    { title: 'Gemini Solve', meta: '12.4s • 14 moves', color: 'blue', time: 'NOW' },
                    { title: 'PLL Case Study', meta: 'J-Perm Practice', color: 'indigo', time: '1H' },
                    { title: 'Kociemba Record', meta: '8.2s • PB', color: 'purple', time: '3H' },
                  ].map((item, i) => (
                    <div key={i} className="group flex items-center justify-between p-6 bg-slate-950/40 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all cursor-default">
                      <div className="flex items-center space-x-5">
                        <div className={`w-12 h-12 bg-${item.color}-500/10 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform`}>
                          <RotateCcw size={20} className={`text-${item.color}-500`} />
                        </div>
                        <div>
                          <p className="font-black text-sm tracking-tight">{item.title}</p>
                          <p className="text-[10px] text-slate-500 font-black uppercase mt-1">{item.meta}</p>
                        </div>
                      </div>
                      <p className="text-slate-600 text-[10px] font-black">{item.time}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="bg-gradient-to-br from-indigo-900 to-slate-950 rounded-[3rem] p-10 border border-indigo-500/20 shadow-2xl">
                <div className="flex items-center space-x-4 mb-6">
                   <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
                   <h4 className="text-lg font-black tracking-tight">Live Insights</h4>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-8 italic">"Your F2L transitions are 15% faster today. Focus on finger-tricks for U-Perm next."</p>
                <div className="flex -space-x-3">
                   {[1,2,3,4].map(i => (
                     <img key={i} className="w-10 h-10 rounded-full border-4 border-slate-900" src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                   ))}
                   <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black border-4 border-slate-900">+12k</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'scan' && (
          <div className="max-w-6xl mx-auto space-y-12 animate-in zoom-in-95 duration-700">
            <div className="text-center space-y-6">
              <span className="text-blue-500 font-black text-xs uppercase tracking-[0.5em] block">Calibration Sequence</span>
              <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">AR Vision Hub.</h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed opacity-70">Point your camera to each face. Our neural clustering handles lighting shifts in real-time.</p>
            </div>
            <Scanner onScanComplete={(key, data) => {
              handleFaceScan(key, data);
              if (Object.keys(cubeState).length >= 5) handleAllFacesComplete();
            }} />
          </div>
        )}

        {view === 'solve' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-1000">
            <div className="lg:col-span-8 space-y-10">
              <div className="relative group">
                <Cube3D state={cubeState} className="w-full aspect-square md:aspect-[16/10] rounded-[3.5rem] shadow-2xl border-2 border-slate-800" />
                {isPlaying && activeSolutionIdx !== null && (
                  <div className="absolute inset-x-0 top-12 p-8 flex justify-center pointer-events-none">
                     <div className="bg-blue-600/90 backdrop-blur-2xl border-2 border-white/30 px-12 py-6 rounded-[2.5rem] shadow-3xl animate-bounce">
                        <p className="text-4xl font-black font-mono tracking-widest text-white">
                           {solutions[activeSolutionIdx].moves[playbackIdx]}
                        </p>
                        <p className="text-center text-[10px] font-black uppercase tracking-widest text-white/60 mt-2">Next Step</p>
                     </div>
                  </div>
                )}
                
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex space-x-6 bg-slate-950/80 backdrop-blur-2xl px-8 py-5 rounded-[2rem] border border-white/10 shadow-3xl opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                  <button className="p-4 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all"><RotateCcw size={24}/></button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-16 h-16 bg-blue-600 text-white hover:bg-blue-500 rounded-[1.2rem] transition-all shadow-2xl shadow-blue-600/40 flex items-center justify-center group/play"
                  >
                    {isPlaying ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
                  </button>
                  <button className="p-4 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all"><SkipForward size={24}/></button>
                </div>
              </div>

              <div className="bg-slate-900/30 p-10 rounded-[3rem] border border-slate-800 shadow-xl">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-10 text-center">Inference Performance Report</h3>
                <SolverDashboard solutions={solutions} />
              </div>
            </div>

            <div className="lg:col-span-4 space-y-10">
              <div className="flex items-center justify-between pb-4 border-b border-slate-900">
                <h2 className="text-4xl font-black tracking-tighter">Solves</h2>
                <button 
                  onClick={runComparison}
                  disabled={isSolving}
                  className="flex items-center space-x-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-900 px-10 py-5 rounded-3xl font-black transition-all shadow-2xl shadow-blue-600/20 active:scale-95 text-sm uppercase tracking-widest"
                >
                  {isSolving ? <RotateCcw className="animate-spin" size={20} /> : <Play size={20} className="fill-current" />}
                  <span>{isSolving ? 'Solving...' : 'Compute'}</span>
                </button>
              </div>

              {solutions.length > 0 ? (
                <div className="space-y-6">
                  {solutions.map((sol, i) => (
                    <div 
                      key={i} 
                      onClick={() => startPlayback(i)}
                      className={`p-8 bg-slate-900/50 border-2 rounded-[2.5rem] space-y-6 transition-all cursor-pointer group hover:scale-[1.02] ${activeSolutionIdx === i ? 'border-blue-500 shadow-2xl shadow-blue-500/10' : 'border-slate-800 hover:border-slate-700'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${activeSolutionIdx === i ? 'text-blue-400' : 'text-slate-500'}`}>
                            {sol.solverName}
                          </span>
                          <h4 className="text-2xl font-black tracking-tight">Optimal Path</h4>
                        </div>
                        <div className="bg-slate-950 px-4 py-2 rounded-xl text-xs font-black text-slate-400 border border-white/5">{sol.timeMs}ms</div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {sol.moves.map((m, mi) => (
                          <span key={mi} className={`px-3 py-2 rounded-xl text-sm font-black font-mono border transition-all ${
                            activeSolutionIdx === i && playbackIdx === mi ? 'bg-blue-600 text-white border-blue-400 scale-125 shadow-glow' : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {m}
                          </span>
                        ))}
                      </div>
                      {sol.explanation && (
                        <div className="pt-6 border-t border-slate-800">
                          <p className="text-xs text-slate-500 leading-relaxed font-bold italic">"{sol.explanation}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-900/40 border-2 border-slate-800 border-dashed rounded-[3rem] p-20 flex flex-col items-center justify-center text-center space-y-8">
                  <div className="w-24 h-24 bg-slate-800 rounded-[2rem] flex items-center justify-center text-slate-600 shadow-inner">
                    <GraduationCap size={48} />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-2xl font-black tracking-tight text-slate-300">Awaiting Data</h4>
                    <p className="text-sm text-slate-600 leading-relaxed font-bold uppercase tracking-widest max-w-xs">Run solvers to generate perceptual solve paths.</p>
                  </div>
                </div>
              )}

              {tutorialHint && (
                <div className="p-10 bg-indigo-600/10 border border-indigo-500/20 rounded-[3rem] space-y-5 animate-in slide-in-from-right-8 duration-700">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                      <GraduationCap className="text-white" size={24} />
                    </div>
                    <span className="font-black text-xs uppercase tracking-[0.3em] text-indigo-400">Coach Guidance</span>
                  </div>
                  <p className="text-lg text-indigo-100/80 leading-relaxed font-bold italic tracking-tight">"{tutorialHint}"</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'stats' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-slate-800 hover:border-blue-500/30 transition-all group shadow-xl">
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] group-hover:text-blue-500 transition-colors">Avg. Speed</p>
                   <p className="text-6xl font-black mt-4 tracking-tighter">14.8s</p>
                   <div className="flex items-center space-x-3 mt-6">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-green-500 text-xs font-black uppercase tracking-widest">-2.1s DELTA</p>
                   </div>
                </div>
                <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-slate-800 hover:border-indigo-500/30 transition-all group shadow-xl">
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] group-hover:text-indigo-500 transition-colors">World Record</p>
                   <p className="text-6xl font-black mt-4 tracking-tighter">8.54s</p>
                   <p className="text-indigo-500 text-xs mt-6 font-black uppercase tracking-widest">RANK: MASTER-I</p>
                </div>
                <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-slate-800 hover:border-purple-500/30 transition-all group shadow-xl">
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] group-hover:text-purple-500 transition-colors">CFOP Mastery</p>
                   <p className="text-6xl font-black mt-4 tracking-tighter">42/78</p>
                   <div className="w-full bg-slate-950 h-2.5 rounded-full mt-8 overflow-hidden shadow-inner border border-white/5">
                      <div className="bg-gradient-to-r from-purple-600 to-pink-500 h-full w-[54%] rounded-full shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all duration-1000" />
                   </div>
                </div>
             </div>
             
             <div className="bg-slate-900/30 p-12 md:p-16 rounded-[4rem] border border-slate-800 shadow-2xl">
                <div className="flex justify-between items-center mb-16">
                  <h3 className="text-4xl font-black tracking-tighter">Growth Velocity</h3>
                  <div className="flex space-x-4 bg-slate-950 p-2 rounded-[1.5rem] border border-white/5 shadow-inner">
                    <span className="px-6 py-3 bg-blue-600 text-white text-[10px] font-black rounded-2xl shadow-xl">WEEKLY</span>
                    <span className="px-6 py-3 text-slate-500 text-[10px] font-black rounded-2xl hover:text-white transition-colors cursor-pointer">MONTHLY</span>
                  </div>
                </div>
                <div className="h-96 flex items-end space-x-6">
                   {[40, 60, 45, 80, 55, 90, 75, 95, 85, 100].map((h, i) => (
                     <div key={i} className="flex-1 bg-blue-600/10 hover:bg-blue-600/50 transition-all rounded-[1.5rem] group relative shadow-inner" style={{ height: `${h}%` }}>
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-blue-500 text-xs font-black px-5 py-2.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-3xl text-white">
                          {h}%
                        </div>
                     </div>
                   ))}
                </div>
                <div className="flex justify-between mt-12 text-[10px] text-slate-600 font-black uppercase tracking-[0.5em]">
                  <span>Basics</span>
                  <span>Neural Sync</span>
                  <span>Deep Mastery</span>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Modern Tab Bar for Mobile */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 h-20 bg-slate-950/90 backdrop-blur-3xl border border-white/10 px-8 flex justify-between items-center z-50 rounded-[2.5rem] shadow-3xl">
        <NavItem id="home" icon={Layers} label="Home" />
        <NavItem id="scan" icon={Camera} label="Scan" />
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center -mt-16 shadow-2xl shadow-blue-600/40 border-4 border-slate-950 text-white cursor-pointer hover:scale-110 active:scale-95 transition-all" onClick={() => setView('solve')}>
          <Play size={24} className="fill-current ml-1" />
        </div>
        <NavItem id="stats" icon={BarChart2} label="Stats" />
        <NavItem id="solve" icon={GraduationCap} label="Learn" />
      </nav>
      <style>{`
        .shadow-glow { box-shadow: 0 0 15px rgba(59,130,246,0.8); }
        .shadow-3xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
