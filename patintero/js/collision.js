import { runners, taggers } from './config.js';

/**
 * Check collisions between runners and taggers
 */
export function checkCollisions() {
    const hitDist = 30;
    runners.forEach(r => {
        if (!r.active) return;
        for (let t of taggers) {
            const dist = Math.sqrt((r.x - t.x) ** 2 + (r.y - t.y) ** 2);
            if (dist < hitDist) {
                r.active = false;
                r.el.style.opacity = '0.3';
                r.el.style.filter = 'grayscale(100%)';
            }
        }
    });
}
