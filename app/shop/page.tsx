import ShopContent from "@/components/shop/ShopContent";
import { Suspense } from "react";

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
