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
<h3 class="exercise-title">${exercise.exercise}: Serie: ${exercise.series}, Ripetizioni: ${exercise.repetitions} - Recupero: ${exercise.recovery} sec</h3>
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
    // Controlla se i dettagli sono già stati popolati
    if (container.innerHTML.trim() !== "") {
        return;
    }

    for (let i = 1; i <= series; i++) {
        const detailRow = document.createElement("div");
        detailRow.className = "exercise-detail-row";

        // Creazione del bottone
        const playButton = document.createElement("button");
        playButton.className = "play-btn";
        playButton.textContent = "Avvia recupero";

        // Evento click per avviare il timer
        playButton.addEventListener('click', () => {
            startTimer(recovery, playButton, detailRow.querySelector(".text-element"));
            playButton.disabled = true; // Disabilita il pulsante durante il timer
        });

        // Creazione della riga dei dettagli
        detailRow.innerHTML = `
            <span class="text-element">
                Serie ${i}: Ripetizioni: ${repetitions}, Recupero: ${recovery} sec
            </span>
        `;

        // Aggiunta del bottone alla riga dei dettagli
        detailRow.appendChild(playButton);

        // Aggiunta della riga al contenitore dei dettagli
        container.appendChild(detailRow);
    }
}

let audioContext;
let alarmTrack;
let audioUnlocked = false;

function initializeAudio() {
    const alarmSound = document.getElementById("alarmSound");
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();

    // Crea una sola volta il nodo audio
    alarmTrack = audioContext.createMediaElementSource(alarmSound);
    alarmTrack.connect(audioContext.destination);
}

function unlockAudio() {
    if (!audioUnlocked) {
        audioContext.resume().then(() => {
            console.log("Audio sbloccato.");
            audioUnlocked = true;
        });
    }
}

function playAlarmSound() {
    const alarmSound = document.getElementById("alarmSound");

    // Controlla se l'audio è sbloccato
    if (audioUnlocked) {
        alarmSound.play().catch((error) => {
            console.error("Errore durante la riproduzione del suono:", error);
        });
    }
}


let timers = {}; // Oggetto per memorizzare i timer di ciascun esercizio

function startTimer(duration, display, textElement, exerciseIndex) {
    unlockAudio();

    // Se il timer è già in esecuzione per questo esercizio, non fare nulla
    if (timers[exerciseIndex]?.isTimerRunning) return;

    timers[exerciseIndex] = {
        isTimerRunning: true,
        remainingTime: duration,
        countdown: null // Inizialmente non esiste un countdown
    };

    // Memorizza lo stato del timer in localStorage (per ogni esercizio, se necessario)
    localStorage.setItem(`remainingTime_${exerciseIndex}`, timers[exerciseIndex].remainingTime);
    localStorage.setItem(`isTimerRunning_${exerciseIndex}`, true);

    textElement.style.color = "red";
    display.classList.add('active');
    textElement.classList.add('active');

    timers[exerciseIndex].countdown = setInterval(() => {
        let minutes = parseInt(timers[exerciseIndex].remainingTime / 60, 10);
        let seconds = parseInt(timers[exerciseIndex].remainingTime % 60, 10);
        seconds = seconds < 10 ? "0" + seconds : seconds;
        display.textContent = `${minutes}:${seconds}`;

        if (--timers[exerciseIndex].remainingTime < 0) {
            clearInterval(timers[exerciseIndex].countdown);
            playAlarmSound();
            display.textContent = "Tempo Scaduto!";
            textElement.style.color = "gray";
            display.classList.remove('active');
            textElement.classList.remove('active');
            timers[exerciseIndex].isTimerRunning = false;

            // Resetta lo stato del timer in localStorage
            localStorage.removeItem(`remainingTime_${exerciseIndex}`);
            localStorage.removeItem(`isTimerRunning_${exerciseIndex}`);
        }
    }, 1000);
}

// Non fermiamo il timer quando la pagina perde visibilità
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Quando la pagina torna visibile, riprende il timer con il tempo rimanente
        const savedTime = localStorage.getItem(`remainingTime_${exerciseIndex}`);
        const savedTimerState = localStorage.getItem(`isTimerRunning_${exerciseIndex}`) === 'true';

        if (savedTime && savedTimerState && !timers[exerciseIndex]?.isTimerRunning) {
            timers[exerciseIndex].remainingTime = parseInt(savedTime, 10); // Ripristina il tempo rimanente
            startTimer(timers[exerciseIndex].remainingTime, document.querySelector('.timer-display'), document.querySelector('.text-element'), exerciseIndex);
        }
    }
});

// Inizializzazione dell'audio al caricamento della pagina
window.addEventListener('DOMContentLoaded', () => {
    initializeAudio();

    // Sblocca l'audio al primo click o interazione con la pagina
    document.body.addEventListener('click', unlockAudio, { once: true });

    // Riprendi il timer al caricamento della pagina se necessario
    const savedTime = localStorage.getItem('remainingTime');
    const savedTimerState = localStorage.getItem('isTimerRunning') === 'true';

    if (savedTime && savedTimerState && !isTimerRunning) {
        remainingTime = parseInt(savedTime, 10);
        startTimer(remainingTime, document.querySelector('.timer-display'), document.querySelector('.text-element'));
    }
});




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