"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { ScanResult } from "@/types";

type ScanItem = ScanResult["items"][number];

interface Props {
  items: ScanItem[];
  onChange: (items: ScanItem[]) => void;
}

export default function ReceiptEditList({ items, onChange }: Props) {
  // Track original prices to show diff
  const [originals] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((item) => [item.id, item.price]))
  );

  function updateItem(id: string, field: keyof Omit<ScanItem, "id">, rawValue: string) {
    onChange(
      items.map((item) => {
        if (item.id !== id) return item;
        if (field === "name") return { ...item, name: rawValue };
        const num = parseFloat(rawValue);
        return { ...item, [field]: isNaN(num) ? 0 : num };
      })
    );
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  function addItem() {
    const newId = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newItem: ScanItem = { id: newId, name: "", price: 0, qty: 1 };
    onChange([...items, newItem]);
  }

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Column headers */}
      <div className="grid grid-cols-12 gap-1 px-1">
        <p className="col-span-5 text-text-muted text-[10px] font-dm uppercase tracking-wide">
          Item
        </p>
        <p className="col-span-2 text-text-muted text-[10px] font-dm uppercase tracking-wide text-center">
          Qty
        </p>
        <p className="col-span-4 text-text-muted text-[10px] font-dm uppercase tracking-wide text-right">
          Harga (RM)
        </p>
        <div className="col-span-1" />
      </div>

      <AnimatePresence initial={false}>
        {items.map((item) => {
          const originalPrice = originals[item.id];
          const isEdited =
            originalPrice !== undefined && originalPrice !== item.price;

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, height: 0 }}
              className="surface-card rounded-card p-3 flex flex-col gap-2"
            >
              <div className="grid grid-cols-12 gap-1 items-center">
                {/* Name */}
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                  placeholder="Nama item"
                  className="col-span-5 bg-bg-primary border border-white/10 rounded-input px-2 py-1.5 text-text-primary font-dm text-xs"
                />

                {/* Qty */}
                <input
                  type="number"
                  inputMode="numeric"
                  value={item.qty}
                  min={1}
                  onChange={(e) => updateItem(item.id, "qty", e.target.value)}
                  className="col-span-2 bg-bg-primary border border-white/10 rounded-input px-2 py-1.5 text-text-primary font-dm text-xs text-center"
                />

                {/* Price */}
                <div className="col-span-4 relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={item.price}
                    min={0}
                    step={0.01}
                    onChange={(e) => updateItem(item.id, "price", e.target.value)}
                    className="w-full bg-bg-primary border border-white/10 rounded-input px-2 py-1.5 text-text-primary font-dm text-xs text-right pr-2"
                  />
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="col-span-1 flex items-center justify-center text-danger"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Edited indicator */}
              {isEdited && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-warning/20 text-warning px-1.5 py-0.5 rounded-pill font-dm">
                    ✏️ Diedit
                  </span>
                  <span className="text-text-muted text-[10px] font-dm line-through">
                    RM {originalPrice.toFixed(2)}
                  </span>
                  <span className="text-text-secondary text-[10px] font-dm">
                    → RM {item.price.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Line total */}
              <div className="flex justify-end">
                <span className="text-text-muted text-[10px] font-dm">
                  Jumlah: RM {(item.price * item.qty).toFixed(2)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Add item button */}
      <button
        onClick={addItem}
        className="flex items-center justify-center gap-2 border border-dashed border-white/20 rounded-card py-3 text-text-secondary text-sm font-dm"
      >
        <Plus size={15} />
        Tambah Item
      </button>

      {/* Grand total */}
      <div className="flex items-center justify-between surface-card rounded-card px-4 py-3">
        <span className="text-text-secondary font-dm text-sm">Jumlah Keseluruhan</span>
        <span className="font-syne font-bold text-accent text-base">
          RM {total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
