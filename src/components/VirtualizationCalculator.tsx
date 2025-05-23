import React, { useState, useEffect } from 'react';
import { Cpu, Server, AlertTriangle, HardDrive, Gauge, Layers, Activity, Power, MemoryStick } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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

const MEMORY_DIMM_SIZES = [32, 64, 128, 256];
const MAX_DIMMS_PER_SERVER = 32;

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

interface ServerConfig {
  formFactor: '1U' | '2U';
  maxDisksPerServer: number;
  disksPerServer: number;
  diskSize: number;
  raidType: 'RAID 1' | 'RAID 5' | 'RAID 6' | 'RAID 10';
  memoryDimmSize: number;
  memoryDimmsPerServer: number;
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

const VirtualizationCalculator = () => {
  const [processors, setProcessors] = useState<Processor[]>([]);
  const [vms, setVms] = useState<VirtualMachine[]>([
    { name: 'VM-1', vCPUs: 2, memory: 4, storage: 1024, count: 1 }
  ]);
  const [coreRatio, setCoreRatio] = useState(4);
  const [selectedProcessor, setSelectedProcessor] = useState<Processor | null>(null);
  const [considerNPlusOne, setConsiderNPlusOne] = useState(true);
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    formFactor: '2U',
    maxDisksPerServer: 24,
    disksPerServer: 12,
    diskSize: DISK_SIZES[0],
    raidType: 'RAID 5',
    memoryDimmSize: 32,
    memoryDimmsPerServer: 16,
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

  const calculateTotalResources = () => {
    return vms.reduce((acc, vm) => ({
      vCPUs: acc.vCPUs + (vm.vCPUs * vm.count),
      memory: acc.memory + (vm.memory * vm.count),
      storage: acc.storage + (vm.storage * vm.count)
    }), { vCPUs: 0, memory: 0, storage: 0 });
  };

  const calculateRequiredServers = () => {
    if (!selectedProcessor) return { total: 0, forCompute: 0, forStorage: 0, forMemory: 0, storagePerServer: 0 };

    const totalResources = calculateTotalResources();
    const maxUtilizationFactor = serverConfig.maxUtilization / 100;
    
    // Calculate servers needed for CPU
    const requiredCores = Math.ceil(totalResources.vCPUs / coreRatio / maxUtilizationFactor);
    const coresPerServer = selectedProcessor.cores * 2;
    const serversForCompute = Math.ceil(requiredCores / coresPerServer);
    
    // Calculate servers needed for memory
    const memoryPerServer = serverConfig.memoryDimmSize * serverConfig.memoryDimmsPerServer;
    const serversForMemory = Math.ceil(totalResources.memory / (memoryPerServer * maxUtilizationFactor));
    
    // Calculate servers needed for storage
    const totalStorageGB = totalResources.storage;
    const usableStoragePerDisk = serverConfig.diskSize * RAID_FACTORS[serverConfig.raidType];
    const usableStoragePerServer = usableStoragePerDisk * serverConfig.disksPerServer;
    const serversForStorage = Math.ceil(totalStorageGB / (usableStoragePerServer * maxUtilizationFactor));
    
    // Take the maximum of servers needed for all resources
    let servers = Math.max(serversForCompute, serversForStorage, serversForMemory);
    
    if (considerNPlusOne) {
      servers += 1;
    }

    return {
      total: servers,
      forCompute: serversForCompute,
      forStorage: serversForStorage,
      forMemory: serversForMemory,
      storagePerServer: usableStoragePerServer
    };
  };

  const calculateResourceUtilization = () => {
    if (!selectedProcessor) return { cpu: 0, memory: 0, storage: 0 };
    
    const totalResources = calculateTotalResources();
    const serverReqs = calculateRequiredServers();
    
    // Calculate CPU utilization
    const totalAvailableCores = serverReqs.total * selectedProcessor.cores * 2;
    const cpuUtilization = (totalResources.vCPUs / (totalAvailableCores * coreRatio)) * 100;
    
    // Calculate memory utilization
    const totalAvailableMemory = serverReqs.total * serverConfig.memoryDimmSize * serverConfig.memoryDimmsPerServer;
    const memoryUtilization = (totalResources.memory / totalAvailableMemory) * 100;
    
    // Calculate storage utilization
    const totalAvailableStorage = serverReqs.total * serverReqs.storagePerServer;
    const storageUtilization = (totalResources.storage / totalAvailableStorage) * 100;
    
    return {
      cpu: Math.min(cpuUtilization, 100),
      memory: Math.min(memoryUtilization, 100),
      storage: Math.min(storageUtilization, 100)
    };
  };

  const calculateTotalSpecInt = () => {
    if (!selectedProcessor) return 0;
    const servers = calculateRequiredServers().total;
    return servers * selectedProcessor.spec_int_base * 2;
  };

  const handleFormFactorChange = (formFactor: '1U' | '2U') => {
    const maxDisks = formFactor === '1U' ? 10 : 24;
    setServerConfig({
      ...serverConfig,
      formFactor,
      maxDisksPerServer: maxDisks,
      disksPerServer: Math.min(serverConfig.disksPerServer, maxDisks)
    });
  };

  const handleDisksPerServerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    const maxDisks = serverConfig.formFactor === '1U' ? 10 : 24;
    
    if (value > maxDisks) {
      alert(`Maximum number of disks for ${serverConfig.formFactor} server is ${maxDisks}`);
      setServerConfig({
        ...serverConfig,
        disksPerServer: maxDisks
      });
    } else {
      setServerConfig({
        ...serverConfig,
        disksPerServer: value
      });
    }
  };

  const totalResources = calculateTotalResources();
  const serverRequirements = calculateRequiredServers();
  const utilization = calculateResourceUtilization();

  const utilizationCards = [
    {
      title: 'CPU Utilization',
      value: utilization.cpu.toFixed(1) + '%',
      icon: <Cpu className="text-blue-400" />,
      data: [
        { name: 'Used', value: utilization.cpu },
        { name: 'Available', value: 100 - utilization.cpu }
      ]
    },
    {
      title: 'Memory Utilization',
      value: utilization.memory.toFixed(1) + '%',
      icon: <MemoryStick className="text-emerald-400" />,
      data: [
        { name: 'Used', value: utilization.memory },
        { name: 'Available', value: 100 - utilization.memory }
      ]
    },
    {
      title: 'Storage Utilization',
      value: utilization.storage.toFixed(1) + '%',
      icon: <HardDrive className="text-amber-400" />,
      data: [
        { name: 'Used', value: utilization.storage },
        { name: 'Available', value: 100 - utilization.storage }
      ]
    }
  ];

  if (!selectedProcessor) {
    return <div>Loading processors...</div>;
  }

  return (
    <div className="flex flex-row-reverse gap-8">
      {/* Right Side - VM Configuration */}
      <div className="w-[400px] flex-shrink-0">
        <div className="sticky top-2">
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-6">VM Configuration</h2>
            
            <div className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
              {vms.map((vm, index) => (
                <div key={index} className="bg-slate-700 p-4 rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Virtual Machine {index + 1}</h3>
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
                Add Another VM Configuration
              </button>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Maximum Resource Utilization (%)
                  </label>
                  <input
                    type="number"
                    value={serverConfig.maxUtilization}
                    onChange={(e) => setServerConfig({ ...serverConfig, maxUtilization: Math.min(100, Math.max(0, Number(e.target.value))) })}
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
                    value={coreRatio}
                    onChange={(e) => setCoreRatio(parseInt(e.target.value))}
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

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Server Form Factor
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleFormFactorChange('1U')}
                      className={`p-4 rounded-lg flex items-center justify-center gap-2 ${
                        serverConfig.formFactor === '1U'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      <Server size={20} />
                      1U (Max 10 Disks)
                    </button>
                    <button
                      onClick={() => handleFormFactorChange('2U')}
                      className={`p-4 rounded-lg flex items-center justify-center gap-2 ${
                        serverConfig.formFactor === '2U'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      <Server size={20} />
                      2U (Max 24 Disks)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Memory DIMM Size
                  </label>
                  <select
                    value={serverConfig.memoryDimmSize}
                    onChange={(e) => setServerConfig({ ...serverConfig, memoryDimmSize: Number(e.target.value) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                  >
                    {MEMORY_DIMM_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size} GB
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Memory DIMMs per Server
                  </label>
                  <input
                    type="number"
                    value={serverConfig.memoryDimmsPerServer}
                    onChange={(e) => setServerConfig({ ...serverConfig, memoryDimmsPerServer: Math.min(MAX_DIMMS_PER_SERVER, Math.max(1, Number(e.target.value))) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="1"
                    max={MAX_DIMMS_PER_SERVER}
                  />
                  <p className="text-sm text-slate-400 mt-1">
                    Total Memory per Server: {serverConfig.memoryDimmSize * serverConfig.memoryDimmsPerServer} GB
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Number of Disks per Server
                  </label>
                  <input
                    type="number"
                    value={serverConfig.disksPerServer}
                    onChange={handleDisksPerServerChange}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="1"
                    max={serverConfig.maxDisksPerServer}
                  />
                  <p className="text-sm text-slate-400 mt-1">
                    Maximum {serverConfig.maxDisksPerServer} disks for {serverConfig.formFactor} server
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Disk Size
                  </label>
                  <select
                    value={serverConfig.diskSize}
                    onChange={(e) => setServerConfig({ ...serverConfig, diskSize: Number(e.target.value) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
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
                    RAID Configuration
                  </label>
                  <select
                    value={serverConfig.raidType}
                    onChange={(e) => setServerConfig({ ...serverConfig, raidType: e.target.value as ServerConfig['raidType'] })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="RAID 1">RAID 1 (50% usable)</option>
                    <option value="RAID 5">RAID 5 (75% usable)</option>
                    <option value="RAID 6">RAID 6 (67% usable)</option>
                    <option value="RAID 10">RAID 10 (50% usable)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="nPlusOne"
                  checked={considerNPlusOne}
                  onChange={(e) => setConsiderNPlusOne(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-500"
                />
                <label htmlFor="nPlusOne" className="text-sm text-slate-300">
                  Consider N+1 redundancy
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Left Side - Dashboards */}
      <div className="flex-1">
        <div className="sticky top-2 space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
              <div className="text-sm text-slate-400 mb-1">Required Servers</div>
              <div className="text-2xl font-bold">
                {serverRequirements.total}{considerNPlusOne && serverRequirements.total > 0 ? ' (+1)' : ''}
              </div>
              <div className="text-sm text-slate-400">
                <p>Compute: {serverRequirements.forCompute}</p>
                <p>Memory: {serverRequirements.forMemory}</p>
                <p>Storage: {serverRequirements.forStorage}</p>
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
              <div className="text-sm text-slate-400 mb-1">Total vCPUs</div>
              <div className="text-2xl font-bold">{totalResources.vCPUs}</div>
              <div className="text-sm text-slate-400">
                {(totalResources.vCPUs / (serverRequirements.total * selectedProcessor.cores * 2)).toFixed(2)}:1 ratio
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
              <div className="text-sm text-slate-400 mb-1">Total Memory</div>
              <div className="text-2xl font-bold">{formatStorage(totalResources.memory)}</div>
              <div className="text-sm text-slate-400">
                {formatStorage(serverConfig.memoryDimmSize * serverConfig.memoryDimmsPerServer)} per server
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
              <div className="text-sm text-slate-400 mb-1">Total Storage</div>
              <div className="text-2xl font-bold">{formatStorage(totalResources.storage)}</div>
              <div className="text-sm text-slate-400">
                {formatStorage(serverRequirements.storagePerServer)} per server
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {utilizationCards.map((card, index) => (
              <div key={index} className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {card.icon}
                    <div>
                      <h3 className="text-lg font-semibold">{card.title}</h3>
                      <p className="text-3xl font-bold mt-1">{card.value}</p>
                    </div>
                  </div>
                </div>
                
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={card.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {card.data.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === 0 ? COLORS[index] : '#1f2937'}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `${Number(value).toFixed(1)}%`}
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.5rem'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[0] }}></div>
                      <span>Used</span>
                    </div>
                    <span className="font-medium">{card.data[0].value.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                      <span>Available</span>
                    </div>
                    <span className="font-medium">{card.data[1].value.toFixed(1)}%</span>
                  </div>
                </div>

                {card.data[0].value > serverConfig.maxUtilization && (
                  <div className="mt-4 bg-red-900/50 text-red-200 p-3 rounded-lg flex items-center gap-2 text-sm">
                    <AlertTriangle size={16} />
                    <p>Exceeds {serverConfig.maxUtilization}% threshold</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualizationCalculator;