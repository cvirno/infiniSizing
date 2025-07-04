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
      const filteredServers = servers.filter(server => server.id !== editingServer);
      const newServers = Array.from({ length: newServer.quantity }, (_, index) => ({
        ...newServer,
        id: `${Date.now()}-${index}`,
        name: newServer.quantity > 1 ? `${newServer.name}-${index + 1}` : newServer.name
      }));
      setServers([...filteredServers, ...newServers]);
      setEditingServer(null);
    } else {
      const newServers = Array.from({ length: newServer.quantity }, (_, index) => ({
        ...newServer,
        id: `${Date.now()}-${index}`,
        name: newServer.quantity > 1 ? `${newServer.name}-${index + 1}` : newServer.name
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
    setServers(servers.filter(server => server.id !== id));
  };

  const clearAllServers = () => {
    setServers([]);
    setEditingServer(null);
  };

  const editServer = (server: Server) => {
    setNewServer({
      name: server.name,
      quantity: server.quantity || 1,
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
              {servers.map((server) => {
                const processor = processors.find(p => p.id === server.processorId);
                return (
                  <div
                    key={server.id}
                    className="bg-slate-700/50 p-2 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Server size={14} className="text-blue-400 shrink-0" />
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {server.name}
                        </h3>
                        <p className="text-xs text-slate-400 truncate">
                          {server.processors}x {processor?.name.split(' ').slice(-1)[0]} • {server.rackUnits}U • {server.disks}x {formatStorage(server.diskSize)} {server.raidType}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => editServer(server)}
                        className="p-1 hover:bg-slate-600 rounded-lg transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => deleteServer(server.id)}
                        className="p-1 hover:bg-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Storage Distribution</h2>
              <div className="text-sm text-slate-400">
                Total: {formatStorage(storageData[0].value)}
              </div>
            </div>
            {servers.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={storageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {storageData.map((entry, index) => (
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
                    iconType="circle"
                    formatter={(value) => (
                      <span style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-400">
                No servers added yet
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">Total Ports and Throughput</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <div className="text-sm text-slate-400 mb-1">Total 10/25GB Ports</div>
              <div className="text-2xl font-bold">{calculateTotalPorts().total10_25GB}</div>
              <div className="text-sm text-slate-400">Throughput: {formatThroughput(calculateTotalThroughput().total10_25GB)}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">Total 100GB Ports</div>
              <div className="text-2xl font-bold">{calculateTotalPorts().total100GB}</div>
              <div className="text-sm text-slate-400">Throughput: {formatThroughput(calculateTotalThroughput().total100GB)}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">Total 32/64GB Ports</div>
              <div className="text-2xl font-bold">{calculateTotalPorts().total32_64GB}</div>
              <div className="text-sm text-slate-400">Throughput: {formatThroughput(calculateTotalThroughput().total32_64GB)}</div>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: '10/25GB',
                    ports: calculateTotalPorts().total10_25GB,
                    throughput: calculateTotalThroughput().total10_25GB
                  },
                  {
                    name: '100GB',
                    ports: calculateTotalPorts().total100GB,
                    throughput: calculateTotalThroughput().total100GB
                  },
                  {
                    name: '32/64GB',
                    ports: calculateTotalPorts().total32_64GB,
                    throughput: calculateTotalThroughput().total32_64GB
                  }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'ports' ? value : formatThroughput(Number(value)),
                    name === 'ports' ? 'Ports' : 'Throughput'
                  ]}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.5rem'
                  }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="ports" name="Ports" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="throughput" name="Throughput (Gbps)" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">Rack Information</h2>
          <div className="text-sm text-slate-400">
            {calculateRackInfo().racksNeeded > 1 ? (
              <div>
                <p>Total Rack Units: {calculateTotalRackUnits()}U</p>
                <p>Racks Needed: {calculateRackInfo().racksNeeded}</p>
                <p>Remaining Units in Last Rack: {calculateRackInfo().remainingUnits}U</p>
              </div>
            ) : (
              <p>Total Rack Units: {calculateTotalRackUnits()}U</p>
            )}
          </div>
        </div>

        <div>
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Rack Layout</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setRackView('front')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    rackView === 'front'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  Front View
                </button>
                <button
                  onClick={() => setRackView('rear')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    rackView === 'rear'
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  Rear View
                </button>
              </div>
            </div>
            <RackVisualization servers={servers} view={rackView} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerCalculator;