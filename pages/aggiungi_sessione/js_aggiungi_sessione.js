let modify;
let exercises = [];
let index;

function initialize() {
    takeParameters();
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

    document.getElementById("addExerciseBtn").addEventListener("click", function () {
        const exercise = document.getElementById('exercise').value;
        const series = document.getElementById('series').value;
        const repetitions = document.getElementById('repetitions').value;
        const recovery = document.getElementById('recovery').value;

        if (modify) {
            modifyExercise(exercise, series, repetitions, recovery);
            document.getElementById("addExerciseBtn").innerHTML = "Memorizza esercizio";

        } else {
            addToTemporaryList(exercise, series, repetitions, recovery);
        }
    });

    // Aggiungi la sessione a Firestore e al calendario
    document.getElementById('saveSessionBtn').addEventListener('click', async function () {
        event.preventDefault(); // Previene l'invio dei dati come parte della query string

        const exerciseListEl = document.getElementById('exerciseList');

        const workoutName = document.getElementById('workoutName').value;
        const date = document.getElementById('date').value;

        const params = new URLSearchParams(window.location.search);

        const oldWorkoutName = params.get("workout_name");
        const oldDate = params.get("date");

        let modifyNameOrDate = false;

        if (workoutName !== oldWorkoutName || date !== oldDate) {
            modifyNameOrDate = true;
            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    const userRef = db.collection('sessions').doc(user.uid);

                    try {
                        const doc = await userRef.get();
                        let sessionData = doc.data().workouts || [];

                        // Trova la vecchia sessione da eliminare
                        const oldSessionIndex = sessionData.findIndex(session => session.workoutName === oldWorkoutName && session.date === oldDate);

                        if (oldSessionIndex !== -1) {
                            // Rimuovi la vecchia sessione
                            sessionData.splice(oldSessionIndex, 1);
                            console.log("Vecchia sessione rimossa.");
                        } else {
                            console.log("Vecchia sessione non trovata, nessuna rimozione necessaria.");
                        }

                        // Verifica se esiste già un workout con lo stesso nome per evitare duplicati
                        let workoutVersion = 1;
                        let finalWorkoutName = workoutName;

                        // Controlla se esiste un workout con nome simile
                        while (sessionData.some(session => session.workoutName === finalWorkoutName)) {
                            workoutVersion++;
                            finalWorkoutName = `${workoutName} (${workoutVersion})`;
                        }

                        console.log("SESSIONE");
                        // Aggiungi la nuova sessione con il nome aggiornato (se necessario)
                        const newSessionData = {
                            workoutName: finalWorkoutName,
                            date,
                            exercises
                        };

                        sessionData.push(newSessionData);
                        showNotification(`Nuova sessione "${finalWorkoutName}" aggiunta.`, "green");

                        // Salva i cambiamenti nel database
                        await userRef.update({
                            workouts: sessionData
                        });

                        // Rimuovi l'evento esistente dal calendario
                        const oldEvent = calendar.getEvents().find(event => event.title === oldWorkoutName && event.startStr === oldDate);
                        if (oldEvent) {
                            oldEvent.remove();
                            console.log("Vecchio evento rimosso dal calendario.");
                        }

                        // Descrizione degli esercizi per l'evento del calendario
                        const description = exercises.map(ex => `${ex.exercise} (${ex.series}, recupero ${ex.recovery}s)`).join(', ');
                        calendar.addEvent({
                            title: finalWorkoutName,
                            start: date,
                            description: description
                        });

                        // Reset del form e della lista
                        document.getElementById('sessionForm').reset();
                        exerciseListEl.innerHTML = '';
                        exercises.length = 0;

                        showNotification("Sessione aggiornata con successo!", "green");

                    } catch (error) {
                        console.error("Errore durante l'aggiornamento della sessione:", error);
                        showNotification("Errore durante l'aggiornamento della sessione.", "red");
                    }
                } else {
                    showNotification("Devi essere loggato per aggiornare la sessione.", "red");
                }
            });
        }

        console.log(modify);
        if (modify) {
            // Se modify è true, aggiorna una sessione esistente
            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    const userRef = db.collection('sessions').doc(user.uid);

                    try {
                        // Recupera la lista di sessioni esistenti
                        const doc = await userRef.get();
                        const sessionData = doc.data().workouts || [];

                        // Trova la sessione da aggiornare basata su workoutName e date
                        const sessionIndex = sessionData.findIndex(session => session.workoutName === workoutName && session.date === date);
                        if (sessionIndex === -1) {
                            showNotification("Sessione non trovata.", "red");
                            return;
                        }

                        console.log(sessionIndex);

                        // Aggiorna la sessione con i nuovi esercizi
                        sessionData[sessionIndex] = {
                            ...sessionData[sessionIndex],
                            workoutName,
                            date,
                            exercises
                        };

                        // Salva le modifiche nel database
                        await userRef.update({
                            workouts: sessionData
                        });

                        // Reset del form e della lista
                        document.getElementById('sessionForm').reset();
                        exerciseListEl.innerHTML = '';
                        exercises.length = 0;

                        showNotification("Sessione aggiornata con successo!", "green");
                    } catch (error) {
                        console.error("Errore durante l'aggiornamento della sessione:", error);
                        showNotification("Errore durante l'aggiornamento della sessione.", "red");
                    }
                } else {
                    showNotification("Devi essere loggato per aggiornare la sessione.", "red");
                }
            });
        }
        else if (!modifyNameOrDate) {
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
        }

        modify = false;

    });
}

function addToTemporaryList(exercise, series, repetitions, recovery, date) {
    const exerciseListEl = document.getElementById('exerciseList');
    //const dateParts = date.split('-'); // ['2024', '11', '18']
    //const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`; // '18/11/2024'
    if (date) {
        const datePicker = flatpickr("#date", {
            dateFormat: "Y-m-d",     // Formato della data nel campo input
            altInput: true,          // Abilita un campo di input alternativo
            altFormat: "d/m/Y",      // Formato alternativo leggibile dall'utente
            defaultDate: new Date()  // Imposta la data predefinita ad oggi
        });

        // Usa il metodo setDate di Flatpickr per aggiornare il valore
        datePicker.setDate(date, true); // Il secondo parametro 'true' aggiorna anche l'input visivo
    }
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

        // Contenitore per i pulsanti
        const btnContent = document.createElement('div');
        btnContent.className = 'btn-content';

        // Crea il pulsante di rimozione
        const removeBtn = document.createElement('button');
        removeBtn.innerText = 'Rimuovi';
        removeBtn.className = 'remove-exercise-btn';

        // Crea il pulsante di modifica
        const modifyBtn = document.createElement('button');
        modifyBtn.innerText = 'Modifica';
        modifyBtn.className = 'modify-exercise-btn';

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
        itemEl.appendChild(btnContent);
        itemEl.appendChild(removeBtn);
        itemEl.appendChild(modifyBtn);
        exerciseListEl.appendChild(itemEl);

        modifyBtn.addEventListener('click', function () {
            event.preventDefault(); // Previene il comportamento di default (submit del form)

            modify = true;

            // Trova l'indice dell'esercizio corrente nella lista exercises
            index = exercises.indexOf(exerciseItem); // Per la modifica dell'esercizio nella lista temporanea

            const contentText = itemContent.innerText;

            const regex = /^(.*?) - (\d+)x\((.*?)\) - Recupero: (\d+)s$/;
            const simpleRegex = /^(.*?) - (\d+)x(\d+) - Recupero: (\d+)s$/;

            let match = contentText.match(regex) || contentText.match(simpleRegex);

            if (match) {
                const exerciseName = match[1]?.trim() || '';  // Esercizio
                const seriesCount = match[2] || '';  // Numero di serie
                const repetitions = match[3] || '';  // Ripetizioni (con parentesi o semplici)
                const recovery = match[4] || '';  // Tempo di recupero

                // Imposta i valori nei campi di input
                document.getElementById('exercise').value = exerciseName;
                document.getElementById('series').value = series;
                document.getElementById('repetitions').value = repetitions;
                document.getElementById('recovery').value = recovery;

                document.getElementById("addExerciseBtn").innerHTML = "Modifica esercizio"
            } else {
                console.log("Formato dell'elemento non riconosciuto.");
            }
        });

        // Reset input
        document.getElementById('exercise').value = '';
        document.getElementById('series').value = '';
        document.getElementById('repetitions').value = '';
        document.getElementById('recovery').value = '';
    }
}

function modifyExercise(exercise, series, repetitions, recovery) {
    if (index > -1) {
        const exerciseItem = { exercise, series, repetitions, recovery };
        exercises[index] = exerciseItem; // Sostituisce l'elemento modificato
        renderExerciseList(exerciseItem);

    } else {
        showNotification("Errore: l'esercizio non è stato trovato nella lista.", "red");
    }
}

function renderExerciseList() {
    const exerciseListEl = document.getElementById('exerciseList');
    exerciseListEl.innerHTML = ''; // Svuota la lista attuale

    exercises.forEach((exercise, i) => {
        // Crea un elemento della lista
        const itemEl = document.createElement('div');
        itemEl.className = 'session-item';

        const itemContent = document.createElement('div');
        itemContent.className = 'item-content';
        itemContent.innerText = `${exercise.exercise} - ${exercise.series}x${exercise.repetitions} - Recupero: ${exercise.recovery}s`;

        const btnContent = document.createElement('div');
        btnContent.className = 'btn-content';

        const removeBtn = document.createElement('button');
        removeBtn.innerText = 'Rimuovi';
        removeBtn.className = 'remove-exercise-btn';

        const modifyBtn = document.createElement('button');
        modifyBtn.innerText = 'Modifica';
        modifyBtn.className = 'modify-exercise-btn';

        removeBtn.addEventListener('click', function () {
            exercises.splice(i, 1); // Rimuove l'esercizio dall'array
            renderExerciseList(); // Rende di nuovo la lista aggiornata
        });

        modifyBtn.addEventListener('click', function () {
            event.preventDefault();
            modify = true;
            index = i;
            console.log(index);

            document.getElementById('exercise').value = exercise.exercise;
            document.getElementById('series').value = exercise.series;
            document.getElementById('repetitions').value = exercise.repetitions;
            document.getElementById('recovery').value = exercise.recovery;

            document.getElementById("addExerciseBtn").innerHTML = "Modifica esercizio";
        });

        itemEl.appendChild(itemContent);
        itemEl.appendChild(btnContent);
        itemEl.appendChild(removeBtn);
        itemEl.appendChild(modifyBtn);
        exerciseListEl.appendChild(itemEl);
    });
}

function takeParameters() {
    const params = new URLSearchParams(window.location.search);
    const workoutName = params.get("workout_name");
    const date = params.get("date");

    if (workoutName && date) {
        document.getElementById('workoutName').value = workoutName;
        loadEditSession(workoutName, date);
    }
}

function loadEditSession(workoutName, date) {
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection("sessions").doc(user.uid).get()
                .then(docSnapshot => {
                    if (docSnapshot.exists) {
                        const sessionData = docSnapshot.data().workouts || [];

                        // Cerca il workout in base a workoutName e data
                        const selectedSession = sessionData.find(workout => {
                            return workout.workoutName === workoutName && workout.date === date;
                        });

                        if (selectedSession) {
                            console.log("Workout selezionato:", selectedSession.date);

                            selectedSession.exercises.forEach((exercise) => {
                                addToTemporaryList(exercise.exercise, exercise.series, exercise.repetitions, exercise.recovery, selectedSession.date);
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