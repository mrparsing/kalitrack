function visualize_future_sessions() {
    showLoader()
    auth.onAuthStateChanged(user => {
        if (user) {
            const today = new Date().toISOString().split('T')[0];
            db.collection("sessions").doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const allSessions = doc.data().workouts;
                        const futureSessions = allSessions.filter(session => session.date >= today);

                        const futureSessionsEl = document.getElementById("futureSessions");

                        if (futureSessions.length > 0) {
                            futureSessions.forEach((session, index) => {
                                const sessionEl = document.createElement("div");
                                sessionEl.className = "session-item";
                                sessionEl.setAttribute('data-workout', session.workoutName); // Aggiungi attributo personalizzato
                                sessionEl.innerHTML = `
<h3>${session.workoutName} - ${session.date}</h3>
<ul>${session.exercises.map(ex => `
<li>${ex.exercise} - ${ex.series} serie - Recupero: ${ex.recovery}s</li>
`).join('')}</ul>
<button class="delete-btn">Elimina</button>
`;
                                sessionEl.onclick = function () {
                                    // Reindirizza alla pagina di dettagli della sessione
                                    window.location.href = `../workout/workout.html?workout_name=${session.workoutName}&date=${session.date}&page=sessions`;
                                };
                                // Gestore del click per il pulsante "Elimina"
                                const deleteBtn = sessionEl.querySelector(".delete-btn");
                                deleteBtn.onclick = function (event) {
                                    event.stopPropagation(); // Ferma la propagazione dell'evento click
                                    deleteSession(session.workoutName); // Passa il workoutName alla funzione
                                };
                                futureSessionsEl.appendChild(sessionEl);
                            });
                        } else {
                            futureSessionsEl.innerHTML = "<p>Nessuna sessione futura trovata.</p>";
                        }
                    }
                })
                .catch(error => {
                    console.error("Errore nel recupero delle sessioni:", error);
                    futureSessionsEl.innerHTML = "<p>Errore nel caricamento delle sessioni.</p>";
                });
        } else {
            showNotification("Devi essere loggato per vedere le sessioni future.", "red");
        }
        hideLoader()
    });

}

function deleteSession(workoutName) {
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection("sessions").doc(user.uid).get()
                .then(doc => {
                    if (doc.exists) {
                        const sessions = doc.data().workouts;

                        // Trova l'indice della sessione da eliminare
                        const correctIndex = sessions.findIndex(session =>
                            session.workoutName === workoutName
                        );

                        if (correctIndex !== -1) {
                            // Rimuovi la sessione dal database
                            sessions.splice(correctIndex, 1);
                            db.collection("sessions").doc(user.uid).update({
                                workouts: sessions
                            }).then(() => {
                                // Rimuovi l'elemento dal DOM
                                const futureSessionsEl = document.getElementById("futureSessions");
                                const sessionItem = futureSessionsEl.querySelector(`[data-workout="${workoutName}"]`);
                                if (sessionItem) {
                                    futureSessionsEl.removeChild(sessionItem);
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
