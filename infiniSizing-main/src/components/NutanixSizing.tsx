import React, { useState, useEffect } from 'react';
import { 
  Server, 
  HardDrive, 
  Cpu, 
  Memory, 
  Disc as DiscIcon,
  Box,
  Gauge,
  AlertTriangle,
  CheckCircle,
  Network,
  Plus,
  Trash2,
  Minus,
  Moon,
  Sun
} from 'lucide-react';

// ========== TEMA ==========
const theme = {
  primary: '#A200FF',
  primaryLight: '#D9B3FF',
  primaryDark: '#7A00C2',
  background: '#F5F7FA',
  cardBg: '#FFFFFF',
  text: '#2D3748',
  textLight: '#718096',
  success: '#48BB78',
  warning: '#ED8936',
  error: '#F56565',
  info: '#4299E1',
  border: '#E2E8F0'
};

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
    <div className="p-6 rounded-xl" style={{ 
      backgroundColor: theme.cardBg,
      border: `1px solid ${theme.border}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center" style={{ color: theme.text }}>
          <Box className="mr-2" style={{ color: theme.primary }} /> Grupos de VMs
        </h2>
        <button
          onClick={onAdd}
          className="flex items-center px-3 py-2 rounded transition-colors"
          style={{
            backgroundColor: theme.primaryLight,
            color: theme.primaryDark,
            fontWeight: 500
          }}
        >
          <Plus size={16} className="mr-1" /> Adicionar Grupo
        </button>
      </div>

      <div className="space-y-4">
        {vmGroups.map((group) => (
          <div 
            key={group.id} 
            className="border rounded-lg p-4 transition-all hover:shadow-sm"
            style={{
              borderColor: theme.border,
              backgroundColor: 'rgba(162, 0, 255, 0.02)'
            }}
          >
            <div className="flex justify-between items-center mb-3">
              <input
                type="text"
                value={group.name}
                onChange={(e) => onUpdate(group.id, { ...group, name: e.target.value })}
                placeholder="Nome do Grupo"
                className="font-medium focus:outline-none text-lg"
                style={{
                  color: theme.text,
                  borderBottom: `2px solid transparent`,
                }}
                onFocus={(e) => e.target.style.borderBottomColor = theme.primary}
                onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
              />
              {vmGroups.length > 1 && (
                <button
                  onClick={() => onRemove(group.id)}
                  className="p-1 rounded-full hover:bg-red-50 transition-colors"
                  style={{ color: theme.error }}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm mb-1" style={{ color: theme.textLight }}>Quantidade</label>
                <div className="flex border rounded" style={{ borderColor: theme.border }}>
                  <button 
                    onClick={() => onUpdate(group.id, { ...group, count: Math.max(1, group.count - 1) })}
                    className="px-2 transition-colors hover:bg-gray-50"
                    style={{ color: theme.text }}
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    value={group.count}
                    onChange={(e) => onUpdate(group.id, { ...group, count: parseInt(e.target.value) || 1 })}
                    className="w-full p-2 text-center border-0 focus:outline-none"
                    style={{ color: theme.text }}
                    min="1"
                  />
                  <button 
                    onClick={() => onUpdate(group.id, { ...group, count: group.count + 1 })}
                    className="px-2 transition-colors hover:bg-gray-50"
                    style={{ color: theme.text }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: theme.textLight }}>Tamanho (GB)</label>
                <input
                  type="number"
                  value={group.avgSizeGB}
                  onChange={(e) => onUpdate(group.id, { ...group, avgSizeGB: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border rounded focus:outline-none"
                  style={{ borderColor: theme.border, color: theme.text }}
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: theme.textLight }}>IOPS/VM</label>
                <input
                  type="number"
                  value={group.iopsPerVm}
                  onChange={(e) => onUpdate(group.id, { ...group, iopsPerVm: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border rounded focus:outline-none"
                  style={{ borderColor: theme.border, color: theme.text }}
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm mb-1" style={{ color: theme.textLight }}>vCPUs/VM</label>
                <input
                  type="number"
                  value={group.cpuPerVm}
                  onChange={(e) => onUpdate(group.id, { ...group, cpuPerVm: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border rounded focus:outline-none"
                  style={{ borderColor: theme.border, color: theme.text }}
                  min="1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-1" style={{ color: theme.textLight }}>RAM/VM (GB)</label>
                <input
                  type="number"
                  value={group.ramPerVmGB}
                  onChange={(e) => onUpdate(group.id, { ...group, ramPerVmGB: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border rounded focus:outline-none"
                  style={{ borderColor: theme.border, color: theme.text }}
                  min="1"
                />
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
    <div className="p-6 rounded-xl" style={{ 
      backgroundColor: theme.cardBg,
      border: `1px solid ${theme.border}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <h2 className="text-xl font-semibold mb-4 flex items-center" style={{ color: theme.text }}>
        <Server className="mr-2" style={{ color: theme.primary }} /> Configuração do Servidor
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Factor e CPU */}
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: theme.textLight }}>Form Factor</label>
            <select
              value={selectedFormFactor}
              onChange={(e) => setSelectedFormFactor(e.target.value as FormFactor)}
              className="w-full p-2 border rounded focus:outline-none"
              style={{ borderColor: theme.border, color: theme.text }}
            >
              <option value="1U">1U</option>
              <option value="2U">2U</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: theme.textLight }}>Processador</label>
            <select
              value={selectedCpu.model}
              onChange={(e) => {
                const cpu = CPU_MODELS.find(c => c.model === e.target.value);
                if (cpu) setSelectedCpu(cpu);
              }}
              className="w-full p-2 border rounded focus:outline-none"
              style={{ borderColor: theme.border, color: theme.text }}
            >
              {CPU_MODELS.map(cpu => (
                <option key={cpu.model} value={cpu.model}>
                  {cpu.model} ({cpu.cores}C, {cpu.tdp}W, {cpu.clock}GHz)
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: theme.textLight }}>Sockets</label>
            <select
              value={sockets}
              onChange={(e) => setSockets(parseInt(e.target.value))}
              className="w-full p-2 border rounded focus:outline-none"
              style={{ borderColor: theme.border, color: theme.text }}
            >
              <option value="1">1 Processador</option>
              <option value="2">2 Processadores</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.textLight }}>Memória por Nó (GB)</label>
            <select
              value={memory}
              onChange={(e) => setMemory(parseInt(e.target.value))}
              className="w-full p-2 border rounded focus:outline-none"
              style={{ borderColor: theme.border, color: theme.text }}
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
            <label className="block text-sm font-medium mb-1" style={{ color: theme.textLight }}>Tipo de Disco</label>
            <select
              value={diskType}
              onChange={(e) => setDiskType(e.target.value as DiskType)}
              className="w-full p-2 border rounded focus:outline-none"
              style={{ borderColor: theme.border, color: theme.text }}
            >
              <option value="NVMe">NVMe (Alta Performance)</option>
              <option value="SSD">SSD (Balanceado)</option>
              <option value="NLSAS">NL-SAS (Alta Capacidade)</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: theme.textLight }}>Tamanho do Disco (GB)</label>
            <select
              value={diskSize}
              onChange={(e) => setDiskSize(parseInt(e.target.value))}
              className="w-full p-2 border rounded focus:outline-none"
              style={{ borderColor: theme.border, color: theme.text }}
            >
              {DISK_OPTIONS[diskType].map(size => (
                <option key={size} value={size}>{size} GB</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: theme.textLight }}>
              Quantidade de Discos (Max: {getMaxDisks()})
            </label>
            <input
              type="number"
              value={diskCount}
              onChange={(e) => setDiskCount(Math.min(parseInt(e.target.value) || 1, getMaxDisks()))}
              className="w-full p-2 border rounded focus:outline-none"
              style={{ borderColor: theme.border, color: theme.text }}
              min="1"
              max={getMaxDisks()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.textLight }}>Proteção de Dados</label>
            <select
              value={config.protection}
              onChange={(e) => onChange({...config, protection: e.target.value as ProtectionType})}
              className="w-full p-2 border rounded focus:outline-none"
              style={{ borderColor: theme.border, color: theme.text }}
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
    <div className="p-6 rounded-xl" style={{ 
      backgroundColor: theme.cardBg,
      border: `1px solid ${theme.border}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <h2 className="text-xl font-semibold mb-4" style={{ color: theme.text }}>Resultado do Dimensionamento</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg" style={{ 
          backgroundColor: 'rgba(162, 0, 255, 0.05)',
          borderLeft: `4px solid ${theme.primary}`
        }}>
          <div className="flex items-center mb-2" style={{ color: theme.primary }}>
            <Server className="mr-2" />
            <h3 className="font-medium">Nós Necessários</h3>
          </div>
          <p className="text-3xl font-bold" style={{ color: theme.text }}>{result.totalNodes}</p>
        </div>

        <div className="p-4 rounded-lg" style={{ 
          backgroundColor: 'rgba(72, 187, 120, 0.05)',
          borderLeft: `4px solid ${theme.success}`
        }}>
          <div className="flex items-center mb-2" style={{ color: theme.success }}>
            <Cpu className="mr-2" />
            <h3 className="font-medium">Total de Cores</h3>
          </div>
          <p className="text-2xl font-bold" style={{ color: theme.text }}>{result.totalCores}</p>
        </div>

        <div className="p-4 rounded-lg" style={{ 
          backgroundColor: 'rgba(66, 153, 225, 0.05)',
          borderLeft: `4px solid ${theme.info}`
        }}>
          <div className="flex items-center mb-2" style={{ color: theme.info }}>
            <HardDrive className="mr-2" />
            <h3 className="font-medium">Memória Total</h3>
          </div>
          <p className="text-2xl font-bold" style={{ color: theme.text }}>{result.totalRamGB} GB</p>
        </div>

        <div className="p-4 rounded-lg" style={{ 
          backgroundColor: 'rgba(237, 137, 54, 0.05)',
          borderLeft: `4px solid ${theme.warning}`
        }}>
          <div className="flex items-center mb-2" style={{ color: theme.warning }}>
            <DiscIcon className="mr-2" />
            <h3 className="font-medium">Armazenamento</h3>
          </div>
          <p className="text-lg" style={{ color: theme.text }}>
            <span className="font-bold">{result.storageEffectiveTB.toFixed(1)} TB</span> útil<br />
            <span className="text-sm" style={{ color: theme.textLight }}>({result.storageRawTB.toFixed(1)} TB raw)</span>
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-2" style={{ color: theme.text }}>Configuração por Nó:</h3>
        <div className="p-4 rounded-lg" style={{ 
          backgroundColor: 'rgba(245, 247, 250, 0.7)',
          border: `1px solid ${theme.border}`
        }}>
          <p className="font-semibold" style={{ color: theme.text }}>Form Factor: {result.nodeDetails[0].formFactor}</p>
          <p style={{ color: theme.text }}>CPU: {result.nodeDetails[0].cpuConfig}</p>
          <p style={{ color: theme.text }}>Memória: {result.nodeDetails[0].memoryConfig}</p>
          <p style={{ color: theme.text }}>Armazenamento: {result.nodeDetails[0].diskConfig}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg" style={{ 
          backgroundColor: 'rgba(245, 247, 250, 0.7)',
          border: `1px solid ${theme.border}`
        }}>
          <div className="flex items-center mb-2" style={{ color: theme.text }}>
            <Gauge className="mr-2" />
            <h3 className="font-medium">Performance</h3>
          </div>
          <p className="text-lg font-semibold" style={{ color: theme.text }}>
            {result.totalIOPS.toLocaleString()} IOPS estimados
          </p>
          <p className="text-sm mt-1" style={{ color: theme.textLight }}>
            Largura de banda recomendada: {result.networkRequirements}
          </p>
        </div>

        {result.warnings.length > 0 && (
          <div className="p-4 rounded-lg" style={{ 
            backgroundColor: 'rgba(237, 137, 54, 0.05)',
            border: `1px solid ${theme.warning}`
          }}>
            <div className="flex items-center mb-2" style={{ color: theme.warning }}>
              <AlertTriangle className="mr-2" />
              <h3 className="font-medium">Atenção</h3>
            </div>
            <ul className="list-disc pl-5 text-sm space-y-1" style={{ color: theme.text }}>
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
const NutanixSizingTool: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
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
    protection: 'RF2'
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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Aplicar tema escuro se ativado
  const currentTheme = darkMode ? {
    ...theme,
    background: '#1A202C',
    cardBg: '#2D3748',
    text: '#FFFFFF',
    textLight: '#CBD5E0',
    border: '#4A5568'
  } : theme;

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: currentTheme.background }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 text-center relative">
          <button 
            onClick={toggleDarkMode}
            className="absolute top-0 right-0 p-2 rounded-full"
            style={{ color: currentTheme.text }}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <h1 className="text-3xl font-bold mb-2">
            <span style={{ color: currentTheme.text }}>Ferramenta Avançada de</span>{' '}
            <span style={{ color: currentTheme.primary }}>Sizing Nutanix</span>
          </h1>
          <p className="text-lg" style={{ color: currentTheme.textLight }}>
            Calcule o número exato de nós necessários para sua infraestrutura hiperconvergente
          </p>
        </header>

        <div className="space-y-6">
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

          {result && <ResultsPanel result={result} />}
        </div>
      </div>
    </div>
  );
};

export default NutanixSizingTool; 