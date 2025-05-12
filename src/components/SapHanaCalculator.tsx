import React, { useState } from 'react';

interface Processor {
  model: string;
  cores: number;
  saps: number;
  sockets: number;
  price: number;
  sapsTotal: number;
}

interface SapHanaConfig {
  requiredSaps: number;
  requiredMemory: number;
  selectedProcessor: Processor | null;
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
  const [config, setConfig] = useState<SapHanaConfig>({
    requiredSaps: 0,
    requiredMemory: 0,
    selectedProcessor: null
  });

  const calculateRequiredSaps = (baseSaps: number) => {
    // Ajuste para 65% de utilização
    return Math.ceil(baseSaps / 0.65);
  };

  // Função para selecionar o processador mais econômico que atenda ao SAPS e memória
  function selectProcessor(requiredSaps: number, requiredMemory: number) {
    let allCandidates;
    if (requiredMemory > 4096) {
      // Acima de 4TB, só 4 ou 8 soquetes
      allCandidates = [
        ...SAP_PROCESSORS_4,
        ...SAP_PROCESSORS_8,
      ];
    } else {
      allCandidates = [
        ...SAP_PROCESSORS_2,
        ...SAP_PROCESSORS_4,
        ...SAP_PROCESSORS_8,
      ];
    }
    // Filtra os que atendem ao SAPS total
    const candidates = allCandidates.filter(cpu => cpu.sapsTotal >= requiredSaps);
    // Ordena pelo menor preço total (unitário * sockets)
    candidates.sort((a, b) => (a.price * a.sockets) - (b.price * b.sockets));
    return candidates.length > 0 ? candidates[0] : null;
  }

  const handleSapsChange = (value: number) => {
    const adjustedSaps = calculateRequiredSaps(value);
    const processor = selectProcessor(adjustedSaps, config.requiredMemory);
    setConfig({
      requiredSaps: value,
      requiredMemory: config.requiredMemory,
      selectedProcessor: processor
    });
  };

  const handleMemoryChange = (value: number) => {
    setConfig({
      ...config,
      requiredMemory: value
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-slate-700/50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">SAP HANA Sizing</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              SAPS Requeridos
            </label>
            <input
              type="number"
              value={config.requiredSaps}
              onChange={(e) => handleSapsChange(Number(e.target.value))}
              className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white"
              placeholder="Digite os SAPS requeridos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Memória Requerida (GB)
            </label>
            <input
              type="number"
              value={config.requiredMemory}
              onChange={(e) => handleMemoryChange(Number(e.target.value))}
              className="w-full p-2 border border-slate-600 rounded bg-slate-700 text-white"
              placeholder="Digite a memória requerida em GB"
            />
          </div>
        </div>

        {config.selectedProcessor && (
          <div className="mt-6 bg-slate-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-3">Processador Selecionado</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-300">Modelo: {config.selectedProcessor.model}</p>
                <p className="text-slate-300">Cores: {config.selectedProcessor.cores}</p>
                <p className="text-slate-300">SAPS por Socket: {config.selectedProcessor.saps.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-300">Sockets: {config.selectedProcessor.sockets}</p>
                <p className="text-slate-300">SAPS Total: {(config.selectedProcessor.saps * config.selectedProcessor.sockets).toLocaleString()}</p>
                <p className="text-slate-300">Preço Total: R$ {(config.selectedProcessor.price * config.selectedProcessor.sockets).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SapHanaCalculator; 