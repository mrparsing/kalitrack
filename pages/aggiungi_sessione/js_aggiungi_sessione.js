function initialize() {
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
    });
    const exerciseListEl = document.getElementById('exerciseList');
    const exercises = [];

    // Aggiungi esercizio alla lista
    document.getElementById('addExerciseBtn').addEventListener('click', function () {
        const exercise = document.getElementById('exercise').value;
        const series = document.getElementById('series').value;
        const repetitions = document.getElementById('repetitions').value;
        const recovery = document.getElementById('recovery').value;

        if (exercise && series && recovery && repetitions) {
            const exerciseItem = { exercise, series, repetitions, recovery };
            exercises.push(exerciseItem);

            // Aggiorna la lista visiva
            const itemEl = document.createElement('div');
            itemEl.className = 'session-item';

            // Crea un contenitore per l'esercizio e il pulsante
            const itemContent = document.createElement('div');
            itemContent.className = 'item-content';
            itemContent.innerText = `${exercise} - ${series}x${repetitions} - Recupero: ${recovery}s`;

            // Crea il pulsante di rimozione
            const removeBtn = document.createElement('button');
            removeBtn.innerText = 'Rimuovi';
            removeBtn.className = 'remove-exercise-btn';

            // Aggiungi evento al pulsante di rimozione
            removeBtn.addEventListener('click', function () {
                const index = exercises.indexOf(exerciseItem);
                if (index > -1) {
                    exercises.splice(index, 1); // Rimuove l'esercizio dall'array
                    itemEl.remove(); // Rimuove l'elemento dalla lista visiva
                }
            });

            // Aggiungi contenuto e pulsante all'elemento della lista
            itemEl.appendChild(itemContent);
            itemEl.appendChild(removeBtn);
            exerciseListEl.appendChild(itemEl);
            // Reset input
            document.getElementById('exercise').value = '';
            document.getElementById('series').value = '';
            document.getElementById('repetitions').value = '';
            document.getElementById('recovery').value = '';
        }
    });
    // Aggiungi la sessione a Firestore e al calendario
    document.getElementById('saveSessionBtn').addEventListener('click', async function () {
        const workoutName = document.getElementById('workoutName').value;
        const date = document.getElementById('date').value;

        if (workoutName && date && exercises.length > 0) {
            const sessionData = {
                workoutName,
                date,
                exercises
            };

            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    const userRef = db.collection('sessions').doc(user.uid);

                    try {
                        // Usa arrayUnion per aggiungere la nuova sessione all'array workouts
                        await userRef.update({
                            workouts: firebase.firestore.FieldValue.arrayUnion(sessionData)
                        });

                        // Aggiunge la sessione al calendario
                        const description = exercises.map(ex => `${ex.exercise} (${ex.series}, recupero ${ex.recovery}s)`).join(', ');
                        calendar.addEvent({
                            title: workoutName,
                            start: date,
                            description: description
                        });

                        // Reset del form e della lista
                        document.getElementById('sessionForm').reset();
                        exerciseListEl.innerHTML = '';
                        exercises.length = 0;

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
                } else {
                    showNotification("Devi essere loggato per salvare la sessione.", "red");
                }
            });
        }
    });
}