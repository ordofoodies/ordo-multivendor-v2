'use client';

// Core
import { useState } from 'react';

// Localization
import { useTranslations } from 'next-intl';

// Icons
import { faAdd, faGift } from '@fortawesome/free-solid-svg-icons';

// Components
import HeaderText from '@/lib/ui/useable-components/header-text';
import TextIconClickable from '@/lib/ui/useable-components/text-icon-clickable';
import CustomTab from '@/lib/ui/useable-components/vendor-custom-tab';
import MembershipMembers from '@/lib/ui/screen-components/protected/super-admin/membership/members';
import MembershipOverview from '@/lib/ui/screen-components/protected/super-admin/membership/overview';
import MembershipPlans from '@/lib/ui/screen-components/protected/super-admin/membership/plans';
import MembershipSettingsForm from '@/lib/ui/screen-components/protected/super-admin/membership/settings';

type Tab = 'overview' | 'members' | 'plans' | 'settings';
const TABS: Tab[] = ['overview', 'members', 'plans', 'settings'];

export default function MembershipScreen() {
  const t = useTranslations();
  const [tab, setTab] = useState<Tab>('overview');
  // bumped by the header button; the tab opens its "new" side panel
  const [addRequest, setAddRequest] = useState(0);

  const label = (value: Tab) => t(`membership_${value}`);
  const action =
    tab === 'plans'
      ? { title: t('membership_add_plan'), icon: faAdd }
      : tab === 'members'
        ? { title: t('membership_grant'), icon: faGift }
        : null;

  return (
    <div className="screen-container">
      <div className="sticky top-0 z-10 w-full flex-shrink-0 bg-white p-3 shadow-sm dark:bg-dark-950">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <HeaderText text={t('membership_title')} />
          <div className="flex flex-wrap items-center gap-3">
            <CustomTab
              options={TABS.map(label)}
              selectedTab={label(tab)}
              setSelectedTab={(value) =>
                setTab(TABS.find((v) => label(v) === value) ?? 'overview')
              }
            />
            {action ? (
              <TextIconClickable
                className="rounded border border-gray-300 bg-black text-white sm:w-auto dark:border-dark-600"
                icon={action.icon}
                iconStyles={{ color: 'white' }}
                onClick={() => setAddRequest((n) => n + 1)}
                title={action.title}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="p-3">
        {tab === 'overview' ? <MembershipOverview /> : null}
        {tab === 'members' ? (
          <MembershipMembers addRequest={addRequest} />
        ) : null}
        {tab === 'plans' ? <MembershipPlans addRequest={addRequest} /> : null}
        {tab === 'settings' ? <MembershipSettingsForm /> : null}
      </div>
    </div>
  );
}
