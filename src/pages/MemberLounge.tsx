import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLoungeData } from '../hooks/useLoungeData';
import LoungeHeader from '../components/lounge/LoungeHeader';
import MobileMenu from '../components/lounge/MobileMenu';
import StatusCard from '../components/lounge/StatusCard';
import RewardPortfolio from '../components/lounge/RewardPortfolio';
import ActivityFeed from '../components/lounge/ActivityFeed';
import MissionsPanel from '../components/lounge/MissionsPanel';
import BadgeShowcase from '../components/lounge/BadgeShowcase';
import VoucherModal from '../components/member-lounge/VoucherModal';
import UserProfileModal from '../components/profile/UserProfileModal';
import { api } from '../api/client';

const MemberLounge = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, token, logout } = useAuth();
  const USER_ID = user?.id ?? "00000000-0000-0000-0000-000000000000";

  const {
    profile,
    rewards,
    activities,
    badges,
    userBadges,
    missions,
    missionProgress,
    isLoading,
    selectedVoucher,
    redemptionStatus,
    showSettingsModal,
    showNotifications,
    isMenuOpen,
    notifications,
    unreadCount,
    progressData,
    i18n,
    setSelectedVoucher,
    setRedemptionStatus,
    setShowSettingsModal,
    setShowNotifications,
    setIsMenuOpen,
    toggleLanguage,
    handleRedeem,
    refreshProfile
  } = useLoungeData(USER_ID);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-white dark:bg-[#1A1A1A] text-black dark:text-[#FAFAFA] px-6 md:px-12 py-10 md:py-16 font-sans overflow-x-hidden transition-colors duration-500"
    >
      <LoungeHeader
        onLogout={() => { logout(); navigate('/'); }}
        onToggleLanguage={toggleLanguage}
        showNotifications={showNotifications}
        onToggleNotifications={() => { setShowNotifications(!showNotifications); }}
        onOpenSettings={() => { setShowSettingsModal(true); }}
        unreadCount={unreadCount}
        notifications={notifications}
        i18nLang={i18n.language}
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => { setIsMenuOpen(!isMenuOpen); }}
      />

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => { setIsMenuOpen(false); }}
        onLogout={() => { logout(); navigate('/'); }}
        onToggleLanguage={toggleLanguage}
        onOpenSettings={() => { setShowSettingsModal(true); }}
        i18nLang={i18n.language}
      />

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20">
        <StatusCard
          profile={profile}
          isLoading={isLoading}
          progressData={progressData}
          tierLabel={t('lounge.tier_label')}
        />

        <section className="lg:w-2/3">
          <RewardPortfolio
            rewards={rewards}
            isLoading={isLoading}
            onRedeem={(reward) => {
              setSelectedVoucher(reward);
              setRedemptionStatus('idle');
            }}
          />

          <ActivityFeed
            activities={activities}
          />
        </section>
      </div>

      <div className="max-w-7xl mx-auto mt-20 md:mt-32 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 border-t border-black/10 dark:border-white/10 pt-16 md:pt-24 pb-16 md:pb-24">
        <MissionsPanel
          missions={missions}
          missionProgress={missionProgress}
        />

        <BadgeShowcase
          badges={badges}
          userBadges={userBadges}
        />
      </div>

      <VoucherModal
        voucher={selectedVoucher}
        status={redemptionStatus}
        onClose={() => { setSelectedVoucher(null); }}
        onConfirmRedeem={() => { void handleRedeem(selectedVoucher!.id); }}
      />

      <UserProfileModal
        profile={profile}
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onProfileUpdate={refreshProfile}
        onExportData={() => {
          if(profile) {
            const fullExport = {
              profile,
              activities,
              badges: badges.filter(b => userBadges.some(ub => ub.badgeId === b.id)),
              missions: missions.map(m => ({
                ...m,
                progress: missionProgress.find(p => p.missionId === m.id)
              })),
              exportedAt: new Date().toISOString(),
              studio: "The Studio by Hyecuts"
            };
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullExport, null, 2));
            const dlAnchorElem = document.createElement('a');
            dlAnchorElem.setAttribute("href", dataStr);
            dlAnchorElem.setAttribute("download", `thestudio_export_${profile.userId.slice(0,8)}.json`);
            dlAnchorElem.click();
          }
        }}
        onDeleteAccount={async () => {
          if(confirm(t('lounge.delete_confirm'))) {
            try {
              await api.del(`/admin/users/${user?.id}`, { token: token ?? undefined });
              alert(t('lounge.delete_submitted'));
              logout();
              navigate('/');
            } catch (error) {
              console.error('Failed to delete account', error);
            }
          }
        }}
      />
    </motion.div>
  );
};

export default MemberLounge;
