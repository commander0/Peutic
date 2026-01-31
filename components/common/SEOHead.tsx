import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
    title?: string;
    description?: string;
    image?: string;
    type?: 'website' | 'article' | 'profile';
    noIndex?: boolean;
}

const DEFAULT_TITLE = 'Peutic | Premium Human Connection';
const DEFAULT_DESC = 'Experience the gold standard in emotional support. Connect instantly via video with a dedicated specialist tailored just for you.';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1200&auto=format&fit=crop';
const SITE_URL = 'https://peutic.xyz';

export const SEOHead: React.FC<SEOHeadProps> = ({
    title = DEFAULT_TITLE,
    description = DEFAULT_DESC,
    image = DEFAULT_IMAGE,
    type = 'website',
    noIndex = false
}) => {
    const location = useLocation();
    const currentUrl = `${SITE_URL}${location.pathname}`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{title}</title>
            <meta name="description" content={description} />
            {noIndex && <meta name="robots" content="noindex, nofollow" />}
            <link rel="canonical" href={currentUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content="Peutic" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
};
