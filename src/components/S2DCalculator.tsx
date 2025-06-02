import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Database, HardDrive, Server, Download, FileText, BarChart2, Layers, AlertCircle, Info } from "lucide-react";
import { jsPDF } from "jspdf";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
  Tooltip as TooltipComponent,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const storageTypes = [
  { value: 'full-flash', label: 'Full-Flash Storage' },
  { value: '2-tier', label: '2-Tier Storage' },
  { value: '3-tier', label: '3-Tier Storage' },
];

const tierConfigs = [
  { value: 'nvme-capacity', label: 'NVMe as Capacity' },
  { value: 'ssd-capacity', label: 'SSD as Capacity' },
];

const resiliencyOptions = [
  { 
    value: '2wm', 
    label: 'Two-Way Mirror', 
    efficiency: 0.5,
    failures: 1,
    minNodes: 2,
    description: 'Stores 2 copies of your data on 2 different nodes',
    layout: '2-Way Mirror'
  },
  { 
    value: '3wm', 
    label: 'Three-Way Mirror', 
    efficiency: 0.333,
    failures: 2,
    minNodes: 3,
    description: 'Stores 3 copies of your data on 3 different nodes',
    layout: '3-Way Mirror'
  },
  { 
    value: 'dual-parity', 
    label: 'Dual Parity', 
    efficiency: 0.5, // Will be calculated dynamically
    failures: 2,
    minNodes: 4,
    description: 'Data and parity copies stored on 4 different nodes',
    layout: 'RS 2+2' // Will be updated dynamically
  }
];

// Function to calculate Dual Parity efficiency based on nodes and storage type
const calculateDualParityEfficiency = (nodes: number, isAllFlash: boolean) => {
  if (nodes < 4) return 0;
  
  if (isAllFlash) {
    if (nodes >= 9 && nodes <= 15) return 0.75; // RS 6+2
    if (nodes >= 7 && nodes <= 8) return 0.667; // RS 4+2
    if (nodes >= 4 && nodes <= 6) return 0.5; // RS 2+2
    if (nodes >= 16) return 0.8; // LRC (12,2,1)
  } else {
    if (nodes >= 12) return 0.727; // LRC (8,2,1)
    if (nodes >= 7 && nodes <= 11) return 0.667; // RS 4+2
    if (nodes >= 4 && nodes <= 6) return 0.5; // RS 2+2
  }
  return 0.5; // Default
};

// Function to get Dual Parity layout based on nodes and storage type
const getDualParityLayout = (nodes: number, isAllFlash: boolean) => {
  if (nodes < 4) return '';
  
  if (isAllFlash) {
    if (nodes >= 9 && nodes <= 15) return 'RS 6+2';
    if (nodes >= 7 && nodes <= 8) return 'RS 4+2';
    if (nodes >= 4 && nodes <= 6) return 'RS 2+2';
    if (nodes >= 16) return 'LRC (12,2,1)';
  } else {
    if (nodes >= 12) return 'LRC (8,2,1)';
    if (nodes >= 7 && nodes <= 11) return 'RS 4+2';
    if (nodes >= 4 && nodes <= 6) return 'RS 2+2';
  }
  return 'RS 2+2';
};

// Function to get recommended resiliency
const getRecommendedResiliency = (nodes: number, isAllFlash: boolean) => {
  if (nodes === 2) return '2wm';
  if (nodes === 3) return '3wm';
  if (nodes >= 4) return 'dual-parity';
  return '2wm';
};

export default function S2DCalculator() {
  const [config, setConfig] = useState({
    nodes: 2,
    drivesPerNode: 10,
    driveSize: 10,
    storageType: 'full-flash',
    tierConfig: 'nvme-capacity',
    resiliency: '2wm',
  });

  const isAllFlash = config.storageType === 'full-flash';
  const recommendedResiliency = getRecommendedResiliency(config.nodes, isAllFlash);
  
  // Update resiliency if current selection is invalid for current node count
  React.useEffect(() => {
    const selectedResiliency = resiliencyOptions.find(r => r.value === config.resiliency);
    if (selectedResiliency && config.nodes < selectedResiliency.minNodes) {
      setConfig(prev => ({ ...prev, resiliency: recommendedResiliency }));
    }
  }, [config.nodes, recommendedResiliency]);

  const selectedResiliency = resiliencyOptions.find(r => r.value === config.resiliency);
  const currentEfficiency = selectedResiliency?.value === 'dual-parity' 
    ? calculateDualParityEfficiency(config.nodes, isAllFlash)
    : selectedResiliency?.efficiency || 0.5;

  // Update the selected resiliency's efficiency for display
  const displayResiliency = selectedResiliency ? {
    ...selectedResiliency,
    efficiency: currentEfficiency,
    layout: selectedResiliency.value === 'dual-parity' 
      ? getDualParityLayout(config.nodes, isAllFlash)
      : selectedResiliency.layout
  } : null;

  // Calculations
  const totalRawPerNode = config.drivesPerNode * config.driveSize;
  const totalRawCluster = totalRawPerNode * config.nodes;
  const resiliencyOverhead = totalRawCluster * (1 - currentEfficiency);
  const netUsable = totalRawCluster - resiliencyOverhead;
  const efficiency = (netUsable / totalRawCluster) * 100;

  const formatTB = (value: number) => `${value.toFixed(1)} TB`;
  const formatTiB = (value: number) => `${(value * 0.909).toFixed(1)} TiB`;

  const chartData = [
    { name: 'Usable Capacity', value: netUsable, color: '#4CAF50' },
    { name: 'Resiliency Overhead', value: resiliencyOverhead, color: '#F44336' },
  ];

  const exportCSV = () => {
    const rows = [
      ["Item", "Value"],
      ["Total Raw Capacity (per Node)", formatTB(totalRawPerNode)],
      ["Total Raw Capacity (Cluster)", formatTB(totalRawCluster)],
      ["Resiliency Overhead", formatTB(resiliencyOverhead)],
      ["Real Efficiency", efficiency.toFixed(0) + "%"],
      ["Net Usable Capacity", formatTB(netUsable)],
      ["Net Usable Capacity (TiB)", formatTiB(netUsable)],
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "s2d_capacity_results.csv";
    a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("S2D Capacity Calculator - Results", 10, 15);

    doc.setFontSize(12);
    let y = 30;
    const lines = [
      ["Total Raw Capacity (per Node)", formatTB(totalRawPerNode)],
      ["Total Raw Capacity (Cluster)", formatTB(totalRawCluster)],
      ["Resiliency Overhead", formatTB(resiliencyOverhead)],
      ["Real Efficiency", efficiency.toFixed(0) + "%"],
      ["Net Usable Capacity", formatTB(netUsable)],
      ["Net Usable Capacity (TiB)", formatTiB(netUsable)],
    ];

    lines.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 10, y);
      y += 10;
    });

    doc.save("s2d_capacity_results.pdf");
  };

  return (
    <div className="min-h-screen p-8 space-y-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Layers className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                S2D Capacity Calculator
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Calculate the effective capacity of your Storage Spaces Direct cluster
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={exportCSV}
              variant="outline"
              className="bg-white hover:bg-gray-50 text-gray-900 flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              onClick={exportPDF}
              variant="outline"
              className="bg-white hover:bg-gray-50 text-gray-900 flex items-center gap-2 text-sm"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Server className="w-5 h-5 text-blue-600" />
                Storage Configuration
              </CardTitle>
              <CardDescription className="text-sm">
                Configure your S2D cluster parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Storage Type</Label>
                    <TooltipProvider>
                      <TooltipComponent>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">Select your cluster storage type</p>
                        </TooltipContent>
                      </TooltipComponent>
                    </TooltipProvider>
                  </div>
                  <Select value={config.storageType} onValueChange={value => setConfig({...config, storageType: value})}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select storage type" />
                    </SelectTrigger>
                    <SelectContent>
                      {storageTypes.map(s => (
                        <SelectItem key={s.value} value={s.value} className="text-sm">
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Tier Configuration</Label>
                    <TooltipProvider>
                      <TooltipComponent>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">Configure how tiers will be used</p>
                        </TooltipContent>
                      </TooltipComponent>
                    </TooltipProvider>
                  </div>
                  <Select value={config.tierConfig} onValueChange={value => setConfig({...config, tierConfig: value})}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select tier configuration" />
                    </SelectTrigger>
                    <SelectContent>
                      {tierConfigs.map(t => (
                        <SelectItem key={t.value} value={t.value} className="text-sm">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Number of Nodes</Label>
                    <TooltipProvider>
                      <TooltipComponent>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">Minimum of 2 nodes for S2D</p>
                        </TooltipContent>
                      </TooltipComponent>
                    </TooltipProvider>
                  </div>
                  <Input 
                    type="number" 
                    value={config.nodes} 
                    onChange={e => setConfig({...config, nodes: Number(e.target.value)})} 
                    min={2}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Drives per Node</Label>
                    <TooltipProvider>
                      <TooltipComponent>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">Number of drives in each cluster node</p>
                        </TooltipContent>
                      </TooltipComponent>
                    </TooltipProvider>
                  </div>
                  <Input 
                    type="number" 
                    value={config.drivesPerNode} 
                    onChange={e => setConfig({...config, drivesPerNode: Number(e.target.value)})} 
                    min={1}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Drive Size (TB)</Label>
                    <TooltipProvider>
                      <TooltipComponent>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">Capacity of each drive in TB</p>
                        </TooltipContent>
                      </TooltipComponent>
                    </TooltipProvider>
                  </div>
                  <Input 
                    type="number" 
                    value={config.driveSize} 
                    onChange={e => setConfig({...config, driveSize: Number(e.target.value)})} 
                    step={0.01}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Resiliency</Label>
                    <TooltipProvider>
                      <TooltipComponent>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">
                            {displayResiliency?.description}
                            {displayResiliency?.value === 'dual-parity' && (
                              <span className="block mt-1">
                                Layout: {displayResiliency.layout}
                              </span>
                            )}
                          </p>
                        </TooltipContent>
                      </TooltipComponent>
                    </TooltipProvider>
                  </div>
                  <Select 
                    value={config.resiliency} 
                    onValueChange={value => setConfig({...config, resiliency: value})}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select resiliency" />
                    </SelectTrigger>
                    <SelectContent>
                      {resiliencyOptions
                        .filter(r => config.nodes >= r.minNodes)
                        .map(r => (
                          <SelectItem key={r.value} value={r.value} className="text-sm">
                            <div className="flex flex-col">
                              <span>{r.label}</span>
                              <span className="text-xs text-gray-500">
                                {r.description}
                                {r.value === 'dual-parity' && config.nodes >= 4 && (
                                  <span className="block">
                                    Layout: {getDualParityLayout(config.nodes, isAllFlash)}
                                  </span>
                                )}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {config.resiliency !== recommendedResiliency && (
                    <p className="text-sm text-blue-600 mt-1">
                      Recommended: {resiliencyOptions.find(r => r.value === recommendedResiliency)?.label}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card className="shadow-lg border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart2 className="w-5 h-5 text-blue-600" />
                  Calculation Results
                </CardTitle>
                <CardDescription className="text-sm">
                  Cluster capacity distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatTB(value)}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          padding: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Database className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Total Raw Capacity (per Node)</p>
                        <p className="text-base font-semibold">{formatTB(totalRawPerNode)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Database className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Total Raw Capacity (Cluster)</p>
                        <p className="text-base font-semibold">{formatTB(totalRawCluster)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-700">
                      <HardDrive className="w-4 h-4 text-yellow-500" />
                      <div>
                        <p className="text-sm font-medium">Resiliency Overhead</p>
                        <p className="text-base font-semibold">{formatTB(resiliencyOverhead)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layers className="w-5 h-5 text-blue-600" />
                  Capacity Summary
                </CardTitle>
                <CardDescription className="text-sm">
                  Effective capacity available for use
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">Real Efficiency</p>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full"
                          style={{ width: `${efficiency}%` }}
                        />
                      </div>
                      <span className="text-base font-semibold">{efficiency.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">Net Usable Capacity</p>
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-blue-600">{formatTB(netUsable)}</span>
                      <span className="text-xs text-gray-500">{formatTiB(netUsable)} TiB</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 