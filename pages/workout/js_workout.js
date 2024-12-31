function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        workoutName: params.get("workout_name"),
        date: params.get("date"),
        page: params.get('page')
    };
}
let selectedSession;

function loadSessionDetails_sessions(workoutName, date, page) {
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection("sessions").doc(user.uid).get()
                .then(docSnapshot => {
                    if (docSnapshot.exists) {
                        const sessionData = docSnapshot.data().workouts || [];

                        // Cerca il workout in base a workoutName e data
                        selectedSession = sessionData.find(workout => {
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
`;

                                // Aggiungi l'evento click per espandere/collassare i dettagli
                                const exerciseTitle = exerciseItem.querySelector(".exercise-title");


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


// Gestisci il ripristino del timer quando la pagina è visibile
/*document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        Object.keys(timers).forEach(exerciseIndex => {
            const endTime = parseInt(localStorage.getItem(`endTime_${exerciseIndex}`), 10);
            const isTimerRunning = localStorage.getItem(`isTimerRunning_${exerciseIndex}`) === 'true';

            if (isTimerRunning && endTime && !timers[exerciseIndex]?.isTimerRunning) {
                const remainingTime = Math.max(0, Math.floor((endTime - Date.now()) / 1000)); // Calcola il tempo rimanente
                if (remainingTime > 0) {
                    startTimer(remainingTime, document.querySelector('.timer-display'), document.querySelector('.text-element'), exerciseIndex);
                }
            }
        });
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

*/


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
                        `;

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

document.addEventListener("DOMContentLoaded", () => {
    const startButton = document.getElementById("startWorkoutButton");
    
    if (startButton) {
        startButton.addEventListener("click", () => {
            if (selectedSession && selectedSession.exercises) {
                startFullScreenWorkout(selectedSession.exercises);
            } else {
                showNotification("Nessun workout selezionato. Carica una sessione prima di iniziare.", "red");
            }
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {

    const endButton = document.getElementById("endWorkout");
    endButton.addEventListener("click", () => {
        const fullscreenContainer = document.getElementById("fullscreenExercise");
        fullscreenContainer.classList.add("hidden");
    })
});

function startFullScreenWorkout(exercises) {
    document.getElementById("startWorkoutButton").textContent = "Riprendi"
    let currentIndex = 0; // Indice dell'esercizio corrente
    let currentSeries = 0; // Indice della serie corrente
    let timerId = null; // Per memorizzare il timer
    let remainingTime = 0; // Tempo rimanente per il recupero
    let isPaused = false; // Stato del timer

    const fullscreenContainer = document.getElementById("fullscreenExercise");
    const exerciseNameElement = document.getElementById("exerciseName");
    const seriesElement = document.getElementById("exerciseSeries");
    const repetitionsElement = document.getElementById("exerciseRepetitions");
    const recoveryElement = document.getElementById("exerciseRecovery");
    const recoveryButton = document.getElementById("startRecoveryButton");
    const goBackButton = document.getElementById("goBack");
    const goOnButton = document.getElementById("goOn");
    const pauseButton = document.getElementById("pauseButton");
    const resetButton = document.getElementById("resetButton");

    function updateTimerDisplay(seconds) {
        recoveryElement.textContent = `Recupero: ${seconds} secondi`;
    }

    function startTimer(duration) {
        remainingTime = duration;
        isPaused = false;

        const timerDisplay = document.getElementById("timerDisplay");
        const timerText = document.getElementById("timerText");
        const progressCircle = document.querySelector(".progress-circle");

        // Nascondi il pulsante di recupero e mostra il quadrante del timer
        recoveryButton.classList.add("hidden");
        timerDisplay.classList.remove("hidden");

        // Calcola la lunghezza totale del cerchio
        const circleCircumference = 2 * Math.PI * 45;

        // Imposta le proprietà iniziali del cerchio
        progressCircle.style.strokeDasharray = circleCircumference;
        progressCircle.style.strokeDashoffset = circleCircumference;

        function updateTimerDisplay(seconds) {
            timerText.textContent = seconds; // Aggiorna il testo al centro del quadrante
            const offset = (circleCircumference * (duration - seconds)) / duration;
            progressCircle.style.strokeDashoffset = circleCircumference - offset; // Aggiorna la barra circolare
        }

        function tick() {
            if (isPaused) return;

            updateTimerDisplay(remainingTime);
            if (remainingTime <= 0) {
                clearInterval(timerId);
                timerId = null;

                // Ripristina il pulsante di recupero e nascondi il quadrante
                recoveryButton.classList.remove("hidden");
                timerDisplay.classList.add("hidden");

                // Azioni successive alla fine del timer
                currentSeries++;
                if (currentSeries >= exercises[currentIndex].series) {
                    currentSeries = 0; // Resetta la serie
                    currentIndex++; // Passa all'esercizio successivo
                }
                showExercise(currentIndex);
            } else {
                remainingTime--;
            }
        }

        clearInterval(timerId); // Reset del timer se già attivo
        timerId = setInterval(tick, 1000);
        updateTimerDisplay(remainingTime);
    }

    function pauseTimer() {
        isPaused = true;
    }

    function resumeTimer() {
        isPaused = false;
        startTimer(remainingTime); // Continua il timer dal punto in cui era stato interrotto
    }

    function resetTimer() {
        clearInterval(timerId); // Ferma il timer
        timerId = null;

        // Imposta il tempo di recupero per l'esercizio corrente
        remainingTime = exercises[currentIndex].recovery;

        // Azzera il timer e aggiorna il display del timer
        updateTimerDisplay(exercises[currentIndex].recovery); // Imposta il timer su zero

        // Mostra di nuovo il pulsante per iniziare il recupero
        recoveryButton.classList.remove("hidden");
        document.getElementById("timerDisplay").classList.add("hidden"); // Nascondi il timer
    }

    function showExercise(index) {
        if (index >= exercises.length) {
            fullscreenContainer.classList.add("hidden");
            showNotification("Workout completato!", "green");
            document.getElementById("startWorkoutButton").textContent = "Start";

            return;
        }

        const exercise = exercises[index];

        // Aggiorna il contenuto dell'esercizio
        exerciseNameElement.textContent = exercise.exercise;
        seriesElement.textContent = `Serie: ${currentSeries + 1} / ${exercise.series}`;
        repetitionsElement.textContent = `Ripetizioni: ${exercise.repetitions}`;
        updateTimerDisplay(exercise.recovery);

        // Mostra il contenitore del workout in full-screen
        fullscreenContainer.classList.remove("hidden");
    }

    // Gestione dei pulsanti
    recoveryButton.onclick = () => {
        if (!timerId) {
            startTimer(exercises[currentIndex].recovery); // Avvia il timer per il recupero
        }
    };

    goOnButton.onclick = () => {
        animateButtonDirection("goOn", "right"); // Anima verso destra
    
        if (currentSeries < exercises[currentIndex].series - 1) {
            currentSeries++; // Vai alla serie successiva
        } else if (currentIndex < exercises.length - 1) {
            currentIndex++; // Passa all'esercizio successivo
            currentSeries = 0; // Resetta la serie
        }
    
        showExercise(currentIndex);
    };
    
    goBackButton.onclick = () => {
        animateButtonDirection("goBack", "left"); // Anima verso sinistra
    
        if (currentSeries > 0) {
            currentSeries--; // Torna alla serie precedente
        } else if (currentIndex > 0) {
            currentIndex--; // Torna all'esercizio precedente
            currentSeries = exercises[currentIndex].series - 1; // Vai all'ultima serie dell'esercizio precedente
        }
    
        showExercise(currentIndex);
    };

    pauseButton.onclick = () => {
        if (isPaused) {
            resumeTimer();
            pauseButton.textContent = "Pause"; // Cambia il testo a "Pause"
        } else {
            pauseTimer();
            pauseButton.textContent = "Resume"; // Cambia il testo a "Resume"
        }
    };

    resetButton.onclick = () => {
        resetTimer();
        pauseButton.textContent = "Pause"; // Rende "Pause" il testo del pulsante
    };

    // Mostra il primo esercizio
    showExercise(currentIndex);
}

function animateButtonDirection(buttonId, direction) {
    const button = document.getElementById(buttonId);
    button.classList.add("animate");

    // Direzione dell'animazione
    if (direction === "right") {
        button.style.transform = "translateX(10px)";
    } else if (direction === "left") {
        button.style.transform = "translateX(-10px)";
    }

    // Rimuovi l'animazione dopo 300ms
    setTimeout(() => {
        button.classList.remove("animate");
        button.style.transform = "translateX(0)"; // Ripristina la posizione
    }, 300);
}