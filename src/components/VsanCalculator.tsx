import React, { useState } from 'react';
import { Cpu, Server, AlertTriangle, HardDrive, Network, MemoryStick as Memory } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface VirtualMachine {
  name: string;
  vCPUs: number;
  memory: number;
  storage: number;
  count: number;
}

interface VsanConfig {
  ftt: 1 | 2 | 3; // Failures to Tolerate
  deduplication: boolean;
  compression: boolean;
  encryption: boolean;
  coresPerSocket: number;
  socketsPerHost: number;
  memoryPerHost: number;
  maxUtilization: number;
}

interface VsanRecommendation {
  minimumHosts: number;
  recommendedHosts: number;
  hostsForFTT: number;
  hostsForVMs: number;
  hostsForResources: number;
  resourceUtilization: {
    cpu: number;
    memory: number;
    storage: number;
  };
  warnings: string[];
  maxVMs: number;
  storageOverhead: {
    multiplier: number;
    percentage: number;
  };
}

const formatStorage = (gb: number): string => {
  if (gb >= 1024) {
    const tb = gb / 1024;
    if (Math.abs(tb - 1.92) < 0.01) return '1.92 TB';
    if (Math.abs(tb - 3.84) < 0.01) return '3.84 TB';
    if (Math.abs(tb - 7.68) < 0.01) return '7.68 TB';
    if (Math.abs(tb - 15.36) < 0.01) return '15.36 TB';
    if (Math.floor(tb) === tb) return `${tb} TB`;
    return `${tb.toFixed(2)} TB`;
  }
  return `${gb} GB`;
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];

const VsanCalculator = () => {
  const [vms, setVms] = useState<VirtualMachine[]>([
    { name: 'VM-1', vCPUs: 2, memory: 4, storage: 1024, count: 1 }
  ]);
  const [vsanConfig, setVsanConfig] = useState<VsanConfig>({
    ftt: 1,
    deduplication: false,
    compression: true,
    encryption: false,
    coresPerSocket: 12,
    socketsPerHost: 2,
    memoryPerHost: 768,
    maxUtilization: 90
  });

  const calculateTotalResources = () => {
    return vms.reduce((acc, vm) => ({
      vCPUs: acc.vCPUs + (vm.vCPUs * vm.count),
      memory: acc.memory + (vm.memory * vm.count),
      storage: acc.storage + (vm.storage * vm.count)
    }), { vCPUs: 0, memory: 0, storage: 0 });
  };

  const calculateUsableCapacity = (hosts: number) => {
    const capacityPerHost = 4 * 7.68 * 1024; // 4 disk groups * 7.68 TB * 1024 GB/TB
    const totalRawCapacity = capacityPerHost * hosts;
    
    // Apply FTT reduction
    let usableCapacity = totalRawCapacity;
    switch (vsanConfig.ftt) {
      case 1: usableCapacity *= 0.5; break;  // RAID-1
      case 2: usableCapacity *= 0.33; break; // RAID-6
      case 3: usableCapacity *= 0.25; break; // Triple mirroring
    }

    // Apply data reduction
    if (vsanConfig.deduplication && vsanConfig.compression) {
      usableCapacity *= 2; // 2:1 data reduction
    } else if (vsanConfig.compression) {
      usableCapacity *= 1.5; // 1.5:1 compression
    }

    return usableCapacity;
  };

  const calculateVsanRecommendation = (): VsanRecommendation => {
    const totalResources = calculateTotalResources();
    const totalVMs = vms.reduce((sum, vm) => sum + vm.count, 0);
    const warnings: string[] = [];

    // Calculate minimum hosts based on FTT
    const hostsForFTT = 2 * vsanConfig.ftt + 1;
    
    // Calculate storage overhead based on FTT
    const storageOverhead = {
      multiplier: vsanConfig.ftt + 1,
      percentage: vsanConfig.ftt * 100
    };
    
    // Calculate minimum hosts based on different factors
    const vmsPerHost = 100; // Conservative limit
    const hostsForVMs = Math.ceil(totalVMs / vmsPerHost);
    
    // Calculate total cores per host
    const coresPerHost = vsanConfig.coresPerSocket * vsanConfig.socketsPerHost;
    const vCPUsPerHost = coresPerHost * 2; // Assuming 2:1 vCPU:pCPU ratio
    
    // Hosts needed for resources
    const hostsForCPU = Math.ceil(totalResources.vCPUs / vCPUsPerHost);
    const hostsForMemory = Math.ceil(totalResources.memory / vsanConfig.memoryPerHost);
    
    // Start with minimum hosts needed
    let minimumHosts = Math.max(hostsForFTT, hostsForVMs, hostsForCPU, hostsForMemory);
    
    // Calculate resource utilization with minimum hosts
    let storageUtilization = 0;
    let usableCapacity = 0;
    
    // Keep increasing hosts until storage utilization is acceptable
    while (true) {
      usableCapacity = calculateUsableCapacity(minimumHosts);
      storageUtilization = (totalResources.storage * storageOverhead.multiplier / usableCapacity) * 100;
      
      if (storageUtilization <= vsanConfig.maxUtilization) {
        break;
      }
      
      minimumHosts++;
      }

    // Calculate resource utilization percentages
    const resourceUtilization = {
      cpu: (totalResources.vCPUs / (minimumHosts * vCPUsPerHost)) * 100,
      memory: (totalResources.memory / (minimumHosts * vsanConfig.memoryPerHost)) * 100,
      storage: storageUtilization
    };

    // Add warnings if needed
    if (resourceUtilization.cpu > vsanConfig.maxUtilization) {
      warnings.push(`CPU utilization (${resourceUtilization.cpu.toFixed(1)}%) exceeds recommended maximum of ${vsanConfig.maxUtilization}%`);
    }
    if (resourceUtilization.memory > vsanConfig.maxUtilization) {
      warnings.push(`Memory utilization (${resourceUtilization.memory.toFixed(1)}%) exceeds recommended maximum of ${vsanConfig.maxUtilization}%`);
    }
    if (resourceUtilization.storage > vsanConfig.maxUtilization) {
      warnings.push(`Storage utilization (${resourceUtilization.storage.toFixed(1)}%) exceeds recommended maximum of ${vsanConfig.maxUtilization}%`);
    }

    // Calculate maximum VMs based on resources
    const maxVMsByCPU = Math.floor((minimumHosts * vCPUsPerHost) / totalResources.vCPUs * totalVMs);
    const maxVMsByMemory = Math.floor((minimumHosts * vsanConfig.memoryPerHost) / totalResources.memory * totalVMs);
    const maxVMsByStorage = Math.floor((usableCapacity / (totalResources.storage * storageOverhead.multiplier)) * totalVMs);
    const maxVMsByHosts = minimumHosts * vmsPerHost;

    // The limiting factor is the smallest of these values
    const maxVMs = Math.min(maxVMsByCPU, maxVMsByMemory, maxVMsByStorage, maxVMsByHosts);

    return {
      minimumHosts,
      recommendedHosts: minimumHosts + 1,
      hostsForFTT,
      hostsForVMs,
      hostsForResources: Math.max(hostsForCPU, hostsForMemory),
      resourceUtilization,
      warnings,
      maxVMs,
      storageOverhead
    };
  };

  const addVM = () => {
    setVms([...vms, {
      name: `VM-${vms.length + 1}`,
      vCPUs: 2,
      memory: 4,
      storage: 1024,
      count: 1
    }]);
  };

  const removeVM = (index: number) => {
    setVms(vms.filter((_, i) => i !== index));
  };

  const updateVM = (index: number, field: keyof VirtualMachine, value: number | string) => {
    const newVMs = [...vms];
    if (field === 'name') {
      newVMs[index] = { ...newVMs[index], [field]: value as string };
    } else {
      newVMs[index] = { ...newVMs[index], [field]: Number(value) };
    }
    setVms(newVMs);
  };

  const recommendation = calculateVsanRecommendation();
  const totalResources = calculateTotalResources();

  const getResourceData = () => {
    const totalResources = calculateTotalResources();
    const coresPerHost = vsanConfig.coresPerSocket * vsanConfig.socketsPerHost;
    const vCPUsPerHost = coresPerHost * 2;
    const totalVCPUs = recommendation.minimumHosts * vCPUsPerHost;
    const totalMemory = recommendation.minimumHosts * vsanConfig.memoryPerHost;
    const totalStorage = calculateUsableCapacity(recommendation.minimumHosts);

    return [
      {
        name: 'CPU',
        used: totalResources.vCPUs,
        total: totalVCPUs,
        color: COLORS[0]
      },
      {
        name: 'Memory',
        used: totalResources.memory,
        total: totalMemory,
        color: COLORS[1]
      },
      {
        name: 'Storage',
        used: totalResources.storage,
        total: totalStorage,
        color: COLORS[2]
      }
    ];
  };

  return (
    <div className="flex h-screen">
      {/* Left Side - Static Configuration Panel */}
      <div className="w-[400px] flex-shrink-0 bg-slate-800/50 backdrop-blur-sm p-6 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6">vSAN Configuration</h2>
            
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Failures to Tolerate</label>
            <select
              value={vsanConfig.ftt}
              onChange={(e) => setVsanConfig({ ...vsanConfig, ftt: Number(e.target.value) as 1 | 2 | 3 })}
              className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2"
            >
              <option value={1}>1 Failure (RAID-1)</option>
              <option value={2}>2 Failures (RAID-6)</option>
              <option value={3}>3 Failures (Triple Mirror)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
                <div>
              <label className="block text-sm font-medium mb-2">Cores per Socket</label>
                  <input
                    type="number"
                value={vsanConfig.coresPerSocket}
                onChange={(e) => setVsanConfig({ ...vsanConfig, coresPerSocket: Number(e.target.value) })}
                className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2"
                min="4"
                max="64"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Sockets per Host</label>
              <select
                value={vsanConfig.socketsPerHost}
                onChange={(e) => setVsanConfig({ ...vsanConfig, socketsPerHost: Number(e.target.value) })}
                className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2"
              >
                <option value={1}>1 Socket</option>
                <option value={2}>2 Sockets</option>
              </select>
            </div>
                </div>

                <div>
            <label className="block text-sm font-medium mb-2">Memory per Host (GB)</label>
                  <input
                    type="number"
              value={vsanConfig.memoryPerHost}
              onChange={(e) => setVsanConfig({ ...vsanConfig, memoryPerHost: Number(e.target.value) })}
              className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2"
              min="64"
              max="2048"
                  />
                </div>

                <div>
            <label className="block text-sm font-medium mb-2">Maximum Utilization (%)</label>
            <input
              type="number"
              value={vsanConfig.maxUtilization}
              onChange={(e) => setVsanConfig({ ...vsanConfig, maxUtilization: Number(e.target.value) })}
              className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2"
              min="50"
              max="100"
            />
          </div>
        </div>

        {/* Resource Utilization Chart */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Resource Utilization</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getResourceData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="used"
                >
                  {getResourceData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: any) => {
                    const total = props.payload.total;
                    const percentage = ((value / total) * 100).toFixed(1);
                    return [`${value} (${percentage}%)`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {getResourceData().map((entry, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm">{entry.name}</span>
                </div>
                <span className="text-sm">
                  {entry.used} / {entry.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Recommendations */}
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl mb-6">
            <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-slate-400 mb-1">Minimum Hosts</h3>
                <p className="text-2xl font-bold">{recommendation.minimumHosts}</p>
                <p className="text-sm text-slate-400">Recommended: {recommendation.recommendedHosts} (N+1)</p>
                  </div>

              <div className="bg-slate-700/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-slate-400 mb-1">Maximum VMs</h3>
                <p className="text-2xl font-bold">{recommendation.maxVMs}</p>
                <p className="text-sm text-slate-400">Based on current configuration</p>
                  </div>

              <div className="bg-slate-700/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-slate-400 mb-1">Storage Overhead</h3>
                <p className="text-2xl font-bold">{recommendation.storageOverhead.multiplier}x</p>
                <p className="text-sm text-slate-400">+{recommendation.storageOverhead.percentage}% overhead</p>
              </div>
                  </div>

            <div className="mt-6 grid grid-cols-2 gap-6">
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-slate-400 mb-1">FTT Configuration</h3>
                <p className="text-2xl font-bold">FTT={vsanConfig.ftt}</p>
                <p className="text-sm text-slate-400">
                  {vsanConfig.ftt === 1 ? 'Tolerates 1 failure (3 hosts minimum)' :
                   vsanConfig.ftt === 2 ? 'Tolerates 2 failures (5 hosts minimum)' :
                   'Tolerates 3 failures (7 hosts minimum)'}
                </p>
                  </div>

              <div className="bg-slate-700/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-slate-400 mb-1">Required Hosts for FTT</h3>
                <p className="text-2xl font-bold">{recommendation.hostsForFTT}</p>
                <p className="text-sm text-slate-400">2×FTT + 1 = {2 * vsanConfig.ftt} + 1</p>
                    </div>
                </div>

            {recommendation.warnings.length > 0 && (
              <div className="mt-6 p-4 bg-red-900/20 border border-red-800 rounded">
                <h3 className="text-sm font-medium text-red-400 mb-2">Warnings</h3>
                <ul className="space-y-1">
                  {recommendation.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-red-400">{warning}</li>
                  ))}
                </ul>
              </div>
            )}
              </div>

          {/* VM Configuration */}
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Virtual Machines</h2>
                          <button
                onClick={addVM}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
                          >
                Add VM
                          </button>
                      </div>

            <div className="space-y-2">
              {vms.map((vm, index) => (
                <div key={index} className="bg-slate-700/30 p-3 rounded-lg">
                  <div className="flex items-center gap-4">
                          <input
                            type="text"
                            value={vm.name}
                            onChange={(e) => updateVM(index, 'name', e.target.value)}
                      className="w-32 bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm"
                      placeholder="VM Name"
                          />
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <Cpu className="w-4 h-4 text-slate-400 mr-1" />
                          <input
                            type="number"
                            value={vm.vCPUs}
                            onChange={(e) => updateVM(index, 'vCPUs', e.target.value)}
                          className="w-16 bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm"
                            min="1"
                          placeholder="vCPUs"
                          />
                        </div>
                      <div className="flex items-center">
                        <Memory className="w-4 h-4 text-slate-400 mr-1" />
                          <input
                            type="number"
                            value={vm.memory}
                            onChange={(e) => updateVM(index, 'memory', e.target.value)}
                          className="w-16 bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm"
                            min="1"
                          placeholder="GB"
                          />
                        </div>
                      <div className="flex items-center">
                        <HardDrive className="w-4 h-4 text-slate-400 mr-1" />
                          <input
                            type="number"
                            value={vm.storage}
                            onChange={(e) => updateVM(index, 'storage', e.target.value)}
                          className="w-16 bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm"
                            min="1"
                          placeholder="GB"
                          />
                      </div>
                      <div className="flex items-center">
                        <Server className="w-4 h-4 text-slate-400 mr-1" />
                        <input
                          type="number"
                          value={vm.count}
                          onChange={(e) => updateVM(index, 'count', e.target.value)}
                          className="w-16 bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm"
                          min="1"
                          placeholder="Count"
                        />
                      </div>
                    </div>
                  <button
                      onClick={() => removeVM(index)}
                      className="ml-auto text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                  <div className="mt-2 text-xs text-slate-400 flex justify-between">
                    <span>Total vCPUs: {vm.vCPUs * vm.count}</span>
                    <span>Total Memory: {vm.memory * vm.count} GB</span>
                    <span>Total Storage: {formatStorage(vm.storage * vm.count)}</span>
                      </div>
                    </div>
                  ))}
            </div>
            
            {/* Total Resources */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-lg font-semibold mb-4">Total Resources</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <div className="text-sm font-medium text-slate-400">Total vCPUs</div>
              <div className="text-2xl font-bold">{totalResources.vCPUs}</div>
                </div>
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <div className="text-sm font-medium text-slate-400">Total Memory</div>
                  <div className="text-2xl font-bold">{totalResources.memory} GB</div>
                </div>
                <div className="bg-slate-700/30 p-4 rounded-lg">
                  <div className="text-sm font-medium text-slate-400">Total Storage</div>
                  <div className="text-2xl font-bold">{formatStorage(totalResources.storage)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VsanCalculator;