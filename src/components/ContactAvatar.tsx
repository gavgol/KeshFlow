import { cn } from "@/lib/utils";

// These extended Tailwind palette classes are referenced as string literals
// so they remain in the bundle (not purged).
const AVATAR_COLORS = [
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-indigo-100", text: "text-indigo-700" },
];

function getColorIndex(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_COLORS.length;
}

interface ContactAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ContactAvatar({ name, size = "md", className }: ContactAvatarProps) {
  const color = AVATAR_COLORS[getColorIndex(name)];
  const sizeClass =
    size === "sm"
      ? "h-8 w-8 text-xs"
      : size === "lg"
      ? "h-12 w-12 text-base"
      : "h-10 w-10 text-sm";

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        color.bg,
        color.text,
        sizeClass,
        className
      )}
    >
      {initials || "?"}
    </div>
  );
}
