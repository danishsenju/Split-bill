"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, UserPlus, UserMinus, Users, Copy, Check, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import Grainient from "@/components/ui/Grainient";
import { useLang, inviteT } from "@/lib/language-context";

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


export default function FriendsClient({
  initialFriends,
  userId,
  ownName,
}: {
  initialFriends: Friendship[];
  userId: string;
  ownName: string;
}) {
  const router = useRouter();
  const { lang } = useLang();
  const tInvite = inviteT[lang];
  const [friends, setFriends] = useState<Friendship[]>(initialFriends);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");
  const inviteLink = `${appUrl}/invite/${userId}`;

  function copyInvite() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function shareInviteWA() {
    const msg = tInvite.waMessage(ownName, inviteLink);
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

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
    <div
      className="theme-aware"
      style={{
        background: "var(--theme-bg)",
        minHeight: "100dvh",
        paddingBottom: "96px",
      }}
    >

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

        {/* ── INVITE HERO — share link, auto-friend on signup ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="relative overflow-hidden"
          style={{
            borderRadius: "22px",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 18px 44px rgba(124,58,237,0.18)",
          }}
        >
          {/* Grainient backdrop */}
          <div className="absolute inset-0 z-0" aria-hidden>
            <Grainient
              color1="#7c1fb3"
              color2="#2563eb"
              color3="#db2777"
              timeSpeed={0.3}
              colorBalance={0}
              warpStrength={1}
              warpFrequency={5}
              warpSpeed={2}
              warpAmplitude={50}
              blendAngle={0}
              blendSoftness={0.05}
              rotationAmount={500}
              noiseScale={2}
              grainAmount={0.12}
              grainScale={2}
              grainAnimated={false}
              contrast={1.5}
              gamma={1}
              saturation={1.2}
              centerX={0}
              centerY={0}
              zoom={0.9}
            />
            <div
              className="absolute inset-0"
              style={{ background: "rgba(0,0,0,0.34)" }}
            />
          </div>

          <div className="relative z-10 p-5">
            <div className="flex items-center gap-2">
              <Link2 size={14} style={{ color: "#fbbf24" }} />
              <span
                className="font-dm uppercase"
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.16em",
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                {tInvite.heroKicker}
              </span>
            </div>

            <h2
              className="font-clash font-bold mt-2.5"
              style={{
                fontSize: "20px",
                color: "#fff",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                textShadow: "0 2px 14px rgba(0,0,0,0.5)",
              }}
            >
              {tInvite.heroTitle}
            </h2>
            <p
              className="font-dm mt-2"
              style={{
                fontSize: "12.5px",
                lineHeight: 1.5,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              {tInvite.heroDesc}
            </p>

            {/* Link chip */}
            <div
              className="flex items-center gap-2 mt-4 overflow-hidden"
              style={{
                borderRadius: "12px",
                background: "rgba(0,0,0,0.32)",
                border: "1px solid rgba(255,255,255,0.16)",
                padding: "10px 12px",
                backdropFilter: "blur(8px)",
              }}
            >
              <span
                className="font-jetbrains flex-1 min-w-0 truncate"
                style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)" }}
              >
                {inviteLink.replace(/^https?:\/\//, "")}
              </span>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2.5 mt-3">
              <button
                onClick={copyInvite}
                className="flex items-center justify-center gap-1.5 font-dm font-medium active:scale-[0.97]"
                style={{
                  padding: "11px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  color: "#fff",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  backdropFilter: "blur(8px)",
                  transition: "transform 140ms cubic-bezier(0.23,1,0.32,1)",
                }}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? tInvite.copied : tInvite.copy}
              </button>
              <button
                onClick={shareInviteWA}
                className="flex items-center justify-center gap-1.5 font-dm font-medium active:scale-[0.97]"
                style={{
                  padding: "11px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  color: "#fff",
                  background: "linear-gradient(135deg, #25D366, #128C7E)",
                  boxShadow: "0 8px 20px rgba(37,211,102,0.3)",
                  transition: "transform 140ms cubic-bezier(0.23,1,0.32,1)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
                </svg>
                {tInvite.shareWA}
              </button>
            </div>
          </div>
        </motion.div>

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
                color: "var(--theme-text)",
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
                      style={{ background: "var(--theme-surface-tint-2)", color: "var(--theme-text)", fontSize: "13px" }}
                    >
                      {getInitial(r.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-dm font-medium text-frost text-sm">{r.name}</p>
                      {r.username && (
                        <p className="font-dm text-whisper" style={{ fontSize: "11px" }}>@{r.username}</p>
                      )}
                    </div>
                    <div className="shrink-0">
                      <PrimaryButton
                        onClick={() => addFriend(r.id)}
                        disabled={addingId === r.id}
                        fullWidth={false}
                        innerClassName="py-1.5 px-3.5 text-xs"
                      >
                        <UserPlus size={12} />
                        {addingId === r.id ? "..." : "Tambah"}
                      </PrimaryButton>
                    </div>
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
                        style={{ background: "var(--theme-surface-tint-2)", color: "var(--theme-text)", fontSize: "13px" }}
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
