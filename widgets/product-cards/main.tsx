// eslint-disable-next-line import/no-unassigned-import
import "./style.css";
import { createRoot } from "react-dom/client";
import { AppWrapper } from "../lib/AppWrapper.js";
import { ProductCardsView } from "./components/ProductCardsView.js";
import type { Payload } from "./types.js";

function App() {
  return (
    <AppWrapper<Payload> appName="rocket-coffee-product-cards">
      {({ data, app }) => <ProductCardsView data={data!} app={app} />}
    </AppWrapper>
  );
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
}
