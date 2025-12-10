import { gameState, CONFIG, boost, taggerBoost, runners, taggers, keys } from './config.js';
import { showPointNotification } from './ui.js';

/**
 * Check if current player is the host
 */
function isHost() {
    return window.multiplayerState?.isHost === true;
}

/**
 * Update all runners (player and bot movement)
 * Full logic only runs on host - non-hosts receive synced state
 */
export function updateRunners(timeScale = 1.0) {
    // Only host runs full runner updates
    if (!isHost()) return;

    const field = document.getElementById('field');
    const fw = field.offsetWidth;
    const fh = field.offsetHeight;

    runners.forEach(r => {
        if (!r.active) return;

        // Remote players - apply their synced position (host receives from playerInputs)
        if (r.type === 'remote') return;

        let dx = 0, dy = 0;
        let speed = CONFIG.runnerSpeed;
        if (r.type === 'bot') speed = CONFIG.botSpeed;

        if (r.type === 'player') {
            // Player Movement
            if (boost.active) speed *= boost.multiplier;
            const scaledSpeed = speed * timeScale;

            if (keys.ArrowUp || keys.w) dy -= scaledSpeed;
            if (keys.ArrowDown || keys.s) dy += scaledSpeed;
            if (keys.ArrowLeft || keys.a) dx -= scaledSpeed;
            if (keys.ArrowRight || keys.d) dx += scaledSpeed;
        } else {
            // Bot AI Logic
            const scaledSpeed = speed * timeScale;
            let targetY = r.reachedBottom ? 20 : fh - 40;

            if (r.y < targetY) dy += scaledSpeed * 0.6;
            else if (r.y > targetY) dy -= scaledSpeed * 0.6;

            // Evasion Logic
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
                if (nearestTagger.x < r.x) dx += scaledSpeed * 0.5;
                else dx -= scaledSpeed * 0.5;

                if (Math.abs(nearestTagger.y - r.y) < 60 && Math.abs(nearestTagger.x - r.x) < 50) {
                    dy = 0;
                    if (r.x < 40) dx += scaledSpeed * 0.7;
                    else if (r.x > fw - 40) dx -= scaledSpeed * 0.7;
                    else if (Math.abs(r.x - fw / 2) < 20) dx += (Math.random() < 0.5 ? 1 : -1) * scaledSpeed * 0.7;
                    else dx += (r.x < fw / 2 ? -1 : 1) * scaledSpeed * 0.7;
                }
            }

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
            r.el.style.border = '3px solid #00FF00';
        }

        // Scoring (host only - state is synced to all)
        // Scoring (host only - state is synced to all)
        if (r.reachedBottom && r.y < 50) {
            // Determine which team scored
            // r.reachedBottom implies a Runner made it. The Runner Team scores.
            if (gameState.runnerTeamId === 1) {
                gameState.team1Score++;
            } else {
                gameState.team2Score++;
            }

            // Check if WE (local player) are the ones who scored (or our team)
            const myTeamIsRunner = gameState.myTeamId === gameState.runnerTeamId;

            // Update UI
            // Note: This UI update is only for HOST (since updateRunners only runs on host).
            // Non-hosts get updates via Sync.
            const myScore = gameState.myTeamId === 1 ? gameState.team1Score : gameState.team2Score;
            const enemyScore = gameState.myTeamId === 1 ? gameState.team2Score : gameState.team1Score;

            document.getElementById('myTeamScore').textContent = myScore;
            document.getElementById('enemyTeamScore').textContent = enemyScore;

            if (myTeamIsRunner) {
                if (r.type === 'player') {
                    showPointNotification("+1 POINT FOR MY TEAM!");
                } else {
                    showPointNotification("+1 POINT (Teammate)", 'team');
                }
            } else {
                showPointNotification("+1 POINT FOR ENEMY TEAM!", 'enemy');
            }

            r.reachedBottom = false;
            r.el.style.border = '3px solid #fff';
            r.y = 50;
        }

        r.el.style.left = `${r.x}px`;
        r.el.style.top = `${r.y}px`;
    });
}

/**
 * Update all taggers (player and bot AI movement)
 * Full logic only runs on host
 */
export function updateTaggers(timeScale = 1.0) {
    // Only host runs full tagger updates
    if (!isHost()) return;

    const field = document.getElementById('field');
    const fw = field.offsetWidth;
    const fh = field.offsetHeight;
    const horizontalZoneThreshold = 200;

    taggers.forEach(t => {
        // Remote players handled by sync
        if (t.controller === 'remote') return;

        // PLAYER CONTROLLED TAGGER
        if (t.controller === 'player') {
            let dx = 0, dy = 0;
            let speed = CONFIG.taggerSpeed;

            if (taggerBoost.active) speed *= taggerBoost.multiplier;
            const scaledSpeed = speed * timeScale;

            if (keys.ArrowUp || keys.w) dy -= scaledSpeed;
            if (keys.ArrowDown || keys.s) dy += scaledSpeed;
            if (keys.ArrowLeft || keys.a) dx -= scaledSpeed;
            if (keys.ArrowRight || keys.d) dx += scaledSpeed;

            t.x += dx;
            t.y += dy;

            if (t.type === 'vertical') {
                t.x = fw / 2;
                if (t.y < fh * 0.2) t.y = fh * 0.2;
                if (t.y > fh - 20) t.y = fh - 20;
            } else if (t.type === 'horizontal') {
                t.y = t.fixedPos;
                if (t.x < 20) t.x = 20;
                if (t.x > fw - 20) t.x = fw - 20;
            }

            t.el.style.top = `${t.y}px`;
            t.el.style.left = `${t.x}px`;
            return;
        }

        // AI TAGGER LOGIC
        let target = null;
        let minDist = Infinity;
        runners.forEach(r => {
            if (!r.active) return;
            const dist = Math.sqrt((r.x - t.x) ** 2 + (r.y - t.y) ** 2);
            if (dist < minDist) {
                minDist = dist;
                target = r;
            }
        });

        if (!target) return;

        if (t.type === 'horizontal') {
            const distY = Math.abs(target.y - t.y);
            const chasing = distY < horizontalZoneThreshold;
            const edgeThreshold = 150;
            const isRunnerOnEdge = target.x < edgeThreshold || target.x > fw - edgeThreshold;

            if (chasing) {
                const desiredX = target.x;
                const distanceToTarget = Math.abs(desiredX - t.x);
                const maxDistance = fw * 0.5;
                const minResponsiveness = t.resp * 0.1;
                const distanceRatio = Math.min(distanceToTarget / maxDistance, 1);
                let scaledResp = t.resp * (1 - distanceRatio * 0.9) + minResponsiveness;
                if (isRunnerOnEdge) scaledResp *= 1.5;
                t.x += (desiredX - t.x) * scaledResp * timeScale;
            } else {
                t.x += (target.x - t.x) * 0.02 * timeScale;
            }
            if (t.x < 20) t.x = 20;
            if (t.x > fw - 20) t.x = fw - 20;
            t.el.style.left = `${t.x}px`;

        } else if (t.type === 'vertical') {
            t.x = fw / 2;
            const desiredY = target.y;
            const distanceToTarget = Math.abs(desiredY - t.y);
            const maxDistance = fh * 0.5;
            const minResponsiveness = t.resp * 0.1;
            const distanceRatio = Math.min(distanceToTarget / maxDistance, 1);
            const scaledResp = t.resp * (1 - distanceRatio * 0.9) + minResponsiveness;
            t.y += (desiredY - t.y) * scaledResp * timeScale;

            const safeZoneY = fh * 0.2;
            if (t.y < safeZoneY) t.y = safeZoneY;
            if (t.y > fh - 20) t.y = fh - 20;

            t.el.style.top = `${t.y}px`;
            t.el.style.left = `${t.x}px`;
        }
    });
}
