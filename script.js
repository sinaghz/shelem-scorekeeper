document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const newRoundBtn = document.getElementById('new-round-btn');
    const resetGameBtn = document.getElementById('reset-game-btn');
    const roundControlsDiv = document.getElementById('round-controls');
    const historyList = document.getElementById('history-list');
    const team1TotalScore = document.getElementById('team1-total-score');
    const team2TotalScore = document.getElementById('team2-total-score');
    
    // Name display elements
    const team1NameDisplay = document.getElementById('team1-name-display');
    const team2NameDisplay = document.getElementById('team2-name-display');
    const pNameDisplays = {
        t1p1: document.getElementById('t1p1-display'),
        t1p2: document.getElementById('t1p2-display'),
        t2p1: document.getElementById('t2p1-display'),
        t2p2: document.getElementById('t2p2-display'),
    };

    // Modal elements
    const newGameModal = document.getElementById('new-game-modal');
    const confirmNewGameBtn = document.getElementById('confirm-new-game-btn');
    const cancelNewGameBtn = document.getElementById('cancel-new-game-btn');
    const winningScoreSelect = document.getElementById('winning-score');
    const winningScoreDisplay = document.getElementById('winning-score-display');
    const modalPlayerInputs = {
        t1p1: document.getElementById('modal-t1p1'),
        t1p2: document.getElementById('modal-t1p2'),
        t2p1: document.getElementById('modal-t2p1'),
        t2p2: document.getElementById('modal-t2p2'),
    };
    
    // --- Game State ---
    let gameState = {};

    function setupNewGame(winningScore, playerNames) {
        gameState = {
            team1Score: 0, team2Score: 0,
            roundHistory: [], roundCounter: 0,
            winningScore: parseInt(winningScore),
            playerNames: playerNames,
            roundPhase: 'inactive', 
            currentRound: null
        };
        saveState();
        updateFullUI();
    }
    
    // --- Persistence Functions ---
    function saveState() {
        localStorage.setItem('shelemScorekeeperState', JSON.stringify(gameState));
    }

    function loadState() {
        const savedState = localStorage.getItem('shelemScorekeeperState');
        if (savedState) {
            gameState = JSON.parse(savedState);
        } else {
            setupNewGame(665, { t1p1: 'Player 1', t1p2: 'Player 2', t2p1: 'Player 3', t2p2: 'Player 4' });
        }
        updateFullUI();
    }

    // --- UI Update Function ---
    function updateFullUI() {
        // Create dynamic team names
        const team1Name = `${gameState.playerNames.t1p1} & ${gameState.playerNames.t1p2}`;
        const team2Name = `${gameState.playerNames.t2p1} & ${gameState.playerNames.t2p2}`;

        // Update all displays
        team1NameDisplay.textContent = team1Name;
        team2NameDisplay.textContent = team2Name;
        team1TotalScore.textContent = gameState.team1Score;
        team2TotalScore.textContent = gameState.team2Score;
        winningScoreDisplay.textContent = gameState.winningScore || 'N/A';
        
        for (const id in gameState.playerNames) {
            pNameDisplays[id].textContent = gameState.playerNames[id];
        }

        historyList.innerHTML = '';
        if (gameState.roundHistory.length === 0) {
            historyList.innerHTML = '<li>Start a new game to begin.</li>';
        } else {
            gameState.roundHistory.forEach(log => {
                const li = document.createElement('li');
                li.innerHTML = log;
                historyList.appendChild(li);
            });
        }
        
        newRoundBtn.disabled = gameState.roundPhase !== 'inactive';
        roundControlsDiv.innerHTML = ''; 
        
        if (gameState.roundPhase === 'bidding') {
            roundControlsDiv.innerHTML = getBiddingPhaseHTML(team1Name, team2Name);
            document.getElementById('confirm-bid-btn').addEventListener('click', confirmBid);
            document.getElementById('cancel-bid-btn').addEventListener('click', cancelRound);
        } else if (gameState.roundPhase === 'scoring') {
            roundControlsDiv.innerHTML = getScoringPhaseHTML(team1Name, team2Name);
            document.getElementById('finish-round-btn').addEventListener('click', finishRound);
            document.getElementById('cancel-score-btn').addEventListener('click', cancelRound);
        }
    }

    // --- HTML Template Functions for Round Controls ---
    function getBiddingPhaseHTML(team1Name, team2Name) {
        let options = '';
        for (let i = 100; i <= 165; i += 5) { options += `<option value="${i}">${i}</option>`; }
        return `
            <div id="bid-phase">
                <h3>1. Set the Bid</h3>
                <div class="form-group">
                    <label>Bidding Team (Hakem):</label>
                    <div><label><input type="radio" name="bidding-team" value="1" checked> ${team1Name}</label> <label><input type="radio" name="bidding-team" value="2"> ${team2Name}</label></div>
                </div>
                <div class="form-group"><label for="bid-amount">Bid Amount:</label><select id="bid-amount">${options}</select></div>
                <div class="button-group">
                    <button id="confirm-bid-btn">Confirm Bid</button><button id="cancel-bid-btn" class="cancel">Cancel Round</button>
                </div>
            </div>`;
    }

    function getScoringPhaseHTML(team1Name, team2Name) {
        const round = gameState.currentRound;
        const biddingTeamName = round.biddingTeam === '1' ? team1Name : team2Name;
        
        // Create the dropdown options for opponent's score
        let scoreOptions = '';
        for (let i = 0; i <= 165; i += 5) {
            const isSelected = (i === 65) ? 'selected' : ''; // Default to 65
            scoreOptions += `<option value="${i}" ${isSelected}>${i}</option>`;
        }

        return `
            <div id="round-status"><strong>Round in Progress:</strong> ${biddingTeamName} has bid <strong>${round.bidAmount}</strong>.</div>
            <div id="score-phase">
                <h3>2. Enter Score</h3>
                <div class="form-group">
                    <label for="opponent-score">Opponent's Score:</label>
                    <select id="opponent-score">${scoreOptions}</select>
                </div>
                <div class="button-group">
                    <button id="finish-round-btn">Finish Round</button><button id="cancel-score-btn" class="cancel">Cancel Round</button>
                </div>
            </div>`;
    }
    
    // --- Core Game Logic ---
    function startNewRound() {
        if (!gameState.winningScore) { alert("Please start a new game first!"); return; }
        gameState.roundPhase = 'bidding';
        saveState();
        updateFullUI();
    }

    function confirmBid() {
        gameState.currentRound = {
            biddingTeam: document.querySelector('input[name="bidding-team"]:checked').value,
            bidAmount: parseInt(document.getElementById('bid-amount').value)
        };
        gameState.roundPhase = 'scoring';
        saveState();
        updateFullUI();
    }

    function cancelRound() {
        gameState.roundPhase = 'inactive';
        gameState.currentRound = null;
        saveState();
        updateFullUI();
    }

    function finishRound() {
        const opponentScore = parseInt(document.getElementById('opponent-score').value);
        if (isNaN(opponentScore) || opponentScore < 0 || opponentScore > 165) { alert("Please enter a valid opponent score."); return; }

        const { biddingTeam, bidAmount } = gameState.currentRound;
        const biddingTeamPoints = 165 - opponentScore;
        let biddingTeamScoreChange = (biddingTeamPoints < bidAmount) ? -bidAmount : bidAmount;
        let opponentTeamScoreChange = opponentScore;
        
        if (biddingTeamScoreChange < 0 && opponentScore >= 85) { biddingTeamScoreChange *= 2; }
        if (biddingTeamScoreChange > 0 && biddingTeamPoints === 165) { biddingTeamScoreChange *= 2; }

        let team1Change = (biddingTeam === '1') ? biddingTeamScoreChange : opponentTeamScoreChange;
        let team2Change = (biddingTeam === '2') ? biddingTeamScoreChange : opponentTeamScoreChange;

        const threshold = gameState.winningScore === 665 ? 550 : 1000;
        const didBidderSucceed = biddingTeamScoreChange > 0;
        if (gameState.team1Score >= threshold && !((biddingTeam === '1' && didBidderSucceed) || (biddingTeam === '2' && !didBidderSucceed))) { team1Change = 0; }
        if (gameState.team2Score >= threshold && !((biddingTeam === '2' && didBidderSucceed) || (biddingTeam === '1' && !didBidderSucceed))) { team2Change = 0; }

        gameState.team1Score += team1Change;
        gameState.team2Score += team2Change;
        logRoundHistory(biddingTeam, bidAmount, biddingTeamPoints, team1Change, team2Change);
        cancelRound(); // Resets phase and saves
    }

    function logRoundHistory(biddingTeam, bid, points, team1Change, team2Change) {
        gameState.roundCounter++;
        const team1Name = `${gameState.playerNames.t1p1} & ${gameState.playerNames.t1p2}`;
        const team2Name = `${gameState.playerNames.t2p1} & ${gameState.playerNames.t2p2}`;
        const biddingTeamName = biddingTeam === '1' ? team1Name : team2Name;
        
        const formatChange = (change) => `<span class="score-change ${change >= 0 ? 'positive' : 'negative'}">${change >= 0 ? '+' : ''}${change}</span>`;
        const log = `<strong>Round ${gameState.roundCounter}:</strong> ${biddingTeamName} bid ${bid} & got ${points}.<br>${team1Name}: ${formatChange(team1Change)} | ${team2Name}: ${formatChange(team2Change)}`;
        gameState.roundHistory.unshift(log);
    }
    
    // --- Event Listeners ---
    newRoundBtn.addEventListener('click', startNewRound);
    resetGameBtn.addEventListener('click', () => {
        for (const id in gameState.playerNames) {
            modalPlayerInputs[id].value = gameState.playerNames[id];
        }
        newGameModal.classList.remove('hidden');
    });
    cancelNewGameBtn.addEventListener('click', () => newGameModal.classList.add('hidden'));
    
    confirmNewGameBtn.addEventListener('click', () => {
        const newNames = {};
        for (const id in modalPlayerInputs) {
            newNames[id] = modalPlayerInputs[id].value || modalPlayerInputs[id].placeholder;
        }
        setupNewGame(winningScoreSelect.value, newNames);
        newGameModal.classList.add('hidden');
    });
    
    // --- Initial Load ---
    loadState();

});
