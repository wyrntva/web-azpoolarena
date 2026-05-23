import TournamentNavbarItem from "./TournamentNavbarItem";
import { useParams, useRouter } from "next/navigation";

interface Props {
  activeTab?: "info" | "matches" | "live" | "rankings" | "fav";
}

export default function TournamentNavbar({ activeTab = "info" }: Props) {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string | undefined;

  const go = (tab: "info" | "matches" | "live" | "rankings" | "fav") => {
    if (!slug) return;
    if (tab === "info") router.push(`/tournaments/${slug}`);
    if (tab === "matches") router.push(`/tournaments/${slug}/matches`);
    if (tab === "rankings") router.push(`/tournaments/${slug}/rankings`);
    if (tab === "live") router.push(`/tournaments/${slug}/live`);
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-50 h-[65px] rounded-tl-[16px]">
      <div className="w-full px-[6px] h-full flex items-center justify-between">
        <TournamentNavbarItem
          label="Thông tin"
          variant={activeTab === "info" ? "active" : "default"}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 22 22"
              fill="none"
            >
              <path
                d="M10.75 20.75C16.273 20.75 20.75 16.273 20.75 10.75C20.75 5.227 16.273 0.75 10.75 0.75C5.227 0.75 0.75 5.227 0.75 10.75C0.75 16.273 5.227 20.75 10.75 20.75Z"
                className={activeTab === "info" ? "stroke-white" : "stroke-[#37393E] group-hover:stroke-white"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <g transform="translate(10, 5.5)">
                <path
                  d="M0.75 4.751V7.251V9.751M0.75 0.761L0.76 0.75"
                  stroke="#C6010B"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </svg>
          }
          onClick={() => go("info")}
        />

        <TournamentNavbarItem
          label="Trận đấu"
          variant={activeTab === "matches" ? "active" : "default"}
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
          variant={activeTab === "live" ? "active" : "default"}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 22 22"
              fill="none"
            >
              <circle
                cx="10.75"
                cy="10.75"
                r="1.5"
                stroke="#C6010B"
                strokeWidth="1.5"
              />
              <path
                d="M10.75 16.75C14.0637 16.75 16.75 14.0637 16.75 10.75C16.75 7.43629 14.0637 4.75 10.75 4.75C7.43629 4.75 4.75 7.43629 4.75 10.75C4.75 14.0637 7.43629 16.75 10.75 16.75Z"
                className={activeTab === "live" ? "stroke-white" : "stroke-[#37393E] group-hover:stroke-white"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.75 20.75C16.2728 20.75 20.75 16.2728 20.75 10.75C20.75 5.22715 16.2728 0.75 10.75 0.75C5.22715 0.75 0.75 5.22715 0.75 10.75C0.75 16.2728 5.22715 20.75 10.75 20.75Z"
                className={activeTab === "live" ? "stroke-white" : "stroke-[#37393E] group-hover:stroke-white"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          onClick={() => go("live")}
        />

        <TournamentNavbarItem
          label="Xếp hạng"
          variant={activeTab === "rankings" ? "active" : "default"}
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
