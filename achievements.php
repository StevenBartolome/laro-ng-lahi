<?php
session_start();

// Check if user is logged in
$isLoggedIn = isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
$isGuest = isset($_SESSION['is_guest']) && $_SESSION['is_guest'] === true;

// Get user info
if ($isLoggedIn) {
    $userId = $_SESSION['username'];
    $displayname = $_SESSION['displayname'];
} else {
    $userId = '';
    $displayname = 'Guest';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Achievements - Laro ng Lahi</title>
    <link rel="stylesheet" href="assets/css/achievements.css">
    
    <!-- Firebase SDKs -->
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"></script>
    <script src="assets/js/firebase-config.js"></script>
</head>
<body>
    <div class="achievements-container">
        <div class="achievements-header">
            <h1 class="achievements-title">🏆 Achievements</h1>
            <p class="achievements-subtitle">Track your progress and unlock all achievements!</p>
        </div>

        <?php if ($isGuest || !$isLoggedIn): ?>
            <!-- Guest Mode Message -->
            <div class="guest-message">
                <div class="guest-message-icon">🔒</div>
                <h2 class="guest-message-title">Achievements Locked</h2>
                <p class="guest-message-text">
                    You need to log in to track achievements and save your progress.
                    Guest players cannot unlock achievements.
                </p>
                <a href="login.php" class="login-button">Login to Unlock</a>
            </div>
        <?php else: ?>
            <!-- Loading State -->
            <div id="loadingContainer" class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading achievements...</p>
            </div>

            <!-- Progress Bar -->
            <div id="progressContainer" class="progress-container" style="display: none;">
                <div class="progress-bar" id="progressBar" style="width: 0%">
                    <span id="progressText">0/23 Unlocked (0%)</span>
                </div>
            </div>

            <!-- Achievements Content -->
            <div id="achievementsContent" style="display: none;">
                <!-- General Achievements -->
                <div class="category-section">
                    <h2 class="category-header">
                        <span class="category-icon">🎮</span>
                        General Achievements
                    </h2>
                    <div class="achievements-grid" id="generalAchievements"></div>
                </div>

                <!-- Jolen Achievements -->
                <div class="category-section">
                    <h2 class="category-header">
                        <span class="category-icon">🎯</span>
                        Jolen Achievements
                    </h2>
                    <div class="achievements-grid" id="jolenAchievements"></div>
                </div>

                <!-- Patintero Achievements -->
                <div class="category-section">
                    <h2 class="category-header">
                        <span class="category-icon">🏃</span>
                        Patintero Achievements
                    </h2>
                    <div class="achievements-grid" id="patinteroAchievements"></div>
                </div>

                <!-- Luksong Baka Achievements -->
                <div class="category-section">
                    <h2 class="category-header">
                        <span class="category-icon">🦘</span>
                        Luksong Baka Achievements
                    </h2>
                    <div class="achievements-grid" id="luksongAchievements"></div>
                </div>

                <!-- Special Achievements -->
                <div class="category-section">
                    <h2 class="category-header">
                        <span class="category-icon">🏆</span>
                        Special Achievements
                    </h2>
                    <div class="achievements-grid" id="specialAchievements"></div>
                </div>
            </div>
        <?php endif; ?>
    </div>

    <a href="start_menu.php" class="back-button">← Back to Menu</a>

    <?php if ($isLoggedIn && !$isGuest): ?>
    <script src="assets/js/AchievementManager.js"></script>
    <script>
        // Initialize achievement manager
        const userId = '<?php echo $userId; ?>';
        const achievementMgr = window.achievementManager;

        async function loadAchievements() {
            try {
                // Initialize with user ID
                await achievementMgr.init(userId, false);

                // Get progress
                const progress = achievementMgr.getProgress();
                
                // Update progress bar
                document.getElementById('progressBar').style.width = progress.percentage + '%';
                document.getElementById('progressText').textContent = 
                    `${progress.unlocked}/${progress.total} Unlocked (${progress.percentage}%)`;

                // Render achievements by category
                renderAchievements('general', 'generalAchievements');
                renderAchievements('jolen', 'jolenAchievements');
                renderAchievements('patintero', 'patinteroAchievements');
                renderAchievements('luksong', 'luksongAchievements');
                renderAchievements('special', 'specialAchievements');

                // Hide loading, show content
                document.getElementById('loadingContainer').style.display = 'none';
                document.getElementById('progressContainer').style.display = 'block';
                document.getElementById('achievementsContent').style.display = 'block';
            } catch (error) {
                console.error('Error loading achievements:', error);
                document.getElementById('loadingContainer').innerHTML = 
                    '<p style="color: #ff6b6b;">Error loading achievements. Please try again later.</p>';
            }
        }

        function renderAchievements(category, containerId) {
            const achievements = achievementMgr.getAchievementsByCategory(category);
            const container = document.getElementById(containerId);

            achievements.forEach(achievement => {
                const card = createAchievementCard(achievement);
                container.appendChild(card);
            });
        }

        function createAchievementCard(achievement) {
            const card = document.createElement('div');
            card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;

            const unlockedDate = achievement.unlockedAt 
                ? new Date(achievement.unlockedAt).toLocaleDateString()
                : '';

            card.innerHTML = `
                ${achievement.unlocked ? '<div class="achievement-badge">✓ UNLOCKED</div>' : ''}
                <div class="achievement-content">
                    <div class="achievement-icon-large">${achievement.icon}</div>
                    <div class="achievement-details">
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-description">${achievement.description}</div>
                        <div class="achievement-status">
                            ${achievement.unlocked 
                                ? `✓ Unlocked on ${unlockedDate}` 
                                : '🔒 Locked'}
                        </div>
                    </div>
                </div>
            `;

            return card;
        }

        // Load achievements when page loads
        window.addEventListener('load', loadAchievements);
    </script>
    <?php endif; ?>
</body>
</html>
