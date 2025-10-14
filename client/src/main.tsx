import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./index.css";

// TODO: Fix .env loading in Vite for mobile builds
// Temporarily hardcoded for iOS/Android builds
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_cGlja2VkLWJ1ZmZhbG8tMjQuY2xlcmsuYWNjb3VudHMuZGV2JA";

if (!publishableKey) {
  throw new Error("Missing Clerk Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={publishableKey}>
    <App />
  </ClerkProvider>
);
