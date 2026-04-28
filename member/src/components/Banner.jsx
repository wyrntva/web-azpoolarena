import { useState, useEffect } from 'react';
import { storeSettingsService } from '../services/storeSettingsService';

function Banner() {
    const [bannerUrls, setBannerUrls] = useState([]);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

    useEffect(() => {
        fetchBannerSettings();
    }, []);

    const fetchBannerSettings = async () => {
        try {
            const response = await storeSettingsService.getPublicSettings();
            const settings = response?.data || response; // Handle different response structures

            // Prioritize banner_member, fallback to banner_tournament
            const bannerData = settings?.banner_member || settings?.banner_tournament;

            if (bannerData) {
                try {
                    // Parse JSON array of banner URLs
                    const banners = JSON.parse(bannerData);
                    if (Array.isArray(banners) && banners.length > 0) {
                        const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
                        const fullUrls = banners.map((url) =>
                            url.startsWith('http') ? url : `${API_BASE}${url}`
                        );
                        setBannerUrls(fullUrls);
                    }
                } catch (e) {
                    // Single string case
                    const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
                    const fullUrl = bannerData.startsWith('http')
                        ? bannerData
                        : `${API_BASE}${bannerData}`;
                    setBannerUrls([fullUrl]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch banner settings:', error);
        }
    };

    // Auto-rotate banners
    useEffect(() => {
        if (bannerUrls.length > 1) {
            const interval = setInterval(() => {
                setCurrentBannerIndex((prev) => (prev + 1) % bannerUrls.length);
            }, 5000); // 5 seconds rotation
            return () => clearInterval(interval);
        }
    }, [bannerUrls.length]);

    if (bannerUrls.length === 0) {
        return null;
    }

    return (
        <div className="banner-container">
            {bannerUrls.map((url, index) => (
                <div
                    key={index}
                    className={`banner-slide ${index === currentBannerIndex ? 'active' : ''}`}
                >
                    <img src={url} alt={`Banner ${index + 1}`} />
                </div>
            ))}

            {bannerUrls.length > 1 && (
                <div className="banner-dots">
                    {bannerUrls.map((_, index) => (
                        <button
                            key={index}
                            className={`banner-dot ${index === currentBannerIndex ? 'active' : ''}`}
                            onClick={() => setCurrentBannerIndex(index)}
                            aria-label={`Go to banner ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Banner;
