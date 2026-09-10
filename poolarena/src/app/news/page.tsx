"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FaCalendarAlt, FaUser, FaTag, FaTimes, FaArrowRight, FaNewspaper, FaSearch } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import NavBar from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { storeSettingsAPI } from "@/api/storeSettings.api";
import { resolveImageUrl } from "@/lib/tournament-utils";
import { newsPublicAPI, type NewsArticle } from "@/api/news.api";
import { newsHref } from "@/lib/news-utils";
import SafeImage from "@/components/SafeImage";
import BannerSkeleton from "@/components/skeletons/BannerSkeleton";
import NewsCardSkeleton from "@/components/skeletons/NewsCardSkeleton";
import NewsFeaturedSkeleton from "@/components/skeletons/NewsFeaturedSkeleton";

function parseBannerUrls(bannerTournament: string | null | undefined): string[] {
  if (!bannerTournament) return [];
  let urls: string[] = [];
  try {
    const parsed = JSON.parse(bannerTournament);
    if (Array.isArray(parsed)) urls = parsed.filter(Boolean);
    else if (typeof parsed === 'string' && parsed.length > 0) urls = [parsed];
  } catch {
    urls = [bannerTournament];
  }
  return urls.filter(Boolean).map(url => resolveImageUrl(url, ''));
}

const categories = ["Tất cả", "Tin tức", "Giải đấu", "Thông báo", "Hướng dẫn & Mẹo", "Khuyến mãi"];

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // React Query caches store-settings across navigations
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings-public'],
    queryFn: () => storeSettingsAPI.get().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['news-public'],
    queryFn: () => newsPublicAPI.getAll(1, 200).then(r => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const allArticles: NewsArticle[] = newsData?.items ?? [];

  const bannerUrls = parseBannerUrls(storeSettings?.banner_tournament);

  // Auto-rotate banners every 15 seconds
  useEffect(() => {
    if (bannerUrls.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % bannerUrls.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [bannerUrls.length]);

  const filteredArticles = allArticles.filter(a => {
    const matchesCategory = selectedCategory === "Tất cả" || a.category === selectedCategory;
    const matchesSearch = searchQuery === "" ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.some(paragraph => paragraph.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredArticle = filteredArticles.find(a => a.featured) || filteredArticles[0];
  const regularArticles = filteredArticles.filter(a => a.id !== (featuredArticle?.id ?? -1));

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const totalPages = Math.ceil(regularArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = regularArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-[#F0F2F4] flex flex-col font-sans">
      <NavBar />

      <main className={`flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 md:px-8 xl:px-12 2xl:px-0 pb-24 md:pb-16 ${bannerUrls.length > 0 ? "pt-0" : "pt-8 md:pt-12"}`}>
        {/* Tournament Banner — mobile: 361×74 ratio, scales up on larger screens */}
        {storeSettings === undefined ? (
          <BannerSkeleton />
        ) : bannerUrls.length > 0 ? (
          <div
            className="mb-6 sm:mb-12 mt-4 sm:mt-6 relative w-full rounded-xl overflow-hidden"
            style={{ aspectRatio: '361 / 74' }}
          >
            {bannerUrls.map((url, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-500 ${index === currentBannerIndex ? 'opacity-100' : 'opacity-0'}`}
              >
                <Image
                  src={url}
                  alt={`Tournament Banner ${index + 1}`}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
              </div>
            ))}

            {bannerUrls.length > 1 && (
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1.5 sm:gap-2 z-10">
                {bannerUrls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBannerIndex(index)}
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${index === currentBannerIndex ? 'bg-white w-4 sm:w-6' : 'bg-white/50 hover:bg-white/75'}`}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1
            className="text-[#37393E] font-bold italic uppercase tracking-wide animate-slideIn whitespace-nowrap text-[18px] min-[360px]:text-[21px] min-[390px]:text-[23px] min-[430px]:text-[26px] sm:text-[36px] leading-tight"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            TIN TỨC & KHUYẾN MÃI
          </h1>

          {/* Search Box */}
          <div className="relative w-full sm:w-[320px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-text-tertiary">
              <FaSearch size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm tin tức..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-white border border-grey-100 rounded-full text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-secondary/10 focus:border-brand-secondary transition-all"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-tertiary hover:text-brand-primary-hover cursor-pointer"
              >
                <FaTimes size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pb-4 mb-8 md:mb-10 no-scrollbar sm:overflow-x-auto sm:-mx-4 sm:px-4 md:mx-0 md:px-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 whitespace-nowrap shadow-sm border ${
                selectedCategory === cat
                  ? "bg-brand-secondary text-white border-brand-secondary"
                  : "bg-white text-text-secondary border-grey-100 hover:border-grey-300 hover:text-text-primary"
              }`}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {cat}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {newsLoading ? (
            <div className="space-y-10">
              <NewsFeaturedSkeleton />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {[1, 2, 3].map((i) => (
                  <NewsCardSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : filteredArticles.length > 0 ? (
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-10"
            >
              {featuredArticle && (
                <Link
                  href={newsHref(featuredArticle.id, featuredArticle.title)}
                  className="block bg-white rounded-3xl overflow-hidden shadow-[0_15px_45px_rgba(23,35,57,0.04)] border border-gray-100 hover:shadow-[0_20px_50px_rgba(23,35,57,0.08)] transition-all duration-300 cursor-pointer group animate-slideInFromLeft"
                  style={{ animationDelay: '0ms', animationFillMode: 'backwards' }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    <div className="lg:col-span-7 relative h-[250px] sm:h-[350px] lg:h-[420px] overflow-hidden bg-gray-100">
                      <SafeImage
                        src={resolveImageUrl(featuredArticle.image, '/images/logo.png')}
                        alt={featuredArticle.title}
                        fill
      
                        className="object-cover group-hover:scale-125 transition-transform duration-1000 ease-out"
                        priority
                      />
                      {/* Dark Overlay matching TournamentCard */}
                      <div className="absolute inset-0 bg-black/40"></div>
                      <div className="absolute top-4 left-4 z-10">
                        <span className="bg-[#D22E39] text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg shadow-md">
                          Nổi bật
                        </span>
                      </div>
                    </div>

                    <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-text-tertiary">
                          <span className="flex items-center gap-1.5 text-brand-primary-hover">
                            <FaTag size={12} />
                            {featuredArticle.category}
                          </span>
                          <span 
                            className="flex items-center gap-1.5 text-base font-normal leading-6"
                            style={{ color: '#575E70', fontFamily: 'Montserrat, sans-serif' }}
                          >
                            <FaCalendarAlt size={16} />
                            {featuredArticle.date}
                          </span>
                          <span 
                            className="flex items-center gap-1.5 text-base font-normal leading-6"
                            style={{ color: '#575E70', fontFamily: 'Montserrat, sans-serif' }}
                          >
                            <FaUser size={16} />
                            {featuredArticle.author}
                          </span>
                        </div>

                        <h2
                          className="text-2xl sm:text-3xl font-extrabold text-brand-secondary leading-tight group-hover:text-brand-primary-hover transition-colors"
                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                          {featuredArticle.title}
                        </h2>

                        <p className="text-text-primary text-sm sm:text-base leading-relaxed">
                          {featuredArticle.excerpt}
                        </p>
                      </div>

                      <div className="pt-6 border-t border-gray-100 flex items-center gap-2 text-sm font-bold text-brand-secondary group-hover:text-brand-primary-hover transition-colors">
                        Đọc chi tiết bài viết
                        <FaArrowRight size={12} className="transform group-hover:translate-x-1.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {regularArticles.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {paginatedArticles.map((art, idx) => (
                      <Link
                        key={art.id}
                        href={newsHref(art.id, art.title)}
                        className="bg-white rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(23,35,57,0.03)] border border-gray-100/80 hover:shadow-[0_15px_40px_rgba(23,35,57,0.07)] transition-all duration-300 cursor-pointer group flex flex-col h-full animate-slideInFromLeft"
                        style={{
                          animationDelay: `${Math.min((idx + (featuredArticle ? 1 : 0)) * 80, 1600)}ms`,
                          animationFillMode: 'backwards'
                        }}
                      >
                        <div className="relative h-[200px] overflow-hidden bg-gray-100">
                          <SafeImage
                            src={resolveImageUrl(art.image, '/images/logo.png')}
                            alt={art.title}
                            fill
          
                            className="object-cover group-hover:scale-125 transition-transform duration-1000 ease-out"
                          />
                          {/* Dark Overlay matching TournamentCard */}
                          <div className="absolute inset-0 bg-black/40"></div>
                          <div className="absolute top-3 left-3 z-10">
                            <span className="bg-brand-secondary/90 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-sm">
                              {art.category}
                            </span>
                          </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 text-[11px] font-semibold text-text-tertiary">
                              <span 
                                className="flex items-center gap-1 text-base font-normal leading-6"
                                style={{ color: '#575E70', fontFamily: 'Montserrat, sans-serif' }}
                              >
                                <FaCalendarAlt size={16} />
                                {art.date}
                              </span>
                              <span>•</span>
                              <span 
                                className="flex items-center gap-1 text-base font-normal leading-6"
                                style={{ color: '#575E70', fontFamily: 'Montserrat, sans-serif' }}
                              >
                                <FaUser size={16} />
                                {art.author}
                              </span>
                            </div>

                            <h3
                              className="text-lg font-bold text-brand-secondary leading-snug group-hover:text-brand-primary-hover transition-colors line-clamp-2"
                              style={{ fontFamily: 'Montserrat, sans-serif' }}
                            >
                              {art.title}
                            </h3>

                            <p className="text-text-primary text-xs sm:text-sm leading-relaxed line-clamp-3">
                              {art.excerpt}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-gray-100/80 flex items-center gap-1.5 text-xs font-bold text-brand-secondary group-hover:text-brand-primary-hover transition-colors">
                            Đọc tiếp
                            <FaArrowRight size={10} className="transform group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-12 animate-fadeIn">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                          currentPage === 1
                            ? "bg-grey-50 text-grey-300 border-grey-100 cursor-not-allowed"
                            : "bg-white text-brand-secondary border-grey-100 hover:border-brand-secondary hover:text-brand-secondary cursor-pointer"
                        }`}
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        Trước
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                            currentPage === page
                              ? "bg-brand-secondary text-white border-brand-secondary shadow-md shadow-brand-secondary/10"
                              : "bg-white text-text-secondary border-grey-100 hover:border-brand-secondary hover:text-brand-secondary"
                          }`}
                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                          currentPage === totalPages
                            ? "bg-grey-50 text-grey-300 border-grey-100 cursor-not-allowed"
                            : "bg-white text-brand-secondary border-grey-100 hover:border-brand-secondary hover:text-brand-secondary cursor-pointer"
                        }`}
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        Sau
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
              <FaNewspaper size={48} className="text-grey-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-text-secondary mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                KHÔNG CÓ TIN TỨC
              </h3>
              <p className="text-text-tertiary text-sm">
                {searchQuery
                  ? `Không tìm thấy kết quả phù hợp cho từ khóa "${searchQuery}".`
                  : "Hiện chưa có bài viết nào thuộc danh mục này."}
              </p>
            </div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
