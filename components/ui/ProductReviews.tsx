import { IconStarFilled, IconRosetteDiscountCheck } from "@tabler/icons-react";
import { getReviewsByProductId, getRatingBreakdown } from "@/lib/mock-data/reviews";

export function ProductReviews({ productId }: { productId: string }) {
  const productReviews = getReviewsByProductId(productId);
  const breakdown = getRatingBreakdown(productId);

  if (!breakdown) return null;

  const totalRated = breakdown[5] + breakdown[4] + breakdown[3] + breakdown[2] + breakdown[1];
  const stars: (1 | 2 | 3 | 4 | 5)[] = [5, 4, 3, 2, 1];

  return (
    <div className="mb-5">
      <h2 className="text-[12px] font-semibold text-gl-text mb-2.5">
        Ratings &amp; reviews
      </h2>

      <div className="flex flex-col gap-1 mb-4">
        {stars.map((star) => {
          const count = breakdown[star];
          const pct = totalRated > 0 ? (count / totalRated) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-[9px] text-gl-text-secondary w-6 shrink-0">{star}★</span>
              <div className="flex-1 h-1.5 bg-gl-bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gl-amber rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[9px] text-gl-text-muted w-8 shrink-0 text-right">{count}</span>
            </div>
          );
        })}
      </div>

      {productReviews.length === 0 ? (
        <div className="text-[10px] text-gl-text-secondary">No written reviews yet.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {productReviews.map((review) => (
            <div key={review.id} className="border-b border-gl-bg-muted pb-3 last:border-b-0">
              <div className="flex items-center gap-1 mb-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <IconStarFilled
                    key={i}
                    size={11}
                    className={i < review.rating ? "text-gl-amber" : "text-gl-bg-placeholder"}
                  />
                ))}
              </div>
              <div className="text-[11px] font-semibold text-gl-text mb-0.5">{review.title}</div>
              <p className="text-[10px] text-gl-text-secondary leading-relaxed mb-1.5">{review.body}</p>
              <div className="flex items-center gap-1.5 text-[9px] text-gl-text-muted">
                <span>{review.date}</span>
                <span>by {review.authorName}</span>
                {review.verifiedPurchase && (
                  <span className="flex items-center gap-0.5 text-gl-green">
                    <IconRosetteDiscountCheck size={11} />
                    Verified Purchase
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
