import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Star, Clock, CheckCircle2, Phone, MapPin, Sparkles, ChevronRight, HelpCircle } from 'lucide-react';
import type { Metadata } from 'next';

interface ServiceDetail {
  slug: string;
  name: string;
  category: string;
  h1: string;
  tagline: string;
  description: string;
  startingPrice: number;
  avgArrivalMins: number;
  rating: number;
  reviewCount: number;
  popularJobs: string[];
  faqs: { q: string; a: string }[];
}

const SERVICES: Record<string, ServiceDetail> = {
  electrician: {
    slug: 'electrician',
    name: 'Electrician',
    category: 'Electrical Services',
    h1: 'Hire Verified Electricians Near You',
    tagline: 'Fast arrival, certified technicians, and upfront transparent pricing.',
    description: 'Book licensed and verified electricians near you for switchboard installation, MCB tripping repair, fan fitting, house wiring, inverter setup, and emergency electrical repairs with Hero Hand.',
    startingPrice: 199,
    avgArrivalMins: 15,
    rating: 4.9,
    reviewCount: 428,
    popularJobs: [
      'Switchboard & Socket Installation',
      'Fan & Light Fixture Fitting',
      'MCB Fuse & Short Circuit Repair',
      'Inverter & Battery Wiring',
      'Complete House Concealed Wiring',
      'Geyser & Heavy Appliance Connection'
    ],
    faqs: [
      {
        q: 'How fast can an electrician arrive at my location?',
        a: 'With Hero Hand’s real-time GPS dispatching, local verified electricians in your neighborhood typically arrive within 15–30 minutes.'
      },
      {
        q: 'Are the electricians background verified?',
        a: 'Yes. Every Hero Hand electrical specialist undergoes identity verification and skill background checks.'
      },
      {
        q: 'What is the minimum inspection charge?',
        a: 'Inspection charges start at just ₹199, which is adjusted against the final repair bill.'
      }
    ]
  },
  plumber: {
    slug: 'plumber',
    name: 'Plumber',
    category: 'Plumbing Services',
    h1: 'Book Experienced Plumbers Near You',
    tagline: 'Fix leaks, blockages, tap repairs, and bathroom fittings in minutes.',
    description: 'Looking for a reliable plumber near you? Hero Hand connects you with expert local plumbers for pipe leakage, tap replacement, bathroom fittings, drainage blockages, and water tank cleaning.',
    startingPrice: 249,
    avgArrivalMins: 20,
    rating: 4.8,
    reviewCount: 385,
    popularJobs: [
      'Pipe Leakage & Burst Pipe Fix',
      'Tap, Shower & Valve Repair',
      'Drain & Toilet Blockage Removal',
      'Water Tank Cleaning & Overflow Valve',
      'Washbasin & Sink Fitting',
      'Water Motor & Pump Repair'
    ],
    faqs: [
      {
        q: 'Can a plumber fix urgent pipe leakages?',
        a: 'Yes! You can instantly dispatch an on-demand plumber through Hero Hand for immediate emergency leak stoppage.'
      },
      {
        q: 'Do plumbers bring their own tools and spare parts?',
        a: 'Yes, specialists arrive equipped with plumbing toolsets and can source genuine replacement pipes and fixtures.'
      }
    ]
  },
  carpenter: {
    slug: 'carpenter',
    name: 'Carpenter',
    category: 'Carpentry & Woodwork',
    h1: 'Professional Carpenters Near You',
    tagline: 'Custom woodwork, furniture repairs, door lock installation, and fittings.',
    description: 'Get top-rated carpenters at your doorstep for furniture assembly, door lock replacement, modular kitchen adjustments, wooden polishing, and hinge repair.',
    startingPrice: 299,
    avgArrivalMins: 25,
    rating: 4.9,
    reviewCount: 290,
    popularJobs: [
      'Door & Window Lock Repair / Installation',
      'Bed & Wardrobe Assembly / Disassembly',
      'Modular Kitchen Hinge & Drawer Repair',
      'Wooden Table & Chair Polishing',
      'Curtain Rod & Wall Shelf Mounting'
    ],
    faqs: [
      {
        q: 'Can carpenters assemble new flatpack furniture (IKEA / Pepperfry)?',
        a: 'Yes, our carpenters specialize in precision assembly of all major furniture brands.'
      }
    ]
  },
  'ac-repair': {
    slug: 'ac-repair',
    name: 'AC Repair & Service',
    category: 'HVAC & Cooling',
    h1: 'Expert AC Repair & Servicing Near You',
    tagline: 'Deep jet cleaning, refrigerant gas refill, split & window AC installation.',
    description: 'Beat the heat with Hero Hand’s verified AC technicians. Comprehensive AC servicing, gas charging, cooling issue diagnosis, filter cleaning, and new AC installations.',
    startingPrice: 449,
    avgArrivalMins: 30,
    rating: 4.9,
    reviewCount: 512,
    popularJobs: [
      'Power Jet Foam Deep Cleaning',
      'AC Gas Leak Check & Refrigerant Refill',
      'Split / Window AC Uninstallation & Installation',
      'PCB Circuit Board & Capacitor Replacement',
      'Water Dripping / Drainage Issue Fix'
    ],
    faqs: [
      {
        q: 'What is included in AC jet service?',
        a: 'Full indoor & outdoor coil cleaning with high-pressure water jet, filter sanitization, drain tray wash, and cooling performance inspection.'
      }
    ]
  },
  'home-cleaning': {
    slug: 'home-cleaning',
    name: 'Home Cleaning',
    category: 'Cleaning & Sanitization',
    h1: 'Deep Home & Office Cleaning Services',
    tagline: 'Spotless rooms, sanitized bathrooms, sofa shampooing, and kitchen degreasing.',
    description: 'Professional home cleaning services near you. Book full home deep cleaning, bathroom scrub down, kitchen chimney degreasing, and sofa upholstery cleaning.',
    startingPrice: 499,
    avgArrivalMins: 35,
    rating: 4.8,
    reviewCount: 340,
    popularJobs: [
      'Full Home Deep Cleaning (1BHK/2BHK/3BHK)',
      'Intensive Bathroom Tile & Grout Scrubbing',
      'Kitchen Oil Degreasing & Cabinet Sanitization',
      'Sofa & Mattress Dry Vacuum & Shampooing',
      'Balcony & Floor Scrubbing'
    ],
    faqs: [
      {
        q: 'Are eco-friendly chemicals used?',
        a: 'Yes, our cleaning specialists use safe, non-toxic, and surface-friendly professional cleaning agents.'
      }
    ]
  },
  painter: {
    slug: 'painter',
    name: 'House Painter',
    category: 'Painting & Waterproofing',
    h1: 'Verified House Painters Near You',
    tagline: 'Interior wall painting, waterproof exterior coating, and touch-ups.',
    description: 'Transform your home with professional painters. Interior wall repainting, exterior weather protection, dampness waterproofing, and stencil designs with Hero Hand.',
    startingPrice: 999,
    avgArrivalMins: 45,
    rating: 4.9,
    reviewCount: 210,
    popularJobs: [
      'Single Room / Accent Wall Painting',
      'Full Apartment Interior & Exterior Painting',
      'Damp Wall Waterproof Sealing',
      'Wood & Metal Enamel Painting',
      'Wall Putty & Primer Finishing'
    ],
    faqs: [
      {
        q: 'Do painters help with color selection?',
        a: 'Yes, specialists provide color shade catalogues and advice on weather-proof finishes.'
      }
    ]
  },
  'appliance-repair': {
    slug: 'appliance-repair',
    name: 'Appliance Repair',
    category: 'Electronics & Appliances',
    h1: 'Home Appliance Repair Technicians Near You',
    tagline: 'Washing machines, refrigerators, microwaves, and TV installation.',
    description: 'Expert repair for all home appliances. Front-load & top-load washing machines, single/double door refrigerators, microwave ovens, water purifiers, and TV wall mounts.',
    startingPrice: 299,
    avgArrivalMins: 25,
    rating: 4.8,
    reviewCount: 460,
    popularJobs: [
      'Washing Machine Drum & Motor Repair',
      'Refrigerator Cooling & Compressor Fix',
      'Microwave Heating & Magnetron Repair',
      'RO Water Purifier Filter & Membrane Replacement',
      'Smart TV Wall Mounting & Setup'
    ],
    faqs: [
      {
        q: 'Do repairs come with a service warranty?',
        a: 'Yes! All appliance repairs booked via Hero Hand include a 30-day post-service warranty.'
      }
    ]
  },
  'pest-control': {
    slug: 'pest-control',
    name: 'Pest Control',
    category: 'Pest Management',
    h1: 'Safe & Odorless Pest Control Services',
    tagline: 'Termite extermination, cockroach gel treatment, and mosquito control.',
    description: 'Safeguard your family from pests. Eco-friendly, odorless cockroach control, anti-termite piping treatment, bedbug extermination, and rodent management.',
    startingPrice: 699,
    avgArrivalMins: 40,
    rating: 4.9,
    reviewCount: 195,
    popularJobs: [
      'Odorless Herbal Cockroach Gel Treatment',
      'Subterranean Anti-Termite Protection',
      '2-Stage Bedbug Elimination Spray',
      'Mosquito & Fly Fogging',
      'Rodent Baiting & Trapping'
    ],
    faqs: [
      {
        q: 'Is the pest treatment safe for kids and pets?',
        a: 'Yes! We prioritize odorless herbal gels and government-approved, low-toxicity formulations.'
      }
    ]
  }
};

export async function generateStaticParams() {
  return Object.keys(SERVICES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = SERVICES[slug] || SERVICES.electrician;

  return {
    title: `${service.name} Near Me — Verified Local Specialists | Hero Hand`,
    description: `${service.description} Starting from ₹${service.startingPrice}. Arrives in ${service.avgArrivalMins} mins. Rated ${service.rating}/5.`,
    keywords: [
      `${service.name.toLowerCase()} near me`,
      `book ${service.name.toLowerCase()}`,
      `local ${service.name.toLowerCase()} in Shivamogga`,
      `emergency ${service.name.toLowerCase()}`,
      `best ${service.name.toLowerCase()} services`,
      'HeroHand',
      'Hero Hand'
    ],
    openGraph: {
      title: `${service.h1} | Hero Hand`,
      description: service.description,
      url: `https://herohand.me/services/${service.slug}/`,
      siteName: 'HeroHand',
      images: [{ url: '/icon-512.png', width: 512, height: 512, alt: `${service.name} - Hero Hand` }]
    }
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = SERVICES[slug] || SERVICES.electrician;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: service.name,
    provider: {
      '@type': 'LocalBusiness',
      name: 'HeroHand',
      url: 'https://herohand.me',
      telephone: '+918867269712',
      priceRange: `₹${service.startingPrice}+`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Shivamogga',
        addressRegion: 'Karnataka',
        addressCountry: 'IN'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: service.rating,
        reviewCount: service.reviewCount
      }
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Karnataka, India'
    },
    offers: {
      '@type': 'Offer',
      price: service.startingPrice,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock'
    }
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: service.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a
      }
    }))
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#1E293B', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Sticky Top Header */}
      <header style={{ background: '#041B30', color: 'white', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #1E293B' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'white' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0B3D66', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} color="#F59E0B" />
            </div>
            <div>
              <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.3px', display: 'block' }}>Hero Hand</span>
              <span style={{ fontSize: 10, color: '#93C5FD', fontWeight: 600, textTransform: 'uppercase' }}>Verified Specialists</span>
            </div>
          </Link>
          <Link 
            href="/?action=book" 
            style={{ 
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', 
              color: '#0F172A', 
              fontWeight: 800, 
              fontSize: 13, 
              padding: '8px 18px', 
              borderRadius: 20, 
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(245,158,11,0.3)'
            }}
          >
            Open App
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 80px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 16 }}>
          <Link href="/" style={{ color: '#0284C7', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <span>/</span>
          <span>Services</span>
          <span>/</span>
          <span style={{ color: '#0F172A', fontWeight: 700 }}>{service.name}</span>
        </div>

        {/* Hero Banner Card */}
        <div style={{ background: 'white', borderRadius: 24, padding: '32px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#DCFCE7', color: '#166534', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, marginBottom: 12 }}>
            <ShieldCheck size={14} /> Verified & Background Checked
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', margin: '0 0 10px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            {service.h1}
          </h1>

          <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.5, margin: '0 0 20px' }}>
            {service.tagline}
          </p>

          {/* Quick Stat Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
            <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 16, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Starting At</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', marginTop: 2 }}>₹{service.startingPrice}</div>
            </div>
            <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 16, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Avg Arrival</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#059669', marginTop: 2 }}>{service.avgArrivalMins} mins</div>
            </div>
            <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: 16, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Customer Rating</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#D97706', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={18} fill="#F59E0B" color="#F59E0B" /> {service.rating} ({service.reviewCount})
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href={`/?category=${service.slug}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              width: '100%',
              background: 'linear-gradient(135deg, #041B30 0%, #0B3D66 100%)',
              color: 'white',
              fontSize: 16,
              fontWeight: 800,
              padding: '16px 24px',
              borderRadius: 16,
              textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(11,61,102,0.25)',
              textAlign: 'center'
            }}
          >
            <span>Book Verified {service.name} Now</span>
            <ChevronRight size={18} />
          </Link>
        </div>

        {/* Popular Services Section */}
        <div style={{ background: 'white', borderRadius: 24, padding: '28px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: '0 0 16px' }}>
            Popular {service.name} Services & Repairs
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {service.popularJobs.map((job, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', padding: '12px 14px', borderRadius: 12, border: '1px solid #F1F5F9' }}>
                <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{job}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose Hero Hand */}
        <div style={{ background: 'white', borderRadius: 24, padding: '28px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: '0 0 16px' }}>
            Why Book with Hero Hand?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div style={{ background: '#F0F7FF', padding: 18, borderRadius: 16, border: '1px solid #BAE6FD' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0B3D66', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Clock size={18} color="white" />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>Fast 15-Min Arrival</h3>
              <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                Local GPS dispatch matches you with the closest technician on-duty.
              </p>
            </div>

            <div style={{ background: '#ECFDF5', padding: 18, borderRadius: 16, border: '1px solid #A7F3D0' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <ShieldCheck size={18} color="white" />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>100% Privacy Shield</h3>
              <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                Phone numbers are masked with encrypted in-app calling.
              </p>
            </div>

            <div style={{ background: '#FEF3C7', padding: 18, borderRadius: 16, border: '1px solid #FDE68A' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Sparkles size={18} color="white" />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>Transparent Rates</h3>
              <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                Clear fixed inspection rates with zero hidden surge pricing.
              </p>
            </div>
          </div>
        </div>

        {/* FAQs Accordion */}
        <div style={{ background: 'white', borderRadius: 24, padding: '28px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0', marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <HelpCircle size={22} color="#0B3D66" /> Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {service.faqs.map((faq, i) => (
              <details key={i} style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: 14, border: '1px solid #E2E8F0', cursor: 'pointer' }} open={i === 0}>
                <summary style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', outline: 'none' }}>
                  {faq.q}
                </summary>
                <p style={{ fontSize: 13, color: '#475569', margin: '10px 0 0', lineHeight: 1.6 }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom Floating Bar */}
        <div style={{ position: 'fixed', bottom: 16, left: 16, right: 16, maxWidth: 600, margin: '0 auto', zIndex: 100 }}>
          <Link
            href={`/?category=${service.slug}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#0B3D66',
              color: 'white',
              padding: '14px 20px',
              borderRadius: 20,
              textDecoration: 'none',
              boxShadow: '0 12px 32px rgba(4,27,48,0.4)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: '#93C5FD', fontWeight: 600 }}>Need a {service.name}?</div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Starting from ₹{service.startingPrice}</div>
            </div>
            <div style={{ background: '#F59E0B', color: '#0F172A', padding: '8px 16px', borderRadius: 12, fontWeight: 800, fontSize: 13 }}>
              Find Nearby ➔
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
