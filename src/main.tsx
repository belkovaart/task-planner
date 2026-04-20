import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./app/styles/tokens.css";
import "./app/styles/globals.css";

type RootErrorState = {
  error: Error | null;
};

class RootErrorBoundary extends React.Component<React.PropsWithChildren, RootErrorState> {
  state: RootErrorState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): RootErrorState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App crashed during render", error, errorInfo);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="app-state error">
        <span className="app-state-title">Приложение не смогло запуститься</span>
        <span className="app-state-sub">{this.state.error.message}</span>
      </div>
    );
  }
}

window.addEventListener("error", (event) => {
  console.error("Unhandled window error", event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection", event.reason);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
);
