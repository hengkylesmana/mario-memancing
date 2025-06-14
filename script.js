document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const endScreen = document.getElementById('end-screen');
    const playButton = document.getElementById('play-button');
    const castButton = document.getElementById('cast-button');
    const reelButton = document.getElementById('reel-button');
    const restartButton = document.getElementById('restart-button');
    const fishingLineContainer = document.getElementById('fishing-line-container');
    const fishingHook = document.getElementById('fishing-hook');
    const currentScoreSpan = document.getElementById('current-score');
    const finalScoreSpan = document.getElementById('final-score');
    const currentRoundSpan = document.getElementById('current-round');
    const messageDisplay = document.getElementById('message');
    const waterElement = document.getElementById('water');

    let score = 0;
    let round = 1;
    const maxRounds = 3;
    let fishingLineLength = 0;
    let castingInterval;
    let reelingInterval;
    let isCasting = false;
    let isReeling = false;
    let caughtFish = null;
    let fishSpawnInterval;

    const fishTypes = [
        { class: 'fish-1', score: 10, img: 'ikan1.png' }, // Example fish image
        { class: 'fish-2', score: 20, img: 'ikan1.png' }, // Example fish image
        { class: 'fish-3', score: 30, img: 'ikan1.png' }  // Example fish image
    ];

    // --- Game State Management ---
    function showScreen(screen) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screen.classList.add('active');
    }

    function startGame() {
        score = 0;
        round = 1;
        currentScoreSpan.textContent = score;
        currentRoundSpan.textContent = `${round}/${maxRrounds}`;
        showScreen(gameScreen);
        resetFishingState();
        startFishSpawning();
        // Hide reel button until cast
        reelButton.style.display = 'none';
        castButton.style.display = 'block';
    }

    function endGame() {
        clearInterval(fishSpawnInterval);
        stopCasting();
        stopReeling();
        clearFish();
        finalScoreSpan.textContent = score;
        showScreen(endScreen);
    }

    function nextRound() {
        round++;
        if (round > maxRounds) {
            endGame();
        } else {
            currentRoundSpan.textContent = `${round}/${maxRounds}`;
            showMessage(`Round ${round} dimulai!`, 1500);
            resetFishingState();
            clearFish(); // Clear existing fish before spawning new ones
            startFishSpawning();
            castButton.style.display = 'block';
            reelButton.style.display = 'none';
        }
    }

    // --- Fishing Logic ---
    function resetFishingState() {
        fishingLineLength = 0;
        fishingLineContainer.style.height = '0px';
        fishingHook.style.display = 'none';
        fishingHook.style.top = '0px'; // Reset hook position relative to container
        caughtFish = null;
        if (document.querySelector('.fish.caught')) {
            document.querySelector('.fish.caught').remove();
        }
    }

    function castLine() {
        if (isCasting || isReeling) return;

        isCasting = true;
        castButton.style.display = 'none';
        reelButton.style.display = 'block';
        fishingHook.style.display = 'block';

        castingInterval = setInterval(() => {
            if (fishingLineLength < 400) { // Max length of fishing line
                fishingLineLength += 5;
                fishingLineContainer.style.height = `${fishingLineLength}px`;
            } else {
                stopCasting();
            }
        }, 20);
    }

    function stopCasting() {
        clearInterval(castingInterval);
        isCasting = false;
    }

    function reelLine() {
        if (isReeling) return;

        isReeling = true;
        stopCasting(); // Ensure casting stops when reeling begins

        reelingInterval = setInterval(() => {
            if (fishingLineLength > 0) {
                fishingLineLength -= 10;
                fishingLineContainer.style.height = `${fishingLineLength}px`;

                if (caughtFish) {
                    // Move caught fish with the hook
                    const hookY = fishingLineContainer.offsetTop + fishingLineLength - fishingHook.offsetHeight;
                    caughtFish.style.top = `${hookY - caughtFish.offsetHeight / 2}px`; // Adjust for fish height
                }
            } else {
                stopReeling();
                if (caughtFish) {
                    addScore(caughtFish.dataset.score);
                    caughtFish.remove(); // Remove fish from screen
                    caughtFish = null;
                    showMessage("Ikan tertangkap!", 1000);
                } else {
                    showMessage("Tidak ada ikan tertangkap.", 1000);
                }
                setTimeout(() => { // Give a moment before next round/cast
                    if (round <= maxRounds) { // Only go to next round if not already at max
                        nextRound();
                    }
                }, 1500);
            }
        }, 20);
    }

    function stopReeling() {
        clearInterval(reelingInterval);
        isReeling = false;
        // After reeling, allow casting again
        castButton.style.display = 'block';
        reelButton.style.display = 'none';
    }

    function addScore(points) {
        score += parseInt(points);
        currentScoreSpan.textContent = score;
    }

    // --- Fish Spawning and Collision ---
    function createFish() {
        const randomIndex = Math.floor(Math.random() * fishTypes.length);
        const fishType = fishTypes[randomIndex];
        const fish = document.createElement('div');
        fish.classList.add('fish', fishType.class);
        fish.dataset.score = fishType.score;
        fish.style.backgroundImage = `url('${fishType.img}')`;

        const waterHeight = waterElement.offsetHeight;
        const waterTop = waterElement.offsetTop;
        const spawnDepth = Math.random() * (waterHeight - fish.offsetHeight); // Spawn within water
        fish.style.top = `${waterTop + spawnDepth}px`;
        fish.style.left = '900px'; // Start off-screen right
        gameScreen.appendChild(fish);

        // Randomize animation duration for varied speeds
        fish.style.animationDuration = `${Math.random() * 5 + 5}s`; // 5 to 10 seconds

        fish.addEventListener('animationiteration', () => {
            // Remove fish when it swims off-screen to the left
            if (!fish.classList.contains('caught')) {
                 fish.remove();
            }
        });
    }

    function startFishSpawning() {
        fishSpawnInterval = setInterval(createFish, 2000); // Spawn a fish every 2 seconds
    }

    function clearFish() {
        document.querySelectorAll('.fish').forEach(fish => fish.remove());
    }

    function checkCollision() {
        if (!isCasting && !isReeling) return; // Only check when line is out

        const hookRect = fishingHook.getBoundingClientRect();
        const fishingLineContainerRect = fishingLineContainer.getBoundingClientRect();

        // Calculate actual hook position relative to the game screen
        const actualHookTop = fishingLineContainerRect.top + fishingLineLength;
        const actualHookLeft = fishingLineContainerRect.left + fishingHook.offsetLeft;
        const actualHookRect = {
            left: actualHookLeft,
            top: actualHookTop,
            right: actualHookLeft + fishingHook.offsetWidth,
            bottom: actualHookTop + fishingHook.offsetHeight
        };


        document.querySelectorAll('.fish').forEach(fish => {
            if (fish === caughtFish || fish.classList.contains('caught')) return; // Don't check already caught fish

            const fishRect = fish.getBoundingClientRect();

            // Simple AABB collision detection
            if (actualHookRect.left < fishRect.right &&
                actualHookRect.right > fishRect.left &&
                actualHookRect.top < fishRect.bottom &&
                actualHookRect.bottom > fishRect.top)
            {
                // Collision detected!
                caughtFish = fish;
                caughtFish.classList.add('caught');
                // Adjust fish position to be attached to hook
                caughtFish.style.position = 'absolute';
                caughtFish.style.left = `${actualHookLeft - (fish.offsetWidth / 2)}px`; // Center fish on hook
                caughtFish.style.top = `${actualHookTop - (fish.offsetHeight / 2)}px`;

                stopCasting(); // Stop line from going deeper
                reelLine(); // Automatically start reeling once a fish is caught
            }
        });
    }

    setInterval(checkCollision, 50); // Check for collisions frequently

    // --- Utility Functions ---
    function showMessage(msg, duration) {
        messageDisplay.textContent = msg;
        messageDisplay.style.display = 'block';
        setTimeout(() => {
            messageDisplay.style.display = 'none';
        }, duration);
    }

    // --- Event Listeners ---
    playButton.addEventListener('click', startGame);
    castButton.addEventListener('click', castLine);
    reelButton.addEventListener('click', reelLine);
    restartButton.addEventListener('click', startGame);

    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space' && gameScreen.classList.contains('active')) {
            if (castButton.style.display === 'block') { // If cast button is visible, user can cast
                castLine();
            } else if (reelButton.style.display === 'block') { // If reel button is visible, user can reel
                reelLine();
            }
        }
    });
});