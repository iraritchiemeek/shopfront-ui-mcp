// eslint-disable-next-line import/no-unassigned-import
import "./style.css";
import { createRoot } from "react-dom/client";
import { AppWrapper } from "../lib/AppWrapper.js";
import { ThreeSceneView } from "./components/ThreeSceneView.js";
import type { Payload } from "./types.js";

function App() {
  return (
    <AppWrapper<Payload> appName="shopfront-ui-three-scene">
      {({ data }) => <ThreeSceneView data={data!} />}
    </AppWrapper>
  );
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
}
