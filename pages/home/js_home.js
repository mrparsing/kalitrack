function createWeeklyChallenge() {
    const weeklyChallenge = [
        "3 minuti di L-sit (totale)",
        "100 push-ups (in serie da tua scelta)",
        "5 minuti di plank (totale)",
        "50 dip consecutivi (puoi dividerli in serie)",
        "30 pull-ups (in serie da tua scelta)",
        "30 secondi di L-sit dead-hang",
        "10 minuti totali di wall sit",
        "100 jumping squats (in serie da tua scelta)"
    ];
    return weeklyChallenge[Math.floor(Math.random() * weeklyChallenge.length)];
}

function createDailyChallenge() {
    const dailyExercises = [
        "1 minuto totale di L-sit",
        "50 push-ups",
        "2 minuti totali di plank",
        "30 dip consecutivi",
        "15 pull-ups",
        "10 secondi di L-sit dead-hang",
        "20 burpees",
        "3 minuti totali di wall sit",
        "40 jumping squats",
        "25 leg raises",
        "2 minuti di mountain climbers",
        "5 minuti di camminata dell'orso"
    ];

    // Ottieni la data di oggi
    const today = new Date();
    const todayKey = today.toISOString().split('T')[0]; // Chiave per memorizzare la sfida, es: "2024-11-01"
    const dayOfWeek = today.getDay(); // 0 = Domenica, 6 = Sabato

    let challengeTitle = "Sfida Giornaliera";
    let challenge;

    // Controlla se esiste già una sfida salvata per oggi
    if (localStorage.getItem("challengeDate") === todayKey) {
        // Recupera la sfida salvata
        challenge = localStorage.getItem("challenge");
        challengeTitle = localStorage.getItem("challengeTitle");
    } else {
        // Se non esiste, crea una nuova sfida
        if (dayOfWeek === 6) { // Se è sabato
            challenge = createWeeklyChallenge();
            challengeTitle = "Sfida Settimanale";
        } else {
            challenge = dailyExercises[Math.floor(Math.random() * dailyExercises.length)];
            challengeTitle = "Sfida Giornaliera";
        }

        // Salva la sfida e la data nel localStorage
        localStorage.setItem("challengeDate", todayKey);
        localStorage.setItem("challenge", challenge);
        localStorage.setItem("challengeTitle", challengeTitle);
    }

    // Aggiorna l'UI con la sfida e il titolo
    const challengeContainer = document.querySelector('.challenges ul');
    challengeContainer.innerHTML = ''; // Pulisci la lista esistente

    const challengeItem = document.createElement('li');
    challengeItem.style.marginTop = '40px';
    challengeItem.style.fontSize = "1.5em"; // Aumenta la dimensione del font
    challengeItem.innerHTML = `
    <strong>${challenge}</strong> 
    <span class="motivational-icon" title="Sei pronto a conquistare questa sfida?">&#128170;</span>
    `;
    challengeContainer.appendChild(challengeItem);

    // Aggiorna il titolo della sezione
    const challengeTitleEl = document.querySelector('.challenges h2');
    challengeTitleEl.textContent = challengeTitle;
}

function obiettivi_e_progressi() {
    showLoader();
    // Funzione per aggiornare la sezione "Obiettivi e Progressi"
    function updateGoalsSection(goals) {
        const goalsContainer = document.querySelector('.goals-and-progress ul');
        goalsContainer.innerHTML = ''; // Pulisci l'elenco esistente

        if (goals.length > 0) {
            goals.forEach(goal => {
                // Crea l'elemento per ciascun obiettivo
                const goalItem = document.createElement('li');
                goalItem.innerHTML = `
            ${goal.name}: 
            <progress value="${goal.progress}" max="${goal.target}"></progress> 
            ${Math.round((goal.progress / goal.target) * 100)}%
        `;
                goalsContainer.appendChild(goalItem);
            });
        } else {
            goalsContainer.innerHTML = '<p>Non hai obiettivi impostati.</p>';
        }
        hideLoader();
    }

    // Controlla lo stato di autenticazione dell'utente
    auth.onAuthStateChanged(user => {
        if (user) {
            showLoader(); // Mostra la rotellina prima di iniziare il recupero dei dati
            db.collection("obiettivi").doc(user.uid).get()
                .then(doc => {
                    if (doc.exists) {
                        const goals = doc.data().obiettivi || [];
                        updateGoalsSection(goals);
                    } else {
                        console.log("Nessun obiettivo trovato per l'utente.");
                        updateGoalsSection([]);
                    }
                })
                .catch(error => {
                    console.error("Errore nel recupero degli obiettivi:", error);
                    updateGoalsSection([]);
                })
                .finally(() => {
                    hideLoader(); // Nascondi la rotellina alla fine
                });
        }
    });

}

function workout_of_the_day() {
    // Mostra la rotellina di caricamento
    showLoader();

    const div_workout = document.getElementsByClassName('workout-of-the-day')
    div_workout.onclick = function () {
        // Reindirizza alla pagina di dettagli della sessione
        window.location.href = `../workout/workout.html?workout_name=${session.workoutName}&date=${session.date}&page=sessions`;
    };
    auth.onAuthStateChanged(user => {
        if (user) {
            const today = new Date().toISOString().split('T')[0];
            db.collection("sessions").doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const allSessions = doc.data().workouts;
                        const workout_of_the_day_EL = allSessions.filter(session => session.date == today);

                        const workout_of_the_day = document.getElementById("workout-of-the-day");

                        if (workout_of_the_day_EL.length > 0) {
                            workout_of_the_day_EL.forEach(session => {
                                const sessionEl = document.createElement("div");
                                sessionEl.className = "session-item";
                                sessionEl.innerHTML = `
    <h3>${session.workoutName} - ${session.date}</h3>
    <ul>${session.exercises.map(ex => `
        <li>${ex.exercise} - ${ex.series}x${ex.repetitions} - Recupero: ${ex.recovery}s</li>
    `).join('')}</ul>
    `;
                                sessionEl.onclick = function () {
                                    // Reindirizza alla pagina di dettagli della sessione
                                    window.location.href = `../workout/workout.html?workout_name=${session.workoutName}&date=${session.date}&page=sessions`;
                                };
                                workout_of_the_day.appendChild(sessionEl);
                            });
                        } else {
                            workout_of_the_day.innerHTML = "<p>Oggi non hai nessun allenamento in programma.</p>";
                        }

                    }
                }
                )
        }
        hideLoader()
    })
}

function initialize_calendar() {
    // Mostra la rotellina di caricamento
    showLoader();

    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'it',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }
    });

    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection("sessions").doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const allSessions = doc.data().workouts;
                        const events = allSessions.map(session => ({
                            title: session.workoutName,
                            start: session.date,
                            extendedProps: {
                                description: session.exercises.map(ex => `${ex.exercise} - ${ex.series} serie - Recupero: ${ex.recovery}s`).join(", ")
                            }
                        }));
                        events.forEach(event => {
                            calendar.addEvent(event);
                        });
                        calendar.on('eventClick', function (info) {
                            // Ottenere la data corretta senza conversione a UTC
                            const date = info.event.start;

                            // Formattare la data nel formato 'YYYY-MM-DD'
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0'); // I mesi in JavaScript partono da 0
                            const day = String(date.getDate()).padStart(2, '0');

                            const formattedDate = `${year}-${month}-${day}`;
                            const workoutName = info.event.title;

                            // Reindirizza alla pagina di dettagli della sessione
                            window.location.href = `../workout/workout.html?workout_name=${workoutName}&date=${formattedDate}&page=sessions`;
                        });
                        calendar.render();
                    } else {
                        console.log("Nessuna sessione trovata per l'utente.");
                    }
                })
                .catch(error => {
                    console.error("Errore nel recupero delle sessioni:", error);
                });
        }
        hideLoader();
    });
}