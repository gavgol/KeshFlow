import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Briefcase, Search } from "lucide-react";
import { ContactAvatar } from "@/components/ContactAvatar";

interface SearchResult {
  id: string;
  type: "contact" | "deal";
  title: string;
  subtitle?: string;
}

// Singleton event to open the palette from anywhere
const OPEN_EVENT = "chameleon:open-command-palette";

export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Keyboard shortcut + custom event
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onCustomOpen = () => setOpen(true);
    document.addEventListener("keydown", down);
    window.addEventListener(OPEN_EVENT, onCustomOpen);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener(OPEN_EVENT, onCustomOpen);
    };
  }, []);

  const search = useCallback(
    async (q: string) => {
      if (!user || !q.trim()) { setResults([]); return; }
      setLoading(true);
      const term = `%${q.trim()}%`;

      const [contactsRes, dealsRes] = await Promise.all([
        supabase
          .from("contacts")
          .select("id, name, phone, company")
          .eq("user_id", user.id)
          .or(`name.ilike.${term},phone.ilike.${term},company.ilike.${term}`)
          .limit(6),
        supabase
          .from("deals")
          .select("id, title, value")
          .eq("user_id", user.id)
          .ilike("title", term)
          .limit(6),
      ]);

      const items: SearchResult[] = [];
      (contactsRes.data ?? []).forEach((c) =>
        items.push({ id: c.id, type: "contact", title: c.name, subtitle: c.phone || c.company || undefined })
      );
      (dealsRes.data ?? []).forEach((d) =>
        items.push({ id: d.id, type: "deal", title: d.title, subtitle: d.value ? `₪${d.value.toLocaleString()}` : undefined })
      );
      setResults(items);
      setLoading(false);
    },
    [user]
  );

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 200);
    return () => clearTimeout(timeout);
  }, [query, search]);

  const handleSelect = (item: SearchResult) => {
    setOpen(false);
    setQuery("");
    if (item.type === "contact") navigate("/contacts");
    else navigate("/kanban");
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="חפש אנשי קשר, עסקאות..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>{loading ? "מחפש..." : "לא נמצאו תוצאות."}</CommandEmpty>
        {results.filter((r) => r.type === "contact").length > 0 && (
          <CommandGroup heading="אנשי קשר">
            {results.filter((r) => r.type === "contact").map((item) => (
              <CommandItem key={item.id} value={item.title} onSelect={() => handleSelect(item)} className="gap-3 cursor-pointer">
                <ContactAvatar name={item.title} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">{item.title}</span>
                  {item.subtitle && <span className="block text-xs text-muted-foreground truncate">{item.subtitle}</span>}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results.filter((r) => r.type === "deal").length > 0 && (
          <CommandGroup heading="עסקאות">
            {results.filter((r) => r.type === "deal").map((item) => (
              <CommandItem key={item.id} value={item.title} onSelect={() => handleSelect(item)} className="gap-3 cursor-pointer">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">{item.title}</span>
                  {item.subtitle && <span className="block text-xs text-muted-foreground">{item.subtitle}</span>}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
