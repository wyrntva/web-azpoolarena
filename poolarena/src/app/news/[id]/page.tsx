"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaCalendarAlt, FaUser, FaTag, FaArrowLeft, FaNewspaper, FaArrowRight, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import NavBar from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { resolveImageUrl } from "@/lib/tournament-utils";
import { newsPublicAPI, type NewsArticle } from "@/api/news.api";
import { fixNewsButtons, newsHref } from "@/lib/news-utils";
import SafeImage from "@/components/SafeImage";
import NewsDetailSkeleton from "@/components/skeletons/NewsDetailSkeleton";

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

  if (articleLoading) {
    return (
      <div className="min-h-screen bg-[#F0F2F4] flex flex-col font-sans">
        <NavBar />
        <NewsDetailSkeleton />
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
          <SafeImage
            src={resolveImageUrl(article.image, '/images/logo.png')}
            alt={article.title}
            fill

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
                        <SafeImage
                          src={resolveImageUrl(art.image, '/images/logo.png')}
                          alt={art.title}
                          fill
              
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
          <SafeImage
            src={resolveImageUrl(article.image, '/images/logo.png')}
            alt={article.title}
            fill

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
                          <SafeImage
                            src={resolveImageUrl(art.image, '/images/logo.png')}
                            alt={art.title}
                            fill
                
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
    </div>
  );
}
