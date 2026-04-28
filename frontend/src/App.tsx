import { Flowbite, ThemeModeScript } from 'flowbite-react';
import customTheme from './utils/theme/custom-theme';
import Router from "./routes/Router";
import { AuthProvider } from './auth/AuthContext';
import { CategoryProvider } from './contexts/CategoryContext';
import { ProductProvider } from './contexts/ProductContext';
import { MenuProvider } from './contexts/MenuContext';
import { Toaster } from 'react-hot-toast';


function App() {

  return (
    <>
      <ThemeModeScript />
      <Toaster position="top-right" />
      <Flowbite theme={{ theme: customTheme }}>
        <CategoryProvider>
          <ProductProvider>
            <MenuProvider>
              <AuthProvider>
                <Router />
              </AuthProvider>
            </MenuProvider>
          </ProductProvider>
        </CategoryProvider>
      </Flowbite>
    </>
  );
}

export default App;
