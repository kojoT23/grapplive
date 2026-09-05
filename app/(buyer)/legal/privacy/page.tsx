import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

export default function PrivacyPage() {
  return (
    <div className="px-3 md:px-5 pt-3.5 pb-10">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/account" className="active:opacity-60 transition-opacity">
          <IconArrowLeft size={18} className="text-gl-text" />
        </Link>
        <h1 className="text-[14px] font-semibold text-gl-text">Privacy Policy</h1>
      </div>

      <p className="text-[9px] text-gl-text-muted mb-5">Last updated: September 2026</p>

      <div className="flex flex-col gap-4 text-[11px] text-gl-text-secondary leading-relaxed">
        <div>
          <h2 className="text-[12px] font-semibold text-gl-text mb-1">1. Information we collect</h2>
          <p>
            We collect information you provide directly — your phone number, delivery addresses, and
            order details — along with information about how you use the app to help us improve it.
          </p>
        </div>

        <div>
          <h2 className="text-[12px] font-semibold text-gl-text mb-1">2. How we use your information</h2>
          <p>
            We use your information to process orders, coordinate delivery, communicate order
            updates, and improve GRAPPlive&apos;s features. We don&apos;t sell your personal
            information to third parties.
          </p>
        </div>

        <div>
          <h2 className="text-[12px] font-semibold text-gl-text mb-1">3. Sharing with sellers</h2>
          <p>
            When you place a marketplace order, we share the information necessary to fulfill it —
            your delivery details and order contents — with the relevant seller. Sellers don&apos;t
            see your full account information.
          </p>
        </div>

        <div>
          <h2 className="text-[12px] font-semibold text-gl-text mb-1">4. Payment information</h2>
          <p>
            Mobile Money payments are processed through our payment partners. GRAPPlive does not
            store your MoMo PIN.
          </p>
        </div>

        <div>
          <h2 className="text-[12px] font-semibold text-gl-text mb-1">5. Your choices</h2>
          <p>
            You can review and update your account information at any time from your Account page.
            Contact support if you&apos;d like your data deleted.
          </p>
        </div>

        <div>
          <h2 className="text-[12px] font-semibold text-gl-text mb-1">6. Changes to this policy</h2>
          <p>
            We may update this policy as GRAPPlive evolves. We&apos;ll let you know about
            significant changes.
          </p>
        </div>
      </div>
    </div>
  );
}
