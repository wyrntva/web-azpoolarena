"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaCalendarAlt, FaUser, FaTag, FaArrowLeft, FaNewspaper, FaArrowRight, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import NavBar from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { storeSettingsAPI } from "@/api/storeSettings.api";
import { resolveImageUrl } from "@/lib/tournament-utils";
import { newsPublicAPI, type NewsArticle } from "@/api/news.api";
import { fixNewsButtons, newsHref } from "@/lib/news-utils";

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

function getHeaderTitle(category: string): string {
  const catLower = category.toLowerCase();
  if (catLower.includes("giải đấu")) return "GIẢI ĐẤU";
  if (catLower.includes("thông báo")) return "THÔNG BÁO";
  if (catLower.includes("hướng dẫn") || catLower.includes("mẹo")) return "HƯỚNG DẪN";
  if (catLower.includes("khuyến mãi")) return "KHUYẾN MÃI";
  return category.toUpperCase();
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const numericId = parseInt(id, 10);

  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: ['news-article', numericId],
    queryFn: () => newsPublicAPI.getOne(numericId).then(r => r.data),
    enabled: !isNaN(numericId),
    staleTime: 2 * 60 * 1000,
  });

  // Redirect /news/1 → /news/1-tieu-de-bai-viet
  useEffect(() => {
    if (article && id === String(numericId)) {
      router.replace(newsHref(article.id, article.title));
    }
  }, [article, id, numericId, router]);

  const { data: newsData } = useQuery({
    queryKey: ['news-public'],
    queryFn: () => newsPublicAPI.getAll(1, 200).then(r => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const related: NewsArticle[] = (newsData?.items ?? []).filter((a) => a.id !== numericId).slice(0, 5);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setVisibleCards(1);
      } else {
        setVisibleCards(3);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const total = related.length;
  const maxIndex = Math.max(0, total - visibleCards);
  const slidePercent = 100 / visibleCards;

  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  // Autoplay effect
  useEffect(() => {
    if (total <= visibleCards) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= maxIndex) {
          return 0;
        }
        return prev + 1;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [maxIndex, total, visibleCards]);

  const nextSlide = () => {
    if (currentIndex < maxIndex) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // React Query caches store-settings across navigations
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings-public'],
    queryFn: () => storeSettingsAPI.get().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  if (articleLoading) {
    return (
      <div className="min-h-screen bg-[#F0F2F4] flex flex-col font-sans">
        <NavBar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#F0F2F4] flex flex-col font-sans">
        <NavBar />
        <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 md:px-8 xl:px-12 2xl:px-0 py-12 flex flex-col items-center justify-center">
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 w-full max-w-lg">
            <FaNewspaper size={48} className="text-grey-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-text-secondary mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              KHÔNG TÌM THẤY BÀI VIẾT
            </h3>
            <p className="text-text-tertiary text-sm mb-6">
              Bài viết bạn yêu cầu không tồn tại hoặc đã bị gỡ bỏ.
            </p>
            <Link
              href="/news"
              className="inline-flex items-center gap-2 bg-brand-secondary hover:bg-brand-primary-hover text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <FaArrowLeft size={12} />
              Quay lại Tin tức
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F4] flex flex-col font-sans">
      <NavBar />

      {/* MOBILE LAYOUT ONLY (block sm:hidden) */}
      <div className="block sm:hidden bg-[#F0F2F4] flex-1">
        {/* Banner Image */}
        <div className="relative w-full h-[180px] bg-gray-200 overflow-hidden">
          <Image
            src={resolveImageUrl(article.image, '/images/logo.png')}
            alt={article.title}
            fill
            unoptimized
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/15" />
        </div>

        {/* Content Area */}
        <div className="px-4 -mt-[70px] pb-12 relative z-10">
          <article className="relative bg-white rounded-2xl shadow-[0_4px_20px_rgba(23,35,57,0.06)] border border-gray-100/50 w-full px-6 pb-6 pt-[54px] flex flex-col gap-4">
            {/* Card Header (Floating Tab rounded-b) */}
            <div 
              className="absolute -top-0.5 left-1/2 -translate-x-1/2 bg-[#172339] text-white w-[82%] h-[44px] flex items-center justify-center rounded-b-[20px] shadow-[0_4px_6px_rgba(0,0,0,0.1)] z-20"
            >
              <span 
                className="font-bold text-[14px] tracking-[0.5px] uppercase text-center" 
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {getHeaderTitle(article.category)}
              </span>
            </div>

            {/* Title */}
            <h1 
              className="text-2xl font-bold leading-snug text-brand-secondary"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {article.title}
            </h1>

            {/* Meta */}
            <div
              className="flex flex-wrap items-center gap-3 text-base font-normal leading-6 border-b border-gray-100 pb-3"
              style={{ color: '#575E70', fontFamily: 'Montserrat, sans-serif' }}
            >
              <span className="flex items-center gap-1.5">
                <FaCalendarAlt size={14} />
                Ngày đăng: {article.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <FaUser size={14} />
                Người đăng: {article.author}
              </span>
            </div>

            {/* Body content */}
            <div
              className="news-content text-text-primary text-base leading-relaxed font-normal"
              dangerouslySetInnerHTML={{ __html: fixNewsButtons(article.content.join('')) }}
            />
          </article>

          {/* Related Articles Section for Mobile */}
          <div className="mt-8 w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 
                className="font-extrabold italic text-[30px] leading-[48px] bg-clip-text text-transparent"
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  background: 'linear-gradient(180deg, #37393E 0%, #000 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                BÀI VIẾT LIÊN QUAN
              </h2>
              {total > visibleCards && (
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={prevSlide}
                    disabled={currentIndex === 0}
                    className={`w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center transition-all ${
                      currentIndex === 0 
                        ? 'text-gray-300 border-gray-100 cursor-not-allowed' 
                        : 'text-brand-secondary hover:bg-brand-secondary hover:text-white hover:border-brand-secondary cursor-pointer'
                    }`}
                    aria-label="Bài viết trước"
                  >
                    <FaChevronLeft size={10} />
                  </button>
                  <button 
                    onClick={nextSlide}
                    disabled={currentIndex >= maxIndex}
                    className={`w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center transition-all ${
                      currentIndex >= maxIndex 
                        ? 'text-gray-300 border-gray-100 cursor-not-allowed' 
                        : 'text-brand-secondary hover:bg-brand-secondary hover:text-white hover:border-brand-secondary cursor-pointer'
                    }`}
                    aria-label="Bài viết tiếp theo"
                  >
                    <FaChevronRight size={10} />
                  </button>
                </div>
              )}
            </div>
            <div className="w-full overflow-hidden px-1">
              <div 
                className="flex transition-transform duration-500 ease-out -mx-2"
                style={{
                  transform: `translateX(-${currentIndex * slidePercent}%)`,
                }}
              >
                {related.map((art) => (
                  <div key={art.id} className="w-full flex-shrink-0 px-2">
                    <Link
                      href={newsHref(art.id, art.title)}
                      className="bg-white rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(23,35,57,0.03)] border border-gray-100/80 flex flex-col"
                    >
                      <div className="relative h-[150px] w-full overflow-hidden bg-gray-100">
                        <Image
                          src={resolveImageUrl(art.image, '/images/logo.png')}
                          alt={art.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span className="bg-brand-secondary/90 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                            {art.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-text-tertiary">
                            <span className="flex items-center gap-1">
                              <FaCalendarAlt size={10} />
                              {art.date}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <FaUser size={10} />
                              {art.author}
                            </span>
                          </div>
                          <h3 
                            className="text-lg font-bold text-brand-secondary leading-snug line-clamp-2"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                          >
                            {art.title}
                          </h3>
                          <p className="text-text-primary text-sm leading-relaxed line-clamp-2">
                            {art.excerpt}
                          </p>
                        </div>
                        <div className="pt-2.5 border-t border-gray-100 flex items-center gap-1.5 text-xs font-bold text-brand-secondary">
                          Đọc tiếp
                          <FaArrowRight size={10} />
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP LAYOUT ONLY (hidden sm:block) */}
      <div className="hidden sm:block relative w-full flex-1">
        {/* Banner Background */}
        <div className="absolute top-0 left-0 w-full h-[450px] bg-[#172339] overflow-hidden">
          <Image
            src={resolveImageUrl(article.image, '/images/logo.png')}
            alt={article.title}
            fill
            unoptimized
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-black/15" />
        </div>

        <div className="relative z-10 flex flex-col w-full">
          <main className="w-full max-w-[1360px] mx-auto pt-[288px] pb-12 px-6 md:px-8 xl:px-12 2xl:px-0 flex flex-col gap-4">
            {/* Detail Card Overlay — matching Tournament Detail Card layout & rounded-2xl */}
            <article className="relative bg-white rounded-2xl shadow-[0_15px_45px_rgba(23,35,57,0.06)] border border-gray-100 px-10 pb-10 pt-[76px] space-y-6 w-full">
              {/* Card Header (Floating Tab rounded-b) */}
              <div 
                className="absolute -top-0.5 left-1/2 -translate-x-1/2 bg-[#172339] text-white w-[648px] max-w-[82%] h-[56px] flex items-center justify-center rounded-bl-[32px] rounded-br-[32px] shadow-[0_4px_10px_rgba(0,0,0,0.15)] z-20"
              >
                <span 
                  className="text-center text-white text-2xl font-bold uppercase" 
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {getHeaderTitle(article.category)}
                </span>
              </div>

              {/* Title */}
              <h1 
                className="text-xl sm:text-2xl font-bold leading-snug text-brand-secondary"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {article.title}
              </h1>

              {/* Meta */}
              <div
                className="flex flex-wrap items-center gap-4 text-base font-normal leading-6 border-b border-gray-100 pb-4"
                style={{ color: '#575E70', fontFamily: 'Montserrat, sans-serif' }}
              >
                <span className="flex items-center gap-2">
                  <FaCalendarAlt size={14} />
                  Ngày đăng: {article.date}
                </span>
                <span>•</span>
                <span className="flex items-center gap-2">
                  <FaUser size={14} />
                  Người đăng: {article.author}
                </span>
              </div>

              {/* Body Text */}
              <div
                className="news-content text-text-primary text-sm sm:text-base leading-relaxed font-normal"
                dangerouslySetInnerHTML={{ __html: fixNewsButtons(article.content.join('')) }}
              />
            </article>

            {/* Related Articles Section */}
            <div className="mt-12 w-full">
              <div className="flex items-center justify-between mb-8">
                <h2 
                  className="font-extrabold italic text-[30px] leading-[48px] bg-clip-text text-transparent"
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    background: 'linear-gradient(180deg, #37393E 0%, #000 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  BÀI VIẾT LIÊN QUAN
                </h2>
                {total > visibleCards && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={prevSlide}
                      disabled={currentIndex === 0}
                      className={`w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center transition-all ${
                        currentIndex === 0 
                          ? 'text-gray-300 border-gray-100 cursor-not-allowed' 
                          : 'text-brand-secondary hover:bg-brand-secondary hover:text-white hover:border-brand-secondary cursor-pointer'
                      }`}
                      aria-label="Bài viết trước"
                    >
                      <FaChevronLeft size={14} />
                    </button>
                    <button 
                      onClick={nextSlide}
                      disabled={currentIndex >= maxIndex}
                      className={`w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center transition-all ${
                        currentIndex >= maxIndex 
                          ? 'text-gray-300 border-gray-100 cursor-not-allowed' 
                          : 'text-brand-secondary hover:bg-brand-secondary hover:text-white hover:border-brand-secondary cursor-pointer'
                      }`}
                      aria-label="Bài viết tiếp theo"
                    >
                      <FaChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="w-full overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-out -mx-3"
                  style={{
                    transform: `translateX(-${currentIndex * slidePercent}%)`,
                  }}
                >
                  {related.map((art, idx) => (
                    <div 
                      key={art.id} 
                      className="w-full md:w-1/3 flex-shrink-0 px-3"
                    >
                      <Link
                        href={newsHref(art.id, art.title)}
                        className="bg-white rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(23,35,57,0.03)] border border-gray-100/80 hover:shadow-[0_15px_40px_rgba(23,35,57,0.07)] transition-all duration-300 cursor-pointer group flex flex-col h-full"
                        style={{
                          animationDelay: `${idx * 80}ms`,
                          animationFillMode: 'backwards'
                        }}
                      >
                        <div className="relative h-[200px] overflow-hidden bg-gray-100">
                          <Image
                            src={resolveImageUrl(art.image, '/images/logo.png')}
                            alt={art.title}
                            fill
                            unoptimized
                            className="object-cover group-hover:scale-125 transition-transform duration-1000 ease-out"
                          />
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
                              <span className="flex items-center gap-1">
                                <FaCalendarAlt size={10} />
                                {art.date}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <FaUser size={10} />
                                {art.author}
                              </span>
                            </div>
                            <h3 
                              className="text-lg font-bold text-brand-secondary leading-snug group-hover:text-brand-primary transition-colors line-clamp-2"
                              style={{ fontFamily: 'Montserrat, sans-serif' }}
                            >
                              {art.title}
                            </h3>
                            <p className="text-text-primary text-xs sm:text-sm leading-relaxed line-clamp-3">
                              {art.excerpt}
                            </p>
                          </div>
                          <div className="pt-4 border-t border-gray-100/80 flex items-center gap-1.5 text-xs font-bold text-brand-secondary group-hover:text-brand-primary transition-colors">
                            Đọc tiếp 
                            <FaArrowRight size={10} className="transform group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <Footer />

      {/* Floating Phone Button */}
      <a
        href="tel:0364756638"
        className="fixed bottom-[292px] xl:bottom-[248px] right-[16px] xl:right-[24px] z-50 w-[50px] h-[50px] rounded-full shadow-[0_4px_16px_rgba(0,184,20,0.25)] flex items-center justify-center bg-white hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border border-[#00B814]/20 hover:shadow-[0_6px_20px_rgba(0,184,20,0.4)]"
        aria-label="Gọi điện hotline"
      >
        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="34" height="34" viewBox="8 8 32 32">
          <path fill="#00B814" d="M35.45,31.041l-4.612-3.051c-0.563-0.341-1.267-0.347-1.836-0.017c0,0,0,0-1.978,1.153	c-0.265,0.154-0.52,0.183-0.726,0.145c-0.262-0.048-0.442-0.191-0.454-0.201c-1.087-0.797-2.357-1.852-3.711-3.205	c-1.353-1.353-2.408-2.623-3.205-3.711c-0.009-0.013-0.153-0.193-0.201-0.454c-0.037-0.206-0.009-0.46,0.145-0.726	c1.153-1.978,1.153-1.978,1.153-1.978c0.331-0.569,0.324-1.274-0.017-1.836l-3.051-4.612c-0.378-0.571-1.151-0.722-1.714-0.332	c0,0-1.445,0.989-1.922,1.325c-0.764,0.538-1.01,1.356-1.011,2.496c-0.002,1.604,1.38,6.629,7.201,12.45l0,0l0,0l0,0l0,0	c5.822,5.822,10.846,7.203,12.45,7.201c1.14-0.001,1.958-0.248,2.496-1.011c0.336-0.477,1.325-1.922,1.325-1.922	C36.172,32.192,36.022,31.419,35.45,31.041z"></path>
        </svg>
      </a>

      {/* Floating Zalo Button */}
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

      {/* Floating Messenger Button */}
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
