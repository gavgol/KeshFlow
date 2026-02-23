import { useState, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  PanInfo,
} from "framer-motion";
import { Phone, MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Tables } from "@/integrations/supabase/types";

type Contact = Tables<"contacts">;

const SWIPE_THRESHOLD = 80;

interface Props {
  contact: Contact;
  children: React.ReactNode;
}

export function SwipeableContactRow({ contact, children }: Props) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const phone = contact.phone?.replace(/\D/g, "") ?? "";

  // Right swipe = WhatsApp (positive x), Left swipe = Phone (negative x)
  // In RTL, visual directions are flipped, but drag x values stay the same
  const rightBg = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const leftBg = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const offset = info.offset.x;

    if (offset > SWIPE_THRESHOLD && phone) {
      // Swiped right → WhatsApp
      window.open(buildWhatsAppUrl(contact.phone!, contact.name), "_blank");
    } else if (offset < -SWIPE_THRESHOLD && contact.phone) {
      // Swiped left → Phone call
      window.location.href = `tel:${contact.phone}`;
    }

    controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 30 } });
  };

  return (
    <div className="relative overflow-hidden rounded-xl md:overflow-visible">
      {/* Right swipe background – WhatsApp */}
      <motion.div
        className="absolute inset-y-0 start-0 flex items-center ps-5 rounded-xl"
        style={{
          opacity: rightBg,
          backgroundColor: "hsl(var(--whatsapp))",
          width: "50%",
        }}
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </motion.div>

      {/* Left swipe background – Phone */}
      <motion.div
        className="absolute inset-y-0 end-0 flex items-center justify-end pe-5 rounded-xl"
        style={{
          opacity: leftBg,
          backgroundColor: "hsl(var(--primary))",
          width: "50%",
        }}
      >
        <Phone className="h-6 w-6 text-white" />
      </motion.div>

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        style={{ x }}
        animate={controls}
        onDragEnd={handleDragEnd}
        className="relative z-10 bg-background touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
