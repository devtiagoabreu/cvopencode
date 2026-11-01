import Link from "next/link";
import { cn } from "@/lib/utils";

export function Brand({ className, href = "/" }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-baseline gap-1 text-base font-semibold tracking-tight",
        className,
      )}
    >
      <span>cvopencode</span>
      <span aria-hidden="true" className="font-mono text-sm text-primary">
        &gt;_
      </span>
    </Link>
  );
}
