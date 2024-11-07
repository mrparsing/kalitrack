function toggleExerciseDetails(exerciseItem) {
    const detailsContainer = exerciseItem.querySelector(".exercise-details");

    // Alterna la visibilità del contenitore dei dettagli
    detailsContainer.classList.toggle("visible");

    // Se i dettagli non sono visibili, rimuovi i contenuti
    if (!detailsContainer.classList.contains("visible")) {
        detailsContainer.innerHTML = ""; // Rimuovi i dettagli esistenti
    } else {
        const series = exerciseItem.series; // Supponendo che tu abbia questa informazione
        const repetitions = exerciseItem.repetitions; // Supponendo che tu abbia questa informazione
        const recovery = exerciseItem.recovery; // Supponendo che tu abbia questa informazione
        populateExerciseDetails(detailsContainer, series, repetitions, recovery);
    }
}

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        workoutName: params.get("workout_name"),
        date: params.get("date"),
        page: params.get('page')
    };
}

function loadSessionDetails_sessions(workoutName, date, page) {
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection("sessions").doc(user.uid).get()
                .then(docSnapshot => {
                    if (docSnapshot.exists) {
                        const sessionData = docSnapshot.data().workouts || [];

                        // Debug: Stampa tutti i workout trovati
                        console.log("Lista workout trovati:", sessionData);

                        // Cerca il workout in base a workoutName e data
                        const selectedSession = sessionData.find(workout => {
                            console.log(`Verifica workout: ${workout.workoutName} con data ${workout.date}`);
                            return workout.workoutName === workoutName && workout.date === date;
                        });

                        if (selectedSession) {
                            console.log("Workout selezionato:", selectedSession);
                            document.getElementById("sessionName").textContent = selectedSession.workoutName || "Sessione senza nome";
                            document.getElementById("sessionDate").textContent = `Data: ${selectedSession.date || "Non specificata"}`;

                            const exercisesContainer = document.getElementById("exercisesContainer");
                            exercisesContainer.innerHTML = "";

                            selectedSession.exercises.forEach(exercise => {
                                const exerciseItem = document.createElement("div");
                                exerciseItem.className = "exercise-item";
                                exerciseItem.innerHTML = `
<h3 class="exercise-title">${exercise.exercise}</h3>
<p>Serie: ${exercise.series}, Ripetizioni: ${exercise.repetitions} - Recupero: ${exercise.recovery} sec</p>
<div class="exercise-details" style="display: none;"></div>
`;

                                // Aggiungi l'evento click per espandere/collassare i dettagli
                                const exerciseTitle = exerciseItem.querySelector(".exercise-title");
                                const exerciseDetails = exerciseItem.querySelector(".exercise-details");

                                exerciseTitle.addEventListener("click", () => {
                                    // Toggles the display property between none and block
                                    const isVisible = exerciseDetails.style.display === "block";
                                    exerciseDetails.style.display = isVisible ? "none" : "block";

                                    // Se i dettagli non sono già stati popolati, creali
                                    if (!isVisible) {
                                        populateExerciseDetails(exerciseDetails, exercise.series, exercise.repetitions, exercise.recovery);
                                    }
                                });

                                exercisesContainer.appendChild(exerciseItem);
                            });

                        } else {
                            console.log("Nessun workout trovato con i criteri specificati.");
                            showNotification("Sessione non trovata.", "red");
                        }
                    } else {
                        console.log("Documento utente non trovato.");
                        showNotification("Nessun dato trovato per questo utente.", "red");
                    }
                }).catch(error => {
                    console.error("Errore nel caricamento della sessione:", error);
                });
        } else {
            showNotification("Devi essere loggato per visualizzare i dettagli della sessione.", "red");
        }
    });
}
function populateExerciseDetails(container, series, repetitions, recovery) {
    if (container.innerHTML.trim() !== "") {
        return;
    }

    for (let i = 1; i <= series; i++) {
        const detailRow = document.createElement("div");
        detailRow.className = "exercise-detail-row";

        detailRow.innerHTML = `
    <span class="text-element">
        Serie ${i}: Ripetizioni: ${repetitions}, Recupero: ${recovery} sec
    </span>
    <button class="play-btn" id="play-${i}">Avvia recupero</button>
`;

        container.appendChild(detailRow);

        const textElement = detailRow.querySelector(".text-element");

        document.getElementById(`play-${i}`).addEventListener('click', () => {
            startTimer(recovery, document.getElementById(`play-${i}`), textElement);
            document.getElementById(`play-${i}`).disabled = true;
        });
    }
}

let audioUnlocked = false;

function unlockAudio() {
    // Solo il primo click su "Avvia" sblocca l'audio
    if (!audioUnlocked) {
        alarmSound.play();
        audioUnlocked = true;  // Impedisce di riprodurre il suono subito senza interazione
    }
}

function startTimer(duration, display, textElement) {
    const alarmSound = document.getElementById("alarmSound");
    let timer = duration, minutes, seconds;

    // Cambia il colore del testo in rosso all'avvio del timer
    textElement.style.color = "red";

    display.classList.add('active');
    textElement.classList.add('active');


    const countdown = setInterval(() => {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        // Formatta il tempo come MM:SS
        seconds = seconds < 10 ? "0" + seconds : seconds;
        display.textContent = `${minutes}:${seconds}`;

        if (--timer < 0) {
            clearInterval(countdown);
            alarmSound.play(); // Riproduce il suono quando il timer termina
            display.textContent = "Tempo Scaduto!";
            textElement.style.color = "gray"; // Cambia il colore del testo a grigio

            // Rimuovi la classe 'active' quando il timer termina
            display.classList.remove('active');
            textElement.classList.remove('active');

            onTimerEnd();
        }
    }, 1000);
}

function loadSessionDetails_sfide(challengeName) {
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection("sfide").doc(user.uid).get()
                .then(docSnapshot => {
                    if (docSnapshot.exists) {
                        const challengeData = docSnapshot.data().workouts || [];
                        console.log("Lista sfide trovate:", challengeData);

                        // Cerca la sfida basata sul nome
                        const selectedChallenge = challengeData.find(challenge => challenge.workoutName === challengeName);

                        if (selectedChallenge) {
                            document.getElementById("sessionName").textContent = selectedChallenge.workoutName || "Sfida senza nome";

                            // Popola gli esercizi
                            const exercisesContainer = document.getElementById("exercisesContainer");
                            exercisesContainer.innerHTML = "";

                            selectedChallenge.exercises.forEach(exercise => {
                                const exerciseItem = document.createElement("div");
                                exerciseItem.className = "exercise-item";
                                exerciseItem.innerHTML = `
                            <h3 class="exercise-title">${exercise.exercise}</h3>
                            <p>Obiettivo: ${exercise.series}x${exercise.repetitions} - Recupero: ${exercise.recoveryTime}</p>
                            <div class="exercise-details" style="display: none;"></div>
                        `;

                                // Aggiungi l'evento click per espandere/collassare i dettagli
                                const exerciseTitle = exerciseItem.querySelector(".exercise-title");
                                exerciseTitle.addEventListener("click", () => {
                                    const detailsContainer = exerciseItem.querySelector(".exercise-details");
                                    detailsContainer.style.display = detailsContainer.style.display === "block" ? "none" : "block";
                                    if (detailsContainer.style.display === "block") {
                                        populateExerciseDetails(detailsContainer, exercise.series, exercise.repetitions, exercise.recoveryTime);
                                    }
                                });

                                exercisesContainer.appendChild(exerciseItem);
                            });
                        } else {
                            showNotification("Sfida non trovata.", "red");
                        }
                    } else {
                        showNotification("Nessun dato trovato per questo utente.", "red");
                    }
                }).catch(error => {
                    console.error("Errore nel caricamento della sfida:", error);
                });
        } else {
            showNotification("Devi essere loggato per visualizzare i dettagli della sfida.", "red");
        }
    });
}

function onTimerEnd() {
    const textElement = document.querySelector('.text-element');
    if (textElement) {
        textElement.classList.remove('active'); // Rimuovi lo stile attivo
        textElement.classList.add('timer-ended'); // Aggiungi lo stile per il timer scaduto
    }
}