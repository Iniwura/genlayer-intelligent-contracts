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
            backgroundColor: "#08090a",
            color: "#f1f5f9",
            padding: "24px",
            fontFamily: "var(--font-sans)",
          }}
        >
          <div
            className="tactical-box"
            style={{
              maxWidth: "540px",
              padding: "32px",
              border: "1px solid #ef4444",
            }}
          >
            <h2 style={{ margin: "0 0 12px", color: "#ef4444", fontSize: "20px" }}>
              CRITICAL INTERFACE EXCEPTION
            </h2>
            <p style={{ margin: "0 0 20px", color: "#94a3b8", fontSize: "13px", lineHeight: 1.5 }}>
              {this.state.error?.message || "An unexpected error occurred while rendering the tactical terminal."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
              style={{ padding: "8px 16px", fontSize: "12px" }}
            >
              RELOAD SOURCEFIREWALL
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  // Navigation State: "LANDING" vs "WORKBENCH"
  const getInitialView = () => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes("app") || hash.includes("workbench") || hash.includes("desk")) {
      return "WORKBENCH";
    }
    return "LANDING";
  };

  const [viewMode, setViewMode] = useState(getInitialView);
  const [records, setRecords] = useState(EXAMPLE_RECORDS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Wallet State
  const [walletAccount, setWalletAccount] = useState("");
  const [walletBalance, setWalletBalance] = useState("0.00");
  const [writeClient, setWriteClient] = useState(null);

  // Toast State
  const [toast, setToast] = useState(null);

  const notify = (message, type = "info") => {
    setToast({ message, type });
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Sync hash with viewMode
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes("app") || hash.includes("workbench") || hash.includes("desk")) {
        setViewMode("WORKBENCH");
      } else {
        setViewMode("LANDING");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const switchView = (mode) => {
    setViewMode(mode);
    if (mode === "WORKBENCH") {
      window.location.hash = "workbench";
    } else {
      window.location.hash = "";
    }
  };

  // Load Records from Smart Contract
  const refreshRecords = async () => {
    if (isDemoMode) {
      setRecords(EXAMPLE_RECORDS);
      return;
    }

    const configErr = configurationError();
    if (configErr) {
      console.warn("Contract not configured, running in sample mode:", configErr);
      setRecords(EXAMPLE_RECORDS);
      return;
    }

    setIsRefreshing(true);
    try {
      const readClient = createReadClient();
      const liveRecords = await loadRecords(readClient);
      if (liveRecords && liveRecords.length > 0) {
        setRecords(liveRecords);
      } else {
        // Fall back to sample records if contract has zero entries
        setRecords(EXAMPLE_RECORDS);
      }
    } catch (err) {
      console.error("Failed to fetch live contract records:", err);
      notify("Failed to query GenLayer Studionet RPC. Retaining cached telemetry.", "error");
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
      notify("Connecting to browser wallet…", "info");
      const connected = await connectWallet();
      setWalletAccount(connected.account);
      setWalletBalance(connected.balance);
      setWriteClient(connected.client);
      notify(`Wallet connected: ${connected.account.slice(0, 6)}…${connected.account.slice(-4)}`, "success");
    } catch (err) {
      notify(errorText(err), "error");
    }
  };

  const handleToggleDemoMode = () => {
    setIsDemoMode((prev) => {
      const next = !prev;
      notify(next ? "Switched to Sample Data Mode" : "Switched to Live Contract Mode", "info");
      return next;
    });
  };

  return (
    <>
      {viewMode === "LANDING" ? (
        <LandingPage
          onLaunchWorkbench={() => switchView("WORKBENCH")}
          liveRecordCount={records.length}
          isDemoMode={isDemoMode}
        />
      ) : (
        <Workbench
          records={records}
          onRefresh={refreshRecords}
          isRefreshing={isRefreshing}
          walletAccount={walletAccount}
          walletBalance={walletBalance}
          writeClient={writeClient}
          onConnectWallet={handleConnectWallet}
          onReturnLanding={() => switchView("LANDING")}
          isDemoMode={isDemoMode}
          onToggleDemoMode={handleToggleDemoMode}
          onNotify={notify}
        />
      )}

      {/* Global Tactical Toast */}
      {toast && (
        <div className={`tactical-toast ${toast.type}`}>
          <div className="mono" style={{ fontSize: "10px", color: "var(--text-dim)", textTransform: "uppercase" }}>
            [{toast.type}]
          </div>
          <div style={{ flex: 1 }}>{toast.message}</div>
          <button
            onClick={() => setToast(null)}
            style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
