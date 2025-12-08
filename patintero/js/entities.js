import { runners, taggers, gameState, CONFIG, DIFFICULTY } from './config.js';

/**
 * Create a DOM element for an entity (runner or tagger)
 */
export function createEntity(className, labelText, x, y, entityType) {
    const div = document.createElement('div');
    div.className = className;
    div.style.left = `${x}px`;
    div.style.top = `${y}px`;

    // Randomly select a player head image (1, 2, or 3)
    const randomHead = Math.floor(Math.random() * 3) + 1;
    const headImage = `../assets/patintero_assets/player_head ${randomHead}.png`;

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
 */
export function createRunner(type, x, y) {
    const field = document.getElementById('field');
    const runnerIndex = runners.length;
    const label = type === 'player' ? `R${runnerIndex + 1} (YOU)` : `R${runnerIndex + 1}`;

    const runner = {
        id: runnerIndex,
        type: type,
        x: x,
        y: y,
        active: true,
        reachedBottom: false,
        el: createEntity(type === 'player' ? 'entity runner' : 'entity runner bot', label, x, y, 'runner')
    };

    if (type === 'player') {
        runner.el.style.border = '4px solid #FFD700'; // Gold border for player
        runner.el.style.zIndex = '20';
        gameState.playerControlledRunner = runnerIndex;
    }

    field.appendChild(runner.el);
    runners.push(runner);
}

/**
 * Create a tagger entity
 */
export function createTagger(id, type, fixedPos, diff, controller) {
    const field = document.getElementById('field');
    const x = field.offsetWidth / 2;
    const y = type === 'vertical' ? field.offsetHeight / 2 : fixedPos;
    const label = controller === 'player' ? `T${id} (YOU)` : `T${id}`;

    const taggerObj = {
        id: id,
        type: type,
        controller: controller, // 'player' or 'bot'
        x: x,
        y: y,
        speed: diff.speed,
        baseSpeed: diff.speed,
        direction: Math.random() < 0.5 ? 1 : -1,
        fixedPos: fixedPos,
        resp: diff.resp,
        speedMult: diff.speedMult
    };

    // Visual distinction for Player Tagger if needed
    const className = controller === 'player' ? 'entity tagger player-tagger' : 'entity tagger';
    taggerObj.el = createEntity(className, label, x, y, 'tagger');

    if (controller === 'player') {
        taggerObj.el.style.border = '4px solid #FFD700'; // Gold border for player tagger
        taggerObj.el.style.zIndex = '20';
        gameState.playerControlledTagger = taggers.length; // Set index before pushing
    }

    field.appendChild(taggerObj.el);
    taggers.push(taggerObj);
}
