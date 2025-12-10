// ModeSelection.js - Handles mode selection for multiplayer
export class ModeSelection {
    constructor() {
        this.selectedMode = 'target'; // Default mode
        this.targetCount = 6; // Default target count (6-10)
        this.onModeSelected = null; // Callback when mode is confirmed
    }

    // Show mode selection screen
    show(isHost) {
        const modeScreen = document.getElementById('modeSelectionScreen');
        const hostMessage = document.getElementById('hostSelectionMessage');
        const startBtn = document.getElementById('startGameBtn');
        const targetCountSelector = document.getElementById('targetCountSelector');
        const targetCountInput = document.getElementById('targetCountInput');
        const targetCountDisplay = document.querySelector('.target-count-display');
        const modeSelectionSection = document.getElementById('modeSelectionSection');
        const currentModeDisplay = document.getElementById('currentModeSelectionDisplay');
        const selectModeHeader = document.getElementById('selectModeHeader');

        modeScreen.classList.remove('hidden');

        // Setup mode buttons
        const modeButtons = document.querySelectorAll('#modeSelectionScreen .mode-btn');

        if (!isHost) {
            // Non-host: show current mode display, hide selection section
            currentModeDisplay.style.display = 'flex';
            modeSelectionSection.style.display = 'none';
            hostMessage.textContent = 'Waiting for host to select mode...';
            startBtn.style.display = 'none';
            targetCountSelector.style.display = 'none';
        } else {
            // Host: show selection section, hide current mode display
            currentModeDisplay.style.display = 'none';
            modeSelectionSection.style.display = 'block';
            hostMessage.textContent = 'Select a game mode to start';
            targetCountSelector.style.display = 'flex';

            // Handle target count input
            targetCountInput.addEventListener('input', () => {
                this.targetCount = parseInt(targetCountInput.value);
                targetCountDisplay.textContent = `${this.targetCount} targets`;
            });

            modeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const mode = btn.dataset.mode;
                    this.selectMode(mode);
                });
            });

            // Select default mode (target)
            this.selectMode('target');
        }
    }

    // Select a mode (host only)
    selectMode(mode) {
        this.selectedMode = mode;

        // Highlight selected mode
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.mode === mode) {
                btn.classList.add('selected');
            }
        });

        // Show start button
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) {
            startBtn.style.display = 'block';
            startBtn.onclick = () => {
                if (this.onModeSelected) {
                    // Pass both mode and targetCount to callback
                    this.onModeSelected(this.selectedMode, this.targetCount);
                }
            };
        }
    }

    // Hide mode selection screen
    hide() {
        const modeScreen = document.getElementById('modeSelectionScreen');
        modeScreen.classList.add('hidden');
    }

    // Update display for non-host when host selects mode
    showSelectedMode(mode) {
        const modeButtons = document.querySelectorAll('#modeSelectionScreen .mode-btn');
        modeButtons.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.mode === mode) {
                btn.classList.add('selected');
            }
        });

        // Update current mode display for non-host
        const currentModeDisplay = document.getElementById('currentModeSelectionDisplay');
        const selectedModeText = document.getElementById('selectedModeText');
        const modeIcon = currentModeDisplay.querySelector('.mode-icon');

        if (currentModeDisplay && selectedModeText && modeIcon) {
            const modeNames = {
                'target': 'Target',
                'circle': 'Circle',
                'hole': 'Hole',
                'line': 'Line'
            };
            const modeIcons = {
                'target': '🎯',
                'circle': '⭕',
                'hole': '🕳️',
                'line': '📏'
            };

            selectedModeText.textContent = modeNames[mode];
            modeIcon.textContent = modeIcons[mode];
        }

        const hostMessage = document.getElementById('hostSelectionMessage');
        if (hostMessage) {
            const modeNames = {
                'target': 'Target',
                'circle': 'Circle',
                'hole': 'Hole',
                'line': 'Line'
            };
            hostMessage.textContent = `Host selected: ${modeNames[mode]}. Starting game...`;
        }
    }
}
