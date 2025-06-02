import React, { useState } from "react";
import {
  FileText,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Workload = {
  name: string;
  volumeTB: number;
  dailyChangePercent: number;
  annualGrowthPercent: number;
  dedupPercent: number;
  compressionPercent: number;
};

type RetentionPeriod = {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
};

type Retentions = {
  local: RetentionPeriod;
  dr: RetentionPeriod;
  ltr: RetentionPeriod;
};

const WORKLOAD_NAMES = [
  "DB2",
  "Exchange",
  "File System",
  "MySQL",
  "NDMP",
  "Oracle",
  "PostgreSQL",
  "SAP",
  "SharePoint",
  "MS-SQL",
  "SyBase",
  "VMware",
  "Nutanix",
];

const WORKLOAD_DEFAULTS = {
  "DB2": { dedup: 45, compression: 35 },
  "Oracle": { dedup: 45, compression: 35 },
  "MS-SQL": { dedup: 45, compression: 35 },
  "MySQL": { dedup: 45, compression: 35 },
  "PostgreSQL": { dedup: 45, compression: 35 },
  "SAP": { dedup: 45, compression: 35 },
  "SyBase": { dedup: 45, compression: 35 },
  
  "Exchange": { dedup: 57, compression: 32 },
  "SharePoint": { dedup: 57, compression: 32 },
  
  "NDMP": { dedup: 25, compression: 20 },
  
  "VMware": { dedup: 57, compression: 42 },
  "Nutanix": { dedup: 57, compression: 42 },
  
  "File System": { dedup: 62, compression: 35 },
};

const NODE_USABLE_CAPACITY_TB = 100;
const CACHE_DISKS_PER_NODE = 4;
const CAPACITY_DISKS_PER_NODE = 24;

const COHESITY_OVERHEAD = 1.2;

export default function CohesityBackupSizing() {
  const [workloads, setWorkloads] = useState<Workload[]>(
    WORKLOAD_NAMES.map((name) => ({
      name,
      volumeTB: 0,
      dailyChangePercent: 0,
      annualGrowthPercent: 0,
      dedupPercent: WORKLOAD_DEFAULTS[name as keyof typeof WORKLOAD_DEFAULTS].dedup,
      compressionPercent: WORKLOAD_DEFAULTS[name as keyof typeof WORKLOAD_DEFAULTS].compression,
    }))
  );

  const [retentions, setRetentions] = useState<Retentions>({
    local: { daily: 7, weekly: 4, monthly: 12, yearly: 2 },
    dr: { daily: 3, weekly: 2, monthly: 6, yearly: 1 },
    ltr: { daily: 0, weekly: 0, monthly: 12, yearly: 5 },
  });

  const [useGrowthProjection, setUseGrowthProjection] = useState(true);

  function updateWorkload(index: number, field: keyof Workload, value: number) {
    const newWorkloads = [...workloads];
    newWorkloads[index] = {
      ...newWorkloads[index],
      [field]: value
    };
    setWorkloads(newWorkloads);
  }

  function updateRetention(
    type: keyof Retentions,
    field: keyof RetentionPeriod,
    value: number
  ) {
    setRetentions((old) => ({
      ...old,
      [type]: {
        ...old[type],
        [field]: value,
      },
    }));
  }

  function retentionDays(r: RetentionPeriod) {
    return r.daily + r.weekly * 7 + r.monthly * 30 + r.yearly * 365;
  }

  function calculateCapacity(volumeTB: number, dailyChange: number, ret: RetentionPeriod, dedupPercent: number, compressionPercent: number) {
    const fullData = volumeTB;
    const retentionTotalDays = retentionDays(ret);
    const incrementalPerDay = volumeTB * (dailyChange / 100);
    if (retentionTotalDays <= 0) return 0;
    
    const dedupFactor = (100 - dedupPercent) / 100;
    const compressionFactor = (100 - compressionPercent) / 100;
    const totalReductionFactor = dedupFactor * compressionFactor;
    
    const rawCapacity = fullData + incrementalPerDay * (retentionTotalDays - 1);
    return rawCapacity * totalReductionFactor;
  }

  function totalCapacityForWorkloads(workloads: Workload[], retentions: Retentions) {
    let total = 0;
    for (const wl of workloads) {
      if (wl.volumeTB <= 0) continue;

      const localCap = calculateCapacity(wl.volumeTB, wl.dailyChangePercent, retentions.local, wl.dedupPercent, wl.compressionPercent);
      const drCap = calculateCapacity(wl.volumeTB, wl.dailyChangePercent, retentions.dr, wl.dedupPercent, wl.compressionPercent);
      const ltrCap = calculateCapacity(wl.volumeTB, wl.dailyChangePercent, retentions.ltr, wl.dedupPercent, wl.compressionPercent);
      total += localCap + drCap + ltrCap;
    }
    return total;
  }

  function applyOverhead(capacityTB: number) {
    return capacityTB * COHESITY_OVERHEAD;
  }

  function applyGrowth(capacityTB: number, growthPercent: number, years: number) {
    return capacityTB * Math.pow(1 + growthPercent / 100, years);
  }

  function calculateGrowthCapacities(
    workloads: Workload[],
    retentions: Retentions
  ) {
    let totalVolume = 0;
    let weightedGrowth = 0;
    workloads.forEach((wl) => {
      if (wl.volumeTB > 0) {
        totalVolume += wl.volumeTB;
        weightedGrowth += wl.annualGrowthPercent * wl.volumeTB;
      }
    });
    if (totalVolume === 0) return null;

    const avgGrowthPercent = weightedGrowth / totalVolume;

    const baseCapacity = totalCapacityForWorkloads(workloads, retentions);
    const baseCapacityWithOverhead = applyOverhead(baseCapacity);

    return {
      baseCapacity,
      baseCapacityWithOverhead,
      year1: applyOverhead(applyGrowth(baseCapacity, avgGrowthPercent, 1)),
      year3: applyOverhead(applyGrowth(baseCapacity, avgGrowthPercent, 3)),
      year5: applyOverhead(applyGrowth(baseCapacity, avgGrowthPercent, 5)),
    };
  }

  function calculateNodes(totalCapacityTB: number) {
    return Math.ceil(totalCapacityTB / NODE_USABLE_CAPACITY_TB);
  }

  function calculateDisks(nodes: number) {
    return {
      cache: nodes * CACHE_DISKS_PER_NODE,
      capacity: nodes * CAPACITY_DISKS_PER_NODE,
    };
  }

  const growthCaps = useGrowthProjection
    ? calculateGrowthCapacities(workloads, retentions)
    : null;

  const baseCapacity = growthCaps ? growthCaps.baseCapacity : totalCapacityForWorkloads(workloads, retentions);
  const baseCapacityWithOverhead = growthCaps ? growthCaps.baseCapacityWithOverhead : applyOverhead(baseCapacity);

  const baseNodes = calculateNodes(baseCapacityWithOverhead);
  const baseDisks = calculateDisks(baseNodes);

  const nodesYear1 = growthCaps ? calculateNodes(growthCaps.year1) : 0;
  const nodesYear3 = growthCaps ? calculateNodes(growthCaps.year3) : 0;
  const nodesYear5 = growthCaps ? calculateNodes(growthCaps.year5) : 0;

  const disksYear1 = growthCaps ? calculateDisks(nodesYear1) : null;
  const disksYear3 = growthCaps ? calculateDisks(nodesYear3) : null;
  const disksYear5 = growthCaps ? calculateDisks(nodesYear5) : null;

  function exportCSV() {
    let csv = `Workload,Volume TB,Alteração Diária %,Crescimento Anual %\n`;
    workloads.forEach((wl) => {
      csv += `${wl.name},${wl.volumeTB},${wl.dailyChangePercent},${wl.annualGrowthPercent}\n`;
    });
    csv += `\nRetenção Local (dias, semanas, meses, anos),${retentions.local.daily},${retentions.local.weekly},${retentions.local.monthly},${retentions.local.yearly}\n`;
    csv += `Retenção DR (dias, semanas, meses, anos),${retentions.dr.daily},${retentions.dr.weekly},${retentions.dr.monthly},${retentions.dr.yearly}\n`;
    csv += `Retenção LTR (dias, semanas, meses, anos),${retentions.ltr.daily},${retentions.ltr.weekly},${retentions.ltr.monthly},${retentions.ltr.yearly}\n\n`;

    csv += `Capacidade,Base (TB),Ano 1 (TB),Ano 3 (TB),Ano 5 (TB)\n`;
    if (growthCaps) {
      csv += `Com Overhead,${growthCaps.baseCapacityWithOverhead.toFixed(2)},${growthCaps.year1.toFixed(2)},${growthCaps.year3.toFixed(2)},${growthCaps.year5.toFixed(2)}\n`;
    } else {
      csv += `Com Overhead,${baseCapacityWithOverhead.toFixed(2)},,,\n`;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "cohesity_backup_sizing.csv";
    link.click();
  }

  function exportPDF() {
    const doc = new jsPDF();
    let currentY = 22;

    doc.setFontSize(18);
    doc.text("Sizing Backup Cohesity", 14, currentY);
    currentY += 8;

    const workloadsTable = {
      head: [["Workload", "Volume TB", "Alteração Diária %", "Crescimento Anual %"]],
      body: workloads.map((wl) => [
        wl.name,
        wl.volumeTB.toString(),
        wl.dailyChangePercent.toString(),
        wl.annualGrowthPercent.toString(),
      ]),
    };
    autoTable(doc, { startY: currentY, head: workloadsTable.head, body: workloadsTable.body });
    currentY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(14);
    doc.text("Retenções (dias, semanas, meses, anos)", 14, currentY);
    currentY += 5;

    const retentionTable = {
      head: [["Tipo", "Diário", "Semanal", "Mensal", "Anual"]],
      body: [
        ["Local", retentions.local.daily.toString(), retentions.local.weekly.toString(), retentions.local.monthly.toString(), retentions.local.yearly.toString()],
        ["DR", retentions.dr.daily.toString(), retentions.dr.weekly.toString(), retentions.dr.monthly.toString(), retentions.dr.yearly.toString()],
        ["LTR", retentions.ltr.daily.toString(), retentions.ltr.weekly.toString(), retentions.ltr.monthly.toString(), retentions.ltr.yearly.toString()],
      ],
    };
    autoTable(doc, { startY: currentY, head: retentionTable.head, body: retentionTable.body });
    currentY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(14);
    doc.text("Capacidades e Nós", 14, currentY);
    currentY += 5;

    const capacityBody = growthCaps
      ? [
          ["Base (TB)", growthCaps.baseCapacity.toFixed(2)],
          ["Base + Overhead (TB)", growthCaps.baseCapacityWithOverhead.toFixed(2)],
          ["Ano 1 (TB)", growthCaps.year1.toFixed(2)],
          ["Ano 3 (TB)", growthCaps.year3.toFixed(2)],
          ["Ano 5 (TB)", growthCaps.year5.toFixed(2)],
          ["Nós Base", baseNodes.toString()],
          ["Nós Ano 1", nodesYear1.toString()],
          ["Nós Ano 3", nodesYear3.toString()],
          ["Nós Ano 5", nodesYear5.toString()],
        ]
      : [
          ["Base (TB)", baseCapacity.toFixed(2)],
          ["Base + Overhead (TB)", baseCapacityWithOverhead.toFixed(2)],
          ["Nós", baseNodes.toString()],
        ];

    autoTable(doc, {
      startY: currentY,
      head: [["Descrição", "Valor"]],
      body: capacityBody,
    });

    doc.save("cohesity_backup_sizing.pdf");
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-slate-900 text-gray-100 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">Sizing Backup Cohesity</h1>

      <div className="mb-6 flex items-center gap-4 justify-center">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useGrowthProjection}
            onChange={() => setUseGrowthProjection(!useGrowthProjection)}
            className="rounded text-blue-500 focus:ring-blue-400"
          />
          <span>Usar projeção de crescimento anual</span>
        </label>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-blue-400">Workloads</h2>
        <div className="space-y-0.5">
          {workloads.map((wl, i) => (
            <div key={wl.name} className="bg-slate-800 p-1.5 rounded hover:bg-slate-700 transition-colors flex items-center gap-1">
              <h3 className="font-semibold text-blue-300 w-16 text-xs">{wl.name}</h3>
              <div className="flex-1 grid grid-cols-5 gap-1">
                <label className="block">
                  <span className="text-xs text-gray-400">Volume (TB)</span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={wl.volumeTB}
                    onChange={(e) => updateWorkload(i, "volumeTB", parseFloat(e.target.value) || 0)}
                    className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-xs text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-400">Alteração (%)</span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={wl.dailyChangePercent}
                    onChange={(e) => updateWorkload(i, "dailyChangePercent", parseFloat(e.target.value) || 0)}
                    className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-xs text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-400">Crescimento (%)</span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={wl.annualGrowthPercent}
                    onChange={(e) => updateWorkload(i, "annualGrowthPercent", parseFloat(e.target.value) || 0)}
                    className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-xs text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-400">Deduplicação (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={wl.dedupPercent}
                    onChange={(e) => updateWorkload(i, "dedupPercent", parseFloat(e.target.value) || 0)}
                    className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-xs text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-400">Compressão (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={wl.compressionPercent}
                    onChange={(e) => updateWorkload(i, "compressionPercent", parseFloat(e.target.value) || 0)}
                    className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-xs text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-blue-400">Retenções</h2>

        {(["local", "dr", "ltr"] as (keyof Retentions)[]).map((type) => (
          <div key={type} className="mb-4 bg-slate-800 p-4 rounded hover:bg-slate-700 transition-colors">
            <h3 className="capitalize font-semibold mb-2 text-blue-300">{type === "ltr" ? "Long Term Retention (LTR)" : type.toUpperCase()}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <label className="block">
                Diária
                <input
                  type="number"
                  min={0}
                  value={retentions[type].daily}
                  onChange={(e) => updateRetention(type, "daily", parseInt(e.target.value) || 0)}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </label>
              <label className="block">
                Semanal
                <input
                  type="number"
                  min={0}
                  value={retentions[type].weekly}
                  onChange={(e) => updateRetention(type, "weekly", parseInt(e.target.value) || 0)}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </label>
              <label className="block">
                Mensal
                <input
                  type="number"
                  min={0}
                  value={retentions[type].monthly}
                  onChange={(e) => updateRetention(type, "monthly", parseInt(e.target.value) || 0)}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </label>
              <label className="block">
                Anual
                <input
                  type="number"
                  min={0}
                  value={retentions[type].yearly}
                  onChange={(e) => updateRetention(type, "yearly", parseInt(e.target.value) || 0)}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>
        ))}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-blue-400">Resultados</h2>
        <div className="bg-slate-800 p-4 rounded space-y-4">
          <div>
            <h3 className="font-semibold mb-2 text-blue-300">Distribuição de Capacidade</h3>
            <div className="w-full h-6 bg-slate-700 rounded-full overflow-hidden flex">
              <div 
                className="bg-blue-600 h-full flex items-center justify-center text-white text-sm"
                style={{ width: `${(baseCapacity / baseCapacityWithOverhead) * 100}%` }}
              >
                Usável
              </div>
              <div 
                className="bg-blue-400 h-full flex items-center justify-center text-white text-sm"
                style={{ width: `${((baseCapacityWithOverhead - baseCapacity) / baseCapacityWithOverhead) * 100}%` }}
              >
                Overhead
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-400">
              <p>Capacidade Usável: {baseCapacity.toFixed(1)} TB</p>
              <p>Overhead: {(baseCapacityWithOverhead - baseCapacity).toFixed(1)} TB</p>
              <p>Capacidade Total: {baseCapacityWithOverhead.toFixed(1)} TB</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-blue-300">Nós Necessários</h3>
            <div className="bg-slate-700 p-2 rounded">
              <p className="text-sm text-gray-400">Nós Base</p>
              <p className="font-semibold">{baseNodes} {baseNodes > 1 ? 'nós' : 'nó'}</p>
            </div>
          </div>

          {growthCaps && (
            <div>
              <h3 className="font-semibold mb-2 text-blue-300">Projeção de Crescimento</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-700 p-2 rounded">
                  <p className="text-sm text-gray-400">Ano 1</p>
                  <p className="font-semibold">{growthCaps.year1.toFixed(1)} TB</p>
                </div>
                <div className="bg-slate-700 p-2 rounded">
                  <p className="text-sm text-gray-400">Ano 3</p>
                  <p className="font-semibold">{growthCaps.year3.toFixed(1)} TB</p>
                </div>
                <div className="bg-slate-700 p-2 rounded">
                  <p className="text-sm text-gray-400">Ano 5</p>
                  <p className="font-semibold">{growthCaps.year5.toFixed(1)} TB</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="flex justify-center gap-4">
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <FileText size={20} />
          Exportar CSV
        </button>
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Download size={20} />
          Exportar PDF
        </button>
      </div>
    </div>
  );
}