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

// Atualizar a interface do processador para incluir maxSockets, preço e preço2
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
  price?: number;
  price2?: number;
}

// Lista completa de processadores Intel Xeon com SAPS e suporte a sockets
const processors: Processor[] = [
  // Platinum Series (4-8 sockets)
  { model: "Intel Xeon Platinum 8593Q", cores: 64, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 385, maxSockets: 8, sapsTotal: 2048000, price: 163738.08, price2: 327476.16 },
  { model: "Intel Xeon Platinum 8592V", cores: 64, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 330, maxSockets: 8, sapsTotal: 1888000, price: 143040, price2: 286080 },
  { model: "Intel Xeon Platinum 8592+", cores: 64, clock: 1.9, sapsPerCore: 1520, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1856000, price: 148000, price2: 296000 },
  { model: "Intel Xeon Platinum 8581V", cores: 60, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 270, maxSockets: 8, sapsTotal: 1760000, price: 132000, price2: 264000 },
  { model: "Intel Xeon Platinum 8580", cores: 60, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1760000, price: 132000, price2: 264000 },
  { model: "Intel Xeon Platinum 8571N", cores: 52, clock: 2.4, sapsPerCore: 1920, maxMemory: 4096, tdp: 300, maxSockets: 8, sapsTotal: 1728000, price: 112000, price2: 224000 },
  { model: "Intel Xeon Platinum 8570", cores: 56, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1728000, price: 132000, price2: 264000 },
  { model: "Intel Xeon Platinum 8568Y+", cores: 48, clock: 2.3, sapsPerCore: 1840, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1664000, price: 128000, price2: 256000 },
  { model: "Intel Xeon Platinum 8562Y+", cores: 32, clock: 2.8, sapsPerCore: 2240, maxMemory: 4096, tdp: 300, maxSockets: 8, sapsTotal: 1664000, price: 102400, price2: 204800 },
  { model: "Intel Xeon Platinum 8558U", cores: 48, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 300, maxSockets: 8, sapsTotal: 1568000, price: 112000, price2: 224000 },
  { model: "Intel Xeon Platinum 8558P", cores: 48, clock: 2.7, sapsPerCore: 2160, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1824000, price: 148000, price2: 296000 },
  { model: "Intel Xeon Platinum 8558", cores: 48, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 330, maxSockets: 8, sapsTotal: 1568000, price: 112000, price2: 224000 },
  { model: "Intel Xeon Platinum 8490H", cores: 60, clock: 1.9, sapsPerCore: 1520, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1760000, price: 132000, price2: 264000 },
  { model: "Intel Xeon Platinum 8480+", cores: 56, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1760000, price: 128000, price2: 256000 },
  { model: "Intel Xeon Platinum 8471N", cores: 52, clock: 1.8, sapsPerCore: 1440, maxMemory: 4096, tdp: 300, maxSockets: 8, sapsTotal: 1696000, price: 102400, price2: 204800 },
  { model: "Intel Xeon Platinum 8470Q", cores: 52, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1696000, price: 128000, price2: 256000 },
  { model: "Intel Xeon Platinum 8470N", cores: 52, clock: 1.7, sapsPerCore: 1360, maxMemory: 4096, tdp: 300, maxSockets: 8, sapsTotal: 1664000, price: 102400, price2: 204800 },
  { model: "Intel Xeon Platinum 8470", cores: 52, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1664000, price: 128000, price2: 256000 },
  { model: "Intel Xeon Platinum 8468V", cores: 48, clock: 2.4, sapsPerCore: 1920, maxMemory: 4096, tdp: 330, maxSockets: 8, sapsTotal: 1680000, price: 128000, price2: 256000 },
  { model: "Intel Xeon Platinum 8468H", cores: 48, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 330, maxSockets: 8, sapsTotal: 1632000, price: 102400, price2: 204800 },
  { model: "Intel Xeon Platinum 8468", cores: 48, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1632000, price: 128000, price2: 256000 },
  { model: "Intel Xeon Platinum 8462Y+", cores: 32, clock: 2.8, sapsPerCore: 2240, maxMemory: 4096, tdp: 300, maxSockets: 8, sapsTotal: 616000, price: 51200, price2: 102400 },
  { model: "Intel Xeon Platinum 8461V", cores: 48, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 300, maxSockets: 8, sapsTotal: 1648000, price: 128000, price2: 256000 },
  { model: "Intel Xeon Platinum 8460Y+", cores: 40, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 300, maxSockets: 8, sapsTotal: 1408000, price: 102400, price2: 204800 },
  { model: "Intel Xeon Platinum 8460H", cores: 40, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 330, maxSockets: 8, sapsTotal: 672000, price: 51200, price2: 102400 },
  { model: "Intel Xeon Platinum 8458P", cores: 44, clock: 2.7, sapsPerCore: 2160, maxMemory: 4096, tdp: 350, maxSockets: 8, sapsTotal: 1824000, price: 148000, price2: 296000 },
  { model: "Intel Xeon Platinum 8454H", cores: 32, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 270, maxSockets: 8, sapsTotal: 560000, price: 80000, price2: 160000 },
  { model: "Intel Xeon Platinum 8452Y", cores: 36, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 300, maxSockets: 8, sapsTotal: 592000, price: 96000, price2: 192000 },
  { model: "Intel Xeon Platinum 8450H", cores: 28, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 250, maxSockets: 8, sapsTotal: 520000, price: 80000, price2: 160000 },
  { model: "Intel Xeon Platinum 8444H", cores: 16, clock: 2.9, sapsPerCore: 2320, maxMemory: 4096, tdp: 270, maxSockets: 8, sapsTotal: 148480, price: 48000, price2: 96000 },

  // Gold Series (2 sockets)
  { model: "Intel Xeon Gold 6558Q", cores: 32, clock: 3.2, sapsPerCore: 2560, maxMemory: 4096, tdp: 350, maxSockets: 2, sapsTotal: 163840, price: 128000, price2: 256000 },
  { model: "Intel Xeon Gold 6554S", cores: 36, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 270, maxSockets: 2, sapsTotal: 128000, price: 102400, price2: 204800 },
  { model: "Intel Xeon Gold 6548Y+", cores: 32, clock: 2.5, sapsPerCore: 2000, maxMemory: 4096, tdp: 250, maxSockets: 2, sapsTotal: 128000, price: 102400, price2: 204800 },
  { model: "Intel Xeon Gold 6548N", cores: 32, clock: 2.8, sapsPerCore: 2240, maxMemory: 4096, tdp: 250, maxSockets: 2, sapsTotal: 140800, price: 112000, price2: 224000 },
  { model: "Intel Xeon Gold 6544Y", cores: 16, clock: 3.6, sapsPerCore: 2880, maxMemory: 4096, tdp: 270, maxSockets: 2, sapsTotal: 115200, price: 80000, price2: 160000 },
  { model: "Intel Xeon Gold 6542Y", cores: 24, clock: 2.9, sapsPerCore: 2320, maxMemory: 4096, tdp: 250, maxSockets: 2, sapsTotal: 139200, price: 102400, price2: 204800 },
  { model: "Intel Xeon Gold 6538Y+", cores: 32, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 225, maxSockets: 2, sapsTotal: 140800, price: 112000, price2: 224000 },
  { model: "Intel Xeon Gold 6538N", cores: 32, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 205, maxSockets: 2, sapsTotal: 128000, price: 96000, price2: 192000 },
  { model: "Intel Xeon Gold 6534", cores: 8, clock: 3.9, sapsPerCore: 3120, maxMemory: 4096, tdp: 195, maxSockets: 2, sapsTotal: 156800, price: 72000, price2: 144000 },
  { model: "Intel Xeon Gold 6530", cores: 32, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 270, maxSockets: 2, sapsTotal: 140800, price: 102400, price2: 204800 },
  { model: "Intel Xeon Gold 6526Y", cores: 16, clock: 2.8, sapsPerCore: 2240, maxMemory: 4096, tdp: 195, maxSockets: 2, sapsTotal: 128000, price: 80000, price2: 160000 },
  { model: "Intel Xeon Gold 5520+", cores: 28, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 205, maxSockets: 2, sapsTotal: 140800, price: 102400, price2: 204800 },
  { model: "Intel Xeon Gold 5515+", cores: 8, clock: 3.2, sapsPerCore: 2560, maxMemory: 4096, tdp: 165, maxSockets: 2, sapsTotal: 128000, price: 80000, price2: 160000 },
  { model: "Intel Xeon Gold 5512U", cores: 28, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 185, maxSockets: 2, sapsTotal: 140800, price: 96000, price2: 192000 },
  { model: "Intel Xeon Gold 6458Q", cores: 32, clock: 3.1, sapsPerCore: 2480, maxMemory: 4096, tdp: 350, maxSockets: 2, sapsTotal: 198400, price: 158400, price2: 316800 },
  { model: "Intel Xeon Gold 6454S", cores: 32, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 270, maxSockets: 2, sapsTotal: 140800, price: 102400, price2: 204800 },
  { model: "Intel Xeon Gold 6448Y", cores: 32, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 225, maxSockets: 2, sapsTotal: 128000, price: 96000, price2: 192000 },
  { model: "Intel Xeon Gold 6448H", cores: 32, clock: 2.4, sapsPerCore: 1920, maxMemory: 4096, tdp: 250, maxSockets: 2, sapsTotal: 140800, price: 102400, price2: 204800 },
  { model: "Intel Xeon Gold 6444Y", cores: 16, clock: 3.6, sapsPerCore: 2880, maxMemory: 4096, tdp: 270, maxSockets: 2, sapsTotal: 115200, price: 80000, price2: 160000 },
  { model: "Intel Xeon Gold 6442Y", cores: 24, clock: 2.6, sapsPerCore: 2080, maxMemory: 4096, tdp: 225, maxSockets: 2, sapsTotal: 139200, price: 96000, price2: 192000 },
  { model: "Intel Xeon Gold 6438Y+", cores: 32, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 205, maxSockets: 2, sapsTotal: 128000, price: 96000, price2: 192000 },
  { model: "Intel Xeon Gold 6438N", cores: 32, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 205, maxSockets: 2, sapsTotal: 128000, price: 96000, price2: 192000 },
  { model: "Intel Xeon Gold 6438M", cores: 32, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 205, maxSockets: 2, sapsTotal: 140800, price: 102400, price2: 204800 },
  { model: "Intel Xeon Gold 6434H", cores: 8, clock: 3.7, sapsPerCore: 2960, maxMemory: 4096, tdp: 195, maxSockets: 2, sapsTotal: 140800, price: 72000, price2: 144000 },
  { model: "Intel Xeon Gold 6434", cores: 8, clock: 3.7, sapsPerCore: 2960, maxMemory: 4096, tdp: 195, maxSockets: 2, sapsTotal: 140800, price: 72000, price2: 144000 },
  { model: "Intel Xeon Gold 6430", cores: 32, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 270, maxSockets: 2, sapsTotal: 140800, price: 102400, price2: 204800 },
  { model: "Intel Xeon Gold 6428N", cores: 32, clock: 1.8, sapsPerCore: 1440, maxMemory: 4096, tdp: 185, maxSockets: 2, sapsTotal: 128000, price: 80000, price2: 160000 },
  { model: "Intel Xeon Gold 6426Y", cores: 16, clock: 2.5, sapsPerCore: 2000, maxMemory: 4096, tdp: 185, maxSockets: 2, sapsTotal: 140800, price: 96000, price2: 192000 },
  { model: "Intel Xeon Gold 6421N", cores: 32, clock: 1.8, sapsPerCore: 1440, maxMemory: 4096, tdp: 185, maxSockets: 2, sapsTotal: 128000, price: 96000, price2: 192000 },
  { model: "Intel Xeon Gold 6418H", cores: 24, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 185, maxSockets: 2, sapsTotal: 140800, price: 96000, price2: 192000 },
  { model: "Intel Xeon Gold 6416H", cores: 18, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 165, maxSockets: 2, sapsTotal: 128000, price: 80000, price2: 160000 },
  { model: "Intel Xeon Gold 6414U", cores: 32, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 250, maxSockets: 2, sapsTotal: 140800, price: 102400, price2: 204800 },
  { model: "Intel Xeon Gold 5433N", cores: 20, clock: 2.3, sapsPerCore: 1840, maxMemory: 4096, tdp: 160, maxSockets: 2, sapsTotal: 128000, price: 80000, price2: 160000 },
  { model: "Intel Xeon Gold 5423N", cores: 20, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 145, maxSockets: 2, sapsTotal: 128000, price: 72000, price2: 144000 },
  { model: "Intel Xeon Gold 5420+", cores: 28, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 205, maxSockets: 2, sapsTotal: 140800, price: 96000, price2: 192000 },
  { model: "Intel Xeon Gold 5418Y", cores: 24, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 185, maxSockets: 2, sapsTotal: 128000, price: 80000, price2: 160000 },
  { model: "Intel Xeon Gold 5418N", cores: 24, clock: 1.8, sapsPerCore: 1440, maxMemory: 4096, tdp: 165, maxSockets: 2, sapsTotal: 128000, price: 72000, price2: 144000 },
  { model: "Intel Xeon Gold 5416S", cores: 16, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 150, maxSockets: 2, sapsTotal: 128000, price: 64000, price2: 128000 },
  { model: "Intel Xeon Gold 5415+", cores: 8, clock: 2.9, sapsPerCore: 2320, maxMemory: 4096, tdp: 150, maxSockets: 2, sapsTotal: 140800, price: 80000, price2: 160000 },
  { model: "Intel Xeon Gold 5412U", cores: 24, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 185, maxSockets: 2, sapsTotal: 140800, price: 96000, price2: 192000 },
  { model: "Intel Xeon Gold 5411N", cores: 24, clock: 1.9, sapsPerCore: 1520, maxMemory: 4096, tdp: 165, maxSockets: 2, sapsTotal: 128000, price: 80000, price2: 160000 },
  { model: "Intel Xeon Gold 5403N", cores: 12, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 115, maxSockets: 2, sapsTotal: 128000, price: 48000, price2: 96000 },

  // Silver Series (2 sockets)
  { model: "Intel Xeon Silver 4516Y+", cores: 24, clock: 2.2, sapsPerCore: 1760, maxMemory: 4096, tdp: 185, maxSockets: 2, sapsTotal: 140800, price: 96000, price2: 192000 },
  { model: "Intel Xeon Silver 4514Y", cores: 16, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 150, maxSockets: 2, sapsTotal: 128000, price: 64000, price2: 128000 },
  { model: "Intel Xeon Silver 4510T", cores: 12, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 115, maxSockets: 2, sapsTotal: 128000, price: 48000, price2: 96000 },
  { model: "Intel Xeon Silver 4510", cores: 12, clock: 2.4, sapsPerCore: 1920, maxMemory: 4096, tdp: 150, maxSockets: 2, sapsTotal: 140800, price: 64000, price2: 128000 },
  { model: "Intel Xeon Silver 4509Y", cores: 8, clock: 2.6, sapsPerCore: 2080, maxMemory: 4096, tdp: 125, maxSockets: 2, sapsTotal: 128000, price: 52000, price2: 104000 },
  { model: "Intel Xeon Silver 4416+", cores: 20, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 165, maxSockets: 2, sapsTotal: 140800, price: 80000, price2: 160000 },
  { model: "Intel Xeon Silver 4410Y", cores: 12, clock: 2.0, sapsPerCore: 1600, maxMemory: 4096, tdp: 150, maxSockets: 2, sapsTotal: 128000, price: 64000, price2: 128000 },
  { model: "Intel Xeon Silver 4410T", cores: 10, clock: 2.7, sapsPerCore: 2160, maxMemory: 4096, tdp: 150, maxSockets: 2, sapsTotal: 140800, price: 72000, price2: 144000 },

  // Bronze Series (2 sockets)
  { model: "Intel Xeon Bronze 3508U", cores: 8, clock: 2.1, sapsPerCore: 1680, maxMemory: 4096, tdp: 125, maxSockets: 2, sapsTotal: 128000, price: 52000, price2: 104000 },
  { model: "Intel Xeon Bronze 3408U", cores: 8, clock: 1.8, sapsPerCore: 1440, maxMemory: 4096, tdp: 125, maxSockets: 2, sapsTotal: 128000, price: 48000, price2: 96000 }
];

// Lista de processadores de 2 soquetes
const processors2Sockets = [
  { name: 'Intel Xeon Silver 4509Y 8C 125W 2.6GHz', cores: 8, saps: 12000, price: 11715.84, price2: 23431.68 },
  { name: 'Intel Xeon Bronze 3408U 8C 125W 1.8GHz', cores: 8, saps: 8500, price: 8622.37, price2: 17244.74 },
  { name: 'Intel Xeon Gold 6438Y+ 32C 205W 2.0GHz', cores: 32, saps: 48000, price: 53144.47, price2: 106288.14 },
  // ... (preencher com todos os processadores da imagem de 2 soquetes)
];

// Lista de processadores de 4 soquetes
const processors4Sockets = [
  { name: 'Intel Xeon Gold 6434H 8C 195W 3.7GHz', cores: 8, saps: 22000, price: 257835.87, price2: 515671.74 },
  { name: 'Intel Xeon Gold 6416H 18C 165W 2.2GHz', cores: 18, saps: 28000, price: 26323.09, price2: 52646.18 },
  { name: 'Intel Xeon Gold 6418H 24C 185W 2.1GHz', cores: 24, saps: 38000, price: 36522.04, price2: 73044.08 },
  { name: 'Intel Xeon Platinum 8444H 16C 270W 2.9GHz', cores: 16, saps: 35000, price: 72012.18, price2: 144024.36 },
  { name: 'Intel Xeon Platinum 8450H 28C 250W 2.0GHz', cores: 28, saps: 45000, price: 76504.57, price2: 153009.14 },
  { name: 'Intel Xeon Platinum 8454H 32C 270W 2.1GHz', cores: 32, saps: 60000, price: 108000.22, price2: 216000.44 },
  { name: 'Intel Xeon Platinum 8460H 40C 330W 2.2GHz', cores: 40, saps: 70000, price: 175009.93, price2: 350019.86 },
  { name: 'Intel Xeon Platinum 8468H 48C 330W 2.1GHz', cores: 48, saps: 85000, price: 260500.37, price2: 521000.74 },
  { name: 'Intel Xeon Platinum 8490H 60C 350W 1.9GHz', cores: 60, saps: 110000, price: 279185.54, price2: 558371.08 },
  { name: 'Intel Xeon Gold 6448H 32C 250W 2.4GHz', cores: 32, saps: 55000, price: 65892.76, price2: 131785.52 },
];

// Lista de processadores de 8 soquetes
const processors8Sockets = [
  { name: 'Intel Xeon Platinum 8490H 60C 350W 1.9GHz', cores: 60, saps: 110000, price: 2589779.58, price2: 5179559.16 },
  { name: 'Intel Xeon Platinum 8444H 16C 270W 2.9GHz', cores: 16, saps: 35000, price: 83499.93, price2: 166999.86 },
  { name: 'Intel Xeon Platinum 8450H 28C 250W 2.0GHz', cores: 28, saps: 45000, price: 88709.03, price2: 177418.06 },
  { name: 'Intel Xeon Platinum 8454H 32C 270W 2.1GHz', cores: 32, saps: 60000, price: 125228.90, price2: 250457.80 },
  { name: 'Intel Xeon Platinum 8460H 40C 330W 2.2GHz', cores: 40, saps: 70000, price: 202928.51, price2: 405857.02 },
  { name: 'Intel Xeon Platinum 8468H 48C 330W 2.1GHz', cores: 48, saps: 85000, price: 303075.48, price2: 606150.96 },
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
  const neededSAPS = Math.ceil(requiredSAPS / 0.65);
  let requiredSockets = 2;
  if (requiredMemory > 4096) {
    if (requiredMemory > 8192) {
      requiredSockets = 8;
    } else {
      requiredSockets = 4;
    }
  }
  const suitableProcessors = processors.filter(p => p.maxSockets >= requiredSockets && (p.sapsTotal || 0) >= neededSAPS);
  // Ordenar por preço (menor primeiro), depois por TDP
  const sortedProcessors = suitableProcessors.sort((a, b) => {
    const priceA = a.price2 || a.price || 0;
    const priceB = b.price2 || b.price || 0;
    if (priceA !== priceB) return priceA - priceB;
    return a.tdp - b.tdp;
  });
  const selectedProcessor = sortedProcessors[0] || processors[0];
  const memoryPerCore = 16;
  const totalCores = selectedProcessor.cores * requiredSockets;
  const calculatedMemory = totalCores * memoryPerCore;
  const maxMemory = requiredSockets === 2 ? 4096 : requiredSockets === 4 ? 8192 : 16384;
  const memory = Math.min(calculatedMemory, maxMemory);
  return {
    processor: selectedProcessor,
    sockets: requiredSockets,
    cores: totalCores,
    saps: (selectedProcessor.sapsTotal || 0),
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
  } | null;
  qa: {
    processor: Processor;
    sockets: number;
    memory: number;
    saps: number;
  } | null;
  dev: {
    processor: Processor;
    sockets: number;
    memory: number;
    saps: number;
  } | null;
  applications: {
    processor: Processor;
    sockets: number;
    memory: number;
    saps: number;
  } | null;
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
  const [combineQaDev, setCombineQaDev] = useState(false);

  const handleInputChange = (field: string, value: string | number) => {
    setInputs(prev => {
      const newInputs = { ...prev, [field]: Number(value) };

      // Só calcula resultados se houver pelo menos um valor de entrada
      const hasProd = newInputs.prodSaps > 0 || newInputs.prodMemory > 0;
      const hasQa = newInputs.qaSaps > 0 || newInputs.qaMemory > 0;
      const hasDev = newInputs.devSaps > 0 || newInputs.devMemory > 0;
      const hasApp = newInputs.appSaps > 0 || newInputs.appMemory > 0;

      if (hasProd || hasQa || hasDev || hasApp) {
        const prod = hasProd ? calculateSizingBySAPS(newInputs.prodSaps, newInputs.prodMemory) : null;
        const app = hasApp ? calculateSizingBySAPS(newInputs.appSaps, newInputs.appMemory) : null;

        if (combineQaDev) {
          const qaDevMemory = newInputs.qaMemory + newInputs.devMemory;
          const qaDevSaps = newInputs.qaSaps + newInputs.devSaps;
          const qaDev = (hasQa || hasDev) ? calculateSizingBySAPS(qaDevSaps, qaDevMemory) : null;
          setResults({
            production: prod,
            qa: qaDev,
            dev: qaDev,
            applications: app
          });
        } else {
          const qa = hasQa ? calculateSizingBySAPS(newInputs.qaSaps, newInputs.qaMemory) : null;
          const dev = hasDev ? calculateSizingBySAPS(newInputs.devSaps, newInputs.devMemory) : null;
          setResults({
            production: prod,
            qa,
            dev,
            applications: app
          });
        }
      } else {
        setResults(null);
      }
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

                {/* QA/DEV Combine Switch */}
                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600 shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-yellow-400" />
                    Combine QA/DEV
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={combineQaDev ? "default" : "outline"}
                      onClick={() => {
                        setCombineQaDev(!combineQaDev);
                        // Recalcular resultados quando o estado mudar
                        handleInputChange('utilization', inputs.utilization);
                      }}
                      className={`${combineQaDev ? 'bg-blue-600 hover:bg-blue-700' : 'bg-zinc-700 hover:bg-zinc-600'} text-white`}
                    >
                      {combineQaDev ? 'Combinado' : 'Separado'}
                    </Button>
                    <span className="text-zinc-300 text-sm">
                      {combineQaDev ? 'QA e DEV compartilharão o mesmo hardware' : 'QA e DEV terão hardwares separados'}
                    </span>
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
                {results?.production && (() => {
                  const prod = results.production;
                  return (
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
                            <span className="text-white font-medium">{prod.processor.model || '-'}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Cores:</span>
                            <br />
                            <span className="text-white font-medium">{calculateTotalCores(prod.processor, prod.sockets)}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Sockets:</span>
                            <br />
                            <span className="text-white font-medium">{prod.sockets || '-'}</span>
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">SAPS:</span>
                            <br />
                            <span className="text-white font-medium">{prod.saps.toLocaleString() || '-'}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Memory:</span>
                            <br />
                            <span className="text-white font-medium">{prod.memory || '-'} GB</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">TDP:</span>
                            <br />
                            <span className="text-white font-medium">{prod.processor.tdp || '-'}W</span>
                          </p>
                        </div>
                        <p className="text-zinc-300">
                          <span className="text-zinc-400">Preço 2 CPUs:</span>
                          <br />
                          <span className="text-white font-medium">{prod.processor.price2 ? `R$ ${prod.processor.price2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</span>
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* QA Results */}
                {results?.qa && (() => {
                  const qa = results.qa;
                  return (
                    <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600 shadow-lg hover:shadow-xl transition-shadow">
                      <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <Server className="w-5 h-5 text-yellow-400" />
                        {combineQaDev ? 'QA/DEV Results' : 'QA Results'}
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Processor:</span>
                            <br />
                            <span className="text-white font-medium">{qa.processor.model || '-'}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Cores:</span>
                            <br />
                            <span className="text-white font-medium">{calculateTotalCores(qa.processor, qa.sockets)}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Sockets:</span>
                            <br />
                            <span className="text-white font-medium">{qa.sockets || '-'}</span>
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">SAPS:</span>
                            <br />
                            <span className="text-white font-medium">{qa.saps.toLocaleString() || '-'}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Memory:</span>
                            <br />
                            <span className="text-white font-medium">{qa.memory || '-'} GB</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">TDP:</span>
                            <br />
                            <span className="text-white font-medium">{qa.processor.tdp || '-'}W</span>
                          </p>
                        </div>
                        <p className="text-zinc-300">
                          <span className="text-zinc-400">Preço 2 CPUs:</span>
                          <br />
                          <span className="text-white font-medium">{qa.processor.price2 ? `R$ ${qa.processor.price2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</span>
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* DEV Results - Só mostra se não estiver combinado */}
                {!combineQaDev && results?.dev && (() => {
                  const dev = results.dev;
                  return (
                    <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-700/80 rounded-lg p-4 border border-zinc-600 shadow-lg hover:shadow-xl transition-shadow">
                      <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <Server className="w-5 h-5 text-purple-400" />
                        DEV Results
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Processor:</span>
                            <br />
                            <span className="text-white font-medium">{dev.processor.model || '-'}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Cores:</span>
                            <br />
                            <span className="text-white font-medium">{calculateTotalCores(dev.processor, dev.sockets)}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Sockets:</span>
                            <br />
                            <span className="text-white font-medium">{dev.sockets || '-'}</span>
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">SAPS:</span>
                            <br />
                            <span className="text-white font-medium">{dev.saps.toLocaleString() || '-'}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Memory:</span>
                            <br />
                            <span className="text-white font-medium">{dev.memory || '-'} GB</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">TDP:</span>
                            <br />
                            <span className="text-white font-medium">{dev.processor.tdp || '-'}W</span>
                          </p>
                        </div>
                        <p className="text-zinc-300">
                          <span className="text-zinc-400">Preço 2 CPUs:</span>
                          <br />
                          <span className="text-white font-medium">{dev.processor.price2 ? `R$ ${dev.processor.price2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</span>
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Applications Results */}
                {results?.applications && (() => {
                  const app = results.applications;
                  return (
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
                            <span className="text-white font-medium">{app.processor.model || '-'}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Cores:</span>
                            <br />
                            <span className="text-white font-medium">{calculateTotalCores(app.processor, app.sockets)}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Sockets:</span>
                            <br />
                            <span className="text-white font-medium">{app.sockets || '-'}</span>
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">SAPS:</span>
                            <br />
                            <span className="text-white font-medium">{app.saps.toLocaleString() || '-'}</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">Memory:</span>
                            <br />
                            <span className="text-white font-medium">{app.memory || '-'} GB</span>
                          </p>
                          <p className="text-zinc-300">
                            <span className="text-zinc-400">TDP:</span>
                            <br />
                            <span className="text-white font-medium">{app.processor.tdp || '-'}W</span>
                          </p>
                        </div>
                        <p className="text-zinc-300">
                          <span className="text-zinc-400">Preço 2 CPUs:</span>
                          <br />
                          <span className="text-white font-medium">{app.processor.price2 ? `R$ ${app.processor.price2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</span>
                        </p>
                      </div>
                    </div>
                  );
                })()}
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