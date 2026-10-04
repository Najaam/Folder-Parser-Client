import { useEffect, useState } from "react";
import {
  Folder,
  FileCode2,
  CheckCircle2,
  XCircle,
  FunctionSquare,
  Download,
  Upload,
  Boxes,
  Route
} from "lucide-react";
import "./StatsCards.css";

export default function StatsCards({ stats }) {
  const [displayValues, setDisplayValues] = useState({});
  const cards = [
    {
      title: "Folders",
      value: stats.totalFolders,
      icon: Folder
    },
    {
      title: "Files",
      value: stats.totalFiles,
      icon: FileCode2
    },
    {
      title: "Parsed Files",
      value: stats.parsedFiles,
      icon: CheckCircle2
    },
    {
      title: "Unsupported",
      value: stats.unsupportedFiles,
      icon: XCircle
    },
    {
      title: "Functions",
      value: stats.totalFunctions,
      icon: FunctionSquare
    },
    {
      title: "Import Modules",
      value: stats.totalImports,
      icon: Download
    },
    {
      title: "Exports",
      value: stats.totalExports,
      icon: Upload
    },
    {
      title: "Classes",
      value: stats.totalClasses,
      icon: Boxes
    },
    {
      title: "API Routes",
      value: stats.totalApiRoutes,
      icon: Route
    }
  ];

  useEffect(() => {
    const target = Object.fromEntries(cards.map(({ title, value }) => [title, Number(value) || 0]));
    const startedAt = performance.now();
    let frameId;
    const update = (now) => {
      const progress = Math.min((now - startedAt) / 720, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValues(Object.fromEntries(Object.entries(target).map(([key, value]) => [key, Math.round(value * eased)])));
      if (progress < 1) frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [stats]);

  return (
    <section className="stats-grid analyzer-enter metrics-enter">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div className="stat-card" key={card.title}>
            <div className="stat-icon">
              <Icon size={20} />
            </div>

            <div>
              <p>{card.title}</p>
              <h3>{displayValues[card.title] ?? card.value}</h3>
            </div>
          </div>
        );
      })}
    </section>
  );
}
