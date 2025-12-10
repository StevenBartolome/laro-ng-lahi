import { distance } from "./Common.js";
import Sound from "../js/Sound.js";

/**
 * Setup hole mode with holes based on target count
 * @param {number} targetCount - Number of holes (6-10)
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @returns {Array} - Array of hole objects
 */
export function setup(targetCount, canvasWidth, canvasHeight) {
    const holes = [];
    const numHoles = targetCount; // Use targetCount directly for hole count
    const margin = 120;
    const usableWidth = canvasWidth - 2 * margin;
    const usableHeight = canvasHeight / 2 - margin;

    for (let i = 0; i < numHoles; i++) {
        let x, y, overlapping;
        let attempts = 0;

        do {
            overlapping = false;
            x = margin + Math.random() * usableWidth;
            y = margin + Math.random() * usableHeight;

            for (let other of holes) {
                if (distance(x, y, other.x, other.y) < 100) {
                    overlapping = true;
                    break;
                }
            }
            attempts++;
        } while (overlapping && attempts < 50);

        holes.push({
            x: x,
            y: y,
            radius: 20,
            filled: false,
            filledBy: null, // Track which player filled this hole
        });
    }
    return holes;
}

/**
 * Update hole mode physics
 * @param {Object} playerMarbles - All player marbles keyed by playerId
 * @param {string} currentPlayerId - ID of player whose turn it is
 * @param {Array} holes - Array of hole objects
 * @param {number} score - Current player's score
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @returns {Object} - { scoreIncrease, anyMoving, hitCount }
 */
export function update(
    playerMarbles,
    currentPlayerId,
    holes,
    score,
    canvasWidth,
    canvasHeight
) {
    // Validate state structure (prevent errors during mode transitions)
    if (!holes || !Array.isArray(holes)) {
        console.warn('HoleMode.update: Invalid holes array, skipping update');
        return { scoreIncrease: 0, anyMoving: false, hitCount: 0 };
    }

    let scoreIncrease = 0;
    let anyMoving = false;
    let hitCount = 0; // Track holes filled by current player this turn

    // Check if ONLY the current player's marble falls into holes
    const currentPlayerMarble = playerMarbles[currentPlayerId];

    if (currentPlayerMarble) {
        holes.forEach((hole) => {
            if (!hole.filled) {
                const dist = distance(currentPlayerMarble.x, currentPlayerMarble.y, hole.x, hole.y);
                if (dist < hole.radius) {
                    // Mark hole as filled by this player
                    hole.filled = true;
                    hole.filledBy = currentPlayerId;

                    // Stop the marble at the hole position for visual effect
                    currentPlayerMarble.x = hole.x;
                    currentPlayerMarble.y = hole.y;
                    currentPlayerMarble.vx = 0;
                    currentPlayerMarble.vy = 0;

                    // Score the hole
                    scoreIncrease += 20;
                    hitCount++;
                    Sound.playHit();
                }
            }
        });
    }

    // SPECTATOR SYNC: Ensure all players see marbles at filled hole positions
    // This only positions marbles that are in filled holes, doesn't prevent future shooting
    holes.forEach((hole) => {
        if (hole.filled && hole.filledBy && playerMarbles[hole.filledBy]) {
            const marble = playerMarbles[hole.filledBy];
            const dx = hole.x - marble.x;
            const dy = hole.y - marble.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Check movement
            const isMoving = Math.abs(marble.vx) > 0.1 || Math.abs(marble.vy) > 0.1;

            // Vector calculation: Dot product of Velocity and Direction-To-Hole
            // positive = moving towards hole, negative = moving away
            const dotProduct = (marble.vx * dx) + (marble.vy * dy);
            const movingTowards = isMoving && dotProduct > 0;

            // SNAP if: Not moving OR Moving towards hole (Arrival)
            // IGNORE if: Moving away (Shooting out)
            if ((!isMoving || movingTowards) && dist < hole.radius * 2) {
                marble.x = hole.x;
                marble.y = hole.y;
                marble.vx = 0;
                marble.vy = 0;
            }
        }
    });

    return { scoreIncrease, anyMoving, hitCount };
}

/**
 * Draw the holes
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} holes - Array of hole objects
 */
export function draw(ctx, holes) {
    // Validate state structure
    if (!holes || !Array.isArray(holes)) {
        console.warn('HoleMode.draw: Invalid holes array');
        return;
    }
    // Define player colors - different color for each player
    const playerColors = [
        { main: "rgba(33, 150, 243, 0.8)", light: "rgba(33, 150, 243, 0.3)", rim: "#2196F3" },      // Blue
        { main: "rgba(76, 175, 80, 0.8)", light: "rgba(76, 175, 80, 0.3)", rim: "#4CAF50" },        // Green
        { main: "rgba(233, 30, 99, 0.8)", light: "rgba(233, 30, 99, 0.3)", rim: "#E91E63" },        // Pink
        { main: "rgba(255, 152, 0, 0.8)", light: "rgba(255, 152, 0, 0.3)", rim: "#FF9800" },        // Orange
        { main: "rgba(158, 158, 158, 0.8)", light: "rgba(158, 158, 158, 0.3)", rim: "#9E9E9E" },    // Gray
        { main: "rgba(244, 67, 54, 0.8)", light: "rgba(244, 67, 54, 0.3)", rim: "#F44336" },        // Red
    ];

    holes.forEach((hole, index) => {
        ctx.save();

        // Draw hole shadow
        const gradient = ctx.createRadialGradient(
            hole.x,
            hole.y,
            0,
            hole.x,
            hole.y,
            hole.radius
        );

        if (hole.filled && hole.filledBy) {
            // Get player index from players array to determine color
            // We'll use a simple hash of the playerId for now
            const playerIndex = Math.abs(hole.filledBy.split('').reduce((a, b) => {
                return ((a << 5) - a) + b.charCodeAt(0);
            }, 0)) % playerColors.length;

            const color = playerColors[playerIndex];
            gradient.addColorStop(0, color.main);
            gradient.addColorStop(1, color.light);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
            ctx.fill();

            // Draw hole rim with player color
            ctx.strokeStyle = color.rim;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Unfilled hole - black
            gradient.addColorStop(0, "rgba(0, 0, 0, 0.8)");
            gradient.addColorStop(1, "rgba(0, 0, 0, 0.3)");

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
            ctx.fill();

            // Draw hole rim
            ctx.strokeStyle = "#654321";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    });
}

/**
 * Check if all holes are filled
 * @param {Array} holes - Array of hole objects
 * @returns {boolean}
 */
export function checkLevelComplete(holes) {
    return holes.every((h) => h.filled);
}

/**
 * Count remaining unfilled holes
 * @param {Array} holes - Array of hole objects
 * @returns {number}
 */
export function countRemaining(holes) {
    // Validate state structure
    if (!holes || !Array.isArray(holes)) {
        console.warn('HoleMode.countRemaining: Invalid holes array');
        return 0;
    }
    return holes.filter((h) => !h.filled).length;
}
