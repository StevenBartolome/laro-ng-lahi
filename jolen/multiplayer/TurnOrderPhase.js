// TurnOrderPhase.js - Handles turn order determination for circle mode
// Players shoot toward a line, closest to line goes first

import { MARBLE_RADIUS, PLAYER_COLOR, updateMarble } from "./Common.js";

/**
 * TurnOrderPhase manages the turn order determination mini-game
 * where players shoot marbles toward a target line to decide play order.
 */
export class TurnOrderPhase {
    constructor(game) {
        // Reference to main game for accessing shared state
        this.game = game;

        // Phase state
        this.isActive = false;
        this.results = {}; // { playerId: distanceToLine }
        this.playersCompleted = [];
        this.showingResult = false;
        this.resultTimer = 0;
        this.determinedOrder = [];

        // Settings
        this.lineY = 300; // Target line Y position
    }

    /**
     * Start the turn order determination phase
     */
    async start() {
        console.log('🎯 Starting turn order determination phase');

        this.isActive = true;
        this.results = {};
        this.playersCompleted = [];
        this.showingResult = false;

        // Position player marbles at bottom of screen with spacing
        const startY = this.game.canvas.height - 80;
        const spacing = 100;
        const totalWidth = (this.game.players.length - 1) * spacing;
        const startX = (this.game.canvas.width - totalWidth) / 2;

        this.game.players.forEach((player, index) => {
            this.game.playerMarbles[player.id] = {
                x: startX + index * spacing,
                y: startY,
                radius: MARBLE_RADIUS,
                vx: 0,
                vy: 0,
                color: PLAYER_COLOR,
                isMoving: false,
                hasShot: false
            };
        });

        // Hide mode selection, show game
        this.game.modeSelection.hide();
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.style.display = 'block';
        }

        // Sync to Firebase
        await this.game.firebaseSync.setSelectedMode('circle');
        await this.game.firebaseSync.updateGameState({
            turnOrderPhase: true,
            currentTurnPlayerId: this.game.players[0].id
        });
        await this.game.firebaseSync.updateAllPlayerMarbles(this.game.getPlayerMarblesForSync());

        // Set first player
        this.game.currentTurnPlayerId = this.game.players[0].id;
        this.game.isMyTurn = this.game.currentTurnPlayerId === this.game.userId;
        this.game.gameState = this.game.isMyTurn ? "idle" : "waiting";

        // Show instructions
        this.game.message = "Shoot toward the line! Closest goes first.";
        this.game.messageTimer = 120;

        // Update UI
        const playerName = this.game.playerNames[this.game.currentTurnPlayerId] || 'Unknown';
        this.game.ui.updateTurnIndicator(this.game.currentTurnPlayerId, playerName, this.game.isMyTurn);
    }

    /**
     * Update turn order phase physics
     * @returns {boolean} - True if any marble is still moving
     */
    updatePhysics() {
        if (!this.isActive || this.game.gameState !== "shooting") {
            return false;
        }

        let anyMoving = false;
        const currentMarble = this.game.playerMarbles[this.game.currentTurnPlayerId];

        if (currentMarble) {
            if (updateMarble(currentMarble, this.game.canvas.width, this.game.canvas.height)) {
                anyMoving = true;
            }

            // Sync if my turn
            if (this.game.isMyTurn && this.game.syncCounter % 5 === 0) {
                this.game.firebaseSync.updatePlayerMarble(this.game.userId, {
                    x: currentMarble.x,
                    y: currentMarble.y,
                    vx: currentMarble.vx,
                    vy: currentMarble.vy
                });
            }
        }

        if (!this.game.syncCounter) this.game.syncCounter = 0;
        this.game.syncCounter++;

        // Handle shot complete when marble stops
        if (!anyMoving && this.game.isMyTurn) {
            this.handleShotComplete();
        }

        return anyMoving;
    }

    /**
     * Handle when a player's shot is complete
     */
    async handleShotComplete() {
        if (!this.isActive) return;

        const marble = this.game.playerMarbles[this.game.userId];
        if (!marble) return;

        // Calculate distance to target line
        const distanceToLine = Math.abs(marble.y - this.lineY);
        this.results[this.game.userId] = distanceToLine;
        this.playersCompleted.push(this.game.userId);

        console.log(`📏 Turn order shot: ${this.game.playerNames[this.game.userId]} - distance: ${distanceToLine.toFixed(1)}px`);

        // Sync to Firebase
        await this.game.firebaseSync.updateGameState({
            turnOrderResults: this.results,
            playersCompletedTurnOrder: this.playersCompleted
        });

        // Check if all players done
        if (this.playersCompleted.length >= this.game.players.length) {
            await this.determineOrder();
        } else {
            // Move to next player
            const currentIndex = this.game.players.findIndex(p => p.id === this.game.userId);
            const nextIndex = (currentIndex + 1) % this.game.players.length;
            const nextPlayerId = this.game.players[nextIndex].id;

            await this.game.firebaseSync.updateGameState({
                currentTurnPlayerId: nextPlayerId
            });
        }

        this.game.gameState = "waiting";
    }

    /**
     * Determine final turn order based on distance to line
     */
    async determineOrder() {
        console.log('🏁 Determining turn order...');

        // Sort by distance (closest first)
        const sortedPlayers = Object.entries(this.results)
            .sort((a, b) => a[1] - b[1])
            .map(([playerId]) => playerId);

        this.determinedOrder = sortedPlayers;

        console.log('📋 Turn order determined:', sortedPlayers.map(id => this.game.playerNames[id]).join(' → '));

        // Show result
        this.showingResult = true;
        this.resultTimer = 180; // 3 seconds

        const orderNames = sortedPlayers.map((id, i) => `${i + 1}. ${this.game.playerNames[id]}`).join('\n');
        this.game.message = "Turn Order:\n" + orderNames;
        this.game.messageTimer = 180;

        // Sync if host
        if (this.game.isHost) {
            await this.game.firebaseSync.updateGameState({
                determinedTurnOrder: sortedPlayers,
                showingTurnOrderResult: true
            });
        }
    }

    /**
     * Transition to main game after showing results
     */
    async startMainGame() {
        console.log('🎮 Starting main circle game with determined turn order');

        this.isActive = false;
        this.showingResult = false;

        // Copy determined order to game
        this.game.determinedTurnOrder = this.determinedOrder;
        this.game.turnOrderPhase = false;
        this.game.showingTurnOrderResult = false;

        // Setup circle mode
        this.game.modeState = this.game.currentModeModule.setup(
            this.game.targetCount,
            this.game.canvas.width,
            this.game.canvas.height
        );

        // Reset marbles
        this.game.resetAllPlayerMarbles();

        // Set first player
        const firstPlayerId = this.determinedOrder[0];
        this.game.currentTurnPlayerId = firstPlayerId;
        this.game.isMyTurn = firstPlayerId === this.game.userId;
        this.game.gameState = this.game.isMyTurn ? "idle" : "waiting";

        // Update UI
        this.game.ui.updateTargetsRemaining(this.game.countRemainingTargets(), this.game.targetCount);
        const playerName = this.game.playerNames[firstPlayerId] || 'Unknown';
        this.game.ui.updateTurnIndicator(firstPlayerId, playerName, this.game.isMyTurn);

        // Sync if host
        if (this.game.isHost) {
            await this.game.firebaseSync.updateModeState(this.game.modeState);
            await this.game.firebaseSync.updateAllPlayerMarbles(this.game.getPlayerMarblesForSync());
            await this.game.firebaseSync.startGameWithMode('circle', this.game.targetCount);
            await this.game.firebaseSync.updateGameState({
                turnOrderPhase: false,
                currentTurnPlayerId: firstPlayerId,
                determinedTurnOrder: this.determinedOrder
            });
        }

        this.game.message = "Circle Mode: Knock marbles out!";
        this.game.messageTimer = 90;
    }

    /**
     * Update result timer (call from main game loop)
     */
    updateResultTimer() {
        if (this.showingResult) {
            this.resultTimer--;
            if (this.resultTimer <= 0 && this.game.isHost) {
                this.startMainGame();
            }
        }
    }

    /**
     * Sync state from Firebase (for non-host players)
     */
    syncFromFirebase(gameState) {
        if (gameState.turnOrderPhase) {
            this.isActive = true;
            this.results = gameState.turnOrderResults || {};
            this.playersCompleted = gameState.playersCompletedTurnOrder || [];

            if (gameState.showingTurnOrderResult) {
                this.showingResult = true;
                this.determinedOrder = gameState.determinedTurnOrder || [];

                const orderNames = this.determinedOrder.map((id, i) =>
                    `${i + 1}. ${this.game.playerNames[id]}`).join('\n');
                this.game.message = "Turn Order:\n" + orderNames;
                this.game.messageTimer = 180;
            }
        }

        // Handle transition
        if (!gameState.turnOrderPhase && this.isActive) {
            this.isActive = false;
            this.showingResult = false;
            if (gameState.determinedTurnOrder) {
                this.determinedOrder = gameState.determinedTurnOrder;
                this.game.determinedTurnOrder = gameState.determinedTurnOrder;
            }
        }
    }

    /**
     * Draw the turn order target line
     */
    draw(ctx) {
        if (!this.isActive && !this.showingResult) return;

        ctx.save();

        // Draw target line with glow
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 4;
        ctx.setLineDash([15, 10]);
        ctx.beginPath();
        ctx.moveTo(100, this.lineY);
        ctx.lineTo(this.game.canvas.width - 100, this.lineY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#FFD700";
        ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(100, this.lineY);
        ctx.lineTo(this.game.canvas.width - 100, this.lineY);
        ctx.stroke();

        // Label
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.fillText("◆ TARGET LINE ◆", this.game.canvas.width / 2, this.lineY - 20);

        // Distance markers
        if (Object.keys(this.results).length > 0) {
            Object.entries(this.results).forEach(([playerId, distance]) => {
                const marble = this.game.playerMarbles[playerId];
                if (marble) {
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
                    ctx.lineWidth = 1;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(marble.x, marble.y);
                    ctx.lineTo(marble.x, this.lineY);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    ctx.fillStyle = "white";
                    ctx.font = "12px Arial";
                    ctx.fillText(
                        `${distance.toFixed(0)}px`,
                        marble.x + 30,
                        (marble.y + this.lineY) / 2
                    );
                }
            });
        }

        // Instructions
        if (!this.showingResult) {
            ctx.fillStyle = "white";
            ctx.font = "bold 24px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText("Shoot your marble toward the line!", this.game.canvas.width / 2, 50);
            ctx.font = "18px Arial";
            ctx.fillText("The player whose marble lands closest goes first.", this.game.canvas.width / 2, 85);
        }

        ctx.restore();
    }
}
