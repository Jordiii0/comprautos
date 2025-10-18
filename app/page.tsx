import BestSellersSection from "@/components/homepage/BestSellersSection";
import CategorySection from "@/components/homepage/CategorySection";
import FeatureSection from "@/components/homepage/FeatureSection";
import NewsletterSignup from "@/components/homepage/NewsletterSignup";
import HeroCarousel from "@/components/HeroCarousel";
import ShopPage from "./shop/page";

export default function Home() {
  return (
    <div className="mx-auto">
      <HeroCarousel />
      <CategorySection />
      <ShopPage  />
      <FeatureSection />
      <NewsletterSignup />
    </div>
  );
}