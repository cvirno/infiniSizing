import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Cpu } from "lucide-react";

// Lista completa de processadores Intel Xeon 4ª e 5ª geração
const processors = [
  { model: "Intel Xeon Platinum 8490H", cores: 60, clock: 1.9, sapsPerCore: 1670, maxMemory: 4096 },
  { model: "Intel Xeon Platinum 8480+", cores: 56, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096 },
  { model: "Intel Xeon Platinum 8468", cores: 48, clock: 2.1, sapsPerCore: 1580, maxMemory: 4096 },
  { model: "Intel Xeon Platinum 8460Y", cores: 40, clock: 2.0, sapsPerCore: 1550, maxMemory: 4096 },
  { model: "Intel Xeon Platinum 8452Y", cores: 36, clock: 2.0, sapsPerCore: 1520, maxMemory: 4096 },
  { model: "Intel Xeon Platinum 8444H", cores: 24, clock: 2.1, sapsPerCore: 1450, maxMemory: 4096 },
  { model: "Intel Xeon Platinum 8426H", cores: 20, clock: 2.2, sapsPerCore: 1400, maxMemory: 4096 }
];

function getMaxMemoryBySockets(sockets: number) {
  if (sockets <= 2) return 4096;
  if (sockets <= 4) return 8192;
  return 16384;
}

function calculateSizing(memory: number, saps: number, utilization: number) {
  const adjustedSaps = saps / (utilization / 100);

  const validOptions = processors.map(cpu => {
    const sapsPerSocket = cpu.cores * cpu.sapsPerCore;
    let sockets = Math.ceil(adjustedSaps / sapsPerSocket);
    while (memory > getMaxMemoryBySockets(sockets)) {
      sockets++;
    }
    return {
      model: cpu.model,
      sockets,
      totalSaps: sockets * sapsPerSocket,
      memoryPerSocket: memory / sockets,
      utilizationAchieved: (saps / (sockets * sapsPerSocket)) * 100,
      cpu
    };
  }).filter(opt => opt.memoryPerSocket <= opt.cpu.maxMemory);

  return validOptions.sort((a, b) => a.cpu.cores - b.cpu.cores)[0];
}

function SAPSizing() {
  const [inputs, setInputs] = useState({
    prodMemory: 0,
    prodSaps: 0,
    qaMemory: 0,
    qaSaps: 0,
    devMemory: 0,
    devSaps: 0,
    appMemory: 0,
    appSaps: 0,
    utilization: 65
  });

  const [results, setResults] = useState<any | null>(null);

  const handleChange = (field: string, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = () => {
    const qaDevMemory = inputs.qaMemory + inputs.devMemory;
    const qaDevSaps = inputs.qaSaps + inputs.devSaps;

    const prod = calculateSizing(inputs.prodMemory, inputs.prodSaps, inputs.utilization);
    const qaDev = calculateSizing(qaDevMemory, qaDevSaps, inputs.utilization);
    const app = calculateSizing(inputs.appMemory, inputs.appSaps, inputs.utilization);

    setResults({ prod, qaDev, app });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-zinc-900 text-white rounded-2xl shadow-xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Cpu className="text-blue-400" /> Sizing SAP HANA
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {["Produção", "QA", "DEV", "Aplicações"].map((env, idx) => (
          <React.Fragment key={env}>
            <div>
              <label className="block text-sm font-medium mb-1">Memória {env} (GB)</label>
              <Input type="number" className="text-black" value={inputs[["prod", "qa", "dev", "app"][idx] + "Memory"]} onChange={e => handleChange(["prod", "qa", "dev", "app"][idx] + "Memory", Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SAPS {env}</label>
              <Input type="number" className="text-black" value={inputs[["prod", "qa", "dev", "app"][idx] + "Saps"]} onChange={e => handleChange(["prod", "qa", "dev", "app"][idx] + "Saps", Number(e.target.value))} />
            </div>
          </React.Fragment>
        ))}

        <div className="col-span-3">
          <label className="block text-sm font-medium mb-1">Utilização (%)</label>
          <Slider value={[inputs.utilization]} onValueChange={v => handleChange("utilization", v[0])} min={65} max={100} step={1} />
          <div className="text-center text-sm mt-1">{inputs.utilization}%</div>
        </div>
      </div>

      <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700" onClick={handleCalculate}>
        Calcular
      </Button>

      {results && (
        <div className="mt-8 space-y-6">
          {["Produção", "QA + DEV", "Aplicações"].map((label, idx) => {
            const key = ["prod", "qaDev", "app"][idx];
            const item = results[key];
            return (
              <div key={key} className="bg-zinc-800 p-4 rounded-xl">
                <h2 className="text-lg font-semibold mb-2">Servidor para {label}</h2>
                <p><strong>Modelo:</strong> {item.model}</p>
                <p><strong>Total de Sockets:</strong> {item.sockets}</p>
                <p><strong>Memória por Socket:</strong> {item.memoryPerSocket.toFixed(1)} GB</p>
                <p><strong>SAPS Disponíveis:</strong> {item.totalSaps}</p>
                <p><strong>Utilização Estimada:</strong> {item.utilizationAchieved.toFixed(1)}%</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SAPSizing; 