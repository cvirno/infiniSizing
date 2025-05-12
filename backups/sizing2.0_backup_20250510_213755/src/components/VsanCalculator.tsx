import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Cpu, Server, AlertTriangle, HardDrive, Network, MemoryStick as Memory, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import ServerDiskVisualization from './ServerDiskVisualization';

interface VirtualMachine {
  name: string;
  vCPUs: number;
  memory: number;
  storage: number;
  count: number;
  coreRatio: number;
  disk: number;
}

interface DiskOption {
  id: string;
  model: string;
  capacity_gb: number;
  form_factor: string;
  type: string;
  interface: string;
}

interface VsanConfig {
  ftt: 1 | 2 | 3;
  deduplication: boolean;
  compression: boolean;
  encryption: boolean;
  coresPerSocket: number;
  socketsPerHost: number;
  memoryPerHost: number;
  maxUtilization: number;
  formFactor: '1U' | '2U';
  storageType: 'all-flash' | 'hybrid';
  operationReserve: boolean;
  diskConfig: {
    type: 'SSD' | 'NVMe' | 'NL-SAS';
    formFactor: '2.5' | '3.5';
    count: number;
    selectedDiskId: string | null;
    smallDiskCount: number;
    largeDiskCount: number;
  };
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
  maxVMsByCPU: number;
  maxVMsByMemory: number;
  maxVMsByStorage: number;
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

// Adicionar array de discos local
const LOCAL_DISK_OPTIONS: DiskOption[] = [
  // SSD 2.5"
  { id: 'ssd-480', model: 'SSD 480GB', capacity_gb: 480, form_factor: '2.5', type: 'SSD', interface: 'SAS' },
  { id: 'ssd-960', model: 'SSD 960GB', capacity_gb: 960, form_factor: '2.5', type: 'SSD', interface: 'SAS' },
  { id: 'ssd-1920', model: 'SSD 1.92TB', capacity_gb: 1920, form_factor: '2.5', type: 'SSD', interface: 'SAS' },
  { id: 'ssd-3840', model: 'SSD 3.84TB', capacity_gb: 3840, form_factor: '2.5', type: 'SSD', interface: 'SAS' },
  { id: 'ssd-7680', model: 'SSD 7.68TB', capacity_gb: 7680, form_factor: '2.5', type: 'SSD', interface: 'SAS' },
  { id: 'ssd-15360', model: 'SSD 15.36TB', capacity_gb: 15360, form_factor: '2.5', type: 'SSD', interface: 'SAS' },
  { id: 'ssd-30720', model: 'SSD 30.72TB', capacity_gb: 30720, form_factor: '2.5', type: 'SSD', interface: 'SAS' },
  
  // NVMe 2.5"
  { id: 'nvme-480', model: 'NVMe 480GB', capacity_gb: 480, form_factor: '2.5', type: 'NVMe', interface: 'NVMe' },
  { id: 'nvme-960', model: 'NVMe 960GB', capacity_gb: 960, form_factor: '2.5', type: 'NVMe', interface: 'NVMe' },
  { id: 'nvme-1920', model: 'NVMe 1.92TB', capacity_gb: 1920, form_factor: '2.5', type: 'NVMe', interface: 'NVMe' },
  { id: 'nvme-3840', model: 'NVMe 3.84TB', capacity_gb: 3840, form_factor: '2.5', type: 'NVMe', interface: 'NVMe' },
  { id: 'nvme-7680', model: 'NVMe 7.68TB', capacity_gb: 7680, form_factor: '2.5', type: 'NVMe', interface: 'NVMe' },
  { id: 'nvme-15360', model: 'NVMe 15.36TB', capacity_gb: 15360, form_factor: '2.5', type: 'NVMe', interface: 'NVMe' },
  { id: 'nvme-30720', model: 'NVMe 30.72TB', capacity_gb: 30720, form_factor: '2.5', type: 'NVMe', interface: 'NVMe' },
  
  // NL-SAS 3.5"
  { id: 'nlsas-1024', model: 'NL-SAS 1TB', capacity_gb: 1024, form_factor: '3.5', type: 'NL-SAS', interface: 'SAS' },
  { id: 'nlsas-2048', model: 'NL-SAS 2TB', capacity_gb: 2048, form_factor: '3.5', type: 'NL-SAS', interface: 'SAS' },
  { id: 'nlsas-4096', model: 'NL-SAS 4TB', capacity_gb: 4096, form_factor: '3.5', type: 'NL-SAS', interface: 'SAS' },
  { id: 'nlsas-6144', model: 'NL-SAS 6TB', capacity_gb: 6144, form_factor: '3.5', type: 'NL-SAS', interface: 'SAS' },
  { id: 'nlsas-8192', model: 'NL-SAS 8TB', capacity_gb: 8192, form_factor: '3.5', type: 'NL-SAS', interface: 'SAS' },
  { id: 'nlsas-10240', model: 'NL-SAS 10TB', capacity_gb: 10240, form_factor: '3.5', type: 'NL-SAS', interface: 'SAS' },
  { id: 'nlsas-12288', model: 'NL-SAS 12TB', capacity_gb: 12288, form_factor: '3.5', type: 'NL-SAS', interface: 'SAS' },
  { id: 'nlsas-16384', model: 'NL-SAS 16TB', capacity_gb: 16384, form_factor: '3.5', type: 'NL-SAS', interface: 'SAS' },
  { id: 'nlsas-18432', model: 'NL-SAS 18TB', capacity_gb: 18432, form_factor: '3.5', type: 'NL-SAS', interface: 'SAS' },
  { id: 'nlsas-20480', model: 'NL-SAS 20TB', capacity_gb: 20480, form_factor: '3.5', type: 'NL-SAS', interface: 'SAS' },
  { id: 'nlsas-22528', model: 'NL-SAS 22TB', capacity_gb: 22528, form_factor: '3.5', type: 'NL-SAS', interface: 'SAS' }
];

const VsanCalculator = () => {
  const [vms, setVms] = useState<VirtualMachine[]>([
    { 
      name: 'DB-Server', 
      vCPUs: 2, 
      memory: 4, 
      storage: 1024, 
      count: 1,
      coreRatio: 2,
      disk: 1024
    }
  ]);
  const [vsanConfig, setVsanConfig] = useState<VsanConfig>({
    ftt: 1,
    deduplication: false,
    compression: true,
    encryption: false,
    coresPerSocket: 12,
    socketsPerHost: 2,
    memoryPerHost: 768,
    maxUtilization: 90,
    formFactor: '2U',
    storageType: 'all-flash',
    operationReserve: false,
    diskConfig: {
      type: 'SSD',
      formFactor: '2.5',
      count: 24,
      selectedDiskId: null,
      smallDiskCount: 24,
      largeDiskCount: 0
    }
  });
  const [diskOptions, setDiskOptions] = useState<DiskOption[]>(LOCAL_DISK_OPTIONS);

  // Remover o useEffect que carrega do Supabase e substituir por inicialização direta
  useEffect(() => {
    // Set initial disk if available
    if (diskOptions.length > 0) {
      const ssdDisks = diskOptions.filter(d => d.type.toUpperCase() === 'SSD');
      if (ssdDisks.length > 0) {
        const firstSSD = ssdDisks[0];
        setVsanConfig(prev => ({
          ...prev,
          diskConfig: {
            type: 'SSD',
            formFactor: firstSSD.form_factor as '2.5' | '3.5',
            selectedDiskId: firstSSD.id,
            count: getMaxDisksByFormFactor(prev.formFactor, firstSSD.form_factor as '2.5' | '3.5'),
            smallDiskCount: getMaxDisksByFormFactor(prev.formFactor, firstSSD.form_factor as '2.5' | '3.5'),
            largeDiskCount: 0
          }
        }));
      }
    }
  }, []);

  const getMaxDisksByFormFactor = useCallback((formFactor: '1U' | '2U', diskFormFactor: '2.5' | '3.5') => {
    if (formFactor === '1U') {
      if (diskFormFactor === '2.5') {
        return 12; // 1U: 12 discos de 2.5"
      } else {
        return 4;  // 1U: 4 discos de 3.5" + 2 discos de 2.5"
      }
    } else { // 2U
      if (diskFormFactor === '2.5') {
        return 24; // 2U: 24 discos de 2.5"
      } else {
        return 12; // 2U: 12 discos de 3.5" + 4 discos de 2.5"
      }
    }
  }, []);

  // Adicionar função para validar a combinação de discos
  const validateDiskCombination = useCallback((formFactor: '1U' | '2U', diskType: 'SSD' | 'NVMe' | 'NL-SAS', diskFormFactor: '2.5' | '3.5') => {
    if (formFactor === '1U') {
      if (diskFormFactor === '3.5' && diskType !== 'NL-SAS') {
        return false; // 1U com 3.5" só permite NL-SAS
      }
    } else { // 2U
      if (diskFormFactor === '3.5' && diskType !== 'NL-SAS') {
        return false; // 2U com 3.5" só permite NL-SAS
      }
    }
    return true;
  }, []);

  const calculateTotalResources = useCallback(() => {
    return vms.reduce((total, vm) => {
      return {
        vCPUs: total.vCPUs + (vm.vCPUs * vm.count),
        effectiveVCPUs: total.effectiveVCPUs + (vm.vCPUs * vm.count / vm.coreRatio),
        memory: total.memory + (vm.memory * vm.count),
        storage: total.storage + (vm.disk * vm.count)
      };
    }, {
      vCPUs: 0,
      effectiveVCPUs: 0,
      memory: 0,
      storage: 0
    });
  }, [vms]);

  const calculateUsableCapacity = useCallback((hosts: number) => {
    const selectedDisk = diskOptions.find(d => d.id === vsanConfig.diskConfig.selectedDiskId);
    if (!selectedDisk) return 0;
    const capacityPerHost = selectedDisk.capacity_gb * vsanConfig.diskConfig.count;
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

    // Apply Operation Reserve if enabled
    if (vsanConfig.operationReserve) {
      usableCapacity *= 0.7; // Reserve 30% for operations
    }

    return usableCapacity;
  }, [vsanConfig, diskOptions]);
    
  const calculateVsanRecommendation = useCallback((): VsanRecommendation => {
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
    
    // Calculate effective vCPUs considering each VM's core ratio
    const effectiveVCPUs = vms.reduce((total, vm) => {
      return total + (vm.vCPUs * vm.count / vm.coreRatio);
    }, 0);
    
    // Hosts needed for resources
    const hostsForCPU = Math.ceil(effectiveVCPUs / coresPerHost);
    const hostsForMemory = Math.ceil(totalResources.memory / vsanConfig.memoryPerHost);
    
    // Start with minimum hosts needed
    let minimumHosts = Math.max(hostsForFTT, hostsForVMs, hostsForCPU, hostsForMemory);
    
    // Calculate resource utilization with minimum hosts
    let storageUtilization = 0;
    let usableCapacity = 0;
    
    // Add a maximum iteration limit to prevent infinite loops
    const MAX_ITERATIONS = 100;
    let iterations = 0;
    
    // Keep increasing hosts until storage utilization is acceptable or max iterations reached
    while (iterations < MAX_ITERATIONS) {
      usableCapacity = calculateUsableCapacity(minimumHosts);
      storageUtilization = (totalResources.storage * storageOverhead.multiplier / usableCapacity) * 100;
      
      if (storageUtilization <= vsanConfig.maxUtilization) {
        break;
      }
      
      minimumHosts++;
      iterations++;
    }

    // Add warning if max iterations reached
    if (iterations >= MAX_ITERATIONS) {
      warnings.push('Maximum iteration limit reached. Consider adjusting your configuration.');
    }

    // Calculate resource utilization percentages
    const resourceUtilization = {
      cpu: (effectiveVCPUs / (minimumHosts * coresPerHost)) * 100,
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
    const maxVMsByCPU = Math.floor((minimumHosts * coresPerHost) / effectiveVCPUs * totalVMs);
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
      storageOverhead,
      maxVMsByCPU,
      maxVMsByMemory,
      maxVMsByStorage
    };
  }, [vms, vsanConfig, calculateTotalResources, calculateUsableCapacity]);

  const addVM = useCallback(() => {
    setVms(prevVms => [...prevVms, {
      name: `VM-${prevVms.length + 1}`,
      vCPUs: 2,
      memory: 4,
      storage: 1024,
      count: 1,
      coreRatio: 2,
      disk: 1024
    }]);
  }, []);

  const removeVM = useCallback((index: number) => {
    setVms(prevVms => prevVms.filter((_, i) => i !== index));
  }, []);

  const updateVM = useCallback((index: number, field: keyof VirtualMachine, value: number | string) => {
    setVms(prevVms => {
      const newVMs = [...prevVms];
      if (field === 'name') {
        newVMs[index] = { ...newVMs[index], [field]: value as string };
      } else {
        newVMs[index] = { ...newVMs[index], [field]: Number(value) };
      }
      return newVMs;
    });
  }, []);

  const recommendation = useMemo(() => calculateVsanRecommendation(), [calculateVsanRecommendation]);
  const totalResources = useMemo(() => calculateTotalResources(), [calculateTotalResources]);

  const resourceData = useMemo(() => {
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
  }, [vsanConfig, recommendation, totalResources, calculateUsableCapacity]);

  return (
    <div className="flex h-screen">
      {/* Left Side - Static Configuration Panel */}
      <div className="w-[400px] flex-shrink-0 bg-slate-800/50 backdrop-blur-sm p-6 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-6">vSAN Configuration</h2>
        
        <div className="space-y-6">
          {/* Server Configuration */}
          <div>
            <label className="block text-sm font-medium mb-2">Server Form Factor</label>
            <select
              value={vsanConfig.formFactor}
              onChange={(e) => {
                const newFormFactor = e.target.value as '1U' | '2U';
                const maxDisks = getMaxDisksByFormFactor(newFormFactor, vsanConfig.diskConfig.formFactor);
                setVsanConfig(prev => ({
                  ...prev,
                  formFactor: newFormFactor,
                  diskConfig: {
                    ...prev.diskConfig,
                    count: Math.min(prev.diskConfig.count, maxDisks),
                    smallDiskCount: Math.min(prev.diskConfig.smallDiskCount, maxDisks),
                    largeDiskCount: Math.min(prev.diskConfig.largeDiskCount, maxDisks)
                  }
                }));
              }}
              className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2"
            >
              <option value="1U">1U Server</option>
              <option value="2U">2U Server</option>
            </select>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Storage Type</label>
              <select
                value={vsanConfig.storageType}
                onChange={(e) => {
                  const newType = e.target.value as 'all-flash' | 'hybrid';
                  setVsanConfig(prev => ({
                    ...prev,
                    storageType: newType,
                    diskConfig: {
                      ...prev.diskConfig,
                      type: 'SSD',
                      formFactor: '2.5',
                      largeDiskCount: 0,
                      selectedDiskId: null
                    }
                  }));
                }}
                className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2"
              >
                <option value="all-flash">All-Flash (SSD/NVMe only)</option>
                <option value="hybrid">Hybrid (SSD/NVMe + NL-SAS)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">2.5" Disks (SSD/NVMe)</label>
              <div className="flex gap-4">
                <select
                  value={vsanConfig.diskConfig.type === 'NL-SAS' ? 'SSD' : vsanConfig.diskConfig.type}
                  onChange={(e) => {
                    const newType = e.target.value as 'SSD' | 'NVMe';
                    setVsanConfig(prev => ({
                      ...prev,
                      diskConfig: {
                        ...prev.diskConfig,
                        type: newType,
                        formFactor: '2.5',
                        selectedDiskId: null
                      }
                    }));
                  }}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2"
                >
                  <option value="SSD">SSD</option>
                  <option value="NVMe">NVMe</option>
                </select>
                <select
                  value={vsanConfig.diskConfig.selectedDiskId || ''}
                  onChange={(e) => {
                    const selectedDisk = diskOptions.find(d => d.id === e.target.value);
                    if (selectedDisk) {
                      setVsanConfig(prev => ({
                        ...prev,
                        diskConfig: {
                          ...prev.diskConfig,
                          selectedDiskId: selectedDisk.id,
                          type: selectedDisk.type as 'SSD' | 'NVMe',
                          formFactor: selectedDisk.form_factor as '2.5'
                        }
                      }));
                    }
                  }}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2"
                >
                  <option value="">Select disk capacity</option>
                  {diskOptions
                    .filter(d => d.type === vsanConfig.diskConfig.type && d.form_factor === '2.5')
                    .map(disk => (
                      <option key={disk.id} value={disk.id}>
                        {disk.model} - {formatStorage(disk.capacity_gb)}
                      </option>
                    ))}
                </select>
                <input
                  type="number"
                  value={vsanConfig.diskConfig.smallDiskCount}
                  onChange={(e) => {
                    const newCount = Number(e.target.value);
                    const maxSmallDisks = vsanConfig.formFactor === '1U' ? 12 : 24;
                    setVsanConfig(prev => ({
                      ...prev,
                      diskConfig: {
                        ...prev.diskConfig,
                        smallDiskCount: Math.min(newCount, maxSmallDisks),
                        count: Math.min(newCount, maxSmallDisks) + prev.diskConfig.largeDiskCount
                      }
                    }));
                  }}
                  min="0"
                  max={vsanConfig.formFactor === '1U' ? 12 : 24}
                  className="w-24 bg-slate-700/50 border border-slate-600 rounded px-3 py-2"
                />
              </div>
            </div>

            {vsanConfig.storageType === 'hybrid' && (
              <div>
                <label className="block text-sm font-medium mb-2">3.5" Disks (NL-SAS)</label>
                <div className="flex gap-4">
                  <select
                    value="NL-SAS"
                    disabled
                    className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 opacity-50"
                  >
                    <option value="NL-SAS">NL-SAS</option>
                  </select>
                  <select
                    value={vsanConfig.diskConfig.selectedDiskId || ''}
                    onChange={(e) => {
                      const selectedDisk = diskOptions.find(d => d.id === e.target.value);
                      if (selectedDisk) {
                        setVsanConfig(prev => ({
                          ...prev,
                          diskConfig: {
                            ...prev.diskConfig,
                            selectedDiskId: selectedDisk.id,
                            type: 'NL-SAS',
                            formFactor: '3.5'
                          }
                        }));
                      }
                    }}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2"
                  >
                    <option value="">Select disk capacity</option>
                    {diskOptions
                      .filter(d => d.type === 'NL-SAS' && d.form_factor === '3.5')
                      .map(disk => (
                        <option key={disk.id} value={disk.id}>
                          {disk.model} - {formatStorage(disk.capacity_gb)}
                        </option>
                      ))}
                  </select>
                  <input
                    type="number"
                    value={vsanConfig.diskConfig.largeDiskCount}
                    onChange={(e) => {
                      const newCount = Number(e.target.value);
                      const maxLargeDisks = vsanConfig.formFactor === '1U' ? 4 : 12;
                      setVsanConfig(prev => ({
                        ...prev,
                        diskConfig: {
                          ...prev.diskConfig,
                          largeDiskCount: Math.min(newCount, maxLargeDisks),
                          count: prev.diskConfig.smallDiskCount + Math.min(newCount, maxLargeDisks)
                        }
                      }));
                    }}
                    min="0"
                    max={vsanConfig.formFactor === '1U' ? 4 : 12}
                    className="w-24 bg-slate-700/50 border border-slate-600 rounded px-3 py-2"
                  />
                </div>
              </div>
            )}

            <div className="text-sm text-slate-400 space-y-1">
              <p className="font-medium">Disk Configuration Rules:</p>
              {vsanConfig.formFactor === '1U' ? (
                <>
                  <p>• Maximum 12x 2.5" (SSD/NVMe)</p>
                  {vsanConfig.storageType === 'hybrid' && <p>• Maximum 4x 3.5" (NL-SAS)</p>}
                  {vsanConfig.storageType === 'hybrid' && <p>• You can mix both types</p>}
                </>
              ) : (
                <>
                  <p>• Maximum 24x 2.5" (SSD/NVMe)</p>
                  {vsanConfig.storageType === 'hybrid' && <p>• Maximum 12x 3.5" (NL-SAS)</p>}
                  {vsanConfig.storageType === 'hybrid' && <p>• You can mix both types</p>}
                </>
              )}
            </div>
          </div>

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

        <div className="mt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={vsanConfig.operationReserve}
              onChange={(e) => setVsanConfig({ ...vsanConfig, operationReserve: e.target.checked })}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <span className="text-sm font-medium">Operation Reserve (30%)</span>
          </label>
          <p className="mt-1 text-xs text-slate-400">
            Reserve 30% of storage capacity for vSAN operations and maintenance
          </p>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Resource Utilization</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">CPU Utilization</span>
                <span className="text-sm text-slate-400">
                  {resourceData[0].used} / {resourceData[0].total} vCPUs
                  ({((resourceData[0].used / resourceData[0].total) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="h-4 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    (resourceData[0].used / resourceData[0].total) * 100 > vsanConfig.maxUtilization 
                      ? 'bg-red-500' 
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, (resourceData[0].used / resourceData[0].total) * 100)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-slate-400">
                <span>0%</span>
                <span>{vsanConfig.maxUtilization}% (Recommended Max)</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Memory Utilization</span>
                <span className="text-sm text-slate-400">
                  {resourceData[1].used} / {resourceData[1].total} GB
                  ({((resourceData[1].used / resourceData[1].total) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="h-4 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    (resourceData[1].used / resourceData[1].total) * 100 > vsanConfig.maxUtilization 
                      ? 'bg-red-500' 
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, (resourceData[1].used / resourceData[1].total) * 100)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-slate-400">
                <span>0%</span>
                <span>{vsanConfig.maxUtilization}% (Recommended Max)</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Storage Utilization</span>
                <span className="text-sm text-slate-400">
                  {formatStorage(resourceData[2].used)} / {formatStorage(resourceData[2].total)}
                  ({((resourceData[2].used / resourceData[2].total) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="h-4 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    (resourceData[2].used / resourceData[2].total) * 100 > vsanConfig.maxUtilization 
                      ? 'bg-red-500' 
                      : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(100, (resourceData[2].used / resourceData[2].total) * 100)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-slate-400">
                <span>0%</span>
                <span>{vsanConfig.maxUtilization}% (Recommended Max)</span>
                <span>100%</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
              <p className="text-sm text-slate-400">
                <span className="font-medium text-slate-300">Note:</span> Utilization above {vsanConfig.maxUtilization}% may impact performance. 
                Consider adding more resources or reducing VM requirements.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
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

          {/* Server Disk Visualization */}
          <div className="mt-6 w-full">
            <ServerDiskVisualization
              formFactor={vsanConfig.formFactor}
              storageType={vsanConfig.storageType}
              diskConfig={vsanConfig.diskConfig}
            />
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Resource Limitations</h3>
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">CPU Limitation</span>
                    <span className="text-sm text-slate-400">{recommendation.maxVMsByCPU} VMs</span>
                  </div>
                  <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, (totalResources.vCPUs / (recommendation.minimumHosts * vsanConfig.coresPerSocket * vsanConfig.socketsPerHost * 2)) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {totalResources.vCPUs} vCPUs used / {recommendation.minimumHosts * vsanConfig.coresPerSocket * vsanConfig.socketsPerHost * 2} vCPUs available
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Memory Limitation</span>
                    <span className="text-sm text-slate-400">{recommendation.maxVMsByMemory} VMs</span>
                  </div>
                  <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${Math.min(100, (totalResources.memory / (recommendation.minimumHosts * vsanConfig.memoryPerHost)) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {totalResources.memory} GB used / {recommendation.minimumHosts * vsanConfig.memoryPerHost} GB available
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Storage Limitation</span>
                    <span className="text-sm text-slate-400">{recommendation.maxVMsByStorage} VMs</span>
                  </div>
                  <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 rounded-full"
                      style={{ width: `${Math.min(100, (totalResources.storage * recommendation.storageOverhead.multiplier / calculateUsableCapacity(recommendation.minimumHosts)) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatStorage(totalResources.storage * recommendation.storageOverhead.multiplier)} used / {formatStorage(calculateUsableCapacity(recommendation.minimumHosts))} available
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Maximum VMs (Limited by)</span>
                    <span className="text-sm font-medium text-blue-400">
                      {recommendation.maxVMs} VMs
                      {recommendation.maxVMs === recommendation.maxVMsByCPU && ' (CPU)'}
                      {recommendation.maxVMs === recommendation.maxVMsByMemory && ' (Memory)'}
                      {recommendation.maxVMs === recommendation.maxVMsByStorage && ' (Storage)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Server className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={vm.name}
                        onChange={(e) => updateVM(index, 'name', e.target.value)}
                        className="bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm"
                        placeholder="VM Name"
                      />
                    </div>
                    <button
                      onClick={() => removeVM(index)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">vCPUs</label>
                      <input
                        type="number"
                        value={vm.vCPUs}
                        onChange={(e) => updateVM(index, 'vCPUs', parseInt(e.target.value))}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Core Ratio (vCPU:pCPU)</label>
                      <input
                        type="number"
                        value={vm.coreRatio}
                        onChange={(e) => updateVM(index, 'coreRatio', parseFloat(e.target.value))}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm"
                        min="0.1"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Memory (GB)</label>
                      <input
                        type="number"
                        value={vm.memory}
                        onChange={(e) => updateVM(index, 'memory', parseInt(e.target.value))}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Storage (GB)</label>
                      <input
                        type="number"
                        value={vm.disk}
                        onChange={(e) => updateVM(index, 'disk', parseInt(e.target.value))}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Count</label>
                      <input
                        type="number"
                        value={vm.count}
                        onChange={(e) => updateVM(index, 'count', parseInt(e.target.value))}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm"
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-400 flex justify-between">
                    <span>Total vCPUs: {vm.vCPUs * vm.count}</span>
                    <span>Total Memory: {vm.memory * vm.count} GB</span>
                    <span>Total Storage: {formatStorage(vm.disk * vm.count)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recursos Totais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">vCPUs Totais</p>
                    <p className="text-lg font-semibold text-gray-800">{totalResources.vCPUs}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">vCPUs Efetivos</p>
                    <p className="text-lg font-semibold text-gray-800">{totalResources.effectiveVCPUs.toFixed(1)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Memory className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Memória Total</p>
                    <p className="text-lg font-semibold text-gray-800">{formatStorage(totalResources.memory)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Armazenamento Total</p>
                    <p className="text-lg font-semibold text-gray-800">{formatStorage(totalResources.storage)}</p>
                  </div>
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