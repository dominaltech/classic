import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const InstagramIcon = ({ size = 20, style = {} }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export default function Home() {
  const { products, categories, banners, dataLoading } = useApp();
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [seoExpanded, setSeoExpanded] = useState(false);

  // Filter banners based on placement
  const heroBanners = banners.filter(b => b.section_placement === 'hero');
  const collectionBanners = banners.filter(b => b.section_placement === 'collection');

  // Auto-play hero carousel
  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % heroBanners.length);
  };

  // Filter trending products
  const filterChips = ['ALL', 'SHIRTS', 'JEANS', 'T-SHIRTS', 'SHOES'];
  
  const trendingProducts = products
    .filter(p => p.is_trending)
    .filter(p => {
      if (activeFilter === 'ALL') return true;
      // Map category ID to its name
      const category = categories.find(c => c.id === p.category_id);
      return category?.name === activeFilter;
    });

  // Instagram Mock Posts
  const instagramPosts = [
    { id: 1, img: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&auto=format&fit=crop&q=80", caption: "The Linen Vibe: Draped in pure luxury. #ClassicEscape" },
    { id: 2, img: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=600&auto=format&fit=crop&q=80", caption: "Indestructible Comfort: The Flex-Denim series. #ClassicJeans" },
    { id: 3, img: "https://images.unsplash.com/photo-1505022610485-0249ba5b3675?w=600&auto=format&fit=crop&q=80", caption: "Summer brunch looks ready. Clean, relaxed, smart. #Classic" },
    { id: 4, img: "https://images.unsplash.com/photo-1520975954732-35dd22299614?w=600&auto=format&fit=crop&q=80", caption: "Retro cup-soles that turn heads. #ClassicFootwear" },
    { id: 5, img: "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?w=600&auto=format&fit=crop&q=80", caption: "Casual Fridays made simple. Lightweight sage cargo shirts. #ClassicStyle" },
    { id: 6, img: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80", caption: "Stand out in monochrome. Super slim denims. #ClassicCulture" }
  ];

  if (dataLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-black)', borderRadius: '50%', animation: 'dropdownFade 0.6s linear infinite' }} />
        <p style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Loading Storefront...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      
      {/* HERO CAROUSEL */}
      <section className="hero-carousel">
        {heroBanners.length > 0 ? (
          heroBanners.map((banner, index) => (
            <div
              className={`hero-slide ${index === activeSlide ? 'active' : ''}`}
              key={banner.id}
            >
              <img
                src={banner.image_url}
                alt={banner.title || "Hero Banner"}
                className="hero-image"
              />
              <div className="hero-overlay" />
              <div className="hero-content">
                {banner.subtitle && <p className="hero-subtitle">{banner.subtitle}</p>}
                {banner.title && <h2 className="hero-title">{banner.title}</h2>}
                <Link to={banner.link_url || "/category/sale"} className="hero-btn">
                  SHOP THE LOOK
                </Link>
              </div>
            </div>
          ))
        ) : (
          /* Placeholder Hero Banner */
          <div className="hero-slide active">
            <img
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80"
              alt="Default Banner"
              className="hero-image"
            />
            <div className="hero-overlay" />
            <div className="hero-content">
              <p className="hero-subtitle">SPRING SUMMER '26</p>
              <h2 className="hero-title">REDEFINING CASUAL STYLE</h2>
              <Link to="/category/shirts" className="hero-btn">SHOP THE LOOK</Link>
            </div>
          </div>
        )}

        {/* Carousel Controls */}
        {heroBanners.length > 1 && (
          <>
            <button className="carousel-control prev" onClick={handlePrevSlide} aria-label="Previous slide">
              <ChevronLeft size={24} />
            </button>
            <button className="carousel-control next" onClick={handleNextSlide} aria-label="Next slide">
              <ChevronRight size={24} />
            </button>
            <div className="carousel-indicators">
              {heroBanners.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-dot ${index === activeSlide ? 'active' : ''}`}
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* SHOP BY CATEGORY (CIRCLES) */}
      <section className="container text-center" style={{ marginTop: 'var(--spacing-xxl)' }}>
        <div className="section-header">
          <h2 className="section-title">Shop by Category</h2>
        </div>
        <div className="category-circle-grid">
          {categories.map((cat) => (
            <Link
              to={`/category/${cat.slug}`}
              className="category-circle-card"
              key={cat.id}
            >
              <div className="category-circle-image-wrapper">
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="category-circle-image"
                  loading="lazy"
                />
              </div>
              <span className="category-circle-label">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* TRENDING THIS WEEK */}
      <section className="container text-center">
        <div className="section-header">
          <h2 className="section-title">Trending This Week</h2>
        </div>

        {/* Filter Chips */}
        <div className="filter-chips">
          {filterChips.map((chip) => (
            <button
              key={chip}
              className={`filter-chip ${activeFilter === chip ? 'active' : ''}`}
              onClick={() => setActiveFilter(chip)}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Trending Product Grid */}
        {trendingProducts.length > 0 ? (
          <div className="product-grid">
            {trendingProducts.slice(0, 4).map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        ) : (
          <div style={{ padding: 'var(--spacing-xl)', border: '1px solid var(--color-border)', margin: 'var(--spacing-lg) 0', color: 'var(--color-secondary-text)' }}>
            No trending products found for {activeFilter}.
          </div>
        )}
      </section>

      {/* SHOP BY COLLECTION */}
      <section className="container">
        <div className="section-header">
          <h2 className="section-title">Shop by Collection</h2>
        </div>
        <div className="collection-grid">
          {collectionBanners.length > 0 ? (
            collectionBanners.slice(0, 2).map((banner) => (
              <Link to={banner.link_url || "/"} className="collection-card" key={banner.id}>
                <img
                  src={banner.image_url}
                  alt={banner.title || "Collection banner"}
                  className="collection-img"
                  loading="lazy"
                />
                <div className="collection-overlay">
                  {banner.title && <h3 className="collection-title">{banner.title}</h3>}
                  {banner.subtitle && <p className="collection-subtitle">{banner.subtitle}</p>}
                </div>
              </Link>
            ))
          ) : (
            <>
              {/* Fallback Banner 1 */}
              <Link to="/category/shirts" className="collection-card">
                <img
                  src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1000&auto=format&fit=crop&q=80"
                  alt="Sunday Brunch Edit"
                  className="collection-img"
                />
                <div className="collection-overlay">
                  <h3 className="collection-title">The Sunday Brunch Edit</h3>
                  <p className="collection-subtitle">Relaxed Linens & Pastel Prints</p>
                </div>
              </Link>
              {/* Fallback Banner 2 */}
              <Link to="/category/jeans" className="collection-card">
                <img
                  src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=1000&auto=format&fit=crop&q=80"
                  alt="Triple O Five O Series"
                  className="collection-img"
                />
                <div className="collection-overlay">
                  <h3 className="collection-title">TRIPLE O FIVE O</h3>
                  <p className="collection-subtitle">Premium Heavyweight Denim Series</p>
                </div>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* INSTAGRAM FEED */}
      <section className="container text-center">
        <div className="section-header">
          <h2 className="section-title">Shop The Look</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-secondary-text)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Follow us on Instagram <a href="https://instagram.com" target="_blank" rel="noreferrer" style={{ fontWeight: 'bold', color: 'var(--color-primary-text)', textDecoration: 'underline' }}>@classiccollectionsolapur</a>
          </p>
        </div>
        
        <div className="instagram-grid">
          {instagramPosts.map((post) => (
            <div className="instagram-card" key={post.id}>
              <img
                src={post.img}
                alt="Instagram post style"
                className="instagram-img"
                loading="lazy"
              />
              <div className="instagram-overlay">
                <InstagramIcon size={20} style={{ marginBottom: 'var(--spacing-xs)' }} />
                <p>{post.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEO BRAND BLOCK */}
      <section style={{ backgroundColor: 'var(--color-bg-secondary)', padding: 'var(--spacing-xxl) 0', borderTop: '1px solid var(--color-border)' }}>
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: 'var(--spacing-md)', letterSpacing: '1px' }}>
            CLASSIC COLLECTION SOLAPUR: REDEFINING STYLE SINCE 1998
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-secondary-text)', lineHeight: 1.7, textAlign: 'justify' }}>
            Classic Collection Solapur was launched in 1998 with one guiding principle – to redefine casual wear for men. As a brand, we have always been progressive and expressive. We strive to provide premium clothing that represents creative freedom. What started with denims has now expanded to a complete wardrobe solution containing Shirts, T-shirts, Trousers, Cargos, Sweaters, Jackets, and Footwear.
          </p>
          
          {seoExpanded ? (
            <div style={{ marginTop: 'var(--spacing-sm)', fontSize: '13px', color: 'var(--color-secondary-text)', lineHeight: 1.7, textAlign: 'justify', animation: 'dropdownFade 0.3s forwards' }}>
              <p style={{ marginBottom: 'var(--spacing-sm)' }}>
                Our denims are crafted with signature whiskering, state-of-the-art washing methods, and high-stretch performance fabrics to match the dynamic requirements of urban youth. From our skinny fits to wide cargo profiles, each piece undergoes strict quality verification to ensure long-lasting comfort and durability.
              </p>
              <p>
                Browse our Spring Summer'26 edit to experience the rich colorways, breathable linen alignments, and tropical elements styled to give you an effortless fashion lift. Purchase online with our secure gateway and enjoy free shipping above ₹999 along with easy returns.
              </p>
            </div>
          ) : null}

          <button
            onClick={() => setSeoExpanded(!seoExpanded)}
            style={{
              marginTop: 'var(--spacing-md)',
              fontSize: '11px',
              fontWeight: 'bold',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              textDecoration: 'underline'
            }}
          >
            {seoExpanded ? "SHOW LESS" : "SHOW MORE"}
          </button>
        </div>
      </section>

    </div>
  );
}
