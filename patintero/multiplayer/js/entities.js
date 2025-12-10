import { runners, taggers, gameState, CONFIG, DIFFICULTY } from './config.js';

/**
 * Create a DOM element for an entity (runner or tagger)
 */
export function createEntity(className, labelText, x, y, entityType, specificHeadIndex = null) {
    const div = document.createElement('div');
    div.className = className;
    div.style.left = `${x}px`;
    div.style.top = `${y}px`;

    // Use specific head if provided (for multiplayer sync), otherwise random
    const randomHead = specificHeadIndex || Math.floor(Math.random() * 3) + 1;
    const headImage = `../../assets/patintero_assets/player_head ${randomHead}.png`;

    // Set the background image for this specific entity
    div.style.backgroundImage = `url('${headImage}')`;
    div.style.backgroundSize = 'cover';
    div.style.backgroundRepeat = 'no-repeat';
    div.style.backgroundPosition = 'center';

    // Add label if provided
    if (labelText) {
        const label = document.createElement('div');
        label.className = 'entity-label';
        label.textContent = labelText;
        label.style.position = 'absolute';
        label.style.top = '-25px';
        label.style.left = '50%';
        label.style.transform = 'translateX(-50%)';
        label.style.fontSize = '12px';
        label.style.fontWeight = 'bold';
        label.style.color = '#fff';
        label.style.background = 'rgba(0,0,0,0.7)';
        label.style.padding = '2px 6px';
        label.style.borderRadius = '3px';
        label.style.whiteSpace = 'nowrap';
        label.style.pointerEvents = 'none';
        div.appendChild(label);
    }

    return div;
}

/**
 * Create a runner entity
 * @param {string} type - 'player', 'bot', or 'remote'
 * @param {number} x - Starting X position
 * @param {number} y - Starting Y position
 * @param {number|null} headIndex - Character head variant
 * @param {string|null} playerName - Display name
 * @param {string|null} playerId - Firebase player ID (for remote sync)
 */
export function createRunner(type, x, y, headIndex = null, playerName = null, playerId = null) {
    const field = document.getElementById('field');
    const runnerIndex = runners.length;

    // Use player name if provided (for multiplayer), otherwise default labels
    let label;
    if (playerName) {
        label = type === 'player' ? `${playerName} (YOU)` : playerName;
    } else {
        label = type === 'player' ? `R${runnerIndex + 1} (YOU)` : `R${runnerIndex + 1}`;
    }

    const runner = {
        id: runnerIndex,
        type: type,
        x: x,
        y: y,
        active: true,
        reachedBottom: false,
        remotePlayerId: playerId, // For syncing remote players
        el: createEntity(type === 'player' ? 'entity runner' : (type === 'remote' ? 'entity runner remote-player' : 'entity runner bot'), label, x, y, 'runner', headIndex)
    };

    if (type === 'player') {
        runner.el.classList.add('player-controlled');
        runner.el.style.zIndex = '20';

        // Add indicator
        const indicator = document.createElement('div');
        indicator.className = 'player-indicator';
        runner.el.appendChild(indicator);

        gameState.playerControlledRunner = runnerIndex;
    } else if (type === 'remote') {
        // Remote player (synced from Firebase)
        runner.el.classList.add('remote-entity');
        // Visual indicator for remote players
        const indicator = document.createElement('div');
        indicator.className = 'remote-indicator';
        runner.el.appendChild(indicator);
    } else {
        // Bot entity
        const isEnemy = gameState.currentRole === 'tagger';
        if (isEnemy) {
            runner.el.classList.add('enemy-entity');
            const indicator = document.createElement('div');
            indicator.className = 'enemy-indicator';
            runner.el.appendChild(indicator);
        }
    }

    field.appendChild(runner.el);
    runners.push(runner);
}

/**
 * Create a tagger entity
 * @param {number} id - Tagger ID
 * @param {string} type - 'vertical' or 'horizontal'
 * @param {number} fixedPos - Fixed position for horizontal taggers
 * @param {object} diff - Difficulty settings
 * @param {string} controller - 'player', 'bot', or 'remote'
 * @param {number|null} headIndex - Character head variant
 * @param {string|null} playerName - Display name
 * @param {string|null} playerId - Firebase player ID (for remote sync)
 */
export function createTagger(id, type, fixedPos, diff, controller, headIndex = null, playerName = null, playerId = null) {
    const field = document.getElementById('field');
    const x = field.offsetWidth / 2;
    const y = type === 'vertical' ? field.offsetHeight / 2 : fixedPos;

    // Use player name if provided (for multiplayer), otherwise default labels
    let label;
    if (playerName) {
        label = controller === 'player' ? `${playerName} (YOU)` : playerName;
    } else {
        label = controller === 'player' ? `T${id} (YOU)` : `T${id}`;
    }

    const taggerObj = {
        id: id,
        type: type,
        controller: controller, // 'player', 'bot', or 'remote'
        x: x,
        y: y,
        speed: diff.speed,
        baseSpeed: diff.speed,
        direction: Math.random() < 0.5 ? 1 : -1,
        fixedPos: fixedPos,
        resp: diff.resp,
        speedMult: diff.speedMult,
        remotePlayerId: playerId // For syncing remote players
    };

    // Visual distinction for Player Tagger if needed
    const className = controller === 'player' ? 'entity tagger player-tagger' : 'entity tagger';
    taggerObj.el = createEntity(className, label, x, y, 'tagger', headIndex);

    if (controller === 'player') {
        taggerObj.el.classList.add('player-tagger');
        taggerObj.el.style.zIndex = '20';

        // Add indicator
        const indicator = document.createElement('div');
        indicator.className = 'player-indicator';
        taggerObj.el.appendChild(indicator);

        gameState.playerControlledTagger = taggers.length; // Set index before pushing
    } else if (controller === 'remote') {
        // Remote player (synced from Firebase)
        taggerObj.el.classList.add('remote-entity');
        const indicator = document.createElement('div');
        indicator.className = 'remote-indicator';
        taggerObj.el.appendChild(indicator);
    } else {
        // Bot entity
        const isEnemy = gameState.currentRole === 'runner';
        if (isEnemy) {
            taggerObj.el.classList.add('enemy-entity');
            const indicator = document.createElement('div');
            indicator.className = 'enemy-indicator';
            taggerObj.el.appendChild(indicator);
        }
    }

    field.appendChild(taggerObj.el);
    taggers.push(taggerObj);
}
