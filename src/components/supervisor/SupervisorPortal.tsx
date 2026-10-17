import React from 'react';
import { useApp } from '../../context/AppContext';
import { ReviewTab } from './ReviewTab';
import { ChildrenTab } from './ChildrenTab';
import { StaffTab } from './StaffTab';
import { ReportsTab } from './ReportsTab';
import { TemplatesTab } from './TemplatesTab';

/**
 * Clinical Supervisor portal: approve goals and sessions, observe staff, publish reports, and manage clinical templates.
 */
export const SupervisorPortal: React.FC = () => {
  const { activeTab, role } = useApp();
  const tab = activeTab.toLowerCase();
  return (
    <div className="max-w-md md:max-w-6xl mx-auto px-4 md:px-8 pt-3 md:pt-6" data-testid="supervisor-portal" data-role={role ?? ''}>
      {tab === 'review' && <ReviewTab />}
      {tab === 'children' && <ChildrenTab />}
      {tab === 'staff' && <StaffTab />}
      {tab === 'reports' && <ReportsTab />}
      {tab === 'templates' && <TemplatesTab />}
    </div>
  );
};
