import React from 'react';
import { HardDrive } from 'lucide-react';

interface DiskSlot {
  id: string;
  type: 'SSD' | 'NVMe' | 'NL-SAS' | 'empty';
  formFactor: '2.5' | '3.5';
  capacity?: number;
}

interface ServerDiskVisualizationProps {
  formFactor: '1U' | '2U';
  storageType: 'all-flash' | 'hybrid';
  diskConfig: {
    type: 'SSD' | 'NVMe' | 'NL-SAS';
    formFactor: '2.5' | '3.5';
    selectedDiskId: string | null;
    smallDiskCount: number;
    largeDiskCount: number;
  };
}

const ServerDiskVisualization: React.FC<ServerDiskVisualizationProps> = ({
  formFactor,
  storageType,
  diskConfig
}) => {
  const getDiskSlots = () => {
    const slots: DiskSlot[] = [];
    
    if (storageType === 'all-flash') {
      // Configuração All-Flash: apenas discos de 2.5"
      const maxSmallDisks = formFactor === '1U' ? 12 : 24;
      for (let i = 0; i < maxSmallDisks; i++) {
        const isOccupied = i < diskConfig.smallDiskCount;
        slots.push({
          id: `small-${i}`,
          type: isOccupied ? diskConfig.type : 'empty',
          formFactor: '2.5'
        });
      }
    } else {
      // Configuração Híbrida
      if (formFactor === '1U') {
        // 1U Híbrido: 4 discos de 3.5" + 2 discos de 2.5"
        // Primeiro os discos de 3.5"
        for (let i = 0; i < 4; i++) {
          const isOccupied = i < diskConfig.largeDiskCount;
          slots.push({
            id: `large-${i}`,
            type: isOccupied ? 'NL-SAS' : 'empty',
            formFactor: '3.5'
          });
        }
        // Depois os 2 discos de 2.5"
        for (let i = 0; i < 2; i++) {
          const isOccupied = i < diskConfig.smallDiskCount;
          slots.push({
            id: `small-${i}`,
            type: isOccupied ? (diskConfig.type === 'SSD' || diskConfig.type === 'NVMe' ? diskConfig.type : 'SSD') : 'empty',
            formFactor: '2.5'
          });
        }
      } else {
        // 2U Híbrido: 12 discos de 3.5" + 4 discos de 2.5"
        // Primeiro os discos de 3.5"
        for (let i = 0; i < 12; i++) {
          const isOccupied = i < diskConfig.largeDiskCount;
          slots.push({
            id: `large-${i}`,
            type: isOccupied ? 'NL-SAS' : 'empty',
            formFactor: '3.5'
          });
        }
        // Depois os 4 discos de 2.5"
        for (let i = 0; i < 4; i++) {
          const isOccupied = i < diskConfig.smallDiskCount;
          slots.push({
            id: `small-${i}`,
            type: isOccupied ? (diskConfig.type === 'SSD' || diskConfig.type === 'NVMe' ? diskConfig.type : 'SSD') : 'empty',
            formFactor: '2.5'
          });
        }
      }
    }

    return slots;
  };

  const getDiskColor = (type: string) => {
    switch (type) {
      case 'SSD':
        return 'bg-blue-500';
      case 'NVMe':
        return 'bg-green-500';
      case 'NL-SAS':
        return 'bg-orange-500';
      case 'empty':
        return 'bg-gray-300';
      default:
        return 'bg-gray-300';
    }
  };

  const slots = getDiskSlots();

  return (
    <div className="bg-slate-800/50 p-4 rounded-lg w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">Server Disk Layout</h3>
          <div className="bg-slate-700 text-white text-sm px-3 py-1 rounded">
            {formFactor} {storageType === 'hybrid' ? '(Hybrid)' : '(All-Flash)'}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm">SSD</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm">NVMe</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-sm">NL-SAS</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-300 rounded"></div>
            <span className="text-sm">Empty</span>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Server Chassis */}
        <div className="border-2 border-slate-600 rounded-lg p-4">
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className={`relative ${slot.formFactor === '2.5' ? 'w-8 h-8' : 'w-10 h-10'} 
                  ${getDiskColor(slot.type)} rounded-lg flex items-center justify-center
                  transition-all duration-300 hover:scale-110 cursor-pointer`}
                title={`${slot.type === 'empty' ? 'Empty' : slot.type} ${slot.formFactor}"`}
              >
                <HardDrive className={`w-4 h-4 ${slot.type === 'empty' ? 'text-gray-400' : 'text-white'}`} />
                {slot.type !== 'empty' && (
                  <div className="absolute -top-2 -right-2 bg-slate-800 text-white text-xs px-1 rounded">
                    {slot.formFactor}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disk Configuration Summary */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-slate-700/30 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">2.5" Disks:</span>
            <span className="font-medium">
              {diskConfig.smallDiskCount} / {storageType === 'hybrid' ? 
                (formFactor === '1U' ? '2' : '4') : 
                (formFactor === '1U' ? '12' : '24')}
            </span>
          </div>
          <div className="mt-2 h-2 bg-slate-600 rounded-full overflow-hidden">
            <div 
              className={`h-full ${diskConfig.type === 'SSD' ? 'bg-blue-500' : diskConfig.type === 'NVMe' ? 'bg-green-500' : 'bg-orange-500'} rounded-full`}
              style={{ width: `${(diskConfig.smallDiskCount / (storageType === 'hybrid' ? 
                (formFactor === '1U' ? 2 : 4) : 
                (formFactor === '1U' ? 12 : 24))) * 100}%` }}
            />
          </div>
        </div>
        {storageType === 'hybrid' && (
          <div className="bg-slate-700/30 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">3.5" Disks:</span>
              <span className="font-medium">{diskConfig.largeDiskCount} / {formFactor === '1U' ? '4' : '12'}</span>
            </div>
            <div className="mt-2 h-2 bg-slate-600 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 rounded-full"
                style={{ width: `${(diskConfig.largeDiskCount / (formFactor === '1U' ? 4 : 12)) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerDiskVisualization; 