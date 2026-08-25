import { Download } from "lucide-react";

export function ExportButton({ data, filename, label = "Export" }) {
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 rounded-full border border-primary/20 bg-surface/50 px-4 py-2 text-sm font-medium text-primary hover:border-accent hover:bg-accent/5 transition"
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}