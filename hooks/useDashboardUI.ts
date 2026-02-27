import React, { useState } from 'react';
import { User } from '../types';

export function useDashboardUI(user: User) {
    const [showPayment, setShowPayment] = useState(false);
    const [paymentError, setPaymentError] = useState<string | undefined>(undefined);
    const [showBreathing, setShowBreathing] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showGrounding, setShowGrounding] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [mood, setMood] = useState<'confetti' | 'rain' | null>(null);
    const [editName, setEditName] = useState(user.name);
    const [editEmail, setEditEmail] = useState(user.email);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isIdle, setIsIdle] = useState(false);
    const [showTechCheck, setShowTechCheck] = useState(false);
    const [isGhostMode, setIsGhostMode] = useState(() => localStorage.getItem('peutic_ghost_mode') === 'true');
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [showBookFull, setShowBookFull] = useState(false);
    const [showGardenFull, setShowGardenFull] = useState(false);
    const [showPocketPet, setShowPocketPet] = useState(false);
    const [showObservatory, setShowObservatory] = useState(false);
    const [showDojo, setShowDojo] = useState(false);
    const [showShredder, setShowShredder] = useState(false);
    const [showMatchGame, setShowMatchGame] = useState(false);
    const [showCloudHop, setShowCloudHop] = useState(false);
    const [showSlicerGame, setShowSlicerGame] = useState(false);
    const [isUnlockingRoom, setIsUnlockingRoom] = useState(false);
    const [showVoiceJournal, setShowVoiceJournal] = useState(false);
    const [showSupportCircles, setShowSupportCircles] = useState(false);
    const [showSerenityShop, setShowSerenityShop] = useState(false);

    // Sync profile edits lightly when user prop changes from db
    React.useEffect(() => {
        setEditName(user.name);
        setEditEmail(user.email);
    }, [user.name, user.email]);

    return {
        showPayment, setShowPayment,
        paymentError, setPaymentError,
        showBreathing, setShowBreathing,
        showProfile, setShowProfile,
        showGrounding, setShowGrounding,
        showDeleteConfirm, setShowDeleteConfirm,
        mood, setMood,
        editName, setEditName,
        editEmail, setEditEmail,
        isSavingProfile, setIsSavingProfile,
        isIdle, setIsIdle,
        showTechCheck, setShowTechCheck,
        isGhostMode, setIsGhostMode,
        isDeletingAccount, setIsDeletingAccount,
        showBookFull, setShowBookFull,
        showGardenFull, setShowGardenFull,
        showPocketPet, setShowPocketPet,
        showObservatory, setShowObservatory,
        showDojo, setShowDojo,
        showShredder, setShowShredder,
        showMatchGame, setShowMatchGame,
        showCloudHop, setShowCloudHop,
        showSlicerGame, setShowSlicerGame,
        isUnlockingRoom, setIsUnlockingRoom,
        showVoiceJournal, setShowVoiceJournal,
        showSupportCircles, setShowSupportCircles,
        showSerenityShop, setShowSerenityShop
    };
}
