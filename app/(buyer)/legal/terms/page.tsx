import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

export default function TermsPage() {
  return (
    <div className="px-3 md:px-5 pt-3.5 pb-10">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/account" className="active:opacity-60 transition-opacity">
          <IconArrowLeft size={18} className="text-gl-text" />
        </Link>
        <h1 className="text-[14px] font-semibold text-gl-text">Terms of Service</h1>
      </div>

      <p className="text-[9px] text-gl-text-muted mb-5">Last updated: September 2026</p>

      <div className="flex flex-col gap-4 text-[11px] text-gl-text-secondary leading-relaxed">
        <div>
          <h2 className="text-[12px] font-semibold text-gl-text mb-1">1. About GRAPPlive</h2>
          <p>
            GRAPPlive is a marketplace connecting buyers with independent sellers across Ghana, and
            operates GrappStore as its own directly-sold retail catalog. This is a prototype version
            of the platform — features, pricing, and policies described here may change before public
            launch.
          </p>
        </div>

        <div>
          <h2 className="text-[12px] font-semibold text-gl-text mb-1">2. Marketplace orders</h2>
          <p>
            Orders placed with independent sellers are transactions between you and that seller.
            GRAPPlive facilitates payment, communication, and delivery coordination, but sellers are
            responsible for the accuracy of their listings and fulfillment of orders.
          </p>
        </div>

        <div>
          <h2 className="text-[12px] font-semibold text-gl-text mb-1">3. GrappStore orders</h2>
          <p>
            GrappStore products are sourced and sold directly by GRAPPlive. GRAPPlive is the merchant
            of record for these orders and is responsible for fulfillment, delivery, and any
            applicable returns or warranty claims for GrappStore items.
          </p>
        </div>

        <div>
          <h2 className="text-[12px] font-semibold text-gl-text mb-1">4. Payments</h2>
          <p>
            Payments are processed through Mobile Money. By placing an order, you authorize GRAPPlive
            to initiate the applicable MoMo payment request for the order total.
          </p>
        </div>

        <div>
          <h2 className="text-[12px] font-semibold text-gl-text mb-1">5. Account responsibilities</h2>
          <p>
            You&apos;re responsible for keeping your account credentials secure and for the accuracy
            of information you provide, including delivery details.
          </p>
        </div>

        <div>
          <h2 className="text-[12px] font-semibold text-gl-text mb-1">6. Changes to these terms</h2>
          <p>
            We may update these terms as the platform evolves. Continued use of GRAPPlive after
            changes are posted means you accept the updated terms.
          </p>
        </div>
      </div>
    </div>
  );
}
