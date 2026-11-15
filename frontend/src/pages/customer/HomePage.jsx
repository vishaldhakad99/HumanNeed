import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { ProductCard } from '../../components/product/ProductCard';
import { ProductGridSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  ShoppingBag,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  ShieldCheck,
  Truck,
  RotateCcw,
  Store,
} from 'lucide-react';

export const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [catsRes, featRes, trendRes, bestRes, banRes] = await Promise.allSettled([
          api.get('/categories'),
          api.get('/products/featured'),
          api.get('/products/trending'),
          api.get('/products/best-sellers'),
          api.get('/banners/active?position=hero'),
        ]);

        if (catsRes.status === 'fulfilled' && catsRes.value?.data) {
          setCategories(catsRes.value.data);
        }
        if (featRes.status === 'fulfilled' && featRes.value?.data) {
          setFeaturedProducts(featRes.value.data);
        }
        if (trendRes.status === 'fulfilled' && trendRes.value?.data) {
          setTrendingProducts(trendRes.value.data);
        }
        if (bestRes.status === 'fulfilled' && bestRes.value?.data) {
          setBestSellers(bestRes.value.data);
        }
        if (banRes.status === 'fulfilled' && banRes.value?.data) {
          setBanners(banRes.value.data);
        }
      } catch (err) {
        // Handle gracefully
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const heroBanner = banners.length > 0 ? banners[0] : null;

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-navy via-slate-900 to-brand-navy text-white overflow-hidden py-12 md:py-20 px-4">
        {/* Subtle geometric background accents */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-brand-royal blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-brand-orange blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-brand-orange">
              <Sparkles className="w-3.5 h-3.5" />
              <span>India's Trusted Direct-to-Consumer Marketplace</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
              {heroBanner ? heroBanner.title : 'Everything You Need, All in One Place.'}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {heroBanner
                ? heroBanner.subtitle
                : 'Discover thousands of authentic electronics, apparel, lifestyle, and household essentials from certified merchant partners with secure checkout.'}
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <Link to="/shop" className="btn-primary py-3 px-6 text-sm">
                <span>Shop Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/seller/register" className="btn-secondary py-3 px-6 text-sm">
                <Store className="w-4 h-4 text-brand-royal" />
                <span>Sell with Us</span>
              </Link>
            </div>

            {/* Quick Trust Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0 text-left">
              <div>
                <p className="text-lg font-extrabold text-white">100%</p>
                <p className="text-xs text-slate-400">Verified Products</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-brand-orange">₹500+</p>
                <p className="text-xs text-slate-400">Free Express Delivery</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-brand-royal">7-Day</p>
                <p className="text-xs text-slate-400">Easy Returns</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-800">
              <img
                src={
                  heroBanner
                    ? heroBanner.image
                    : 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800'
                }
                alt="HumanNeed Marketplace"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/80 via-transparent to-transparent flex items-end p-6">
                <div className="text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                    Verified Quality
                  </span>
                  <p className="text-lg font-bold">Premium Everyday Essentials</p>
                  <p className="text-xs text-slate-300">Direct from vetted Indian manufacturers & stores</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Categories Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-brand-dark">Shop by Category</h2>
            <p className="text-xs text-brand-muted mt-0.5">Explore curated departments and collections</p>
          </div>
          <Link
            to="/shop"
            className="text-xs font-bold text-brand-royal hover:text-brand-royal-hover flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/shop?category=${cat.slug}`}
                className="group flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 hover:border-brand-royal/30 shadow-subtle hover:shadow-card transition-all text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-50 group-hover:bg-brand-royal-light flex items-center justify-center text-brand-royal mb-2.5 transition-colors overflow-hidden">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-6 h-6 text-brand-royal" />
                  )}
                </div>
                <span className="text-xs font-bold text-brand-dark group-hover:text-brand-royal transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            type="category"
            title="Categories Initializing"
            description="Our product catalog is ready. Administrators can define new marketplace categories."
            actionText="Go to Shop"
            actionLink="/shop"
          />
        )}
      </section>

      {/* 3. Trending Products Section (Real DB Data Only) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-brand-orange">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-brand-dark">Trending Now</h2>
              <p className="text-xs text-brand-muted mt-0.5">Most viewed and popular items this week</p>
            </div>
          </div>
          <Link
            to="/shop?sort=popularity"
            className="text-xs font-bold text-brand-royal hover:text-brand-royal-hover flex items-center gap-1"
          >
            <span>See More</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : trendingProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {trendingProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            type="products"
            title="No Trending Products Yet"
            description="HumanNeed is starting with a clean, authentic database. As approved sellers add products and shoppers discover them, trending items will appear right here."
            actionText="Explore Shop"
            actionLink="/shop"
          />
        )}
      </section>

      {/* 4. Best Sellers Section (Strictly Based on Real Sales) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-brand-royal">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-brand-dark">Best Sellers</h2>
              <p className="text-xs text-brand-muted mt-0.5">Ranked by actual confirmed sales orders</p>
            </div>
          </div>
        </div>

        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : bestSellers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            type="products"
            title="Real Sales Data In Progress"
            description="Best sellers are populated strictly based on verified customer orders—never dummy statistics. Place the first order to see products featured here!"
            actionText="Browse Available Products"
            actionLink="/shop"
          />
        )}
      </section>

      {/* 5. Become a Seller Promotional Banner */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-brand-navy to-slate-900 rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-premium">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="bg-brand-orange text-brand-dark px-3 py-1 rounded-full text-xs font-extrabold uppercase">
              Partner With Us
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-white">
              Grow Your Business on HumanNeed
            </h3>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Reach thousands of shoppers across India. List your brand with zero onboarding fees,
              fair commissions, timely settlements, and dedicated seller analytics.
            </p>
          </div>

          <Link to="/seller/register" className="btn-accent px-8 py-3.5 text-sm shrink-0 font-bold">
            <Store className="w-4 h-4" />
            <span>Register as a Merchant</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
