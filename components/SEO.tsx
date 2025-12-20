import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string[];
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'profile';
    author?: string;
    publishedTime?: string;
}

const SEO: React.FC<SEOProps> = ({
    title = 'Edusimulate – Smart Learning Reimagined',
    description = 'A new era of interactive and smart learning. Join Edusimulate to explore courses, track your progress, and climb the leaderboard.',
    keywords = ['education', 'learning', 'online courses', 'edtech', 'interactive learning', 'smart education'],
    image = 'https://i.ibb.co/WNTWx4kT/1000105421.jpg',
    url = 'https://edusimulate.vercel.app/',
    type = 'website',
    author = 'Edusimulate Team',
    publishedTime,
}) => {
    const siteTitle = title === 'Edusimulate – Smart Learning Reimagined' ? title : `${title} | Edusimulate`;
    const currentUrl = url;

    // JSON-LD Structured Data
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': type === 'profile' ? 'ProfilePage' : 'WebSite',
        name: siteTitle,
        description: description,
        url: currentUrl,
        author: {
            '@type': 'Organization',
            name: author,
        },
        image: image,
        potentialAction: {
            '@type': 'SearchAction',
            target: 'https://edusimulate.vercel.app/explore?q={search_term_string}',
            'query-input': 'required name=search_term_string',
        },
    };

    return (
        <Helmet>
            {/* Functionality */}
            <title>{siteTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords.join(', ')} />
            <meta name="author" content={author} />
            <link rel="canonical" href={currentUrl} />
            <meta name="theme-color" content="#7c3aed" />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content="Edusimulate" />
            {publishedTime && <meta property="article:published_time" content={publishedTime} />}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:creator" content="@edusimulate" />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Structured Data */}
            <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        </Helmet>
    );
};

export default SEO;
