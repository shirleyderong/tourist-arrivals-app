export default function Msg({
  kind,
  children,
}: {
  kind: "info" | "success" | "warning" | "error";
  children: React.ReactNode;
}) {
  return <div className={`msg ${kind}`}>{children}</div>;
}
