import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppNavigationControls } from "@/components/AppNavigationControls";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DivinationWorkshop from "./pages/DivinationWorkshop";
import Home from "./pages/Home";
import Bazi from "./pages/Bazi";
import Library from "./pages/Library";
import Reader from "./pages/Reader";
import Shelf from "./pages/Shelf";
import Sources from "./pages/Sources";
import ShareView from "./pages/ShareView";
import SearchPage from "./pages/Search";
import PoetryLot from "./pages/PoetryLot";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/bazi" component={Bazi} />
      <Route path="/poetry-lot" component={PoetryLot} />
      <Route path="/search" component={SearchPage} />
      <Route path={"/divine"} component={DivinationWorkshop} />
      <Route path={"/reader/:id"} component={Reader} />
      <Route path={"/library"} component={Library} />
      <Route path={"/shelf"} component={Shelf} />
      <Route path={"/sources"} component={Sources} />
      <Route path={"/share/:token"} component={ShareView} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <AppNavigationControls />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
