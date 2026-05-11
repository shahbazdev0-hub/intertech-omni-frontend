import React, { useState, useEffect, useRef } from 'react';

const TICKER_API = 'http://localhost:5000/api/event-tickers/active';

export default function EventTickerBar() {
  const [messages, setMessages] = useState([]);
  const contentRef = useRef(null);
  const containerRef = useRef(null);
  const [duration, setDuration] = useState(25);

  useEffect(() => {
    const fetchTickers = async () => {
      try {
        const res = await fetch(TICKER_API, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setMessages(data.filter(t => t.isActive).map(t => t.message));
        }
      } catch (err) {
        // silently fail
      }
    };
    fetchTickers();
    const interval = setInterval(fetchTickers, 60000);
    return () => clearInterval(interval);
  }, []);

  // Dynamically compute speed based on content width
  useEffect(() => {
    if (contentRef.current) {
      const contentW = contentRef.current.scrollWidth;
      const speed = Math.max(15, contentW / 60);
      setDuration(speed);
    }
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes premiumTickerScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .premium-ticker-wrapper {
          width: 100%;
          overflow: hidden;
          position: relative;
          z-index: 50;
          background: linear-gradient(135deg, #0a2e38 0%, #0C3D4A 30%, #145369 70%, #0C3D4A 100%);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        }
        .premium-ticker-inner {
          display: flex;
          align-items: center;
          height: 40px;
          position: relative;
        }
        .premium-ticker-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 18px 0 14px;
          height: 100%;
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          position: relative;
          z-index: 2;
          flex-shrink: 0;
          box-shadow: 4px 0 12px rgba(0,0,0,0.25);
          font-family: 'Segoe UI', Arial, sans-serif;
        }
        .premium-ticker-badge::after {
          content: '';
          position: absolute;
          right: -12px;
          top: 0;
          bottom: 0;
          width: 12px;
          background: linear-gradient(90deg, #b91c1c 0%, transparent 100%);
        }
        .ticker-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #fff;
          animation: tickerPulse 1.5s ease-in-out infinite;
          box-shadow: 0 0 6px rgba(255,255,255,0.6);
        }
        @keyframes tickerPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        .premium-ticker-track {
          flex: 1;
          overflow: hidden;
          position: relative;
          mask-image: linear-gradient(90deg, transparent 0%, #000 3%, #000 97%, transparent 100%);
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 3%, #000 97%, transparent 100%);
        }
        .premium-ticker-content {
          display: inline-block;
          white-space: nowrap;
          will-change: transform;
          animation: premiumTickerScroll ${duration}s linear infinite;
        }
        .premium-ticker-wrapper:hover .premium-ticker-content {
          animation-play-state: paused;
        }
        .ticker-msg {
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.3px;
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
        }
        .ticker-divider {
          display: inline-block;
          margin: 0 40px;
        }
      `}</style>
      <div className="premium-ticker-wrapper" ref={containerRef}>
        <div className="premium-ticker-inner">
          <div className="premium-ticker-badge">
            <span className="ticker-pulse-dot" />
            LIVE
          </div>
          <div className="premium-ticker-track">
            <div className="premium-ticker-content" ref={contentRef}>
              {/* Render twice for seamless loop */}
              {[0, 1].map(loop => (
                <React.Fragment key={loop}>
                  {messages.map((msg, i) => (
                    <React.Fragment key={`${loop}-${i}`}>
                      <span className="ticker-msg">{msg}</span>
                      <span className="ticker-divider" />
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
