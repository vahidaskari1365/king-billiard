export default function Loading() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="size-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <div className="text-sm text-muted font-display tracking-widest">CUEVERSE</div>
      </div>
    </div>
  );
}
