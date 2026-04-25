import {
  Folder,
  FileCode2,
  CheckCircle2,
  XCircle,
  FunctionSquare,
  Download,
  Upload,
  Boxes,
  AlertCircle,
  Route
} from "lucide-react";

export default function StatsCards({ stats }) {
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
      title: "Unused Imports",
      value: stats.unusedImportedItems,
      icon: AlertCircle
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

  return (
    <section className="stats-grid">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div className="stat-card" key={card.title}>
            <div className="stat-icon">
              <Icon size={20} />
            </div>

            <div>
              <p>{card.title}</p>
              <h3>{card.value}</h3>
            </div>
          </div>
        );
      })}
    </section>
  );
}