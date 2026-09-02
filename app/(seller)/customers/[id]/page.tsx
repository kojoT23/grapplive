"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { IconArrowLeft, IconCrown, IconPlus } from "@tabler/icons-react";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useCustomersStore } from "@/lib/store/useCustomersStore";

function formatGHS(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH")}`;
}

export default function CustomerProfilePage() {
  const { isChecking } = useRequireAuth("sell");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const customers = useCustomersStore((s) => s.customers);
  const addTag = useCustomersStore((s) => s.addTag);
  const updateNotes = useCustomersStore((s) => s.updateNotes);

  const customer = customers.find((c) => c.id === params.id);
  const [newTag, setNewTag] = useState("");
  const [notesDraft, setNotesDraft] = useState(customer?.notes ?? "");
  const [notesSaved, setNotesSaved] = useState(false);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[12px] text-gl-text-secondary">Loading…</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="px-3 md:px-5 pt-3.5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-[11px] text-gl-text-secondary mb-4 active:opacity-60 transition-opacity"
        >
          <IconArrowLeft size={14} /> Back
        </button>
        <div className="text-[12px] text-gl-text-secondary">Customer not found.</div>
      </div>
    );
  }

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    addTag(customer.id, newTag);
    setNewTag("");
  };

  const handleSaveNotes = () => {
    updateNotes(customer.id, notesDraft);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 1500);
  };

  return (
    <div className="pb-8">
      <div className="px-3 md:px-5 pt-3.5 pb-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-[11px] text-gl-text-secondary mb-3 active:opacity-60 transition-opacity"
        >
          <IconArrowLeft size={14} /> Back
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-full bg-gl-bg-placeholder shrink-0" />
          <div>
            <div className="text-[14px] font-semibold text-gl-text flex items-center gap-1">
              {customer.segment === "vip" && (
                <IconCrown size={14} className="text-gl-gold-crown" />
              )}
              {customer.name}
            </div>
            <div className="text-[10px] text-gl-text-secondary">
              {customer.ordersCount} orders · {formatGHS(customer.lifetimeSpendGHS)} lifetime
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {customer.tags.map((tag) => (
            <span
              key={tag}
              className="bg-gl-bg-muted text-gl-text-secondary text-[9px] px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex gap-1.5 mb-5">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
            placeholder="Add a tag…"
            className="flex-1 border border-gl-border-strong rounded-md px-2.5 py-1.5 text-[10px] text-gl-text outline-none"
          />
          <button
            onClick={handleAddTag}
            className="bg-gl-bg-muted rounded-md px-2.5 flex items-center justify-center active:bg-gl-border transition-colors"
          >
            <IconPlus size={14} className="text-gl-text-secondary" />
          </button>
        </div>

        <h2 className="text-[11px] font-semibold text-gl-text mb-1.5">Order history</h2>
        <div className="mb-5">
          {customer.orderHistory.length === 0 ? (
            <div className="text-[10px] text-gl-text-secondary py-2">No orders yet.</div>
          ) : (
            customer.orderHistory.map((order) => (
              <div
                key={order.id}
                className="flex justify-between py-2 border-b border-gl-bg-muted last:border-b-0"
              >
                <div>
                  <div className="text-[10px] text-gl-text">{order.itemName}</div>
                  <div className="text-[9px] text-gl-text-secondary">{order.date}</div>
                </div>
                <div className="text-[10px] text-gl-text font-semibold">
                  {formatGHS(order.amountGHS)}
                </div>
              </div>
            ))
          )}
        </div>

        <h2 className="text-[11px] font-semibold text-gl-text mb-1.5">Notes</h2>
        <textarea
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          placeholder="Private notes about this customer…"
          rows={3}
          className="w-full border border-gl-border-strong rounded-md px-2.5 py-2 text-[10px] text-gl-text outline-none resize-none mb-2"
        />
        <button
          onClick={handleSaveNotes}
          className="w-full bg-gl-bg-muted text-gl-text rounded-md py-2 text-[10px] font-semibold active:bg-gl-border transition-colors"
        >
          {notesSaved ? "Saved ✓" : "Save notes"}
        </button>
      </div>
    </div>
  );
}
