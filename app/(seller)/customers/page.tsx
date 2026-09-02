"use client";

import { useState } from "react";
import Link from "next/link";
import { IconSearch, IconCrown, IconMessageCircle, IconCheck } from "@tabler/icons-react";
import { TabBar } from "@/components/ui/TabBar";
import { useRequireAuth } from "@/lib/hooks/useRequireAuth";
import { useCustomersStore } from "@/lib/store/useCustomersStore";
import { sellerTabs } from "@/lib/nav/seller-tabs";
import type { Customer, CustomerSegment } from "@/lib/mock-data/customers";

type FilterPill = "all" | CustomerSegment;

function segmentDot(segment: CustomerSegment) {
  if (segment === "vip") return <IconCrown size={12} className="text-gl-gold-crown" />;
  if (segment === "at_risk") return <span className="text-gl-amber">●</span>;
  if (segment === "repeat") return <span className="text-gl-green">●</span>;
  return null;
}

function CustomerRow({
  customer,
  isSelectMode,
  isSelected,
  onToggle,
}: {
  customer: Customer;
  isSelectMode: boolean;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const content = (
    <>
      <div className="w-8 h-8 rounded-full bg-gl-bg-placeholder shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-gl-text flex items-center gap-1">
          {segmentDot(customer.segment)}
          {customer.name}
        </div>
        <div className="text-[9px] text-gl-text-secondary">
          {customer.ordersCount} orders
          {customer.segment === "at_risk"
            ? ` · last ${customer.lastOrderDaysAgo} days ago`
            : ` · GHS ${customer.lifetimeSpendGHS} lifetime`}
        </div>
        {customer.tags.length > 0 && (
          <div className="mt-0.5 flex gap-1">
            {customer.tags.map((tag) => (
              <span
                key={tag}
                className="bg-gl-bg-muted text-gl-text-secondary text-[8px] px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {isSelectMode ? (
        <div
          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
            isSelected ? "bg-gl-brand border-gl-brand" : "border-gl-border-strong"
          }`}
        >
          {isSelected && <IconCheck size={10} className="text-white" />}
        </div>
      ) : (
        <IconMessageCircle size={16} className="text-gl-text-muted shrink-0" />
      )}
    </>
  );

  const rowClasses =
    "flex items-center gap-2 py-2 border-b border-gl-bg-muted last:border-b-0";

  if (isSelectMode) {
    return (
      <button onClick={onToggle} className={`${rowClasses} w-full text-left active:bg-gl-bg-muted transition-colors`}>
        {content}
      </button>
    );
  }

  return (
    <Link href={`/customers/${customer.id}`} className={`${rowClasses} transition-colors active:bg-gl-bg-muted`}>
      {content}
    </Link>
  );
}

export default function CustomersPage() {
  const { isChecking } = useRequireAuth("sell");
  const customers = useCustomersStore((s) => s.customers);
  const selectedIds = useCustomersStore((s) => s.selectedIds);
  const isSelectMode = useCustomersStore((s) => s.isSelectMode);
  const toggleSelectMode = useCustomersStore((s) => s.toggleSelectMode);
  const toggleSelected = useCustomersStore((s) => s.toggleSelected);
  const sendBulkMessage = useCustomersStore((s) => s.sendBulkMessage);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterPill>("all");
  const [messageDraft, setMessageDraft] = useState("");
  const [showComposer, setShowComposer] = useState(false);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-[12px] text-gl-text-secondary">Loading…</div>
      </div>
    );
  }

  const filtered = customers.filter((c) => {
    const matchesQuery = c.name.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || c.segment === filter;
    return matchesQuery && matchesFilter;
  });

  const pills: { key: FilterPill; label: React.ReactNode }[] = [
    { key: "all", label: `All (${customers.length})` },
    { key: "vip", label: <span className="flex items-center gap-1"><IconCrown size={11} className="text-gl-gold-crown" /> VIP</span> },
    { key: "at_risk", label: <span className="flex items-center gap-1"><span className="text-gl-amber">●</span> At risk</span> },
    { key: "repeat", label: <span className="flex items-center gap-1"><span className="text-gl-green">●</span> Repeat</span> },
  ];

  const handleSend = () => {
    if (!messageDraft.trim()) return;
    const { sentTo } = sendBulkMessage(messageDraft);
    setMessageDraft("");
    setShowComposer(false);
    alert(`Message sent to ${sentTo} customer${sentTo === 1 ? "" : "s"} (mock — no real message sent)`);
  };

  return (
    <div className="pb-16">
      <h1 className="px-3 md:px-5 pt-3.5 pb-2 text-[14px] font-semibold text-gl-text">Customers</h1>

      <div className="mx-3 md:mx-5 mb-2 bg-gl-bg-muted rounded-lg px-2.5 py-1.5 flex items-center gap-1">
        <IconSearch size={12} className="text-gl-text-secondary shrink-0" />
        <input
          type="text"
          placeholder="Search name or number"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-transparent text-[10px] text-gl-text placeholder:text-gl-text-secondary outline-none flex-1"
        />
      </div>

      <div className="flex gap-1.5 px-3 md:px-5 pb-2 overflow-x-auto">
        {pills.map((pill) => (
          <button
            key={pill.key}
            onClick={() => setFilter(pill.key)}
            className={`text-[9px] font-semibold px-2.5 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              filter === pill.key
                ? "bg-gl-brand text-white"
                : "bg-gl-bg-muted text-gl-text-secondary active:bg-gl-border"
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-3 md:px-5 pb-2">
        <span className="text-[9px] text-gl-text-secondary">Sort: Last order</span>
        <button
          onClick={toggleSelectMode}
          className="text-[9px] font-semibold text-gl-brand active:opacity-70 transition-opacity"
        >
          {isSelectMode ? "Cancel" : "Select"}
        </button>
      </div>

      <div className="px-3 md:px-5">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-[11px] text-gl-text-secondary">
            No customers match.
          </div>
        ) : (
          filtered.map((customer) => (
            <CustomerRow
              key={customer.id}
              customer={customer}
              isSelectMode={isSelectMode}
              isSelected={selectedIds.has(customer.id)}
              onToggle={() => toggleSelected(customer.id)}
            />
          ))
        )}
      </div>

      {isSelectMode && selectedIds.size > 0 && !showComposer && (
        <div className="fixed bottom-16 left-0 right-0 max-w-[480px] md:max-w-[720px] mx-auto bg-gl-text text-white px-4 py-2.5 flex items-center justify-between">
          <span className="text-[11px]">{selectedIds.size} selected</span>
          <button
            onClick={() => setShowComposer(true)}
            className="bg-gl-brand text-white text-[10px] font-semibold px-3 py-1.5 rounded-md active:opacity-80 transition-opacity"
          >
            Message
          </button>
        </div>
      )}

      {showComposer && (
        <div className="fixed bottom-16 left-0 right-0 max-w-[480px] md:max-w-[720px] mx-auto bg-white border-t border-gl-border px-3 py-2.5">
          <div className="text-[9px] text-gl-text-secondary mb-1.5">
            To {selectedIds.size} customer{selectedIds.size === 1 ? "" : "s"}
          </div>
          <textarea
            value={messageDraft}
            onChange={(e) => setMessageDraft(e.target.value)}
            placeholder="Type your message…"
            rows={2}
            className="w-full border border-gl-border-strong rounded-md px-2.5 py-1.5 text-[10px] text-gl-text outline-none mb-1.5 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowComposer(false)}
              className="flex-1 border border-gl-border-strong rounded-md py-1.5 text-[10px] font-semibold text-gl-text active:bg-gl-bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              className="flex-1 bg-gl-brand text-white rounded-md py-1.5 text-[10px] font-semibold active:opacity-80 transition-opacity"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <TabBar tabs={sellerTabs} activeHref="/customers" />
    </div>
  );
}
