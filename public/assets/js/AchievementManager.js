/**
 * Achievement Manager - Handles all achievement tracking and unlocking
 * Only works for logged-in users, guests cannot unlock achievements
 */

class AchievementManager {
    constructor() {
        this.notificationQueue = this.loadQueueFromStorage();
        this.isShowingNotification = false;

        // Start processing if items exist (small delay to allow page render)
        if (this.notificationQueue.length > 0) {
            setTimeout(() => this.processNotificationQueue(), 1000);
        }

        this.achievements = {
            // General Achievements
            'first_steps': {
                id: 'first_steps',
                name: 'First Steps',
                description: 'Play your first game',
                icon: '🎮',
                category: 'general',
                requirement: { type: 'gamesPlayed', value: 1 }
            },
            'game_explorer': {
                id: 'game_explorer',
                name: 'Game Explorer',
                description: 'Play all 3 different games',
                icon: '🗺️',
                category: 'general',
                requirement: { type: 'uniqueGames', value: 3 }
            },
            'dedicated_player': {
                id: 'dedicated_player',
                name: 'Dedicated Player',
                description: 'Play 10 games total',
                icon: '⭐',
                category: 'general',
                requirement: { type: 'gamesPlayed', value: 10 }
            },
            'veteran': {
                id: 'veteran',
                name: 'Veteran',
                description: 'Play 50 games total',
                icon: '🏅',
                category: 'general',
                requirement: { type: 'gamesPlayed', value: 50 }
            },
            'legend': {
                id: 'legend',
                name: 'Legend',
                description: 'Play 100 games total',
                icon: '👑',
                category: 'general',
                requirement: { type: 'gamesPlayed', value: 100 }
            },

            // Jolen Achievements
            'jolen_rookie': {
                id: 'jolen_rookie',
                name: 'Jolen Rookie',
                description: 'Complete your first Jolen game',
                icon: '🎯',
                category: 'jolen',
                requirement: { type: 'jolenGames', value: 1 }
            },
            'sharp_shooter': {
                id: 'sharp_shooter',
                name: 'Sharp Shooter',
                description: 'Hit 10 targets in a row',
                icon: '🎪',
                category: 'jolen',
                requirement: { type: 'jolenStreak', value: 10 }
            },
            'jolen_master': {
                id: 'jolen_master',
                name: 'Jolen Master',
                description: 'Win 10 Jolen games',
                icon: '🏆',
                category: 'jolen',
                requirement: { type: 'jolenWins', value: 10 }
            },
            'perfect_game': {
                id: 'perfect_game',
                name: 'Perfect Game',
                description: 'Complete a Jolen game without missing',
                icon: '💎',
                category: 'jolen',
                requirement: { type: 'jolenPerfect', value: 1 }
            },
            'combo_king': {
                id: 'combo_king',
                name: 'Combo King',
                description: 'Hit 20 targets consecutively',
                icon: '🔥',
                category: 'jolen',
                requirement: { type: 'jolenStreak', value: 20 }
            },

            // Patintero Achievements
            'patintero_initiate': {
                id: 'patintero_initiate',
                name: 'Patintero Initiate',
                description: 'Complete your first Patintero game',
                icon: '🏃',
                category: 'patintero',
                requirement: { type: 'patinteroGames', value: 1 }
            },
            'swift_runner': {
                id: 'swift_runner',
                name: 'Swift Runner',
                description: 'Score 5 points as a runner',
                icon: '⚡',
                category: 'patintero',
                requirement: { type: 'patinteroPoints', value: 5 }
            },
            'defender': {
                id: 'defender',
                name: 'Defender',
                description: 'Tag 10 runners as a tagger',
                icon: '🛡️',
                category: 'patintero',
                requirement: { type: 'patinteroTags', value: 10 }
            },
            'untouchable': {
                id: 'untouchable',
                name: 'Untouchable',
                description: 'Win a round without being tagged',
                icon: '👻',
                category: 'patintero',
                requirement: { type: 'patinteroFlawless', value: 1 }
            },
            'speed_demon': {
                id: 'speed_demon',
                name: 'Speed Demon',
                description: 'Complete a game in under 2 minutes',
                icon: '💨',
                category: 'patintero',
                requirement: { type: 'patinteroSpeed', value: 120 }
            },

            // Luksong Baka Achievements
            'first_leap': {
                id: 'first_leap',
                name: 'First Leap',
                description: 'Complete your first Luksong Baka game',
                icon: '🦘',
                category: 'luksong',
                requirement: { type: 'luksongGames', value: 1 }
            },
            'high_jumper': {
                id: 'high_jumper',
                name: 'High Jumper',
                description: 'Jump over the highest level (Level 5)',
                icon: '🏔️',
                category: 'luksong',
                requirement: { type: 'luksongMaxLevel', value: 5 }
            },
            'flawless': {
                id: 'flawless',
                name: 'Flawless Victory',
                description: 'Win without losing any lives',
                icon: '✨',
                category: 'luksong',
                requirement: { type: 'luksongPerfect', value: 1 }
            },
            'speed_jumper': {
                id: 'speed_jumper',
                name: 'Speed Jumper',
                description: 'Perform a 5-jump streak',
                icon: '⚡',
                category: 'luksong',
                requirement: { type: 'luksongStreak', value: 5 }
            },
            'baka_master': {
                id: 'baka_master',
                name: 'Baka Master',
                description: 'Win 10 Luksong Baka games',
                icon: '🏅',
                category: 'luksong',
                requirement: { type: 'luksongWins', value: 10 }
            },


        };

        this.userId = null;
        this.userStats = {};
        this.unlockedAchievements = {};
        this.isGuest = true; // Default to guest
        this.initialized = false;
    }

    /**
     * Initialize the achievement manager with user info
     */
    async init(userId, isGuest = false) {
        this.userId = userId;
        
        // Defensive check: If userId indicates a guest, force isGuest to true
        // This handles cases where callers might incorrectly pass isGuest=false
        if (userId === 'guest' || (typeof userId === 'string' && userId.startsWith('guest_'))) {
            isGuest = true;
        }
        
        this.isGuest = isGuest;

        if (this.isGuest) {
            console.log('Guest mode - achievements disabled');
            this.initialized = true;
            return;
        }

        try {
            // Load user's achievements and stats from Firebase
            await this.loadUserData();
            this.initialized = true;
            console.log('Achievement Manager initialized for user:', userId);
        } catch (error) {
            console.error('Error initializing Achievement Manager:', error);
        }
    }

    /**
     * Load user's achievements and stats from Firebase
     */
    async loadUserData() {
        if (!this.userId || this.isGuest) return;

        // Use window.database as fallback if database is not in scope
        const db = typeof database !== 'undefined' ? database : window.database;

        if (!db) {
            console.error('Firebase database not initialized');
            return;
        }

        const userRef = db.ref(`achievements/${this.userId}`);
        const snapshot = await userRef.once('value');
        const data = snapshot.val() || {};

        this.unlockedAchievements = data.unlockedAchievements || {};
        this.userStats = data.stats || {
            gamesPlayed: 0,
            gamesPlayedByType: { jolen: 0, patintero: 0, luksong: 0 },
            jolenStreak: 0,
            jolenWins: 0,
            patinteroPoints: 0,
            patinteroTags: 0,
            luksongWins: 0,
            totalPlaytime: 0
        };
    }

    /**
     * Track a game completion
     */
    async trackGameComplete(gameType, gameData = {}) {
        if (this.isGuest || !this.initialized) return;

        // Update stats
        this.userStats.gamesPlayed = (this.userStats.gamesPlayed || 0) + 1;
        this.userStats.gamesPlayedByType = this.userStats.gamesPlayedByType || {};
        this.userStats.gamesPlayedByType[gameType] = (this.userStats.gamesPlayedByType[gameType] || 0) + 1;



        // Check general achievements
        await this.checkAndUnlock('first_steps');
        await this.checkAndUnlock('dedicated_player');
        await this.checkAndUnlock('veteran');
        await this.checkAndUnlock('legend');

        // Check if played all games
        const uniqueGames = Object.keys(this.userStats.gamesPlayedByType).length;
        if (uniqueGames >= 3) {
            await this.checkAndUnlock('game_explorer');
        }

        // Save updated stats
        await this.saveUserData();
    }

    /**
     * Track Jolen-specific achievements
     */
    async trackJolenGame(data) {
        if (this.isGuest || !this.initialized) return;

        const { won, streak, perfect } = data;

        if (won) {
            this.userStats.jolenWins = (this.userStats.jolenWins || 0) + 1;
            await this.checkAndUnlock('jolen_master');
        }

        if (streak) {
            this.userStats.jolenStreak = Math.max(this.userStats.jolenStreak || 0, streak);
            await this.checkAndUnlock('sharp_shooter');
            await this.checkAndUnlock('combo_king');
        }

        if (perfect) {
            await this.unlockAchievement('perfect_game');
        }

        await this.trackGameComplete('jolen');
        await this.checkAndUnlock('jolen_rookie');
    }

    /**
     * Track Patintero-specific achievements
     */
    async trackPatinteroGame(data) {
        if (this.isGuest || !this.initialized) return;

        const { points, tags, flawless, duration } = data;

        if (points) {
            this.userStats.patinteroPoints = (this.userStats.patinteroPoints || 0) + points;
            await this.checkAndUnlock('swift_runner');
        }

        if (tags) {
            this.userStats.patinteroTags = (this.userStats.patinteroTags || 0) + tags;
            await this.checkAndUnlock('defender');
        }

        if (flawless) {
            await this.unlockAchievement('untouchable');
        }

        if (duration && duration <= 120) {
            await this.unlockAchievement('speed_demon');
        }

        await this.trackGameComplete('patintero');
        await this.checkAndUnlock('patintero_initiate');
    }

    /**
     * Track Luksong Baka-specific achievements
     */
    async trackLuksongGame(data) {
        if (this.isGuest || !this.initialized) return;

        const { won, maxLevel, perfect, streak } = data;

        if (won) {
            this.userStats.luksongWins = (this.userStats.luksongWins || 0) + 1;
            await this.checkAndUnlock('baka_master');
        }

        if (maxLevel >= 5) {
            await this.unlockAchievement('high_jumper');
        }

        if (perfect) {
            await this.unlockAchievement('flawless');
        }

        if (streak >= 5) {
            await this.unlockAchievement('speed_jumper');
        }

        await this.trackGameComplete('luksong');
        await this.checkAndUnlock('first_leap');
    }

    /**
     * Track playtime for marathon achievement
     */


    /**
     * Check if requirements are met and unlock achievement
     */
    async checkAndUnlock(achievementId) {
        if (this.isGuest || !this.initialized) return;

        const achievement = this.achievements[achievementId];
        if (!achievement) return;

        // Already unlocked
        if (this.unlockedAchievements[achievementId]) return;

        const { type, value } = achievement.requirement;
        let currentValue = 0;

        switch (type) {
            case 'gamesPlayed':
                currentValue = this.userStats.gamesPlayed || 0;
                break;
            case 'uniqueGames':
                currentValue = Object.keys(this.userStats.gamesPlayedByType || {}).length;
                break;
            case 'jolenGames':
                currentValue = this.userStats.gamesPlayedByType?.jolen || 0;
                break;
            case 'jolenStreak':
                currentValue = this.userStats.jolenStreak || 0;
                break;
            case 'jolenWins':
                currentValue = this.userStats.jolenWins || 0;
                break;
            case 'patinteroGames':
                currentValue = this.userStats.gamesPlayedByType?.patintero || 0;
                break;
            case 'patinteroPoints':
                currentValue = this.userStats.patinteroPoints || 0;
                break;
            case 'patinteroTags':
                currentValue = this.userStats.patinteroTags || 0;
                break;
            case 'luksongGames':
                currentValue = this.userStats.gamesPlayedByType?.luksong || 0;
                break;
            case 'luksongWins':
                currentValue = this.userStats.luksongWins || 0;
                break;
            case 'luksongMaxLevel':
                // Logic handled manually in trackLuksongGame but added for completeness
                // We don't store maxLevel in userStats directly in this implementation, 
                // relying on manual trigger. But if we did:
                // currentValue = this.userStats.luksongMaxLevel || 0;
                return;
            case 'luksongStreak':
            case 'luksongPerfect':
                return; // Handled manually
            default:
                return;
        }

        if (currentValue >= value) {
            await this.unlockAchievement(achievementId);
        }
    }

    /**
     * Unlock an achievement
     */
    async unlockAchievement(achievementId) {
        if (this.isGuest || !this.initialized) return;

        // Already unlocked
        if (this.unlockedAchievements[achievementId]) return;

        const achievement = this.achievements[achievementId];
        if (!achievement) return;

        this.unlockedAchievements[achievementId] = {
            unlockedAt: Date.now()
        };

        await this.saveUserData();

        // Show notification
        this.showAchievementNotification(achievement);

        console.log(`🏆 Achievement Unlocked: ${achievement.name}`);
    }

    /**
     * Show achievement unlock notification
     */
    /**
     * Show achievement unlock notification
     */
    showAchievementNotification(achievement) {
        this.notificationQueue.push(achievement);
        this.saveQueueToStorage();
        this.processNotificationQueue();
    }

    loadQueueFromStorage() {
        try {
            const queue = localStorage.getItem('achievement_notification_queue');
            return queue ? JSON.parse(queue) : [];
        } catch (e) {
            console.error('Error loading notification queue:', e);
            return [];
        }
    }

    saveQueueToStorage() {
        try {
            localStorage.setItem('achievement_notification_queue', JSON.stringify(this.notificationQueue));
        } catch (e) {
            console.error('Error saving notification queue:', e);
        }
    }

    processNotificationQueue() {
        if (this.isGuest) return;
        if (this.isShowingNotification) {
            console.log('Notification queue busy. Waiting...');
            return;
        }
        if (this.notificationQueue.length === 0) {
            console.log('Notification queue empty.');
            return;
        }

        this.isShowingNotification = true;
        const achievement = this.notificationQueue.shift();
        this.saveQueueToStorage(); // Save immediately after removing from queue
        console.log(`Processing notification for: ${achievement.name}`);

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-title">Achievement Unlocked!</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        // Use requestAnimationFrame for reliable style application
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Remove after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }

                this.isShowingNotification = false;
                this.saveQueueToStorage(); // Save updated queue state (item shift happens at start, but we want to be robust)
                // Actually shift happened at start. 
                // We should save AFTER shift? Yes.

                console.log('Notification finished. Checking queue...');

                // Wait 0.5s before showing next
                setTimeout(() => {
                    this.processNotificationQueue();
                }, 500);
            }, 500);
        }, 4000);
    }

    /**
     * Save user data to Firebase
     */
    async saveUserData() {
        if (!this.userId || this.isGuest) return;

        // Use window.database as fallback if database is not in scope
        const db = typeof database !== 'undefined' ? database : window.database;

        if (!db) {
            console.error('Firebase database not initialized');
            return;
        }

        const userRef = db.ref(`achievements/${this.userId}`);
        await userRef.set({
            unlockedAchievements: this.unlockedAchievements,
            stats: this.userStats
        });
    }

    /**
     * Get all achievements with unlock status
     */
    getAllAchievements() {
        return Object.values(this.achievements).map(achievement => ({
            ...achievement,
            unlocked: !!this.unlockedAchievements[achievement.id],
            unlockedAt: this.unlockedAchievements[achievement.id]?.unlockedAt
        }));
    }

    /**
     * Get achievements by category
     */
    getAchievementsByCategory(category) {
        return this.getAllAchievements().filter(a => a.category === category);
    }

    /**
     * Get specific achievement progress
     */
    getAchievementProgress(achievementId) {
        // If guest or not initialized, return 0
        if (this.isGuest || !this.initialized) return { current: 0, target: 1, percent: 0 };

        const achievement = this.achievements[achievementId];
        if (!achievement) return { current: 0, target: 1, percent: 0 };

        // If already unlocked, return 100%
        if (this.unlockedAchievements[achievementId]) {
            return {
                current: achievement.requirement.value,
                target: achievement.requirement.value,
                percent: 100
            };
        }

        const { type, value } = achievement.requirement;
        let currentValue = 0;

        switch (type) {
            case 'gamesPlayed':
                currentValue = this.userStats.gamesPlayed || 0;
                break;
            case 'uniqueGames':
                currentValue = Object.keys(this.userStats.gamesPlayedByType || {}).length;
                break;
            case 'jolenGames':
                currentValue = this.userStats.gamesPlayedByType?.jolen || 0;
                break;
            case 'jolenStreak':
                currentValue = this.userStats.jolenStreak || 0;
                break;
            case 'jolenWins':
                currentValue = this.userStats.jolenWins || 0;
                break;
            case 'patinteroGames':
                currentValue = this.userStats.gamesPlayedByType?.patintero || 0;
                break;
            case 'patinteroPoints':
                currentValue = this.userStats.patinteroPoints || 0;
                break;
            case 'patinteroTags':
                currentValue = this.userStats.patinteroTags || 0;
                break;
            case 'luksongGames':
                currentValue = this.userStats.gamesPlayedByType?.luksong || 0;
                break;
            case 'luksongWins':
                currentValue = this.userStats.luksongWins || 0;
                break;

            default:
                currentValue = 0;
        }

        // Cap at target value
        currentValue = Math.min(currentValue, value);

        return {
            current: currentValue,
            target: value,
            percent: Math.round((currentValue / value) * 100)
        };
    }

    /**
     * Get unlock progress
     */
    getProgress() {
        const total = Object.keys(this.achievements).length;
        const unlocked = Object.keys(this.unlockedAchievements).length;
        return {
            unlocked,
            total,
            percentage: (unlocked / total * 100).toFixed(1)
        };
    }
}

// Create global instance
window.achievementManager = new AchievementManager();
