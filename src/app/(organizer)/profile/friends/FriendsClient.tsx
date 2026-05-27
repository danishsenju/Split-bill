"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, UserPlus, UserMinus, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface FriendProfile {
  id: string;
  name: string;
  username?: string;
}

interface Friendship {
  id: string;
  friend_user_id: string;
  created_at: string;
  profiles: FriendProfile | null;
}

interface SearchResult {
  id: string;
  name: string;
  username?: string;
}

const GRADIENT = "linear-gradient(90deg, rgb(160, 224, 171), rgb(255, 172, 46) 50%, rgb(165, 45, 37))";
const PILL = "75.024px";

export default function FriendsClient({ initialFriends }: { initialFriends: Friendship[] }) {
  const router = useRouter();
  const [friends, setFriends] = useState<Friendship[]>(initialFriends);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/friends?q=${encodeURIComponent(query)}`);
        const json = await res.json() as { results?: SearchResult[] };
        setResults(json.results ?? []);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  async function addFriend(friendUserId: string) {
    setAddingId(friendUserId);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendUserId }),
      });
      if (!res.ok) return;
      // Remove from search results, optimistically add to friends list
      const added = results.find((r) => r.id === friendUserId);
      if (added) {
        setFriends((prev) => [
          {
            id: crypto.randomUUID(),
            friend_user_id: friendUserId,
            created_at: new Date().toISOString(),
            profiles: { id: added.id, name: added.name, username: added.username },
          },
          ...prev,
        ]);
        setResults((prev) => prev.filter((r) => r.id !== friendUserId));
      }
    } finally {
      setAddingId(null);
    }
  }

  async function removeFriend(friendUserId: string) {
    setRemovingId(friendUserId);
    try {
      const res = await fetch("/api/friends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendUserId }),
      });
      if (!res.ok) return;
      setFriends((prev) => prev.filter((f) => f.friend_user_id !== friendUserId));
    } finally {
      setRemovingId(null);
    }
  }

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div style={{ background: "#000000", minHeight: "100dvh", paddingBottom: "96px" }}>

      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4 md:top-[60px]"
        style={{
          background: "rgba(0,0,0,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="active:scale-[0.88] shrink-0"
          style={{ color: "#6d6d6d", transition: "transform 160ms cubic-bezier(0.23,1,0.32,1)" }}
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-clash font-bold text-frost flex-1 leading-none" style={{ fontSize: "18px" }}>
          Kenalan
        </h1>
        <span
          className="font-dm shrink-0"
          style={{
            fontSize: "12px",
            padding: "4px 12px",
            borderRadius: "99px",
            background: "rgba(255,255,255,0.06)",
            color: "#6d6d6d",
          }}
        >
          {friends.length}
        </span>
      </header>

      <div className="px-5 pt-6 flex flex-col gap-6">

        {/* Search box */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        >
          <p className="font-dm uppercase mb-3" style={{ fontSize: "10px", letterSpacing: "0.10em", color: "#6d6d6d" }}>
            Cari Pengguna
          </p>
          <div className="relative">
            <Search
              size={15}
              className="absolute"
              style={{ left: "14px", top: "50%", transform: "translateY(-50%)", color: "#6d6d6d", pointerEvents: "none" }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari username..."
              className="font-dm w-full"
              style={{
                background: "#111111",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                padding: "12px 16px 12px 38px",
                color: "#ffffff",
                fontSize: "14px",
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>

          {/* Search results */}
          <AnimatePresence>
            {(results.length > 0 || searching) && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="mt-2 flex flex-col overflow-hidden"
                style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px" }}
              >
                {searching && results.length === 0 && (
                  <p className="font-dm text-whisper text-sm px-4 py-4">Mencari...</p>
                )}
                {results.map((r, i) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: i < results.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-clash font-bold shrink-0"
                      style={{ background: "rgba(255,255,255,0.06)", color: "#ffffff", fontSize: "13px" }}
                    >
                      {getInitial(r.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-dm font-medium text-frost text-sm">{r.name}</p>
                      {r.username && (
                        <p className="font-dm text-whisper" style={{ fontSize: "11px" }}>@{r.username}</p>
                      )}
                    </div>
                    <button
                      onClick={() => addFriend(r.id)}
                      disabled={addingId === r.id}
                      className="flex items-center gap-1.5 font-dm font-semibold shrink-0 active:scale-[0.92] disabled:opacity-50"
                      style={{
                        background: GRADIENT,
                        borderRadius: PILL,
                        padding: "6px 14px",
                        color: "#000000",
                        fontSize: "12px",
                        transition: "transform 120ms cubic-bezier(0.23,1,0.32,1), opacity 200ms",
                      }}
                    >
                      <UserPlus size={12} />
                      {addingId === r.id ? "..." : "Tambah"}
                    </button>
                  </div>
                ))}
                {!searching && results.length === 0 && query.length >= 2 && (
                  <p className="font-dm text-whisper text-sm px-4 py-4">Tiada pengguna ditemui untuk &quot;{query}&quot;</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Friends list */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        >
          <p className="font-dm uppercase mb-3" style={{ fontSize: "10px", letterSpacing: "0.10em", color: "#6d6d6d" }}>
            Senarai Kenalan
          </p>

          {friends.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 py-10 px-4 text-center"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Users size={20} style={{ color: "#6d6d6d" }} />
              </div>
              <p className="font-dm text-whisper text-sm">
                Belum ada kenalan. Cari username mereka di atas.
              </p>
            </div>
          ) : (
            <div
              className="flex flex-col overflow-hidden"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px" }}
            >
              <AnimatePresence initial={false}>
                {friends.map((f, i) => {
                  const profile = f.profiles;
                  if (!profile) return null;
                  return (
                    <motion.div
                      key={f.friend_user_id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-3 px-4 py-3"
                      style={{ borderBottom: i < friends.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-clash font-bold shrink-0"
                        style={{ background: "rgba(255,255,255,0.06)", color: "#ffffff", fontSize: "13px" }}
                      >
                        {getInitial(profile.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-dm font-medium text-frost text-sm">{profile.name}</p>
                        {profile.username && (
                          <p className="font-dm text-whisper" style={{ fontSize: "11px" }}>@{profile.username}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeFriend(f.friend_user_id)}
                        disabled={removingId === f.friend_user_id}
                        className="active:scale-[0.88] disabled:opacity-40"
                        style={{
                          color: "#ef4444",
                          transition: "transform 160ms cubic-bezier(0.23,1,0.32,1), opacity 200ms",
                        }}
                        title="Buang kenalan"
                      >
                        <UserMinus size={16} />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
