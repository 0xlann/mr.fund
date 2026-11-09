import type { Port } from "./source/types";

/** Preserve authored labels; a live capability must never inherit simulation copy. */
export function ProvenanceTag({
  port,
  label,
  className,
}: {
  port: Port;
  label: string;
  className?: string;
}) {
  if (port.provenance === "simulated" && !/simulat/i.test(label))
    throw new Error("Simulated provenance requires a visible simulation label");
  const text = port.provenance === "simulated" ? label : port.networkLabel;
  return text ? <span className={className}>{text}</span> : null;
}
