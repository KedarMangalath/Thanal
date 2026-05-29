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
    const { status, index, action } = data;
    
    // When tutorial finishes or is skipped
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      setIsSettingsOpen?.(false);
      localStorage.setItem("thanal_tour_seen", "true");
    }

    // Step-specific logic
    if (action === "next") {
      // If we just finished the menu button step, open the menu for the next steps
      if (index === 1 && setIsSettingsOpen) {
        setIsSettingsOpen(true);
      }
    }
  };

  const steps: Step[] = [
    {
      target: "body",
      content: (
        <div>
          <h2>Welcome to Thanal! ☀️</h2>
          <p>Your sun-aware travel companion for India. Let's take a quick tour!</p>
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
          primaryColor: 'var(--primary)',
          textColor: 'var(--text-primary)',
          backgroundColor: 'var(--bg)',
          arrowColor: 'var(--bg)',
          zIndex: 10000,
        },
        styles: {
          tooltipContainer: {
            textAlign: 'left'
          },
          buttonNext: {
            borderRadius: '8px',
            padding: '8px 16px',
          },
          buttonBack: {
            color: 'var(--text-secondary)'
          }
        }
      } as any)}
    />
  );
}
