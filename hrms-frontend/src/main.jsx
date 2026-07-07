import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { store } from './redux/store.js';
import ScrollToTop from "./components/common/ScrollToTop.jsx";
import './index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'datatables.net-dt/css/dataTables.dataTables.min.css';

const basename = '/';

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter basename={basename}>
      <Toaster position="top-right" />
      <ScrollToTop />
      <App />
    </BrowserRouter>
  </Provider>
);
