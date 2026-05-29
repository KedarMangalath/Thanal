import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

type Feedback = {
  id: number;
  type: string;
  message: string;
  email: string | null;
  created_at: string;
};

type SpeedCameraReport = {
  id: number;
  camera_id: number;
  type: string;
  notes: string | null;
  created_at: string;
  lat: number;
  lng: number;
};

export default function AdminDashboard({ onClose }: { onClose: () => void }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("admin_token"));
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"feedback" | "cameras">("feedback");

  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [cameraReports, setCameraReports] = useState<SpeedCameraReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("http://localhost:4010/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const data = await res.json();
      setToken(data.token);
      localStorage.setItem("admin_token", data.token);
    } else {
      alert("Invalid password");
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("admin_token");
  };

  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      if (activeTab === "feedback") {
        const res = await fetch("http://localhost:4010/api/community/feedback", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setFeedback(await res.json());
      } else {
        const res = await fetch("http://localhost:4010/api/community/speed-camera-reports", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setCameraReports(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, activeTab]);

  const verifyCamera = async (id: number) => {
    await fetch(`http://localhost:4010/api/community/speed-camera/${id}/verify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    alert("Camera verified!");
    fetchData();
  };

  const deleteCamera = async (id: number) => {
    await fetch(`http://localhost:4010/api/community/speed-camera/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    alert("Camera removed!");
    fetchData();
  };

  if (!token) {
    return (
      <div className="admin-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at top right, rgba(13, 148, 136, 0.1), transparent 50%), radial-gradient(circle at bottom left, rgba(13, 148, 136, 0.1), transparent 50%)', pointerEvents: 'none' }} />
        
        <form onSubmit={handleLogin} className="glass-card" style={{ width: '90%', maxWidth: '380px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.5px', marginBottom: '8px' }}>
              Thanal<span style={{ color: 'var(--accent)' }}>Admin</span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Sign in to manage community reports</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Administrator Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="search-input" 
              placeholder="••••••••" 
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '12px', outline: 'none' }}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <button type="submit" className="primary-btn" style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 600 }}>
              Sign In
            </button>
            <button type="button" onClick={onClose} className="secondary-btn" style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'transparent', border: 'none' }}>
              Return to App
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg)', zIndex: 9999, overflow: 'auto', padding: 'var(--space-xl)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h1 style={{ color: 'var(--text-primary)', margin: 0 }}>Thanal Admin</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleLogout} className="secondary-btn">Logout</button>
            <button onClick={onClose} className="secondary-btn">Close</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setActiveTab("feedback")} className={activeTab === "feedback" ? "primary-btn" : "secondary-btn"}>Feedback</button>
          <button onClick={() => setActiveTab("cameras")} className={activeTab === "cameras" ? "primary-btn" : "secondary-btn"}>Camera Reports</button>
        </div>

        <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
          <h2 style={{ marginTop: 0, color: 'var(--text-primary)' }}>{activeTab === 'feedback' ? 'User Feedback' : 'Speed Camera Reports'}</h2>
          
          {isLoading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
          ) : activeTab === "feedback" ? (
            feedback.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No feedback found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {feedback.map((item) => (
                  <div key={item.id} style={{ background: 'var(--surface-hover)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                      <span style={{ background: item.type === 'bug' ? 'var(--warning)' : 'var(--accent)', color: 'var(--text-primary)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>{item.type}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                    </div>
                    <p style={{ color: 'var(--text-primary)', margin: 'var(--space-xs) 0', whiteSpace: 'pre-wrap' }}>{item.message}</p>
                    {item.email && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'var(--space-xs)' }}>By: {item.email}</div>}
                  </div>
                ))}
              </div>
            )
          ) : (
            cameraReports.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No camera reports found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {cameraReports.map((report) => (
                  <div key={report.id} style={{ background: 'var(--surface-hover)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                      <span style={{ background: 'var(--warning)', color: 'var(--text-primary)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>{report.type}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
                    </div>
                    <p style={{ color: 'var(--text-primary)', margin: 'var(--space-xs) 0' }}>Camera ID: {report.camera_id} at {report.lat.toFixed(4)}, {report.lng.toFixed(4)}</p>
                    {report.notes && <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Note: {report.notes}</p>}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button onClick={() => verifyCamera(report.camera_id)} className="secondary-btn" style={{ fontSize: '12px', padding: '4px 8px' }}>Mark Verified</button>
                      <button onClick={() => deleteCamera(report.camera_id)} className="secondary-btn" style={{ fontSize: '12px', padding: '4px 8px', color: 'var(--error)' }}>Remove Camera</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
