// InputHandler.js - Mouse and touch input handling for multiplayer Jolen

import { MAX_DRAG_DISTANCE, POWER_MULTIPLIER } from "./Common.js";

/**
 * InputHandler manages all mouse/touch input for the game.
 * Handles dragging mechanics for marble shooting.
 */
export class InputHandler {
    constructor(game) {
        this.game = game;
    }

    /**
     * Get mouse position relative to canvas, accounting for scaling
     */
    getMousePos(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        const scaleX = this.game.canvas.width / rect.width;
        const scaleY = this.game.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    }

    /**
     * Check if mouse is on current player's marble
     */
    isMouseOnMarble(mouseX, mouseY) {
        if (!this.game.playerMarbles[this.game.userId]) return false;

        const marble = this.game.playerMarbles[this.game.userId];
        const dx = mouseX - marble.x;
        const dy = mouseY - marble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= marble.radius + 10;
    }

    /**
     * Handle mouse down event - start dragging
     */
    handleMouseDown(e) {
        if (!this.game.isMyTurn || this.game.gameState !== "idle") return;

        const pos = this.getMousePos(e);
        if (this.isMouseOnMarble(pos.x, pos.y)) {
            this.game.isDragging = true;
            this.game.dragStartX = pos.x;
            this.game.dragStartY = pos.y;
            this.game.dragCurrentX = pos.x;
            this.game.dragCurrentY = pos.y;
            this.game.gameState = "dragging";
        }
    }

    /**
     * Handle mouse move event - update drag position
     */
    handleMouseMove(e) {
        if (!this.game.isDragging || this.game.gameState !== "dragging") return;
        const pos = this.getMousePos(e);
        this.game.dragCurrentX = pos.x;
        this.game.dragCurrentY = pos.y;
    }

    /**
     * Handle mouse up event - shoot marble
     */
    async handleMouseUp(e) {
        if (!this.game.isDragging || this.game.gameState !== "dragging" || !this.game.isMyTurn) return;
        if (!this.game.playerMarbles[this.game.userId]) return;

        const marble = this.game.playerMarbles[this.game.userId];
        const dx = this.game.dragCurrentX - marble.x;
        const dy = this.game.dragCurrentY - marble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            const clampedDistance = Math.min(distance, MAX_DRAG_DISTANCE);
            const power = clampedDistance * POWER_MULTIPLIER;
            const angle = Math.atan2(-dy, -dx);

            marble.vx = Math.cos(angle) * power;
            marble.vy = Math.sin(angle) * power;
            marble.isMoving = true;
            this.game.gameState = "shooting";

            // Sync marble state
            await this.game.firebaseSync.updatePlayerMarble(this.game.userId, {
                x: marble.x,
                y: marble.y,
                vx: marble.vx,
                vy: marble.vy
            });
        } else {
            this.game.gameState = "idle";
        }

        this.game.isDragging = false;
    }

    /**
     * Setup canvas input event listeners
     */
    setupListeners() {
        this.game.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
        this.game.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
        this.game.canvas.addEventListener("mouseup", (e) => this.handleMouseUp(e));
        this.game.canvas.addEventListener("mouseleave", (e) => this.handleMouseUp(e));
    }
}
