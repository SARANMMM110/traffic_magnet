interface CaptureFlowBuilderPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeploy: (data: { publicId: string }) => void;
}

export default function CaptureFlowBuilderPanel({ open, onOpenChange, onDeploy: _onDeploy }: CaptureFlowBuilderPanelProps) {
  // Placeholder component - will be implemented later
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50" onClick={() => onOpenChange(false)}>
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Capture Flow Builder</h2>
        <p className="text-sm text-gray-600">Coming soon...</p>
      </div>
    </div>
  );
}
