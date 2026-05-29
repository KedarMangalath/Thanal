import { X, Bath, Fuel, Image as ImageIcon, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { LatLng } from "@thanal/shared";

type ReportType = "public" | "fuel_station";

type Props = {
  location: LatLng;
  onClose: () => void;
  onSubmit: () => void;
};

export default function ReportModal({ location, onClose, onSubmit }: Props) {
  const [reportType, setReportType] = useState<ReportType>("public");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState("Resolving location address...");

  useEffect(() => {
    let isMounted = true;
    // Reverse geocode via OpenStreetMap Nominatim
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setAddress(data.display_name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAddress(`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [location]);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await fetch(`http://localhost:4010/api/washrooms/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          type: reportType,
          description: description.trim() || null
        })
      });
      onSubmit();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="report-modal-wrapper" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', zIndex: 9999,
      pointerEvents: 'none' // Allow clicking through the empty space
    }}>
      <div className="glass-card report-modal-content" onClick={e => e.stopPropagation()} style={{ 
        width: '100%', 
        maxWidth: '500px', 
        margin: '0 auto',
        position: 'relative', 
        padding: '24px',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
        pointerEvents: 'auto',
        animation: 'slideUp 0.3s ease-out',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'var(--bg)', border: '1px solid var(--border)', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer', zIndex: 10 }}>
          <X size={18} />
        </button>

        <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700 }}>Community Contribution</h3>

        {/* Location resolved card */}
        <div style={{ 
          background: 'var(--surface-hover)', 
          padding: '12px 16px', 
          borderRadius: '12px', 
          border: '1px solid var(--border)',
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <div style={{ color: 'var(--accent)', flexShrink: 0 }}><MapPin size={24} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={address}>{address}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
            </span>
          </div>
        </div>

        {/* Washroom Type Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Washroom Type</span>
          {[
            {
              type: "public",
              label: "Public Washroom",
              icon: <Bath size={20} style={{ color: "var(--primary)" }} />,
              color: "var(--primary)",
              desc: "Mark standard public toilets or rest facilities."
            },
            {
              type: "fuel_station",
              label: "Petrol Pump Washroom",
              icon: <Fuel size={20} style={{ color: "var(--accent)" }} />,
              color: "var(--accent)",
              desc: "Locate washrooms available at fuel stations."
            }
          ].map((opt) => {
            const isSelected = reportType === opt.type;
            return (
              <label 
                key={opt.type}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)', 
                  background: isSelected ? 'var(--accent-soft)' : 'var(--surface-hover)', 
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isSelected ? 'scale(1.01)' : 'none',
                  boxShadow: isSelected ? '0 4px 12px rgba(var(--accent-rgb), 0.15)' : 'none'
                }}
              >
                <input 
                  type="radio" 
                  name="reportType" 
                  checked={isSelected} 
                  onChange={() => setReportType(opt.type as ReportType)} 
                  style={{ display: 'none' }} 
                />
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelected ? 'var(--accent-soft)' : 'var(--surface)',
                  color: opt.color,
                  border: '1px solid var(--border)',
                  flexShrink: 0
                }}>
                  {opt.icon}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>{opt.label}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{opt.desc}</span>
                </div>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: isSelected ? '6px solid var(--accent)' : '2px solid var(--border)',
                  background: '#fff',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }} />
              </label>
            );
          })}
        </div>

        {/* Review & Details Typing box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Review & Details</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cleanliness, accessibility, water availability, disabled access details..."
            maxLength={500}
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface-hover)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s',
              lineHeight: 1.4,
              resize: 'vertical'
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.background = 'var(--surface)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface-hover)'; }}
          />
        </div>

        {/* Image Upload box */}
        <div style={{
          border: '2px dashed var(--border)', borderRadius: 12, padding: 20, marginBottom: 24,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)', gap: 6, background: 'rgba(0,0,0,0.05)',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
        >
          <ImageIcon size={28} style={{ color: 'var(--text-muted)', opacity: 0.7 }} />
          <span style={{ fontWeight: 600, fontSize: '13px' }}>Upload Image</span>
          <span style={{ fontSize: 11, opacity: 0.6 }}>(Coming Soon)</span>
        </div>

        <button 
          className="primary-btn" 
          style={{ width: '100%', padding: '12px', fontSize: '15px', borderRadius: '12px', fontWeight: 600 }} 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Contribution"}
        </button>
      </div>
    </div>,
    document.body
  );
}
