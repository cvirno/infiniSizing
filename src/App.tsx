import React, { useState } from 'react';
import { Server as ServerTower, Cpu, Database, HardDrive, Network } from 'lucide-react';
import ServerCalculator from './components/ServerCalculator';
import VirtualizationCalculator from './components/VirtualizationCalculator';
import BackupCalculator from './components/BackupCalculator';
import StorageCalculator from './components/StorageCalculator';
import VsanCalculator from './components/VsanCalculator';
import Header from './components/Header';

function App() {
  const [activeTab, setActiveTab] = useState<'physical' | 'virtual' | 'backup' | 'storage' | 'vsan'>('physical');

  return (
    <div className="min-h-screen bg-[#0f172a] bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <Header />
      
      <div className="container mx-auto px-2 py-2">
        {/* Top Navigation */}
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setActiveTab('physical')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
              activeTab === 'physical'
                ? 'bg-blue-600 shadow-sm shadow-blue-500/30'
                : 'bg-slate-800/50 hover:bg-slate-700/50'
            }`}
          >
            <ServerTower size={16} />
            Physical Servers
          </button>
          <button
            onClick={() => setActiveTab('virtual')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
              activeTab === 'virtual'
                ? 'bg-blue-600 shadow-sm shadow-blue-500/30'
                : 'bg-slate-800/50 hover:bg-slate-700/50'
            }`}
          >
            <Cpu size={16} />
            Virtualization
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
              activeTab === 'storage'
                ? 'bg-blue-600 shadow-sm shadow-blue-500/30'
                : 'bg-slate-800/50 hover:bg-slate-700/50'
            }`}
          >
            <HardDrive size={16} />
            Storage
          </button>
          <button
            onClick={() => setActiveTab('vsan')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
              activeTab === 'vsan'
                ? 'bg-blue-600 shadow-sm shadow-blue-500/30'
                : 'bg-slate-800/50 hover:bg-slate-700/50'
            }`}
          >
            <Network size={16} />
            vSAN
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
              activeTab === 'backup'
                ? 'bg-blue-600 shadow-sm shadow-blue-500/30'
                : 'bg-slate-800/50 hover:bg-slate-700/50'
            }`}
          >
            <Database size={16} />
            Backup
          </button>
        </div>

        {/* Main Content */}
        <main className="pb-2">
          {activeTab === 'physical' && <ServerCalculator />}
          {activeTab === 'virtual' && <VirtualizationCalculator />}
          {activeTab === 'storage' && <StorageCalculator />}
          {activeTab === 'vsan' && <VsanCalculator />}
          {activeTab === 'backup' && <BackupCalculator />}
        </main>
      </div>
      
      <footer className="text-center py-1 text-slate-400 text-[10px]">
        <p>Desenvolvido por Cesar Virno © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;