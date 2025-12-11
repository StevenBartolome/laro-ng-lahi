/**
 * Client-Side Interpolation Module
 * 
 * Implements time-based position buffering and interpolation for smooth remote player movement.
 * Based on the approach described in:
 * - https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking
 * - https://developer.valvesoftware.com/wiki/Latency_Compensating_Methods_in_Client/Server_In-game_Protocol_Design_and_Optimization
 */

// Configuration Constants
export const INTERPOLATION_DELAY = 100; // ms - Render positions 100ms in the past
const MAX_BUFFER_SIZE = 10; // Keep last 10 position updates per entity

/**
 * Add a position update to an entity's buffer
 * @param {Object} entity - The entity (runner or tagger)
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} timestamp - Server timestamp
 */
export function addPositionUpdate(entity, x, y, timestamp) {
    if (!entity.positionBuffer) {
        entity.positionBuffer = [];
    }

    // Add new position to buffer
    entity.positionBuffer.push({ x, y, timestamp });

    // Sort by timestamp (handle out-of-order arrivals)
    entity.positionBuffer.sort((a, b) => a.timestamp - b.timestamp);

    // Maintain buffer size limit
    if (entity.positionBuffer.length > MAX_BUFFER_SIZE) {
        entity.positionBuffer.shift(); // Remove oldest
    }
}

/**
 * Get interpolated position for an entity at a specific render time
 * @param {Object} entity - The entity (runner or tagger)
 * @param {number} renderTime - Time to render (usually current time - INTERPOLATION_DELAY)
 * @returns {Object|null} - Interpolated position {x, y} or null if not enough data
 */
export function getInterpolatedPosition(entity, renderTime) {
    if (!entity.positionBuffer || entity.positionBuffer.length === 0) {
        return null; // No data yet
    }

    const buffer = entity.positionBuffer;

    // If only one position in buffer, use it
    if (buffer.length === 1) {
        return { x: buffer[0].x, y: buffer[0].y };
    }

    // Find the two positions that bracket the render time
    let olderUpdate = null;
    let newerUpdate = null;

    for (let i = 0; i < buffer.length - 1; i++) {
        if (buffer[i].timestamp <= renderTime && buffer[i + 1].timestamp >= renderTime) {
            olderUpdate = buffer[i];
            newerUpdate = buffer[i + 1];
            break;
        }
    }

    // If render time is before all buffered updates, use oldest
    if (renderTime < buffer[0].timestamp) {
        return { x: buffer[0].x, y: buffer[0].y };
    }

    // If render time is after all buffered updates, use newest
    if (renderTime > buffer[buffer.length - 1].timestamp) {
        const latest = buffer[buffer.length - 1];
        return { x: latest.x, y: latest.y };
    }

    // If we didn't find a bracket, use latest
    if (!olderUpdate || !newerUpdate) {
        const latest = buffer[buffer.length - 1];
        return { x: latest.x, y: latest.y };
    }

    // Interpolate between the two positions
    const timeDiff = renderTime - olderUpdate.timestamp;
    const timeRange = newerUpdate.timestamp - olderUpdate.timestamp;

    // Avoid division by zero
    if (timeRange === 0) {
        return { x: newerUpdate.x, y: newerUpdate.y };
    }

    const interpolationFactor = timeDiff / timeRange;

    // Linear interpolation
    const x = olderUpdate.x + (newerUpdate.x - olderUpdate.x) * interpolationFactor;
    const y = olderUpdate.y + (newerUpdate.y - olderUpdate.y) * interpolationFactor;

    return { x, y };
}

/**
 * Clear all buffered positions for an entity
 * @param {Object} entity - The entity (runner or tagger)
 */
export function clearPositionBuffer(entity) {
    if (entity.positionBuffer) {
        entity.positionBuffer.length = 0;
    }
}
