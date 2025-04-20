import React, { useState, useEffect } from 'react';
import { Cpu, Server, AlertTriangle, HardDrive, Network, MemoryStick as Memory, Layers, Activity, Power } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '../lib/supabase';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const DISK_SIZES = [
  240,      // 240 GB
  480,      // 480 GB
  960,      // 960 GB
  1966.08,  // 1.92 TB
  2048,     // 2 TB
  3932.16,  // 3.84 TB
  4096,     // 4 TB
  6144,     // 6 TB
  7864.32,  // 7.68 TB
  8192,     // 8 TB
  10240,    // 10 TB
  12288,    // 12 TB
  14336,    // 14 TB
  15728.64, // 15.36 TB
  16384,    // 16 TB
  18432,    // 18 TB
  20480,    // 20 TB
  22528,    // 22 TB
  24576,    // 24 TB
];

interface Processor {
  id: string;
  name: string;
  cores: number;
  frequency: string;
  generation: string;
  spec_int_base: number;
  tdp: number;
}

interface VirtualMachine {
  name: string;
  vCPUs: number;
  memory: number;
  storage: number;
  count: number;
}

interface VsanNode {
  id: string;
  name: string;
  diskGroups: number;
  disksPerGroup: number;
  cacheSize: number;
  capacitySize: number;
  deduplication: boolean;
  compression: boolean;
}

interface VsanConfig {
  ftt: 1 | 2 | 3; // Failures to Tolerate
  deduplication: boolean;
  compression: boolean;
  encryption: boolean;
  stretchedCluster: boolean;
  witnessNode: boolean;
  coreRatio: number;
  maxUtilization: number;
}

const RAID_FACTORS = {
  'RAID 1': 0.5,
  'RAID 5': 0.75,
  'RAID 6': 0.67,
  'RAID 10': 0.5
};

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

const VsanCalculator = () => {
  const [processors, setProcessors] = useState<Processor[]>([]);
  const [selectedProcessor, setSelectedProcessor] = useState<Processor | null>(null);
  const [nodes, setNodes] = useState<VsanNode[]>([]);
  const [vms, setVms] = useState<VirtualMachine[]>([
    { name: 'VM-1', vCPUs: 2, memory: 4, storage: 1024, count: 1 }
  ]);
  const [vsanConfig, setVsanConfig] = useState<VsanConfig>({
    ftt: 1,
    deduplication: false,
    compression: true,
    encryption: false,
    stretchedCluster: false,
    witnessNode: false,
    coreRatio: 4,
    maxUtilization: 90
  });

  useEffect(() => {
    const fetchProcessors = async () => {
      const { data, error } = await supabase
        .from('processors')
        .select('*')
        .order('generation', { ascending: true })
        .order('spec_int_base', { ascending: false });

      if (error) {
        console.error('Error fetching processors:', error);
        return;
      }

      setProcessors(data);
      if (data.length > 0) {
        setSelectedProcessor(data[0]);
      }
    };

    fetchProcessors();
  }, []);

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

  const addNode = () => {
    const newNode: VsanNode = {
      id: Date.now().toString(),
      name: `Node ${nodes.length + 1}`,
      diskGroups: 1,
      disksPerGroup: 4,
      cacheSize: 3932.16, // 3.84 TB
      capacitySize: 7864.32, // 7.68 TB
      deduplication: vsanConfig.deduplication,
      compression: vsanConfig.compression
    };
    setNodes([...nodes, newNode]);
  };

  const removeNode = (id: string) => {
    setNodes(nodes.filter(node => node.id !== id));
  };

  const updateNode = (id: string, updates: Partial<VsanNode>) => {
    setNodes(nodes.map(node => 
      node.id === id ? { ...node, ...updates } : node
    ));
  };

  const calculateTotalResources = () => {
    return vms.reduce((acc, vm) => ({
      vCPUs: acc.vCPUs + (vm.vCPUs * vm.count),
      memory: acc.memory + (vm.memory * vm.count),
      storage: acc.storage + (vm.storage * vm.count)
    }), { vCPUs: 0, memory: 0, storage: 0 });
  };

  const calculateRawCapacity = () => {
    return nodes.reduce((total, node) => {
      const capacityPerGroup = node.disksPerGroup * node.capacitySize;
      return total + (capacityPerGroup * node.diskGroups);
    }, 0);
  };

  const calculateUsableCapacity = () => {
    const rawCapacity = calculateRawCapacity();
    let usableCapacity = rawCapacity;

    // Apply FTT reduction
    switch (vsanConfig.ftt) {
      case 1: usableCapacity *= 0.5; break;  // RAID-1
      case 2: usableCapacity *= 0.33; break; // RAID-6
      case 3: usableCapacity *= 0.25; break; // Triple mirroring
    }

    // Apply data reduction if enabled
    if (vsanConfig.deduplication && vsanConfig.compression) {
      usableCapacity *= 2; // Estimated 2:1 data reduction ratio
    } else if (vsanConfig.compression) {
      usableCapacity *= 1.5; // Estimated 1.5:1 compression ratio
    }

    return usableCapacity;
  };

  const calculateResourceUtilization = () => {
    if (!selectedProcessor || nodes.length === 0) return { cpu: 0, memory: 0, storage: 0 };
    
    const totalResources = calculateTotalResources();
    const maxUtilizationFactor = vsanConfig.maxUtilization / 100;
    
    // Calculate total available resources
    const totalCores = nodes.length * selectedProcessor.cores * 2;
    const totalVCPUs = totalCores * vsanConfig.coreRatio;
    const usableStorage = calculateUsableCapacity();
    
    // Calculate utilization percentages
    const cpuUtilization = (totalResources.vCPUs / totalVCPUs) * 100;
    const storageUtilization = (totalResources.storage / usableStorage) * 100;
    
    return {
      cpu: Math.min(cpuUtilization, 100),
      storage: Math.min(storageUtilization, 100)
    };
  };

  const utilization = calculateResourceUtilization();
  const totalResources = calculateTotalResources();

  if (!selectedProcessor) {
    return <div>Loading processors...</div>;
  }

  return (
    <div className="flex flex-row-reverse gap-8">
      {/* Right Side - Configuration */}
      <div className="w-[400px] flex-shrink-0">
        <div className="sticky top-2">
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-6">vSAN Configuration</h2>
            
            <div className="space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Maximum Resource Utilization (%)
                  </label>
                  <input
                    type="number"
                    value={vsanConfig.maxUtilization}
                    onChange={(e) => setVsanConfig({ ...vsanConfig, maxUtilization: Math.min(100, Math.max(0, Number(e.target.value))) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Core Ratio (vCPU:pCPU)
                  </label>
                  <input
                    type="number"
                    value={vsanConfig.coreRatio}
                    onChange={(e) => setVsanConfig({ ...vsanConfig, coreRatio: parseInt(e.target.value) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Processor Model
                  </label>
                  <select
                    value={selectedProcessor.id}
                    onChange={(e) => {
                      const processor = processors.find(p => p.id === e.target.value);
                      if (processor) setSelectedProcessor(processor);
                    }}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                  >
                    {processors.map((processor) => (
                      <option key={processor.id} value={processor.id}>
                        {processor.name} ({processor.cores} cores, {processor.frequency}, {processor.tdp}W)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="deduplication"
                      checked={vsanConfig.deduplication}
                      onChange={(e) => setVsanConfig({ ...vsanConfig, deduplication: e.target.checked })}
                      className="rounded border-slate-500"
                    />
                    <label htmlFor="deduplication" className="text-sm text-slate-300">
                      Enable Deduplication
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="compression"
                      checked={vsanConfig.compression}
                      onChange={(e) => setVsanConfig({ ...vsanConfig, compression: e.target.checked })}
                      className="rounded border-slate-500"
                    />
                    <label htmlFor="compression" className="text-sm text-slate-300">
                      Enable Compression
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="encryption"
                      checked={vsanConfig.encryption}
                      onChange={(e) => setVsanConfig({ ...vsanConfig, encryption: e.target.checked })}
                      className="rounded border-slate-500"
                    />
                    <label htmlFor="encryption" className="text-sm text-slate-300">
                      Enable Encryption
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="stretchedCluster"
                      checked={vsanConfig.stretchedCluster}
                      onChange={(e) => setVsanConfig({ ...vsanConfig, stretchedCluster: e.target.checked })}
                      className="rounded border-slate-500"
                    />
                    <label htmlFor="stretchedCluster" className="text-sm text-slate-300">
                      Stretched Cluster
                    </label>
                  </div>

                  {vsanConfig.stretchedCluster && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="witnessNode"
                        checked={vsanConfig.witnessNode}
                        onChange={(e) => setVsanConfig({ ...vsanConfig, witnessNode: e.target.checked })}
                        className="rounded border-slate-500"
                      />
                      <label htmlFor="witnessNode" className="text-sm text-slate-300">
                        Include Witness Node
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-lg font-semibold mb-4">Virtual Machines</h3>
                <div className="space-y-4">
                  {vms.map((vm, index) => (
                    <div key={index} className="bg-slate-700 p-4 rounded-lg space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Virtual Machine {index + 1}</h4>
                        {vms.length > 1 && (
                          <button
                            onClick={() => removeVM(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">
                            VM Name
                          </label>
                          <input
                            type="text"
                            value={vm.name}
                            onChange={(e) => updateVM(index, 'name', e.target.value)}
                            className="w-full bg-slate-600 rounded-lg px-4 py-2 text-white"
                            placeholder="Enter VM name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">
                            Number of VMs
                          </label>
                          <input
                            type="number"
                            value={vm.count}
                            onChange={(e) => updateVM(index, 'count', e.target.value)}
                            className="w-full bg-slate-600 rounded-lg px-4 py-2 text-white"
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">
                            vCPUs
                          </label>
                          <input
                            type="number"
                            value={vm.vCPUs}
                            onChange={(e) => updateVM(index, 'vCPUs', e.target.value)}
                            className="w-full bg-slate-600 rounded-lg px-4 py-2 text-white"
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">
                            Memory (GB)
                          </label>
                          <input
                            type="number"
                            value={vm.memory}
                            onChange={(e) => updateVM(index, 'memory', e.target.value)}
                            className="w-full bg-slate-600 rounded-lg px-4 py-2 text-white"
                            min="1"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-slate-300 mb-1">
                            Storage (GB)
                          </label>
                          <input
                            type="number"
                            value={vm.storage}
                            onChange={(e) => updateVM(index, 'storage', e.target.value)}
                            className="w-full bg-slate-600 rounded-lg px-4 py-2 text-white"
                            min="1"
                          />
                        </div>
                      </div>

                      <div className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded-lg">
                        <div className="grid grid-cols-3 gap-2">
                          <div>Total vCPUs: {vm.vCPUs * vm.count}</div>
                          <div>Total Memory: {formatStorage(vm.memory * vm.count)}</div>
                          <div>Total Storage: {formatStorage(vm.storage * vm.count)}</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addVM}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 transition-colors"
                  >
                    Add Another VM
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-lg font-semibold mb-4">Nodes</h3>
                <div className="space-y-4">
                  {nodes.map((node) => (
                    <div key={node.id} className="bg-slate-700 p-4 rounded-lg space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{node.name}</h4>
                        <button
                          onClick={() => removeNode(node.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">
                            Disk Groups
                          </label>
                          <input
                            type="number"
                            value={node.diskGroups}
                            onChange={(e) => updateNode(node.id, { diskGroups: Number(e.target.value) })}
                            className="w-full bg-slate-600 rounded-lg px-4 py-2 text-white"
                            min="1"
                            max="5"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">
                            Disks per Group
                          </label>
                          <input
                            type="number"
                            value={node.disksPerGroup}
                            onChange={(e) => updateNode(node.id, { disksPerGroup: Number(e.target.value) })}
                            className="w-full bg-slate-600 rounded-lg px-4 py-2 text-white"
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">
                            Cache Disk Size
                          </label>
                          <select
                            value={node.cacheSize}
                            onChange={(e) => updateNode(node.id, { cacheSize: Number(e.target.value) })}
                            className="w-full bg-slate-600 rounded-lg px-4 py-2 text-white"
                          >
                            {DISK_SIZES.map((size) => (
                              <option key={size} value={size}>
                                {formatStorage(size)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1">
                            Capacity Disk Size
                          </label>
                          <select
                            value={node.capacitySize}
                            onChange={(e) => updateNode(node.id, { capacitySize: Number(e.target.value) })}
                            className="w-full bg-slate-600 rounded-lg px-4 py-2 text-white"
                          >
                            {DISK_SIZES.map((size) => (
                              <option key={size} value={size}>
                                {formatStorage(size)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded-lg">
                        <div className="grid grid-cols-2 gap-2">
                          <div>Cache: {formatStorage(node.cacheSize * node.diskGroups)}</div>
                          <div>Capacity: {formatStorage(node.capacitySize * node.diskGroups * node.disksPerGroup)}</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addNode}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 transition-colors"
                  >
                    Add Node
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Left Side - Dashboard */}
      <div className="flex-1">
        <div className="sticky top-2 space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
              <div className="text-sm text-slate-400 mb-1">Total Nodes</div>
              <div className="text-2xl font-bold">{nodes.length}</div>
              <div className="text-sm text-slate-400">
                {vsanConfig.stretchedCluster && vsanConfig.witnessNode ? '(+1 Witness)' : ''}
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
              <div className="text-sm text-slate-400 mb-1">Total vCPUs</div>
              <div className="text-2xl font-bold">{totalResources.vCPUs}</div>
              <div className="text-sm text-slate-400">
                {nodes.length > 0 && selectedProcessor ? 
                  `${(totalResources.vCPUs / (nodes.length * selectedProcessor.cores * 2 * vsanConfig.coreRatio)).toFixed(2)}:1 ratio` : 
                  'No nodes'}
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
              <div className="text-sm text-slate-400 mb-1">Total Memory</div>
              <div className="text-2xl font-bold">{formatStorage(totalResources.memory)}</div>
              <div className="text-sm text-slate-400">Required</div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
              <div className="text-sm text-slate-400 mb-1">Total Storage</div>
              <div className="text-2xl font-bold">{formatStorage(totalResources.storage)}</div>
              <div className="text-sm text-slate-400">Required</div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Resource Utilization</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>CPU Utilization</span>
                  <span>{utilization.cpu.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${utilization.cpu}%` }}
                  ></div>
                </div>
                {utilization.cpu > vsanConfig.maxUtilization && (
                  <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    <span>Exceeds {vsanConfig.maxUtilization}% threshold</span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Storage Utilization</span>
                  <span>{utilization.storage.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${utilization.storage}%` }}
                  ></div>
                </div>
                {utilization.storage > vsanConfig.maxUtilization && (
                  <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    <span>Exceeds {vsanConfig.maxUtilization}% threshold</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Configuration Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-sm text-slate-400">Protection Level</div>
                  <div className="font-medium mt-1">
                    FTT={vsanConfig.ftt} 
                    ({vsanConfig.ftt === 1 ? 'RAID-1' : 
                      vsanConfig.ftt === 2 ? 'RAID-6' : 
                      'Triple Mirror'})
                  </div>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-sm text-slate-400">Cluster Type</div>
                  <div className="font-medium mt-1">
                    {vsanConfig.stretchedCluster ? 'Stretched' : 'Standard'}
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/50 p-3 rounded-lg">
                <div className="text-sm text-slate-400">Features</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {vsanConfig.deduplication && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                      Deduplication
                    </span>
                  )}
                  {vsanConfig.compression && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                      Compression
                    </span>
                  )}
                  {vsanConfig.encryption && (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                      Encryption
                    </span>
                  )}
                  {vsanConfig.witnessNode && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                      Witness Node
                    </span>
                  )}
                </div>
              </div>

              {nodes.length > 0 && (
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <div className="text-sm text-slate-400">Node Configuration</div>
                  <div className="mt-2 space-y-2">
                    {nodes.map((node, index) => (
                      <div key={node.id} className="flex justify-between items-center text-sm">
                        <span>{node.name}</span>
                        <span>
                          {node.diskGroups} × {node.disksPerGroup} disks
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VsanCalculator;