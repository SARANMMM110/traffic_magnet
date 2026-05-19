import CaptureFlowBuilder from "./CaptureFlowBuilder";

interface CaptureFlowBuilderPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeploy: (data: { publicId: string; flowId?: number }) => void;
}

export default function CaptureFlowBuilderPanel({ open, onOpenChange, onDeploy }: CaptureFlowBuilderPanelProps) {
  return (
    <CaptureFlowBuilder
      open={open}
      onOpenChange={onOpenChange}
      onDeploy={(data) => onDeploy({ publicId: data.publicId, flowId: data.flowId })}
    />
  );
}
