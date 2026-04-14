// eslint-disable-next-line import/no-unassigned-import
import "./style.css";
import { createRoot } from "react-dom/client";
import { AppWrapper } from "../lib/AppWrapper.js";
import { ProductCardsView } from "./components/ProductCardsView.js";
import type { Payload } from "./types.js";

function App() {
  return (
    <AppWrapper<Payload> appName="shopfront-ui-product-cards">
      {({ data, app, openLink }) => <ProductCardsView data={data!} app={app} openLink={openLink} />}
    </AppWrapper>
  );
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
}
