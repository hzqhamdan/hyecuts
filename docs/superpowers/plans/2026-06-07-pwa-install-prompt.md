# PWA Install Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a custom PWA installation prompt that appears after a successful booking, encouraging users to install the app for reminders.

**Architecture:** 
- A custom hook `usePWAInstall` will listen for the `beforeinstallprompt` event globally.
- The `deferredPrompt` will be stored in a simple state and exposed via the hook.
- A styled `PWAInstallPrompt` component will be integrated into the `BookingFlow` success screen.
- Localization support for English and Bahasa Malaysia.

**Tech Stack:** React, Framer Motion, Lucide Icons, Vite-plugin-pwa.

---

### Task 1: Create PWA Install Logic [COMPLETED]

**Files:**
- Create: `src/hooks/usePWAInstall.ts`

- [x] **Step 1: Implement the usePWAInstall hook**

```typescript
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  return { isInstallable, install };
}
```

- [x] **Step 2: Commit**

```bash
git add src/hooks/usePWAInstall.ts
git commit -m "feat: add usePWAInstall hook"
```

---

### Task 2: Create PWAInstallPrompt Component [COMPLETED]

**Files:**
- Create: `src/components/ui/PWAInstallPrompt.tsx`

- [x] **Step 1: Implement the styled component**

```tsx
import { motion } from 'framer-motion';
import { Smartphone, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export default function PWAInstallPrompt() {
  const { t } = useTranslation();
  const { isInstallable, install } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-6 bg-neutral-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5 text-center"
    >
      <Smartphone className="w-8 h-8 mx-auto mb-4 text-[#B8A070]" />
      <h4 className="font-serif text-lg uppercase tracking-tight mb-2">
        {t('pwa.install_title')}
      </h4>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed max-w-xs mx-auto">
        {t('pwa.install_desc')}
      </p>
      <button
        onClick={install}
        className="flex items-center gap-2 mx-auto px-6 py-3 bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
      >
        <Download className="w-3 h-3" />
        {t('pwa.install_button')}
      </button>
    </motion.div>
  );
}
```

- [x] **Step 2: Commit**

```bash
git add src/components/ui/PWAInstallPrompt.tsx
git commit -m "feat: add PWAInstallPrompt component"
```

---

### Task 3: Add Localization Strings

**Files:**
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ms.json`

- [ ] **Step 1: Update en.json**

```json
{
  "pwa": {
    "install_title": "Install The Studio App",
    "install_desc": "Install the app to your home screen for quick access and to receive booking reminders.",
    "install_button": "Install Now"
  }
}
```

- [ ] **Step 2: Update ms.json**

```json
{
  "pwa": {
    "install_title": "Pasang Aplikasi The Studio",
    "install_desc": "Pasang aplikasi ke skrin utama anda untuk akses pantas dan menerima peringatan tempahan.",
    "install_button": "Pasang Sekarang"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/i18n/locales/en.json src/i18n/locales/ms.json
git commit -m "feat: add PWA installation translations"
```

---

### Task 4: Integrate into BookingFlow

**Files:**
- Modify: `src/components/booking/BookingFlow.tsx`

- [ ] **Step 1: Import and add PWAInstallPrompt to Success screen**

```tsx
// Around the success state rendering (usually after the booking reference)
import PWAInstallPrompt from '../ui/PWAInstallPrompt';

// In the JSX where success is handled:
<PWAInstallPrompt />
```

- [ ] **Step 2: Commit**

```bash
git add src/components/booking/BookingFlow.tsx
git commit -m "feat: integrate PWA prompt into BookingFlow"
```
