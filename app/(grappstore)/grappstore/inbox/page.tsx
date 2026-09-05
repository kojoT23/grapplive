"use client";

import { useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconHeadset, IconChevronDown } from "@tabler/icons-react";

type FaqItem = {
  question: string;
  answer: string;
};

const faqs: FaqItem[] = [
  {
    question: "How is GrappStore different from other sellers on GRAPPlive?",
    answer:
      "GrappStore is GRAPPlive's own official store — we source and sell these products directly, so there's no seller to wait on. Payment is confirmed instantly and we handle delivery ourselves.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Most GrappStore orders arrive within 3–5 days, GRAPPlive guaranteed. You can check the exact estimate on each product page before you order.",
  },
  {
    question: "Can I return a GrappStore item?",
    answer:
      "Yes — most items can be returned within 7 days of delivery. Check the Returns section on the product page for the exact policy for your item.",
  },
  {
    question: "Is my payment safe?",
    answer:
      "Yes. GrappStore payments go through the same MoMo checkout as the rest of GRAPPlive, and since GRAPPlive is the seller, there's no waiting on manual confirmation from a third party.",
  },
];

export default function GrappStoreInboxPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="pb-6">
      <div className="flex items-center gap-2 px-3 md:px-5 pt-3.5 pb-3">
        <Link href="/grappstore" className="active:opacity-60 transition-opacity">
          <IconArrowLeft size={18} className="text-gl-text" />
        </Link>
        <h1 className="text-[14px] font-semibold text-gl-text">GrappStore support</h1>
      </div>

      <div className="mx-3 md:mx-5 mb-4 flex items-center gap-3 bg-gl-bg-muted rounded-lg px-3 py-3">
        <div className="w-9 h-9 rounded-full bg-gl-brand flex items-center justify-center shrink-0">
          <IconHeadset size={18} className="text-white" />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-gl-text">Need help with an order?</div>
          <div className="text-[10px] text-gl-text-secondary">
            Check your order status first — most questions are answered there.
          </div>
        </div>
      </div>

      <Link
        href="/grappstore/orders"
        className="mx-3 md:mx-5 mb-5 block text-center bg-gl-brand text-white rounded-lg py-2.5 text-[12px] font-semibold active:opacity-80 transition-opacity"
      >
        View your GrappStore orders
      </Link>

      <h2 className="px-3 md:px-5 pb-2 text-[12px] font-semibold text-gl-text">
        Frequently asked questions
      </h2>
      <div className="px-3 md:px-5">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={faq.question} className="border-b border-gl-bg-muted last:border-b-0">
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-2 py-3 text-left"
              >
                <span className="text-[11px] font-medium text-gl-text">{faq.question}</span>
                <IconChevronDown
                  size={14}
                  className={`text-gl-text-secondary shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <p className="text-[10px] text-gl-text-secondary leading-relaxed pb-3">
                  {faq.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
