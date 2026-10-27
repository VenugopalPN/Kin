import { Route, Routes } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage.tsx';
import { DoorsPage } from './pages/DoorsPage.tsx';
import { PlatformPage } from './pages/PlatformPage.tsx';
import { OrgLoginPage } from './pages/OrgLoginPage.tsx';
import { SchoolFrontDoorPage } from './pages/SchoolFrontDoorPage.tsx';
import { SchoolCampaignsPage } from './pages/SchoolCampaignsPage.tsx';
import { SchoolAdminPage } from './pages/SchoolAdminPage.tsx';
import { SchoolCampaignPromotersPage } from './pages/SchoolCampaignPromotersPage.tsx';
import { PromoterPage } from './pages/PromoterPage.tsx';
import { FamilyPage } from './pages/FamilyPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/doors" element={<DoorsPage />} />
      <Route path="/platform" element={<PlatformPage />} />
      <Route path="/s/:schoolSlug" element={<SchoolFrontDoorPage />} />
      <Route path="/s/:schoolSlug/login" element={<OrgLoginPage />} />
      <Route path="/s/:schoolSlug/admin" element={<SchoolCampaignsPage />} />
      <Route path="/s/:schoolSlug/admin/:campaignId" element={<SchoolAdminPage />} />
      <Route path="/s/:schoolSlug/admin/:campaignId/promoters" element={<SchoolCampaignPromotersPage />} />
      <Route path="/s/:schoolSlug/promoter/:campaignId" element={<PromoterPage />} />
      <Route path="/s/:schoolSlug/give/:campaignId" element={<FamilyPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
