import React, { useState, useRef, useEffect } from 'react';
import { HardDrive, Plus, AlertTriangle, Trash2, Download, Edit2, Server } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import RackVisualization from './RackVisualization';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabase';

interface Processor {
  id: string;
  name: string;
  cores: number;
  frequency: string;
  generation: string;
  spec_int_base: number;
  tdp: number;
}

interface Server {
  id: string;
  name: string;
  quantity: number;
  rackUnits: number;
  processorId: string;
  processors: number;
  coresPerProcessor: number;
  disks: number;
  diskSize: number;
  raidType: 'RAID 1' | 'RAID 5' | 'RAID 6';
  ports10_25GB: number;
  ports100GB: number;
  ports32_64GB: number;
}

const COLORS = ['#3B82F6', '#10B981'];

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

const formatStorage = (gb: number): string => {
  if (gb >= 1024) {
    const tb = gb / 1024;
    if (Math.abs(tb - 1.92) < 0.01) return '1.92 TB';
    if (Math.abs(tb - 3.84) < 0.01) return '3.84 TB';
    if (Math.abs(tb - 7.68) < 0.01) return '7.68 TB';
    if (Math.abs(tb - 15.36) < 0.01) return '15.36 TB';
    if (Math.floor(tb) === tb) return `${tb} TB`;
    return `${tb.toFixed(2)} TB`;
  }
  return `${gb} GB`;
};

const ServerCalculator = () => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [editingServer, setEditingServer] = useState<string | null>(null);
  const [rackView, setRackView] = useState<'front' | 'rear'>('front');
  const [considerNPlusOne, setConsiderNPlusOne] = useState(false);
  const [processors, setProcessors] = useState<Processor[]>([]);
  const [selectedProcessor, setSelectedProcessor] = useState<Processor | null>(null);
  const [newServer, setNewServer] = useState<Omit<Server, 'id'>>({
    name: '',
    quantity: 1,
    rackUnits: 1,
    processorId: '',
    processors: 1,
    coresPerProcessor: 0,
    disks: 1,
    diskSize: DISK_SIZES[0],
    raidType: 'RAID 1',
    ports10_25GB: 0,
    ports100GB: 0,
    ports32_64GB: 0
  });

  useEffect(() => {
    const fetchProcessors = async () => {
      const { data, error } = await supabase
        .from('processors')
        .select('*')
        .order('generation', { ascending: true })
        .order('spec_int_base', { ascending: false });

      if (error) {
        console.error('Error fetching processors:', error);
        return;
      }

      setProcessors(data);
      if (data.length > 0) {
        setSelectedProcessor(data[0]);
        setNewServer(prev => ({
          ...prev,
          processorId: data[0].id,
          coresPerProcessor: data[0].cores
        }));
      }
    };

    fetchProcessors();
  }, []);

  const addServer = () => {
    if (editingServer) {
      // Encontra todos os servidores idênticos
      const serverToUpdate = servers.find(server => server.id === editingServer);
      if (!serverToUpdate) return;

      const identicalServers = servers.filter(server => 
        server.name === serverToUpdate.name &&
        server.processorId === serverToUpdate.processorId &&
        server.processors === serverToUpdate.processors &&
        server.rackUnits === serverToUpdate.rackUnits &&
        server.disks === serverToUpdate.disks &&
        server.diskSize === serverToUpdate.diskSize &&
        server.raidType === serverToUpdate.raidType &&
        server.ports10_25GB === serverToUpdate.ports10_25GB &&
        server.ports100GB === serverToUpdate.ports100GB &&
        server.ports32_64GB === serverToUpdate.ports32_64GB
      );

      // Remove os servidores idênticos
      const remainingServers = servers.filter(server => !identicalServers.some(s => s.id === server.id));

      // Adiciona a nova quantidade de servidores
      const newServers = Array.from({ length: newServer.quantity }, (_, index) => ({
        ...newServer,
        id: `${Date.now()}-${index}`,
        name: newServer.name
      }));

      setServers([...remainingServers, ...newServers]);
      setEditingServer(null);
    } else {
      const newServers = Array.from({ length: newServer.quantity }, (_, index) => ({
        ...newServer,
        id: `${Date.now()}-${index}`,
        name: newServer.name
      }));
      setServers([...servers, ...newServers]);
    }

    const defaultProcessor = processors[0];
    setNewServer({
      name: '',
      quantity: 1,
      rackUnits: 1,
      processorId: defaultProcessor?.id || '',
      processors: 1,
      coresPerProcessor: defaultProcessor?.cores || 0,
      disks: 1,
      diskSize: DISK_SIZES[0],
      raidType: 'RAID 1',
      ports10_25GB: 0,
      ports100GB: 0,
      ports32_64GB: 0
    });
  };

  const deleteServer = (id: string) => {
    const serverToDelete = servers.find(server => server.id === id);
    if (!serverToDelete) return;

    // Encontra todos os servidores idênticos
    const identicalServers = servers.filter(server => 
      server.name === serverToDelete.name &&
      server.processorId === serverToDelete.processorId &&
      server.processors === serverToDelete.processors &&
      server.rackUnits === serverToDelete.rackUnits &&
      server.disks === serverToDelete.disks &&
      server.diskSize === serverToDelete.diskSize &&
      server.raidType === serverToDelete.raidType &&
      server.ports10_25GB === serverToDelete.ports10_25GB &&
      server.ports100GB === serverToDelete.ports100GB &&
      server.ports32_64GB === serverToDelete.ports32_64GB
    );

    // Remove todos os servidores idênticos de uma vez
    setServers(servers.filter(server => !identicalServers.some(s => s.id === server.id)));
  };

  const clearAllServers = () => {
    setServers([]);
    setEditingServer(null);
  };

  const editServer = (server: Server) => {
    setNewServer({
      name: server.name,
      quantity: server.quantity,
      rackUnits: server.rackUnits,
      processorId: server.processorId,
      processors: server.processors,
      coresPerProcessor: server.coresPerProcessor,
      disks: server.disks,
      diskSize: server.diskSize,
      raidType: server.raidType,
      ports10_25GB: server.ports10_25GB,
      ports100GB: server.ports100GB,
      ports32_64GB: server.ports32_64GB
    });
    setEditingServer(server.id);
  };

  const calculateTotalStorage = (server: Server) => {
    const totalRawStorage = server.disks * server.diskSize;
    switch (server.raidType) {
      case 'RAID 1': return totalRawStorage / 2;
      case 'RAID 5': return totalRawStorage * ((server.disks - 1) / server.disks);
      case 'RAID 6': return totalRawStorage * ((server.disks - 2) / server.disks);
      default: return totalRawStorage;
    }
  };

  const calculateTotalSpecInt = () => {
    return servers.reduce((total, server) => {
      const processor = processors.find(p => p.id === server.processorId);
      return total + (processor?.spec_int_base ?? 0) * server.processors;
    }, 0);
  };

  const calculateTotalPorts = () => {
    return {
      total10_25GB: servers.reduce((acc, server) => acc + server.ports10_25GB, 0),
      total100GB: servers.reduce((acc, server) => acc + server.ports100GB, 0),
      total32_64GB: servers.reduce((acc, server) => acc + server.ports32_64GB, 0)
    };
  };

  const calculateTotalThroughput = () => {
    const ports = calculateTotalPorts();
    return {
      total10_25GB: ports.total10_25GB * 25, // Using 25GB as max for 10/25GB ports
      total100GB: ports.total100GB * 100,
      total32_64GB: ports.total32_64GB * 64  // Using 64GB as max for 32/64GB ports
    };
  };

  const formatThroughput = (gbps: number): string => {
    if (gbps >= 1000) {
      return `${(gbps / 1000).toFixed(1)} Tbps`;
    }
    return `${gbps} Gbps`;
  };

  const calculateTotalRackUnits = () => {
    return servers.reduce((total, server) => total + server.rackUnits, 0);
  };

  const calculateRackInfo = () => {
    const totalRackUnits = calculateTotalRackUnits();
    const racksNeeded = Math.ceil(totalRackUnits / 42);
    const remainingUnits = totalRackUnits % 42;
    return { racksNeeded, remainingUnits };
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      backgroundColor: '#0f172a'
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm'
    });
    const imgWidth = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save('data-center-report.pdf');
  };

  const handleProcessorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProcessor = processors.find(p => p.id === e.target.value);
    if (selectedProcessor) {
      setNewServer({
        ...newServer,
        processorId: selectedProcessor.id,
        coresPerProcessor: selectedProcessor.cores
      });
    }
  };

  const handleDiskSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewServer({ ...newServer, diskSize: parseFloat(e.target.value) });
  };

  const storageData = [
    { name: 'Raw Storage', value: servers.reduce((acc, server) => acc + (server.disks * server.diskSize), 0) },
    { name: 'Usable Storage', value: servers.reduce((acc, server) => acc + calculateTotalStorage(server), 0) }
  ];

  const groupIdenticalServers = (servers: Server[]) => {
    const groups = servers.reduce((acc, server) => {
      const key = `${server.name}-${server.processorId}-${server.processors}-${server.rackUnits}-${server.disks}-${server.diskSize}-${server.raidType}-${server.ports10_25GB}-${server.ports100GB}-${server.ports32_64GB}`;
      if (!acc[key]) {
        acc[key] = {
          ...server,
          quantity: 1,
          ids: [server.id]
        };
      } else {
        acc[key].quantity += 1;
        acc[key].ids.push(server.id);
      }
      return acc;
    }, {} as Record<string, Server & { quantity: number; ids: string[] }>);

    return Object.values(groups);
  };

  const handleEditServer = (index: number) => {
    const server = servers[index];
    setEditingServer({
      ...server,
      index,
      quantity: server.quantity
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingServer) return;

    const updatedServers = [...servers];
    const serverToUpdate = updatedServers[editingServer.index];

    // Atualiza o servidor sendo editado
    updatedServers[editingServer.index] = {
      ...editingServer,
      quantity: editingServer.quantity
    };

    // Atualiza todos os servidores idênticos
    updatedServers.forEach((server, index) => {
      if (index !== editingServer.index && 
          server.name === serverToUpdate.name &&
          server.processorId === serverToUpdate.processorId &&
          server.processors === serverToUpdate.processors &&
          server.rackUnits === serverToUpdate.rackUnits &&
          server.disks === serverToUpdate.disks &&
          server.diskSize === serverToUpdate.diskSize &&
          server.raidType === serverToUpdate.raidType &&
          server.ports10_25GB === serverToUpdate.ports10_25GB &&
          server.ports100GB === serverToUpdate.ports100GB &&
          server.ports32_64GB === serverToUpdate.ports32_64GB) {
        updatedServers[index] = {
          ...editingServer,
          quantity: editingServer.quantity
        };
      }
    });

    setServers(updatedServers);
    setShowEditModal(false);
    setEditingServer(null);
  };

  if (!selectedProcessor) {
    return <div>Loading processors...</div>;
  }

  return (
    <div className="flex flex-row-reverse gap-8">
      <div className="w-[400px] flex-shrink-0">
        <div className="sticky top-2">
          <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-6">Server Management</h2>
            <div className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Server Name
                  </label>
                  <input
                    type="text"
                    value={newServer.name}
                    onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    placeholder="Enter server name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={newServer.quantity}
                    onChange={(e) => setNewServer({ ...newServer, quantity: parseInt(e.target.value) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Rack Units (U)
                  </label>
                  <input
                    type="number"
                    value={newServer.rackUnits}
                    onChange={(e) => setNewServer({ ...newServer, rackUnits: parseInt(e.target.value) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="1"
                    max="42"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Processor Model
                  </label>
                  <select
                    value={newServer.processorId}
                    onChange={handleProcessorChange}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                  >
                    {processors.map((processor) => (
                      <option key={processor.id} value={processor.id}>
                        {processor.name} ({processor.cores} cores)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Number of Processors
                  </label>
                  <input
                    type="number"
                    value={newServer.processors}
                    onChange={(e) => setNewServer({ ...newServer, processors: parseInt(e.target.value) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="1"
                    max="4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Number of Disks
                  </label>
                  <input
                    type="number"
                    value={newServer.disks}
                    onChange={(e) => setNewServer({ ...newServer, disks: parseInt(e.target.value) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Disk Size
                  </label>
                  <select
                    value={newServer.diskSize}
                    onChange={handleDiskSizeChange}
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
                    RAID Type
                  </label>
                  <select
                    value={newServer.raidType}
                    onChange={(e) => setNewServer({ ...newServer, raidType: e.target.value as Server['raidType'] })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="RAID 1">RAID 1</option>
                    <option value="RAID 5">RAID 5</option>
                    <option value="RAID 6">RAID 6</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Ports 10/25GB
                  </label>
                  <input
                    type="number"
                    value={newServer.ports10_25GB}
                    onChange={(e) => setNewServer({ ...newServer, ports10_25GB: parseInt(e.target.value) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Ports 100GB
                  </label>
                  <input
                    type="number"
                    value={newServer.ports100GB}
                    onChange={(e) => setNewServer({ ...newServer, ports100GB: parseInt(e.target.value) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Ports 32/64GB
                  </label>
                  <input
                    type="number"
                    value={newServer.ports32_64GB}
                    onChange={(e) => setNewServer({ ...newServer, ports32_64GB: parseInt(e.target.value) })}
                    className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                    min="0"
                  />
                </div>
              </div>

              <button
                onClick={addServer}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-colors"
              >
                {editingServer ? <Edit2 size={20} /> : <Plus size={20} />}
                {editingServer ? 'Update Server' : 'Add Server'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-8">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={clearAllServers}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-colors"
            >
              <Trash2 size={18} />
              Clear All
            </button>
            <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg">
              <input
                type="checkbox"
                id="nPlusOne"
                checked={considerNPlusOne}
                onChange={(e) => setConsiderNPlusOne(e.target.checked)}
                className="rounded border-slate-500"
              />
              <label htmlFor="nPlusOne" className="text-sm text-slate-300">
                N+1 Redundancy
              </label>
            </div>
          </div>
          <button
            onClick={exportToPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 flex items-center gap-2 transition-colors"
          >
            <Download size={18} />
            Export Report
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
            <div className="text-sm text-slate-400 mb-1">Total Servers</div>
            <div className="text-2xl font-bold">
              {servers.length}{considerNPlusOne && servers.length > 0 ? ' (+1)' : ''}
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
            <div className="text-sm text-slate-400 mb-1">Total SPECint Rate</div>
            <div className="text-2xl font-bold">
              {calculateTotalSpecInt().toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
            <div className="text-sm text-slate-400 mb-1">Raw Storage</div>
            <div className="text-2xl font-bold">
              {formatStorage(servers.reduce((acc, server) => acc + (server.disks * server.diskSize), 0))}
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
            <div className="text-sm text-slate-400 mb-1">Usable Storage</div>
            <div className="text-2xl font-bold">
              {formatStorage(servers.reduce((acc, server) => acc + calculateTotalStorage(server), 0))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Server List</h2>
              <span className="text-sm text-slate-400">
                {servers.length} server{servers.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-1 max-h-[250px] overflow-y-auto">
              {groupIdenticalServers(servers).map(group => {
                const processor = processors.find(p => p.id === group.processorId);
                return (
                  <div
                    key={group.ids[0]}
                    className="bg-slate-700/50 p-2 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Server size={14} className="text-blue-400 shrink-0" />
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {group.name} {group.quantity > 1 ? `