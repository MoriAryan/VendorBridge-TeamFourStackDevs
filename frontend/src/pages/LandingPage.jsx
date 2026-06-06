import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Mascot from '../components/Mascot.jsx';
import './LandingPage.css';

const SCENES = [
  { 
    id: 1, title: "The Mess", 
    desc: "Procurement is chaotic. Lost emails, scattered PDFs, and disconnected spreadsheets lead to endless confusion across your entire team.",
    renderVisual: () => (
      <>
        <div className="mascot-interactive pos-mess"><Mascot scene={1} /></div>
        <div className="neu-snippet doc-xls"><span>Q3_Budget.xls</span></div>
        <div className="neu-snippet doc-pdf"><span>VendorQuote.pdf</span></div>
        <div className="neu-snippet doc-email"><span>FWD: Re: Pricing?</span></div>
      </>
    )
  },
  { 
    id: 2, title: "The Need", 
    desc: "It always starts with a requirement. A clean, structured material request is born in the system, automatically linking to the relevant department.",
    renderVisual: () => (
      <>
        <div className="mascot-interactive pos-need"><Mascot scene={2} /></div>
        <div className="neu-snippet card-need">
          <div className="card-header">New Material Request</div>
          <div className="card-body">100x Office Laptops<br/><small>Required by: IT Department</small></div>
        </div>
      </>
    )
  },
  { 
    id: 3, title: "The RFQ", 
    desc: "Stop manually emailing vendors. Automatically distribute a structured Request For Quotation to your entire vendor network with a single click.",
    renderVisual: () => (
      <div className="rfq-container">
        <div className="mascot-interactive pos-rfq"><Mascot scene={2} /></div>
        <div className="neu-snippet card-rfq-source">RFQ #1042</div>
        <div className="rfq-lines"></div>
        <div className="rfq-targets">
          <div className="neu-snippet rfq-target">Vendor A</div>
          <div className="neu-snippet rfq-target">Vendor B</div>
          <div className="neu-snippet rfq-target">Vendor C</div>
        </div>
      </div>
    )
  },
  { 
    id: 4, title: "The Quotes", 
    desc: "Vendors respond directly through a secure portal. Prices, taxes, and delivery timelines are captured cleanly without any manual data entry.",
    renderVisual: () => (
      <>
        <div className="mascot-interactive pos-quotes"><Mascot scene={2} /></div>
        <div className="neu-snippet quote-card q1"><strong>Vendor A</strong><br/>$120k<br/><small>14 Days</small></div>
        <div className="neu-snippet quote-card q2"><strong>Vendor B</strong><br/>$115k<br/><small>10 Days</small></div>
        <div className="neu-snippet quote-card q3"><strong>Vendor C</strong><br/>$140k<br/><small>21 Days</small></div>
      </>
    )
  },
  { 
    id: 5, title: "The Comparison", 
    desc: "The ERP stacks quotations side-by-side in a dynamic comparison matrix. The most cost-effective option is instantly highlighted for your review.",
    renderVisual: () => (
      <>
        <div className="mascot-interactive pos-compare"><Mascot scene={10} /></div>
        <div className="neu-snippet compare-table">
          <div className="tbl-row"><span>Vendor A</span><span>$120,000</span></div>
          <div className="tbl-row tbl-winner"><span>Vendor B</span><span>$115,000</span><span>★</span></div>
          <div className="tbl-row"><span>Vendor C</span><span>$140,000</span></div>
        </div>
      </>
    )
  },
  { 
    id: 6, title: "The Approval", 
    desc: "Managers receive an instant notification in their Kanban board. One click drops the digital approval stamp. No nagging or follow-ups required.",
    renderVisual: () => (
      <>
        <div className="mascot-interactive pos-approval"><Mascot scene={6} /></div>
        <div className="neu-snippet approval-card">
          <div className="approval-header">Pending Final Review</div>
          <div className="approval-stamp">APPROVED</div>
        </div>
      </>
    )
  },
  { 
    id: 7, title: "The Purchase Order", 
    desc: "A formal, legally compliant Purchase Order is auto-generated the exact second the approval clears, utilizing predefined templates.",
    renderVisual: () => (
      <>
        <div className="mascot-interactive pos-po"><Mascot scene={7} /></div>
        <div className="neu-snippet formal-doc po-doc">
          <div className="doc-head">PURCHASE ORDER</div>
          <div className="doc-line"></div>
          <div className="doc-line"></div>
          <div className="doc-total">Total: $115,000</div>
        </div>
      </>
    )
  },
  { 
    id: 8, title: "The Invoice", 
    desc: "The PO seamlessly morphs into an Invoice, intelligently calculating CGST, SGST, and final payable totals without any manual errors.",
    renderVisual: () => (
      <>
        <div className="mascot-interactive pos-invoice"><Mascot scene={7} /></div>
        <div className="neu-snippet formal-doc inv-doc">
          <div className="doc-head">INVOICE</div>
          <div className="doc-line"></div>
          <div className="doc-tax">Tax: 18%</div>
          <div className="doc-total">Total: $135,700</div>
        </div>
      </>
    )
  },
  { 
    id: 9, title: "The Dispatch", 
    desc: "Approved documents are automatically encrypted and emailed to the vendor. Your workflow is complete. You literally just sit there and chill.",
    renderVisual: () => (
      <>
        <div className="mascot-interactive pos-sent"><Mascot scene={10} /></div>
        <div className="neu-snippet env-doc">
          <div className="env-flap"></div>
        </div>
      </>
    )
  },
  { 
    id: 10, title: "The Hub", 
    desc: "Everything is connected. Your dashboard becomes a powerful single source of truth for the entire procurement lifecycle.",
    renderVisual: () => (
      <>
        <div className="mascot-interactive pos-done"><Mascot scene={10} /></div>
        <div className="neu-snippet dashboard-mock">
          <div className="dash-sidebar"></div>
          <div className="dash-main">
            <div className="dash-card"></div>
            <div className="dash-card"></div>
            <div className="dash-card"></div>
          </div>
        </div>
      </>
    )
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeScene, setActiveScene] = useState(0); // 0 means Hero
  const observer = useRef(null);

  useEffect(() => {
    // We observe the invisible anchors to know which scene is currently being scrolled through
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5
    };

    observer.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sceneId = parseInt(entry.target.getAttribute('data-scene'));
          if (!isNaN(sceneId)) setActiveScene(sceneId);
        }
      });
    }, options);

    document.querySelectorAll('.scroll-anchor').forEach(scene => {
      observer.current.observe(scene);
    });

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  return (
    <div className="landing-page-wrapper">
      
      {/* ── Background Blobs (Static, never scroll) ── */}
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      
      {/* ── Hero & Intro ── */}
      <header className="hero-section">
        <div className="hero-nav">
          <div className="logo">Vendor<span>Bridge</span></div>
          <div className="nav-actions">
            <button className="neu-btn-sm" onClick={() => navigate('/login')}>Login</button>
            <button className="neu-btn-sm primary" onClick={() => navigate('/register')}>Register</button>
          </div>
        </div>
        
        <div className="hero-content">
          <h1 className="hero-title">Procurement & Vendor Management ERP</h1>
          <p className="hero-subtitle">
            Digitize and centralize your procurement operations. Replace fragmented spreadsheets, endless emails, and lost PDFs with a single, structured, workflow-driven platform.
          </p>
          <div className="hero-cta-group">
            <button className="neu-btn-lg primary" onClick={() => navigate('/register')}>Get Started</button>
            <span className="scroll-indicator">Scroll to explore the journey ↓</span>
          </div>
        </div>
      </header>

      {/* ── Magical Story Journey ── */}
      <div className="story-container">
        
        {/* The Sticky Viewport: Stays locked to the screen while you scroll the anchors */}
        <div className="sticky-viewport">
          {SCENES.map((scene) => {
            const isEven = scene.id % 2 === 0;
            return (
              <div 
                key={scene.id} 
                className={`scene-view ${activeScene === scene.id ? 'active' : ''} ${isEven ? 'layout-reverse' : ''}`}
              >
                <div className="scene-content">
                  
                  {/* Clean text block (no boxes!) */}
                  <div className="scene-text-pure">
                    <h2 className="scene-title-pure">{scene.title}</h2>
                    <p className="scene-desc-pure">{scene.desc}</p>
                  </div>

                  {/* Interactive Visuals with Embedded Mascot */}
                  <div className="scene-visuals-interactive">
                    {scene.renderVisual()}
                  </div>

                </div>
              </div>
            )
          })}
        </div>

        {/* Invisible Scroll Anchors: These drive the height and scroll position */}
        <div className="timeline-anchors">
          {SCENES.map(scene => (
            <div key={scene.id} className="scroll-anchor" data-scene={scene.id}></div>
          ))}
        </div>

      </div>

      {/* ── Final CTA & Footer ── */}
      <section className="footer-cta scroll-anchor" data-scene="11">
        <h2>Your turn.</h2>
        <p>Experience the most beautifully crafted procurement ERP.</p>
        <div className="cta-buttons">
          <button className="neu-btn-lg" onClick={() => navigate('/login')}>Login</button>
          <button className="neu-btn-lg primary" onClick={() => navigate('/register')}>Register</button>
        </div>
      </section>

      <footer className="main-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>Vendor<span>Bridge</span></h3>
            <p>The centralized workflow-driven procurement platform.</p>
          </div>
          <div className="footer-links">
            <a onClick={() => navigate('/login')}>Login</a>
            <a onClick={() => navigate('/register')}>Register</a>
            <a onClick={() => navigate('/dashboard')}>Dashboard</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} VendorBridge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
