import { cn, scoreColor } from "@/lib/utils";

interface ScoreBarProps {
  score: number | null | undefined;
  label?: string;
  className?: string;
}

export function ScoreBar({ score, label, className }: ScoreBarProps) {
  const pct = score != null ? Math.min(100, Math.max(0, score)) : 0;
  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-mono text-foreground">{score != null ? Math.round(score) : "—"}</span>
        </div>
      )}
      <div className="score-bar">
        <div
          className={cn("score-bar-fill", scoreColor(score))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
