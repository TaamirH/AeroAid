import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 10;

  const showSlide = (n) => {
    setCurrentSlide((n + totalSlides) % totalSlides);
    // Add slide transition effect
    document.body.style.filter = 'brightness(1.1)';
    setTimeout(() => {
      document.body.style.filter = 'brightness(1)';
    }, 200);
  };

  const nextSlide = () => showSlide(currentSlide + 1);
  const previousSlide = () => showSlide(currentSlide - 1);

  useEffect(() => {
    // Keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        previousSlide();
      } else if (e.key === 'Home') {
        e.preventDefault();
        showSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        showSlide(totalSlides - 1);
      }
    };

    // Create particles
    const createParticles = () => {
      const particlesContainer = document.getElementById('particles');
      if (!particlesContainer) return;
      
      const particleCount = 60;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 12 + 's';
        particle.style.animationDuration = (Math.random() * 8 + 8) + 's';
        
        const size = Math.random() * 2 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        particlesContainer.appendChild(particle);
      }
    };

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    
    const handleMouseMove = (e) => {
      mouseX = e.clientX / window.innerWidth;
      mouseY = e.clientY / window.innerHeight;
      
      const particles = document.querySelectorAll('.particle');
      
      particles.forEach((particle, index) => {
        const speed = (index % 4 + 1) * 0.8;
        const x = (mouseX - 0.5) * speed * 20;
        const y = (mouseY - 0.5) * speed * 20;
        
        particle.style.transform = `translate(${x}px, ${y}px)`;
      });
    };

    // Click ripple effect
    const handleClick = (e) => {
      const ripple = document.createElement('div');
      ripple.style.position = 'fixed';
      ripple.style.left = e.clientX + 'px';
      ripple.style.top = e.clientY + 'px';
      ripple.style.width = '10px';
      ripple.style.height = '10px';
      ripple.style.background = 'rgba(59, 130, 246, 0.6)';
      ripple.style.borderRadius = '50%';
      ripple.style.transform = 'scale(0)';
      ripple.style.animation = 'ripple 0.6s ease-out';
      ripple.style.pointerEvents = 'none';
      ripple.style.zIndex = '9999';
      
      document.body.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
    createParticles();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
    };
  }, [currentSlide]);

  const slides = [
    // Slide 1: Title
    <div key={0} className="slide-content">
      <div className="logo-container">
        <div className="logo">
          <svg viewBox="0 0 64 64" width="70" height="70" fill="currentColor">
            <path d="M32 8c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2s2-.9 2-2v-6c0-1.1-.9-2-2-2z"/>
            <path d="M32 46c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2s2-.9 2-2v-6c0-1.1-.9-2-2-2z"/>
            <path d="M56 30h-6c-1.1 0-2 .9-2 2s.9 2 2 2h6c1.1 0 2-.9 2-2s-.9-2-2-2z"/>
            <path d="M16 30h-6c-1.1 0-2 .9-2 2s.9 2 2 2h6c1.1 0 2-.9 2-2s-.9-2-2-2z"/>
            <circle cx="32" cy="32" r="6" fill="white" opacity="0.9"/>
            <path d="M32 20c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12zm0 20c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
            <circle cx="20" cy="20" r="3" fill="white" opacity="0.7"/>
            <circle cx="44" cy="20" r="3" fill="white" opacity="0.7"/>
            <circle cx="20" cy="44" r="3" fill="white" opacity="0.7"/>
            <circle cx="44" cy="44" r="3" fill="white" opacity="0.7"/>
          </svg>
        </div>
      </div>
      <div className="slide-header">
        <div className="slide-title">AeroAid</div>
        <div className="slide-subtitle">Revolutionizing Emergency Response with <span className="highlight">🚁 Crowdsourced Drone Technology</span></div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <p style={{ fontSize: '1.4rem', opacity: 0.9, fontWeight: 500, marginBottom: '20px' }}>⚡ When every second counts, we mobilize the sky</p>
        <p style={{ fontSize: '1.1rem', opacity: 0.7 }}>🌐 Live at <strong>aeroaid.me</strong></p>
      </div>
    </div>,

    // Slide 2: The Problem
    <div key={1} className="slide-content">
      <div className="slide-header">
        <div className="slide-title">⚠️ The Critical Problem</div>
        <div className="slide-subtitle">Traditional emergency response faces <span className="highlight">⏰ life-threatening delays</span></div>
      </div>
      <div className="problem-grid">
        <div className="problem-card">
          <div className="problem-number">1</div>
          <h3>⏱️ Response Time Gaps</h3>
          <p>Every minute in an emergency can mean the difference between life and death. Traditional response can take 15-30 minutes in urban areas, even longer in remote locations.</p>
        </div>
        <div className="problem-card">
          <div className="problem-number">2</div>
          <h3>👁️ Limited Aerial Coverage</h3>
          <p>Emergency services have limited aerial surveillance capabilities, making search operations slow and resource-intensive.</p>
        </div>
        <div className="problem-card">
          <div className="problem-number">3</div>
          <h3>🚁 Untapped Drone Resources</h3>
          <p>Thousands of drone operators and their equipment sit unused while emergencies unfold in their neighborhoods.</p>
        </div>
        <div className="problem-card">
          <div className="problem-number">4</div>
          <h3>📡 Communication Barriers</h3>
          <p>No effective system exists to coordinate civilian drone operators with emergency responders and those in need.</p>
        </div>
      </div>
    </div>,

    // Slide 3: Market Impact
    <div key={2} className="slide-content">
      <div className="slide-header">
        <div className="slide-title">📊 Market Impact</div>
        <div className="slide-subtitle">The opportunity to <span className="highlight">💝 save lives at scale</span></div>
      </div>
      <div className="stats">
        <div className="stat-card">
          <div className="stat-number">2M+</div>
          <h3>🚁 Registered Drones</h3>
          <p>In the US alone, creating massive untapped emergency response potential</p>
        </div>
        <div className="stat-card">
          <div className="stat-number">15min</div>
          <h3>⏰ Average Response</h3>
          <p>Current emergency response time that we can cut to under 5 minutes</p>
        </div>
        <div className="stat-card">
          <div className="stat-number">$150B</div>
          <h3>🚨 Emergency Services</h3>
          <p>Annual global market that can benefit from drone integration</p>
        </div>
        <div className="stat-card">
          <div className="stat-number">85%</div>
          <h3>📈 Success Rate</h3>
          <p>Improvement in search operations when aerial support is available</p>
        </div>
      </div>
    </div>,

    // Slide 4: Solution
    <div key={3} className="slide-content">
      <div className="slide-header">
        <div className="slide-title">✨ AeroAid Solution</div>
        <div className="slide-subtitle">The world's first <span className="highlight">🌐 crowdsourced emergency drone network</span></div>
      </div>
      <div className="solution-features-3">
        <div className="feature-item">
          <div className="large-icon">🚨</div>
          <h3>Instant Alerts</h3>
          <p>Emergency requests instantly notify all drone operators within 3km radius</p>
        </div>
        <div className="feature-item">
          <div className="large-icon">🎯</div>
          <h3>Smart Coordination</h3>
          <p>AI-powered search area assignment and real-time tracking prevents overlap</p>
        </div>
        <div className="feature-item">
          <div className="large-icon">📱</div>
          <h3>Unified Platform</h3>
          <p>Web and mobile apps for seamless communication between all parties</p>
        </div>
      </div>
      <div className="solution-features-3">
        <div className="feature-item">
          <div className="large-icon">🌐</div>
          <h3>Real-time Data</h3>
          <p>Live drone feeds, GPS tracking, and instant finding reports</p>
        </div>
        <div className="feature-item">
          <div className="large-icon">📊</div>
          <h3>Comprehensive Analytics</h3>
          <p>Performance metrics, response times, and success rates for continuous improvement</p>
        </div>
        <div className="feature-item">
          <div className="large-icon">🔔</div>
          <h3>Instant Communication</h3>
          <p>Real-time messaging and emergency alerts for seamless coordination</p>
        </div>
      </div>
    </div>,

    // Slide 5: How It Works
    <div key={4} className="slide-content">
      <div className="slide-header">
        <div className="slide-title">⚙️ How AeroAid Works</div>
        <div className="slide-subtitle">From emergency to rescue in <span className="highlight">⚡ under 5 minutes</span></div>
      </div>
      <div className="timeline-enhanced">
        <div className="timeline-item-enhanced">
          <div className="timeline-content">
            <h3>🆘 Emergency Reported</h3>
            <p>Victim or witness reports emergency with precise location through our platform</p>
          </div>
          <div className="timeline-number">1</div>
          <div className="timeline-image">
            <div style={{ width: '100%', height: '200px', borderRadius: '12px', background: '#f8fafc', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', marginBottom: '10px' }}>Report Emergency</div>
              <div style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', width: '90%', margin: '4px 0', fontSize: '10px', color: '#374151' }}>Emergency Type: Suspected Kidnapping</div>
              <div style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', width: '90%', margin: '4px 0', fontSize: '10px', color: '#374151' }}>Details: A child abduction call received...</div>
              <div style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', width: '90%', margin: '4px 0', fontSize: '10px', color: '#374151' }}>Location: Yitzhack Ra, Be'er-Sheva</div>
              <div style={{ background: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', marginTop: '8px' }}>Submit Emergency Request</div>
            </div>
          </div>
        </div>
        <div className="timeline-item-enhanced">
          <div className="timeline-content">
            <h3>📢 Operators Notified</h3>
            <p>All verified drone operators within 3km receive instant notifications via multiple channels</p>
          </div>
          <div className="timeline-number">2</div>
          <div className="timeline-image">
            <div style={{ width: '100%', height: '200px', borderRadius: '12px', background: '#f8fafc', padding: '15px', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ background: '#10b981', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>active</div>
                <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 'bold' }}>Emergency #ai060Fum</span>
              </div>
              <div style={{ fontSize: '11px', color: '#374151', marginBottom: '8px' }}><strong>Emergency Type:</strong> Suspected Kidnapping</div>
              <div style={{ fontSize: '11px', color: '#374151', marginBottom: '8px' }}><strong>Location:</strong> Yitzhack Rager Avenue, Be'er Sheva</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <div style={{ flex: 1, height: '60px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '9px', textAlign: 'center' }}>Interactive Map<br/>📍</div>
                <div style={{ flex: 1 }}>
                  <div style={{ background: '#f3f4f6', borderRadius: '6px', padding: '6px', marginBottom: '4px', fontSize: '9px' }}>Assignment ID: kDbLMoWj...</div>
                  <div style={{ background: '#3b82f6', color: 'white', textAlign: 'center', padding: '4px', borderRadius: '4px', fontSize: '9px' }}>View Assignment</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="timeline-item-enhanced">
          <div className="timeline-content">
            <h3>🚀 Rapid Response</h3>
            <p>First available operator accepts mission and deploys drone to assigned search grid</p>
          </div>
          <div className="timeline-number">3</div>
          <div className="timeline-image">
            <div style={{ width: '100%', height: '200px', borderRadius: '12px', background: '#1f2937', color: 'white', padding: '15px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ background: '#10b981', padding: '2px 6px', borderRadius: '3px', fontSize: '8px', marginRight: '6px' }}>🚁</div>
                <span style={{ fontSize: '10px', fontWeight: 'bold' }}>AeroAid EMERGENCY ALERT</span>
              </div>
              <div style={{ color: '#ef4444', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Suspected Kidnapping Emergency Nearby</div>
              <div style={{ fontSize: '9px', marginBottom: '6px' }}>Hello tamir,</div>
              <div style={{ fontSize: '9px', marginBottom: '8px' }}>An emergency situation has been reported in your area and requires immediate drone operator assistance.</div>
              <div style={{ color: '#ef4444', fontSize: '10px', fontWeight: 'bold', marginBottom: '6px' }}>Emergency Details</div>
              <div style={{ fontSize: '8px', marginBottom: '4px' }}>Emergency ID: #ai060Fum</div>
              <div style={{ fontSize: '8px', marginBottom: '4px' }}>Distance: 1.12 km from your location</div>
              <div style={{ background: '#3b82f6', color: 'white', textAlign: 'center', padding: '6px', borderRadius: '6px', fontSize: '9px', marginTop: 'auto' }}>🔗 View Emergency & Respond</div>
            </div>
          </div>
        </div>
        <div className="timeline-item-enhanced">
          <div className="timeline-content">
            <h3>📸 Live Coordination & Photo Sharing</h3>
            <p>Real-time tracking, communication, and instant photo/video evidence sharing guide emergency services</p>
          </div>
          <div className="timeline-number">4</div>
          <div className="timeline-image">
            <img src="/nature.jpg" alt="Live Drone Feed" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px' }} />
          </div>
        </div>
      </div>
    </div>,

    // Slide 6: Use Cases
    <div key={5} className="slide-content">
      <div className="slide-header">
        <div className="slide-title">🎯 Critical Use Cases</div>
        <div className="slide-subtitle">AeroAid saves lives across <span className="highlight">🚨 multiple emergency scenarios</span></div>
      </div>
      <div className="problem-grid">
        <div className="problem-card">
          <div className="large-icon">🔍</div>
          <h3>Missing Persons</h3>
          <p>Rapid search operations for lost hikers, children, or elderly patients with dementia</p>
        </div>
        <div className="problem-card">
          <div className="large-icon">🌊</div>
          <h3>Water Rescues</h3>
          <p>Drowning incidents, boat accidents, and flood victims requiring immediate location</p>
        </div>
        <div className="problem-card">
          <div className="large-icon">🚗</div>
          <h3>Traffic Accidents</h3>
          <p>Remote crash sites, highway incidents, and situations requiring aerial assessment</p>
        </div>
        <div className="problem-card">
          <div className="large-icon">🌪️</div>
          <h3>Natural Disasters</h3>
          <p>Earthquake victims, wildfire evacuations, and storm damage assessment</p>
        </div>
        <div className="problem-card">
          <div className="large-icon">🏗️</div>
          <h3>Structural Damage</h3>
          <p>Building collapses, industrial accidents, and hazardous material incidents</p>
        </div>
        <div className="problem-card">
          <div className="large-icon">🐕</div>
          <h3>Lost Pets</h3>
          <p>Community support for finding lost animals, extending our network's social impact</p>
        </div>
      </div>
    </div>,

    // Slide 7: Technology
    <div key={6} className="slide-content">
      <div className="slide-header">
        <div className="slide-title">💻 Technology Architecture</div>
        <div className="slide-subtitle">Built for <span className="highlight">⚡ scale, speed, and reliability</span></div>
      </div>
      <div className="tech-stack">
        <div className="tech-section">
          <h3><span className="icon">⚛️</span>Frontend & Mobile</h3>
          <div className="tech-item"><strong>⚛️ React.js + 🎨 Tailwind CSS</strong> - Responsive, modern UI/UX with component-based architecture</div>
          <div className="tech-item"><strong>🗺️ Leaflet.js</strong> - Interactive mapping with real-time drone tracking and geofencing</div>
          <div className="tech-item"><strong>📱 Progressive Web App</strong> - Mobile-first design with offline capabilities and push notifications</div>
          <div className="tech-item"><strong>🔌 WebSocket Integration</strong> - Real-time chat, location updates, and live coordination</div>
          <div className="tech-item"><strong>📊 Real-time Analytics</strong> - Live performance dashboards and mission tracking</div>
          <div className="tech-item"><strong>🔔 Push Notifications</strong> - Instant alerts across all platforms and devices</div>
        </div>
        <div className="tech-section">
          <h3><span className="icon">🔥</span>Backend & Infrastructure</h3>
          <div className="tech-item"><strong>🔥 Firebase Suite</strong> - Real-time Firestore database, authentication, cloud functions</div>
          <div className="tech-item"><strong>☁️ AWS S3 + CloudFront</strong> - Static hosting with global CDN distribution for fast loading</div>
          <div className="tech-item"><strong>🌐 Route 53 + Cloudflare</strong> - DNS management with DDoS protection and security</div>
          <div className="tech-item"><strong>📧 EmailJS Integration</strong> - Multi-channel emergency alerts with fallback systems</div>
          <div className="tech-item"><strong>🌤️ OpenWeather API</strong> - Real-time weather data for flight safety and mission planning</div>
          <div className="tech-item"><strong>🤖 AI Optimization</strong> - Machine learning for route planning and resource allocation</div>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <p><span className="highlight">🚀 Production Ready:</span> Currently deployed at <strong>aeroaid.me</strong> with enterprise-grade infrastructure</p>
      </div>
    </div>,

    // Slide 8: Competitive Advantage
    <div key={7} className="slide-content">
      <div className="slide-header">
        <div className="slide-title">🏆 Competitive Advantage</div>
        <div className="slide-subtitle">Why AeroAid will <span className="highlight">🎯 dominate the emergency drone market</span></div>
      </div>
      <div className="solution-features">
        <div className="feature-item">
          <div className="large-icon">🚀</div>
          <h3>First-Mover Advantage</h3>
          <p>No comprehensive crowdsourced emergency drone platform exists today</p>
        </div>
        <div className="feature-item">
          <div className="large-icon">🌐</div>
          <h3>Network Effects</h3>
          <p>More operators = faster response = more users = stronger network</p>
        </div>
        <div className="feature-item">
          <div className="large-icon">💰</div>
          <h3>Cost-Effective</h3>
          <p>Leverages existing resources instead of requiring new infrastructure</p>
        </div>
        <div className="feature-item">
          <div className="large-icon">📈</div>
          <h3>Scalable Technology</h3>
          <p>Cloud-native architecture can handle millions of users and operators</p>
        </div>
        <div className="feature-item">
          <div className="large-icon">🤝</div>
          <h3>Community-Driven</h3>
          <p>Strong social mission attracts volunteers and builds brand loyalty</p>
        </div>
        <div className="feature-item">
          <div className="large-icon">🔮</div>
          <h3>AI-Powered Intelligence</h3>
          <p>Machine learning algorithms optimize search patterns and predict response times</p>
        </div>
      </div>
    </div>,

    // Slide 9: Business Model
    <div key={8} className="slide-content">
      <div className="slide-header">
        <div className="slide-title">💼 Business Model</div>
        <div className="slide-subtitle">Multiple revenue streams driving <span className="highlight">📈 sustainable growth</span></div>
      </div>
      <div className="problem-grid">
        <div className="problem-card">
          <div className="large-icon">🏛️</div>
          <h3>Government Partnerships</h3>
          <p>Licensing to cities, counties, and emergency services departments for comprehensive coverage</p>
        </div>
        <div className="problem-card">
          <div className="large-icon">🏢</div>
          <h3>Enterprise Solutions</h3>
          <p>Corporate emergency response for large campuses, industrial sites, and major events</p>
        </div>
        <div className="problem-card">
          <div className="large-icon">⭐</div>
          <h3>Premium Features</h3>
          <p>Advanced analytics, priority response, and professional operator network access</p>
        </div>
        <div className="problem-card">
          <div className="large-icon">🎓</div>
          <h3>Training & Certification</h3>
          <p>Drone operator training programs, safety certifications, and equipment partnerships</p>
        </div>
      </div>
    </div>,

    // Slide 10: Call to Action
    <div key={9} className="slide-content">
      <div className="slide-header">
        <div className="slide-title">🚀 Join the Revolution</div>
        <div className="slide-subtitle">Help us build the future of <span className="highlight">🆘 emergency response</span></div>
      </div>
      <div className="demo-section">
        <div className="large-icon">🌟</div>
        <h3 style={{ marginBottom: '30px', fontSize: '1.8rem' }}>Ready to save lives with technology?</h3>
        <a href="https://aeroaid.me" className="demo-btn" target="_blank" rel="noopener noreferrer">🚀 Live Demo</a>
        <a href="https://github.com/TaamirH/AeroAid" className="demo-btn" target="_blank" rel="noopener noreferrer">💻 View Code</a>
        
        <div className="contact-info">
          <h4>📞 Contact Information</h4>
          <p><span className="icon">📧</span>Email: taamirhd@gmail.com</p>
          <p><span className="icon">🌐</span>Platform: aeroaid.me</p>
          <p><span className="icon">💼</span>GitHub: github.com/TaamirH/AeroAid</p>
        </div>
        
        <div className="quote-section">
          <p>"When emergencies strike, every second counts. AeroAid turns the sky into a lifeline." 🌤️✨</p>
        </div>
      </div>
    </div>
  ];

  return (
    <>
      <Head>
        <title>AeroAid - Emergency Drone Response Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          background: radial-gradient(circle at 20% 80%, #1e293b 0%, #0f172a 50%), 
                      radial-gradient(circle at 80% 20%, #374151 0%, #111827 50%),
                      linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #f8fafc;
          overflow-x: hidden;
          position: relative;
          min-height: 100vh;
        }
        
        .particles {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }
        
        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: linear-gradient(45deg, #60a5fa, #34d399, #f59e0b);
          border-radius: 50%;
          opacity: 0.7;
          animation: float 12s infinite ease-in-out;
          box-shadow: 0 0 10px rgba(96, 165, 250, 0.3);
        }
        
        .particle:nth-child(even) {
          background: linear-gradient(45deg, #8b5cf6, #06b6d4, #ef4444);
          animation-duration: 15s;
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0.7;
          }
          25% { 
            transform: translateY(-30px) translateX(15px) scale(1.2);
            opacity: 1;
          }
          50% { 
            transform: translateY(-15px) translateX(-15px) scale(0.8);
            opacity: 0.8;
          }
          75% { 
            transform: translateY(-45px) translateX(8px) scale(1.1);
            opacity: 0.9;
          }
        }
        
        @keyframes ripple {
          to {
            transform: scale(20);
            opacity: 0;
          }
        }
        
        .slide {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px;
          position: relative;
          z-index: 1;
          animation: slideIn 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateY(60px) scale(0.92);
            filter: blur(8px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
        
        .slide-content {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px;
        }
        
        .slide-header {
          text-align: center;
          margin-bottom: 60px;
        }
        
        .slide-title {
          font-size: 4rem;
          font-weight: 900;
          margin-bottom: 20px;
          background: linear-gradient(135deg, #3b82f6, #06b6d4, #8b5cf6, #ec4899);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 40px rgba(59, 130, 246, 0.4);
          letter-spacing: -0.03em;
          animation: gradientShift 4s ease-in-out infinite;
        }
        
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .slide-subtitle {
          font-size: 1.6rem;
          opacity: 0.9;
          max-width: 900px;
          margin: 0 auto;
          line-height: 1.7;
          font-weight: 400;
        }
        
        .logo-container {
          margin-bottom: 40px;
          animation: logoFloat 6s ease-in-out infinite;
        }
        
        @keyframes logoFloat {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg);
            filter: drop-shadow(0 0 30px rgba(59, 130, 246, 0.4));
          }
          50% { 
            transform: translateY(-10px) rotate(2deg);
            filter: drop-shadow(0 0 50px rgba(59, 130, 246, 0.6));
          }
        }
        
        .logo {
          width: 140px;
          height: 140px;
          background: linear-gradient(135deg, #3b82f6, #06b6d4, #8b5cf6);
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 3rem;
          font-weight: bold;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }
        
        .logo::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255,255,255,0.15), transparent);
          transform: rotate(45deg);
          animation: logoShine 4s ease-in-out infinite;
        }
        
        @keyframes logoShine {
          0% { transform: translateX(-150%) translateY(-150%) rotate(45deg); }
          50% { transform: translateX(150%) translateY(150%) rotate(45deg); }
          100% { transform: translateX(-150%) translateY(-150%) rotate(45deg); }
        }
        
        .problem-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 35px;
          max-width: 1400px;
          width: 100%;
        }
        
        .problem-card {
          background: rgba(30, 41, 59, 0.6);
          backdrop-filter: blur(25px);
          border-radius: 24px;
          padding: 35px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .problem-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
          transition: left 0.8s ease;
        }
        
        .problem-card:hover {
          transform: translateY(-12px) scale(1.03);
          box-shadow: 0 30px 60px rgba(59, 130, 246, 0.25);
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(30, 41, 59, 0.8);
        }
        
        .problem-card:hover::before {
          left: 100%;
        }
        
        .problem-number {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          width: 60px;
          height: 60px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          margin-bottom: 25px;
          font-size: 1.4rem;
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }
        
        .problem-card h3 {
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 15px;
          color: #e2e8f0;
        }
        
        .problem-card p {
          font-size: 1rem;
          line-height: 1.6;
          opacity: 0.9;
        }
        
        .solution-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          max-width: 1400px;
          width: 100%;
        }
        
        .solution-features-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
          max-width: 1400px;
          width: 100%;
          margin-bottom: 30px;
        }
        
        .feature-item {
          background: rgba(30, 41, 59, 0.7);
          padding: 35px;
          border-radius: 20px;
          text-align: center;
          border: 1px solid rgba(59, 130, 246, 0.2);
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }
        
        .feature-item::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6, #06b6d4, #8b5cf6);
          transform: scaleX(0);
          transition: transform 0.4s ease;
        }
        
        .feature-item:hover {
          transform: translateY(-8px);
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(30, 41, 59, 0.9);
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.2);
        }
        
        .feature-item:hover::after {
          transform: scaleX(1);
        }
        
        .feature-item h3 {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 15px;
          color: #e2e8f0;
        }
        
        .feature-item p {
          font-size: 1rem;
          line-height: 1.6;
          opacity: 0.9;
        }
        
        .large-icon {
          font-size: 3rem;
          margin-bottom: 20px;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.3));
        }
        
        .timeline-enhanced {
          display: flex;
          flex-direction: column;
          gap: 40px;
          max-width: 1400px;
          width: 100%;
          padding: 40px 0;
        }
        
        .timeline-item-enhanced {
          display: flex;
          align-items: center;
          gap: 40px;
          background: rgba(30, 41, 59, 0.7);
          padding: 30px;
          border-radius: 20px;
          border: 1px solid rgba(59, 130, 246, 0.3);
          transition: all 0.4s ease;
          backdrop-filter: blur(20px);
        }
        
        .timeline-item-enhanced:nth-child(even) {
          flex-direction: row-reverse;
        }
        
        .timeline-item-enhanced:hover {
          transform: translateY(-5px);
          border-color: rgba(59, 130, 246, 0.6);
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.25);
        }
        
        .timeline-item-enhanced .timeline-content {
          flex: 1;
          background: transparent;
          padding: 0;
          border: none;
          max-width: none;
        }
        
        .timeline-item-enhanced .timeline-number {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          width: 70px;
          height: 70px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.5rem;
          border: 4px solid #0f172a;
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
          margin: 0 20px;
          flex-shrink: 0;
        }
        
        .timeline-image {
          width: 300px;
          height: 200px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid rgba(59, 130, 246, 0.3);
        }
        
        .timeline-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .timeline-content h3 {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 12px;
          color: #e2e8f0;
        }
        
        .timeline-content p {
          font-size: 1rem;
          line-height: 1.6;
          opacity: 0.9;
        }
        
        .tech-stack {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 50px;
          max-width: 1400px;
          width: 100%;
        }
        
        .tech-section {
          background: rgba(30, 41, 59, 0.7);
          padding: 40px;
          border-radius: 24px;
          border: 1px solid rgba(59, 130, 246, 0.3);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(20px);
        }
        
        .tech-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: linear-gradient(90deg, #3b82f6, #06b6d4, #8b5cf6);
        }
        
        .tech-section h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 25px;
          color: #e2e8f0;
        }
        
        .tech-item {
          margin: 25px 0;
          padding: 20px;
          background: rgba(15, 23, 42, 0.6);
          border-radius: 16px;
          border-left: 5px solid #3b82f6;
          transition: all 0.4s ease;
          backdrop-filter: blur(10px);
        }
        
        .tech-item:hover {
          background: rgba(15, 23, 42, 0.9);
          transform: translateX(8px);
          border-left-color: #06b6d4;
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.2);
        }
        
        .tech-item strong {
          color: #60a5fa;
          font-weight: 700;
        }
        
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 35px;
          max-width: 1200px;
          width: 100%;
        }
        
        .stat-card {
          text-align: center;
          background: rgba(30, 41, 59, 0.7);
          padding: 40px;
          border-radius: 24px;
          border: 1px solid rgba(59, 130, 246, 0.3);
          transition: all 0.5s ease;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(20px);
        }
        
        .stat-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(from 0deg, transparent, rgba(59, 130, 246, 0.15), transparent);
          animation: rotate 6s linear infinite;
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        
        .stat-card:hover::before {
          opacity: 1;
        }
        
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .stat-card:hover {
          transform: translateY(-12px);
          border-color: rgba(59, 130, 246, 0.6);
          box-shadow: 0 25px 50px rgba(59, 130, 246, 0.25);
        }
        
        .stat-number {
          font-size: 4rem;
          font-weight: 900;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 15px;
          position: relative;
          z-index: 1;
        }
        
        .stat-card h3 {
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 10px;
          color: #e2e8f0;
        }
        
        .stat-card p {
          font-size: 0.95rem;
          line-height: 1.5;
          opacity: 0.9;
        }
        
        .highlight {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(6, 182, 212, 0.4));
          padding: 6px 16px;
          border-radius: 12px;
          font-weight: 700;
          border: 1px solid rgba(59, 130, 246, 0.3);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
        }
        
        .demo-section {
          background: rgba(30, 41, 59, 0.8);
          padding: 60px;
          border-radius: 30px;
          text-align: center;
          max-width: 800px;
          border: 1px solid rgba(59, 130, 246, 0.3);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(25px);
        }
        
        .demo-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: linear-gradient(90deg, #3b82f6, #06b6d4, #8b5cf6);
        }
        
        .demo-btn {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          border: none;
          color: white;
          padding: 18px 45px;
          border-radius: 50px;
          font-size: 1.2rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.4s ease;
          margin: 15px;
          text-decoration: none;
          display: inline-block;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }
        
        .demo-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.6s ease;
        }
        
        .demo-btn:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.4);
        }
        
        .demo-btn:hover::before {
          left: 100%;
        }
        
        .contact-info {
          margin-top: 40px;
          padding: 30px;
          background: rgba(15, 23, 42, 0.6);
          border-radius: 20px;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        
        .contact-info h4 {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 20px;
          color: #e2e8f0;
        }
        
        .contact-info p {
          margin: 12px 0;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .quote-section {
          margin-top: 40px;
          padding-top: 40px;
          border-top: 1px solid rgba(59, 130, 246, 0.3);
        }
        
        .quote-section p {
          font-style: italic;
          opacity: 0.9;
          font-size: 1.3rem;
          font-weight: 500;
          color: #cbd5e1;
        }
        
        .icon {
          display: inline-block;
          margin-right: 12px;
          font-size: 1.2em;
          vertical-align: middle;
        }
        
        .slide-counter {
          position: fixed;
          top: 30px;
          right: 30px;
          background: rgba(30, 41, 59, 0.9);
          padding: 15px 25px;
          border-radius: 30px;
          backdrop-filter: blur(25px);
          border: 1px solid rgba(59, 130, 246, 0.4);
          font-weight: 600;
          font-size: 1rem;
          z-index: 100;
        }
        
        .navigation {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 20px;
          z-index: 100;
        }
        
        .nav-btn {
          background: rgba(30, 41, 59, 0.9);
          border: 1px solid rgba(59, 130, 246, 0.4);
          color: #f8fafc;
          padding: 15px 30px;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.4s ease;
          backdrop-filter: blur(25px);
          font-weight: 600;
          font-size: 1rem;
        }
        
        .nav-btn:hover {
          background: rgba(59, 130, 246, 0.3);
          border-color: rgba(59, 130, 246, 0.8);
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(59, 130, 246, 0.25);
        }
        
        @media (max-width: 768px) {
          .slide-title { font-size: 2.8rem; }
          .slide-subtitle { font-size: 1.3rem; }
          .problem-grid { grid-template-columns: 1fr; }
          .tech-stack { grid-template-columns: 1fr; }
          .solution-features-3 { grid-template-columns: 1fr; }
          .timeline-item-enhanced { 
            flex-direction: column !important; 
            text-align: center; 
            gap: 20px;
          }
          .timeline-item-enhanced .timeline-number { margin: 0; }
          .timeline-image { width: 100%; max-width: 300px; }
          .logo { width: 100px; height: 100px; font-size: 2rem; }
          .navigation { gap: 15px; }
          .nav-btn { padding: 12px 20px; font-size: 0.9rem; }
          .demo-section { padding: 40px 30px; }
          .stat-number { font-size: 3rem; }
        }
        
        @media (max-width: 480px) {
          .slide-content { padding: 20px; }
          .slide-title { font-size: 2.2rem; }
          .slide-subtitle { font-size: 1.1rem; }
          .demo-btn { padding: 15px 25px; font-size: 1rem; margin: 8px; }
          .problem-card, .feature-item { padding: 25px; }
          .tech-item { padding: 15px; }
          .contact-info p { font-size: 1rem; }
        }
      `}</style>

      <div className="particles" id="particles"></div>
      
      <div className="slide-counter">
        <span>{currentSlide + 1}</span> / <span>{totalSlides}</span>
      </div>

      <div className="slide">
        {slides[currentSlide]}
      </div>

      <div className="navigation">
        <button className="nav-btn" onClick={previousSlide}>← Previous</button>
        <button className="nav-btn" onClick={nextSlide}>Next →</button>
      </div>
    </>
  );
}