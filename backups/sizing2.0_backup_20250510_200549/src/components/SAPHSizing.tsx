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
import { Cpu, HardDrive, Database, Server, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Atualizar a interface do processador para incluir maxSockets
interface Processor {
  model: string;
  cores: number;
  clock: number;
  sapsPerCore: number;
  maxMemory: number;
  tdp: number;
  maxSockets: number;
  sapsTotal?: number;
  sapsPerSocket?: number;
}

// Lista completa de processadores Intel Xeon com SAPS e suporte a sockets
const processors: Processor[] = [
  // Platinum Series (4-8 sockets)
  { model: "Intel Xeon Platinum 8593Q", cores: 64, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 385, maxSockets: 8, sapsTotal: 2048000 },
  { model: "Intel Xeon Platinum 8592V", cores: 64, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 330, maxSockets: 8, sapsTotal: 1888000 },
  { model: "Intel Xeon Platinum 8592+", cores: 64, clock: 1.9, sapsPerCore: 1520, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1856000 },
  { model: "Intel Xeon Platinum 8581V", cores: 60, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 270, maxSockets: 8, sapsTotal: 1760000 },
  { model: "Intel Xeon Platinum 8580", cores: 60, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1760000 },
  { model: "Intel Xeon Platinum 8571N", cores: 52, clock: 2.4, sapsPerCore: 1920, maxMemory: 4096, tdp: 300, maxSockets: 8, sapsTotal: 1728000 },
  { model: "Intel Xeon Platinum 8570", cores: 56, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1728000 },
  { model: "Intel Xeon Platinum 8568Y+", cores: 48, clock: 2.3, sapsPerCore: 1840, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1664000 },
  { model: "Intel Xeon Platinum 8562Y+", cores: 32, clock: 2.8, sapsPerCore: 2240, maxMemory: 4096, tdp: 300, maxSockets: 8, sapsTotal: 1664000 },
  { model: "Intel Xeon Platinum 8558U", cores: 48, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 300, maxSockets: 8, sapsTotal: 1568000 },
  { model: "Intel Xeon Platinum 8558P", cores: 48, clock: 2.7, sapsPerCore: 2160, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1824000 },
  { model: "Intel Xeon Platinum 8558", cores: 48, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 330, maxSockets: 8, sapsTotal: 1568000 },
  { model: "Intel Xeon Platinum 8490H", cores: 60, clock: 1.9, sapsPerCore: 1520, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1760000 },
  { model: "Intel Xeon Platinum 8480+", cores: 56, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1760000 },
  { model: "Intel Xeon Platinum 8471N", cores: 52, clock: 1.8, sapsPerCore: 1440, maxMemory: 4096, tdp: 300, maxSockets: 8, sapsTotal: 1696000 },
  { model: "Intel Xeon Platinum 8470Q", cores: 52, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1696000 },
  { model: "Intel Xeon Platinum 8470N", cores: 52, clock: 1.7, sapsPerCore: 1360, maxMemory: 4096, tdp: 300, maxSockets: 8, sapsTotal: 1664000 },
  { model: "Intel Xeon Platinum 8470", cores: 52, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1664000 },
  { model: "Intel Xeon Platinum 8468V", cores: 48, clock: 2.4, sapsPerCore: 1920, maxMemory: 4096, tdp: 330, maxSockets: 8, sapsTotal: 1680000 },
  { model: "Intel Xeon Platinum 8468H", cores: 48, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 330, maxSockets: 8, sapsTotal: 1632000 },
  { model: "Intel Xeon Platinum 8468", cores: 48, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1632000 },
  { model: "Intel Xeon Platinum 8462Y+", cores: 32, clock: 2.8, sapsPerCore: 2240, maxMemory: 4096, tdp: 300, maxSockets: 8, sapsTotal: 616000 },
  { model: "Intel Xeon Platinum 8461V", cores: 48, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 300, maxSockets: 8, sapsTotal: 1648000 },
  { model: "Intel Xeon Platinum 8460Y+", cores: 40, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 300, maxSockets: 8, sapsTotal: 1408000 },
  { model: "Intel Xeon Platinum 8460H", cores: 40, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 330, maxSockets: 8, sapsTotal: 672000 },
  { model: "Intel Xeon Platinum 8458P", cores: 44, clock: 2.7, sapsPerCore: 2160, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1824000 },
  { model: "Intel Xeon Platinum 8454H", cores: 32, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 270, maxSockets: 8, sapsTotal: 560000 },
  { model: "Intel Xeon Platinum 8452Y", cores: 36, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 300, maxSockets: 8, sapsTotal: 592000 },
  { model: "Intel Xeon Platinum 8450H", cores: 28, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 250, maxSockets: 8, sapsTotal: 520000 },
  { model: "Intel Xeon Platinum 8444H", cores: 16, clock: 2.9, sapsPerCore: 2320, maxMemory: 4096, tdp: 270, maxSockets: 8, sapsTotal: 148480 },

  // Gold Series (2 sockets)
  { model: "Intel Xeon Gold 6558Q", cores: 32, clock: 3.2, sapsPerCore: 2560, maxMemory: 4096, tdp: 350, maxSockets: 2, sapsTotal: 163840 },
  { model: "Intel Xeon Gold 6554S", cores: 36, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 270, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Gold 6548Y+", cores: 32, clock: 2.5, sapsPerCore: 2000, maxMemory: 4096, tdp: 250, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Gold 6548N", cores: 32, clock: 2.8, sapsPerCore: 2240, maxMemory: 4096, tdp: 250, maxSockets: 2, sapsTotal: 140800 },
  { model: "Intel Xeon Gold 6544Y", cores: 16, clock: 3.6, sapsPerCore: 2880, maxMemory: 4096, tdp: 270, maxSockets: 2, sapsTotal: 115200 },
  { model: "Intel Xeon Gold 6542Y", cores: 24, clock: 2.9, sapsPerCore: 2320, maxMemory: 4096, tdp: 250, maxSockets: 2, sapsTotal: 139200 },
  { model: "Intel Xeon Gold 6538Y+", cores: 32, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 225, maxSockets: 2, sapsTotal: 140800 },
  { model: "Intel Xeon Gold 6538N", cores: 32, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 205, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Gold 6534", cores: 8, clock: 3.9, sapsPerCore: 3120, maxMemory: 4096, tdp: 195, maxSockets: 2, sapsTotal: 156800 },
  { model: "Intel Xeon Gold 6530", cores: 32, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 270, maxSockets: 2, sapsTotal: 140800 },
  { model: "Intel Xeon Gold 6526Y", cores: 16, clock: 2.8, sapsPerCore: 2240, maxMemory: 4096, tdp: 195, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Gold 5520+", cores: 28, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 205, maxSockets: 2, sapsTotal: 140800 },
  { model: "Intel Xeon Gold 5515+", cores: 8, clock: 3.2, sapsPerCore: 2560, maxMemory: 4096, tdp: 165, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Gold 5512U", cores: 28, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 185, maxSockets: 2, sapsTotal: 140800 },
  { model: "Intel Xeon Gold 6458Q", cores: 32, clock: 3.1, sapsPerCore: 2480, maxMemory: 4096, tdp: 350, maxSockets: 2, sapsTotal: 198400 },
  { model: "Intel Xeon Gold 6454S", cores: 32, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 270, maxSockets: 2, sapsTotal: 140800 },
  { model: "Intel Xeon Gold 6448Y", cores: 32, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 225, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Gold 6448H", cores: 32, clock: 2.4, sapsPerCore: 1920, maxMemory: 4096, tdp: 250, maxSockets: 2, sapsTotal: 140800 },
  { model: "Intel Xeon Gold 6444Y", cores: 16, clock: 3.6, sapsPerCore: 2880, maxMemory: 4096, tdp: 270, maxSockets: 2, sapsTotal: 115200 },
  { model: "Intel Xeon Gold 6442Y", cores: 24, clock: 2.6, sapsPerCore: 2080, maxMemory: 4096, tdp: 225, maxSockets: 2, sapsTotal: 139200 },
  { model: "Intel Xeon Gold 6438Y+", cores: 32, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 205, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Gold 6438N", cores: 32, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 205, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Gold 6438M", cores: 32, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 205, maxSockets: 2, sapsTotal: 140800 },
  { model: "Intel Xeon Gold 6434H", cores: 8, clock: 3.7, sapsPerCore: 2960, maxMemory: 4096, tdp: 195, maxSockets: 2, sapsTotal: 140800 },
  { model: "Intel Xeon Gold 6434", cores: 8, clock: 3.7, sapsPerCore: 2960, maxMemory: 4096, tdp: 195, maxSockets: 2, sapsTotal: 140800 },
  { model: "Intel Xeon Gold 6430", cores: 32, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 270, maxSockets: 2, sapsTotal: 140800 },
  { model: "Intel Xeon Gold 6428N", cores: 32, clock: 1.8, sapsPerCore: 1440, maxMemory: 4096, tdp: 185, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Gold 6426Y", cores: 16, clock: 2.5, sapsPerCore: 2000, maxMemory: 4096, tdp: 185, maxSockets: 2, sapsTotal: 140800 },
  { model: "Intel Xeon Gold 6421N", cores: 32, clock: 1.8, sapsPerCore: 1440, maxMemory: 4096, tdp: 185, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Gold 6418H", cores: 24, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 185, maxSockets: 2, sapsTotal: 140800 },
  { model: "Intel Xeon Gold 6416H", cores: 18, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 165, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Gold 6414U", cores: 32, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 250, maxSockets: 2, sapsTotal: 140800 },
  { model: "Intel Xeon Gold 5433N", cores: 20, clock: 2.3, sapsPerCore: 1840, maxMemory: 4096, tdp: 160, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Gold 5423N", cores: 20, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 145, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Gold 5420+", cores: 28, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 205, maxSockets: 2, sapsTotal: 140800 },
  { model: "Intel Xeon Gold 5418Y", cores: 24, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 185, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Gold 5418N", cores: 24, clock: 1.8, sapsPerCore: 1440, maxMemory: 4096, tdp: 165, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Gold 5416S", cores: 16, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 150, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Gold 5415+", cores: 8, clock: 2.9, sapsPerCore: 2320, maxMemory: 4096, tdp: 150, maxSockets: 2, sapsTotal: 140800 },
  { model: "Intel Xeon Gold 5412U", cores: 24, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 185, maxSockets: 2, sapsTotal: 140800 },
  { model: "Intel Xeon Gold 5411N", cores: 24, clock: 1.9, sapsPerCore: 1520, maxMemory: 4096, tdp: 165, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Gold 5403N", cores: 12, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 115, maxSockets: 2, sapsTotal: 128000 },

  // Silver Series (2 sockets)
  { model: "Intel Xeon Silver 4516Y+", cores: 24, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 185, maxSockets: 2, sapsTotal: 140800 },
  { model: "Intel Xeon Silver 4514Y", cores: 16, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 150, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Silver 4510T", cores: 12, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 115, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Silver 4510", cores: 12, clock: 2.4, sapsPerCore: 1920, maxMemory: 4096, tdp: 150, maxSockets: 2, sapsTotal: 140800 },
  { model: "Intel Xeon Silver 4509Y", cores: 8, clock: 2.6, sapsPerCore: 2080, maxMemory: 4096, tdp: 125, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Silver 4416+", cores: 20, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 165, maxSockets: 2, sapsTotal: 140800 },
  { model: "Intel Xeon Silver 4410Y", cores: 12, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 150, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Silver 4410T", cores: 10, clock: 2.7, sapsPerCore: 2160, maxMemory: 4096, tdp: 150, maxSockets: 2, sapsTotal: 140800 },

  // Bronze Series (2 sockets)
  { model: "Intel Xeon Bronze 3508U", cores: 8, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 125, maxSockets: 2, sapsTotal: 128000 },
  { model: "Intel Xeon Bronze 3408U", cores: 8, clock: 1.8, sapsPerCore: 1440, maxMemory: 4096, tdp: 125, maxSockets: 2, sapsTotal: 128000 }
];

// Listas específicas para 4 e 8 sockets
const processors4Sockets: Processor[] = [
  { model: "Xeon Platinum 8460H", cores: 40, clock: 2.2, sapsPerCore: 0, maxMemory: 4096, tdp: 330, maxSockets: 4, sapsPerSocket: 168000, sapsTotal: 672000 },
  { model: "Xeon Platinum 8462Y+", cores: 32, clock: 2.8, sapsPerCore: 0, maxMemory: 4096, tdp: 300, maxSockets: 4, sapsPerSocket: 154000, sapsTotal: 616000 },
  { model: "Xeon Platinum 8452Y", cores: 36, clock: 2.0, sapsPerCore: 0, maxMemory: 4096, tdp: 300, maxSockets: 4, sapsPerSocket: 148000, sapsTotal: 592000 },
  { model: "Xeon Platinum 8454H", cores: 32, clock: 2.1, sapsPerCore: 0, maxMemory: 4096, tdp: 270, maxSockets: 4, sapsPerSocket: 140000, sapsTotal: 560000 },
  { model: "Xeon Platinum 8450H", cores: 28, clock: 2.0, sapsPerCore: 0, maxMemory: 4096, tdp: 250, maxSockets: 4, sapsPerSocket: 130000, sapsTotal: 520000 },
  { model: "Xeon Gold 6418H", cores: 24, clock: 2.1, sapsPerCore: 0, maxMemory: 4096, tdp: 185, maxSockets: 4, sapsPerSocket: 105000, sapsTotal: 140800 },
  { model: "Xeon Platinum 8444H", cores: 16, clock: 2.9, sapsPerCore: 0, maxMemory: 4096, tdp: 270, maxSockets: 4, sapsPerSocket: 92000, sapsTotal: 148480 },
  { model: "Xeon Gold 6416H", cores: 18, clock: 2.2, sapsPerCore: 0, maxMemory: 4096, tdp: 165, maxSockets: 4, sapsPerSocket: 86000, sapsTotal: 128000 },
  { model: "Xeon Gold 6434H", cores: 8, clock: 3.7, sapsPerCore: 0, maxMemory: 4096, tdp: 205, maxSockets: 4, sapsPerSocket: 68000, sapsTotal: 140800 },
];

const processors8Sockets: Processor[] = [
  { model: "Xeon Platinum 8593Q", cores: 64, clock: 2.2, sapsPerCore: 0, maxMemory: 4096, tdp: 385, maxSockets: 8, sapsTotal: 2048000 },
  { model: "Xeon Platinum 8592+", cores: 64, clock: 1.9, sapsPerCore: 0, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1856000 },
  { model: "Xeon Platinum 8592V", cores: 64, clock: 2.0, sapsPerCore: 0, maxMemory: 4096, tdp: 330, maxSockets: 8, sapsTotal: 1888000 },
  { model: "Xeon Platinum 8580", cores: 60, clock: 2.0, sapsPerCore: 0, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1760000 },
  { model: "Xeon Platinum 8570", cores: 56, clock: 2.1, sapsPerCore: 0, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1728000 },
  { model: "Xeon Platinum 8568Y+", cores: 48, clock: 2.3, sapsPerCore: 0, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1664000 },
  { model: "Xeon Platinum 8558P", cores: 48, clock: 2.7, sapsPerCore: 0, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1824000 },
  { model: "Xeon Platinum 8558", cores: 48, clock: 2.1, sapsPerCore: 0, maxMemory: 4096, tdp: 330, maxSockets: 8, sapsTotal: 1568000 },
  { model: "Xeon Platinum 8480+", cores: 56, clock: 2.0, sapsPerCore: 0, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1760000 },
  { model: "Xeon Platinum 8470Q", cores: 52, clock: 2.1, sapsPerCore: 0, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1696000 },
  { model: "Xeon Platinum 8470", cores: 52, clock: 2.0, sapsPerCore: 0, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1664000 },
  { model: "Xeon Platinum 8468V", cores: 48, clock: 2.4, sapsPerCore: 0, maxMemory: 4096, tdp: 330, maxSockets: 8, sapsTotal: 1680000 },
  { model: "Xeon Platinum 8468", cores: 48, clock: 2.1, sapsPerCore: 0, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1632000 },
  { model: "Xeon Platinum 8461V", cores: 48, clock: 2.2, sapsPerCore: 0, maxMemory: 4096, tdp: 300, maxSockets: 8, sapsTotal: 1648000 },
  { model: "Xeon Platinum 8558", cores: 48, clock: 2.1, sapsPerCore: 0, maxMemory: 4096, tdp: 330, maxSockets: 8, sapsTotal: 1568000 },
  { model: "Xeon Platinum 8460H", cores: 40, clock: 2.2, sapsPerCore: 0, maxMemory: 4096, tdp: 330, maxSockets: 8, sapsTotal: 1472000 },
  { model: "Xeon Platinum 8460Y+", cores: 40, clock: 2.0, sapsPerCore: 0, maxMemory: 4096, tdp: 300, maxSockets: 8, sapsTotal: 1408000 },
];

// Função para obter o limite de memória baseado no número de sockets
function getMaxMemoryBySockets(sockets: number): number {
  if (sockets <= 2) return 4096; // 4TB
  if (sockets <= 4) return 8192; // 8TB
  return 16384; // 16TB
}

// Função para calcular SAPS baseado no processador
const calculateSAPS = (processor: Processor, sockets: number) => {
  const sapsPerSocket = processor.sapsPerCore * processor.cores;
  return sapsPerSocket * sockets;
};

// Função para calcular o tamanho baseado em SAPS
const calculateSizingBySAPS = (requiredSAPS: number, requiredMemory: number) => {
  // Calcula SAPS totais necessários considerando a utilização
  const neededSAPS = Math.ceil(requiredSAPS / 0.65);
  
  // Determina o número de sockets necessário baseado na memória
  let requiredSockets = 2;
  if (requiredMemory > 4096) { // Acima de 4TB
    if (requiredMemory > 8192) { // Acima de 8TB
      requiredSockets = 8;
    } else {
      requiredSockets = 4;
    }
  }
  
  // Filtra processadores que suportam o número de sockets necessário
  const suitableProcessors = processors.filter(p => p.maxSockets >= requiredSockets);
  
  // Ordena por SAPS total e TDP
  const sortedProcessors = suitableProcessors.sort((a, b) => {
    // Primeiro critério: SAPS total
    const sapsA = a.sapsTotal || 0;
    const sapsB = b.sapsTotal || 0;
    const sapsDiff = sapsB - sapsA;
    if (sapsDiff !== 0) return sapsDiff;
    
    // Segundo critério: TDP (menor é melhor)
    return a.tdp - b.tdp;
  });

  // Encontra o processador mais econômico que atende aos requisitos
  const selectedProcessor = sortedProcessors.find(p => {
    const processorSAPS = p.sapsTotal || 0;
    return processorSAPS >= neededSAPS;
  });

  if (!selectedProcessor) {
    return {
      processor: processors[0], // Fallback to first processor
      sockets: requiredSockets,
      cores: 0,
      saps: 0,
      memory: 0
    };
  }

  // Calcula memória baseada no número de cores e sockets
  const memoryPerCore = 16; // 16GB por core
  const totalCores = selectedProcessor.cores * requiredSockets;
  const calculatedMemory = totalCores * memoryPerCore;

  // Limita a memória ao máximo permitido para o número de sockets
  const maxMemory = requiredSockets === 2 ? 4096 : requiredSockets === 4 ? 8192 : 16384;
  const memory = Math.min(calculatedMemory, maxMemory);

  return {
    processor: selectedProcessor,
    sockets: requiredSockets,
    cores: totalCores,
    saps: selectedProcessor.sapsTotal || 0,
    memory
  };
};

// Função para calcular o tamanho baseado em memória
const calculateSizingByMemory = (memory: number, utilization: number) => {
  // Encontrar o processador mais adequado baseado na memória necessária
  const requiredMemory = memory / (utilization / 100);
  const memoryPerCore = 4; // 4GB por core como base
  const requiredCores = Math.ceil(requiredMemory / memoryPerCore);

  const sortedProcessors = [...processors].sort((a, b) => {
    const coresA = a.cores;
    const coresB = b.cores;
    return coresB - coresA;
  });

  // Encontrar o processador que atende aos cores necessários
  const suitableProcessor = sortedProcessors.find(p => p.cores >= requiredCores);
  if (!suitableProcessor) {
    return {
      processor: sortedProcessors[0],
      sockets: Math.ceil(requiredCores / sortedProcessors[0].cores),
      memory: 0,
      saps: 0
    };
  }

  // Calcular número de sockets necessários
  const sockets = Math.ceil(requiredCores / suitableProcessor.cores);
  
  return {
    processor: suitableProcessor,
    sockets,
    memory: suitableProcessor.cores * sockets * memoryPerCore,
    saps: calculateSAPS(suitableProcessor, sockets)
  };
};

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
  [key: string]: number;
}

interface Results {
  production: {
    processor: Processor;
    sockets: number;
    memory: number;
    saps: number;
  };
  qa: {
    processor: Processor;
    sockets: number;
    memory: number;
    saps: number;
  };
  applications: {
    processor: Processor;
    sockets: number;
    memory: number;
    saps: number;
  };
}

// Função auxiliar para calcular o total de cores
const calculateTotalCores = (processor: Processor | undefined, sockets: number | undefined): string => {
  if (!processor?.cores || !sockets) return '-';
  return `${processor.cores * sockets}`;
};

function SAPSizing() {
  const [inputs, setInputs] = useState<Inputs>({
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

  const [results, setResults] = useState<Results | null>(null);

  const handleInputChange = (field: string, value: string | number) => {
    setInputs(prev => {
      const newInputs = { ...prev, [field]: Number(value) };
      // Calcular resultados automaticamente quando os inputs mudarem
      const qaDevMemory = newInputs.qaMemory + newInputs.devMemory;
      const qaDevSaps = newInputs.qaSaps + newInputs.devSaps;

      const prod = calculateSizingBySAPS(newInputs.prodSaps, newInputs.prodMemory);
      const qaDev = calculateSizingBySAPS(qaDevSaps, qaDevMemory);
      const app = calculateSizingBySAPS(newInputs.appSaps, newInputs.appMemory);

      setResults({ production: prod, qa: qaDev, applications: app });
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
                        <span className="text-white font-medium">{results?.production.processor.model || '-'}</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Cores:</span>
                        <br />
                        <span className="text-white font-medium">
                          {calculateTotalCores(results?.production?.processor, results?.production?.sockets)}
                        </span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Sockets:</span>
                        <br />
                        <span className="text-white font-medium">{results?.production.sockets || '-'}</span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">SAPS:</span>
                        <br />
                        <span className="text-white font-medium">{results?.production.saps.toLocaleString() || '-'}</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Memory:</span>
                        <br />
                        <span className="text-white font-medium">{results?.production.memory || '-'} GB</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">TDP:</span>
                        <br />
                        <span className="text-white font-medium">{results?.production.processor.tdp || '-'}W</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* QA/DEV Results */}
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600 shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-yellow-400" />
                    QA/DEV Results
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Processor:</span>
                        <br />
                        <span className="text-white font-medium">{results?.qa.processor.model || '-'}</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Cores:</span>
                        <br />
                        <span className="text-white font-medium">
                          {calculateTotalCores(results?.qa?.processor, results?.qa?.sockets)}
                        </span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Sockets:</span>
                        <br />
                        <span className="text-white font-medium">{results?.qa.sockets || '-'}</span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">SAPS:</span>
                        <br />
                        <span className="text-white font-medium">{results?.qa.saps.toLocaleString() || '-'}</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Memory:</span>
                        <br />
                        <span className="text-white font-medium">{results?.qa.memory || '-'} GB</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">TDP:</span>
                        <br />
                        <span className="text-white font-medium">{results?.qa.processor.tdp || '-'}W</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Applications Results */}
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
                        <span className="text-white font-medium">{results?.applications.processor.model || '-'}</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Cores:</span>
                        <br />
                        <span className="text-white font-medium">
                          {calculateTotalCores(results?.applications?.processor, results?.applications?.sockets)}
                        </span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Sockets:</span>
                        <br />
                        <span className="text-white font-medium">{results?.applications.sockets || '-'}</span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">SAPS:</span>
                        <br />
                        <span className="text-white font-medium">{results?.applications.saps.toLocaleString() || '-'}</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">Memory:</span>
                        <br />
                        <span className="text-white font-medium">{results?.applications.memory || '-'} GB</span>
                      </p>
                      <p className="text-zinc-300">
                        <span className="text-zinc-400">TDP:</span>
                        <br />
                        <span className="text-white font-medium">{results?.applications.processor.tdp || '-'}W</span>
                      </p>
                    </div>
                  </div>
                </div>
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