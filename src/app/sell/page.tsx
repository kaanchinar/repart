"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import Tesseract from "tesseract.js";
import { Loader2, Camera, XCircle, ArrowLeft, ChevronLeft, ChevronRight, SwitchCamera, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { formatAZN } from "@/lib/validators";

type DeviceType = "phone" | "computer";
type Step = 1 | 2 | 3;
type OverlayKey = "front" | "back" | "identifier";

type ConditionAnswerMap = Record<string, string>;

type ConditionOption = {
  id: string;
  label: string;
  helper: string;
  impact: number;
};

type ConditionQuestion = {
  id: string;
  label: string;
  helper: string;
  options: ConditionOption[];
};

type CatalogItem = {
  id: string;
  brand: string;
  name: string;
  basePrice: number;
  floorPrice: number;
  chipset: string;
  storage: string;
  ram: string;
  year: number;
  deviceType: DeviceType;
};

type Adjustment = {
  label: string;
  impact: number;
};

type SelectedPhoto = {
  file: File;
  previewUrl: string;
};

type ManufacturerSeed = {
  rank: number;
  brand: string;
  models: string[];
};

const GLOBAL_MANUFACTURERS: ManufacturerSeed[] = [
  {
    rank: 1,
    brand: "Samsung",
    models: [
      "Galaxy S25 Ultra",
      "Galaxy S25+",
      "Galaxy S25",
      "Galaxy S24 Ultra",
      "Galaxy S24+",
      "Galaxy S24",
      "Galaxy Z Fold 6",
      "Galaxy Z Flip 6",
      "Galaxy A55 5G",
      "Galaxy A35 5G",
      "Galaxy A25 5G",
      "Galaxy A16 5G",
      "Galaxy A15 5G",
      "Galaxy A06",
      "Galaxy S23 FE",
      "Galaxy M55 5G",
      "Galaxy M35 5G",
      "Galaxy F55",
      "Galaxy A54 5G",
      "Galaxy XCover 7",
    ],
  },
  {
    rank: 2,
    brand: "Apple",
    models: [
      "iPhone 16 Pro Max",
      "iPhone 16 Pro",
      "iPhone 16 Plus",
      "iPhone 16",
      "iPhone 15 Pro Max",
      "iPhone 15 Pro",
      "iPhone 15 Plus",
      "iPhone 15",
      "iPhone 14 Plus",
      "iPhone 14",
      "iPhone 13",
      "iPhone SE (3rd Gen)",
      "iPhone 17 Pro Max (Upcoming)",
      "iPhone 17 Pro (Upcoming)",
      "iPhone 17 Air (Rumored)",
      "iPhone 16e (Upcoming)",
      "iPhone 14 Pro Max",
      "iPhone 14 Pro",
      "iPhone 13 mini",
      "iPhone 12",
    ],
  },
  {
    rank: 3,
    brand: "Xiaomi",
    models: [
      "Xiaomi 15 Ultra",
      "Xiaomi 15 Pro",
      "Xiaomi 15",
      "Xiaomi 14 Ultra",
      "Xiaomi 14T Pro",
      "Xiaomi 14T",
      "Xiaomi 14",
      "Redmi Note 14 Pro+ 5G",
      "Redmi Note 14 Pro 5G",
      "Redmi Note 14 5G",
      "Redmi Note 13 Pro+ 5G",
      "Redmi Note 13 Pro 5G",
      "Redmi Note 13 5G",
      "Redmi Note 13C",
      "Redmi A3",
      "POCO F6 Pro",
      "POCO F6",
      "POCO X6 Pro 5G",
      "POCO M6 Pro",
      "Xiaomi Mix Flip",
    ],
  },
  {
    rank: 4,
    brand: "OPPO",
    models: [
      "Find X8 Pro",
      "Find X8",
      "Find X7 Ultra",
      "Find N3 Flip",
      "Reno 13 Pro",
      "Reno 13",
      "Reno 12 Pro 5G",
      "Reno 12 5G",
      "Reno 12 F",
      "Reno 11 Pro 5G",
      "Reno 11 F 5G",
      "OPPO A60",
      "OPPO A3 Pro",
      "OPPO A3x",
      "OPPO A80 5G",
      "OPPO A79 5G",
      "OPPO A58",
      "OPPO A38",
      "OPPO K12x 5G",
      "OPPO F27 Pro+ 5G",
    ],
  },
  {
    rank: 5,
    brand: "Vivo",
    models: [
      "X200 Pro",
      "X200 Pro Mini",
      "X200",
      "X100 Ultra",
      "X100 Pro",
      "X Fold 3 Pro",
      "Vivo V40 Pro",
      "Vivo V40",
      "Vivo V40e",
      "Vivo V30 Pro",
      "Vivo V30",
      "Vivo Y300 Plus",
      "Vivo Y200 5G",
      "Vivo Y28 5G",
      "Vivo Y58 5G",
      "Vivo Y18",
      "Vivo T3 Ultra",
      "Vivo T3 Pro 5G",
      "iQOO 13",
      "iQOO 12",
    ],
  },
  {
    rank: 6,
    brand: "Transsion (Tecno, Infinix, Itel)",
    models: [
      "Tecno Phantom V Fold 2",
      "Tecno Camon 30 Premier 5G",
      "Tecno Camon 30 Pro",
      "Tecno Camon 30",
      "Tecno Spark 30 Pro",
      "Tecno Spark 20 Pro+",
      "Tecno Pova 6 Pro 5G",
      "Tecno Pop 9",
      "Infinix Zero 40 5G",
      "Infinix Zero Flip",
      "Infinix GT 20 Pro",
      "Infinix Note 40 Pro+ 5G",
      "Infinix Note 40 Pro",
      "Infinix Hot 50 Pro+",
      "Infinix Hot 50 5G",
      "Infinix Hot 40i",
      "Infinix Smart 8",
      "Itel S24",
      "Itel P55+",
      "Itel A70",
    ],
  },
  {
    rank: 7,
    brand: "Honor",
    models: [
      "Honor Magic 7 Pro",
      "Honor Magic 7",
      "Honor Magic 6 Pro",
      "Honor Magic V3",
      "Honor Magic V2",
      "Honor 200 Pro",
      "Honor 200",
      "Honor 200 Lite",
      "Honor 90 GT",
      "Honor 90",
      "Honor 90 Lite",
      "Honor X9c",
      "Honor X9b 5G",
      "Honor X8b",
      "Honor X7b",
      "Honor X6b",
      "Honor X9a",
      "Honor Play 9T",
      "Honor Magic 6 Lite",
      "Honor 70",
    ],
  },
  {
    rank: 8,
    brand: "Motorola",
    models: [
      "Motorola Edge 50 Ultra",
      "Motorola Edge 50 Pro",
      "Motorola Edge 50 Fusion",
      "Motorola Edge 50 Neo",
      "Motorola Razr 50 Ultra",
      "Motorola Razr 50",
      "Motorola Razr 40 Ultra",
      "Moto G85 5G",
      "Moto G84 5G",
      "Moto G64 5G",
      "Moto G54 5G",
      "Moto G45 5G",
      "Moto G35 5G",
      "Moto G34 5G",
      "Moto G24 Power",
      "Moto G04s",
      "Motorola Edge 40 Neo",
      "Motorola Edge 2024",
      "Moto G Stylus 5G 2024",
      "Moto G Power 5G 2024",
    ],
  },
  {
    rank: 9,
    brand: "Realme",
    models: [
      "Realme GT 7 Pro",
      "Realme GT 6",
      "Realme GT 6T",
      "Realme 13 Pro+ 5G",
      "Realme 13 Pro 5G",
      "Realme 13+ 5G",
      "Realme 12 Pro+ 5G",
      "Realme 12 Pro 5G",
      "Realme 12x 5G",
      "Realme P2 Pro 5G",
      "Realme P1 5G",
      "Realme Narzo 70 Pro 5G",
      "Realme Narzo 70 Turbo",
      "Realme Narzo N65 5G",
      "Realme C67 5G",
      "Realme C65 5G",
      "Realme C63",
      "Realme C55",
      "Realme C53",
      "Realme Note 60",
    ],
  },
  {
    rank: 10,
    brand: "Huawei",
    models: [
      "Huawei Mate XT Ultimate (Tri-fold)",
      "Huawei Pura 70 Ultra",
      "Huawei Pura 70 Pro",
      "Huawei Pura 70",
      "Huawei Mate 70 Pro+",
      "Huawei Mate 70 Pro",
      "Huawei Mate 70",
      "Huawei Mate 60 Pro+",
      "Huawei Mate 60 Pro",
      "Huawei Mate 60",
      "Huawei Mate X5",
      "Huawei Nova 13 Pro",
      "Huawei Nova 13",
      "Huawei Nova 12 Ultra",
      "Huawei Nova 12 Pro",
      "Huawei Nova 12s",
      "Huawei Nova 12 SE",
      "Huawei Nova 12i",
      "Huawei Pocket 2",
      "Huawei Enjoy 70",
    ],
  },
];

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const estimateBasePrice = (brand: string, model: string) => {
  const normalized = model.toLowerCase();
  if (/(fold|flip|tri-fold|pocket)/.test(normalized)) return 2850;
  if (/(ultra|pro max|ultimate)/.test(normalized)) return 2600;
  if (/(pro\+|\+ pro)/.test(normalized)) return 2350;
  if (/\bpro\b/.test(normalized)) return 2100;
  if (/(plus|\+)/.test(normalized)) return 1850;
  if (/(magic|mate|nova|reno|edge|mix|note|x\d|v\d|gt|p\d|pova|spark|narzo|pura|camon|phantom)/.test(normalized)) return 1600;
  if (/(a[5-9]\d|m[3-9]\d|y[3-9]\d|c6\d|g6\d|note 6\d|hot|smart 8)/.test(normalized)) return 1200;
  if (/(a[0-4]\d|c[0-4]\d|y1\d|g0\d|itel|spark|pop)/.test(normalized)) return 850;
  if (brand.toLowerCase().includes("transsion")) return 800;
  return 1500;
};

const estimateFloorPrice = (basePrice: number) => Math.max(300, Math.round(basePrice * 0.55));

const inferStorage = (basePrice: number) => {
  if (basePrice >= 2600) return "512GB";
  if (basePrice >= 1800) return "256GB";
  if (basePrice >= 1100) return "128GB";
  return "64GB";
};

const inferRam = (basePrice: number) => {
  if (basePrice >= 2600) return "12GB";
  if (basePrice >= 1900) return "10GB";
  if (basePrice >= 1400) return "8GB";
  if (basePrice >= 1000) return "6GB";
  return "4GB";
};

const inferYear = (brand: string, model: string) => {
  if (/25/.test(model)) return 2025;
  if (/24/.test(model)) return 2024;
  if (/23/.test(model)) return 2023;
  if (/22/.test(model)) return 2022;
  if (/21/.test(model)) return 2021;
  if (brand === "Apple") {
    if (/17/.test(model)) return 2025;
    if (/16/.test(model)) return 2024;
    if (/15/.test(model)) return 2023;
    if (/14/.test(model)) return 2022;
    if (/13/.test(model)) return 2021;
    if (/12/.test(model)) return 2020;
  }
  return 2024;
};

const inferChipset = (brand: string, basePrice: number, model: string) => {
  const normalized = model.toLowerCase();
  if (brand === "Apple") {
    if (/17/.test(model)) return "Apple A19 Pro";
    if (/16/.test(model)) return "Apple A18 Pro";
    if (/15/.test(model)) return "Apple A17 Pro";
    if (/14/.test(model)) return "Apple A16 Bionic";
    if (/13/.test(model)) return "Apple A15 Bionic";
    if (/se/.test(normalized)) return "Apple A15 Bionic";
    return "Apple Silicon";
  }
  if (brand === "Samsung") {
    if (/(fold|flip)/.test(normalized) || /s25/.test(normalized)) return "Snapdragon 8 Elite";
    if (/(s24|s23)/.test(normalized)) return "Snapdragon 8 Gen3";
    if (/a\d|m\d|f\d|xcover/.test(normalized)) return "Exynos 1480";
  }
  if (brand === "Huawei") return basePrice >= 2300 ? "Kirin 9010" : "Kirin 9000S";
  if (brand === "Transsion (Tecno, Infinix, Itel)") return basePrice >= 1400 ? "Dimensity 8300" : "Helio G99";
  if (["Xiaomi", "OPPO", "Vivo", "Honor", "Realme"].includes(brand)) {
    if (/(fold|flip)/.test(normalized)) return "Snapdragon 8 Gen3";
    return basePrice >= 2200 ? "Snapdragon 8 Gen3" : basePrice >= 1700 ? "Dimensity 9200" : basePrice >= 1300 ? "Snapdragon 7s Gen2" : "Dimensity 6100+";
  }
  if (brand === "Motorola") return basePrice >= 2000 ? "Snapdragon 8s Gen3" : basePrice >= 1500 ? "Snapdragon 7 Gen3" : "Dimensity 7030";
  return basePrice >= 2000 ? "Snapdragon 8 Gen3" : basePrice >= 1500 ? "Snapdragon 7 Gen2" : basePrice >= 1000 ? "Dimensity 8200" : "Helio G88";
};

const createPhoneModel = (
  brand: string,
  model: string,
  overrides: Partial<Omit<CatalogItem, "brand" | "name" | "deviceType" | "id">> = {},
): CatalogItem => {
  const basePrice = overrides.basePrice ?? estimateBasePrice(brand, model);
  const floorPrice = overrides.floorPrice ?? estimateFloorPrice(basePrice);
  const year = overrides.year ?? inferYear(brand, model);
  const storage = overrides.storage ?? inferStorage(basePrice);
  const ram = overrides.ram ?? inferRam(basePrice);
  const chipset = overrides.chipset ?? inferChipset(brand, basePrice, model);
  return {
    id: `${slugify(brand)}-${slugify(model)}`,
    brand,
    name: model,
    basePrice,
    floorPrice,
    chipset,
    storage,
    ram,
    year,
    deviceType: "phone",
  };
};

const PHONE_CATALOG: CatalogItem[] = [
  ...GLOBAL_MANUFACTURERS.flatMap((manufacturer) => manufacturer.models.map((model) => createPhoneModel(manufacturer.brand, model))),
  createPhoneModel("Google", "Pixel 9 Pro", { basePrice: 2100, chipset: "Tensor G4", storage: "256GB", ram: "12GB", year: 2024 }),
  createPhoneModel("Google", "Pixel 8", { basePrice: 1200, chipset: "Tensor G3", storage: "128GB", ram: "8GB", year: 2023 }),
  createPhoneModel("Google", "Pixel 8a", { basePrice: 950, chipset: "Tensor G3", storage: "128GB", ram: "8GB", year: 2024 }),
  createPhoneModel("Nothing", "Phone (2a)", { basePrice: 900, chipset: "Dimensity 7200 Pro", storage: "256GB", ram: "8GB", year: 2024 }),
  createPhoneModel("Fairphone", "Fairphone 5", { basePrice: 1050, chipset: "Snapdragon 782G", storage: "256GB", ram: "8GB", year: 2023 }),
];

const LAPTOP_MANUFACTURERS: ManufacturerSeed[] = [
  { rank: 1, brand: "Lenovo", models: [
    "ThinkPad X1 Carbon Gen 13",
    "ThinkPad X1 2-in-1 Gen 9",
    "ThinkPad T14 Gen 5",
    "ThinkPad E14 Gen 6",
    "Yoga 9i 2-in-1 (Gen 9)",
    "Yoga Slim 7i Aura Edition",
    "Yoga 7i 2-in-1",
    "Legion 9i Gen 9",
    "Legion Pro 7i Gen 9",
    "Legion Pro 5i Gen 9",
    "Legion Slim 7i Gen 8",
    "Legion Slim 5 Gen 9",
    "LOQ 15IRX9",
    "IdeaPad Slim 5 Gen 9",
    "IdeaPad Flex 5i",
    "IdeaPad Pro 5i",
    "ThinkBook 16p Gen 5",
    "ThinkBook 14 Gen 7",
    "ThinkPad Z13 Gen 2",
    "ThinkPad P1 Gen 7",
  ]},
  { rank: 2, brand: "HP", models: [
    "Spectre x360 14 (2024)",
    "Spectre x360 16 (2024)",
    "HP OmniBook X AI PC",
    "HP OmniBook Ultra",
    "HP Envy x360 14",
    "HP Envy x360 16",
    "HP Envy 17",
    "HP Pavilion Plus 14",
    "HP Pavilion 15",
    "HP Omen Transcend 14",
    "HP Omen 16",
    "HP Omen 17",
    "HP Victus 16",
    "HP Victus 15",
    "EliteBook 1040 G11",
    "EliteBook 840 G11",
    "HP Dragonfly G4",
    "ZBook Firefly 16 G11",
    "ZBook Studio 16 G11",
    "HP Chromebook Plus x360",
  ]},
  { rank: 3, brand: "Dell", models: [
    "Dell XPS 13 (9345) Copilot+",
    "Dell XPS 14 (9440)",
    "Dell XPS 16 (9640)",
    "Dell XPS 13 Plus (9320)",
    "Alienware m16 R2",
    "Alienware m18 R2",
    "Alienware x16 R2",
    "Dell Inspiron 14 Plus",
    "Dell Inspiron 16 Plus",
    "Dell Inspiron 14 2-in-1",
    "Dell Inspiron 16 2-in-1",
    "Dell G15 Gaming",
    "Dell G16 Gaming",
    "Dell Latitude 7450",
    "Dell Latitude 5550",
    "Dell Latitude 9450 2-in-1",
    "Dell Precision 5690",
    "Dell Precision 3591",
    "Dell Precision 7780",
    "Dell Vostro 15",
  ]},
  { rank: 4, brand: "Apple", models: [
    "MacBook Air 13 (M3)",
    "MacBook Air 15 (M3)",
    "MacBook Air 13 (M2)",
    "MacBook Air 15 (M2)",
    "MacBook Pro 14 (M4)",
    "MacBook Pro 14 (M4 Pro)",
    "MacBook Pro 14 (M4 Max)",
    "MacBook Pro 16 (M4 Pro)",
    "MacBook Pro 16 (M4 Max)",
    "MacBook Pro 14 (M3)",
    "MacBook Pro 14 (M3 Pro)",
    "MacBook Pro 14 (M3 Max)",
    "MacBook Pro 16 (M3 Pro)",
    "MacBook Pro 16 (M3 Max)",
    "MacBook Pro 14 (M2 Pro)",
    "MacBook Pro 14 (M2 Max)",
    "MacBook Pro 16 (M2 Pro)",
    "MacBook Pro 16 (M2 Max)",
    "MacBook Air 13 (M1)",
    "MacBook Pro 13 (M2)",
  ]},
  { rank: 5, brand: "Asus", models: [
    "ROG Zephyrus G14 (2024)",
    "ROG Zephyrus G16 (2024)",
    "ROG Strix Scar 16",
    "ROG Strix Scar 18",
    "ROG Flow X13",
    "ROG Flow Z13",
    "Zenbook 14 OLED (UM3406)",
    "Zenbook Duo (2024)",
    "Zenbook S 13 OLED",
    "Zenbook S 16 (AMD Ryzen AI)",
    "Vivobook S 15 (Snapdragon)",
    "Vivobook S 16 OLED",
    "Vivobook Pro 15 OLED",
    "Vivobook Go 15",
    "TUF Gaming A15",
    "TUF Gaming A16 Advantage",
    "TUF Gaming F15",
    "ProArt P16",
    "ProArt PX13",
    "ExpertBook B9 OLED",
  ]},
  { rank: 6, brand: "Acer", models: [
    "Swift Go 14 AI",
    "Swift Go 16 OLED",
    "Swift X 14",
    "Swift Edge 16",
    "Predator Helios 18",
    "Predator Helios 16",
    "Predator Helios Neo 16",
    "Predator Triton 17 X",
    "Predator Triton 14",
    "Nitro 16",
    "Nitro 17",
    "Nitro V 15",
    "Acer Aspire 5",
    "Acer Aspire 3",
    "Acer Aspire Vero 16",
    "Chromebook Plus 515",
    "Chromebook Spin 714",
    "TravelMate P6",
    "TravelMate P4",
    "ConceptD 7 SpatialLabs",
  ]},
  { rank: 7, brand: "MSI", models: [
    "Titan 18 HX",
    "Raider GE78 HX",
    "Raider GE68 HX",
    "Vector GP78 HX",
    "Vector GP68 HX",
    "Stealth 18 AI Studio",
    "Stealth 16 AI Studio",
    "Stealth 14 Studio",
    "Pulse 17 AI",
    "Pulse 15 AI",
    "Katana 17 AI",
    "Katana 15 AI",
    "Cyborg 15 AI",
    "Thin GF63",
    "Prestige 16 AI Evo",
    "Prestige 13 AI Evo",
    "Summit E16 AI Evo",
    "Modern 15",
    "Modern 14",
    "Creator Z17 HX Studio",
  ]},
  { rank: 8, brand: "Microsoft", models: [
    "Surface Laptop 7 (13.8-inch)",
    "Surface Laptop 7 (15-inch)",
    "Surface Pro 11",
    "Surface Laptop Studio 2",
    "Surface Laptop Go 3",
    "Surface Go 4",
    "Surface Pro 10 for Business",
    "Surface Laptop 6 for Business (13.5-inch)",
    "Surface Laptop 6 for Business (15-inch)",
    "Surface Pro 9 (5G)",
    "Surface Pro 9 (Wi-Fi)",
    "Surface Laptop 5 (13.5-inch)",
    "Surface Laptop 5 (15-inch)",
    "Surface Laptop Studio (Gen 1)",
    "Surface Pro 8",
    "Surface Laptop Go 2",
    "Surface Laptop 4 (13.5-inch)",
    "Surface Laptop 4 (15-inch)",
    "Surface Go 3",
    "Surface Laptop SE",
  ]},
  { rank: 9, brand: "Samsung", models: [
    "Galaxy Book5 Pro 360",
    "Galaxy Book5 Pro",
    "Galaxy Book4 Ultra",
    "Galaxy Book4 Pro 360",
    "Galaxy Book4 Pro",
    "Galaxy Book4 360",
    "Galaxy Book4 Edge 16",
    "Galaxy Book4 Edge 14",
    "Galaxy Book3 Ultra",
    "Galaxy Book3 Pro 360",
    "Galaxy Book3 Pro",
    "Galaxy Book3 360",
    "Galaxy Book2 Pro 360",
    "Galaxy Book2 Pro",
    "Galaxy Chromebook Plus",
    "Galaxy Chromebook 2",
    "Galaxy Chromebook 2 360",
    "Galaxy Book Go",
    "Galaxy Book Flex2 Alpha",
    "Samsung Notebook Plus2",
  ]},
  { rank: 10, brand: "Huawei", models: [
    "MateBook X Pro 2024",
    "MateBook 14 2024",
    "MateBook 16s 2023",
    "MateBook D 16 2024",
    "MateBook D 14 2024",
    "MateBook 14s",
    "MateBook E 2023",
    "MateBook X Pro 2023",
    "MateBook 16",
    "MateBook 14 AMD",
    "MateBook D 15",
    "MateBook E Go",
    "MateBook 13s",
    "MateBook X (Fanless)",
    "MateBook B7-410",
    "MateBook B5-430",
    "MateBook B3-520",
    "MateBook B3-420",
    "Qingyun L540",
    "Qingyun L410",
  ]},
];

const estimateLaptopBasePrice = (brand: string, model: string) => {
  const normalized = model.toLowerCase();
  if (brand === "Apple") {
    if (/m4/.test(normalized)) return 4200;
    if (/m3/.test(normalized)) return normalized.includes("air") ? 2600 : 3600;
    if (/m2/.test(normalized)) return normalized.includes("air") ? 2300 : 3200;
    if (/m1/.test(normalized)) return 1900;
  }
  if (/(legion 9|titan 18|raider|strix|scar|predator helio|ge78|xps 16)/.test(normalized)) return 4300;
  if (/(legion pro|alienware|zephyrus|tuf gaming|omen 17|victus 16|vector|stealth|katana|creator)/.test(normalized)) return 3700;
  if (/(yoga 9|spectre|xps 14|zenbook duo|surface laptop studio|hp omnibook|dragonfly|macbook pro)/.test(normalized)) return 3200;
  if (/(x1 carbon|elitebook|latitude 9|surface pro 11|surface laptop 7|zenbook|prestige|summit|galaxy book pro|matebook x)/.test(normalized)) return 2850;
  if (/(idea pad|thinkbook|envy|pavilion plus|inspiron plus|vivobook s|swift go|modern|surface laptop go|galaxy book|matebook|chromebook)/.test(normalized)) return 2100;
  return 2400;
};

const estimateLaptopFloorPrice = (basePrice: number) => Math.max(700, Math.round(basePrice * 0.58));

const inferLaptopStorage = (basePrice: number, model: string) => {
  const normalized = model.toLowerCase();
  if (/(2tb|gen 9 legion|titan|raider|predator helio)/.test(normalized) || basePrice >= 4200) return "2TB SSD";
  if (basePrice >= 3200) return "1TB SSD";
  if (/(chromebook|go 3|go 4)/.test(normalized)) return "256GB SSD";
  return basePrice >= 2000 ? "512GB SSD" : "512GB SSD";
};

const inferLaptopRam = (basePrice: number, model: string) => {
  const normalized = model.toLowerCase();
  if (/(titan|raider|zephyrus|legion 9|creator|studio)/.test(normalized)) return "32GB";
  if (basePrice >= 3600) return "32GB";
  if (/(victus|omen|tuf|katana|pulse|vector|xps 16|precision)/.test(normalized)) return "24GB";
  if (basePrice >= 2800) return "16GB";
  return basePrice >= 2100 ? "16GB" : "8GB";
};

const inferLaptopYear = (model: string) => {
  if (/2025/.test(model)) return 2025;
  if (/2024/.test(model)) return 2024;
  if (/2023/.test(model) || /(gen 8|gen 9|g11)/i.test(model)) return 2023;
  if (/m4/.test(model)) return 2025;
  if (/m3/.test(model)) return 2024;
  if (/m2/.test(model)) return 2023;
  if (/m1/.test(model)) return 2020;
  return 2024;
};

const inferLaptopChipset = (brand: string, model: string, basePrice: number) => {
  const normalized = model.toLowerCase();
  if (brand === "Apple") {
    if (/m4 max/.test(normalized)) return "Apple M4 Max";
    if (/m4 pro/.test(normalized)) return "Apple M4 Pro";
    if (/m4/.test(normalized)) return "Apple M4";
    if (/m3 max/.test(normalized)) return "Apple M3 Max";
    if (/m3 pro/.test(normalized)) return "Apple M3 Pro";
    if (/m3/.test(normalized)) return "Apple M3";
    if (/m2 max/.test(normalized)) return "Apple M2 Max";
    if (/m2 pro/.test(normalized)) return "Apple M2 Pro";
    if (/m2/.test(normalized)) return "Apple M2";
    if (/m1/.test(normalized)) return "Apple M1";
    return "Apple Silicon";
  }
  if (/(snapdragon|copilot\+|x elite|galaxy book4 edge|omni book x)/.test(normalized)) return "Snapdragon X Elite";
  if (/(ryzen ai|rog|tuf|predator|legion|katana|pulse|zephyrus|strix|proart)/.test(normalized)) return basePrice >= 3800 ? "AMD Ryzen AI 9 HX" : "AMD Ryzen 9 8945HS";
  if (/(core ultra|spectre|zenbook|swift go|xps|latitude|elitebook|surface|modern|prestige|summit|thinkpad|yoga|ideapad|envy|pavilion|go 3)/.test(normalized)) return basePrice >= 3200 ? "Intel Core Ultra 9" : basePrice >= 2600 ? "Intel Core Ultra 7" : "Intel Core Ultra 5";
  if (brand === "MSI" || brand === "Lenovo" || brand === "HP" || brand === "Dell" || brand === "Asus" || brand === "Acer") {
    return basePrice >= 3600 ? "Intel Core i9 14900H" : basePrice >= 3000 ? "Intel Core i7 14700H" : "Intel Core i5 13500H";
  }
  if (brand === "Huawei" || brand === "Samsung" || brand === "Microsoft") {
    if (/chromebook/.test(normalized)) return "Intel Core i5";
    return basePrice >= 3000 ? "Intel Core Ultra 7" : "Intel Core Ultra 5";
  }
  return basePrice >= 3200 ? "Intel Core Ultra 7" : "Intel Core i5";
};

const createLaptopModel = (
  brand: string,
  model: string,
  overrides: Partial<Omit<CatalogItem, "brand" | "name" | "deviceType" | "id">> = {},
): CatalogItem => {
  const basePrice = overrides.basePrice ?? estimateLaptopBasePrice(brand, model);
  const floorPrice = overrides.floorPrice ?? estimateLaptopFloorPrice(basePrice);
  const year = overrides.year ?? inferLaptopYear(model);
  const storage = overrides.storage ?? inferLaptopStorage(basePrice, model);
  const ram = overrides.ram ?? inferLaptopRam(basePrice, model);
  const chipset = overrides.chipset ?? inferLaptopChipset(brand, model, basePrice);
  return {
    id: `${slugify(brand)}-${slugify(model)}`,
    brand,
    name: model,
    basePrice,
    floorPrice,
    chipset,
    storage,
    ram,
    year,
    deviceType: "computer",
  };
};

const COMPUTER_CATALOG: CatalogItem[] = [
  ...LAPTOP_MANUFACTURERS.flatMap((manufacturer) => manufacturer.models.map((model) => createLaptopModel(manufacturer.brand, model))),
  createLaptopModel("Framework", "Laptop 16 (2024)", { basePrice: 3100, chipset: "AMD Ryzen 7 7840HS", storage: "1TB SSD", ram: "32GB", year: 2024 }),
  createLaptopModel("Razer", "Blade 16 (2024)", { basePrice: 4400, chipset: "Intel Core i9 14900HX", storage: "2TB SSD", ram: "32GB", year: 2024 }),
  createLaptopModel("Gigabyte", "AERO 16 OLED", { basePrice: 3600, chipset: "Intel Core Ultra 9", storage: "1TB SSD", ram: "32GB", year: 2024 }),
  createLaptopModel("Samsung", "Galaxy Book4 Ultra", { basePrice: 3600, chipset: "Intel Core Ultra 9", storage: "1TB SSD", ram: "32GB", year: 2024 }),
];

const STEP_LABELS = ["Cihaz", "Vəziyyət", "Qiymət"] as const;
const MAX_PHOTOS = 6;

const DEVICE_TYPE_CARDS: Record<DeviceType, { title: string; copy: string }> = {
  phone: {
    title: "Telefon",
    copy: "IMEI skanı, ekran və batareya yoxlaması",
  },
  computer: {
    title: "Noutbuk",
    copy: "Serial, port və dövr analizi",
  },
};

const DEVICE_CATALOG: Record<DeviceType, CatalogItem[]> = {
  phone: PHONE_CATALOG,
  computer: COMPUTER_CATALOG,
};

const CONDITION_QUESTIONS: Record<DeviceType, ConditionQuestion[]> = {
  phone: [
    {
      id: "screen",
      label: "Ekran şüşəsi",
      helper: "Çatlar, yanıq izləri",
      options: [
        { id: "pristine", label: "Tam sağlam", helper: "Heç bir iz yoxdur", impact: 0 },
        { id: "scratched", label: "Cızıqlar var", helper: "Yüngül izlər", impact: -0.08 },
        { id: "broken", label: "Şüşə sınıb", helper: "Əvəzləmə tələb edir", impact: -0.35 },
      ],
    },
    {
      id: "display",
      label: "Görüntü paneli",
      helper: "OLED burn, ölü piksel",
      options: [
        { id: "clean", label: "Tam normal", helper: "Problem yoxdur", impact: 0 },
        { id: "burn", label: "OLED burn", helper: "Statik kölgə", impact: -0.15 },
        { id: "dark", label: "Görüntü yoxdur", helper: "Panel açılmır", impact: -0.4 },
      ],
    },
    {
      id: "board",
      label: "Ana plata",
      helper: "Sökülmə, təmir izləri",
      options: [
        { id: "sealed", label: "Zavod vəziyyəti", helper: "Müdaxilə yoxdur", impact: 0 },
        { id: "repaired", label: "Təmir olunub", helper: "Müdaxilə izləri", impact: -0.2 },
        { id: "dead", label: "İşləmir", helper: "Cihaz açılmır", impact: -0.5 },
      ],
    },
    {
      id: "battery",
      label: "Batareya",
      helper: "Sağlamlıq faizi",
      options: [
        { id: "healthy", label: ">85%", helper: "Normal dövr", impact: 0 },
        { id: "worn", label: "70-85%", helper: "Tez boşalır", impact: -0.1 },
        { id: "bad", label: "<70%", helper: "Dəyişilməlidir", impact: -0.18 },
      ],
    },
  ],
  computer: [
    {
      id: "display",
      label: "Ekran və çərçivə",
      helper: "Cızıqlar, ölü piksel",
      options: [
        { id: "perfect", label: "Çat yoxdur", helper: "100% sağlam", impact: 0 },
        { id: "worn", label: "Kiçik izlər", helper: "İstifadə izi", impact: -0.08 },
        { id: "broken", label: "Panel zədəlidir", helper: "Dəyişiklik tələb edir", impact: -0.3 },
      ],
    },
    {
      id: "keyboard",
      label: "Klaviatura",
      helper: "Çatışmayan düymələr",
      options: [
        { id: "working", label: "Tam işlək", helper: "Heç nə çatışmır", impact: 0 },
        { id: "missing", label: "Düymə çatışmır", helper: "Qismən zədə", impact: -0.15 },
        { id: "faulty", label: "İşləmir", helper: "Əsas düymələr nasaz", impact: -0.25 },
      ],
    },
    {
      id: "ports",
      label: "Portlar",
      helper: "USB/HDMI vəziyyəti",
      options: [
        { id: "all_ok", label: "Hamısı işləyir", helper: "Qüsur yoxdur", impact: 0 },
        { id: "limited", label: "Bəziləri nasaz", helper: "Qismən işlək", impact: -0.12 },
        { id: "dead", label: "Əsas portlar nasaz", helper: "Servis tələb edir", impact: -0.22 },
      ],
    },
    {
      id: "battery",
      label: "Dövr sayı",
      helper: "Cycle count",
      options: [
        { id: "fresh", label: "<400", helper: "Normal", impact: 0 },
        { id: "used", label: "400-800", helper: "Zəifləyib", impact: -0.1 },
        { id: "tired", label: ">800", helper: "Dəyişilməlidir", impact: -0.18 },
      ],
    },
  ],
};

function calculateValuation(model: CatalogItem | undefined, answers: ConditionAnswerMap) {
  if (!model) {
    return { suggestion: 0, adjustments: [] as Adjustment[] };
  }

  const questions = CONDITION_QUESTIONS[model.deviceType];
  let price = model.basePrice;
  const adjustments: Adjustment[] = [];

  questions.forEach((question) => {
    const selected = question.options.find((option) => option.id === answers[question.id]);
    if (!selected) return;
    const delta = Math.round(model.basePrice * selected.impact);
    price += delta;
    if (delta !== 0) {
      adjustments.push({ label: `${question.label}: ${selected.label}`, impact: delta });
    }
  });

  const guarded = Math.max(model.floorPrice, Math.round(price / 10) * 10);
  return { suggestion: guarded, adjustments };
}

function summarizeCondition(model: CatalogItem | undefined, adjustments: Adjustment[]) {
  if (!model) return "Vəziyyət qeyd olunmayıb";
  const negatives = adjustments.filter((adj) => adj.impact < 0).length;
  if (negatives === 0) return "Servis müdaxiləsi tələb olunmur";
  if (negatives === 1) return "Yüngül texniki xidmət gərəkir";
  return "Peşəkar servis tövsiyə olunur";
}

function computeRiskScore(adjustments: Adjustment[]) {
  if (!adjustments.length) return 52;
  const base = 52;
  const diff = adjustments.reduce((score, adj) => score + (adj.impact < 0 ? 6 : -4), 0);
  return Math.max(25, Math.min(95, base + diff));
}

const overlayLabels: Record<OverlayKey, string> = {
  front: "Ön",
  back: "Arxa",
  identifier: "Kod",
};

const overlayHints: Record<OverlayKey, string> = {
  front: "Ön paneli çərçivəyə yerləşdirin",
  back: "Arxa gövdəni göstərin",
  identifier: "IMEI/Serial kodunu mətnə salın",
};

export default function SellPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [step, setStep] = useState<Step>(1);
  const [deviceType, setDeviceType] = useState<DeviceType | "">("");
  const [brand, setBrand] = useState("");
  const [modelId, setModelId] = useState("");
  const [conditionAnswers, setConditionAnswers] = useState<ConditionAnswerMap>({});
  const [identifier, setIdentifier] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [overlay, setOverlay] = useState<OverlayKey>("front");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const webcamRef = useRef<Webcam>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);

  const videoConstraints = useMemo(() => {
    return {
      facingMode: { ideal: facingMode },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    } as MediaTrackConstraints;
  }, [facingMode]);

  const brandOptions = useMemo(() => {
    if (!deviceType) return [];
    return Array.from(new Set(DEVICE_CATALOG[deviceType].map((item) => item.brand))).sort();
  }, [deviceType]);

  const modelOptions = useMemo(() => {
    if (!deviceType || !brand) return [];
    return DEVICE_CATALOG[deviceType].filter((item) => item.brand === brand);
  }, [deviceType, brand]);

  const selectedModel = useMemo(() => {
    if (!deviceType) return undefined;
    return DEVICE_CATALOG[deviceType].find((item) => item.id === modelId);
  }, [deviceType, modelId]);
  const valuation = useMemo(() => calculateValuation(selectedModel, conditionAnswers), [selectedModel, conditionAnswers]);
  const conditionSummary = useMemo(() => summarizeCondition(selectedModel, valuation.adjustments), [selectedModel, valuation.adjustments]);
  const riskScore = useMemo(() => computeRiskScore(valuation.adjustments), [valuation.adjustments]);

  const normalizedFaultTree = useMemo(() => {
    if (!selectedModel) return { answers: conditionAnswers, notes };
    return {
      answers: conditionAnswers,
      notes,
      model: {
        id: selectedModel.id,
        brand: selectedModel.brand,
        name: selectedModel.name,
        deviceType: selectedModel.deviceType,
      },
      valuation: {
        basePrice: selectedModel.basePrice,
        floorPrice: selectedModel.floorPrice,
        suggestion: valuation.suggestion,
        adjustments: valuation.adjustments,
      },
    };
  }, [conditionAnswers, notes, selectedModel, valuation]);

  useEffect(() => {
    setConditionAnswers({});
  }, [modelId]);

  useEffect(() => {
    setBrand("");
    setModelId("");
    setConditionAnswers({});
  }, [deviceType]);

  useEffect(() => {
    if (!price && valuation.suggestion) {
      setPrice(String(valuation.suggestion));
    }
  }, [price, valuation.suggestion]);

  const identifierLabel = deviceType === "computer" ? "Seriya nömrəsi" : "IMEI";
  const hasMinimumPhotos = photos.length >= 2;
  const priceNumber = Number(price) || valuation.suggestion;

  const canContinueFromStep1 = Boolean(selectedModel);
  const canContinueFromStep2 = deviceType
    ? CONDITION_QUESTIONS[deviceType].every((question) => Boolean(conditionAnswers[question.id]))
    : false;
  const canSubmit = Boolean(selectedModel && identifier.trim().length >= 5 && priceNumber > 0 && hasMinimumPhotos && !loading);

  const handleDeviceTypeSelect = (type: DeviceType) => {
    if (type === deviceType) return;
    setDeviceType(type);
    setBrand("");
    setModelId("");
    setConditionAnswers({});
  };

  const handleBrandSelect = (value: string) => {
    setBrand(value);
    setModelId("");
    setConditionAnswers({});
  };

  const handleModelSelect = (value: string) => {
    setModelId(value);
  };

  const handleConditionAnswer = (questionId: string, optionId: string) => {
    setConditionAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const getSnapshot = useCallback(() => {
    const webcam = webcamRef.current;
    if (!webcam) {
      toast.error("Kamera aktiv deyil");
      return null;
    }

    const video = webcam.video as HTMLVideoElement | null;
    if (!video || video.readyState < 2) {
      toast.error("Kamera hələ hazır deyil");
      return null;
    }

    const snapshot = webcam.getScreenshot();
    if (!snapshot) {
      toast.error("Şəkil çəkə bilmədik");
      return null;
    }

    return snapshot;
  }, []);

  const addPhotoFiles = useCallback(
    (files: File[]) => {
      const remaining = Math.max(0, MAX_PHOTOS - photos.length);
      if (remaining === 0) {
        toast.error(`Max ${MAX_PHOTOS} foto əlavə edilə bilər`);
        return;
      }

      const accepted = files.filter((file) => file.type.startsWith("image/"));
      if (accepted.length === 0) {
        toast.error("Şəkil faylı seçin");
        return;
      }

      const picked = accepted.slice(0, remaining);
      const next: SelectedPhoto[] = picked.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
      setPhotos((prev) => [...prev, ...next]);
      toast.success("Foto əlavə olundu");
    },
    [photos.length]
  );

  useEffect(() => {
    return () => {
      for (const photo of photos) {
        URL.revokeObjectURL(photo.previewUrl);
      }
    };
  }, [photos]);

  const removePhotoAt = useCallback((idx: number) => {
    setPhotos((prev) => {
      const target = prev[idx];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, index) => index !== idx);
    });
  }, []);

  const capturePhotoFile = useCallback(async () => {
    const snapshot = getSnapshot();
    if (!snapshot) return null;

    // data:image/jpeg;base64,... -> Blob
    const blob = await fetch(snapshot).then((res) => res.blob());
    const file = new File([blob], `sell-photo-${Date.now()}.jpg`, { type: blob.type || "image/jpeg" });
    return file;
  }, [getSnapshot]);

  const handlePhotoCapture = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS) {
      toast.error(`Max ${MAX_PHOTOS} foto əlavə edilə bilər`);
      return;
    }

    try {
      const file = await capturePhotoFile();
      if (!file) return;
      addPhotoFiles([file]);
    } catch (error) {
      console.error(error);
      toast.error("Şəkil çəkə bilmədik");
    }
  }, [addPhotoFiles, capturePhotoFile, photos.length]);

  const getIdentifierFromText = useCallback(
    (text: string) => {
      if (deviceType === "computer") {
        const match = text.toUpperCase().match(/[A-Z0-9]{8,}/);
        return match?.[0] ?? null;
      }

      const digits = text.replace(/\D/g, "");
      const match = digits.match(/\d{15}/);
      return match?.[0] ?? null;
    },
    [deviceType]
  );

  const ocrIdentifierFromFile = useCallback(
    async (file: File) => {
      const {
        data: { text },
      } = await Tesseract.recognize(file, "eng");
      return getIdentifierFromText(text);
    },
    [getIdentifierFromText]
  );

  const scanIdentifier = useCallback(async () => {
    if (scanning) return;

    setScanning(true);

    try {
      // Prefer OCR from the latest selected/captured image.
      const latest = photos[photos.length - 1];
      if (latest?.file) {
        const parsed = await ocrIdentifierFromFile(latest.file);
        if (parsed) {
          setIdentifier(parsed);
          toast.success(`${identifierLabel} tapıldı`);
        } else {
          toast.error(`${identifierLabel} oxunmadı`);
        }
        return;
      }

      // If no photos yet, OCR from current camera frame.
      const file = await capturePhotoFile();
      if (!file) return;
      const parsed = await ocrIdentifierFromFile(file);
      if (parsed) {
        setIdentifier(parsed);
        toast.success(`${identifierLabel} tapıldı`);
      } else {
        toast.error(`${identifierLabel} oxunmadı`);
      }
    } catch (error) {
      console.error(error);
      toast.error("OCR zamanı xəta baş verdi");
    } finally {
      setScanning(false);
    }
  }, [capturePhotoFile, identifierLabel, ocrIdentifierFromFile, photos, scanning]);

  useEffect(() => {
    return () => {
      // no-op
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!session) {
      toast.error("Zəhmət olmasa giriş edin");
      router.push("/sign-in");
      return;
    }

    if (!canSubmit || !selectedModel || !deviceType) return;

    setLoading(true);
    try {
      const uploaded: string[] = [];
      for (let i = 0; i < photos.length; i += 1) {
        const file = photos[i].file;
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          uploaded.push(data.url);
        }
      }

      const payload = {
        modelName: `${selectedModel.brand} ${selectedModel.name}`,
        brand: selectedModel.brand,
        deviceType,
        faultTree: normalizedFaultTree,
        imei: identifier,
        price: priceNumber,
        photos: uploaded,
        conditionSummary,
        riskScore,
      };

      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Listing creation failed");

      toast.success("Elan göndərildi");
      router.push("/profile");
    } catch (error) {
      console.error(error);
      toast.error("Elanı yaratmaq mümkün olmadı");
    } finally {
      setLoading(false);
    }
  }, [session, canSubmit, selectedModel, deviceType, photos, normalizedFaultTree, identifier, priceNumber, conditionSummary, riskScore, router]);

  const renderStepNavigation = () => (
    <div className="flex items-center justify-between rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-[0.45em] text-slate-500">
      {STEP_LABELS.map((label, index) => (
        <span key={label} className={index + 1 === step ? "text-white" : "opacity-40"}>
          {label}
        </span>
      ))}
    </div>
  );

  const renderStepControls = () => (
    <div className="flex w-full flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={() => setStep((prev) => (prev === 1 ? 1 : ((prev - 1) as Step)))}
        disabled={step === 1}
        className="flex-1 rounded-full border border-slate-800 px-4 py-3 text-sm text-slate-300 disabled:opacity-30"
      >
        <span className="inline-flex items-center justify-center gap-2">
          <ChevronLeft className="h-4 w-4" /> Geri
        </span>
      </button>
      {step < 3 ? (
        <button
          type="button"
          onClick={() => setStep((prev) => (prev === 3 ? 3 : ((prev + 1) as Step)))}
          disabled={(step === 1 && !canContinueFromStep1) || (step === 2 && !canContinueFromStep2)}
          className="flex-1 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          <span className="inline-flex items-center justify-center gap-2">
            Davam et <ChevronRight className="h-4 w-4" />
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Elanı paylaş"}
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2"
          >
            <ArrowLeft className="h-4 w-4" /> Geri
          </button>
          {renderStepNavigation()}
        </div>

        {step === 1 && (
          <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">1. Cihaz</p>
              <h1 className="text-3xl font-semibold text-white">Satacağınız cihazı seçin</h1>
              <p className="text-sm text-slate-400">Əvvəl telefon və ya noutbuk seçin, sonra marka və modeli daxil edin.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(DEVICE_TYPE_CARDS) as DeviceType[]).map((type) => {
                const card = DEVICE_TYPE_CARDS[type];
                const active = deviceType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleDeviceTypeSelect(type)}
                    className={`rounded-2xl border px-4 py-5 text-left transition ${
                      active ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-100" : "border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <p className="text-base font-semibold">{card.title}</p>
                    <p className="text-xs text-slate-400">{card.copy}</p>
                  </button>
                );
              })}
            </div>

            {deviceType && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.35em] text-slate-500">Marka</label>
                  <select
                    value={brand}
                    onChange={(event) => handleBrandSelect(event.target.value)}
                    className="w-full rounded-full border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm text-white"
                  >
                    <option value="">Markanı seçin</option>
                    {brandOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.35em] text-slate-500">Model</label>
                  <select
                    value={modelId}
                    onChange={(event) => handleModelSelect(event.target.value)}
                    disabled={!brand}
                    className="w-full rounded-full border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm text-white disabled:opacity-40"
                  >
                    <option value="">Model seçin</option>
                    {modelOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {item.storage}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {brand && modelOptions.length === 0 && (
              <p className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm text-slate-400">
                Bu marka üçün kataloqda uyğun model hələ əlavə olunmayıb.
              </p>
            )}

            {selectedModel && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Seçilmiş cihaz</p>
                    <p className="text-lg font-semibold text-white">{selectedModel.brand} {selectedModel.name}</p>
                    <p className="text-xs text-slate-400">{selectedModel.year} • {selectedModel.chipset} • {selectedModel.storage}</p>
                  </div>
                  <div className="text-right text-sm text-slate-400">
                    <p>Baza qiymət: <span className="text-emerald-300">{formatAZN(selectedModel.basePrice)}</span></p>
                    <p>Döşəmə: {formatAZN(selectedModel.floorPrice)}</p>
                  </div>
                </div>
              </div>
            )}

            {renderStepControls()}
          </section>
        )}

        {step === 2 && deviceType && selectedModel && (
          <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">2. Vəziyyət</p>
              <h2 className="text-2xl font-semibold text-white">İşlək vəziyyəti qiymətləndirin</h2>
              <p className="text-sm text-slate-400">Hər bölmə üçün ən uyğun variantı seçin. Qiymət avtomatik yenilənəcək.</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Model</p>
                  <p className="font-semibold text-white">{selectedModel.brand} {selectedModel.name}</p>
                  <p className="text-xs text-slate-400">{selectedModel.year} • {selectedModel.chipset} • {selectedModel.storage}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Təklif</p>
                  <p className="text-2xl font-semibold text-white">{valuation.suggestion ? formatAZN(valuation.suggestion) : "—"}</p>
                  <p className="text-xs text-slate-400">{conditionSummary}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                <span className="rounded-full border border-slate-800 px-3 py-1">Risk: {riskScore}</span>
                <span className="rounded-full border border-slate-800 px-3 py-1">Döşəmə {formatAZN(selectedModel.floorPrice)}</span>
              </div>
            </div>

            <div className="space-y-4">
              {CONDITION_QUESTIONS[deviceType].map((question) => (
                <div key={question.id} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{question.label}</p>
                      <p className="text-xs text-slate-500">{question.helper}</p>
                    </div>
                    {conditionAnswers[question.id] && (
                      <span className="text-xs text-emerald-300">Seçildi</span>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {question.options.map((option) => {
                      const active = conditionAnswers[question.id] === option.id;
                      const tone = option.impact < 0 ? "text-amber-300" : "text-emerald-300";
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleConditionAnswer(question.id, option.id)}
                          className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                            active
                              ? option.impact < 0
                                ? "border-amber-500/60 bg-amber-500/10"
                                : "border-emerald-500/60 bg-emerald-500/10"
                              : "border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <p className="font-semibold">{option.label}</p>
                          <p className="text-xs text-slate-400">{option.helper}</p>
                          {active && (
                            <p className={`mt-1 text-xs ${tone}`}>
                              {option.impact >= 0 ? "+" : ""}
                              {Math.round(selectedModel.basePrice * option.impact)} AZN
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Düzəlişlər</p>
              <ul className="mt-3 space-y-1">
                {valuation.adjustments.length === 0 && <li>Hələlik düzəliş yoxdur.</li>}
                {valuation.adjustments.map((adj) => (
                  <li key={adj.label} className={adj.impact < 0 ? "text-amber-200" : "text-emerald-200"}>
                    {adj.label}: {adj.impact >= 0 ? "+" : ""}
                    {adj.impact} AZN
                  </li>
                ))}
              </ul>
            </div>

            {renderStepControls()}
          </section>
        )}

        {step === 3 && selectedModel && (
          <section className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">3. Qiymət</p>
              <h2 className="text-2xl font-semibold text-white">Qiyməti təsdiqlə və sübut əlavə et</h2>
              <p className="text-sm text-slate-400">Minimum iki foto və {identifierLabel} kodu tələb olunur. OCR ilə kodu tez tapın.</p>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 text-xs">
                {(Object.keys(overlayLabels) as OverlayKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setOverlay(key)}
                    className={`rounded-full border px-3 py-1 ${
                      overlay === key ? "border-emerald-500/60 text-emerald-200" : "border-slate-800 text-slate-400"
                    }`}
                  >
                    {overlayLabels[key]}
                  </button>
                ))}
              </div>

              <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-800 bg-black">
                <Webcam
                  key={facingMode}
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  mirrored={facingMode === "user"}
                  videoConstraints={videoConstraints}
                  onUserMedia={() => setCameraReady(true)}
                  onUserMediaError={() => {
                    setCameraReady(false);
                    toast.error("Kamera icazəsi verilmədi");
                  }}
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 m-4 rounded-2xl border-2 border-dashed border-white/30" />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="rounded-full bg-black/40 px-3 py-1 text-xs text-white">{overlayHints[overlay]}</span>
                </div>
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button
                    type="button"
                    onClick={scanIdentifier}
                    disabled={scanning || (!cameraReady && photos.length === 0)}
                    className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white"
                  >
                    {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : identifierLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraReady(false);
                      setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
                    }}
                    className="rounded-full bg-white/10 px-3 py-2 text-white"
                    aria-label="Switch camera"
                  >
                    <SwitchCamera className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="rounded-full bg-white/10 px-3 py-2 text-white"
                    aria-label="Pick from gallery"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handlePhotoCapture}
                    disabled={!cameraReady}
                    className="rounded-full bg-white px-3 py-2 text-black"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (event) => {
                  const input = event.currentTarget;
                  const files = input?.files;
                  if (files) addPhotoFiles(Array.from(files));
                  if (input) input.value = "";
                }}
              />

              <input
                ref={ocrInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (event) => {
                  const input = event.currentTarget;
                  const file = input?.files?.[0];
                  if (file) {
                    setScanning(true);
                    try {
                      const parsed = await ocrIdentifierFromFile(file);
                      if (parsed) {
                        setIdentifier(parsed);
                        toast.success(`${identifierLabel} tapıldı`);
                      } else {
                        toast.error(`${identifierLabel} oxunmadı`);
                      }
                    } catch (error) {
                      console.error(error);
                      toast.error("OCR zamanı xəta baş verdi");
                    } finally {
                      setScanning(false);
                    }
                  }
                  if (input) input.value = "";
                }}
              />

              {photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {photos.map((photo, idx) => (
                    <div key={photo.previewUrl} className="relative h-24 w-24 overflow-hidden rounded-xl border border-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.previewUrl} alt={`photo-${idx}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhotoAt(idx)}
                        className="absolute right-1 top-1 rounded-full bg-rose-500/80 p-1 text-white"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.35em] text-slate-500">{identifierLabel}</label>
                <div className="flex gap-2">
                  <input
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder={deviceType === "computer" ? "C02..." : "354..."}
                    className="w-full rounded-full border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => ocrInputRef.current?.click()}
                    disabled={scanning}
                    className="shrink-0 rounded-full border border-slate-800 px-4 py-2 text-xs text-slate-300 disabled:opacity-40"
                  >
                    OCR
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.35em] text-slate-500">Qiymət (AZN)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    className="flex-1 rounded-full border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setPrice(String(valuation.suggestion))}
                    className="rounded-full border border-slate-800 px-4 py-2 text-xs text-slate-300"
                  >
                    {valuation.suggestion ? formatAZN(valuation.suggestion) : "Təklif"}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.35em] text-slate-500">Qısa qeyd</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Məs: Ekranda kiçik cızıq, kabel yoxdur"
                className="min-h-22.5 w-full rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-sm"
              />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Yekun xülasə</p>
                <span className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-400">
                  Foto: {photos.length}/{MAX_PHOTOS}
                </span>
                <span className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-400">
                  Risk: {riskScore}
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold text-white">{priceNumber ? formatAZN(priceNumber) : "—"}</p>
              <p className="text-xs text-slate-500">{conditionSummary}</p>
            </div>

            {renderStepControls()}
          </section>
        )}
      </div>
    </div>
  );
};
