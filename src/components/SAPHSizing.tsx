import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Cpu, HardDrive, Database, Server, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Atualizar a interface do processador para incluir maxSockets, preço e preço2
interface Processor {
  model: string;
  cores: number;
  clock: number;
  sapsPerCore: number;
  maxMemory: number;
  tdp: number;
  sockets: number;
  sapsTotal: number;
  price?: number;
  price2?: number;
}

// Lista de processadores
const processors: Processor[] = [
  { model: 'Intel Xeon Platinum 8593Q', cores: 64, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 385, sockets: 8, sapsTotal: 2048000, price: 163738.08, price2: 327476.16 },
  { model: 'Intel Xeon Platinum 8592V', cores: 64, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 330, sockets: 8, sapsTotal: 1888000, price: 143040, price2: 286080 },
  { model: 'Intel Xeon Platinum 8592+', cores: 64, clock: 1.9, sapsPerCore: 1520, maxMemory: 4096, tdp: 350, sockets: 8, sapsTotal: 1856000, price: 148000, price2: 296000 },
  { model: 'Intel Xeon Platinum 8581V', cores: 60, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 270, sockets: 8, sapsTotal: 1760000, price: 132000, price2: 264000 },
  { model: 'Intel Xeon Platinum 8580', cores: 60, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 350, sockets: 8, sapsTotal: 1760000, price: 132000, price2: 264000 },
  { model: 'Intel Xeon Platinum 8571N', cores: 52, clock: 2.4, sapsPerCore: 1920, maxMemory: 4096, tdp: 300, sockets: 8, sapsTotal: 1728000, price: 112000, price2: 224000 },
  { model: 'Intel Xeon Platinum 8570', cores: 56, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 350, sockets: 8, sapsTotal: 1728000, price: 132000, price2: 264000 },
  { model: 'Intel Xeon Platinum 8568Y+', cores: 48, clock: 2.3, sapsPerCore: 1840, maxMemory: 4096, tdp: 300, sockets: 8, sapsTotal: 1689600, price: 105600, price2: 211200 },
  { model: 'Intel Xeon Platinum 8568', cores: 48, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 350, sockets: 8, sapsTotal: 1536000, price: 96000, price2: 192000 },
  { model: 'Intel Xeon Platinum 8562Y+', cores: 64, clock: 2.8, sapsPerCore: 2240, maxMemory: 4096, tdp: 300, sockets: 8, sapsTotal: 1433600, price: 89600, price2: 179200 },
  { model: 'Intel Xeon Platinum 8558Q', cores: 48, clock: 2.7, sapsPerCore: 2160, maxMemory: 4096, tdp: 350, sockets: 8, sapsTotal: 1382400, price: 86400, price2: 172800 },
  { model: 'Intel Xeon Platinum 8558U', cores: 48, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 300, sockets: 8, sapsTotal: 1280000, price: 80000, price2: 160000 },
  { model: 'Intel Xeon Platinum 8558', cores: 48, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 330, sockets: 8, sapsTotal: 1344000, price: 84000, price2: 168000 },
  { model: 'Intel Xeon Platinum 8480+', cores: 56, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 350, sockets: 8, sapsTotal: 1576960, price: 98560, price2: 197120 },
  { model: 'Intel Xeon Platinum 8470Q', cores: 52, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 350, sockets: 8, sapsTotal: 1397760, price: 87360, price2: 174720 },
  { model: 'Intel Xeon Platinum 8470', cores: 52, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 350, sockets: 8, sapsTotal: 1331200, price: 83200, price2: 166400 },
  { model: 'Intel Xeon Platinum 8468V', cores: 48, clock: 2.4, sapsPerCore: 1920, maxMemory: 4096, tdp: 330, sockets: 8, sapsTotal: 1474560, price: 92160, price2: 184320 },
  { model: 'Intel Xeon Platinum 8468', cores: 48, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 330, sockets: 8, sapsTotal: 1290240, price: 80640, price2: 161280 },
  { model: 'Intel Xeon Platinum 8461V', cores: 48, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 300, sockets: 8, sapsTotal: 1351680, price: 84480, price2: 168960 },
  { model: 'Intel Xeon Platinum 8460H', cores: 40, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 330, sockets: 8, sapsTotal: 1126400, price: 70400, price2: 140800 },
  { model: 'Intel Xeon Platinum 8454H', cores: 32, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 270, sockets: 8, sapsTotal: 860160, price: 53760, price2: 107520 },
  { model: 'Intel Xeon Platinum 8452Y', cores: 36, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 300, sockets: 8, sapsTotal: 921600, price: 57600, price2: 115200 },
  { model: 'Intel Xeon Platinum 8450H', cores: 28, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 250, sockets: 8, sapsTotal: 716800, price: 44800, price2: 89600 },
  { model: 'Intel Xeon Platinum 8444H', cores: 16, clock: 2.9, sapsPerCore: 2320, maxMemory: 4096, tdp: 270, sockets: 8, sapsTotal: 593920, price: 37120, price2: 74240 },
  { model: 'Intel Xeon Gold 6558Q', cores: 32, clock: 3.2, sapsPerCore: 2560, maxMemory: 4096, tdp: 350, sockets: 8, sapsTotal: 819200, price: 51200, price2: 102400 },
  { model: 'Intel Xeon Gold 6554S', cores: 36, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 270, sockets: 8, sapsTotal: 1013760, price: 63360, price2: 126720 },
  { model: 'Intel Xeon Gold 6544Y', cores: 16, clock: 3.6, sapsPerCore: 2880, maxMemory: 4096, tdp: 270, sockets: 8, sapsTotal: 737280, price: 46080, price2: 92160 },
  { model: 'Intel Xeon Gold 6542Y', cores: 24, clock: 2.9, sapsPerCore: 2320, maxMemory: 4096, tdp: 250, sockets: 8, sapsTotal: 890880, price: 55680, price2: 111360 },
  { model: 'Intel Xeon Gold 6538Y+', cores: 32, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 205, sockets: 8, sapsTotal: 860160, price: 53760, price2: 107520 },
  { model: 'Intel Xeon Gold 6538N', cores: 32, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 205, sockets: 8, sapsTotal: 860160, price: 53760, price2: 107520 },
  { model: 'Intel Xeon Gold 6534', cores: 8, clock: 3.9, sapsPerCore: 3120, maxMemory: 4096, tdp: 195, sockets: 8, sapsTotal: 399360, price: 24960, price2: 49920 },
  { model: 'Intel Xeon Gold 6530', cores: 32, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 270, sockets: 8, sapsTotal: 860160, price: 53760, price2: 107520 },
  { model: 'Intel Xeon Gold 6458Q', cores: 32, clock: 3.1, sapsPerCore: 2480, maxMemory: 4096, tdp: 350, sockets: 8, sapsTotal: 634880, price: 39680, price2: 79360 },
  { model: 'Intel Xeon Gold 6454S', cores: 36, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 270, sockets: 8, sapsTotal: 1013760, price: 63360, price2: 126720 },
  { model: 'Intel Xeon Gold 6448H', cores: 32, clock: 2.4, sapsPerCore: 1920, maxMemory: 4096, tdp: 250, sockets: 8, sapsTotal: 983040, price: 61440, price2: 122880 },
  { model: 'Intel Xeon Gold 6444Y', cores: 16, clock: 3.0, sapsPerCore: 2400, maxMemory: 4096, tdp: 270, sockets: 8, sapsTotal: 614400, price: 38400, price2: 76800 },
  { model: 'Intel Xeon Gold 6442Y', cores: 24, clock: 2.6, sapsPerCore: 2080, maxMemory: 4096, tdp: 225, sockets: 8, sapsTotal: 798720, price: 49920, price2: 99840 },
  { model: 'Intel Xeon Gold 6438M', cores: 32, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 205, sockets: 8, sapsTotal: 901120, price: 56320, price2: 112640 },
  { model: 'Intel Xeon Gold 6438Y+', cores: 32, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 205, sockets: 8, sapsTotal: 819200, price: 51200, price2: 102400 },
  { model: 'Intel Xeon Gold 6434H', cores: 8, clock: 3.7, sapsPerCore: 2960, maxMemory: 4096, tdp: 195, sockets: 8, sapsTotal: 378880, price: 23680, price2: 47360 },
  { model: 'Intel Xeon Gold 6434', cores: 8, clock: 3.7, sapsPerCore: 2960, maxMemory: 4096, tdp: 195, sockets: 8, sapsTotal: 378880, price: 23680, price2: 47360 },
  { model: 'Intel Xeon Gold 6430', cores: 32, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 270, sockets: 8, sapsTotal: 860160, price: 53760, price2: 107520 },
  { model: 'Intel Xeon Gold 6428N', cores: 32, clock: 1.8, sapsPerCore: 1440, maxMemory: 4096, tdp: 185, sockets: 8, sapsTotal: 737280, price: 46080, price2: 92160 },
  { model: 'Intel Xeon Gold 6426Y', cores: 16, clock: 2.5, sapsPerCore: 2000, maxMemory: 4096, tdp: 185, sockets: 8, sapsTotal: 512000, price: 32000, price2: 64000 },
  { model: 'Intel Xeon Gold 6424N', cores: 32, clock: 1.8, sapsPerCore: 1440, maxMemory: 4096, tdp: 185, sockets: 8, sapsTotal: 737280, price: 46080, price2: 92160 },
  { model: 'Intel Xeon Gold 5520+', cores: 28, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 205, sockets: 8, sapsTotal: 788480, price: 49280, price2: 98560 },
  { model: 'Intel Xeon Gold 5420+', cores: 28, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 205, sockets: 8, sapsTotal: 716800, price: 44800, price2: 89600 },
  { model: 'Intel Xeon Gold 5418Y', cores: 24, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 185, sockets: 8, sapsTotal: 614400, price: 38400, price2: 76800 },
  { model: 'Intel Xeon Gold 5418N', cores: 24, clock: 1.8, sapsPerCore: 1440, maxMemory: 4096, tdp: 165, sockets: 8, sapsTotal: 552960, price: 34560, price2: 69120 },
  { model: 'Intel Xeon Gold 5416S', cores: 16, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 150, sockets: 8, sapsTotal: 409600, price: 25600, price2: 51200 },
  { model: 'Intel Xeon Gold 5415+', cores: 8, clock: 2.9, sapsPerCore: 2320, maxMemory: 4096, tdp: 150, sockets: 8, sapsTotal: 296960, price: 18560, price2: 37120 },
  { model: 'Intel Xeon Gold 5412U', cores: 24, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 185, sockets: 8, sapsTotal: 645120, price: 40320, price2: 80640 },
  { model: 'Intel Xeon Gold 5411N', cores: 24, clock: 1.9, sapsPerCore: 1520, maxMemory: 4096, tdp: 165, sockets: 8, sapsTotal: 583680, price: 36480, price2: 72960 },
  { model: 'Intel Xeon Bronze 3408U', cores: 8, clock: 1.8, sapsPerCore: 1440, maxMemory: 4096, tdp: 125, sockets: 8, sapsTotal: 184320, price: 11520, price2: 23040 },
  { model: 'Intel Xeon Silver 4509Y', cores: 8, clock: 2.6, sapsPerCore: 2080, maxMemory: 4096, tdp: 125, sockets: 8, sapsTotal: 266240, price: 16640, price2: 33280 }
];

interface Inputs {
  prodMemory: number;
  prodSaps: number;
  qaMemory: number;
  qaSaps: number;
  devMemory: number;
  devSaps: number;
  appMemory: number;
  appSaps: number;
  utilization: number;
}

interface Results {
  production: Processor | null;
  qa: Processor | null;
  dev: Processor | null;
  applications: Processor | null;
}

function SAPSizing() {
  const [inputs, setInputs] = useState<Inputs>({
    prodMemory: 1024,
    prodSaps: 20000,
    qaMemory: 512,
    qaSaps: 10000,
    devMemory: 256,
    devSaps: 5000,
    appMemory: 128,
    appSaps: 2000,
    utilization: 65,
  });

  const [results, setResults] = useState<Results>({
    production: null,
    qa: null,
    dev: null,
    applications: null,
  });

  const handleInputChange = (field: string, value: string | number) => {
    setInputs(prev => {
      const newInputs = { ...prev, [field]: Number(value) };

      // Só calcula resultados se houver pelo menos um valor de entrada
      const hasProd = newInputs.prodSaps > 0 || newInputs.prodMemory > 0;
      const hasQa = newInputs.qaSaps > 0 || newInputs.qaMemory > 0;
      const hasDev = newInputs.devSaps > 0 || newInputs.devMemory > 0;
      const hasApp = newInputs.appSaps > 0 || newInputs.appMemory > 0;

      if (hasProd || hasQa || hasDev || hasApp) {
        const prod = hasProd ? calculateSizingBySAPS(newInputs.prodSaps, newInputs.prodMemory, processors) : null;
        const app = hasApp ? calculateSizingBySAPS(newInputs.appSaps, newInputs.appMemory, processors) : null;

        if (combineQaDev) {
          const qaDevMemory = newInputs.qaMemory + newInputs.devMemory;
          const qaDevSaps = newInputs.qaSaps + newInputs.devSaps;
          const qaDev = (hasQa || hasDev) ? calculateSizingBySAPS(qaDevSaps, qaDevMemory, processors) : null;
          setResults({
            production: prod,
            qa: qaDev,
            dev: qaDev,
            applications: app
          });
        } else {
          const qa = hasQa ? calculateSizingBySAPS(newInputs.qaSaps, newInputs.qaMemory, processors) : null;
          const dev = hasDev ? calculateSizingBySAPS(newInputs.devSaps, newInputs.devMemory, processors) : null;
          setResults({
            production: prod,
            qa,
            dev,
            applications: app
          });
        }
      } else {
        setResults(null);
      }
      return newInputs;
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 rounded-lg p-6 border border-zinc-700 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
          <Database className="w-6 h-6 text-blue-400" />
          SAP HANA Sizing
        </h2>

        <Tabs defaultValue="appliance" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="appliance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Appliance</TabsTrigger>
            <TabsTrigger value="tdi" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">TDI</TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="appliance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Inputs */}
              <div className="space-y-6">
                {/* Production Environment */}
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600 shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-green-400" />
                    Production
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">SAPS</label>
                      <Input
                        type="number"
                        value={inputs.prodSaps}
                        onChange={(e) => handleInputChange('prodSaps', e.target.value)}
                        className="bg-zinc-900/50 border-zinc-600 text-white focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter SAPS"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Memory (GB)</label>
                      <Input
                        type="number"
                        value={inputs.prodMemory}
                        onChange={(e) => handleInputChange('prodMemory', e.target.value)}
                        className="bg-zinc-900/50 border-zinc-600 text-white focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter Memory"
                      />
                    </div>
                  </div>
                </div>

                {/* QA Environment */}
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600 shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-yellow-400" />
                    QA
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">SAPS</label>
                      <Input
                        type="number"
                        value={inputs.qaSaps}
                        onChange={(e) => handleInputChange('qaSaps', e.target.value)}
                        className="bg-zinc-900/50 border-zinc-600 text-white focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter SAPS"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Memory (GB)</label>
                      <Input
                        type="number"
                        value={inputs.qaMemory}
                        onChange={(e) => handleInputChange('qaMemory', e.target.value)}
                        className="bg-zinc-900/50 border-zinc-600 text-white focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter Memory"
                      />
                    </div>
                  </div>
                </div>

                {/* DEV Environment */}
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600 shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-purple-400" />
                    DEV
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">SAPS</label>
                      <Input
                        type="number"
                        value={inputs.devSaps}
                        onChange={(e) => handleInputChange('devSaps', e.target.value)}
                        className="bg-zinc-900/50 border-zinc-600 text-white focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter SAPS"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Memory (GB)</label>
                      <Input
                        type="number"
                        value={inputs.devMemory}
                        onChange={(e) => handleInputChange('devMemory', e.target.value)}
                        className="bg-zinc-900/50 border-zinc-600 text-white focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter Memory"
                      />
                    </div>
                  </div>
                </div>

                {/* Applications Environment */}
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600 shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-red-400" />
                    Applications
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">SAPS</label>
                      <Input
                        type="number"
                        value={inputs.appSaps}
                        onChange={(e) => handleInputChange('appSaps', e.target.value)}
                        className="bg-zinc-900/50 border-zinc-600 text-white focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter SAPS"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Memory (GB)</label>
                      <Input
                        type="number"
                        value={inputs.appMemory}
                        onChange={(e) => handleInputChange('appMemory', e.target.value)}
                        className="bg-zinc-900/50 border-zinc-600 text-white focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter Memory"
                      />
                    </div>
                  </div>
                </div>

                {/* QA/DEV Combine Switch */}
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600 shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-yellow-400" />
                    Combine QA/DEV
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={combineQaDev ? "default" : "outline"}
                      onClick={() => {
                        setCombineQaDev(!combineQaDev);
                        // Recalcular resultados quando o estado mudar
                        handleInputChange('utilization', inputs.utilization);
                      }}
                      className={`${combineQaDev ? 'bg-blue-600 hover:bg-blue-700' : 'bg-zinc-700 hover:bg-zinc-600'} text-white`}
                    >
                      {combineQaDev ? 'Combinado' : 'Separado'}
                    </Button>
                    <span className="text-zinc-300 text-sm">
                      {combineQaDev ? 'QA e DEV compartilharão o mesmo hardware' : 'QA e DEV terão hardwares separados'}
                    </span>
                  </div>
                </div>

                {/* Utilization Slider */}
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600 shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-blue-400" />
                    Utilization
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[inputs.utilization]}
                        onValueChange={(value) => handleInputChange('utilization', value[0])}
                        min={1}
                        max={100}
                        step={1}
                        className="w-48"
                      />
                      <span className="text-white text-sm font-medium">{inputs.utilization}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Results */}
              <div className="space-y-6">
                {/* Production Results */}
                {results?.production && (() => {
                  const prod = results.production;
                  return (
                    <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600 shadow-lg hover:shadow-xl transition-shadow">
                      <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <Server className="w-5 h-5 text-green-400" />
                        Production Results
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Processor:</span>
                            <br />
                            <span className="text-white font-medium">{prod.processor.model || '-'}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Cores:</span>
                            <br />
                            <span className="text-white font-medium">{prod.processor.cores}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Sockets:</span>
                            <br />
                            <span className="text-white font-medium">{prod.processor.sockets}</span>
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">SAPS:</span>
                            <br />
                            <span className="text-white font-medium">{prod.processor.sapsTotal.toLocaleString() || '-'}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Memory:</span>
                            <br />
                            <span className="text-white font-medium">{prod.processor.maxMemory / 1024 || '-'} GB</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">TDP:</span>
                            <br />
                            <span className="text-white font-medium">{prod.processor.tdp || '-'}W</span>
                          </p>
                        </div>
                        <p className="text-zinc-300">
                          <span className="text-zinc-400">Preço 2 CPUs:</span>
                          <br />
                          <span className="text-white font-medium">{prod.processor.price2 ? `R$ ${prod.processor.price2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</span>
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* QA Results */}
                {results?.qa && (() => {
                  const qa = results.qa;
                  return (
                    <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600 shadow-lg hover:shadow-xl transition-shadow">
                      <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <Server className="w-5 h-5 text-yellow-400" />
                        {combineQaDev ? 'QA/DEV Results' : 'QA Results'}
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Processor:</span>
                            <br />
                            <span className="text-white font-medium">{qa.processor.model || '-'}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Cores:</span>
                            <br />
                            <span className="text-white font-medium">{qa.processor.cores}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Sockets:</span>
                            <br />
                            <span className="text-white font-medium">{qa.processor.sockets}</span>
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">SAPS:</span>
                            <br />
                            <span className="text-white font-medium">{qa.processor.sapsTotal.toLocaleString() || '-'}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Memory:</span>
                            <br />
                            <span className="text-white font-medium">{qa.processor.maxMemory / 1024 || '-'} GB</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">TDP:</span>
                            <br />
                            <span className="text-white font-medium">{qa.processor.tdp || '-'}W</span>
                          </p>
                        </div>
                        <p className="text-zinc-300">
                          <span className="text-zinc-400">Preço 2 CPUs:</span>
                          <br />
                          <span className="text-white font-medium">{qa.processor.price2 ? `R$ ${qa.processor.price2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</span>
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* DEV Results - Só mostra se não estiver combinado */}
                {!combineQaDev && results?.dev && (() => {
                  const dev = results.dev;
                  return (
                    <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600 shadow-lg hover:shadow-xl transition-shadow">
                      <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <Server className="w-5 h-5 text-purple-400" />
                        DEV Results
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Processor:</span>
                            <br />
                            <span className="text-white font-medium">{dev.processor.model || '-'}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Cores:</span>
                            <br />
                            <span className="text-white font-medium">{dev.processor.cores}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Sockets:</span>
                            <br />
                            <span className="text-white font-medium">{dev.processor.sockets}</span>
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">SAPS:</span>
                            <br />
                            <span className="text-white font-medium">{dev.processor.sapsTotal.toLocaleString() || '-'}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Memory:</span>
                            <br />
                            <span className="text-white font-medium">{dev.processor.maxMemory / 1024 || '-'} GB</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">TDP:</span>
                            <br />
                            <span className="text-white font-medium">{dev.processor.tdp || '-'}W</span>
                          </p>
                        </div>
                        <p className="text-zinc-300">
                          <span className="text-zinc-400">Preço 2 CPUs:</span>
                          <br />
                          <span className="text-white font-medium">{dev.processor.price2 ? `R$ ${dev.processor.price2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</span>
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Applications Results */}
                {results?.applications && (() => {
                  const app = results.applications;
                  return (
                    <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600 shadow-lg hover:shadow-xl transition-shadow">
                      <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <Server className="w-5 h-5 text-red-400" />
                        Applications Results
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Processor:</span>
                            <br />
                            <span className="text-white font-medium">{app.processor.model || '-'}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Cores:</span>
                            <br />
                            <span className="text-white font-medium">{app.processor.cores}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Sockets:</span>
                            <br />
                            <span className="text-white font-medium">{app.processor.sockets}</span>
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">SAPS:</span>
                            <br />
                            <span className="text-white font-medium">{app.processor.sapsTotal.toLocaleString() || '-'}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Memory:</span>
                            <br />
                            <span className="text-white font-medium">{app.processor.maxMemory / 1024 || '-'} GB</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">TDP:</span>
                            <br />
                            <span className="text-white font-medium">{app.processor.tdp || '-'}W</span>
                          </p>
                        </div>
                        <p className="text-zinc-300">
                          <span className="text-zinc-400">Preço 2 CPUs:</span>
                          <br />
                          <span className="text-white font-medium">{app.processor.price2 ? `R$ ${app.processor.price2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</span>
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tdi">
            <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-8 border border-zinc-600 shadow-lg text-center">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center justify-center gap-2">
                <Database className="w-6 h-6 text-blue-400" />
                TDI Sizing
              </h3>
              <p className="text-zinc-400">Em construção</p>
            </div>
          </TabsContent>

          <TabsContent value="applications">
            <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-8 border border-zinc-600 shadow-lg text-center">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center justify-center gap-2">
                <Database className="w-6 h-6 text-blue-400" />
                Applications Sizing
              </h3>
              <p className="text-zinc-400">Em construção</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default SAPSizing; 