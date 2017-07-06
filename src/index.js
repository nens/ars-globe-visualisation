import { AppContainer } from "react-hot-loader";
import { HashRouter as Router, Route, Link } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import injectTapEventPlugin from 'react-tap-event-plugin';
import App from "./components/App";
import i18n from "./i18n"; // initialized i18next instance
import React from "react";
import ReactDOM from "react-dom";
import valuesES2017 from "object.values";

// Make the classic Object.values() work on Chrome (needed for some
// NPM dependencies). If we omit this, our G4AW app will not work on Chrome.
if (typeof Object.values !== "function") {
  Object.values = valuesES2017;
}

ReactDOM.render(
  <AppContainer>
    <I18nextProvider i18n={i18n}>
      <Router basename="/">
        <div>
          <Route exact path="/" component={App} />
        </div>
      </Router>
    </I18nextProvider>
  </AppContainer>,
  document.getElementById("root")
);

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept();
}
