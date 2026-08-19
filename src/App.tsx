import { Route, Routes } from "react-router-dom";
import { PageShell } from "./components/layout/PageShell";
import { CreateTeamPage } from "./features/registration/CreateTeamPage";
import { JoinTeamPage } from "./features/registration/JoinTeamPage";
import { LandingPage } from "./features/registration/LandingPage";
import { SuccessPage } from "./features/registration/SuccessPage";

export function App() {
  return (
    <PageShell>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register/create" element={<CreateTeamPage />} />
        <Route path="/register/join" element={<JoinTeamPage />} />
        <Route path="/register/success" element={<SuccessPage />} />
      </Routes>
    </PageShell>
  );
}
