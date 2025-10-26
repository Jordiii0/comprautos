import CategorySection from "@/components/homepage/CategorySection";
import NewsletterSignup from "@/components/homepage/NewsletterSignup";
import HeroCarousel from "@/components/HeroCarousel";
import ShopPage from "./shop/page";

export default function Home() {
  return (
    <div className="mx-auto">
      <HeroCarousel />
      <CategorySection />
      <ShopPage  />
      <NewsletterSignup />
    </div>
  );
}