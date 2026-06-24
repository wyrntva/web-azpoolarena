import TournamentNavbarItem from "./TournamentNavbarItem";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/stores/store";
import { tournamentAPI } from "@/api/tournament.api";
import { resolveImageUrl } from "@/lib/tournament-utils";

interface Props {
  activeTab?: "info" | "matches" | "live" | "rankings" | "fav";
}

export default function TournamentNavbar({ activeTab = "info" }: Props) {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string | undefined;
  
  const user = useSelector((state: RootState) => state.auth.user);
  const [status, setStatus] = useState<string>("upcoming");
  const [tournament, setTournament] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    if (!slug) return;
    tournamentAPI.getTournament(slug)
      .then((res) => {
        if (res.data) {
          setTournament(res.data);
          setStatus(res.data.status || "upcoming");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch tournament status in TournamentNavbar:", err);
      });
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    tournamentAPI.getTournamentMatchesBySlug(slug)
      .then((res) => {
        setMatches(res.data || []);
      })
      .catch((err) => {
        console.error("Failed to fetch matches in TournamentNavbar:", err);
      });
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    if (!user) {
      setIsRegistered(false);
      return;
    }
    tournamentAPI.getTournamentRegistrationsBySlug(slug)
      .then((res) => {
        const regs: { id: number }[] = res.data || [];
        setIsRegistered(regs.some(r => r.id === user.id));
      })
      .catch(() => setIsRegistered(false));
  }, [slug, user]);

  const isRevealedPhase = (() => {
    if (!tournament) return false;
    const closed = tournament.registration_end_date
      ? new Date() > new Date(tournament.registration_end_date)
      : false;
    const full = (tournament.registration_count ?? 0) >= (tournament.number_of_players ?? Infinity);
    return closed || full;
  })();

  const canAccessMatches = isRevealedPhase || isRegistered;

  const getKnockoutStart = (numberOfPlayers: number) => {
    if (numberOfPlayers > 32) return 81;
    if (numberOfPlayers === 24) return 25;
    if (numberOfPlayers > 16) return 41;
    return 21;
  };

  const getTargetMatchesStage = () => {
    if (!tournament) return 1;
    if (status === "completed") return 2;
    if (status === "upcoming") return 1;

    // ongoing
    const numberOfPlayers = tournament.number_of_players || 16;
    const knockoutStart = getKnockoutStart(numberOfPlayers);
    const hasOngoingOrCompletedKnockout = matches.some(
      (m: any) => m.match_no >= knockoutStart && (m.status === "ongoing" || m.status === "completed")
    );
    return hasOngoingOrCompletedKnockout ? 2 : 1;
  };

  const go = (tab: "info" | "matches" | "live" | "rankings" | "fav") => {
    if (!slug) return;
    if (tab === "info") router.push(`/tournaments/${slug}`);
    if (tab === "matches") {
      if (!canAccessMatches) return;
      router.push(`/tournaments/${slug}/matches/${getTargetMatchesStage()}`);
    }
    if (tab === "rankings") {
      if (status !== "completed" && status !== "finished") return;
      router.push(`/tournaments/${slug}/rankings`);
    }
    if (tab === "live") {
      if (status !== "ongoing") return;
      router.push(`/tournaments/${slug}/live`);
    }
  };

  const logoUrl = tournament
    ? resolveImageUrl(tournament.detail_logo || tournament.logo, "")
    : "";

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.08)] rounded-tl-[20px] rounded-tr-none sm:rounded-tl-[24px] sm:rounded-tr-none [--nav-h:52px] sm:[--nav-h:65px]"
      style={{
        height: 'calc(var(--nav-h) + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {logoUrl && (
        <div className="absolute bottom-full right-0 w-[120px] h-[60px] overflow-hidden pointer-events-none z-50">
          <div className="absolute bottom-0 right-0 w-[72px] h-[28px] bg-white rounded-tl-[10px] rounded-tr-none shadow-[0_-8px_30px_rgba(0,0,0,0.08)] flex items-center justify-center p-1.5 pointer-events-auto">
            <img
              src={logoUrl}
              alt="Logo"
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}
      <div className="w-full h-full flex items-center justify-between px-[6px] gap-3">
        <TournamentNavbarItem
          label="Thông tin"
          variant={activeTab === "info" ? "active" : "default"}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 1920 1920"
              fill="none"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path
                  d="M1229.93 594.767c36.644 37.975 50.015 91.328 43.72 142.909-9.128 74.877-30.737 144.983-56.093 215.657-27.129 75.623-54.66 151.09-82.332 226.512-44.263 120.685-88.874 241.237-132.65 362.1-10.877 30.018-18.635 62.072-21.732 93.784-3.376 34.532 21.462 51.526 52.648 36.203 24.977-12.278 49.288-28.992 68.845-48.768 31.952-32.31 63.766-64.776 94.805-97.98 15.515-16.605 30.86-33.397 45.912-50.438 11.993-13.583 24.318-34.02 40.779-42.28 31.17-15.642 55.226 22.846 49.582 49.794-5.39 25.773-23.135 48.383-39.462 68.957l-1.123 1.416a1559.53 1559.53 0 0 0-4.43 5.6c-54.87 69.795-115.043 137.088-183.307 193.977-67.103 55.77-141.607 103.216-223.428 133.98-26.65 10.016-53.957 18.253-81.713 24.563-53.585 12.192-112.798 11.283-167.56 3.333-40.151-5.828-76.246-31.44-93.264-68.707-29.544-64.698-8.98-144.595 6.295-210.45 18.712-80.625 46.8-157.388 75.493-234.619l2.18-5.867 1.092-2.934 2.182-5.87 2.182-5.873c33.254-89.517 67.436-178.676 101.727-267.797 31.294-81.296 62.72-162.537 93.69-243.95 2.364-6.216 5.004-12.389 7.669-18.558l1-2.313c6.835-15.806 13.631-31.617 16.176-48.092 6.109-39.537-22.406-74.738-61.985-51.947-68.42 39.4-119.656 97.992-170.437 156.944l-6.175 7.17c-15.78 18.323-31.582 36.607-47.908 54.286-16.089 17.43-35.243 39.04-62.907 19.07-29.521-21.308-20.765-48.637-3.987-71.785 93.18-128.58 205.056-248.86 350.86-316.783 60.932-28.386 146.113-57.285 225.882-58.233 59.802-.707 116.561 14.29 157.774 56.99Z"
                  className={activeTab === "info" ? "fill-white" : "fill-[#37393E] group-hover:fill-white"}
                  fillRule="evenodd"
                />
                <path
                  d="M1321.968 14.827c76.703 29.846 118.04 96.533 118.032 190.417-.008 169.189-182.758 284.908-335.53 212.455-78.956-37.446-117.358-126.202-98.219-227.002 26.494-139.598 183.78-227.203 315.717-175.87Z"
                  fill="#C6010B"
                  fillRule="evenodd"
                />
              </g>
            </svg>
          }
          onClick={() => go("info")}
        />

        <TournamentNavbarItem
          label="Trận đấu"
          variant={
            activeTab === "matches"
              ? "active"
              : canAccessMatches
                ? "default"
                : "disabled"
          }
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 22 20"
              fill="none"
            >
              <path
                d="M3.68262 12.728L3.68262 9.63008L10.733 9.63008M17.7835 12.728L17.7835 9.63008L10.733 9.63008M10.733 9.63008L10.733 6.92902"
                stroke="#C6010B"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.72106 18.9077L2.95614 18.9077C2.68258 18.9077 2.43991 18.8989 2.2237 18.868C1.06327 18.74 0.75 18.1927 0.75 16.7008L0.75 14.9353C0.75 13.4435 1.06327 12.8962 2.2237 12.7682C2.4399 12.7373 2.68258 12.7285 2.95614 12.7285L4.72106 12.7285C4.99462 12.7285 5.23729 12.7373 5.4535 12.7682C6.61393 12.8962 6.9272 13.4435 6.9272 14.9353L6.9272 16.7008C6.9272 18.1927 6.61393 18.74 5.4535 18.868C5.23729 18.8989 4.99462 18.9077 4.72106 18.9077Z"
                className={activeTab === "matches" ? "stroke-white" : "stroke-[#37393E] group-hover:stroke-white"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11.6166 6.9292L9.85165 6.9292C9.57809 6.9292 9.33541 6.92037 9.11921 6.88948C7.95878 6.76148 7.64551 6.21417 7.64551 4.72232L7.64551 2.95682C7.64551 1.46497 7.95878 0.917662 9.11921 0.789663C9.33541 0.758766 9.57809 0.749939 9.85165 0.749939L11.6166 0.749939C11.8901 0.749939 12.1328 0.758766 12.349 0.789663C13.5094 0.917662 13.8227 1.46497 13.8227 2.95682L13.8227 4.72232C13.8227 6.21417 13.5094 6.76148 12.349 6.88948C12.1328 6.92037 11.8901 6.9292 11.6166 6.9292Z"
                className={activeTab === "matches" ? "stroke-white" : "stroke-[#37393E] group-hover:stroke-white"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.5091 18.9077L16.7442 18.9077C16.4707 18.9077 16.228 18.8989 16.0118 18.868C14.8514 18.74 14.5381 18.1927 14.5381 16.7008L14.5381 14.9353C14.5381 13.4435 14.8514 12.8962 16.0118 12.7682C16.228 12.7373 16.4707 12.7285 16.7442 12.7285L18.5091 12.7285C18.7827 12.7285 19.0254 12.7373 19.2416 12.7682C20.402 12.8962 20.7153 13.4435 20.7153 14.9353L20.7153 16.7008C20.7153 18.1927 20.402 18.74 19.2416 18.868C19.0254 18.8989 18.7827 18.9077 18.5091 18.9077Z"
                className={activeTab === "matches" ? "stroke-white" : "stroke-[#37393E] group-hover:stroke-white"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          onClick={() => go("matches")}
        />

        <TournamentNavbarItem
          label="Live"
          variant={
            activeTab === "live"
              ? "active"
              : status === "ongoing"
                ? "default"
                : "disabled"
          }
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <g>
                  <path fill="none" d="M0 0h24v24H0z"></path>
                  <path
                    fillRule="nonzero"
                    d="M16 4a1 1 0 0 1 1 1v4.2l5.213-3.65a.5.5 0 0 1 .787.41v12.08a.5.5 0 0 1-.787.41L17 14.8V19a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h14z"
                    className={activeTab === "live" ? "fill-white" : "fill-[#37393E] group-hover:fill-white"}
                  />
                  <path
                    d="M7.4 8.829a.4.4 0 0 0-.392.32L7 9.228v5.542a.4.4 0 0 0 .542.374l.073-.036 4.355-2.772a.4.4 0 0 0 .063-.624l-.063-.05L7.615 8.89A.4.4 0 0 0 7.4 8.83z"
                    fill="#C6010B"
                  />
                </g>
              </g>
            </svg>
          }
          onClick={() => go("live")}
        />

        <TournamentNavbarItem
          label="Xếp hạng"
          variant={
            activeTab === "rankings"
              ? "active"
              : (status === "completed" || status === "finished")
                ? "default"
                : "disabled"
          }
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 20 20"
              fill="none"
            >
              <g clipPath="url(#clip0)">
                <path
                  d="M0.000391284 19.2145C0.144775 18.8322 0.42963 18.6941 0.826 18.7097C1.22706 18.7258 1.6297 18.7132 2.05307 18.7132V18.4429C2.05307 16.2889 2.05307 14.1349 2.05307 11.9808C2.05307 11.8963 2.05229 11.8114 2.05933 11.7273C2.08906 11.3751 2.33088 11.1306 2.68186 11.1286C3.70351 11.1219 4.72515 11.1219 5.74679 11.1286C6.10443 11.1309 6.36424 11.4013 6.37089 11.7461C6.37754 12.0954 6.14003 12.3803 5.77731 12.3901C5.05539 12.4101 4.33308 12.4003 3.61077 12.4026C3.52704 12.4026 3.4433 12.4026 3.34431 12.4026V18.7026H6.80444V18.4507C6.80444 15.4636 6.80444 12.4766 6.80521 9.48951C6.80521 9.39208 6.80639 9.29351 6.82282 9.19801C6.87604 8.88379 7.10729 8.66779 7.42736 8.66665C9.13886 8.66115 10.8503 8.66036 12.5618 8.66586C12.9171 8.66701 13.1808 8.94208 13.191 9.28372C13.2008 9.61901 12.9425 9.90151 12.5899 9.92929C12.4346 9.94143 12.2777 9.93715 12.1216 9.93715H8.09564V18.6968H11.9111V18.4671C11.9111 16.0334 11.9107 13.5991 11.9126 11.1654C11.9126 11.0562 11.9185 10.9424 11.9483 10.8386C12.0265 10.5655 12.2859 10.3844 12.5653 10.3918C12.8537 10.3992 13.1053 10.6007 13.1664 10.8856C13.1929 11.1955 13.1941 16.0373 13.1941 18.7007H16.6539V14.3782H14.3034C13.8072 14.3637 13.4934 13.9239 13.6715 13.49C13.7787 13.2286 13.988 13.0913 14.2654 13.0897C15.2804 13.0839 16.2958 13.0819 17.3108 13.0905C17.6634 13.0936 17.9028 13.337 17.9392 13.688C17.9478 15.4253 17.9474 16.9286 17.9474 18.7136H19.2993C19.7066 18.7214 19.9919 18.986 19.9939 19.3526C19.9962 19.7282 19.707 19.9951 19.2872 19.9955H0.798614C0.404979 20.0014 0.133819 19.866 0 19.4888Z"
                  className={activeTab === "rankings" ? "fill-white" : "fill-[#37393E] group-hover:fill-white"}
                />
                <path
                  d="M10.1541 0.00039C10.5348 0.106821 10.7614 0.377981 10.9269 0.717614C11.1284 1.13238 11.3287 1.54831 11.5428 1.95681C11.5791 2.02646 11.677 2.09298 11.756 2.10706C12.3124 2.20606 12.8774 2.26241 13.4276 2.38684C14.1162 2.54296 14.3624 3.30557 13.8964 3.83694L12.6235 5.33751L12.8727 6.75826C12.9663 7.31821 12.7159 7.77836 12.2455 7.90707C11.945 7.98921 11.6668 7.9055 11.4011 7.767L10.1212 7.10141L8.61478 7.75407C8.46571 7.82879 8.30407 7.89886 8.14135 7.92236C7.53992 8.00879 7.07273 7.59129 7.11538 6.97504L7.32664 5.62901L6.13834 3.88467C5.62107 3.29539 5.8574 2.54726 6.62509 2.37157L8.22271 2.11959L9.07021 0.718786C9.235 0.378372 9.46228 0.108386 9.84185 0Z"
                  fill="none"
                  stroke="#C6010B"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform="translate(10, 4) scale(0.7) translate(-10, -4)"
                />
              </g>
              <defs>
                <clipPath id="clip0">
                  <rect width="20" height="20" fill="white" />
                </clipPath>
              </defs>
            </svg>
          }
          onClick={() => go("rankings")}
        />

        <TournamentNavbarItem
          label="FAV"
          variant="disabled"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                className={activeTab === "fav" ? "stroke-white" : "stroke-[#37393E] group-hover:stroke-white"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18 18L19.6667 19.5L23 16.5"
                stroke="#C6010B"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M23.0107 19.2064C22.9857 19.4623 22.9349 19.7196 22.8566 19.9749C22.225 22.0342 20.0437 23.1916 17.9844 22.56C15.9252 21.9285 14.7678 19.7472 15.3994 17.6879C16.0309 15.6287 18.2122 14.4713 20.2715 15.1028C20.3662 15.1319 20.4589 15.1642 20.5497 15.1996"
                className={activeTab === "fav" ? "stroke-white" : "stroke-[#37393E] group-hover:stroke-white"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.5 16H8.5C7.17392 16 5.90215 16.4214 4.96447 17.1716C4.02678 17.9217 3.5 18.9391 3.5 20V22H12.4998"
                className={activeTab === "fav" ? "stroke-white" : "stroke-[#37393E] group-hover:stroke-white"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          onClick={() => go("fav")}
        />
      </div>
    </nav>
  );
}
