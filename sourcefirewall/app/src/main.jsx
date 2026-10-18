import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createReadClient,
  loadRecords,
  connectWallet,
  errorText,
  configurationError,
} from "./api";
import { EXAMPLE_RECORDS } from "./demoData";
import { LandingPage } from "./components/LandingPage";
import { Workbench } from "./components/Workbench";
import { Footer } from "./components/Footer";
import "./style.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("SourceFirewall interface caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#000000",
            color: "#FFFFFF",
            padding: "24px",
            fontFamily: "var(--font-mono)",
          }}
        >
          <div
            style={{
              maxWidth: "540px",
              padding: "32px",
              border: "1px solid #E11D48",
              background: "#0A0A0A",
            }}
          >
            <h2 style={{ margin: "0 0 12px", color: "#E11D48", fontSize: "16px" }}>
              CRITICAL SYSTEM EXCEPTION
            </h2>
            <p style={{ margin: "0 0 20px", color: "#888888", fontSize: "12px", lineHeight: 1.6 }}>
              {this.state.error?.message || "An unexpected error occurred while rendering the interface."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-minimal-white"
            >
              RELOAD PROTOCOL
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const getInitialView = () => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes("app") || hash.includes("workbench") || hash.includes("terminal")) {
      return "WORKBENCH";
    }
    return "LANDING";
  };

  const [currentView, setCurrentView] = useState(getInitialView);
  const [records, setRecords] = useState(EXAMPLE_RECORDS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Wallet State
  const [walletAccount, setWalletAccount] = useState("");
  const [walletBalance, setWalletBalance] = useState("0.00");
  const [writeClient, setWriteClient] = useState(null);

  // Toast State
  const [toast, setToast] = useState(null);

  const notify = (message, type = "info") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Sync hash with currentView
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes("app") || hash.includes("workbench") || hash.includes("terminal")) {
        setCurrentView("WORKBENCH");
      } else {
        setCurrentView("LANDING");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const switchView = (mode) => {
    setCurrentView(mode);
    if (mode === "WORKBENCH") {
      window.location.hash = "app";
    } else {
      window.location.hash = "";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Load Records from Smart Contract
  const refreshRecords = async () => {
    if (isDemoMode) {
      setRecords(EXAMPLE_RECORDS);
      return;
    }

    const configErr = configurationError();
    if (configErr) {
      console.warn("Contract not configured, running in demo mode:", configErr);
      setRecords(EXAMPLE_RECORDS);
      return;
    }

    setIsRefreshing(true);
    try {
      const readClient = createReadClient();
      const liveRecords = await loadRecords(readClient);
      if (liveRecords && liveRecords.length > 0) {
        setRecords(liveRecords);
        notify("Loaded live contract records from GenLayer Studionet", "success");
      } else {
        setRecords(EXAMPLE_RECORDS);
      }
    } catch (err) {
      console.error("Failed to fetch live contract records:", err);
      notify("Failed to query Studionet RPC. Retaining cached telemetry.", "error");
      setRecords(EXAMPLE_RECORDS);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshRecords();
  }, [isDemoMode]);

  // Handle Wallet Connection
  const handleConnectWallet = async () => {
    try {
      notify("Connecting to Web3 wallet…", "info");
      const connected = await connectWallet();
      setWalletAccount(connected.account);
      setWalletBalance(connected.balance);
      setWriteClient(connected.client);
      notify(`Connected: ${connected.account.slice(0, 6)}…${connected.account.slice(-4)}`, "success");
    } catch (err) {
      notify(errorText(err), "error");
    }
  };

  const handleToggleDemoMode = () => {
    setIsDemoMode((prev) => {
      const next = !prev;
      notify(next ? "Switched to Demo Telemetry Mode" : "Switched to Live GenLayer RPC Mode", "info");
      return next;
    });
  };

  return (
    <div className="app-shell">
      {/* View Switch: Landing Page vs Main Operational Terminal */}
      {currentView === "LANDING" ? (
        <LandingPage onLaunchApp={() => switchView("WORKBENCH")} />
      ) : (
        <Workbench
          records={records}
          onRefresh={refreshRecords}
          isRefreshing={isRefreshing}
          walletAccount={walletAccount}
          walletBalance={walletBalance}
          onConnectWallet={handleConnectWallet}
          onReturnLanding={() => switchView("LANDING")}
          isDemoMode={isDemoMode}
          onToggleDemoMode={handleToggleDemoMode}
          onNotify={notify}
          onAddRecord={(newRec) => setRecords((prev) => [newRec, ...prev])}
        />
      )}

      {/* Minimal Footer */}
      <Footer onSelectView={(view) => (view === "WORKBENCH" ? switchView("WORKBENCH") : switchView("LANDING"))} />

      {/* Global Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            padding: "12px 18px",
            background: "#111111",
            border: "1px solid #2A2A2A",
            borderLeft: `3px solid ${toast.type === "error" ? "#E11D48" : "#10B981"}`,
            fontSize: "12px",
            color: "#FFFFFF",
            fontFamily: "var(--font-mono)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.8)",
          }}
        >
          <span>[{toast.type.toUpperCase()}]</span>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} style={{ color: "#888888", marginLeft: "8px" }}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
