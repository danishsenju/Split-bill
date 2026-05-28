"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { WATone } from "@/types";
import { buildWAMessage, buildWAUrl } from "@/lib/whatsapp";

interface MemberInfo {
  name: string;
  phone: string;
  amount: string;
  link: string;
}

interface Props {
  billTitle: string;
  payCode: string;
  members: MemberInfo[];
  dueDate: string;
  tone: WATone;
  onToneChange: (tone: WATone) => void;
  customTemplate: string;
  onCustomTemplateChange: (template: string) => void;
}

const TONE_LABELS: Record<WATone, string> = {
  firm: "Firm",
  funny: "Funny 😂",
  professional: "Professional",
  custom: "Custom",
};

export default function WAToneSelector({
  billTitle,
  payCode,
  members,
  dueDate,
  tone,
  onToneChange,
  customTemplate,
  onCustomTemplateChange,
}: Props) {
  const [selectedMemberIdx, setSelectedMemberIdx] = useState(0);

  const previewMember = members[selectedMemberIdx] ?? members[0];

  const formattedDue = new Date(dueDate).toLocaleDateString("ms-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const previewMessage = buildWAMessage(
    tone,
    {
      nama: previewMember?.name ?? "Ahli",
      amount: previewMember?.amount ?? "0.00",
      tajuk: billTitle,
      due_date: formattedDue,
      code: payCode,
      link: previewMember?.link ?? "",
    },
    tone === "custom" ? customTemplate : undefined
  );

  function openWA(member: MemberInfo) {
    if (!member.phone) return;
    const msg = buildWAMessage(
      tone,
      {
        nama: member.name,
        amount: member.amount,
        tajuk: billTitle,
        due_date: formattedDue,
        code: payCode,
        link: member.link,
      },
      tone === "custom" ? customTemplate : undefined
    );
    window.open(buildWAUrl(member.phone, msg), "_blank");
  }

  function openAllWA() {
    members.forEach((m) => {
      if (m.phone) openWA(m);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card rounded-card p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-syne font-bold text-text-primary">Hantar WhatsApp</h3>
      </div>

      {/* Tone selector */}
      <div>
        <p className="text-text-muted text-xs font-dm mb-2">Pilih Nada</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(TONE_LABELS) as WATone[]).map((t) => (
            <button
              key={t}
              onClick={() => onToneChange(t)}
              className={`py-2.5 rounded-btn text-xs font-dm font-medium border transition-colors ${
                tone === t
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-white/10 bg-bg-surface text-text-secondary"
              }`}
            >
              {TONE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Custom textarea */}
      {tone === "custom" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <p className="text-text-muted text-xs font-dm mb-2">
            Mesej anda (gunakan {"{nama}"}, {"{amount}"}, {"{code}"}, {"{link}"})
          </p>
          <textarea
            value={customTemplate}
            onChange={(e) => onCustomTemplateChange(e.target.value)}
            placeholder={`Hai {nama}, sila bayar RM {amount}. Code: {code}. {link}`}
            rows={4}
            className="w-full bg-bg-surface border border-white/10 rounded-input px-4 py-3 text-text-primary font-dm text-sm resize-none"
          />
        </motion.div>
      )}

      {/* Member selector (if multiple) */}
      {members.length > 1 && (
        <div>
          <p className="text-text-muted text-xs font-dm mb-2">Preview untuk</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {members.map((m, i) => (
              <button
                key={i}
                onClick={() => setSelectedMemberIdx(i)}
                className={`px-3 py-1.5 rounded-pill text-xs font-dm whitespace-nowrap shrink-0 transition-colors ${
                  selectedMemberIdx === i
                    ? "bg-accent/20 text-accent border border-accent/40"
                    : "bg-bg-surface text-text-secondary border border-white/10"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="bg-bg-primary rounded-input px-4 py-3">
        <p className="text-text-muted text-[10px] font-dm mb-2">PREVIEW</p>
        <p className="text-text-secondary font-dm text-xs leading-relaxed whitespace-pre-wrap">
          {previewMessage}
        </p>
      </div>

      {/* Send buttons */}
      <div className="flex flex-col gap-2">
        {previewMember?.phone && (
          <button
            onClick={() => openWA(previewMember)}
            className="flex items-center justify-center gap-2 bg-success/20 border border-success/30 text-success font-dm font-semibold py-3 rounded-btn text-sm"
          >
            <MessageSquare size={16} />
            Buka WhatsApp — {previewMember.name}
          </button>
        )}

        {members.length > 1 && (
          <button
            onClick={openAllWA}
            className="flex items-center justify-center gap-2 bg-bg-surface border border-white/10 text-text-secondary font-dm text-sm py-3 rounded-btn"
          >
            <MessageSquare size={16} />
            Hantar ke Semua ({members.filter((m) => m.phone).length} ahli)
          </button>
        )}
      </div>

      {members.some((m) => !m.phone) && (
        <p className="text-text-muted text-xs font-dm text-center">
          {members.filter((m) => !m.phone).length} ahli tiada nombor telefon
        </p>
      )}
    </motion.div>
  );
}
