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

function getMessengerUrl(fbUrl: string | null | undefined): string {
  if (!fbUrl) return "https://m.me/poolarenavn";
  try {
    const cleanUrl = fbUrl.replace(/\/$/, "");
    const parts = cleanUrl.split("/");
    const username = parts[parts.length - 1];
    return `https://m.me/${username}`;
  } catch {
    return "https://m.me/poolarenavn";
  }
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



      {/* Floating Phone Button (Top of stack) */}
      <a
        href="tel:0364756638"
        className="fixed bottom-[292px] xl:bottom-[248px] right-[16px] xl:right-[24px] z-50 w-[50px] h-[50px] rounded-full shadow-[0_4px_16px_rgba(0,184,20,0.25)] flex items-center justify-center bg-white hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border border-[#00B814]/20 hover:shadow-[0_6px_20px_rgba(0,184,20,0.4)]"
        aria-label="Gọi điện hotline"
      >
        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="34" height="34" viewBox="8 8 32 32">
          <path fill="#00B814" d="M35.45,31.041l-4.612-3.051c-0.563-0.341-1.267-0.347-1.836-0.017c0,0,0,0-1.978,1.153	c-0.265,0.154-0.52,0.183-0.726,0.145c-0.262-0.048-0.442-0.191-0.454-0.201c-1.087-0.797-2.357-1.852-3.711-3.205	c-1.353-1.353-2.408-2.623-3.205-3.711c-0.009-0.013-0.153-0.193-0.201-0.454c-0.037-0.206-0.009-0.46,0.145-0.726	c1.153-1.978,1.153-1.978,1.153-1.978c0.331-0.569,0.324-1.274-0.017-1.836l-3.051-4.612c-0.378-0.571-1.151-0.722-1.714-0.332	c0,0-1.445,0.989-1.922,1.325c-0.764,0.538-1.01,1.356-1.011,2.496c-0.002,1.604,1.38,6.629,7.201,12.45l0,0l0,0l0,0l0,0	c5.822,5.822,10.846,7.203,12.45,7.201c1.14-0.001,1.958-0.248,2.496-1.011c0.336-0.477,1.325-1.922,1.325-1.922	C36.172,32.192,36.022,31.419,35.45,31.041z"></path>
        </svg>
      </a>

      {/* Floating Zalo Button (Middle of stack) */}
      <a
        href="https://zalo.me/0364756638"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-[230px] xl:bottom-[186px] right-[16px] xl:right-[24px] z-50 w-[50px] h-[50px] rounded-full shadow-[0_4px_16px_rgba(55,147,246,0.25)] flex items-center justify-center bg-white hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border border-[#3793F6]/20 hover:shadow-[0_6px_20px_rgba(55,147,246,0.4)]"
        aria-label="Liên hệ Zalo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="34" height="34" viewBox="0 0 48 48">
          <path fill="#3793F6" d="M15,36V6.827l-1.211-0.811C8.64,8.083,5,13.112,5,19v10c0,7.732,6.268,14,14,14h10	c4.722,0,8.883-2.348,11.417-5.931V36H15z"></path>
          <path fill="#eee" d="M29,5H19c-1.845,0-3.601,0.366-5.214,1.014C10.453,9.25,8,14.528,8,19	c0,6.771,0.936,10.735,3.712,14.607c0.216,0.301,0.357,0.653,0.376,1.022c0.043,0.835-0.129,2.365-1.634,3.742	c-0.162,0.148-0.059,0.419,0.16,0.428c0.942,0.041,2.843-0.014,4.797-0.877c0.557-0.246,1.191-0.203,1.729,0.083	C20.453,39.764,24.333,40,28,40c4.676,0,9.339-1.04,12.417-2.916C42.038,34.799,43,32.014,43,29V19C43,11.268,36.732,5,29,5z"></path>
          <path fill="#3793F6" d="M36.75,27C34.683,27,33,25.317,33,23.25s1.683-3.75,3.75-3.75s3.75,1.683,3.75,3.75	S38.817,27,36.75,27z M36.75,21c-1.24,0-2.25,1.01-2.25,2.25s1.01,2.25,2.25,2.25S39,24.49,39,23.25S37.99,21,36.75,21z"></path>
          <path fill="#3793F6" d="M31.5,27h-1c-0.276,0-0.5-0.224-0.5-0.5V18h1.5V27z"></path>
          <path fill="#3793F6" d="M27,19.75v0.519c-0.629-0.476-1.403-0.769-2.25-0.769c-2.067,0-3.75,1.683-3.75,3.75	S22.683,27,24.75,27c0.847,0,1.621-0.293,2.25-0.769V26.5c0,0.276,0.224,0.5,0.5,0.5h1v-7.25H27z M24.75,25.5	c-1.24,0-2.25-1.01-2.25-2.25S23.51,21,24.75,21S27,22.01,27,23.25S25.99,25.5,24.75,25.5z"></path>
          <path fill="#3793F6" d="M21.25,18h-8v1.5h5.321L13,26h0.026c-0.163,0.211-0.276,0.463-0.276,0.75V27h7.5	c0.276,0,0.5-0.224,0.5-0.5v-1h-5.321L21,19h-0.026c0.163-0.211,0.276-0.463,0.276-0.75V18z"></path>
        </svg>
      </a>

      {/* Floating Messenger Button (Bottom of stack) */}
      <a
        href={getMessengerUrl(storeSettings?.facebook_url)}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-[168px] xl:bottom-[124px] right-[16px] xl:right-[24px] z-50 w-[50px] h-[50px] rounded-full shadow-[0_4px_16px_rgba(55,147,246,0.25)] flex items-center justify-center bg-white hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border border-[#3793F6]/20 hover:shadow-[0_6px_20px_rgba(55,147,246,0.4)]"
        aria-label="Liên hệ Messenger"
      >
        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="34" height="34" viewBox="0 0 48 48">
          <path fill="#3793F6" d="M24,4C13.5,4,5,12.1,5,22c0,5.2,2.3,9.8,6,13.1V44l7.8-4.7c1.6,0.4,3.4,0.7,5.2,0.7c10.5,0,19-8.1,19-18C43,12.1,34.5,4,24,4z"></path>
          <path fill="#FFF" d="M12 28L22 17 27 22 36 17 26 28 21 23z"></path>
        </svg>
      </a>
    </div>
  );
}
