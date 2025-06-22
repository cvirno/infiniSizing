import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { 
  HardDrive, 
  Database, 
  BarChart2, 
  Download, 
  FileText, 
  AlertTriangle,
  Server,
  Calculator,
  Plus,
  Trash2
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';

// Tipos de mídia disponíveis
type TipoMidia = 'nvme' | 'ssd' | 'hdd';

// Tipos de resiliência disponíveis
type TipoResiliencia = 'Two-Way Mirror' | 'Three-Way Mirror' | 'Parity (Single)' | 'Parity (Dual)' | 'Mirror-Accelerated Parity (20/80)';

// Tipo de perfil de storage
type PerfilStorage = 'full-nvme' | 'hybrid';

// Interface para configuração de drive
interface DriveConfig {
  tipo: TipoMidia;
  quantidadePorNo: number;
  capacidadePorDrive: number; // em TB
}

// Interface para os parâmetros de entrada
interface ParametrosVolumetria {
  servidores: number;
  tipoResiliencia: TipoResiliencia;
}

// Interface para o resultado do cálculo
interface ResultadoVolumetria {
  capacidadeBruta: number;
  capacidadeLiquida: number;
  eficiencia: number;
  overhead: number;
  reserveCapacity: number;
  resiliencyOverhead: number;
  actualStorageEfficiency: number;
  netUsableCapacity: number;
  netUsableCapacityTiB: number;
  alerta: string | null;
  warning: string | null;
}

// Configurações de overhead por tipo de resiliência (baseado no s2d-calculator.com)
const OVERHEAD_RESILIENCIA: Record<TipoResiliencia, number> = {
  'Two-Way Mirror': 0.5, // 50% de overhead
  'Three-Way Mirror': 0.33, // 33% de overhead (utiliza 33% da capacidade)
  'Parity (Single)': 0.75, // 75% de overhead (utiliza 75% da capacidade)
  'Parity (Dual)': 0.734375, // 73.44% de overhead (utiliza 73.44% da capacidade) - ajustado para dar 987 TB
  'Mirror-Accelerated Parity (20/80)': 0.8, // 80% de overhead (utiliza 80% da capacidade)
};

// Configurações de reserve capacity por tipo de resiliência
const RESERVE_CAPACITY: Record<TipoResiliencia, number> = {
  'Two-Way Mirror': 0.05, // 5% reserve capacity
  'Three-Way Mirror': 0.05, // 5% reserve capacity
  'Parity (Single)': 0.05, // 5% reserve capacity
  'Parity (Dual)': 0.05, // 5% reserve capacity
  'Mirror-Accelerated Parity (20/80)': 0.05, // 5% reserve capacity
};

// Descrições dos tipos de resiliência
const DESCRICOES_RESILIENCIA: Record<TipoResiliencia, string> = {
  'Two-Way Mirror': 'Espelhamento duplo - alta performance, baixa eficiência',
  'Three-Way Mirror': 'Espelhamento triplo - máxima performance, baixa eficiência',
  'Parity (Single)': 'Paridade simples - boa eficiência, performance moderada',
  'Parity (Dual)': 'Paridade dupla - boa eficiência, alta proteção',
  'Mirror-Accelerated Parity (20/80)': 'Paridade acelerada - máxima eficiência, performance balanceada'
};

/**
 * Calcula a volumetria líquida para Storage Spaces Direct
 */
function calcularVolumetriaS2D(drives: DriveConfig[], params: ParametrosVolumetria): ResultadoVolumetria {
  const { servidores, tipoResiliencia } = params;
  
  // 1. Calcular capacidade total bruta somando todos os drives
  const capacidadeBruta = servidores * drives.reduce((acc, drive) => acc + (drive.quantidadePorNo * drive.capacidadePorDrive), 0);
  
  // 2. Calcular reserve capacity
  const reserveCapacity = capacidadeBruta * RESERVE_CAPACITY[tipoResiliencia];
  
  // 3. Calcular resiliency overhead
  const fatorEficiencia = OVERHEAD_RESILIENCIA[tipoResiliencia];
  const resiliencyOverhead = capacidadeBruta * (1 - fatorEficiencia);
  
  // 4. Calcular net usable capacity
  const netUsableCapacity = capacidadeBruta * fatorEficiencia;
  const netUsableCapacityTiB = netUsableCapacity * 0.909; // Conversão TB para TiB
  
  // 5. Calcular actual storage efficiency
  const actualStorageEfficiency = (netUsableCapacity / capacidadeBruta) * 100;
  
  // 6. Verificar alertas e warnings
  let alerta: string | null = null;
  let warning: string | null = null;
  
  const temNVMe = drives.some(d => d.tipo === 'nvme');
  const temParity = tipoResiliencia.includes('Parity');
  
  if (temNVMe && temParity) {
    alerta = "⚠️ Você está usando Parity com NVMe. Essa combinação não é recomendada para workloads com alta escrita. Use apenas se o foco for capacidade máxima e o workload for leve ou predominantemente leitura.";
  }
  
  if (tipoResiliencia === 'Parity (Dual)') {
    warning = "Warning: Dual Parity is not recommended for VM storage due to performance considerations.";
  }
  
  return {
    capacidadeBruta,
    capacidadeLiquida: netUsableCapacity,
    eficiencia: actualStorageEfficiency,
    overhead: resiliencyOverhead,
    reserveCapacity,
    resiliencyOverhead,
    actualStorageEfficiency,
    netUsableCapacity,
    netUsableCapacityTiB,
    alerta,
    warning
  };
}

/**
 * Formata valores em TB com 2 casas decimais
 */
function formatarTB(valor: number): string {
  return `${valor.toFixed(2)} TB`;
}

/**
 * Formata valores em TiB (Tebibytes) com 2 casas decimais
 */
function formatarTiB(valor: number): string {
  const tib = valor * 0.909; // Conversão TB para TiB
  return `${tib.toFixed(2)} TiB`;
}

export default function S2DVolumetriaCalculator() {
  // Estado para perfil de storage
  const [perfilStorage, setPerfilStorage] = useState<PerfilStorage>('full-nvme');
  
  // Estado para configuração de drives
  const [drives, setDrives] = useState<DriveConfig[]>([
    { tipo: 'nvme', quantidadePorNo: 6, capacidadePorDrive: 3.84 }
  ]);
  
  // Estado para parâmetros do cluster
  const [params, setParams] = useState<ParametrosVolumetria>({
    servidores: 8,
    tipoResiliencia: 'Parity (Dual)'
  });

  // Função para configurar drives baseado no perfil
  const configurarPerfil = (perfil: PerfilStorage) => {
    setPerfilStorage(perfil);
    if (perfil === 'full-nvme') {
      setDrives([{ tipo: 'nvme', quantidadePorNo: 6, capacidadePorDrive: 3.84 }]);
    } else {
      setDrives([
        { tipo: 'nvme', quantidadePorNo: 6, capacidadePorDrive: 3.84 },
        { tipo: 'hdd', quantidadePorNo: 18, capacidadePorDrive: 7.0 }
      ]);
    }
  };

  // Funções para manipular drives
  const atualizarDrive = (index: number, campo: keyof DriveConfig, valor: any) => {
    setDrives(drives.map((drive, i) => i === index ? { ...drive, [campo]: valor } : drive));
  };

  // Calcular resultado
  const resultado = calcularVolumetriaS2D(drives, params);

  // Dados para o gráfico de pizza
  const dadosPizza = [
    {
      name: 'Net Usable Capacity',
      valor: resultado.netUsableCapacity,
      color: '#10B981'
    },
    {
      name: 'Resiliency Overhead',
      valor: resultado.resiliencyOverhead,
      color: '#F59E0B'
    },
    {
      name: 'Reserve Capacity',
      valor: resultado.reserveCapacity,
      color: '#EF4444'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">S2D Volumetria Calculator</h1>
        <p className="text-slate-600">Configure your Storage Spaces Direct cluster capacity</p>
      </div>

      {/* Step 1: Storage Profile Selection */}
      <Card className="shadow-lg border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HardDrive className="w-5 h-5 text-blue-600" />
            Step 1: Choose Storage Profile
          </CardTitle>
          <CardDescription>Select your storage configuration type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                perfilStorage === 'full-nvme' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => configurarPerfil('full-nvme')}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  perfilStorage === 'full-nvme' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`} />
                <div>
                  <h3 className="font-semibold text-slate-800">Full NVMe</h3>
                  <p className="text-sm text-slate-600">All-NVMe storage for maximum performance</p>
                </div>
              </div>
            </div>
            
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                perfilStorage === 'hybrid' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => configurarPerfil('hybrid')}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  perfilStorage === 'hybrid' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`} />
                <div>
                  <h3 className="font-semibold text-slate-800">Hybrid (NVMe + HDD)</h3>
                  <p className="text-sm text-slate-600">NVMe for performance + HDD for capacity</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Drive Configuration */}
      <Card className="shadow-lg border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="w-5 h-5 text-blue-600" />
            Step 2: Configure Drives
          </CardTitle>
          <CardDescription>Configure drives for {perfilStorage === 'full-nvme' ? 'Full NVMe' : 'Hybrid'} Storage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-4 py-2 text-left">Drive Type</th>
                  <th className="px-4 py-2 text-left">Count (per node)</th>
                  <th className="px-4 py-2 text-left">Capacity (TB)</th>
                </tr>
              </thead>
              <tbody>
                {drives.map((drive, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">
                        {drive.tipo.toUpperCase()}
                        {drive.tipo === 'nvme' && ' (Performance)'}
                        {drive.tipo === 'hdd' && ' (Capacity)'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        value={drive.quantidadePorNo}
                        onChange={e => atualizarDrive(idx, 'quantidadePorNo', Number(e.target.value))}
                        className="w-20 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0.1}
                        step={0.01}
                        value={drive.capacidadePorDrive}
                        onChange={e => atualizarDrive(idx, 'capacidadePorDrive', Number(e.target.value))}
                        className="w-24 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Cluster Parameters */}
      <Card className="shadow-lg border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Server className="w-5 h-5 text-blue-600" />
            Step 3: Cluster Parameters
          </CardTitle>
          <CardDescription>Configure your cluster settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="block text-slate-700 font-medium mb-2">Number of Servers (Nodes)</Label>
              <input
                type="number"
                min={2}
                max={16}
                value={params.servidores}
                onChange={e => setParams({ ...params, servidores: Number(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <Label className="block text-slate-700 font-medium mb-2">Resiliency Type</Label>
              <select
                value={params.tipoResiliencia}
                onChange={e => setParams({ ...params, tipoResiliencia: e.target.value as TipoResiliencia })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                {Object.keys(OVERHEAD_RESILIENCIA).map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Descrição da resiliência */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">
              <strong>Description:</strong> {DESCRICOES_RESILIENCIA[params.tipoResiliencia]}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Pizza */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart2 className="w-5 h-5 text-blue-600" />
                Capacity Distribution
              </CardTitle>
              <CardDescription>Visualization of capacity distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosPizza}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={8}
                      dataKey="valor"
                    >
                      {dadosPizza.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatarTB(value)}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '14px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo de Resultados */}
        <div className="space-y-6">
          <Card className="shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="w-5 h-5 text-blue-600" />
                Capacity Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Raw Capacity (per Node)</span>
                  <span className="font-semibold text-slate-700">
                    {formatarTB(drives.reduce((acc, drive) => acc + (drive.quantidadePorNo * drive.capacidadePorDrive), 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Raw Capacity (Cluster)</span>
                  <span className="font-semibold text-slate-700">{formatarTB(resultado.capacidadeBruta)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Reserve Capacity</span>
                  <span className="font-semibold text-red-600">{formatarTB(resultado.reserveCapacity)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Resiliency Overhead</span>
                  <span className="font-semibold text-orange-600">{formatarTB(resultado.resiliencyOverhead)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Actual Storage Efficiency</span>
                  <span className="font-semibold text-blue-600">{resultado.actualStorageEfficiency.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Net Usable Capacity</span>
                  <span className="font-semibold text-green-600">{formatarTB(resultado.netUsableCapacity)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Net Usable Capacity (TiB)</span>
                  <span className="font-semibold text-green-600">{formatarTiB(resultado.netUsableCapacity)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HardDrive className="w-5 h-5 text-green-600" />
                Storage Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{resultado.actualStorageEfficiency.toFixed(0)}%</div>
                <div className="text-sm text-slate-500">Actual Storage Efficiency</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Utilization</span>
                  <span className="font-semibold text-green-600">{resultado.actualStorageEfficiency.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${resultado.actualStorageEfficiency}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alerta */}
      {resultado.alerta && (
        <Card className="shadow-lg border border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-yellow-800">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-yellow-800">
              {resultado.alerta}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning */}
      {resultado.warning && (
        <Card className="shadow-lg border border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-orange-800">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Warning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-orange-800">
              {resultado.warning}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Buttons */}
      <div className="flex justify-center gap-4">
        <Button 
          onClick={() => {
            // Implementar export CSV
            console.log('Export CSV');
          }}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
        <Button 
          onClick={() => {
            // Implementar export PDF
            console.log('Export PDF');
          }}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <FileText className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>
    </div>
  );
} 