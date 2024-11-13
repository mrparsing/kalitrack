function visualize_sessions() {
    showLoader();
    const sessionHistoryEl = document.getElementById("sessionHistory"); // Definisci `sessionHistoryEl` all'inizio
    auth.onAuthStateChanged(user => {
        if (user) {
            const today = new Date().toISOString().split('T')[0];
            db.collection("sessions").doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const allSessions = doc.data().workouts;
                        const pastSessions = allSessions.filter(session => session.date < today); // Definisci `pastSessions` qui

                        if (pastSessions.length > 0) {
                            pastSessions.forEach((session, index) => {
                                const sessionEl = document.createElement("div");
                                sessionEl.className = "session-item";
                                sessionEl.setAttribute('data-workout', session.workoutName); // Aggiungi attributo personalizzato
                                sessionEl.innerHTML = `
    <h3>${session.workoutName} - ${session.date}</h3>
    <ul>${session.exercises.map(ex => `
    <li>${ex.exercise} - ${ex.series} serie - Recupero: ${ex.recovery}s</li>
    `).join('')}</ul>
    <button class="delete-btn">Elimina</button>
    <button class="modify-btn">Modifica</button>
    `;
                                // Gestore del click per l'intero elemento della sessione
                                sessionEl.onclick = function () {
                                    window.location.href = `../workout/workout.html?workout_name=${session.workoutName}&date=${session.date}&page=sessions`;
                                };

                                // Gestore del click per il pulsante "Elimina"
                                const deleteBtn = sessionEl.querySelector(".delete-btn");
                                deleteBtn.onclick = function (event) {
                                    event.stopPropagation(); // Ferma la propagazione dell'evento click
                                    deleteSession(session.workoutName); // Passa il workoutName alla funzione
                                };

                                const modifyBtn = sessionEl.querySelector(".modify-btn")
                                modifyBtn.onclick = function (event) {
                                    event.stopPropagation(); // Ferma la propagazione dell'evento click
                                    window.location.href = `../aggiungi_sessione/aggiungi_sessione.html?workout_name=${session.workoutName}&date=${session.date}`;
                                };

                                sessionHistoryEl.appendChild(sessionEl);
                            });
                        } else {
                            sessionHistoryEl.innerHTML = "<p>Nessuna sessione passata trovata.</p>";
                        }
                    }
                })
                .catch(error => {
                    console.error("Errore nel recupero delle sessioni:", error);
                    sessionHistoryEl.innerHTML = "<p>Errore nel caricamento delle sessioni.</p>";
                });
        } else {
            showNotification("Devi essere loggato per vedere lo storico delle sessioni.", "red");
        }
        hideLoader();
    });
}

function deleteSession(workoutName) {
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection("sessions").doc(user.uid).get()
                .then(doc => {
                    if (doc.exists) {
                        const sessions = doc.data().workouts;
                        const today = new Date().toISOString().split('T')[0];

                        // Filtra solo le sessioni passate
                        const pastSessions = sessions.filter(session => session.date < today);

                        // Trova la sessione da eliminare basata sul workoutName
                        const correctIndex = sessions.findIndex(session =>
                            session.workoutName === workoutName
                        );

                        if (correctIndex !== -1) {
                            // Rimuovi la sessione all'indice corretto
                            sessions.splice(correctIndex, 1);

                            // Aggiorna il database
                            db.collection("sessions").doc(user.uid).update({
                                workouts: sessions
                            }).then(() => {
                                const historySessionEl = document.getElementById("sessionHistory");
                                const sessionItem = historySessionEl.querySelector(`[data-workout="${workoutName}"]`);
                                if (sessionItem) {
                                    historySessionEl.removeChild(sessionItem);
                                }
                                showNotification("Sessione eliminata con successo!", "green"); // Call the notification here
                            }).catch(error => {
                                console.error("Errore nell'eliminazione della sessione:", error);
                                showNotification("Errore durante l'eliminazione della sessione.", "red");
                            });
                        } else {
                            console.error("Sessione non trovata. Impossibile eliminare.");
                            showNotification("Errore: sessione non trovata.", "red");
                        }
                    }
                }).catch(error => {
                    console.error("Errore nel recupero delle sessioni:", error);
                });
        } else {
            showNotification("Devi essere loggato per eliminare una sessione.", "red");
        }
    });
}
