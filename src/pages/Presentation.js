import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 10;

  const showSlide = (n) => {
    setCurrentSlide((n + totalSlides) % totalSlides);
  };

  const nextSlide = () => showSlide(currentSlide + 1);
  const previousSlide = () => showSlide(currentSlide - 1);

  useEffect(() => {
    // Remove any existing app styles by targeting body
    document.body.style.cssText = `
      margin: 0;
      padding: 0;
      font-family: 'Inter', sans-serif;
      background: radial-gradient(circle at 20% 80%, #1e293b 0%, #0f172a 50%), 
                  radial-gradient(circle at 80% 20%, #374151 0%, #111827 50%),
                  linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #f8fafc;
      overflow-x: hidden;
      min-height: 100vh;
    `;

    // Hide the app header if it exists
    const header = document.querySelector('header');
    const nav = document.querySelector('nav');
    if (header) header.style.display = 'none';
    if (nav) nav.style.display = 'none';

    // Keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        previousSlide();
      }
    };

    // Create particles
    const createParticles = () => {
      const particlesContainer = document.getElementById('particles');
      if (!particlesContainer) return;
      
      particlesContainer.innerHTML = ''; // Clear existing particles
      const particleCount = 60;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
          position: absolute;
          width: 3px;
          height: 3px;
          background: linear-gradient(45deg, #60a5fa, #34d399, #f59e0b);
          border-radius: 50%;
          opacity: 0.7;
          animation: float 12s infinite ease-in-out;
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          animation-delay: ${Math.random() * 12}s;
          animation-duration: ${Math.random() * 8 + 8}s;
        `;
        
        if (i % 2 === 0) {
          particle.style.background = 'linear-gradient(45deg, #8b5cf6, #06b6d4, #ef4444)';
          particle.style.animationDuration = '15s';
        }
        
        particlesContainer.appendChild(particle);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    createParticles();

    // Cleanup on component unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore body styles when leaving
      document.body.style.cssText = '';
      const header = document.querySelector('header');
      const nav = document.querySelector('nav');
      if (header) header.style.display = '';
      if (nav) nav.style.display = '';
    };
  }, [currentSlide]);

  const slides = [
    // Slide 1: Title
    <div key={0} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', textAlign: 'center' }}>
      <div style={{ marginBottom: '40px' }}>
        <div style={{
          width: '140px',
          height: '140px',
          background: 'linear-gradient(135deg, #3b82f6, #06b6d4, #8b5cf6)',
          borderRadius: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '3rem',
          fontWeight: 'bold',
          margin: '0 auto',
          border: '2px solid rgba(255, 255, 255, 0.1)',
        }}>
          🚁
        </div>
      </div>
      <h1 style={{
        fontSize: '4rem',
        fontWeight: '900',
        marginBottom: '20px',
        background: 'linear-gradient(135deg, #3b82f6, #06b6d4, #8b5cf6, #ec4899)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.03em',
      }}>
        AeroAid
      </h1>
      <p style={{ fontSize: '1.6rem', opacity: 0.9, maxWidth: '900px', lineHeight: 1.7, marginBottom: '40px' }}>
        Revolutionizing Emergency Response with <span style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(6, 182, 212, 0.4))',
          padding: '6px 16px',
          borderRadius: '12px',
          fontWeight: '700',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        }}>🚁 Crowdsourced Drone Technology</span>
      </p>
      <p style={{ fontSize: '1.4rem', opacity: 0.9, fontWeight: 500, marginBottom: '20px' }}>
        ⚡ When every second counts, we mobilize the sky
      </p>
      <p style={{ fontSize: '1.1rem', opacity: 0.7 }}>
        🌐 Live at <strong>aeroaid.me</strong>
      </p>
    </div>,

    // Add other slides here with similar inline styling...
    // For brevity, I'll add a few key slides

    // Slide 2: The Problem
    <div key={1} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{
          fontSize: '4rem',
          fontWeight: '900',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #3b82f6, #06b6d4, #8b5cf6, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          ⚠️ The Critical Problem
        </h1>
        <p style={{ fontSize: '1.6rem', opacity: 0.9, maxWidth: '900px', lineHeight: 1.7 }}>
          Traditional emergency response faces <span style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(6, 182, 212, 0.4))',
            padding: '6px 16px',
            borderRadius: '12px',
            fontWeight: '700',
          }}>⏰ life-threatening delays</span>
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '35px', maxWidth: '1400px', width: '100%' }}>
        {[
          { num: 1, icon: '⏱️', title: 'Response Time Gaps', desc: 'Every minute in an emergency can mean the difference between life and death. Traditional response can take 15-30 minutes in urban areas, even longer in remote locations.' },
          { num: 2, icon: '👁️', title: 'Limited Aerial Coverage', desc: 'Emergency services have limited aerial surveillance capabilities, making search operations slow and resource-intensive.' },
          { num: 3, icon: '🚁', title: 'Untapped Drone Resources', desc: 'Thousands of drone operators and their equipment sit unused while emergencies unfold in their neighborhoods.' },
          { num: 4, icon: '📡', title: 'Communication Barriers', desc: 'No effective system exists to coordinate civilian drone operators with emergency responders and those in need.' }
        ].map(item => (
          <div key={item.num} style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(25px)',
            borderRadius: '24px',
            padding: '35px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            transition: 'all 0.5s ease',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              width: '60px',
              height: '60px',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              marginBottom: '25px',
              fontSize: '1.4rem',
            }}>
              {item.num}
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '15px', color: '#e2e8f0' }}>
              {item.icon} {item.title}
            </h3>
            <p style={{ fontSize: '1rem', lineHeight: 1.6, opacity: 0.9 }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>,

    // Slide 10: Call to Action
    <div key={9} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{
          fontSize: '4rem',
          fontWeight: '900',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #3b82f6, #06b6d4, #8b5cf6, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          🚀 Join the Revolution
        </h1>
        <p style={{ fontSize: '1.6rem', opacity: 0.9, maxWidth: '900px', lineHeight: 1.7 }}>
          Help us build the future of <span style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(6, 182, 212, 0.4))',
            padding: '6px 16px',
            borderRadius: '12px',
            fontWeight: '700',
          }}>🆘 emergency response</span>
        </p>
      </div>
      <div style={{
        background: 'rgba(30, 41, 59, 0.8)',
        padding: '60px',
        borderRadius: '30px',
        textAlign: 'center',
        maxWidth: '800px',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        backdropFilter: 'blur(25px)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🌟</div>
        <h3 style={{ marginBottom: '30px', fontSize: '1.8rem' }}>Ready to save lives with technology?</h3>
        
        <div style={{ marginBottom: '40px' }}>
          <a href="https://aeroaid.me" target="_blank" rel="noopener noreferrer" style={{
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            border: 'none',
            color: 'white',
            padding: '18px 45px',
            borderRadius: '50px',
            fontSize: '1.2rem',
            fontWeight: '700',
            margin: '15px',
            textDecoration: 'none',
            display: 'inline-block',
            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
          }}>
            🚀 Live Demo
          </a>
          <a href="https://github.com/TaamirH/AeroAid" target="_blank" rel="noopener noreferrer" style={{
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            border: 'none',
            color: 'white',
            padding: '18px 45px',
            borderRadius: '50px',
            fontSize: '1.2rem',
            fontWeight: '700',
            margin: '15px',
            textDecoration: 'none',
            display: 'inline-block',
            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
          }}>
            💻 View Code
          </a>
        </div>
        
        <div style={{
          marginTop: '40px',
          padding: '30px',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '20px',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        }}>
          <h4 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '20px', color: '#e2e8f0' }}>
            📞 Contact Information
          </h4>
          <p style={{ margin: '12px 0', fontSize: '1.1rem' }}>📧 Email: taamirhd@gmail.com</p>
          <p style={{ margin: '12px 0', fontSize: '1.1rem' }}>🌐 Platform: aeroaid.me</p>
          <p style={{ margin: '12px 0', fontSize: '1.1rem' }}>💼 GitHub: github.com/TaamirH/AeroAid</p>
        </div>
        
        <div style={{
          marginTop: '40px',
          paddingTop: '40px',
          borderTop: '1px solid rgba(59, 130, 246, 0.3)',
        }}>
          <p style={{
            fontStyle: 'italic',
            opacity: 0.9,
            fontSize: '1.3rem',
            fontWeight: 500,
            color: '#cbd5e1',
          }}>
            "When emergencies strike, every second counts. AeroAid turns the sky into a lifeline." 🌤️✨
          </p>
        </div>
      </div>
    </div>
  ];

  return (
    <>
      <Head>
        <title>AeroAid - Emergency Drone Response Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <style>{`
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
        `}</style>
      </Head>

      <div id="particles" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}></div>
      
      <div style={{
        position: 'fixed',
        top: '30px',
        right: '30px',
        background: 'rgba(30, 41, 59, 0.9)',
        padding: '15px 25px',
        borderRadius: '30px',
        backdropFilter: 'blur(25px)',
        border: '1px solid rgba(59, 130, 246, 0.4)',
        fontWeight: 600,
        fontSize: '1rem',
        zIndex: 100,
      }}>
        {currentSlide + 1} / {totalSlides}
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {slides[currentSlide]}
      </div>

      <div style={{
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '20px',
        zIndex: 100,
      }}>
        <button onClick={previousSlide} style={{
          background: 'rgba(30, 41, 59, 0.9)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          color: '#f8fafc',
          padding: '15px 30px',
          borderRadius: '50px',
          cursor: 'pointer',
          backdropFilter: 'blur(25px)',
          fontWeight: 600,
          fontSize: '1rem',
        }}>
          ← Previous
        </button>
        <button onClick={nextSlide} style={{
          background: 'rgba(30, 41, 59, 0.9)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          color: '#f8fafc',
          padding: '15px 30px',
          borderRadius: '50px',
          cursor: 'pointer',
          backdropFilter: 'blur(25px)',
          fontWeight: 600,
          fontSize: '1rem',
        }}>
          Next →
        </button>
      </div>
    </>
  );
}