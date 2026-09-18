import { Pencil } from "lucide-react";
import { PageTitle } from "@/components/dashboard/PageTitle";
import { DataTable } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/Button";
import { contentBlocks } from "@/data/dashboard";

export const metadata = { title: "Website content" };

const columns = [
  { key: "label", label: "Section", render: (row) => <span className="font-medium text-slate-900">{row.label}</span> },
  { key: "description", label: "Description", className: "whitespace-normal min-w-[16rem]" },
  { key: "key", label: "Key", render: (row) => <span className="font-mono text-xs text-slate-500">{row.key}</span> },
  { key: "updated", label: "Updated" },
  {
    key: "actions",
    label: "",
    className: "text-right",
    render: () => (
      <Button variant="ghost" size="sm" leftIcon={Pencil}>
        Edit
      </Button>
    ),
  },
];

export default function DashboardContentPage() {
  return (
    <>
      <PageTitle title="Website content" description="Editable text blocks that feed the public website." />
      <DataTable columns={columns} rows={contentBlocks} rowKey="key" caption="Editable content blocks" />
    </>
  );
}
