import type { DatasetIconName } from "@/types/Dataset";
import {
  Accessibility,
  AlertTriangle,
  Archive,
  Ban,
  Bus,
  Car,
  ClipboardList,
  Gauge,
  Leaf,
  PackageOpen,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<DatasetIconName, LucideIcon> = {
  car: Car,
  bus: Bus,
  import: PackageOpen,
  archive: Archive,
  ban: Ban,
  accessibility: Accessibility,
  gauge: Gauge,
  users: Users,
  leaf: Leaf,
  alert: AlertTriangle,
  clipboard: ClipboardList,
};

export function DatasetIcon({
  name,
  className,
}: {
  name: DatasetIconName;
  className?: string;
}) {
  const Icon = ICON_MAP[name] ?? Car;
  return <Icon className={className} aria-hidden />;
}
