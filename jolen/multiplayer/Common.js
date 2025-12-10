// Common.js - Multiplayer version with corrected asset paths
// Re-exports everything from the single-player Common.js except loadAssets and drawMarble

// Import values so they are available locally in this file
import {
    FRICTION,
    MARBLE_RADIUS,
    PLAYER_COLOR,
    TARGET_COLOR,
    MAX_DRAG_DISTANCE,
    POWER_MULTIPLIER,
    COLLISION_ELASTICITY,
    CIRCLE_RADIUS,
    distance,
    checkMarbleCollision,
    updateMarble
    // NOT importing drawMarble - we create our own below
} from "../js/Common.js";

// Re-export for other modules
export {
    FRICTION,
    MARBLE_RADIUS,
    PLAYER_COLOR,
    TARGET_COLOR,
    MAX_DRAG_DISTANCE,
    POWER_MULTIPLIER,
    COLLISION_ELASTICITY,
    CIRCLE_RADIUS,
    distance,
    checkMarbleCollision,
    updateMarble
};

// Images object - now with 6 player marbles!
export const images = {
    background: new Image(),
    playerMarbles: [
        new Image(), // player_marble.png
        new Image(), // player2_marble.png
        new Image(), // player3_marble.png
        new Image(), // player4_marble.png
        new Image(), // player5_marble.png
        new Image(), // player6_marble.png
    ],
    targetMarbleRed: new Image(),
    targetMarbleGreen: new Image(),
    targetMarbleYellow: new Image(),
};

// loadAssets with corrected paths for multiplayer folder
export function loadAssets() {
    return new Promise((resolve) => {
        let assetsLoaded = 0;
        const totalAssets = 10; // 1 background + 6 player marbles + 3 target marbles

        function onAssetLoad() {
            assetsLoaded++;
            console.log(`Loaded ${assetsLoaded}/${totalAssets} assets`);
            if (assetsLoaded === totalAssets) {
                console.log("All jolen assets loaded!");
                resolve();
            }
        }

        images.background.onload = onAssetLoad;

        // Load all 6 player marbles
        images.playerMarbles.forEach((img) => {
            img.onload = onAssetLoad;
        });

        images.targetMarbleRed.onload = onAssetLoad;
        images.targetMarbleGreen.onload = onAssetLoad;
        images.targetMarbleYellow.onload = onAssetLoad;

        // Corrected paths for multiplayer folder (go up two levels)
        images.background.src = "../../assets/jolen_assets/game_background.png";

        // Load all 6 player marbles
        images.playerMarbles[0].src = "../../assets/jolen_assets/player_marble.png";
        images.playerMarbles[1].src = "../../assets/jolen_assets/player2_marble.png";
        images.playerMarbles[2].src = "../../assets/jolen_assets/player3_marble.png";
        images.playerMarbles[3].src = "../../assets/jolen_assets/player4_marble.png";
        images.playerMarbles[4].src = "../../assets/jolen_assets/player5_marble.png";
        images.playerMarbles[5].src = "../../assets/jolen_assets/player6_marble.png";

        images.targetMarbleRed.src = "../../assets/jolen_assets/target_marble_red.png";
        images.targetMarbleGreen.src = "../../assets/jolen_assets/target_marble_green.png";
        images.targetMarbleYellow.src = "../../assets/jolen_assets/target_marble_yellow.png";
    });
}

// Custom drawMarble function that uses our local images object
// playerIndex: 0-5 for which player marble to use (0 = player1, 1 = player2, etc.)
export function drawMarble(ctx, marble, glow = false, isPlayer = false, playerIndex = 0) {
    // Validate marble data to prevent non-finite errors during mode transitions
    if (!marble || !isFinite(marble.x) || !isFinite(marble.y) || !isFinite(marble.radius) || marble.radius <= 0) {
        return; // Skip drawing invalid marbles
    }

    ctx.save();

    // Draw glow effect
    if (glow) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = marble.color || PLAYER_COLOR;
    }

    // Determine which image to use
    let marbleImage = null;
    if (isPlayer) {
        // Use player-specific marble based on index (0-5)
        const index = Math.max(0, Math.min(5, playerIndex)); // Clamp to 0-5
        marbleImage = images.playerMarbles[index];
    } else if (marble.colorIndex !== undefined) {
        switch (marble.colorIndex) {
            case 0:
                marbleImage = images.targetMarbleRed;
                break;
            case 1:
                marbleImage = images.targetMarbleGreen;
                break;
            case 2:
                marbleImage = images.targetMarbleYellow;
                break;
        }
    }

    // Draw marble with image if loaded, otherwise use gradient
    if (marbleImage && marbleImage.complete && marbleImage.naturalWidth > 0) {
        const size = marble.radius * 2;
        ctx.drawImage(
            marbleImage,
            marble.x - marble.radius,
            marble.y - marble.radius,
            size,
            size
        );
    } else {
        // Fallback to gradient rendering
        const gradient = ctx.createRadialGradient(
            marble.x - marble.radius / 3,
            marble.y - marble.radius / 3,
            marble.radius / 4,
            marble.x,
            marble.y,
            marble.radius
        );
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
        gradient.addColorStop(0.4, marble.color || PLAYER_COLOR);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(marble.x, marble.y, marble.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.beginPath();
        ctx.arc(
            marble.x - marble.radius / 3,
            marble.y - marble.radius / 3,
            marble.radius / 3,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Draw outline
        ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(marble.x, marble.y, marble.radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}
