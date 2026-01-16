
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Demo } from './pages/Demo';
import { Performance } from './pages/Performance';
import { Docs } from './pages/Docs';
import { Debug } from './pages/Debug';

// Support subpath deployment
const basename = import.meta.env.BASE_URL;

function App() {
  return (
    <BrowserRouter basename={basename === '/' ? undefined : basename}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="demo" element={<Demo />} />
          <Route path="performance" element={<Performance />} />
          <Route path="docs" element={<Docs />} />
          <Route path="debug" element={<Debug />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
