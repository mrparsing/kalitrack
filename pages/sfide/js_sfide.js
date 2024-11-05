const exercises = [];

function add_exercise_to_list(exerciseListEl) {
    const exercise = document.getElementById("exercise").value.trim();
    const series = document.getElementById("series").value.trim();
    const repetitions = document.getElementById('repetitions').value.trim();
    const recoveryTime = document.getElementById("recoveryTime").value.trim();

    if (exercise && series && repetitions && recoveryTime) {
        const exerciseItem = { exercise, series, repetitions, recoveryTime };
        exercises.push(exerciseItem);

        // Aggiorna la lista visiva
        const itemEl = document.createElement('div');
        itemEl.className = 'exercise-item';

        // Crea un contenitore per l'esercizio e il pulsante
        const itemContent = document.createElement('div')
        itemContent.className = 'item-content';
        itemContent.innerText = `${exercise} - ${series}x${repetitions} - Recupero: ${recoveryTime}s`;

        // Crea il pulsante di rimozione
        const removeBtn = document.createElement('button');
        removeBtn.innerText = 'Rimuovi';
        removeBtn.className = 'remove-exercise-btn';

        // Aggiunti evento al pulsante rimozione
        removeBtn.addEventListener('click', function () {
            const index = exercises.indexOf(exerciseItem);
            if (index > -1) {
                exercises.splice(index, 1); // Rimuove l'esercizio dall'array
                itemEl.remove(); // Rimuove l'elemento dalla lista visiva
            }
        });

        // Append the remove button to the exercise item
        itemEl.appendChild(itemContent);
        itemEl.appendChild(removeBtn); // Append the button to the exercise item
        exerciseListEl.appendChild(itemEl); // Then append the exercise item to the list
        // Reset input
        document.getElementById("exercise").value = '';
        document.getElementById("series").value = '';
        document.getElementById("repetitions").value = '';
        document.getElementById("recoveryTime").value = '';
    } else {
        showNotification("Per favore, completa tutti i campi.", "red");
    }

}

function add_exercise_to_db(exerciseListEl) {
    const workoutName = document.getElementById('workoutName').value.trim();

    if (workoutName && exercises.length > 0) {
        const sessionData = {
            workoutName,
            exercises
        };

        auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userRef = db.collection('sfide').doc(user.uid);

                try {
                    await userRef.update({
                        workouts: firebase.firestore.FieldValue.arrayUnion(sessionData)
                    });
                    showNotification("Sessione salvata con successo!", "green");
                } catch (error) {
                    // Se il campo 'workouts' non esiste ancora, usa `.set()` per crearlo
                    if (error.code === 'not-found') {
                        await userRef.set({
                            workouts: [sessionData]
                        });
                        showNotification("Sessione salvata con successo!", "green");
                    } else {
                        console.error("Errore durante il salvataggio della sessione:", error);
                        showNotification("Errore durante il salvataggio della sessione.", "red");
                    }
                }

                // Reset del form e della lista
                document.getElementById('sessionForm').reset();
                exerciseListEl.innerHTML = '';
                exercises.length = 0;

                // **Aggiorna la lista delle sfide registrate**
                loadChallenges(); // Chiama la funzione per ricaricare le sfide registrate
            } else {
                showNotification("Devi essere loggato per salvare la sessione.", "red");
            }
        });
    } else {
        showNotification("Per favore, inserisci un nome per l'allenamento e aggiungi esercizi.", "red");
    }
}

async function loadChallenges(challengeListEl) {
    showLoader();
    const user = auth.currentUser;

    if (user) {
        const userRef = db.collection('sfide').doc(user.uid);
        const doc = await userRef.get();

        if (doc.exists) {
            const data = doc.data();
            const workouts = data.workouts;

            // Clear existing challenges
            challengeListEl.innerHTML = '';

            // Display each challenge with delete button
            workouts.forEach((workout, index) => {
                const workoutEl = document.createElement('div');
                workoutEl.className = 'challenge-item';
                workoutEl.innerHTML = `
            <strong>${workout.workoutName}</strong><br>
            ${workout.exercises.map(e => `${e.exercise} - ${e.series}x${e.repetitions} - Recupero: ${e.recoveryTime}s`).join('<br>')}
            <button class="delete-challenge-btn" data-index="${index}">Elimina Sfida</button>
        `;

                challengeListEl.onclick = function () {
                    window.location.href = `../workout/workout.html?workout_name=${workout.workoutName}&page=sfide`;
                };
                challengeListEl.appendChild(workoutEl);
            });


            // Attach event listeners to delete buttons
            const deleteButtons = document.querySelectorAll('.delete-challenge-btn');
            deleteButtons.forEach(button => {
                button.addEventListener('click', deleteChallenge);
            });
        } else {
            challengeListEl.innerHTML = '<p>Nessuna sfida registrata.</p>';
        }
    } else {
        challengeListEl.innerHTML = '<p>Devi essere loggato per visualizzare le sfide.</p>';
    }
    hideLoader();
}

// Funzione per eliminare una sfida
async function deleteChallenge(event) {
    const index = event.target.getAttribute('data-index');
    const user = auth.currentUser;

    if (user) {
        const userRef = db.collection('sfide').doc(user.uid);
        const doc = await userRef.get();

        if (doc.exists) {
            const data = doc.data();
            const workouts = data.workouts;

            // Remove the specific workout
            workouts.splice(index, 1);

            try {
                await userRef.update({
                    workouts: workouts
                });
                showNotification("Sfida eliminata con successo!", "green");
                loadChallenges(); // Refresh the challenges list
            } catch (error) {
                console.error("Errore durante l'eliminazione della sfida:", error);
                showNotification("Errore durante l'eliminazione della sfida.", "red");
            }
        }
    } else {
        showNotification("Devi essere loggato per eliminare la sfida.", "red");
    }
}

