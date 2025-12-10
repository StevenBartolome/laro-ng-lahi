// GameRenderer.js - Rendering and drawing functions for multiplayer Jolen

import { MAX_DRAG_DISTANCE, images, drawMarble } from "./Common.js";

/**
 * GameRenderer handles all canvas drawing operations.
 * Separates rendering logic from game logic for cleaner code.
 */
export class GameRenderer {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.canvas = game.canvas;
    }

    /**
     * Main draw function - renders entire game state
     */
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        if (images.background.complete && images.background.naturalWidth > 0) {
            this.ctx.drawImage(images.background, 0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw mode specifics using the mode's draw function
        if (this.game.modeState && this.game.currentModeModule) {
            this.game.currentModeModule.draw(this.ctx, this.game.modeState);
        } else {
            // Debug: Show waiting message
            this.ctx.fillStyle = "white";
            this.ctx.font = "bold 24px Arial";
            this.ctx.textAlign = "center";
            this.ctx.fillText("Waiting for game to start...", this.canvas.width / 2, this.canvas.height / 2);
        }

        // Draw ALL player marbles (each with their own image)
        this.drawPlayerMarbles();

        // Draw drag line
        if (this.game.isDragging && this.game.gameState === "dragging") {
            this.drawDragLine();
        }

        // Draw message
        this.drawMessage();
    }

    /**
     * Draw all player marbles with name tags
     */
    drawPlayerMarbles() {
        this.game.players.forEach((player, playerIndex) => {
            const marble = this.game.playerMarbles[player.id];
            if (!marble) return;

            // Check if this is the current turn player
            const isCurrentTurnPlayer = player.id === this.game.currentTurnPlayerId;

            // Glow effect for current turn player when idle/dragging
            const shouldGlow = isCurrentTurnPlayer && (this.game.gameState === "idle" || this.game.gameState === "dragging");

            drawMarble(
                this.ctx,
                marble,
                shouldGlow,
                true,  // isPlayer = true
                playerIndex  // Player index for correct marble image (0-5)
            );

            // Draw player name tag above marble
            this.drawPlayerNameTag(player, marble, isCurrentTurnPlayer);
        });
    }

    /**
     * Draw player name tag above marble
     */
    drawPlayerNameTag(player, marble, isCurrentTurnPlayer) {
        this.ctx.save();
        const nameTag = player.name;
        const isCurrentUser = player.id === this.game.userId;

        // Background for name tag
        this.ctx.font = "bold 12px Arial";
        const textWidth = this.ctx.measureText(nameTag).width;
        const tagPadding = 4;
        const tagX = marble.x - textWidth / 2 - tagPadding;
        const tagY = marble.y - marble.radius - 20;

        // Draw background pill
        this.ctx.fillStyle = isCurrentTurnPlayer ? "rgba(76, 175, 80, 0.85)" : "rgba(62, 39, 35, 0.85)";
        this.ctx.beginPath();
        this.ctx.roundRect(tagX, tagY - 10, textWidth + tagPadding * 2, 16, 8);
        this.ctx.fill();

        // Draw border for current user
        if (isCurrentUser) {
            this.ctx.strokeStyle = "#FFD700";
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        // Draw name text
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(nameTag, marble.x, tagY - 2);
        this.ctx.restore();
    }

    /**
     * Draw drag line and trajectory indicator
     */
    drawDragLine() {
        if (!this.game.isDragging || this.game.gameState !== "dragging") return;
        if (!this.game.playerMarbles[this.game.userId]) return;

        const marble = this.game.playerMarbles[this.game.userId];
        this.ctx.save();

        const dx = this.game.dragCurrentX - marble.x;
        const dy = this.game.dragCurrentY - marble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const clampedDistance = Math.min(distance, MAX_DRAG_DISTANCE);

        // Draw drag line
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(marble.x, marble.y);
        this.ctx.lineTo(this.game.dragCurrentX, this.game.dragCurrentY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw trajectory line
        const trajectoryLength = clampedDistance * 1.5;
        const shootAngle = Math.atan2(-dy, -dx);
        const endX = marble.x + Math.cos(shootAngle) * trajectoryLength;
        const endY = marble.y + Math.sin(shootAngle) * trajectoryLength;

        this.ctx.strokeStyle = "rgba(255, 200, 0, 0.8)";
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(marble.x, marble.y);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw arrow head
        this.ctx.fillStyle = "rgba(255, 200, 0, 0.8)";
        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - 15 * Math.cos(shootAngle - Math.PI / 6),
            endY - 15 * Math.sin(shootAngle - Math.PI / 6)
        );
        this.ctx.lineTo(
            endX - 15 * Math.cos(shootAngle + Math.PI / 6),
            endY - 15 * Math.sin(shootAngle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fill();

        // Power UI
        this.drawPowerIndicator(marble, clampedDistance);

        this.ctx.restore();
    }

    /**
     * Draw power indicator around marble
     */
    drawPowerIndicator(marble, clampedDistance) {
        const powerPercent = (clampedDistance / MAX_DRAG_DISTANCE) * 100;
        this.ctx.strokeStyle =
            powerPercent > 75 ? "#f44336" : powerPercent > 50 ? "#FF9800" : "#4CAF50";
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(
            marble.x,
            marble.y,
            marble.radius + 5,
            0,
            Math.PI * 2
        );
        this.ctx.stroke();

        this.ctx.fillStyle = "white";
        this.ctx.strokeStyle = "black";
        this.ctx.lineWidth = 3;
        this.ctx.font = "bold 18px Arial";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        const powerText = `${Math.round(powerPercent)}%`;
        this.ctx.strokeText(powerText, marble.x, marble.y - 30);
        this.ctx.fillText(powerText, marble.x, marble.y - 30);
    }

    /**
     * Draw message overlay
     */
    drawMessage() {
        if (this.game.messageTimer > 0) {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            this.ctx.fillRect(0, this.canvas.height / 2 - 50, this.canvas.width, 100);
            this.ctx.fillStyle = "white";
            this.ctx.font = "bold 36px Arial";
            this.ctx.textAlign = "center";
            this.ctx.fillText(this.game.message, this.canvas.width / 2, this.canvas.height / 2 + 10);
        }
    }
}
