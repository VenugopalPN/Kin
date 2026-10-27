import { Link, useNavigate } from 'react-router-dom';
import { logoutOrgAdmin } from '../lib/store.ts';
import './AdminSidebar.css';

export type AdminSection = 'dashboard' | 'website';

interface AdminSidebarProps {
  schoolSlug: string;
  schoolName: string;
  active: AdminSection;
}

/** The persistent left nav for every signed-in org-admin page. */
export function AdminSidebar({ schoolSlug, schoolName, active }: AdminSidebarProps) {
  const navigate = useNavigate();

  function handleSignOut() {
    logoutOrgAdmin();
    navigate(`/s/${schoolSlug}/login`);
  }

  return (
    <nav className="admin-sidebar">
      <p className="admin-sidebar-brand brand-mark">Kin</p>
      <p className="admin-sidebar-school">{schoolName}</p>
      <ul className="admin-sidebar-links">
        <li>
          <Link
            to={`/s/${schoolSlug}/admin`}
            className={active === 'dashboard' ? 'admin-sidebar-link admin-sidebar-link-active' : 'admin-sidebar-link'}
          >
            Dashboard
          </Link>
        </li>
        <li>
          <Link
            to={`/s/${schoolSlug}/admin?section=website`}
            className={active === 'website' ? 'admin-sidebar-link admin-sidebar-link-active' : 'admin-sidebar-link'}
          >
            Website
          </Link>
        </li>
      </ul>
      <button type="button" className="admin-sidebar-link admin-sidebar-sign-out" onClick={handleSignOut}>
        Sign out
      </button>
    </nav>
  );
}
