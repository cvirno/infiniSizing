import React, { useState, useEffect } from 'react';
import { 
  Server, 
  HardDrive, 
  Cpu, 
  MemoryStick, 
  Disc as DiscIcon,
  Box,
  Gauge,
  AlertTriangle,
  CheckCircle,
  Network,
  Plus,
  Trash2,
  Minus
} from 'lucide-react';

// ========== TIPOS ==========
type DiskType = 'NVMe' | 'SSD' | 'NLSAS';
type ProtectionType = 'RF2' | 'RF3' | 'EC-X';
type FormFactor = '1U' | '2U';
type DiskSize = number; // em GB

interface VmGroup {
  id: string;
  name: string;
  count: number;
  avgSizeGB: number;
  iopsPerVm: number;
  ramPerVmGB: number;
  cpuPerVm: number;
  coreRatio: number;
}

interface CpuConfig {
  model: string;
  cores: number;
  tdp: number;
  clock: number;
  sockets: number; // 1 ou 2
}

interface DiskConfig {
  type: DiskType;
  size: DiskSize;
  count: number;
  formFactor: FormFactor;
}

interface MemoryConfig {
  sizeGB: number;
}

interface NodeConfig {
  formFactor: FormFactor;
  cpus: CpuConfig[];
  disks: DiskConfig[];
  memory: MemoryConfig;
  protection: ProtectionType;
}

interface NodeResult {
  totalNodes: number;
  totalCores: number;
  totalRamGB: number;
  storageRawTB: number;
  storageEffectiveTB: number;
  totalIOPS: number;
  networkRequirements: string;
  warnings: string[];
  nodeDetails: {
    formFactor: FormFactor;
    cpuConfig: string;
    diskConfig: string;
    memoryConfig: string;
    nodes: number;
  }[];
}

interface SystemOverhead {
  cvm: {
    enabled: boolean;
    vcpus: number;
    ramGB: number;
    storageGB: number;
    iopsPercentage: number;
  };
  prism: {
    enabled: boolean;
    vcpus: number;
    ramGB: number;
    storageGB: number;
    iops: number;
  };
}

// Adicionar novo tipo para resultados de falha
interface FailureScenarioResult extends NodeResult {
  isFailureScenario: boolean;
  originalNodes: number;
  impact: {
    cpuImpact: number;
    memoryImpact: number;
    storageImpact: number;
    iopsImpact: number;
  };
}

// ========== DADOS DE HARDWARE ==========
const CPU_MODELS = [
  { model: 'Xeon Silver 4516Y+', cores: 24, tdp: 185, clock: 2.2 },
  { model: 'Xeon Gold 6526Y', cores: 16, tdp: 195, clock: 2.8 },
  { model: 'Xeon Gold 5515+', cores: 8, tdp: 165, clock: 3.2 },
  { model: 'Xeon Platinum 8593Q', cores: 64, tdp: 385, clock: 2.2 }
].map(cpu => ({ ...cpu, sockets: 2 })); // Padrão para 2 sockets

const DISK_OPTIONS: Record<DiskType, DiskSize[]> = {
  NVMe: [480, 960, 1920, 3840, 7680, 15360, 30720],
  SSD: [480, 960, 1920, 3840, 7680, 15360, 30720],
  NLSAS: [1000, 2000, 4000, 6000, 8000, 10000, 12000, 16000, 18000, 20000, 22000]
};

const MEMORY_OPTIONS = [32, 64, 128, 256]; // em GB

const FORM_FACTOR_DISK_LIMITS = {
  '1U': {
    '2.5"': 12,
    '3.5"': 4,
    '2.5"+3.5"': { '3.5"': 4, '2.5"': 2 }
  },
  '2U': {
    '2.5"': 24,
    '3.5"': 12,
    '2.5"+3.5"': { '3.5"': 12, '2.5"': 2 }
  }
};

// ========== COMPONENTES ==========
const VmGroupManager: React.FC<{
  vmGroups: VmGroup[];
  onAdd: () => void;
  onUpdate: (id: string, group: VmGroup) => void;
  onRemove: (id: string) => void;
}> = ({ vmGroups, onAdd, onUpdate, onRemove }) => {
  return (
    <div className="bg-slate-700/50 p-6 rounded-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Virtual Machines</h2>
        <button
          onClick={onAdd}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
        >
          Add VM
        </button>
      </div>

      <div className="space-y-4">
        {vmGroups.map((group) => (
          <div key={group.id} className="bg-slate-700/30 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Nome</label>
                <input
                  type="text"
                  value={group.name}
                  onChange={(e) => onUpdate(group.id, { ...group, name: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm"
                  placeholder="Nome da VM"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">vCPU</label>
                <input
                  type="number"
                  value={group.cpuPerVm}
                  onChange={(e) => onUpdate(group.id, { ...group, cpuPerVm: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm"
                  placeholder="vCPU"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">RAM (GB)</label>
                <input
                  type="number"
                  value={group.ramPerVmGB}
                  onChange={(e) => onUpdate(group.id, { ...group, ramPerVmGB: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm"
                  placeholder="RAM"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">HD (GB)</label>
                <input
                  type="number"
                  value={group.avgSizeGB}
                  onChange={(e) => onUpdate(group.id, { ...group, avgSizeGB: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm"
                  placeholder="HD"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Qtd</label>
                <input
                  type="number"
                  value={group.count}
                  onChange={(e) => onUpdate(group.id, { ...group, count: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm"
                  placeholder="Qty"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Core Ratio</label>
                <input
                  type="number"
                  value={group.coreRatio}
                  onChange={(e) => onUpdate(group.id, { ...group, coreRatio: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-sm"
                  placeholder="Ratio"
                  min="1"
                />
              </div>
              <div className="col-span-3 flex justify-end">
                <button
                  onClick={() => onRemove(group.id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ServerConfigurator: React.FC<{
  config: NodeConfig;
  onChange: (config: NodeConfig) => void;
  systemOverhead: SystemOverhead;
  onSystemOverheadChange: (overhead: SystemOverhead) => void;
}> = ({ config, onChange, systemOverhead, onSystemOverheadChange }) => {
  const [selectedFormFactor, setSelectedFormFactor] = useState<FormFactor>(config.formFactor);
  const [selectedCpu, setSelectedCpu] = useState<CpuConfig>(config.cpus[0]);
  const [sockets, setSockets] = useState<number>(config.cpus.length);
  const [diskType, setDiskType] = useState<DiskType>(config.disks[0].type);
  const [diskSize, setDiskSize] = useState<DiskSize>(config.disks[0].size);
  const [diskCount, setDiskCount] = useState<number>(config.disks[0].count);
  const [memorySize, setMemorySize] = useState<number>(config.memory.sizeGB);
  const [memorySticks, setMemorySticks] = useState<number>(Math.ceil(config.memory.sizeGB / 32));

  const updateDiskConfig = () => {
    const newDisks: DiskConfig[] = [];
    
    // Configuração básica de discos
    newDisks.push({
      type: diskType,
      size: diskSize,
      count: diskCount,
      formFactor: selectedFormFactor
    });

    onChange({
      ...config,
      formFactor: selectedFormFactor,
      cpus: Array(sockets).fill(selectedCpu),
      disks: newDisks,
      memory: { sizeGB: memorySize * memorySticks }
    });
  };

  useEffect(() => {
    updateDiskConfig();
  }, [selectedFormFactor, selectedCpu, sockets, diskType, diskSize, diskCount, memorySize, memorySticks]);

  const getMaxDisks = () => {
    if (diskType === 'NLSAS') {
      return FORM_FACTOR_DISK_LIMITS[selectedFormFactor]['3.5"'];
    }
    return FORM_FACTOR_DISK_LIMITS[selectedFormFactor]['2.5"'];
  };

  return (
    <div className="bg-slate-700/50 p-6 rounded-lg mb-6">
      <h2 className="text-xl font-semibold text-white mb-4">Server Configuration</h2>

      {/* System Overhead Toggles */}
      <div className="mb-6 p-4 bg-slate-700/30 rounded-lg">
        <h3 className="text-lg font-medium text-white mb-3">System Overhead</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-slate-300">CVM</label>
              <p className="text-xs text-slate-400">8 vCPUs, 32GB RAM, 30GB Storage, 10% IOPS</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={systemOverhead.cvm.enabled}
                onChange={(e) => onSystemOverheadChange({
                  ...systemOverhead,
                  cvm: { ...systemOverhead.cvm, enabled: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-slate-300">Prism Central</label>
              <p className="text-xs text-slate-400">8 vCPUs, 32GB RAM, 500GB Storage, 1000 IOPS</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={systemOverhead.prism.enabled}
                onChange={(e) => onSystemOverheadChange({
                  ...systemOverhead,
                  prism: { ...systemOverhead.prism, enabled: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Factor e CPU */}
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">Form Factor</label>
            <select
              value={selectedFormFactor}
              onChange={(e) => setSelectedFormFactor(e.target.value as FormFactor)}
              className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white"
            >
              <option value="1U">1U</option>
              <option value="2U">2U</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">Processador</label>
            <select
              value={selectedCpu.model}
              onChange={(e) => {
                const cpu = CPU_MODELS.find(c => c.model === e.target.value);
                if (cpu) setSelectedCpu(cpu);
              }}
              className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white"
            >
              {CPU_MODELS.map(cpu => (
                <option key={cpu.model} value={cpu.model}>
                  {cpu.model} ({cpu.cores}C, {cpu.tdp}W, {cpu.clock}GHz)
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">Sockets</label>
            <select
              value={sockets}
              onChange={(e) => setSockets(parseInt(e.target.value))}
              className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white"
            >
              <option value="1">1 Processador</option>
              <option value="2">2 Processadores</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">Tamanho do Pente (GB)</label>
            <select
              value={memorySize}
              onChange={(e) => setMemorySize(parseInt(e.target.value))}
              className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white"
            >
              <option value="32">32 GB</option>
              <option value="64">64 GB</option>
              <option value="128">128 GB</option>
              <option value="256">256 GB</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Quantidade de Pentes (Max: 32)
            </label>
            <input
              type="number"
              value={memorySticks}
              onChange={(e) => setMemorySticks(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 32))}
              className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white"
              min="1"
              max="32"
            />
            <p className="text-sm text-slate-400 mt-1">
              Total: {memorySize * memorySticks} GB
            </p>
          </div>
        </div>

        {/* Configuração de Armazenamento */}
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">Tipo de Disco</label>
            <select
              value={diskType}
              onChange={(e) => setDiskType(e.target.value as DiskType)}
              className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white"
            >
              <option value="NVMe">NVMe (Alta Performance)</option>
              <option value="SSD">SSD (Balanceado)</option>
              <option value="NLSAS">NL-SAS (Alta Capacidade)</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">Tamanho do Disco (GB)</label>
            <select
              value={diskSize}
              onChange={(e) => setDiskSize(parseInt(e.target.value))}
              className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white"
            >
              {DISK_OPTIONS[diskType].map(size => (
                <option key={size} value={size}>{size} GB</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Quantidade de Discos (Max: {getMaxDisks()})
            </label>
            <input
              type="number"
              value={diskCount}
              onChange={(e) => setDiskCount(Math.min(parseInt(e.target.value) || 1, getMaxDisks()))}
              className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white"
              min="1"
              max={getMaxDisks()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Proteção de Dados</label>
            <select
              value={config.protection}
              onChange={(e) => onChange({...config, protection: e.target.value as ProtectionType})}
              className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white"
            >
              <option value="RF2">RF2 (2 cópias)</option>
              <option value="RF3">RF3 (3 cópias)</option>
              <option value="EC-X">Erasure Coding (1.5x)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResultsPanel: React.FC<{ result: NodeResult }> = ({ result }) => {
  return (
    <div className="bg-slate-700/50 p-6 rounded-lg">
      <h2 className="text-xl font-semibold text-white mb-4">Resultado do Dimensionamento</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-700 p-4 rounded-lg">
          <div className="flex items-center text-blue-400 mb-2">
            <Server className="mr-2" />
            <h3 className="font-medium">Nós Necessários</h3>
          </div>
          <p className="text-3xl font-bold text-white">{result.totalNodes}</p>
        </div>

        <div className="bg-slate-700 p-4 rounded-lg">
          <div className="flex items-center text-green-400 mb-2">
            <Cpu className="mr-2" />
            <h3 className="font-medium">Total de Cores</h3>
          </div>
          <p className="text-2xl font-bold text-white">{result.totalCores}</p>
        </div>

        <div className="bg-slate-700 p-4 rounded-lg">
          <div className="flex items-center text-purple-400 mb-2">
            <MemoryStick className="mr-2" />
            <h3 className="font-medium">Memória Total</h3>
          </div>
          <p className="text-2xl font-bold text-white">{result.totalRamGB} GB</p>
        </div>

        <div className="bg-slate-700 p-4 rounded-lg">
          <div className="flex items-center text-amber-400 mb-2">
            <DiscIcon className="mr-2" />
            <h3 className="font-medium">Armazenamento</h3>
          </div>
          <p className="text-lg text-white">
            <span className="font-bold">{result.storageEffectiveTB.toFixed(1)} TB</span> útil<br />
            <span className="text-sm text-slate-300">({result.storageRawTB.toFixed(1)} TB raw)</span>
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-medium text-white mb-2">Configuração por Nó:</h3>
        <div className="bg-slate-700 p-4 rounded-lg">
          <p className="font-semibold text-white">Form Factor: {result.nodeDetails[0].formFactor}</p>
          <p className="text-slate-300">CPU: {result.nodeDetails[0].cpuConfig}</p>
          <p className="text-slate-300">Memória: {result.nodeDetails[0].memoryConfig}</p>
          <p className="text-slate-300">Armazenamento: {result.nodeDetails[0].diskConfig}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-700 p-4 rounded-lg">
          <div className="flex items-center text-white mb-2">
            <Network className="mr-2" />
            <h3 className="font-medium">Requisitos de Rede</h3>
          </div>
          <p className="text-lg font-semibold text-white">
            {result.networkRequirements}
          </p>
          <p className="text-sm text-slate-300 mt-1">
            Recomendado para {result.totalNodes} nós
          </p>
        </div>

        {result.warnings.length > 0 && (
          <div className="bg-yellow-500/20 p-4 rounded-lg">
            <div className="flex items-center text-yellow-400 mb-2">
              <AlertTriangle className="mr-2" />
              <h3 className="font-medium">Atenção</h3>
            </div>
            <ul className="list-disc pl-5 text-sm space-y-1 text-yellow-300">
              {result.warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// Modificar o componente ResourceVisualization para mostrar sempre os dois cenários lado a lado.
const ResourceVisualization: React.FC<{
  vmGroups: VmGroup[];
  nodeConfig: NodeConfig;
  result: NodeResult;
  systemOverhead: SystemOverhead;
}> = ({ vmGroups, nodeConfig, result, systemOverhead }) => {
  // Calcular vCPUs totais sem multiplicar pelo core ratio
  const totalVcpus = vmGroups.reduce((sum, group) => 
    sum + (group.cpuPerVm * group.count), 0);
  const totalMemory = vmGroups.reduce((sum, group) => 
    sum + (group.ramPerVmGB * group.count), 0);
  const totalStorage = vmGroups.reduce((sum, group) => 
    sum + (group.avgSizeGB * group.count), 0);

  // Calcular overhead do sistema
  const cvmOverhead = {
    vcpus: systemOverhead.cvm.enabled ? systemOverhead.cvm.vcpus * result.totalNodes : 0,
    ramGB: systemOverhead.cvm.enabled ? systemOverhead.cvm.ramGB * result.totalNodes : 0,
    storageGB: systemOverhead.cvm.enabled ? systemOverhead.cvm.storageGB * result.totalNodes : 0,
    iops: systemOverhead.cvm.enabled ? result.totalIOPS * (systemOverhead.cvm.iopsPercentage / 100) : 0
  };

  const prismOverhead = {
    vcpus: systemOverhead.prism.enabled ? systemOverhead.prism.vcpus : 0,
    ramGB: systemOverhead.prism.enabled ? systemOverhead.prism.ramGB : 0,
    storageGB: systemOverhead.prism.enabled ? systemOverhead.prism.storageGB : 0,
    iops: systemOverhead.prism.enabled ? systemOverhead.prism.iops : 0
  };

  // Calculate totals with overhead
  const totalVcpusWithOverhead = totalVcpus + cvmOverhead.vcpus + prismOverhead.vcpus;
  const totalMemoryWithOverhead = totalMemory + cvmOverhead.ramGB + prismOverhead.ramGB;
  const totalStorageWithOverhead = totalStorage + cvmOverhead.storageGB + prismOverhead.storageGB;

  // Calculate effective cores considering core ratio
  const coresPerNode = nodeConfig.cpus[0].cores * nodeConfig.cpus.length;
  const totalPhysicalCores = result.totalNodes * coresPerNode;
  const maxCoreRatio = Math.max(...vmGroups.map(g => g.coreRatio));
  const effectiveCores = totalPhysicalCores * maxCoreRatio;

  // Calculate percentages
  const cpuPercent = Math.round((totalVcpusWithOverhead / effectiveCores) * 100);
  const memoryPercent = Math.round((totalMemoryWithOverhead / result.totalRamGB) * 100);
  const storagePercent = Math.round((totalStorageWithOverhead / (result.storageEffectiveTB * 1024)) * 100);

  const getBarColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-slate-700/50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-3">Resource Usage</h3>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>CPU: {totalVcpusWithOverhead} vCPUs / {effectiveCores} cores efetivos</span>
            <span>{cpuPercent}%</span>
          </div>
          <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${getBarColor(cpuPercent)}`}
              style={{ width: `${cpuPercent}%` }}
            />
          </div>
          {(cvmOverhead.vcpus > 0 || prismOverhead.vcpus > 0) && (
            <p className="text-xs text-slate-400 mt-1">
              Including {cvmOverhead.vcpus} vCPUs for CVM and {prismOverhead.vcpus} vCPUs for Prism Central
            </p>
          )}
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Memory: {totalMemoryWithOverhead}GB / {result.totalRamGB}GB</span>
            <span>{memoryPercent}%</span>
          </div>
          <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${getBarColor(memoryPercent)}`}
              style={{ width: `${memoryPercent}%` }}
            />
          </div>
          {(cvmOverhead.ramGB > 0 || prismOverhead.ramGB > 0) && (
            <p className="text-xs text-slate-400 mt-1">
              Including {cvmOverhead.ramGB}GB for CVM and {prismOverhead.ramGB}GB for Prism Central
            </p>
          )}
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Storage: {totalStorageWithOverhead}GB / {result.storageEffectiveTB * 1024}GB</span>
            <span>{storagePercent}%</span>
          </div>
          <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${getBarColor(storagePercent)}`}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
          {(cvmOverhead.storageGB > 0 || prismOverhead.storageGB > 0) && (
            <p className="text-xs text-slate-400 mt-1">
              Including {cvmOverhead.storageGB}GB for CVM and {prismOverhead.storageGB}GB for Prism Central
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ========== LÓGICA DE CÁLCULO ==========
function calculateNodes(vmGroups: VmGroup[], nodeConfig: NodeConfig, systemOverhead: SystemOverhead): NodeResult {
  // 1. Agregar requisitos totais
  const total = vmGroups.reduce((acc, group) => {
    acc.vmCount += group.count;
    acc.totalSizeGB += group.count * group.avgSizeGB;
    acc.totalIOPS += group.count * group.iopsPerVm;
    acc.totalRamGB += group.count * group.ramPerVmGB;
    // Calcular vCPUs totais sem multiplicar pelo core ratio
    acc.totalCpu += group.count * group.cpuPerVm;
    return acc;
  }, {
    vmCount: 0,
    totalSizeGB: 0,
    totalIOPS: 0,
    totalRamGB: 0,
    totalCpu: 0
  });

  // 2. Calcular fator de proteção
  const protectionFactor = nodeConfig.protection === 'RF2' ? 2 : 
                        nodeConfig.protection === 'RF3' ? 3 : 1.5;

  // 3. Calcular por recurso
  const storagePerNodeTB = nodeConfig.disks.reduce((sum, disk) => sum + (disk.size * disk.count / 1000), 0);
  const storageRequiredTB = (total.totalSizeGB / 1024) * protectionFactor * 1.15;

  const nodesForStorage = Math.ceil(storageRequiredTB / storagePerNodeTB);
  const nodesForRam = Math.ceil(total.totalRamGB / nodeConfig.memory.sizeGB);
  
  // Calcular cores físicos por nó
  const coresPerNode = nodeConfig.cpus[0].cores * nodeConfig.cpus.length;
  
  // Aplicar core ratio apenas no cálculo de CPU
  const maxCoreRatio = Math.max(...vmGroups.map(g => g.coreRatio));
  const nodesForCpu = Math.ceil((total.totalCpu / maxCoreRatio) / coresPerNode);

  // 4. Determinar número de nós
  const minNodes = Math.max(nodesForStorage, nodesForRam, nodesForCpu);
  const finalNodes = Math.max(minNodes, nodeConfig.protection === 'RF2' ? 3 : 5);

  // 5. Gerar warnings
  const warnings = [];
  if (nodeConfig.protection === 'RF3' && finalNodes < 5) {
    warnings.push('RF3 requer mínimo 5 nós para resiliência adequada');
  }

  // 6. Calcular IOPS (baseado no tipo de disco)
  const diskIOPS = nodeConfig.disks.reduce((sum, disk) => {
    const iopsPerDisk = disk.type === 'NVMe' ? 150000 : 
                       disk.type === 'SSD' ? 50000 : 10000;
    return sum + (iopsPerDisk * disk.count);
  }, 0);

  const totalIOPS = diskIOPS * finalNodes;

  // 7. Calcular overhead do sistema
  const cvmOverhead = {
    vcpus: systemOverhead.cvm.enabled ? systemOverhead.cvm.vcpus * finalNodes : 0,
    ramGB: systemOverhead.cvm.enabled ? systemOverhead.cvm.ramGB * finalNodes : 0,
    storageGB: systemOverhead.cvm.enabled ? systemOverhead.cvm.storageGB * finalNodes : 0,
    iops: systemOverhead.cvm.enabled ? totalIOPS * (systemOverhead.cvm.iopsPercentage / 100) : 0
  };

  const prismOverhead = {
    vcpus: systemOverhead.prism.enabled ? systemOverhead.prism.vcpus : 0,
    ramGB: systemOverhead.prism.enabled ? systemOverhead.prism.ramGB : 0,
    storageGB: systemOverhead.prism.enabled ? systemOverhead.prism.storageGB : 0,
    iops: systemOverhead.prism.enabled ? systemOverhead.prism.iops : 0
  };

  // 8. Verificar se há recursos suficientes para o overhead
  const totalVcpusWithOverhead = total.totalCpu + cvmOverhead.vcpus + prismOverhead.vcpus;
  const totalRamWithOverhead = total.totalRamGB + cvmOverhead.ramGB + prismOverhead.ramGB;
  const totalStorageWithOverhead = total.totalSizeGB + cvmOverhead.storageGB + prismOverhead.storageGB;
  const totalIopsWithOverhead = totalIOPS + cvmOverhead.iops + prismOverhead.iops;

  if (totalVcpusWithOverhead > finalNodes * coresPerNode * maxCoreRatio) {
    warnings.push('O overhead do sistema pode impactar o desempenho das VMs');
  }

  if (totalRamWithOverhead > finalNodes * nodeConfig.memory.sizeGB) {
    warnings.push('O overhead do sistema pode impactar o desempenho das VMs');
  }

  if (totalStorageWithOverhead > finalNodes * storagePerNodeTB * 1024) {
    warnings.push('O overhead do sistema pode impactar o desempenho das VMs');
  }

  if (totalIopsWithOverhead > totalIOPS * 0.7) {
    warnings.push('O overhead do sistema pode impactar o desempenho das VMs');
  }

  // 9. Descrição da configuração
  const nodeDetails = [{
    formFactor: nodeConfig.formFactor,
    cpuConfig: `${nodeConfig.cpus.length}x ${nodeConfig.cpus[0].model}`,
    memoryConfig: `${nodeConfig.memory.sizeGB}GB`,
    diskConfig: nodeConfig.disks.map(d => `${d.count}x ${d.size}GB ${d.type}`).join(' + '),
    nodes: finalNodes
  }];

  return {
    totalNodes: finalNodes,
    totalCores: finalNodes * coresPerNode,
    totalRamGB: finalNodes * nodeConfig.memory.sizeGB,
    storageRawTB: finalNodes * storagePerNodeTB,
    storageEffectiveTB: (finalNodes * storagePerNodeTB) / protectionFactor,
    totalIOPS: totalIOPS,
    networkRequirements: calculateNetwork(finalNodes, totalIopsWithOverhead),
    warnings,
    nodeDetails
  };
}

function calculateNetwork(nodes: number, iops: number): string {
  if (iops > 500000 || nodes > 8) return '4x25GbE ou 2x100GbE';
  if (iops > 100000) return '2x25GbE';
  return '2x10GbE';
}

// ========== COMPONENTE PRINCIPAL ==========
const NutanixCalculator: React.FC = () => {
  const [vmGroups, setVmGroups] = useState<VmGroup[]>([
    {
      id: '1',
      name: 'VM Group 1',
      count: 1,
      avgSizeGB: 100,
      iopsPerVm: 50,
      ramPerVmGB: 4,
      cpuPerVm: 2,
      coreRatio: 4
    }
  ]);

  const [nodeConfig, setNodeConfig] = useState<NodeConfig>({
    formFactor: '2U',
    cpus: [CPU_MODELS[0]],
    disks: [{
      type: 'NVMe',
      size: 1920,
      count: 4,
      formFactor: '2U'
    }],
    memory: { sizeGB: 128 },
    protection: 'RF2'
  });

  const [systemOverhead, setSystemOverhead] = useState<SystemOverhead>({
    cvm: {
      enabled: true,
      vcpus: 8,
      ramGB: 32,
      storageGB: 30,
      iopsPercentage: 10
    },
    prism: {
      enabled: false,
      vcpus: 8,
      ramGB: 32,
      storageGB: 500,
      iops: 1000
    }
  });

  const [result, setResult] = useState<NodeResult | null>(null);

  useEffect(() => {
    const calculatedResult = calculateNodes(vmGroups, nodeConfig, systemOverhead);
    setResult(calculatedResult);
  }, [vmGroups, nodeConfig, systemOverhead]);

  const addVmGroup = () => {
    setVmGroups([...vmGroups, {
      id: Date.now().toString(),
      name: `VM Group ${vmGroups.length + 1}`,
      count: 1,
      avgSizeGB: 100,
      iopsPerVm: 30,
      ramPerVmGB: 2,
      cpuPerVm: 1,
      coreRatio: 4
    }]);
  };

  const updateVmGroup = (id: string, updatedGroup: VmGroup) => {
    setVmGroups(vmGroups.map(group => group.id === id ? updatedGroup : group));
  };

  const removeVmGroup = (id: string) => {
    setVmGroups(vmGroups.filter(group => group.id !== id));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Área dinâmica - Lista de VMs */}
        <div className="lg:col-span-2">
          <div className="overflow-y-auto max-h-screen">
            <VmGroupManager
              vmGroups={vmGroups}
              onAdd={addVmGroup}
              onUpdate={updateVmGroup}
              onRemove={removeVmGroup}
            />
            <ServerConfigurator
              config={nodeConfig}
              onChange={setNodeConfig}
              systemOverhead={systemOverhead}
              onSystemOverheadChange={setSystemOverhead}
            />
          </div>
        </div>

        {/* Área estática - Resultados */}
        <div className="lg:col-span-3">
          <div className="sticky top-4">
            {result && (
              <>
                <h2 className="text-xl font-semibold text-white mb-4">Resource Analysis</h2>
                <ResourceVisualization
                  vmGroups={vmGroups}
                  nodeConfig={nodeConfig}
                  result={result}
                  systemOverhead={systemOverhead}
                />
                <div className="mt-6">
                  <ResultsPanel result={result} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutanixCalculator; 