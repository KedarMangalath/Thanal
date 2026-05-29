import { X } from "lucide-react";

interface CookiePromptProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function CookiePrompt({ onAccept, onDecline }: CookiePromptProps) {
  return (
    <div className="cookie-banner glass-card">
      <div className="cookie-content">
        <h4>We value your privacy</h4>
        <p>
          Thanal uses minimal local storage to remember your theme, language, and saved commutes. 
          We do not track your location or use third-party tracking cookies.
        </p>
      </div>
      <div className="cookie-actions">
        <button className="secondary-btn" onClick={onDecline}>Decline</button>
        <button className="primary-btn" onClick={onAccept}>Got it</button>
      </div>
      <button className="cookie-close" onClick={onDecline} aria-label="Close">
        <X size={16} />
      </button>
    </div>
  );
}
