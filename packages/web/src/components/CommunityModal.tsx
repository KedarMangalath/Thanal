import type { Washroom } from "@thanal/shared";
import { X, ThumbsUp, ThumbsDown, Image as ImageIcon, Bath, Fuel } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  washroom: Washroom;
  onClose: () => void;
  onVote: (id: number, vote: "up" | "down") => void;
};

export default function CommunityModal({ washroom, onClose, onVote }: Props) {
  const [voting, setVoting] = useState(false);

  async function handleVote(vote: "up" | "down") {
    if (voting) return;
    setVoting(true);
    try {
      await fetch(`http://localhost:4010/api/washrooms/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: washroom.id, vote })
      });
      onVote(washroom.id, vote);
    } finally {
      setVoting(false);
    }
  }

  const isGood = washroom.status === "good";
  const isBad = washroom.status === "bad";

  const totalVotes = washroom.upvotes + washroom.downvotes;
  const accuracy = totalVotes > 0 ? Math.round((washroom.upvotes / totalVotes) * 100) : 0;
  
  let accuracyColor = "var(--text-secondary)";
  if (totalVotes > 0) {
    if (accuracy >= 70) accuracyColor = "#22c55e"; // Green
    else if (accuracy >= 40) accuracyColor = "#eab308"; // Yellow
    else accuracyColor = "#ef4444"; // Red
  }

  return createPortal(
    <div className="report-modal-wrapper" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', zIndex: 9999,
      pointerEvents: 'none'
    }}>
      <div className="glass-card report-modal-content" onClick={e => e.stopPropagation()} style={{ 
        width: '100%', maxWidth: '500px', margin: '0 auto', position: 'relative', padding: '24px',
        borderBottomLeftRadius: 0, borderBottomRightRadius: 0, boxShadow: '0 -4px 24px rgba(0,0,0,0.1)',
        pointerEvents: 'auto', animation: 'slideUp 0.3s ease-out' 
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'var(--bg)', border: '1px solid var(--border)', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isGood ? 'rgba(34, 197, 94, 0.1)' : isBad ? 'rgba(239, 68, 68, 0.1)' : 'rgba(156, 163, 175, 0.1)',
            color: isGood ? '#22c55e' : isBad ? '#ef4444' : '#9ca3af'
          }}>
            {washroom.type === 'fuel_station' ? <Fuel size={24} /> : <Bath size={24} />}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
              {washroom.type === 'fuel_station' ? 'Petrol Pump Washroom' : 'Public Washroom'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: isGood ? '#22c55e' : isBad ? '#ef4444' : '#9ca3af', color: '#fff', textTransform: 'capitalize' }}>
                {washroom.status}
              </span>
              {totalVotes > 0 && (
                <span style={{ fontSize: 13, color: accuracyColor, fontWeight: 500 }}>
                  {accuracy}% Accuracy
                </span>
              )}
            </div>
          </div>
        </div>

        {washroom.description && (
          <div style={{
            background: 'var(--surface-hover)', 
            padding: '12px 16px', 
            borderRadius: '12px',
            border: '1px solid var(--border)', 
            marginBottom: '16px', 
            fontSize: '13px',
            lineHeight: 1.4, 
            color: 'var(--text-secondary)'
          }}>
            <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '4px' }}>Community Note:</strong>
            "{washroom.description}"
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => handleVote('up')}
            disabled={voting}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '8px', borderRadius: 8, background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22c55e', cursor: 'pointer'
            }}
          >
            <ThumbsUp size={16} /> {washroom.upvotes} Clean
          </button>
          <button
            onClick={() => handleVote('down')}
            disabled={voting}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '8px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', cursor: 'pointer'
            }}
          >
            <ThumbsDown size={16} /> {washroom.downvotes} Dirty
          </button>
        </div>

        <div style={{
          border: '2px dashed var(--border)', borderRadius: 12, padding: 32,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)', gap: 8, background: 'rgba(0,0,0,0.2)'
        }}>
          <ImageIcon size={32} opacity={0.5} />
          <span style={{ fontWeight: 500 }}>Image Uploads</span>
          <span style={{ fontSize: 12, opacity: 0.7 }}>(Coming Soon)</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
