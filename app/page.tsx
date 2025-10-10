import BestSellersSection from "@/components/homepage/BestSellersSection";
import CategorySection from "@/components/homepage/CategorySection";
import FeatureSection from "@/components/homepage/FeatureSection";
import NewsletterSignup from "@/components/homepage/NewsletterSignup";
import HeroCarousel from "@/components/HeroCarousel";

export default function Home() {
  return (
    <div className="mx-auto">
      <HeroCarousel />
      <CategorySection />
      <BestSellersSection />
      <FeatureSection />
      <NewsletterSignup />
    </div>
  );
}