import React, { useState, useEffect } from 'react';
import { HardDrive, Database, Clock, TrendingUp, BarChart as BarChartIcon, Save, HardDriveDownload } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

interface BackupMetrics {
  dailyBackupSize: number;
  totalBackupSize: number;
  yearlyGrowth: number[];
  storageByRetention: { name: string; value: number; }[];
  backupTimeline: { day: number; size: number; }[];
  storageDetails: {
    raw: number;
    compressed: number;
    withRetention: number;
    projected: number;
  };
}

const formatStorage = (tb: number): string => {
  if (tb >= 1024) {
    return `${(tb / 1024).toFixed(2)} PB`;
  }
  return `${tb.toFixed(2)} TB`;
};

const BackupCalculator = () => {
  const [originalData, setOriginalData] = useState<number>(100); // TB
  const [backupFrequency, setBackupFrequency] = useState<number>(1);
  const [retentionPeriod, setRetentionPeriod] = useState<number>(30);
  const [compressionRatio, setCompressionRatio] = useState<number>(0.5);
  const [changeRate, setChangeRate] = useState<number>(10);
  const [annualGrowth, setAnnualGrowth] = useState<number>(20);
  const [years, setYears] = useState<number>(3);
  const [metrics, setMetrics] = useState<BackupMetrics>({
    dailyBackupSize: 0,
    totalBackupSize: 0,
    yearlyGrowth: [],
    storageByRetention: [],
    backupTimeline: [],
    storageDetails: {
      raw: 0,
      compressed: 0,
      withRetention: 0,
      projected: 0
    }
  });

  const calculateMetrics = () => {
    // Calculate daily backup size
    const dailyChangedData = (originalData * (changeRate / 100));
    const dailyBackupSize = dailyChangedData * compressionRatio * backupFrequency;

    // Calculate total backup size with retention
    const totalBackupSize = dailyBackupSize * retentionPeriod;

    // Calculate yearly growth
    const yearlyGrowth = Array.from({ length: years }, (_, i) => {
      const growth = originalData * Math.pow(1 + (annualGrowth / 100), i + 1);
      return Number(growth.toFixed(2));
    });

    // Calculate storage by retention periods
    const storageByRetention = [
      { name: 'Daily', value: dailyBackupSize },
      { name: 'Weekly', value: dailyBackupSize * 7 },
      { name: 'Monthly', value: dailyBackupSize * 30 },
      { name: 'Yearly', value: dailyBackupSize * 365 }
    ];

    // Generate backup timeline
    const backupTimeline = Array.from({ length: retentionPeriod }, (_, i) => ({
      day: i + 1,
      size: dailyBackupSize * (i + 1)
    }));

    // Calculate detailed storage metrics
    const rawBackupSize = originalData * (changeRate / 100) * backupFrequency;
    const compressedSize = rawBackupSize * compressionRatio;
    const withRetention = compressedSize * retentionPeriod;
    const projectedSize = withRetention * Math.pow(1 + (annualGrowth / 100), years);

    setMetrics({
      dailyBackupSize,
      totalBackupSize,
      yearlyGrowth,
      storageByRetention,
      backupTimeline,
      storageDetails: {
        raw: rawBackupSize,
        compressed: compressedSize,
        withRetention: withRetention,
        projected: projectedSize
      }
    });
  };

  useEffect(() => {
    calculateMetrics();
  }, [originalData, backupFrequency, retentionPeriod, compressionRatio, changeRate, annualGrowth, years]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Database size={20} />
                <span>Daily Backup</span>
              </div>
              <div className="text-2xl font-bold">{formatStorage(metrics.dailyBackupSize)}</div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <HardDrive size={20} />
                <span>Total Storage</span>
              </div>
              <div className="text-2xl font-bold">{formatStorage(metrics.totalBackupSize)}</div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Clock size={20} />
                <span>Retention Days</span>
              </div>
              <div className="text-2xl font-bold">{retentionPeriod}</div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <TrendingUp size={20} />
                <span>Annual Growth</span>
              </div>
              <div className="text-2xl font-bold">{annualGrowth}%</div>
            </div>
          </div>

          <div className="mt-8 bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-6">Storage Requirements Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Save className="text-blue-400" size={24} />
                    <div>
                      <p className="text-sm text-slate-400">Raw Daily Backup</p>
                      <p className="text-lg font-semibold">{formatStorage(metrics.storageDetails.raw)}</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-400">
                    Before Compression
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <HardDriveDownload className="text-emerald-400" size={24} />
                    <div>
                      <p className="text-sm text-slate-400">Compressed Size</p>
                      <p className="text-lg font-semibold">{formatStorage(metrics.storageDetails.compressed)}</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-400">
                    {((1 - compressionRatio) * 100).toFixed(0)}% Reduction
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="text-yellow-400" size={24} />
                    <div>
                      <p className="text-sm text-slate-400">With Retention</p>
                      <p className="text-lg font-semibold">{formatStorage(metrics.storageDetails.withRetention)}</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-400">
                    {retentionPeriod} Days
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-red-400" size={24} />
                    <div>
                      <p className="text-sm text-slate-400">Projected ({years} Years)</p>
                      <p className="text-lg font-semibold">{formatStorage(metrics.storageDetails.projected)}</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-400">
                    With {annualGrowth}% Growth
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-6">Backup Parameters</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Original Data Size (TB)
              </label>
              <input
                type="number"
                value={originalData}
                onChange={(e) => setOriginalData(Number(e.target.value))}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Backup Frequency (per day)
              </label>
              <input
                type="number"
                value={backupFrequency}
                onChange={(e) => setBackupFrequency(Number(e.target.value))}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Retention Period (days)
              </label>
              <input
                type="number"
                value={retentionPeriod}
                onChange={(e) => setRetentionPeriod(Number(e.target.value))}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Compression Ratio
              </label>
              <input
                type="number"
                value={compressionRatio}
                onChange={(e) => setCompressionRatio(Number(e.target.value))}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                min="0"
                max="1"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Data Change Rate (%)
              </label>
              <input
                type="number"
                value={changeRate}
                onChange={(e) => setChangeRate(Number(e.target.value))}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Annual Growth Rate (%)
              </label>
              <input
                type="number"
                value={annualGrowth}
                onChange={(e) => setAnnualGrowth(Number(e.target.value))}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Forecast Period (years)
              </label>
              <input
                type="number"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 text-white"
                min="1"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-6">Data Growth Projection</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.yearlyGrowth.map((size, year) => ({ year: year + 1, size }))}>
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value) => formatStorage(Number(value))} />
              <Legend />
              <Line
                type="monotone"
                dataKey="size"
                stroke="#3B82F6"
                name="Total Data Size"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-6">Storage by Retention Period</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={metrics.storageByRetention}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} (${formatStorage(value)})`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {metrics.storageByRetention.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatStorage(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-6">Backup Size Timeline</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={metrics.backupTimeline}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip formatter={(value) => formatStorage(Number(value))} />
            <Legend />
            <Bar
              dataKey="size"
              fill="#3B82F6"
              name="Cumulative Backup Size"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BackupCalculator;