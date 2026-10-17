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
import { Navbar } from "./components/Navbar";
import { InterceptorView } from "./components/InterceptorView";
import { WorkbenchView } from "./components/WorkbenchView";
import { SdkView } from "./components/SdkView";
import { ArchitectureView } from "./components/ArchitectureView";
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
            backgroundColor: "#050608",
            color: "#f1f5f9",
            padding: "24px",
            fontFamily: "var(--font-sans)",
          }}
        >
          <div
            className="cyber-card"
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
              className="btn-cyber-primary"
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
  const getInitialView = () => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes("app") || hash.includes("workbench") || hash.includes("soc")) {
      return "WORKBENCH";
    }
    if (hash.includes("sdk")) {
      return "SDK";
    }
    if (hash.includes("arch") || hash.includes("taxonomy")) {
      return "ARCHITECTURE";
    }
    return "INTERCEPTOR";
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
      if (hash.includes("app") || hash.includes("workbench") || hash.includes("soc")) {
        setCurrentView("WORKBENCH");
      } else if (hash.includes("sdk")) {
        setCurrentView("SDK");
      } else if (hash.includes("arch") || hash.includes("taxonomy")) {
        setCurrentView("ARCHITECTURE");
      } else {
        setCurrentView("INTERCEPTOR");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const switchView = (mode) => {
    setCurrentView(mode);
    if (mode === "WORKBENCH") {
      window.location.hash = "workbench";
    } else if (mode === "SDK") {
      window.location.hash = "sdk";
    } else if (mode === "ARCHITECTURE") {
      window.location.hash = "architecture";
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
      {/* Top Cyber Navigation */}
      <Navbar
        currentView={currentView}
        onSelectView={switchView}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
        walletAccount={walletAccount}
        walletBalance={walletBalance}
        onConnectWallet={handleConnectWallet}
      />

      {/* Main Active View */}
      <main style={{ flex: 1 }}>
        {currentView === "INTERCEPTOR" && (
          <InterceptorView
            onOpenWorkbench={() => switchView("WORKBENCH")}
            onOpenSdk={() => switchView("SDK")}
          />
        )}

        {currentView === "WORKBENCH" && (
          <WorkbenchView
            records={records}
            onRefresh={refreshRecords}
            isRefreshing={isRefreshing}
            onNotify={notify}
            onReturnLanding={() => switchView("INTERCEPTOR")}
          />
        )}

        {currentView === "SDK" && <SdkView onNotify={notify} />}

        {currentView === "ARCHITECTURE" && <ArchitectureView />}
      </main>

      {/* Unified Cyber Footer */}
      <Footer onSelectView={switchView} />

      {/* Global Tactical Toast */}
      {toast && (
        <div className={`tactical-toast ${toast.type}`}>
          <span className="mono" style={{ fontSize: "11px", fontWeight: 700 }}>
            [{toast.type.toUpperCase()}]
          </span>
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{ color: "var(--text-muted)", fontSize: "14px" }}
          >
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
