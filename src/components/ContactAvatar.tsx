import * as React from "react";
import { cn } from "@/lib/utils";

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

interface ContactAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  size?: "sm" | "md" | "lg";
}

export const ContactAvatar = React.forwardRef<HTMLDivElement, ContactAvatarProps>(
  ({ name, size = "md", className, ...props }, ref) => {
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
        ref={ref}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full font-semibold select-none",
          color.bg,
          color.text,
          sizeClass,
          className
        )}
        {...props}
      >
        {initials || "?"}
      </div>
    );
  }
);

ContactAvatar.displayName = "ContactAvatar";
