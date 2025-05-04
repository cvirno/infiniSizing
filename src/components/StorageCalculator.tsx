import React, { useState } from 'react';
import { HardDrive, Database, Download, HelpCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface StorageConfig {
  desiredCapacity: number;
  growthRate: number;
  raidType: 'RAID 1' | 'RAID 5' | 'RAID 6' | 'RAID 10';
  diskSize: number;
  numberOfDisks: number;
  forecastYears: number;
}

interface StorageAssistantConfig {
  currentCapacity: number;
  growthRate: number;
  storageEfficiency: number;
  snapshots: {
    frequency: 'daily' | 'weekly' | 'monthly';
    retention: number;
  };
  logsOverhead: number;
  iops: number;
  throughput: number;
  latency: number;
  readWriteRatio: number;
  workloadType: 'random' | 'sequential';
  raidLevel: 'RAID 1' | 'RAID 5' | 'RAID 6' | 'RAID 10';
  ftt: number;
  sla: number;
  replication: 'none' | 'sync' | 'async';
  storageType: 'all-flash' | 'hybrid' | 'hdd-only';
  protocol: 'block' | 'file' | 'object';
}

interface StorageRecommendation {
  rawCapacity: number;
  usableCapacity: number;
  totalCapacity: number;
  requiredDisks: number;
  diskSize: number;
  diskType: string;
  raidLevel: string;
  storageType: string;
  protocol: string;
  warnings: string[];
  performanceScore: number;
  minimumHosts: number;
  iopsCalculations: {
    rawIOPS: number;
    effectiveIOPS: number;
    netIOPS: number;
    readIOPS: number;
    writeIOPS: number;
    writePenalty: number;
  };
  effectiveThroughput: number;
  raidOverhead: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

// Define disk sizes in GB for all values
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

const RAID_FACTORS = {
  'RAID 1': 0.5,
  'RAID 5': 0.75,
  'RAID 6': 0.67,
  'RAID 10': 0.5
};

const RAID_OVERHEAD = {
  'RAID 1': 0.5,    // 50% de overhead (espelhamento)
  'RAID 5': 0.75,   // 25% de overhead (paridade)
  'RAID 6': 0.67,   // 33% de overhead (dupla paridade)
  'RAID 10': 0.5    // 50% de overhead (espelhamento + striping)
};

const DISK_PERFORMANCE = {
  'HDD': {
    iops: 150,      // IOPS típicos de um HDD
    throughput: 150 // MB/s típicos de um HDD
  },
  'SSD': {
    iops: 50000,    // IOPS típicos de um SSD
    throughput: 500 // MB/s típicos de um SSD
  },
  'NVMe': {
    iops: 100000,   // IOPS típicos de um NVMe
    throughput: 1000 // MB/s típicos de um NVMe
  }
};

const formatStorage = (gb: number): string => {
  if (gb >= 1024) {
    const tb = gb / 1024;
    // Use exact decimal points for specific values
    if (Math.abs(tb - 1.92) < 0.01) return '1.92 TB';
    if (Math.abs(tb - 3.84) < 0.01) return '3.84 TB';
    if (Math.abs(tb - 7.68) < 0.01) return '7.68 TB';
    if (Math.abs(tb - 15.36) < 0.01) return '15.36 TB';
    // For standard TB values, show as whole numbers
    if (Math.floor(tb) === tb) return `${tb} TB`;
    return `${tb.toFixed(2)} TB`;
  }
  return `${gb} GB`;
};

const DISK_MODELS = {
  'SSD': [
    { size: 480, iops: 50000, throughput: 500, price: 200 },
    { size: 960, iops: 50000, throughput: 500, price: 350 },
    { size: 1920, iops: 50000, throughput: 500, price: 600 },
    { size: 3840, iops: 50000, throughput: 500, price: 1000 },
    { size: 7680, iops: 50000, throughput: 500, price: 1800 },
    { size: 15360, iops: 50000, throughput: 500, price: 3000 },
    { size: 30720, iops: 50000, throughput: 500, price: 5000 }
  ],
  'NVMe': [
    { size: 480, iops: 100000, throughput: 1000, price: 300 },
    { size: 960, iops: 100000, throughput: 1000, price: 500 },
    { size: 1920, iops: 100000, throughput: 1000, price: 800 },
    { size: 3840, iops: 100000, throughput: 1000, price: 1200 },
    { size: 7680, iops: 100000, throughput: 1000, price: 2000 },
    { size: 15360, iops: 100000, throughput: 1000, price: 3500 },
    { size: 30720, iops: 100000, throughput: 1000, price: 6000 }
  ],
  'NLSAS': [
    { size: 1024, iops: 150, throughput: 150, price: 100 },
    { size: 2048, iops: 150, throughput: 150, price: 150 },
    { size: 4096, iops: 150, throughput: 150, price: 200 },
    { size: 6144, iops: 150, throughput: 150, price: 250 },
    { size: 8192, iops: 150, throughput: 150, price: 300 },
    { size: 10240, iops: 150, throughput: 150, price: 350 },
    { size: 12288, iops: 150, throughput: 150, price: 400 },
    { size: 16384, iops: 150, throughput: 150, price: 500 },
    { size: 18432, iops: 150, throughput: 150, price: 550 },
    { size: 20480, iops: 150, throughput: 150, price: 600 },
    { size: 22528, iops: 150, throughput: 150, price: 650 }
  ]
};

interface Step1Result {
  rawCapacity: number;
  usableCapacity: number;
  totalCapacity: number;
  requiredDisks: number;
}

interface Step2Result {
  diskType: string;
  performanceScore: number;
}

interface Step3Result {
  raidOverhead: number;
  replicationOverhead: number;
  minimumHosts: number;
  warnings: string[];
}

const StorageCalculator = () => {
  const [useAssistant, setUseAssistant] = useState(false);
  const [assistantStep, setAssistantStep] = useState(1);
  const [assistantConfig, setAssistantConfig] = useState<StorageAssistantConfig>({
    currentCapacity: 0,
    growthRate: 0,
    storageEfficiency: 1,
    snapshots: {
      frequency: 'daily',
      retention: 30
    },
    logsOverhead: 5,
    iops: 0,
    throughput: 0,
    latency: 0,
    readWriteRatio: 70,
    workloadType: 'random',
    raidLevel: 'RAID 5',
    ftt: 1,
    sla: 99.9,
    replication: 'none',
    storageType: 'hybrid',
    protocol: 'block'
  });

  const [recommendations, setRecommendations] = useState<StorageRecommendation | null>(null);

  const [config, setConfig] = useState<StorageConfig>({
    desiredCapacity: 1000,
    growthRate: 20,
    raidType: 'RAID 5',
    diskSize: DISK_SIZES[0],
    numberOfDisks: 4,
    forecastYears: 3
  });

  const [selectedDiskModel, setSelectedDiskModel] = useState<{
    type: 'SSD' | 'NVMe' | 'NLSAS';
    size: number;
    iops: number;
    throughput: number;
    price: number;
  } | null>(null);

  const calculateRawCapacity = () => {
    return config.diskSize * config.numberOfDisks;
  };

  const calculateUsableCapacity = () => {
    const rawCapacity = calculateRawCapacity();
    return rawCapacity * RAID_FACTORS[config.raidType];
  };

  const calculateFutureCapacity = () => {
    return calculateUsableCapacity() * Math.pow(1 + (config.growthRate / 100), config.forecastYears);
  };

  const generateCapacityForecast = () => {
    return Array.from({ length: config.forecastYears + 1 }, (_, i) => ({
      year: i,
      capacity: calculateUsableCapacity() * Math.pow(1 + (config.growthRate / 100), i)
    }));
  };

  const capacityData = [
    { name: 'Raw Capacity', value: calculateRawCapacity() },
    { name: 'Usable Capacity', value: calculateUsableCapacity() },
    { name: 'Future Capacity', value: calculateFutureCapacity() }
  ];

  const exportReport = async () => {
    const element = document.getElementById('storage-report');
    if (!element) return;

    const canvas = await html2canvas(element, {
      backgroundColor: '#0f172a'
    });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm'
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save('storage-sizing-report.pdf');
  };

  const processStep1 = (): Step1Result => {
    const rawCapacity = assistantConfig.currentCapacity;
    const usableCapacity = rawCapacity * assistantConfig.storageEfficiency;
    const totalCapacity = usableCapacity * (1 + assistantConfig.growthRate / 100);
    
    // Encontrar o modelo de disco mais adequado
    const diskType = selectedDiskModel?.type || 'NLSAS';
    const diskModels = DISK_MODELS[diskType];
    const requiredDisks = Math.ceil(totalCapacity / (selectedDiskModel?.size || diskModels[0].size));

    return {
      rawCapacity,
      usableCapacity,
      totalCapacity,
      requiredDisks
    };
  };

  const processStep2 = (): Step2Result => {
    let diskType = 'NLSAS';
    if (assistantConfig.iops > 50000 || assistantConfig.latency < 5) {
      diskType = 'NVMe';
    } else if (assistantConfig.iops > 10000 || assistantConfig.latency < 10) {
      diskType = 'SSD';
    }

    return {
      diskType,
      performanceScore: (assistantConfig.iops * 0.4 + assistantConfig.throughput * 0.3 + (100 - assistantConfig.latency) * 0.3) / 100
    };
  };

  const processStep3 = (): Step3Result => {
    const raidOverhead = RAID_OVERHEAD[assistantConfig.raidLevel as keyof typeof RAID_OVERHEAD];
    const replicationOverhead = assistantConfig.replication === 'sync' ? 2 : 1;
    const minimumHosts = 2 * assistantConfig.ftt + 1;

    const warnings: string[] = [];
    if (assistantConfig.storageType === 'all-flash' && selectedDiskModel?.type !== 'SSD' && selectedDiskModel?.type !== 'NVMe') {
      warnings.push('Recomendação: Considere usar All-Flash para melhor performance');
    }
    if (assistantConfig.storageType === 'hdd-only' && (selectedDiskModel?.type === 'SSD' || selectedDiskModel?.type === 'NVMe')) {
      warnings.push('Aviso: HDD-only pode não atender aos requisitos de performance');
    }

    return {
      raidOverhead,
      replicationOverhead,
      minimumHosts,
      warnings
    };
  };

  const handleNumericInput = (value: string, field: keyof StorageAssistantConfig) => {
    // Remove zeros à esquerda e converte para número
    const numericValue = value === '' ? 0 : Number(value.replace(/^0+/, ''));
    setAssistantConfig({ ...assistantConfig, [field]: numericValue });
  };

  const calculateIOPS = (rawIOPS: number, raidLevel: string, readWriteRatio: number) => {
    const raidOverhead = RAID_OVERHEAD[raidLevel as keyof typeof RAID_OVERHEAD];
    const writePenalty = {
      'RAID 1': 2,   // Cada escrita requer 2 operações
      'RAID 5': 4,   // Cada escrita requer 4 operações (read old data, read old parity, write new data, write new parity)
      'RAID 6': 6,   // Cada escrita requer 6 operações (similar ao RAID 5, mas com dupla paridade)
      'RAID 10': 2   // Cada escrita requer 2 operações (espelhamento)
    }[raidLevel as keyof typeof RAID_OVERHEAD];

    const readIOPS = rawIOPS * (readWriteRatio / 100);
    const writeIOPS = rawIOPS * ((100 - readWriteRatio) / 100);
    
    // Aplicar penalidade de escrita
    const effectiveWriteIOPS = writeIOPS / writePenalty;
    
    // Calcular IOPS efetivos
    const effectiveIOPS = readIOPS + effectiveWriteIOPS;
    
    // Aplicar overhead de RAID
    const netIOPS = effectiveIOPS * raidOverhead;
    
    return {
      rawIOPS,
      effectiveIOPS,
      netIOPS,
      readIOPS,
      writeIOPS,
      writePenalty
    };
  };

  const calculateDiskRecommendation = () => {
    if (!selectedDiskModel) return null;

    const { iops, throughput, size } = selectedDiskModel;
    const raidOverhead = RAID_OVERHEAD[assistantConfig.raidLevel as keyof typeof RAID_OVERHEAD];
    
    // Calcular IOPS efetivos
    const iopsCalculations = calculateIOPS(
      iops,
      assistantConfig.raidLevel,
      assistantConfig.readWriteRatio
    );

    // Calcular quantidade mínima de discos por capacidade
    const disksByCapacity = Math.ceil(assistantConfig.currentCapacity / size);

    // Calcular quantidade mínima de discos por IOPS
    const requiredIOPS = assistantConfig.iops;
    const disksByIOPS = Math.ceil(requiredIOPS / iopsCalculations.netIOPS);

    // Calcular quantidade mínima de discos por throughput
    const requiredThroughput = assistantConfig.throughput;
    const effectiveThroughput = throughput * raidOverhead;
    const disksByThroughput = Math.ceil(requiredThroughput / effectiveThroughput);

    // Quantidade final de discos (máximo entre os requisitos)
    const finalDiskCount = Math.max(disksByCapacity, disksByIOPS, disksByThroughput);

    // Calcular capacidade total
    const totalCapacity = size * finalDiskCount;
    const usableCapacity = totalCapacity * raidOverhead;

    return {
      disksByCapacity,
      disksByIOPS,
      disksByThroughput,
      finalDiskCount,
      totalCapacity,
      usableCapacity,
      iopsCalculations,
      effectiveThroughput: effectiveThroughput * finalDiskCount,
      raidOverhead: raidOverhead * 100
    };
  };

  const generatePerformanceChartData = () => {
    if (!selectedDiskModel) return [];

    const { iops, throughput } = selectedDiskModel;
    const raidOverhead = RAID_OVERHEAD[assistantConfig.raidLevel as keyof typeof RAID_OVERHEAD];
    
    const iopsCalculations = calculateIOPS(
      iops,
      assistantConfig.raidLevel,
      assistantConfig.readWriteRatio
    );

    return [
      {
        name: 'IOPS Brutos',
        value: iops
      },
      {
        name: 'IOPS Efetivos',
        value: iopsCalculations.effectiveIOPS
      },
      {
        name: 'IOPS Líquidos',
        value: iopsCalculations.netIOPS
      },
      {
        name: 'Throughput',
        value: throughput * raidOverhead
      }
    ];
  };

  const diskRecommendation = calculateDiskRecommendation();
  const performanceData = generatePerformanceChartData();

  const handleStepComplete = () => {
    if (assistantStep === 4) {
      const step1Result = processStep1();
      const step2Result = processStep2();
      const step3Result = processStep3();
      
      const finalRecommendation: StorageRecommendation = {
        rawCapacity: step1Result.rawCapacity,
        usableCapacity: step1Result.usableCapacity,
        totalCapacity: step1Result.totalCapacity,
        requiredDisks: step1Result.requiredDisks,
        diskSize: selectedDiskModel?.size || 0,
        diskType: step2Result.diskType,
        raidLevel: assistantConfig.raidLevel,
        storageType: assistantConfig.storageType,
        protocol: assistantConfig.protocol,
        warnings: step3Result.warnings,
        performanceScore: step2Result.performanceScore,
        minimumHosts: step3Result.minimumHosts,
        iopsCalculations: diskRecommendation?.iopsCalculations || {
          rawIOPS: 0,
          effectiveIOPS: 0,
          netIOPS: 0,
          readIOPS: 0,
          writeIOPS: 0,
          writePenalty: 0
        },
        effectiveThroughput: diskRecommendation?.effectiveThroughput || 0,
        raidOverhead: step3Result.raidOverhead * 100
      };
      
      setRecommendations(finalRecommendation);
      setUseAssistant(false);
    } else {
      setAssistantStep(assistantStep + 1);
    }
  };

  const handleDiskTypeChange = (type: 'SSD' | 'NVMe' | 'NLSAS') => {
    const firstModel = DISK_MODELS[type][0];
    setSelectedDiskModel({
      type,
      size: firstModel.size,
      iops: firstModel.iops,
      throughput: firstModel.throughput,
      price: firstModel.price
    });
  };

  const handleDiskModelChange = (size: number) => {
    if (!selectedDiskModel) return;
    const model = DISK_MODELS[selectedDiskModel.type].find(m => m.size === size);
    if (model) {
      setSelectedDiskModel({
        ...selectedDiskModel,
        size: model.size,
        iops: model.iops,
        throughput: model.throughput,
        price: model.price
      });
    }
  };

  return (
    <div className="space-y-8" id="storage-report">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Calculadora de Storage</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setUseAssistant(!useAssistant)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              useAssistant 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            <HelpCircle size={20} />
            {useAssistant ? 'Modo Tradicional' : 'Assistente de Storage'}
          </button>
          <button
            onClick={exportReport}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex items-center gap-2"
          >
            <Download size={20} />
            Exportar Relatório
          </button>
        </div>
      </div>

      {useAssistant ? (
        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(assistantStep / 4) * 100}%` }}
              />
            </div>
            <span className="text-sm text-slate-400">Passo {assistantStep} de 4</span>
          </div>

          {assistantStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Requisitos de Capacidade</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Volume Atual de Dados (TB)
                  </label>
                  <input
                    type="number"
                    value={assistantConfig.currentCapacity || ''}
                    onChange={(e) => handleNumericInput(e.target.value, 'currentCapacity')}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Taxa de Crescimento Anual (%)
                  </label>
                  <input
                    type="number"
                    value={assistantConfig.growthRate || ''}
                    onChange={(e) => handleNumericInput(e.target.value, 'growthRate')}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Taxa de Eficiência de Storage
                  </label>
                  <input
                    type="number"
                    value={assistantConfig.storageEfficiency || ''}
                    onChange={(e) => handleNumericInput(e.target.value, 'storageEfficiency')}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="1"
                    step="0.1"
                    placeholder="ex: 2.0 para deduplicação 2:1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Overhead de Logs e Metadados (%)
                  </label>
                  <input
                    type="number"
                    value={assistantConfig.logsOverhead || ''}
                    onChange={(e) => handleNumericInput(e.target.value, 'logsOverhead')}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                <h4 className="text-lg font-medium mb-2">Cálculos Parciais</h4>
                <div className="space-y-2">
                  <p>Capacidade Bruta: {processStep1().rawCapacity.toFixed(2)} TB</p>
                  <p>Capacidade Utilizável: {processStep1().usableCapacity.toFixed(2)} TB</p>
                </div>
              </div>
            </div>
          )}

          {assistantStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Requisitos de Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    IOPS Necessários
                  </label>
                  <input
                    type="number"
                    value={assistantConfig.iops || ''}
                    onChange={(e) => handleNumericInput(e.target.value, 'iops')}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Throughput Necessário (MB/s)
                  </label>
                  <input
                    type="number"
                    value={assistantConfig.throughput || ''}
                    onChange={(e) => handleNumericInput(e.target.value, 'throughput')}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Latência Máxima (ms)
                  </label>
                  <input
                    type="number"
                    value={assistantConfig.latency || ''}
                    onChange={(e) => handleNumericInput(e.target.value, 'latency')}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Proporção Leitura/Escrita (% Leitura)
                  </label>
                  <input
                    type="number"
                    value={assistantConfig.readWriteRatio || ''}
                    onChange={(e) => handleNumericInput(e.target.value, 'readWriteRatio')}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tipo de Workload
                  </label>
                  <select
                    value={assistantConfig.workloadType}
                    onChange={(e) => setAssistantConfig({ ...assistantConfig, workloadType: e.target.value as 'random' | 'sequential' })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="random">Aleatório (VMs, Bancos de Dados)</option>
                    <option value="sequential">Sequencial (Backups, Mídia)</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                <h4 className="text-lg font-medium mb-2">Seleção de Disco</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Tipo de Disco
                    </label>
                    <select
                      value={selectedDiskModel?.type || ''}
                      onChange={(e) => handleDiskTypeChange(e.target.value as 'SSD' | 'NVMe' | 'NLSAS')}
                      className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="">Selecione...</option>
                      <option value="SSD">SSD</option>
                      <option value="NVMe">NVMe</option>
                      <option value="NLSAS">NLSAS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Modelo
                    </label>
                    <select
                      value={selectedDiskModel?.size || ''}
                      onChange={(e) => handleDiskModelChange(Number(e.target.value))}
                      className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                      disabled={!selectedDiskModel?.type}
                    >
                      <option value="">Selecione...</option>
                      {selectedDiskModel?.type && DISK_MODELS[selectedDiskModel.type].map(model => (
                        <option key={model.size} value={model.size}>
                          {formatStorage(model.size)} - {model.iops} IOPS
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedDiskModel && (
                  <div className="mt-6">
                    <h4 className="text-lg font-medium mb-2">Análise de Performance</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={performanceData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#3B82F6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2">
                        <p>IOPS Brutos: {selectedDiskModel.iops}</p>
                        <p>IOPS Efetivos: {diskRecommendation?.iopsCalculations.effectiveIOPS.toFixed(0)}</p>
                        <p>IOPS Líquidos: {diskRecommendation?.iopsCalculations.netIOPS.toFixed(0)}</p>
                        <p>Throughput: {selectedDiskModel.throughput} MB/s</p>
                        <p>Throughput Efetivo: {diskRecommendation?.effectiveThroughput.toFixed(0)} MB/s</p>
                        <p>Overhead de RAID: {diskRecommendation?.raidOverhead.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {diskRecommendation && (
                <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                  <h4 className="text-lg font-medium mb-2">Recomendação de Discos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium mb-2">Quantidade de Discos</h5>
                      <div className="space-y-2">
                        <p>Por Capacidade: {diskRecommendation.disksByCapacity}</p>
                        <p>Por IOPS: {diskRecommendation.disksByIOPS}</p>
                        <p>Por Throughput: {diskRecommendation.disksByThroughput}</p>
                        <p className="font-bold">Total Recomendado: {diskRecommendation.finalDiskCount}</p>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Capacidade</h5>
                      <div className="space-y-2">
                        <p>Total: {formatStorage(diskRecommendation.totalCapacity)}</p>
                        <p>Utilizável: {formatStorage(diskRecommendation.usableCapacity)}</p>
                        <p>Overhead: {diskRecommendation.raidOverhead.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {assistantStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Resiliência e Disponibilidade</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nível de RAID
                  </label>
                  <select
                    value={assistantConfig.raidLevel}
                    onChange={(e) => setAssistantConfig({ ...assistantConfig, raidLevel: e.target.value as 'RAID 1' | 'RAID 5' | 'RAID 6' | 'RAID 10' })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="RAID 1">RAID 1 (Espelhamento)</option>
                    <option value="RAID 5">RAID 5 (Paridade Simples)</option>
                    <option value="RAID 6">RAID 6 (Paridade Dupla)</option>
                    <option value="RAID 10">RAID 10 (Espelhamento + Striping)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Falhas a Tolerar (FTT)
                  </label>
                  <input
                    type="number"
                    value={assistantConfig.ftt}
                    onChange={(e) => setAssistantConfig({ ...assistantConfig, ftt: Number(e.target.value) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="0"
                    max="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    SLA (% Disponibilidade)
                  </label>
                  <select
                    value={assistantConfig.sla}
                    onChange={(e) => setAssistantConfig({ ...assistantConfig, sla: Number(e.target.value) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value={99.9}>99.9% (≈8.76h downtime/ano)</option>
                    <option value={99.99}>99.99% (≈52.6m downtime/ano)</option>
                    <option value={99.999}>99.999% (≈5.3m downtime/ano)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Replicação
                  </label>
                  <select
                    value={assistantConfig.replication}
                    onChange={(e) => setAssistantConfig({ ...assistantConfig, replication: e.target.value as 'none' | 'sync' | 'async' })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="none">Nenhuma</option>
                    <option value="sync">Síncrona</option>
                    <option value="async">Assíncrona</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                <h4 className="text-lg font-medium mb-2">Requisitos de Resiliência</h4>
                <div className="space-y-2">
                  <p>Número Mínimo de Hosts: {processStep3().minimumHosts}</p>
                  <p>Overhead de RAID: {((1 - processStep1().usableCapacity / processStep1().rawCapacity) * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}

          {assistantStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Tipo de Storage e Protocolo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tecnologia de Storage
                  </label>
                  <select
                    value={assistantConfig.storageType}
                    onChange={(e) => setAssistantConfig({ ...assistantConfig, storageType: e.target.value as 'all-flash' | 'hybrid' | 'hdd-only' })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="all-flash">All-Flash (SSD/NVMe)</option>
                    <option value="hybrid">Híbrido (SSD + HDD)</option>
                    <option value="hdd-only">Apenas HDD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Protocolo de Acesso
                  </label>
                  <select
                    value={assistantConfig.protocol}
                    onChange={(e) => setAssistantConfig({ ...assistantConfig, protocol: e.target.value as 'block' | 'file' | 'object' })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="block">Block (iSCSI, FC)</option>
                    <option value="file">File (NFS, SMB)</option>
                    <option value="object">Object (S3)</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                <h4 className="text-lg font-medium mb-2">Recomendações Finais</h4>
                <div className="space-y-2">
                  <p>Capacidade Total Necessária: {processStep1().totalCapacity.toFixed(2)} TB</p>
                  <p>Discos Necessários: {processStep1().requiredDisks}</p>
                  <p>Tamanho do Disco: {selectedDiskModel?.size || 0} GB</p>
                  <p>Tipo de Disco: {processStep2().diskType}</p>
                  <p>Configuração RAID: {assistantConfig.raidLevel}</p>
                  <p>Tipo de Storage: {assistantConfig.storageType}</p>
                  <p>Protocolo: {assistantConfig.protocol}</p>
                </div>
                {processStep3().warnings.length > 0 && (
                  <div className="mt-4 p-4 bg-yellow-500/20 rounded-lg">
                    <h4 className="text-lg font-medium mb-2">Avisos</h4>
                    <ul className="list-disc list-inside">
                      {processStep3().warnings.map((warning: string, index: number) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setAssistantStep(Math.max(1, assistantStep - 1))}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
              disabled={assistantStep === 1}
            >
              Anterior
            </button>
            <button
              onClick={handleStepComplete}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
            >
              {assistantStep === 4 ? 'Finalizar' : 'Próximo'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <HardDrive size={20} />
                  <span>Raw Capacity</span>
                </div>
                <div className="text-2xl font-bold">{formatStorage(calculateRawCapacity())}</div>
                <div className="text-sm text-slate-400 mt-1">
                  Total Storage
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Database size={20} />
                  <span>Usable Capacity</span>
                </div>
                <div className="text-2xl font-bold">{formatStorage(calculateUsableCapacity())}</div>
                <div className="text-sm text-slate-400 mt-1">
                  After RAID ({config.raidType})
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <HardDrive size={20} />
                  <span>Future Capacity</span>
                </div>
                <div className="text-2xl font-bold">{formatStorage(calculateFutureCapacity())}</div>
                <div className="text-sm text-slate-400 mt-1">
                  In {config.forecastYears} years
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-4">Capacity Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={capacityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {capacityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatStorage(Number(value))}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.5rem'
                      }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-4">Growth Projection</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={generateCapacityForecast()}>
                    <XAxis
                      dataKey="year"
                      stroke="#64748b"
                      label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                      stroke="#64748b"
                      tickFormatter={(value) => `${(value / 1024).toFixed(1)}TB`}
                    />
                    <Tooltip
                      formatter={(value) => formatStorage(Number(value))}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.5rem'
                      }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="capacity"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-6">Storage Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Disk Size
                </label>
                <select
                  value={config.diskSize}
                  onChange={(e) => setConfig({ ...config, diskSize: Number(e.target.value) })}
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
                  Number of Disks
                </label>
                <input
                  type="number"
                  value={config.numberOfDisks}
                  onChange={(e) => setConfig({ ...config, numberOfDisks: Number(e.target.value) })}
                  className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                  min="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  RAID Type
                </label>
                <select
                  value={config.raidType}
                  onChange={(e) => setConfig({ ...config, raidType: e.target.value as StorageConfig['raidType'] })}
                  className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="RAID 1">RAID 1 (Mirroring)</option>
                  <option value="RAID 5">RAID 5 (Striping with Parity)</option>
                  <option value="RAID 6">RAID 6 (Double Parity)</option>
                  <option value="RAID 10">RAID 10 (Striping + Mirroring)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Annual Growth Rate (%)
                </label>
                <input
                  type="number"
                  value={config.growthRate}
                  onChange={(e) => setConfig({ ...config, growthRate: Number(e.target.value) })}
                  className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Forecast Period (Years)
                </label>
                <input
                  type="number"
                  value={config.forecastYears}
                  onChange={(e) => setConfig({ ...config, forecastYears: Number(e.target.value) })}
                  className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                  min="1"
                  max="10"
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-300 mb-2">RAID Configuration Details</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <p>RAID 1: 50% usable capacity (mirroring)</p>
                <p>RAID 5: 75% usable capacity (single parity)</p>
                <p>RAID 6: 67% usable capacity (double parity)</p>
                <p>RAID 10: 50% usable capacity (mirror + stripe)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {recommendations && (
        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl mt-8">
          <h3 className="text-xl font-semibold mb-4">Recomendações Finais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium mb-2">Capacidade</h4>
              <div className="space-y-2">
                <p>Capacidade Bruta: {recommendations.rawCapacity.toFixed(2)} TB</p>
                <p>Capacidade Utilizável: {recommendations.usableCapacity.toFixed(2)} TB</p>
                <p>Capacidade Total Necessária: {recommendations.totalCapacity.toFixed(2)} TB</p>
                <p>Discos Necessários: {recommendations.requiredDisks}</p>
                <p>Tamanho do Disco: {recommendations.diskSize} GB</p>
                <p>Tipo de Disco: {recommendations.diskType}</p>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-2">Performance</h4>
              <div className="space-y-2">
                <p>IOPS Líquidos: {recommendations.iopsCalculations.netIOPS.toFixed(0)}</p>
                <p>Throughput Efetivo: {recommendations.effectiveThroughput.toFixed(0)} MB/s</p>
                <p>Overhead de RAID: {recommendations.raidOverhead.toFixed(1)}%</p>
                <p>Configuração RAID: {recommendations.raidLevel}</p>
                <p>Tipo de Storage: {recommendations.storageType}</p>
                <p>Protocolo: {recommendations.protocol}</p>
                <p>Número Mínimo de Hosts: {recommendations.minimumHosts}</p>
              </div>
            </div>
          </div>
          {recommendations.warnings && recommendations.warnings.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-500/20 rounded-lg">
              <h4 className="text-lg font-medium mb-2">Avisos</h4>
              <ul className="list-disc list-inside">
                {recommendations.warnings.map((warning: string, index: number) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StorageCalculator;