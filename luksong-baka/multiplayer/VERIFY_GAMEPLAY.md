# How to Verify Gameplay Changes

## 1. Start Game
1. Host creates a lobby.
2. At least one other player joins.
3. Host starts game.

## 2. Verify Random Taya
- One player should see **"You are the Taya! 🐂"** on their screen.
- Other players should see **"Waiting for your turn..."** or active turn UI.
- The Taya badge (RED) should be visible next to the Taya's name in the player list.

## 3. Verify Turn Logic (Jumping)
- Active player (Jumper) executes a jump.
- **Success**:
  - Taya stays same.
  - Turn passes to next Jumper.
  - Taya is skipped in turn order.
- **Failure**:
  - Jumper sees "You are now the Baka!".
  - **Role Swap**: Failed Jumper becomes new Taya. Previous Taya becomes a Jumper.
  - New Taya cannot jump (spectator mode).
  - Old Taya is now in the rotation of Jumpers.

## 4. Verify No Lives
- Hearts/Lives should NOT be visible in the player panel.
- Hitting Baka results in immediate Role Swap, not just life loss.
