let goals = []; // Array per memorizzare gli obiettivi

function aggiungi_obiettivo() {


    const goalNameInput = document.getElementById('goalNameInput').value;
    const goalInput = parseInt(document.getElementById('goalInput').value);
    const progressInput = parseInt(document.getElementById('progressInput').value);

    if (!goalNameInput || isNaN(goalInput) || isNaN(progressInput)) {
        showNotification("Compila tutti i campi correttamente!", "red");
        return;
    }

    // Crea il nuovo obiettivo senza serverTimestamp
    const newGoal = {
        name: goalNameInput,
        target: goalInput,
        progress: progressInput
    };

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userRef = db.collection('obiettivi').doc(user.uid);

            try {
                // Aggiungi prima l'obiettivo senza il timestamp
                await userRef.update({
                    obiettivi: firebase.firestore.FieldValue.arrayUnion(newGoal)
                });

                goals.push(newGoal); // Aggiorna la lista locale di obiettivi
                displayGoals(); // Rendi visibile il nuovo obiettivo
                clearInputs();
                showNotification(`Obiettivo "${goalNameInput}" aggiunto!`, "green");
            } catch (error) {
                if (error.code === 'not-found') {
                    // Inizializza il documento con un array contenente l'obiettivo e il timestamp
                    await userRef.set({
                        obiettivi: [newGoal]
                    });
                    goals = [newGoal]; // Inizializza la lista locale di obiettivi
                    displayGoals();
                    showNotification(`Obiettivo "${goalNameInput}" aggiunto!`, "green");
                } else {
                    console.error("Errore durante il salvataggio dell'obiettivo:", error);
                    showNotification("Errore durante il salvataggio dell'obiettivo.", "red");
                }
            }
        } else {
            showNotification("Devi essere loggato per salvare l'obiettivo.", "red");
        }
    });
}

// Funzione per caricare gli obiettivi dal database
async function loadGoals() {
    showLoader();
    const user = auth.currentUser;
    if (user) {
        const userRef = db.collection('obiettivi').doc(user.uid);
        const doc = await userRef.get();

        if (doc.exists) {
            goals = doc.data().obiettivi || []; // Salva gli obiettivi recuperati in 'goals'
            displayGoals();
        } else {
            console.log("Nessun obiettivo trovato per l'utente.");
        }
    } else {
        console.log("Nessun utente loggato.");
    }
    hideLoader();
}

function displayGoals() {
    const goalList = document.getElementById('goalList');
    goalList.innerHTML = '';

    if (goals.length === 0) {
        goalList.innerHTML = '<p>Nessun obiettivo disponibile.</p>';
        return;
    }

    goals.forEach((goal, index) => {
        const goalItem = document.createElement('div');
        goalItem.classList.add('goal-item');

        const progressPercent = calculateProgress(goal.progress, goal.target);

        goalItem.innerHTML = `
            <div class="goal-header">
                <strong>${goal.name}</strong>
                <div class="progress-container">
                    <div class="progress">
                        <div class="progress-bar" style="width: ${progressPercent};">
                            ${Math.round(progressPercent.replace('%', ''))}%
                        </div>
                    </div>
                </div>
                <p>Progresso: ${goal.progress} / ${goal.target}</p>
                <button onclick="editGoal(${index})" id="button-modifica">Modifica</button>
                <button onclick="deleteGoal(${index})" id="button-elimina">Elimina</button>
            </div>
            <div class="edit-section" id="editSection-${index}" style="display: none;">
                <input type="text" id="editGoalName-${index}" value="${goal.name}">
                <input type="number" id="editGoalTarget-${index}" value="${goal.target}" min="1">
                <input type="number" id="editGoalProgress-${index}" value="${goal.progress}" min="0">
                <div class="button-modifica">
                <button id="button-update" onclick="updateGoal(${index})">Aggiorna</button>
                <button id="button-delete" onclick="cancelEdit(${index})">Annulla</button>
            </div>
            </div>
        `;
        goalList.appendChild(goalItem);
    });
}


async function deleteGoal(index) {
    if (confirm("Sei sicuro di voler eliminare questo obiettivo?")) {
        const user = auth.currentUser;
        if (user) {
            goals.splice(index, 1); // Rimuovi l'obiettivo dall'array locale
            const userRef = db.collection('obiettivi').doc(user.uid);

            try {
                await userRef.update({
                    obiettivi: goals
                });
                displayGoals(); // Rendi visibile la lista aggiornata
                showNotification("Obiettivo eliminato con successo!", "green");
            } catch (error) {
                console.error("Errore durante l'eliminazione dell'obiettivo:", error);
                showNotification("Errore durante l'eliminazione dell'obiettivo.", "red");
            }
        } else {
            showNotification("Devi essere loggato per eliminare l'obiettivo.", "red");
        }
    }
}


function editGoal(index) {
    const editSection = document.getElementById(`editSection-${index}`);
    editSection.style.display = editSection.style.display === 'none' ? 'block' : 'none';
}

function cancelEdit(index) {
    const editSection = document.getElementById(`editSection-${index}`);
    editSection.style.display = 'none';
}


async function updateGoal(index) {
    const updatedName = document.getElementById(`editGoalName-${index}`).value;
    const updatedTarget = parseInt(document.getElementById(`editGoalTarget-${index}`).value);
    const updatedProgress = parseInt(document.getElementById(`editGoalProgress-${index}`).value);

    if (!updatedName || isNaN(updatedTarget) || isNaN(updatedProgress)) {
        showNotification("Compila tutti i campi correttamente!", "red");
        return;
    }

    goals[index].name = updatedName;
    goals[index].target = updatedTarget;
    goals[index].progress = updatedProgress;

    const user = auth.currentUser;
    if (user) {
        const userRef = db.collection('obiettivi').doc(user.uid);

        try {
            await userRef.update({
                obiettivi: goals
            });
            displayGoals();
            showNotification("Obiettivo aggiornato con successo!", "green");
        } catch (error) {
            console.error("Errore durante l'aggiornamento dell'obiettivo:", error);
            showNotification("Errore durante l'aggiornamento dell'obiettivo.", "red");
        }
    } else {
        showNotification("Devi essere loggato per aggiornare l'obiettivo.", "red");
    }
}

function calculateProgress(current, target) {
    if (target <= 0) return '0%';
    return Math.min((current / target) * 100, 100) + '%';
}
