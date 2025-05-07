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

// Lista de processadores com suas características
const processors = [
  {
    model: "Intel Xeon Platinum 8490H",
    cores: 60,
    clock: 1.9,
    sapsPerCore: 1670,
    maxMemory: 4096,
  },
  {
    model: "Intel Xeon Platinum 8480+",
    cores: 56,
    clock: 2.0,
    sapsPerCore: 1600,
    maxMemory: 4096,
  },
  {
    model: "Intel Xeon Platinum 8468",
    cores: 48,
    clock: 2.1,
    sapsPerCore: 1580,
    maxMemory: 4096,
  },
  {
    model: "Intel Xeon Platinum 8452Y",
    cores: 36,
    clock: 2.0,
    sapsPerCore: 1520,
    maxMemory: 4096,
  },
  {
    model: "Intel Xeon Platinum 8460Y",
    cores: 40,
    clock: 2.0,
    sapsPerCore: 1550,
    maxMemory: 4096,
  },
];

function getMaxMemoryBySockets(sockets: number) {
  if (sockets <= 2) return 4096;
  if (sockets <= 4) return 8192;
  return 16384;
}

function SAPSizing() {
  const [inputs, setInputs] = useState({
    prodMemory: 0,
    prodSaps: 0,
    qaMemory: 0,
    qaSaps: 0,
    devMemory: 0,
    devSaps: 0,
    utilization: 65,
  });
  const [results, setResults] = useState<any | null>(null);

  const handleChange = (field: string, value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handleCalculate = () => {
    const totalMemory = inputs.prodMemory + inputs.qaMemory + inputs.devMemory;
    const totalSaps = inputs.prodSaps + inputs.qaSaps + inputs.devSaps;
    const adjustedSaps = totalSaps / (inputs.utilization / 100);

    const options = processors.map((cpu) => {
      const sapsPerSocket = cpu.cores * cpu.sapsPerCore;
      let totalSockets = Math.ceil(adjustedSaps / sapsPerSocket);
      const maxMemory = getMaxMemoryBySockets(totalSockets);

      while (totalMemory > maxMemory) {
        totalSockets++;
      }

      const memoryPerSocket = totalMemory / totalSockets;
      const totalSapsAvailable = totalSockets * sapsPerSocket;
      const utilizationAchieved = (totalSaps / totalSapsAvailable) * 100;

      return {
        model: cpu.model,
        totalSockets,
        totalSapsAvailable,
        utilizationAchieved,
        memory: totalMemory,
        memoryPerSocket,
      };
    });

    const bestFit = options.reduce((prev, curr) =>
      Math.abs(curr.utilizationAchieved - 100) < Math.abs(prev.utilizationAchieved - 100)
        ? curr
        : prev
    );

    setResults({ options, bestFit });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white text-zinc-900 rounded-2xl shadow-xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Cpu className="text-blue-500" /> Sizing SAP HANA
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Memória Produção (GB)</label>
          <Input type="number" value={inputs.prodMemory} onChange={(e) => handleChange("prodMemory", Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">SAPS Produção</label>
          <Input type="number" value={inputs.prodSaps} onChange={(e) => handleChange("prodSaps", Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Memória QA (GB)</label>
          <Input type="number" value={inputs.qaMemory} onChange={(e) => handleChange("qaMemory", Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">SAPS QA</label>
          <Input type="number" value={inputs.qaSaps} onChange={(e) => handleChange("qaSaps", Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Memória DEV (GB)</label>
          <Input type="number" value={inputs.devMemory} onChange={(e) => handleChange("devMemory", Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">SAPS DEV</label>
          <Input type="number" value={inputs.devSaps} onChange={(e) => handleChange("devSaps", Number(e.target.value))} />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Utilização Desejada (%)</label>
        <Slider
          value={[inputs.utilization]}
          onValueChange={(v) => handleChange("utilization", v[0])}
          min={65}
          max={100}
          step={1}
        />
        <div className="text-center text-sm mt-1">{inputs.utilization}%</div>
      </div>

      <Button className="mt-4 w-full" onClick={handleCalculate}>
        Calcular
      </Button>

      {results && results.bestFit && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Melhor Opção Sugerida</h2>
          <div className="p-4 rounded-xl border bg-zinc-50">
            <p><strong>Modelo:</strong> {results.bestFit.model}</p>
            <p><strong>Total de Sockets:</strong> {results.bestFit.totalSockets}</p>
            <p><strong>Memória por Socket:</strong> {results.bestFit.memoryPerSocket.toFixed(1)} GB</p>
            <p><strong>SAPS Disponíveis:</strong> {results.bestFit.totalSapsAvailable}</p>
            <p><strong>Utilização:</strong> {results.bestFit.utilizationAchieved.toFixed(1)}%</p>
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-2">Comparativo de Opções</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={results.options} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="model" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="utilizationAchieved" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default SAPSizing; 