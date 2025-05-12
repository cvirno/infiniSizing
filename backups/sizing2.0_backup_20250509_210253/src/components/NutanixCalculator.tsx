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
  coreRatio: number;
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

      <div className="space-y-2">
        {vmGroups.map((group) => (
          <div key={group.id} className="bg-slate-700/30 p-3 rounded-lg">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={group.name}
                onChange={(e) => onUpdate(group.id, { ...group, name: e.target.value })}
                className="w-32 bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm"
                placeholder="VM Name"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={group.cpuPerVm}
                  onChange={(e) => onUpdate(group.id, { ...group, cpuPerVm: parseInt(e.target.value) || 0 })}
                  className="w-16 bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm"
                  placeholder="vCPU"
                  min="1"
                />
                <input
                  type="number"
                  value={group.ramPerVmGB}
                  onChange={(e) => onUpdate(group.id, { ...group, ramPerVmGB: parseInt(e.target.value) || 0 })}
                  className="w-16 bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm"
                  placeholder="RAM"
                  min="1"
                />
                <input
                  type="number"
                  value={group.avgSizeGB}
                  onChange={(e) => onUpdate(group.id, { ...group, avgSizeGB: parseInt(e.target.value) || 0 })}
                  className="w-16 bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm"
                  placeholder="HD"
                  min="1"
                />
                <input
                  type="number"
                  value={group.count}
                  onChange={(e) => onUpdate(group.id, { ...group, count: parseInt(e.target.value) || 1 })}
                  className="w-16 bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm"
                  placeholder="Qty"
                  min="1"
                />
              </div>
              <button
                onClick={() => onRemove(group.id)}
                className="ml-auto text-red-400 hover:text-red-300 text-sm"
              >
                Remove
              </button>
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
}> = ({ config, onChange }) => {
  const [selectedFormFactor, setSelectedFormFactor] = useState<FormFactor>(config.formFactor);
  const [selectedCpu, setSelectedCpu] = useState<CpuConfig>(config.cpus[0]);
  const [sockets, setSockets] = useState<number>(config.cpus.length);
  const [diskType, setDiskType] = useState<DiskType>(config.disks[0].type);
  const [diskSize, setDiskSize] = useState<DiskSize>(config.disks[0].size);
  const [diskCount, setDiskCount] = useState<number>(config.disks[0].count);
  const [memory, setMemory] = useState<number>(config.memory.sizeGB);

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
      memory: { sizeGB: memory }
    });
  };

  useEffect(() => {
    updateDiskConfig();
  }, [selectedFormFactor, selectedCpu, sockets, diskType, diskSize, diskCount, memory]);

  const getMaxDisks = () => {
    if (diskType === 'NLSAS') {
      return FORM_FACTOR_DISK_LIMITS[selectedFormFactor]['3.5"'];
    }
    return FORM_FACTOR_DISK_LIMITS[selectedFormFactor]['2.5"'];
  };

  return (
    <div className="bg-slate-700/50 p-6 rounded-lg mb-6">
      <h2 className="text-xl font-semibold text-white mb-4">Server Configuration</h2>

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

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Memória por Nó (GB)</label>
            <select
              value={memory}
              onChange={(e) => setMemory(parseInt(e.target.value))}
              className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white"
            >
              {MEMORY_OPTIONS.map(size => (
                <option key={size} value={size}>{size} GB</option>
              ))}
            </select>
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

        {/* Add Core Ratio selection */}
        <div className="md:col-span-2">
          <div className="mb-4">
            <label className="block text-sm text-slate-300 mb-1">Core Ratio (vCPU:pCPU)</label>
            <select
              value={config.coreRatio}
              onChange={(e) => onChange({ ...config, coreRatio: Number(e.target.value) })}
              className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white"
            >
              <option value={2}>2:1 (High Performance)</option>
              <option value={3}>3:1 (Balanced)</option>
              <option value={4}>4:1 (Standard)</option>
              <option value={5}>5:1 (Dense)</option>
              <option value={6}>6:1 (High Density)</option>
            </select>
            <p className="mt-1 text-xs text-slate-400">
              {config.coreRatio <= 3 ? 'Recommended for CPU-intensive workloads' :
               config.coreRatio <= 4 ? 'Recommended for general purpose workloads' :
               'Recommended for light workloads'}
            </p>
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
            <Gauge className="mr-2" />
            <h3 className="font-medium">Performance</h3>
          </div>
          <p className="text-lg font-semibold text-white">
            {result.totalIOPS.toLocaleString()} IOPS estimados
          </p>
          <p className="text-sm text-slate-300 mt-1">
            Largura de banda recomendada: {result.networkRequirements}
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

// Adicionar componente de visualização de recursos
const ResourceVisualization: React.FC<{
  vmGroups: VmGroup[];
  nodeConfig: NodeConfig;
  result: NodeResult;
}> = ({ vmGroups, nodeConfig, result }) => {
  const totalVCPUs = vmGroups.reduce((sum, group) => sum + (group.cpuPerVm * group.count), 0);
  const totalMemory = vmGroups.reduce((sum, group) => sum + (group.ramPerVmGB * group.count), 0);
  const totalStorage = vmGroups.reduce((sum, group) => sum + (group.avgSizeGB * group.count), 0);
  
  const availableVCPUs = result.totalCores * nodeConfig.coreRatio;
  const availableMemory = result.totalRamGB;
  const availableStorage = result.storageEffectiveTB * 1024; // Convertendo TB para GB

  return (
    <div className="bg-slate-700/50 p-6 rounded-lg mb-6">
      <h2 className="text-xl font-semibold text-white mb-4">Resource Visualization</h2>
      
      {/* CPU Visualization */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">CPU Resources</span>
          <span className="text-sm text-slate-400">
            Core Ratio: {nodeConfig.coreRatio}:1
          </span>
        </div>
        <div className="bg-slate-700/30 p-4 rounded-lg">
          <div className="flex justify-between mb-2">
            <span className="text-sm">Physical Cores: {result.totalCores}</span>
            <span className="text-sm">Available vCPUs: {availableVCPUs}</span>
          </div>
          <div className="h-6 bg-slate-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalVCPUs / availableVCPUs) * 100)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>Used: {totalVCPUs} vCPUs</span>
            <span>Available: {availableVCPUs} vCPUs</span>
          </div>
        </div>
      </div>

      {/* Memory Visualization */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Memory Resources</span>
        </div>
        <div className="bg-slate-700/30 p-4 rounded-lg">
          <div className="flex justify-between mb-2">
            <span className="text-sm">Total Memory: {availableMemory} GB</span>
          </div>
          <div className="h-6 bg-slate-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalMemory / availableMemory) * 100)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>Used: {totalMemory} GB</span>
            <span>Available: {availableMemory} GB</span>
          </div>
        </div>
      </div>

      {/* Storage Visualization */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Storage Resources</span>
        </div>
        <div className="bg-slate-700/30 p-4 rounded-lg">
          <div className="flex justify-between mb-2">
            <span className="text-sm">Total Storage: {result.storageEffectiveTB} TB</span>
          </div>
          <div className="h-6 bg-slate-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalStorage / availableStorage) * 100)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>Used: {(totalStorage / 1024).toFixed(1)} TB</span>
            <span>Available: {result.storageEffectiveTB} TB</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== LÓGICA DE CÁLCULO ==========
function calculateNodes(vmGroups: VmGroup[], nodeConfig: NodeConfig): NodeResult {
  // 1. Agregar requisitos totais
  const total = vmGroups.reduce((acc, group) => {
    acc.vmCount += group.count;
    acc.totalSizeGB += group.count * group.avgSizeGB;
    acc.totalIOPS += group.count * group.iopsPerVm;
    acc.totalRamGB += group.count * group.ramPerVmGB;
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
  const nodesForCpu = Math.ceil(total.totalCpu / (nodeConfig.cpus[0].cores * nodeConfig.cpus.length));

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

  if (total.totalIOPS > diskIOPS * finalNodes * 0.7) {
    warnings.push('A configuração pode não atingir os IOPS necessários');
  }

  // 7. Descrição da configuração
  const nodeDetails = [{
    formFactor: nodeConfig.formFactor,
    cpuConfig: `${nodeConfig.cpus.length}x ${nodeConfig.cpus[0].model}`,
    memoryConfig: `${nodeConfig.memory.sizeGB}GB`,
    diskConfig: nodeConfig.disks.map(d => `${d.count}x ${d.size}GB ${d.type}`).join(' + '),
    nodes: finalNodes
  }];

  return {
    totalNodes: finalNodes,
    totalCores: finalNodes * nodeConfig.cpus[0].cores * nodeConfig.cpus.length,
    totalRamGB: finalNodes * nodeConfig.memory.sizeGB,
    storageRawTB: finalNodes * storagePerNodeTB,
    storageEffectiveTB: (finalNodes * storagePerNodeTB) / protectionFactor,
    totalIOPS: diskIOPS * finalNodes,
    networkRequirements: calculateNetwork(finalNodes, total.totalIOPS),
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
      id: Date.now().toString(),
      name: 'Grupo Principal',
      count: 50,
      avgSizeGB: 100,
      iopsPerVm: 50,
      ramPerVmGB: 4,
      cpuPerVm: 2
    }
  ]);

  const [nodeConfig, setNodeConfig] = useState<NodeConfig>({
    formFactor: '1U',
    cpus: [CPU_MODELS[0]], // Xeon Silver 4516Y+ como padrão
    disks: [{
      type: 'NVMe',
      size: 7680, // 7.68TB
      count: 12,
      formFactor: '1U'
    }],
    memory: { sizeGB: 256 },
    protection: 'RF2',
    coreRatio: 4
  });

  const [result, setResult] = useState<NodeResult | null>(null);

  useEffect(() => {
    setResult(calculateNodes(vmGroups, nodeConfig));
  }, [vmGroups, nodeConfig]);

  const addVmGroup = () => {
    setVmGroups([...vmGroups, {
      id: Date.now().toString(),
      name: '',
      count: 10,
      avgSizeGB: 50,
      iopsPerVm: 30,
      ramPerVmGB: 2,
      cpuPerVm: 1
    }]);
  };

  const updateVmGroup = (id: string, updatedGroup: VmGroup) => {
    setVmGroups(vmGroups.map(group => group.id === id ? updatedGroup : group));
  };

  const removeVmGroup = (id: string) => {
    if (vmGroups.length > 1) {
      setVmGroups(vmGroups.filter(group => group.id !== id));
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Nutanix Sizing Calculator</h1>
      
      <VmGroupManager
        vmGroups={vmGroups}
        onAdd={addVmGroup}
        onUpdate={updateVmGroup}
        onRemove={removeVmGroup}
      />

      <ServerConfigurator
        config={nodeConfig}
        onChange={setNodeConfig}
      />

      {result && (
        <ResourceVisualization
          vmGroups={vmGroups}
          nodeConfig={nodeConfig}
          result={result}
        />
      )}

      {result && <ResultsPanel result={result} />}
    </div>
  );
};

export default NutanixCalculator; 