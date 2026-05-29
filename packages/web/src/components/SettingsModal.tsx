import { Info, Map, MessageSquare, Settings, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { SavedRoute } from "../services/api";

export type Language = "english" | "manglish" | "malayalam";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  cookieConsent: boolean;
  onCookieConsentChange: (consent: boolean) => void;
  savedRoutes: SavedRoute[];
  onLoadRoute: (route: SavedRoute) => void;
  onDeleteRoute: (id: number) => void;
  features: { cameras: boolean; rain: boolean; sun: boolean; washrooms: boolean; };
  onToggleFeature: (key: "cameras" | "rain" | "sun" | "washrooms") => void;
  initialTab?: "preferences" | "saved" | "about" | "feedback";
}

export default function SettingsModal({
  isOpen,
  onClose,
  language,
  onLanguageChange,
  cookieConsent,
  onCookieConsentChange,
  savedRoutes,
  onLoadRoute,
  onDeleteRoute,
  features,
  onToggleFeature,
  initialTab = "preferences"
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"preferences" | "saved" | "about" | "feedback">(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: "18px", margin: 0, fontWeight: 600 }}>Settings</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-tabs" id="tutorial-settings-tabs">
          <button 
            className={`modal-tab ${activeTab === "preferences" ? "active" : ""}`}
            onClick={() => setActiveTab("preferences")}
          >
            <Settings size={14} /> Preferences
          </button>
          <button 
            className={`modal-tab ${activeTab === "saved" ? "active" : ""}`}
            onClick={() => setActiveTab("saved")}
          >
            <Map size={14} /> Saved Routes
          </button>
          <button 
            className={`modal-tab ${activeTab === "feedback" ? "active" : ""}`}
            onClick={() => setActiveTab("feedback")}
          >
            <MessageSquare size={14} /> Feedback
          </button>
          <button 
            className={`modal-tab ${activeTab === "about" ? "active" : ""}`}
            onClick={() => setActiveTab("about")}
          >
            <Info size={14} /> About
          </button>
        </div>

        <div className="modal-body">
          {activeTab === "preferences" && (
            <div className="modal-section">
              <div className="setting-row">
                <div>
                  <div className="setting-title">Language</div>
                  <div className="setting-desc">Choose your preferred language for insights.</div>
                </div>
                <select 
                  className="settings-select"
                  value={language} 
                  onChange={(e) => onLanguageChange(e.target.value as Language)}
                >
                  <option value="english">English</option>
                  <option value="manglish">Manglish</option>
                  <option value="malayalam">മലയാളം</option>
                </select>
              </div>

              <div className="settings-section" id="tutorial-feature-toggles">
                <h3 className="settings-subtitle">Map Features</h3>
                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-label">AI Speed Cameras</span>
                    <span className="setting-desc">Show community-verified speed cameras on the map</span>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={features.cameras}
                      onChange={() => onToggleFeature("cameras")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-label">Community Washrooms</span>
                    <span className="setting-desc">Show community-verified clean washrooms</span>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={features.washrooms}
                      onChange={() => onToggleFeature("washrooms")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-label">Rain Window Widget</span>
                    <span className="setting-desc">Show dynamic rain probability chart</span>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={features.rain}
                      onChange={() => onToggleFeature("rain")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-label">Sun & Shade Timeline</span>
                    <span className="setting-desc">Show the sun exposure timeline</span>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={features.sun}
                      onChange={() => onToggleFeature("sun")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div className="setting-row">
                <div>
                  <div className="setting-title">Cookie Preferences</div>
                  <div className="setting-desc">Allow us to save your language, theme, and routes locally.</div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={cookieConsent} 
                    onChange={(e) => onCookieConsentChange(e.target.checked)} 
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          )}

          {activeTab === "saved" && (
            <div className="modal-section">
              {savedRoutes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
                  <Map size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                  <p>No saved commutes yet.</p>
                </div>
              ) : (
                <div className="saved-routes-list">
                  {savedRoutes.map((route) => (
                    <div key={route.id} className="saved-route-item">
                      <div className="saved-route-info" onClick={() => { onLoadRoute(route); onClose(); }}>
                        <div className="saved-route-name">{route.name}</div>
                        <div className="saved-route-details">
                          {route.mode.charAt(0).toUpperCase() + route.mode.slice(1)} mode
                        </div>
                      </div>
                      <button 
                        className="delete-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRoute(route.id);
                        }}
                        title="Delete commute"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "about" && (
            <div className="modal-section about-section">
              <h3>How Thanal Works</h3>
              <p>
                Thanal (meaning "shade" in Malayalam) uses high-precision astronomical algorithms combined with local routing APIs to calculate the exact sun position relative to your vehicle's heading along every segment of your journey.
              </p>
              <p>
                Whether you're taking a bus down the coastal highway or a train across the hills, Thanal tells you precisely which side of the vehicle will stay in the shade, ensuring a cooler, more comfortable ride.
              </p>

              <div style={{ marginTop: 'var(--space-xl)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <a 
                  href="#admin" 
                  onClick={() => onClose()}
                  style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}
                >
                  Admin Dashboard
                </a>
              </div>
            </div>
          )}

          {activeTab === "feedback" && (
            <div className="modal-section">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>App Feedback & Bug Reports</h3>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Found a bug, have an idea for a feature, or want to suggest improvements for our station data? We read all feedback!
              </p>
              
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const formData = new FormData(form);
                  try {
                    const res = await fetch("http://localhost:4010/api/community/feedback", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        type: formData.get("type"),
                        message: formData.get("message"),
                        email: formData.get("email")
                      })
                    });
                    if (res.ok) {
                      alert("Thank you for your feedback!");
                      form.reset();
                    } else {
                      alert("Failed to send feedback.");
                    }
                  } catch {
                    alert("Network error.");
                  }
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Feedback Type</label>
                  <select 
                    name="type" 
                    className="settings-select" 
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)' }}
                  >
                    <option value="bug">🐞 Report a Bug</option>
                    <option value="feature">🚀 Request a Feature</option>
                    <option value="other">💬 Other / General Feedback</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Message</label>
                  <textarea 
                    name="message" 
                    placeholder="Describe the bug or feature request in detail..." 
                    required 
                    minLength={2}
                    style={{ 
                      width: '100%', minHeight: '120px', padding: '12px 14px', 
                      borderRadius: '8px', border: '1px solid var(--border)',
                      background: 'var(--surface)', color: 'var(--text-primary)',
                      fontFamily: 'inherit', fontSize: '14px', outline: 'none',
                      transition: 'border-color 0.2s',
                      lineHeight: 1.4
                    }} 
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Email Address (optional)</label>
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="yourname@example.com" 
                    style={{ 
                      width: '100%', padding: '10px 14px', 
                      borderRadius: '8px', border: '1px solid var(--border)',
                      background: 'var(--surface)', color: 'var(--text-primary)',
                      fontFamily: 'inherit', fontSize: '14px', outline: 'none',
                      transition: 'border-color 0.2s'
                    }} 
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>

                <button 
                  type="submit" 
                  className="primary-btn" 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: 600, fontSize: '15px', marginTop: '6px' }}
                >
                  Submit Feedback
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
