import { Toaster } from "react-hot-toast";
export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: "rgba(13, 26, 45, 0.92)",
          backdropFilter: "blur(16px)",
          color: "#f0f6ff",
          border: "1px solid rgba(79, 140, 220, 0.25)",
          borderRadius: "16px",
          fontSize: "13px",
          fontWeight: "600",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.15)",
          padding: "12px 18px",
        },
        success: { 
          iconTheme: { primary: "#22c55e", secondary: "#0d1a2d" },
          style: {
            borderLeft: "4px solid #22c55e",
          }
        },
        error: { 
          iconTheme: { primary: "#ef4444", secondary: "#0d1a2d" },
          style: {
            borderLeft: "4px solid #ef4444",
          }
        },
      }}
    />
  );
}
