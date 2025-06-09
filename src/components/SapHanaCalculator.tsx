import React, { useState } from 'react';
import { Database, Server, Cpu } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/lib/supabase";

interface Processor {
  model: string;
  cores: number;
  saps: number;
  sockets: number;
  price: number;
  sapsTotal: number;
}

// Lista de processadores para 2 soquetes
const SAP_PROCESSORS_2: Processor[] = [
  { model: 'Intel Xeon Platinum 8593Q 64C 385W 2.2GHz', cores: 64, saps: 130000, sockets: 2, price: 327476.16, sapsTotal: 260000 },
  { model: 'Intel Xeon Platinum 8592V 64C 330W 2.0GHz', cores: 64, saps: 120000, sockets: 2, price: 290961.72, sapsTotal: 240000 },
  { model: 'Intel Xeon Platinum 8592+ 64C 350W 1.9GHz', cores: 64, saps: 125000, sockets: 2, price: 308038.14, sapsTotal: 250000 },
  { model: 'Intel Xeon Platinum 8580 60C 300W 2.0GHz', cores: 60, saps: 120000, sockets: 2, price: 280375.58, sapsTotal: 240000 },
  { model: 'Intel Xeon Platinum 8570 56C 350W 2.1GHz', cores: 56, saps: 130000, sockets: 2, price: 254720.28, sapsTotal: 260000 },
  { model: 'Intel Xeon Platinum 8562Y+ 64C 300W 2.8GHz', cores: 64, saps: 90000, sockets: 2, price: 147845.78, sapsTotal: 180000 },
  { model: 'Intel Xeon Platinum 8558Q 48C 350W 2.7GHz', cores: 48, saps: 90000, sockets: 2, price: 189215.76, sapsTotal: 180000 },
  { model: 'Intel Xeon Platinum 8558U 48C 300W 2.0GHz', cores: 48, saps: 85000, sockets: 2, price: 123170.28, sapsTotal: 170000 },
  { model: 'Intel Xeon Platinum 8558 48C 330W 2.1GHz', cores: 48, saps: 85000, sockets: 2, price: 138822.22, sapsTotal: 170000 },
  { model: 'Intel Xeon Platinum 8480+ 56C 350W 2.2GHz', cores: 56, saps: 130000, sockets: 2, price: 282050.90, sapsTotal: 260000 },
  { model: 'Intel Xeon Platinum 8470Q 52C 350W 2.1GHz', cores: 52, saps: 90000, sockets: 2, price: 309093.04, sapsTotal: 180000 },
  { model: 'Intel Xeon Platinum 8470Q 52C 350W 2.1GHz', cores: 52, saps: 90000, sockets: 2, price: 312697.78, sapsTotal: 180000 },
  { model: 'Intel Xeon Platinum 8470 52C 350W 2.0GHz', cores: 52, saps: 90000, sockets: 2, price: 233886.34, sapsTotal: 180000 },
  { model: 'Intel Xeon Platinum 8468V 48C 330W 2.4GHz', cores: 48, saps: 90000, sockets: 2, price: 217651.40, sapsTotal: 180000 },
  { model: 'Intel Xeon Platinum 8468 48C 330W 2.1GHz', cores: 48, saps: 90000, sockets: 2, price: 183378.04, sapsTotal: 180000 },
  { model: 'Intel Xeon Platinum 8461V 48C 300W 2.2GHz', cores: 48, saps: 80000, sockets: 2, price: 195362.06, sapsTotal: 160000 },
  { model: 'Intel Xeon Platinum 8460H 40C 330W 2.2GHz', cores: 40, saps: 75000, sockets: 2, price: 350019.86, sapsTotal: 150000 },
  { model: 'Intel Xeon Platinum 8454H 32C 270W 2.1GHz', cores: 32, saps: 60000, sockets: 2, price: 216000.44, sapsTotal: 120000 },
  { model: 'Intel Xeon Platinum 8452Y 36C 300W 2.0GHz', cores: 36, saps: 55000, sockets: 2, price: 119009.50, sapsTotal: 110000 },
  { model: 'Intel Xeon Platinum 8450H 28C 250W 2.0GHz', cores: 28, saps: 45000, sockets: 2, price: 153009.14, sapsTotal: 90000 },
  { model: 'Intel Xeon Platinum 8444H 16C 270W 2.9GHz', cores: 16, saps: 35000, sockets: 2, price: 144024.36, sapsTotal: 70000 },
  { model: 'Intel Xeon Gold 6558Q 32C 350W 3.2GHz', cores: 32, saps: 70000, sockets: 2, price: 155087.18, sapsTotal: 140000 },
  { model: 'Intel Xeon Gold 6554S 36C 270W 2.2GHz', cores: 36, saps: 58000, sockets: 2, price: 110950.84, sapsTotal: 116000 },
  { model: 'Intel Xeon Gold 6544Y 16C 270W 3.6GHz', cores: 16, saps: 58000, sockets: 2, price: 110950.84, sapsTotal: 116000 },
  { model: 'Intel Xeon Gold 6542Y 24C 250W 2.9GHz', cores: 24, saps: 52000, sockets: 2, price: 117451.86, sapsTotal: 104000 },
  { model: 'Intel Xeon Gold 6538Y+ 32C 205W 2.1GHz', cores: 32, saps: 54000, sockets: 2, price: 121926.34, sapsTotal: 108000 },
  { model: 'Intel Xeon Gold 6538N 32C 205W 2.1GHz', cores: 32, saps: 54000, sockets: 2, price: 121926.34, sapsTotal: 108000 },
  { model: 'Intel Xeon Gold 6534 8C 195W 3.9GHz', cores: 8, saps: 25000, sockets: 2, price: 65000.00, sapsTotal: 50000 },
  { model: 'Intel Xeon Gold 6530 32C 270W 2.1GHz', cores: 32, saps: 52000, sockets: 2, price: 117451.86, sapsTotal: 104000 },
  { model: 'Intel Xeon Gold 6458Q 32C 350W 3.1GHz', cores: 32, saps: 65000, sockets: 2, price: 182679.08, sapsTotal: 130000 },
  { model: 'Intel Xeon Gold 6454S 36C 270W 2.2GHz', cores: 36, saps: 58000, sockets: 2, price: 110950.84, sapsTotal: 116000 },
  { model: 'Intel Xeon Gold 6448H 32C 250W 2.4GHz', cores: 32, saps: 65000, sockets: 2, price: 131785.52, sapsTotal: 130000 },
  { model: 'Intel Xeon Gold 6444Y 16C 270W 3.0GHz', cores: 16, saps: 32000, sockets: 2, price: 61733.93, sapsTotal: 64000 },
  { model: 'Intel Xeon Gold 6442Y 24C 225W 2.6GHz', cores: 24, saps: 45000, sockets: 2, price: 123067.86, sapsTotal: 90000 },
  { model: 'Intel Xeon Gold 6438M 32C 205W 2.2GHz', cores: 32, saps: 55000, sockets: 2, price: 114787.42, sapsTotal: 110000 },
  { model: 'Intel Xeon Gold 6438Y+ 32C 205W 2.0GHz', cores: 32, saps: 48000, sockets: 2, price: 106288.14, sapsTotal: 96000 },
  { model: 'Intel Xeon Gold 6434H 8C 195W 3.7GHz', cores: 8, saps: 22000, sockets: 2, price: 128917.94, sapsTotal: 44000 },
  { model: 'Intel Xeon Gold 6434 8C 195W 3.7GHz', cores: 8, saps: 22000, sockets: 2, price: 95093.38, sapsTotal: 44000 },
  { model: 'Intel Xeon Gold 6430 32C 270W 2.1GHz', cores: 32, saps: 50000, sockets: 2, price: 62529.72, sapsTotal: 100000 },
  { model: 'Intel Xeon Gold 6428N 32C 185W 1.8GHz', cores: 32, saps: 40000, sockets: 2, price: 134357.96, sapsTotal: 80000 },
  { model: 'Intel Xeon Gold 6426Y 16C 185W 2.5GHz', cores: 16, saps: 22000, sockets: 2, price: 45070.94, sapsTotal: 44000 },
  { model: 'Intel Xeon Gold 6424N 32C 185W 1.8GHz', cores: 32, saps: 40000, sockets: 2, price: 66016.18, sapsTotal: 80000 },
  { model: 'Intel Xeon Gold 5520+ 28C 205W 2.2GHz', cores: 28, saps: 45000, sockets: 2, price: 60183.15, sapsTotal: 90000 },
  { model: 'Intel Xeon Gold 5420+ 28C 205W 2.0GHz', cores: 28, saps: 40000, sockets: 2, price: 55484.00, sapsTotal: 80000 },
  { model: 'Intel Xeon Gold 5418Y 24C 185W 2.0GHz', cores: 24, saps: 35000, sockets: 2, price: 52886.36, sapsTotal: 70000 },
  { model: 'Intel Xeon Gold 5418N 24C 165W 1.8GHz', cores: 24, saps: 35000, sockets: 2, price: 66186.12, sapsTotal: 70000 },
  { model: 'Intel Xeon Gold 5416S 16C 150W 2.0GHz', cores: 16, saps: 25000, sockets: 2, price: 33183.76, sapsTotal: 50000 },
  { model: 'Intel Xeon Gold 5415+ 8C 150W 2.9GHz', cores: 8, saps: 15000, sockets: 2, price: 37977.52, sapsTotal: 30000 },
  { model: 'Intel Xeon Gold 5412U 24C 185W 2.1GHz', cores: 24, saps: 35000, sockets: 2, price: 60183.15, sapsTotal: 70000 },
  { model: 'Intel Xeon Gold 5411N 24C 165W 1.9GHz', cores: 24, saps: 32000, sockets: 2, price: 59275.90, sapsTotal: 64000 },
  { model: 'Intel Xeon Bronze 3408U 8C 125W 1.8GHz', cores: 8, saps: 8500, sockets: 2, price: 17244.74, sapsTotal: 17000 },
  { model: 'Intel Xeon Silver 4509Y 8C 125W 2.6GHz', cores: 8, saps: 12000, sockets: 2, price: 23431.68, sapsTotal: 24000 }
];

// Lista de processadores para 4 soquetes
const SAP_PROCESSORS_4: Processor[] = [
  { model: 'Intel Xeon Gold 6434H 8C 195W 3.7GHz', cores: 8, saps: 22000, sockets: 4, price: 515671.74, sapsTotal: 88000 },
  { model: 'Intel Xeon Gold 6416H 18C 165W 2.2GHz', cores: 18, saps: 28000, sockets: 4, price: 52646.18, sapsTotal: 112000 },
  { model: 'Intel Xeon Gold 6418H 24C 185W 2.1GHz', cores: 24, saps: 38000, sockets: 4, price: 73044.08, sapsTotal: 152000 },
  { model: 'Intel Xeon Platinum 8444H 16C 270W 2.9GHz', cores: 16, saps: 35000, sockets: 4, price: 144024.36, sapsTotal: 140000 },
  { model: 'Intel Xeon Platinum 8450H 28C 250W 2.0GHz', cores: 28, saps: 45000, sockets: 4, price: 153009.14, sapsTotal: 180000 },
  { model: 'Intel Xeon Platinum 8454H 32C 270W 2.1GHz', cores: 32, saps: 60000, sockets: 4, price: 216000.44, sapsTotal: 240000 },
  { model: 'Intel Xeon Platinum 8460H 40C 330W 2.2GHz', cores: 40, saps: 70000, sockets: 4, price: 350019.86, sapsTotal: 280000 },
  { model: 'Intel Xeon Platinum 8468H 48C 330W 2.1GHz', cores: 48, saps: 85000, sockets: 4, price: 521000.74, sapsTotal: 340000 },
  { model: 'Intel Xeon Platinum 8490H 60C 350W 1.9GHz', cores: 60, saps: 110000, sockets: 4, price: 558371.08, sapsTotal: 440000 },
  { model: 'Intel Xeon Gold 6448H 32C 250W 2.4GHz', cores: 32, saps: 55000, sockets: 4, price: 131785.52, sapsTotal: 220000 }
];

// Lista de processadores para 8 soquetes
const SAP_PROCESSORS_8: Processor[] = [
  { model: 'Intel Xeon Platinum 8490H 60C 350W 1.9GHz', cores: 60, saps: 110000, sockets: 8, price: 5179559.16, sapsTotal: 880000 },
  { model: 'Intel Xeon Platinum 8444H 16C 270W 2.9GHz', cores: 16, saps: 35000, sockets: 8, price: 166999.86, sapsTotal: 280000 },
  { model: 'Intel Xeon Platinum 8450H 28C 250W 2.0GHz', cores: 28, saps: 45000, sockets: 8, price: 177418.06, sapsTotal: 360000 },
  { model: 'Intel Xeon Platinum 8454H 32C 270W 2.1GHz', cores: 32, saps: 60000, sockets: 8, price: 250457.80, sapsTotal: 480000 },
  { model: 'Intel Xeon Platinum 8460H 40C 330W 2.2GHz', cores: 40, saps: 70000, sockets: 8, price: 405857.02, sapsTotal: 560000 },
  { model: 'Intel Xeon Platinum 8468H 48C 330W 2.1GHz', cores: 48, saps: 85000, sockets: 8, price: 606150.96, sapsTotal: 680000 }
];

const SapHanaCalculator: React.FC = () => {
  const [saps, setSaps] = useState('');
  const [memory, setMemory] = useState('');
  const [utilization, setUtilization] = useState(65);
  const [processor, setProcessor] = useState<Processor | null>(null);

  // QA states
  const [qaSaps, setQaSaps] = useState('');
  const [qaMemory, setQaMemory] = useState('');
  const [qaProcessor, setQaProcessor] = useState<Processor | null>(null);

  // DEV states
  const [devSaps, setDevSaps] = useState('');
  const [devMemory, setDevMemory] = useState('');
  const [devProcessor, setDevProcessor] = useState<Processor | null>(null);

  // Novos estados para Application Sizing
  const [appSaps, setAppSaps] = useState('');
  const [appMemory, setAppMemory] = useState('');
  const [appServers, setAppServers] = useState<Processor[]>([]);
  const [showAppSizing, setShowAppSizing] = useState(false);

  const handleSapsChange = (value: string) => {
    setSaps(value);
    calculateProcessor(value, memory);
  };

  const handleMemoryChange = (value: string) => {
    setMemory(value);
    calculateProcessor(saps, value);
  };

  const handleQaSapsChange = (value: string) => {
    setQaSaps(value);
    calculateQaProcessor(value, qaMemory);
  };

  const handleQaMemoryChange = (value: string) => {
    setQaMemory(value);
    calculateQaProcessor(qaSaps, value);
  };

  const handleDevSapsChange = (value: string) => {
    setDevSaps(value);
    calculateDevProcessor(value, devMemory);
  };

  const handleDevMemoryChange = (value: string) => {
    setDevMemory(value);
    calculateDevProcessor(devSaps, value);
  };

  const handleUtilizationChange = (value: number) => {
    setUtilization(value);
    // Recalcula todos os módulos quando a utilização muda
    if (saps && memory) {
      calculateProcessor(saps, memory);
    }
    if (qaSaps && qaMemory) {
      calculateQaProcessor(qaSaps, qaMemory);
    }
    if (devSaps && devMemory) {
      calculateDevProcessor(devSaps, devMemory);
    }
    if (appSaps && appMemory) {
      calculateAppServers(appSaps, appMemory);
    }
  };

  const calculateProcessor = (sapsValue: string, memoryValue: string) => {
    const sapsNum = Number(sapsValue);
    const memNum = Number(memoryValue);

    if (!sapsNum || !memNum) {
      setProcessor(null);
      return;
    }

    // Calcula o SAPS total necessário considerando a utilização
    const requiredSaps = Math.ceil(sapsNum / (utilization / 100));
    let candidates: Processor[] = [];

    // Determina a lista de processadores baseado na memória
    if (memNum > 8192) {
      candidates = SAP_PROCESSORS_8;
    } else if (memNum > 4096) {
      candidates = SAP_PROCESSORS_4;
    } else {
      candidates = SAP_PROCESSORS_2;
    }

    // Filtra processadores que atendem o SAPS total necessário (maior ou igual)
    const validCandidates = candidates.filter(cpu => cpu.sapsTotal >= requiredSaps);
    // Ordena por preço (mais barato primeiro)
    validCandidates.sort((a, b) => (a.price * a.sockets) - (b.price * b.sockets));
    
    setProcessor(validCandidates.length > 0 ? validCandidates[0] : null);
  };

  const calculateQaProcessor = (sapsValue: string, memoryValue: string) => {
    const sapsNum = Number(sapsValue);
    const memNum = Number(memoryValue);

    if (!sapsNum || !memNum) {
      setQaProcessor(null);
      return;
    }

    // Calcula o SAPS total necessário considerando a utilização
    const requiredSaps = Math.ceil(sapsNum / (utilization / 100));
    let candidates: Processor[] = [];

    // Determina a lista de processadores baseado na memória
    if (memNum > 8192) {
      candidates = SAP_PROCESSORS_8;
    } else if (memNum > 4096) {
      candidates = SAP_PROCESSORS_4;
    } else {
      candidates = SAP_PROCESSORS_2;
    }

    // Filtra processadores que atendem o SAPS total necessário (maior ou igual)
    const validCandidates = candidates.filter(cpu => cpu.sapsTotal >= requiredSaps);
    // Ordena por preço (mais barato primeiro)
    validCandidates.sort((a, b) => (a.price * a.sockets) - (b.price * b.sockets));
    
    setQaProcessor(validCandidates.length > 0 ? validCandidates[0] : null);
  };

  const calculateDevProcessor = (sapsValue: string, memoryValue: string) => {
    const sapsNum = Number(sapsValue);
    const memNum = Number(memoryValue);

    if (!sapsNum || !memNum) {
      setDevProcessor(null);
      return;
    }

    // Calcula o SAPS total necessário considerando a utilização
    const requiredSaps = Math.ceil(sapsNum / (utilization / 100));
    let candidates: Processor[] = [];

    // Determina a lista de processadores baseado na memória
    if (memNum > 8192) {
      candidates = SAP_PROCESSORS_8;
    } else if (memNum > 4096) {
      candidates = SAP_PROCESSORS_4;
    } else {
      candidates = SAP_PROCESSORS_2;
    }

    // Filtra processadores que atendem o SAPS total necessário (maior ou igual)
    const validCandidates = candidates.filter(cpu => cpu.sapsTotal >= requiredSaps);
    // Ordena por preço (mais barato primeiro)
    validCandidates.sort((a, b) => (a.price * a.sockets) - (b.price * b.sockets));
    
    setDevProcessor(validCandidates.length > 0 ? validCandidates[0] : null);
  };

  // Nova função para calcular servidores de aplicação
  const calculateAppServers = async (sapsValue: string, memoryValue: string) => {
    try {
      console.log('Iniciando cálculo...');
      const sapsNum = Number(sapsValue);
      const memNum = Number(memoryValue);

      console.log('Valores recebidos:', { sapsNum, memNum });

      if (!sapsNum || !memNum) {
        console.log('Valores inválidos');
        setAppServers([]);
        return;
      }

      // Calcula número de servidores baseado na memória (2TB por servidor)
      // Garante mínimo de 3 servidores (incluindo N+1)
      const minServers = 3;
      const memBasedServers = Math.ceil(memNum / 2048);
      const numServers = Math.max(minServers, memBasedServers);
      console.log('Número de servidores calculado:', numServers);
      
      // Calcula SAPS necessário considerando apenas a utilização
      const requiredSaps = Math.ceil(sapsNum / (utilization / 100));
      // Divide SAPS pelo número de servidores ativos (excluindo N+1)
      const activeServers = numServers - 1;
      const sapsPerServer = Math.ceil(requiredSaps / activeServers);
      console.log('SAPS por servidor:', sapsPerServer);

      // Usa a lista de processadores local
      let candidates: Processor[] = [];
      
      // Determina a lista de processadores baseado na memória
      if (memNum > 8192) {
        candidates = SAP_PROCESSORS_8;
      } else if (memNum > 4096) {
        candidates = SAP_PROCESSORS_4;
      } else {
        candidates = SAP_PROCESSORS_2;
      }

      // Filtra processadores que atendem o SAPS por servidor
      // Considera que cada servidor terá 2 processadores
      const validCandidates = candidates.filter(cpu => (cpu.sapsTotal * 2) >= sapsPerServer);
      console.log('Candidatos válidos:', validCandidates);

      if (validCandidates.length === 0) {
        console.log('Nenhum processador atende aos requisitos');
        setAppServers([]);
        return;
      }

      // Ordena por preço (menor primeiro) e depois por SAPS (maior primeiro)
      validCandidates.sort((a, b) => {
        const priceA = a.price * a.sockets;
        const priceB = b.price * b.sockets;
        if (priceA === priceB) {
          return b.sapsTotal - a.sapsTotal;
        }
        return priceA - priceB;
      });

      const selectedProcessor = validCandidates[0];
      console.log('Processador selecionado:', selectedProcessor);

      // Cria array com o número necessário de servidores
      // Cada servidor terá 2 processadores
      const servers = Array(numServers).fill({
        ...selectedProcessor,
        isNPlusOne: false
      });
      // Marca o último servidor como N+1
      servers[servers.length - 1].isNPlusOne = true;
      
      console.log('Configuração final:', servers);
      setAppServers(servers);

    } catch (error) {
      console.error('Erro no cálculo:', error);
      setAppServers([]);
    }
  };

  // Handlers para Application Sizing
  const handleAppSapsChange = async (value: string) => {
    console.log('SAPS alterado:', value);
    setAppSaps(value);
    if (value && appMemory) {
      await calculateAppServers(value, appMemory);
    }
  };

  const handleAppMemoryChange = async (value: string) => {
    console.log('Memória alterada:', value);
    setAppMemory(value);
    if (value && appSaps) {
      await calculateAppServers(appSaps, value);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 rounded-lg p-6 border border-zinc-700 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Database className="w-6 h-6" />
            SAP HANA Calculator
          </h2>
          <button
            onClick={() => setShowAppSizing(!showAppSizing)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium transition-colors"
          >
            {showAppSizing ? 'Standard Sizing' : 'Application Sizing'}
          </button>
        </div>

        {showAppSizing ? (
          // Nova seção de Application Sizing
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SAPS Required
                </label>
                <Input
                  type="number"
                  value={appSaps}
                  onChange={(e) => handleAppSapsChange(e.target.value)}
                  placeholder="Enter SAPS"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Memory Required (GB)
                </label>
                <Input
                  type="number"
                  value={appMemory}
                  onChange={(e) => handleAppMemoryChange(e.target.value)}
                  placeholder="Enter memory in GB"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                CPU Utilization: {utilization}%
              </label>
              <Slider
                value={[utilization]}
                onValueChange={(value) => handleUtilizationChange(value[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {appServers.length > 0 && (
              <div className="mt-6 space-y-6">
                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Recommended Configuration</h3>
                  <div className="space-y-4">
                    <p className="text-gray-300">
                      Total Servers: <span className="text-white font-medium">{appServers.length}</span>
                    </p>
                    <p className="text-gray-300">
                      Active Servers: <span className="text-white font-medium">{appServers.length - 1}</span>
                    </p>
                    <p className="text-gray-300">
                      N+1 Server: <span className="text-white font-medium">1</span>
                    </p>
                    <p className="text-gray-300">
                      Processors per Server: <span className="text-white font-medium">2</span>
                    </p>
                    <p className="text-gray-300">
                      Processor Model: <span className="text-white font-medium">{appServers[0].model}</span>
                    </p>
                    <p className="text-gray-300">
                      Memory per Server: <span className="text-white font-medium">2048 GB</span>
                    </p>
                    <p className="text-gray-300">
                      SAPS per Server: <span className="text-white font-medium">{appServers[0].sapsTotal.toLocaleString()}</span>
                    </p>
                    <p className="text-gray-300">
                      Total Cost: <span className="text-white font-medium">
                        R$ {(appServers[0].price * appServers.length * 2).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {appServers.map((server, index) => (
                    <div 
                      key={index}
                      className={`bg-zinc-800/50 rounded-lg p-4 border ${
                        server.isNPlusOne 
                          ? 'border-yellow-500 bg-yellow-500/10' 
                          : 'border-zinc-700'
                      }`}
                    >
                      <h4 className="text-lg font-semibold text-white mb-2">
                        {server.isNPlusOne ? 'N+1 Server' : `Server ${index + 1}`}
                      </h4>
                      <div className="space-y-2">
                        <p className="text-gray-300">
                          Processors: <span className="text-white font-medium">2x {server.model}</span>
                        </p>
                        <p className="text-gray-300">
                          Memory: <span className="text-white font-medium">2048 GB</span>
                        </p>
                        <p className="text-gray-300">
                          SAPS: <span className="text-white font-medium">{server.sapsTotal.toLocaleString()}</span>
                        </p>
                        <p className="text-gray-300">
                          Cost: <span className="text-white font-medium">
                            R$ {(server.price * 2).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600">
                <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-green-400" />
                  Produção
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">SAPS</label>
                    <Input
                      type="number"
                      value={saps}
                      onChange={(e) => handleSapsChange(e.target.value)}
                      className="bg-zinc-900/50 border-zinc-600 text-white"
                      placeholder="Digite o SAPS"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Memória (GB)</label>
                    <Input
                      type="number"
                      value={memory}
                      onChange={(e) => handleMemoryChange(e.target.value)}
                      className="bg-zinc-900/50 border-zinc-600 text-white"
                      placeholder="Digite a Memória"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600 mt-4">
                <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-yellow-400" />
                  QA
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">SAPS</label>
                    <Input
                      type="number"
                      value={qaSaps}
                      onChange={(e) => handleQaSapsChange(e.target.value)}
                      className="bg-zinc-900/50 border-zinc-600 text-white"
                      placeholder="Digite o SAPS"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Memória (GB)</label>
                    <Input
                      type="number"
                      value={qaMemory}
                      onChange={(e) => handleQaMemoryChange(e.target.value)}
                      className="bg-zinc-900/50 border-zinc-600 text-white"
                      placeholder="Digite a Memória"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600 mt-4">
                <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-400" />
                  DEV
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">SAPS</label>
                    <Input
                      type="number"
                      value={devSaps}
                      onChange={(e) => handleDevSapsChange(e.target.value)}
                      className="bg-zinc-900/50 border-zinc-600 text-white"
                      placeholder="Digite o SAPS"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Memória (GB)</label>
                    <Input
                      type="number"
                      value={devMemory}
                      onChange={(e) => handleDevMemoryChange(e.target.value)}
                      className="bg-zinc-900/50 border-zinc-600 text-white"
                      placeholder="Digite a Memória"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600 mt-4">
                <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-400" />
                  Utilização
                </h3>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[utilization]}
                    onValueChange={(value) => handleUtilizationChange(value[0])}
                    min={65}
                    max={100}
                    step={1}
                    className="w-48"
                  />
                  <span className="text-white text-sm font-medium">{utilization}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {processor && (
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-green-400" />
                    Resultado Produção
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Processador:</span>
                        <br />
                        <span className="text-white font-medium">{processor.model}</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Cores:</span>
                        <br />
                        <span className="text-white font-medium">{processor.cores}</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Soquetes:</span>
                        <br />
                        <span className="text-white font-medium">{processor.sockets}</span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">SAPS por Soquete:</span>
                        <br />
                        <span className="text-white font-medium">{processor.saps.toLocaleString()}</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">SAPS Total:</span>
                        <br />
                        <span className="text-white font-medium">{processor.sapsTotal.toLocaleString()}</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Preço Total:</span>
                        <br />
                        <span className="text-white font-medium">R$ {(processor.price * processor.sockets).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {qaProcessor && (
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-yellow-400" />
                    Resultado QA
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Processador:</span>
                        <br />
                        <span className="text-white font-medium">{qaProcessor.model}</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Cores:</span>
                        <br />
                        <span className="text-white font-medium">{qaProcessor.cores}</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Soquetes:</span>
                        <br />
                        <span className="text-white font-medium">{qaProcessor.sockets}</span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">SAPS por Soquete:</span>
                        <br />
                        <span className="text-white font-medium">{qaProcessor.saps.toLocaleString()}</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">SAPS Total:</span>
                        <br />
                        <span className="text-white font-medium">{qaProcessor.sapsTotal.toLocaleString()}</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Preço Total:</span>
                        <br />
                        <span className="text-white font-medium">R$ {(qaProcessor.price * qaProcessor.sockets).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {devProcessor && (
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-blue-400" />
                    Resultado DEV
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Processador:</span>
                        <br />
                        <span className="text-white font-medium">{devProcessor.model}</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Cores:</span>
                        <br />
                        <span className="text-white font-medium">{devProcessor.cores}</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Soquetes:</span>
                        <br />
                        <span className="text-white font-medium">{devProcessor.sockets}</span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">SAPS por Soquete:</span>
                        <br />
                        <span className="text-white font-medium">{devProcessor.saps.toLocaleString()}</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">SAPS Total:</span>
                        <br />
                        <span className="text-white font-medium">{devProcessor.sapsTotal.toLocaleString()}</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Preço Total:</span>
                        <br />
                        <span className="text-white font-medium">R$ {(devProcessor.price * devProcessor.sockets).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SapHanaCalculator; 