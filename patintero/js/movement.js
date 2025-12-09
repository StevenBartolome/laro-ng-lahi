import { gameState, CONFIG, boost, taggerBoost, runners, taggers, keys } from './config.js';
import { showPointNotification } from './ui.js';

/**
 * Update all runners (player and bot movement)
 */
/**
 * Update all runners (player and bot movement)
 */
export function updateRunners(timeScale = 1.0) {
    const field = document.getElementById('field');
    const fw = field.offsetWidth;
    const fh = field.offsetHeight;

    runners.forEach(r => {
        if (!r.active) return;

        let dx = 0, dy = 0;
        let speed = CONFIG.runnerSpeed;
        if (r.type === 'bot') speed = CONFIG.botSpeed;

        if (r.type === 'player') {
            // Player Movement
            if (boost.active) speed *= boost.multiplier;
            
            // Scale speed by timeScale for frame independence
            const scaledSpeed = speed * timeScale;

            if (keys.ArrowUp || keys.w) dy -= scaledSpeed;
            if (keys.ArrowDown || keys.s) dy += scaledSpeed;
            if (keys.ArrowLeft || keys.a) dx -= scaledSpeed;
            if (keys.ArrowRight || keys.d) dx += scaledSpeed;
        } else {
            // Bot AI Logic
            const scaledSpeed = speed * timeScale;
            // Target: Bottom (if not reached) or Top (if reached)
            let targetY = r.reachedBottom ? 20 : fh - 40;

            // Basic Pathfinding
            if (r.y < targetY) dy += scaledSpeed * 0.6;
            else if (r.y > targetY) dy -= scaledSpeed * 0.6;

            // Evasion Logic: Run away from nearest tagger
            let nearestTagger = null;
            let minDist = 100;
            taggers.forEach(t => {
                const dist = Math.sqrt((r.x - t.x) ** 2 + (r.y - t.y) ** 2);
                if (dist < minDist) {
                    minDist = dist;
                    nearestTagger = t;
                }
            });

            if (nearestTagger) {
                // Simple flee behavior
                if (nearestTagger.x < r.x) dx += scaledSpeed * 0.5;
                else dx -= scaledSpeed * 0.5;

                // Wait behavior if tagger is directly ahead
                if (Math.abs(nearestTagger.y - r.y) < 60 && Math.abs(nearestTagger.x - r.x) < 50) {
                    dy = 0; // Stop and wait
                }
            }

            // Random Jitter
            if (Math.random() < 0.05 * timeScale) dx += (Math.random() - 0.5) * 10 * timeScale;
        }

        r.x += dx;
        r.y += dy;

        // Bounds
        if (r.x < 20) r.x = 20; if (r.x > fw - 20) r.x = fw - 20;
        if (r.y < 20) r.y = 20; if (r.y > fh - 20) r.y = fh - 20;

        // Check Round Trip
        if (!r.reachedBottom && r.y > fh - 50) {
            r.reachedBottom = true;
            r.el.style.border = '3px solid #00FF00'; // Visual indicator: Turn Green
        }

        // Check if completed round trip (reached bottom and back to top)
        if (r.reachedBottom && r.y < 50) {
            // Award point based on current role
            if (gameState.currentRole === 'runner') {
                // Player is runner - runners score for player's team
                gameState.playerTeamScore++;
                document.getElementById('myTeamScore').textContent = gameState.playerTeamScore;
                if (r.type === 'player') {
                    showPointNotification("+1 POINT FOR MY TEAM!");
                } else {
                    showPointNotification("+1 POINT (Bot Runner)", 'team');
                }
            } else {
                // Player is tagger - runners score for enemy team
                gameState.enemyTeamScore++;
                document.getElementById('enemyTeamScore').textContent = gameState.enemyTeamScore;
                showPointNotification("+1 POINT FOR ENEMY TEAM!", 'enemy');
            }

            // Reset runner for another run
            r.reachedBottom = false;
            r.el.style.border = '3px solid #fff';
            r.y = 50; // Reset to start position
        }

        r.el.style.left = `${r.x}px`;
        r.el.style.top = `${r.y}px`;
    });
}

/**
 * Update all taggers (player and bot AI movement)
 */
/**
 * Update all taggers (player and bot AI movement)
 */
export function updateTaggers(timeScale = 1.0) {
    const field = document.getElementById('field');
    const fw = field.offsetWidth;
    const fh = field.offsetHeight;
    const horizontalZoneThreshold = 200; // Increased from 120 to better detect side runners

    taggers.forEach(t => {
        // PLAYER CONTROLLED TAGGER
        if (t.controller === 'player') {
            let dx = 0, dy = 0;
            let speed = CONFIG.taggerSpeed * 1.5; // Slightly faster for player fun

            // Apply boost multiplier if active
            if (taggerBoost.active) {
                speed *= taggerBoost.multiplier;
            }

            // Scale for time
            const scaledSpeed = speed * timeScale;

            if (keys.ArrowUp || keys.w) dy -= scaledSpeed;
            if (keys.ArrowDown || keys.s) dy += scaledSpeed;
            if (keys.ArrowLeft || keys.a) dx -= scaledSpeed;
            if (keys.ArrowRight || keys.d) dx += scaledSpeed;

            t.x += dx;
            t.y += dy;

            // Apply movement constraints based on tagger type
            if (t.type === 'vertical') {
                // Vertical tagger: locked to center X, free Y movement
                t.x = fw / 2; // Locked to center line
                // Y bounds
                if (t.y < fh * 0.2) t.y = fh * 0.2; // Safe zone
                if (t.y > fh - 20) t.y = fh - 20;
            } else if (t.type === 'horizontal') {
                // Horizontal tagger: free X movement, locked to fixed Y
                t.y = t.fixedPos; // Lock to horizontal line
                // X bounds
                if (t.x < 20) t.x = 20;
                if (t.x > fw - 20) t.x = fw - 20;
            }

            t.el.style.top = `${t.y}px`;
            t.el.style.left = `${t.x}px`;
            return; // Skip AI logic
        }

        // AI TAGGER LOGIC
        // Focus nearest active runner using Euclidean distance for accuracy
        let target = null;
        let minDist = Infinity;
        runners.forEach(r => {
            if (!r.active) return;
            // Use Euclidean distance (straight-line) for more accurate proximity
            const dist = Math.sqrt((r.x - t.x) ** 2 + (r.y - t.y) ** 2);
            if (dist < minDist) {
                minDist = dist;
                target = r;
            }
        });

        if (!target) return;

        let desiredX = t.x;
        let desiredY = t.y;
        let chasing = false;

        if (t.type === 'horizontal') {
            const distY = Math.abs(target.y - t.y);
            if (distY < horizontalZoneThreshold) chasing = true;

            // Check if runner is near edges (exploiting sides)
            const edgeThreshold = 150; // Distance from edge to be considered "on the side"
            const isRunnerOnEdge = target.x < edgeThreshold || target.x > fw - edgeThreshold;

            if (chasing) {
                desiredX = target.x;

                // Calculate distance to target
                const distanceToTarget = Math.abs(desiredX - t.x);

                // Distance-based responsiveness: closer = faster, farther = slower
                const maxDistance = fw * 0.5; // Half the field width
                const minResponsiveness = t.resp * 0.1; // Minimum 10% of base responsiveness

                // Calculate scaled responsiveness (inversely proportional to distance)
                const distanceRatio = Math.min(distanceToTarget / maxDistance, 1);
                let scaledResp = t.resp * (1 - distanceRatio * 0.9) + minResponsiveness;

                // Boost responsiveness if runner is on edge (counter side exploit)
                if (isRunnerOnEdge) {
                    scaledResp *= 1.5; // 50% faster when chasing edge runners
                }

                // Apply time scaling to interpolation speed
                // Approximate time scaling for lerp: factor * timeScale
                t.x += (desiredX - t.x) * scaledResp * timeScale;
            } else {
                // Instead of returning to center, move toward nearest runner's X position
                // This helps cover the field better and prevents side exploits
                desiredX = target.x;
                t.x += (desiredX - t.x) * 0.02 * timeScale; // Slow positioning toward runner
            }
            // Clamp
            if (t.x < 20) t.x = 20;
            if (t.x > fw - 20) t.x = fw - 20;
            t.el.style.left = `${t.x}px`;

        } else if (t.type === 'vertical') {
            chasing = true; // Always chase
            t.x = fw / 2;
            desiredY = target.y;

            // Calculate distance to target
            const distanceToTarget = Math.abs(desiredY - t.y);

            // Distance-based responsiveness: closer = faster, farther = slower
            // Base responsiveness is t.resp, but we scale it down based on distance
            // Max distance for scaling (beyond this, responsiveness is minimal)
            const maxDistance = fh * 0.5; // Half the field height
            const minResponsiveness = t.resp * 0.1; // Minimum 10% of base responsiveness

            // Calculate scaled responsiveness (inversely proportional to distance)
            // When distance is 0, use full responsiveness
            // When distance is maxDistance or more, use minResponsiveness
            const distanceRatio = Math.min(distanceToTarget / maxDistance, 1);
            const scaledResp = t.resp * (1 - distanceRatio * 0.9) + minResponsiveness;

            t.y += (desiredY - t.y) * scaledResp * timeScale;

            // Constraints
            const safeZoneY = fh * 0.2;
            if (t.y < safeZoneY) t.y = safeZoneY;
            if (t.y > fh - 20) t.y = fh - 20;

            t.el.style.top = `${t.y}px`;
            t.el.style.left = `${t.x}px`;
        }
    });
}
