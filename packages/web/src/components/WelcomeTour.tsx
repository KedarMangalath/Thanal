import { useState, useEffect } from "react";
import { Joyride, STATUS } from "react-joyride";
import type { EventData, Step } from "react-joyride";

interface Props {
  setIsSettingsOpen?: (isOpen: boolean) => void;
}

export default function WelcomeTour({ setIsSettingsOpen }: Props) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("thanal_tour_seen");
    if (!hasSeenTour) {
      // Delay slightly to ensure elements are mounted
      setTimeout(() => setRun(true), 1000);
    }
  }, []);

  const handleJoyrideEvent = (data: EventData) => {
    const { status, index, action, type } = data;
    
    // When tutorial finishes or is skipped
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      setIsSettingsOpen?.(false);
      localStorage.setItem("thanal_tour_seen", "true");
    }

    // Step-specific logic: open/close settings modal at the correct step transitions
    if (type === "step:after") {
      if (action === "next" && index === 2 && setIsSettingsOpen) {
        setIsSettingsOpen(true);
      } else if (action === "prev" && index === 3 && setIsSettingsOpen) {
        setIsSettingsOpen(false);
      }
    }
  };

  const steps: Step[] = [
    {
      target: "body",
      content: (
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>Welcome to Thanal! ☀️</h2>
          <p style={{ fontSize: "13px", lineHeight: "1.4", margin: 0 }}>Your sun-aware travel companion for Kerala. Let's take a quick tour!</p>
        </div>
      ),
      placement: "center",
      skipBeacon: true
    },
    {
      target: "#tutorial-search",
      content: "Enter your boarding and destination stations here to find the best shaded route.",
      placement: "right"
    },
    {
      target: "#tutorial-menu-btn",
      content: "Click this menu to explore Map Features, Community settings, and Saved Routes!",
      placement: "left"
    },
    {
      target: "#tutorial-feature-toggles",
      content: "Turn on Community Markers here to see AI Speed Cameras and verified washrooms on your map.",
      placement: "left"
    }
  ];

  return (
    <Joyride
      {...({
        steps,
        run,
        continuous: true,
        scrollToFirstStep: true,
        showProgress: true,
        showSkipButton: true,
        onEvent: handleJoyrideEvent,
        options: {
          primaryColor: 'var(--accent)',
          textColor: 'var(--text-primary)',
          backgroundColor: 'var(--surface)',
          arrowColor: 'var(--surface)',
          zIndex: 10000,
        },
        styles: {
          tooltip: {
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-lg)',
            padding: '12px',
          },
          tooltipContainer: {
            textAlign: 'left'
          },
          buttonNext: {
            borderRadius: '8px',
            padding: '8px 16px',
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-text)',
            fontWeight: '600',
          },
          buttonBack: {
            color: 'var(--text-secondary)',
            marginRight: '8px',
          },
          buttonSkip: {
            color: 'var(--text-muted)',
            fontWeight: '500',
          }
        }
      } as any)}
    />
  );
}
