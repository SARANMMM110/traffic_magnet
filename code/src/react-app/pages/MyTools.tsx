import DashboardLayout from "@/react-app/components/DashboardLayout";

export default function MyTools() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold">My Tools</h1>
        <p className="text-muted-foreground mt-2">
          Your created tools will appear here...
        </p>
      </div>
    </DashboardLayout>
  );
}
