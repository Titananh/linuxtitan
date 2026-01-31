/**
 * Minecraft Clone - Basic Edition
 * A simple voxel-based game built with HTML5 Canvas
 */

// ==================== GAME CONFIGURATION ====================
const CONFIG = {
    BLOCK_SIZE: 40,
    WORLD_WIDTH: 16,
    WORLD_HEIGHT: 8,
    WORLD_DEPTH: 16,
    PLAYER_HEIGHT: 1.8,
    PLAYER_SPEED: 0.1,
    PLAYER_SNEAK_SPEED: 0.05,
    JUMP_FORCE: 0.15,
    GRAVITY: 0.008,
    MOUSE_SENSITIVITY: 0.002,
    REACH_DISTANCE: 5,
    RENDER_DISTANCE: 20,
    FOV: Math.PI / 3, // 60 degrees
};

// Block types with colors
const BLOCK_TYPES = {
    air: { color: null, transparent: true },
    grass: { color: '#4a7c23', topColor: '#4a7c23', sideColor: '#8b5a2b', transparent: false },
    dirt: { color: '#8b5a2b', transparent: false },
    stone: { color: '#808080', transparent: false },
    wood: { color: '#8b4513', transparent: false },
    leaves: { color: '#228b22', transparent: true },
    sand: { color: '#f4d03f', transparent: false },
    water: { color: 'rgba(52, 152, 219, 0.7)', transparent: true },
    brick: { color: '#a0522d', transparent: false },
    cobblestone: { color: '#696969', transparent: false },
    bedrock: { color: '#1a1a1a', transparent: false },
};

// ==================== GAME STATE ====================
const gameState = {
    player: {
        x: CONFIG.WORLD_WIDTH / 2,
        y: CONFIG.WORLD_HEIGHT + 2,
        z: CONFIG.WORLD_DEPTH / 2,
        yaw: 0,      // Horizontal rotation
        pitch: 0,    // Vertical rotation
        velocityY: 0,
        isOnGround: false,
    },
    world: [],
    selectedBlock: 'grass',
    isPointerLocked: false,
    keys: {},
};

// ==================== CANVAS SETUP ====================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ==================== WORLD GENERATION ====================
function initWorld() {
    gameState.world = [];
    
    for (let x = 0; x < CONFIG.WORLD_WIDTH; x++) {
        gameState.world[x] = [];
        for (let y = 0; y < CONFIG.WORLD_HEIGHT; y++) {
            gameState.world[x][y] = [];
            for (let z = 0; z < CONFIG.WORLD_DEPTH; z++) {
                gameState.world[x][y][z] = 'air';
            }
        }
    }
    
    // Generate terrain with simple noise
    for (let x = 0; x < CONFIG.WORLD_WIDTH; x++) {
        for (let z = 0; z < CONFIG.WORLD_DEPTH; z++) {
            // Simple height variation
            const height = Math.floor(3 + Math.sin(x * 0.5) * 1.5 + Math.cos(z * 0.5) * 1.5);
            
            for (let y = 0; y < height && y < CONFIG.WORLD_HEIGHT; y++) {
                if (y === 0) {
                    gameState.world[x][y][z] = 'bedrock';
                } else if (y === height - 1) {
                    gameState.world[x][y][z] = 'grass';
                } else if (y > height - 4) {
                    gameState.world[x][y][z] = 'dirt';
                } else {
                    gameState.world[x][y][z] = 'stone';
                }
            }
        }
    }
    
    // Add some trees
    addTree(4, 6);
    addTree(10, 4);
    addTree(7, 12);
    addTree(13, 10);
}

function addTree(x, z) {
    if (x < 2 || x >= CONFIG.WORLD_WIDTH - 2 || z < 2 || z >= CONFIG.WORLD_DEPTH - 2) return;
    
    // Find ground level
    let groundY = 0;
    for (let y = CONFIG.WORLD_HEIGHT - 1; y >= 0; y--) {
        if (gameState.world[x][y][z] !== 'air') {
            groundY = y + 1;
            break;
        }
    }
    
    if (groundY + 5 >= CONFIG.WORLD_HEIGHT) return;
    
    // Trunk
    for (let h = 0; h < 4; h++) {
        if (groundY + h < CONFIG.WORLD_HEIGHT) {
            gameState.world[x][groundY + h][z] = 'wood';
        }
    }
    
    // Leaves
    const leavesY = groundY + 3;
    for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
            for (let dy = 0; dy <= 2; dy++) {
                const nx = x + dx;
                const ny = leavesY + dy;
                const nz = z + dz;
                
                if (nx >= 0 && nx < CONFIG.WORLD_WIDTH &&
                    ny >= 0 && ny < CONFIG.WORLD_HEIGHT &&
                    nz >= 0 && nz < CONFIG.WORLD_DEPTH) {
                    
                    const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy);
                    if (dist <= 3 && gameState.world[nx][ny][nz] === 'air') {
                        gameState.world[nx][ny][nz] = 'leaves';
                    }
                }
            }
        }
    }
}

// ==================== BLOCK OPERATIONS ====================
function getBlock(x, y, z) {
    x = Math.floor(x);
    y = Math.floor(y);
    z = Math.floor(z);
    
    if (x < 0 || x >= CONFIG.WORLD_WIDTH ||
        y < 0 || y >= CONFIG.WORLD_HEIGHT ||
        z < 0 || z >= CONFIG.WORLD_DEPTH) {
        return 'air';
    }
    
    return gameState.world[x][y][z];
}

function setBlock(x, y, z, type) {
    x = Math.floor(x);
    y = Math.floor(y);
    z = Math.floor(z);
    
    if (x < 0 || x >= CONFIG.WORLD_WIDTH ||
        y < 0 || y >= CONFIG.WORLD_HEIGHT ||
        z < 0 || z >= CONFIG.WORLD_DEPTH) {
        return false;
    }
    
    // Don't allow breaking bedrock
    if (gameState.world[x][y][z] === 'bedrock' && type === 'air') {
        return false;
    }
    
    gameState.world[x][y][z] = type;
    return true;
}

// Raycasting to find block player is looking at
function raycast() {
    const { player } = gameState;
    const step = 0.1;
    
    for (let t = 0; t < CONFIG.REACH_DISTANCE; t += step) {
        const x = player.x + Math.sin(player.yaw) * Math.cos(player.pitch) * t;
        const y = player.y - Math.sin(player.pitch) * t;
        const z = player.z + Math.cos(player.yaw) * Math.cos(player.pitch) * t;
        
        const block = getBlock(x, y, z);
        if (block !== 'air') {
            // Get previous position for placing
            const prevX = player.x + Math.sin(player.yaw) * Math.cos(player.pitch) * (t - step);
            const prevY = player.y - Math.sin(player.pitch) * (t - step);
            const prevZ = player.z + Math.cos(player.yaw) * Math.cos(player.pitch) * (t - step);
            
            return {
                hit: { x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) },
                place: { x: Math.floor(prevX), y: Math.floor(prevY), z: Math.floor(prevZ) },
                block: block
            };
        }
    }
    
    return null;
}

// ==================== PLAYER PHYSICS ====================
function updatePlayer() {
    const { player, keys } = gameState;
    
    // Movement (Shift = sneak/slow)
    const speed = keys['ShiftLeft'] ? CONFIG.PLAYER_SNEAK_SPEED : CONFIG.PLAYER_SPEED;
    let dx = 0, dz = 0;
    
    if (keys['KeyW']) {
        dx += Math.sin(player.yaw) * speed;
        dz += Math.cos(player.yaw) * speed;
    }
    if (keys['KeyS']) {
        dx -= Math.sin(player.yaw) * speed;
        dz -= Math.cos(player.yaw) * speed;
    }
    if (keys['KeyA']) {
        dx += Math.sin(player.yaw - Math.PI / 2) * speed;
        dz += Math.cos(player.yaw - Math.PI / 2) * speed;
    }
    if (keys['KeyD']) {
        dx += Math.sin(player.yaw + Math.PI / 2) * speed;
        dz += Math.cos(player.yaw + Math.PI / 2) * speed;
    }
    
    // Apply horizontal movement with collision
    const newX = player.x + dx;
    const newZ = player.z + dz;
    
    // Simple collision detection
    if (!checkCollision(newX, player.y, player.z)) {
        player.x = newX;
    }
    if (!checkCollision(player.x, player.y, newZ)) {
        player.z = newZ;
    }
    
    // Jumping
    if (keys['Space'] && player.isOnGround) {
        player.velocityY = CONFIG.JUMP_FORCE;
        player.isOnGround = false;
    }
    
    // Gravity
    player.velocityY -= CONFIG.GRAVITY;
    const newY = player.y + player.velocityY;
    
    // Vertical collision
    if (checkCollision(player.x, newY, player.z)) {
        if (player.velocityY < 0) {
            player.isOnGround = true;
        }
        player.velocityY = 0;
    } else {
        player.y = newY;
        player.isOnGround = false;
    }
    
    // Prevent falling through world
    if (player.y < 1) {
        player.y = 1;
        player.velocityY = 0;
        player.isOnGround = true;
    }
    
    // Update position display
    document.getElementById('position').textContent = 
        `${player.x.toFixed(1)}, ${player.y.toFixed(1)}, ${player.z.toFixed(1)}`;
}

function checkCollision(x, y, z) {
    // Check feet and head
    const feetY = y - CONFIG.PLAYER_HEIGHT;
    
    for (let checkY = feetY; checkY <= y; checkY += 0.5) {
        if (getBlock(x, checkY, z) !== 'air' &&
            !BLOCK_TYPES[getBlock(x, checkY, z)].transparent) {
            return true;
        }
    }
    
    return false;
}

// Check if player is occupying a specific block position
function isPlayerOccupyingBlock(blockX, blockY, blockZ) {
    const { player } = gameState;
    const playerBlockX = Math.floor(player.x);
    const playerBlockY = Math.floor(player.y);
    const playerFeetY = Math.floor(player.y - CONFIG.PLAYER_HEIGHT);
    const playerBlockZ = Math.floor(player.z);
    
    return blockX === playerBlockX && 
           blockZ === playerBlockZ &&
           (blockY === playerBlockY || blockY === playerFeetY);
}

// ==================== RENDERING ====================
function render() {
    const { player } = gameState;
    
    // Clear canvas with sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#B0E0E6');
    gradient.addColorStop(1, '#E0F7FA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Collect and sort visible blocks by distance
    const visibleBlocks = [];
    
    for (let x = 0; x < CONFIG.WORLD_WIDTH; x++) {
        for (let y = 0; y < CONFIG.WORLD_HEIGHT; y++) {
            for (let z = 0; z < CONFIG.WORLD_DEPTH; z++) {
                const block = gameState.world[x][y][z];
                if (block === 'air') continue;
                
                // Calculate distance from player
                const dx = x + 0.5 - player.x;
                const dy = y + 0.5 - player.y;
                const dz = z + 0.5 - player.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                // Skip blocks too far away
                if (dist > CONFIG.RENDER_DISTANCE) continue;
                
                visibleBlocks.push({ x, y, z, block, dist });
            }
        }
    }
    
    // Sort by distance (far to near for correct overlap)
    visibleBlocks.sort((a, b) => b.dist - a.dist);
    
    // Render blocks
    for (const { x, y, z, block } of visibleBlocks) {
        renderBlock(x, y, z, block);
    }
    
    // Highlight targeted block
    const target = raycast();
    if (target) {
        renderBlockOutline(target.hit.x, target.hit.y, target.hit.z);
    }
}

function renderBlock(blockX, blockY, blockZ, blockType) {
    const { player } = gameState;
    const blockData = BLOCK_TYPES[blockType];
    
    if (!blockData || !blockData.color) return;
    
    // Calculate block center relative to player
    const dx = (blockX + 0.5 - player.x);
    const dy = (blockY + 0.5 - player.y);
    const dz = (blockZ + 0.5 - player.z);
    
    // Rotate around Y axis (yaw)
    const cosYaw = Math.cos(-player.yaw);
    const sinYaw = Math.sin(-player.yaw);
    const rx = dx * cosYaw - dz * sinYaw;
    const rz = dx * sinYaw + dz * cosYaw;
    
    // Rotate around X axis (pitch)
    const cosPitch = Math.cos(player.pitch);
    const sinPitch = Math.sin(player.pitch);
    const ry = dy * cosPitch - rz * sinPitch;
    const finalZ = dy * sinPitch + rz * cosPitch;
    
    // Don't render blocks behind the player
    if (finalZ <= 0.5) return;
    
    // Project to screen
    const fov = CONFIG.FOV;
    const scale = canvas.height / (2 * Math.tan(fov / 2));
    
    const screenX = canvas.width / 2 + (rx / finalZ) * scale;
    const screenY = canvas.height / 2 - (ry / finalZ) * scale;
    const blockSize = (1 / finalZ) * scale;
    
    // Skip if off screen
    if (screenX + blockSize < 0 || screenX - blockSize > canvas.width ||
        screenY + blockSize < 0 || screenY - blockSize > canvas.height) {
        return;
    }
    
    // Draw block faces
    const halfSize = blockSize / 2;
    
    // Draw faces (simple cube rendering)
    ctx.save();
    
    // Main face (simplified - just a colored rectangle with 3D effect)
    const gradient3d = ctx.createLinearGradient(
        screenX - halfSize, screenY - halfSize,
        screenX + halfSize, screenY + halfSize
    );
    
    // Add 3D shading
    const baseColor = blockData.color;
    gradient3d.addColorStop(0, lightenColor(baseColor, 20));
    gradient3d.addColorStop(0.5, baseColor);
    gradient3d.addColorStop(1, darkenColor(baseColor, 30));
    
    ctx.fillStyle = gradient3d;
    ctx.fillRect(screenX - halfSize, screenY - halfSize, blockSize, blockSize);
    
    // Block outline
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX - halfSize, screenY - halfSize, blockSize, blockSize);
    
    // Add texture-like pattern for some blocks
    if (blockType === 'brick') {
        drawBrickPattern(screenX - halfSize, screenY - halfSize, blockSize);
    } else if (blockType === 'cobblestone') {
        drawCobblePattern(screenX - halfSize, screenY - halfSize, blockSize);
    }
    
    ctx.restore();
}

function renderBlockOutline(x, y, z) {
    const { player } = gameState;
    
    const dx = (x + 0.5 - player.x);
    const dy = (y + 0.5 - player.y);
    const dz = (z + 0.5 - player.z);
    
    const cosYaw = Math.cos(-player.yaw);
    const sinYaw = Math.sin(-player.yaw);
    const rx = dx * cosYaw - dz * sinYaw;
    const rz = dx * sinYaw + dz * cosYaw;
    
    const cosPitch = Math.cos(player.pitch);
    const sinPitch = Math.sin(player.pitch);
    const ry = dy * cosPitch - rz * sinPitch;
    const finalZ = dy * sinPitch + rz * cosPitch;
    
    if (finalZ <= 0.5) return;
    
    const scale = canvas.height / (2 * Math.tan(CONFIG.FOV / 2));
    const screenX = canvas.width / 2 + (rx / finalZ) * scale;
    const screenY = canvas.height / 2 - (ry / finalZ) * scale;
    const blockSize = (1 / finalZ) * scale;
    const halfSize = blockSize / 2;
    
    // Draw selection outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX - halfSize - 2, screenY - halfSize - 2, blockSize + 4, blockSize + 4);
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX - halfSize - 2, screenY - halfSize - 2, blockSize + 4, blockSize + 4);
}

function drawBrickPattern(x, y, size) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    
    const rows = 4;
    const cols = 3;
    const brickHeight = size / rows;
    const brickWidth = size / cols;
    
    for (let row = 0; row < rows; row++) {
        const offset = (row % 2) * (brickWidth / 2);
        for (let col = 0; col < cols + 1; col++) {
            const bx = x + col * brickWidth - offset;
            const by = y + row * brickHeight;
            ctx.strokeRect(bx, by, brickWidth, brickHeight);
        }
    }
}

function drawCobblePattern(x, y, size) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    
    for (let i = 0; i < 5; i++) {
        const cx = x + (Math.sin(i * 1.5) * 0.4 + 0.5) * size;
        const cy = y + (Math.cos(i * 1.2) * 0.4 + 0.5) * size;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }
}

function lightenColor(color, percent) {
    if (color.startsWith('rgba')) return color;
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `rgb(${R}, ${G}, ${B})`;
}

function darkenColor(color, percent) {
    if (color.startsWith('rgba')) return color;
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `rgb(${R}, ${G}, ${B})`;
}

// ==================== INPUT HANDLING ====================
document.addEventListener('keydown', (e) => {
    gameState.keys[e.code] = true;
    
    // Number keys for block selection
    if (e.code >= 'Digit1' && e.code <= 'Digit9') {
        const index = parseInt(e.code.replace('Digit', '')) - 1;
        const slots = document.querySelectorAll('.slot');
        if (slots[index]) {
            document.querySelectorAll('.slot').forEach(s => s.classList.remove('selected'));
            slots[index].classList.add('selected');
            gameState.selectedBlock = slots[index].dataset.block;
        }
    }
});

document.addEventListener('keyup', (e) => {
    gameState.keys[e.code] = false;
});

// Mouse look
document.addEventListener('mousemove', (e) => {
    if (!gameState.isPointerLocked) return;
    
    gameState.player.yaw += e.movementX * CONFIG.MOUSE_SENSITIVITY;
    gameState.player.pitch += e.movementY * CONFIG.MOUSE_SENSITIVITY;
    
    // Clamp pitch to prevent flipping
    gameState.player.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, gameState.player.pitch));
});

// Block interaction
canvas.addEventListener('mousedown', (e) => {
    if (!gameState.isPointerLocked) {
        canvas.requestPointerLock();
        return;
    }
    
    const target = raycast();
    if (!target) return;
    
    if (e.button === 0) {
        // Left click - break block
        setBlock(target.hit.x, target.hit.y, target.hit.z, 'air');
    } else if (e.button === 2) {
        // Right click - place block
        const placeX = target.place.x;
        const placeY = target.place.y;
        const placeZ = target.place.z;
        
        // Don't place block where player is standing
        if (!isPlayerOccupyingBlock(placeX, placeY, placeZ)) {
            setBlock(placeX, placeY, placeZ, gameState.selectedBlock);
        }
    }
});

// Prevent context menu
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Pointer lock
document.addEventListener('pointerlockchange', () => {
    gameState.isPointerLocked = document.pointerLockElement === canvas;
    document.getElementById('game-container').classList.toggle('locked', gameState.isPointerLocked);
});

// Hotbar slot selection
document.querySelectorAll('.slot').forEach(slot => {
    slot.addEventListener('click', () => {
        document.querySelectorAll('.slot').forEach(s => s.classList.remove('selected'));
        slot.classList.add('selected');
        gameState.selectedBlock = slot.dataset.block;
    });
});

// ==================== GAME LOOP ====================
function gameLoop() {
    updatePlayer();
    render();
    requestAnimationFrame(gameLoop);
}

// ==================== INITIALIZATION ====================
function init() {
    initWorld();
    
    // Position player above terrain
    const centerX = Math.floor(CONFIG.WORLD_WIDTH / 2);
    const centerZ = Math.floor(CONFIG.WORLD_DEPTH / 2);
    let groundY = 0;
    for (let y = CONFIG.WORLD_HEIGHT - 1; y >= 0; y--) {
        if (gameState.world[centerX][y][centerZ] !== 'air') {
            groundY = y + 1;
            break;
        }
    }
    gameState.player.y = groundY + CONFIG.PLAYER_HEIGHT + 1;
    
    console.log('🎮 Minecraft Clone initialized!');
    console.log('Click to start, use WASD to move, Space to jump');
    console.log('Left click to break blocks, Right click to place blocks');
    
    gameLoop();
}

init();
