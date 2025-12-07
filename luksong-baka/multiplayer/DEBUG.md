# Debugging Steps for Multiplayer Lobby Issue

## Problem
"Lobby not found" error when starting multiplayer game

## Steps to Debug

1. **Open Browser Console (F12)** before starting

2. **Create a Lobby**
   - Go to Multiplayer Menu
   - Create lobby
   - Check console for:
     - "Firebase UID: ..." (should show a user ID)
     - Lobby creation messages

3. **Start the Game**
   - Click "I'm Ready!"
   - Watch console carefully
   - Look for these messages:
     ```
     === MULTIPLAYER INIT START ===
     URL params: ?lobby=...
     Lobby ID from URL: ...
     Waiting for Firebase auth...
     ✓ Authenticated as: ...
     Fetching lobby from Firebase...
     Lobby snapshot exists: true/false
     ```

4. **What to Check**
   - Does the lobby ID in URL match the one created?
   - Is Firebase auth persisting (same UID)?
   - Does "Lobby snapshot exists" show true or false?
   - If false, check "All lobbies in Firebase" output

5. **Common Issues**
   - **Different Firebase UID**: Auth not persisting → Clear browser cache
   - **Lobby ID mismatch**: Wrong URL parameter
   - **Lobby deleted**: Check if onDisconnect fired prematurely

## Console Commands to Try

In browser console, paste this to check Firebase state:
```javascript
// Check current auth
console.log('Current user:', firebase.auth().currentUser);

// Check lobby exists
firebase.database().ref('lobbies').once('value').then(snap => {
    console.log('All lobbies:', snap.val());
});
```

## Expected Flow

1. Multiplayer Menu: Sign in → Get UID (e.g., "abc123")
2. Create Lobby → Stored with hostId: "abc123"
3. Navigate to game → Should use SAME UID "abc123"
4. Fetch lobby → Should find it with matching hostId

If UIDs don't match, auth persistence is broken.
