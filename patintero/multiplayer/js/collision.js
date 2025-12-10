import { runners, taggers } from './config.js';
import { database } from '../../../config/firebase.js';
import { ref, set } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

/**
 * Check if current player is the host
 */
function isHost() {
    return window.multiplayerState?.isHost === true;
}

/**
 * Check collisions between runners and taggers
 * HOST-ONLY: Collision detection only runs on host
 */
export function checkCollisions() {
    // Only host runs collision detection
    if (!isHost()) return;

    const hitDist = 30;
    runners.forEach((r, runnerIdx) => {
        if (!r.active) return;
        for (let t of taggers) {
            const dist = Math.sqrt((r.x - t.x) ** 2 + (r.y - t.y) ** 2);
            if (dist < hitDist) {
                // Tag the runner
                r.active = false;
                r.el.style.opacity = '0.3';
                r.el.style.filter = 'grayscale(100%)';

                // Play Tag Sound
                const snd = document.getElementById('tagSound');
                if (snd) { snd.currentTime = 0; snd.play().catch(() => { }); }

                console.log("Runner tagged!");
                break;
            }
        }
    });
}
