export const SUPPORTED_LANGUAGES =
  Object.freeze([
    {
      code: "en",
      label: "English",
      shortLabel: "EN",
    },
    {
      code: "es",
      label: "Spanish",
      shortLabel: "ES",
    },
  ]);

export const SPANISH_TRANSLATIONS =
  Object.freeze({
    // Global / navigation
    "Language": "Idioma",
    "English": "Inglés",
    "Spanish": "Español",
    "Workflow": "Flujo de trabajo",
    "Library": "Biblioteca",
    "Review": "Revisión",
    "Apply": "Aplicar",
    "Profile": "Perfil",
    "Output": "Salida",
    "Dismiss": "Cerrar",
    "SwingSync desktop language": "Idioma de SwingSync",

    // Brand / loading
    "Starting the music library engine…":
      "Iniciando el motor de la biblioteca musical…",
    "Tempo intelligence for swing music":
      "Inteligencia de tempo para música swing",

    // Library heading/actions
    "Music library": "Biblioteca musical",
    "Find the right pulse.": "Encuentra el pulso correcto.",
    "Analyze your collection, review ambiguous musical interpretations, then explicitly commit approved BPM metadata.":
      "Analiza tu colección, revisa las interpretaciones musicales ambiguas y luego confirma explícitamente los metadatos BPM aprobados.",
    "Choose folders": "Elegir carpetas",
    "Open library": "Abrir biblioteca",
    "Analyze library": "Analizar biblioteca",
    "Analyzing…": "Analizando…",
    "Open roots": "Carpetas abiertas",
    "New selection": "Nueva selección",
    "Selected roots": "Carpetas seleccionadas",
    "No folders selected": "No hay carpetas seleccionadas",
    "Analyzing library": "Analizando biblioteca",

    // Summary / library filters
    "Tracks": "Pistas",
    "Across {count} root": "En {count} carpeta",
    "Across {count} roots": "En {count} carpetas",
    "Review remaining": "Pendientes de revisión",
    "{approved} approved · {skipped} skipped":
      "{approved} aprobadas · {skipped} omitidas",
    "Ready to apply": "Listas para aplicar",
    "Trusted or human-approved":
      "Confiables o aprobadas manualmente",
    "Applied": "Aplicadas",
    "File changes committed":
      "Cambios en archivos confirmados",
    "Analysis complete?": "¿Análisis completo?",
    "Review uncertain tracks, then inspect the exact write plan before committing anything.":
      "Revisa las pistas inciertas y luego inspecciona el plan exacto de escritura antes de confirmar cambios.",
    "Review {count} remaining":
      "Revisar {count} pendientes",
    "Review apply plan":
      "Revisar plan de aplicación",
    "All": "Todas",
    "Ready": "Listas",
    "Errors": "Errores",
    "Search tracks": "Buscar pistas",

    // Library table
    "Track": "Pista",
    "Tag": "Etiqueta",
    "Detected": "Detectado",
    "Suggested": "Sugerido",
    "Confidence": "Confianza",
    "Status": "Estado",
    "No tracks to show": "No hay pistas para mostrar",
    "Choose folders and open the library to scan for music.":
      "Elige carpetas y abre la biblioteca para buscar música.",

    // Status / domain labels
    "Pending": "Pendiente",
    "Analyzing": "Analizando",
    "Analyzed": "Analizada",
    "Error": "Error",
    "Approved": "Aprobada",
    "Skipped": "Omitida",
    "High": "Alta",
    "Medium": "Media",
    "Low": "Baja",
    "Generic": "Genérico",
    "Swing": "Swing",
    "Boogie": "Boogie",
    "Metadata": "Metadatos",
    "Filename": "Nombre de archivo",
    "Both": "Ambos",
    "Cache": "Caché",
    "Computed": "Calculado",
    "Human": "Humana",
    "Automatic": "Automática",
    "Same metrical level": "Mismo nivel métrico",
    "Double time": "Doble tempo",
    "3:2 triplet feel": "Sensación ternaria 3:2",
    "Raw estimate is half-time":
      "La estimación original está a medio tempo",
    "Raw estimate is double-time":
      "La estimación original está a doble tempo",
    "Raw estimate is the upper 3:2 level":
      "La estimación original es el nivel superior 3:2",
    "Raw estimate is the lower 3:2 level":
      "La estimación original es el nivel inferior 3:2",

    // Engine status
    "Engine ready": "Motor listo",
    "Engine analyzing": "Motor analizando",
    "Engine writing changes":
      "Motor escribiendo cambios",
    "Engine needs attention":
      "El motor requiere atención",

    // Inspector
    "Not available": "No disponible",
    "Track inspector": "Inspector de pista",
    "Close inspector": "Cerrar inspector",
    "Existing tag": "Etiqueta existente",
    "Relationship": "Relación",
    "Interpretation": "Interpretación",
    "Analyze this track to see the interpretation rationale.":
      "Analiza esta pista para ver la justificación de la interpretación.",
    "Human review needed": "Se requiere revisión humana",
    "SwingSync found a musically plausible alternate metrical level. Open Review to approve the detected BPM, the suggested interpretation, a custom BPM, or skip this track.":
      "SwingSync encontró un nivel métrico alternativo musicalmente plausible. Abre Revisión para aprobar el BPM detectado, la interpretación sugerida, un BPM personalizado u omitir esta pista.",
    "Analysis details": "Detalles del análisis",
    "Loading diagnostics…": "Cargando diagnósticos…",
    "Rhythm": "Ritmo",
    "Percival": "Percival",
    "Beat median": "Mediana de pulsos",
    "Source": "Fuente",
    "No analysis details yet.":
      "Todavía no hay detalles del análisis.",

    // Review
    "Unknown track": "Pista desconocida",
    "Needs decision": "Requiere decisión",
    "tempo review": "revisión de tempo",
    "Candidate consensus": "Consenso del candidato",
    "Midpoint onsets": "Ataques en punto medio",
    "Rhythm confidence": "Confianza rítmica",
    "Histogram dominance": "Dominancia del histograma",
    "Pass": "Cumple",
    "No": "No",
    "No signal": "Sin señal",
    "← Library": "← Biblioteca",
    "Human review": "Revisión humana",
    "Confirm the musical pulse.":
      "Confirma el pulso musical.",
    "These tracks need your judgment. Choosing a BPM only approves the decision—it does not modify the file yet.":
      "Estas pistas necesitan tu criterio. Elegir un BPM solo aprueba la decisión; todavía no modifica el archivo.",
    "remaining": "pendientes",
    "approved": "aprobadas",
    "Continue to Apply": "Continuar a Aplicar",
    "Loading review queue…":
      "Cargando cola de revisión…",
    "Nothing needs review.":
      "No hay nada que revisar.",
    "All analyzed tracks are either confidently interpreted or there is no reviewable result.":
      "Todas las pistas analizadas tienen una interpretación confiable o no existe un resultado revisable.",
    "Review queue": "Cola de revisión",
    "{count} track": "{count} pista",
    "{count} tracks": "{count} pistas",
    "Track {current} of {total}":
      "Pista {current} de {total}",
    "Approved {bpm}": "Aprobada: {bpm}",
    "Acoustic detection": "Detección acústica",
    "Confidence: {confidence}":
      "Confianza: {confidence}",
    "Approve detected": "Aprobar detectado",
    "SwingSync suggestion": "Sugerencia de SwingSync",
    "{relationship} · {confidence}":
      "{relationship} · {confidence}",
    "Approve suggested": "Aprobar sugerido",
    "Custom BPM": "BPM personalizado",
    "Enter your own value if neither interpretation matches how you count the song.":
      "Introduce tu propio valor si ninguna interpretación coincide con la forma en que cuentas la canción.",
    "Approve custom": "Aprobar personalizado",
    "Why SwingSync asked": "Por qué preguntó SwingSync",
    "The acoustic and musical interpretations did not produce a sufficiently confident automatic decision.":
      "Las interpretaciones acústica y musical no produjeron una decisión automática con suficiente confianza.",
    "Double-time evidence": "Evidencia de doble tempo",
    "Multi-signal score used by the genre profile.":
      "Puntuación de múltiples señales utilizada por el perfil de género.",
    "Acoustic candidates": "Candidatos acústicos",
    "Skip this track": "Omitir esta pista",
    "Clear decision": "Borrar decisión",

    // Apply
    "← Review": "← Revisión",
    "Apply summary": "Resumen de aplicación",
    "Commit the approved BPMs.":
      "Confirma los BPM aprobados.",
    "This is the write boundary. Nothing on this screen changes your files until you explicitly confirm the final action.":
      "Este es el límite de escritura. Nada en esta pantalla modifica tus archivos hasta que confirmes explícitamente la acción final.",
    "Output mode": "Modo de salida",
    "BPM tags only": "Solo etiquetas BPM",
    "Filename changes only":
      "Solo cambios de nombre de archivo",
    "Metadata + filename": "Metadatos + nombre de archivo",
    "Apply pass complete.":
      "Aplicación completada.",
    "{applied} applied · {errors} errors":
      "{applied} aplicadas · {errors} errores",
    "Back to Library": "Volver a Biblioteca",
    "Approved pending": "Aprobadas pendientes",
    "{human} human · {automatic} automatic":
      "{human} humanas · {automatic} automáticas",
    "Will change": "Se modificará",
    "Files with a real output change":
      "Archivos con un cambio real de salida",
    "Already matches": "Ya coincide",
    "No tag/filename rewrite needed":
      "No es necesario reescribir etiqueta ni nombre",
    "Unsupported": "No compatible",
    "Cannot use selected output mode":
      "No se puede usar el modo de salida seleccionado",
    "{count} review item still unresolved.":
      "Queda {count} elemento de revisión sin resolver.",
    "{count} review items still unresolved.":
      "Quedan {count} elementos de revisión sin resolver.",
    "They will not be written. You can go back to Review or apply only the approved tracks now.":
      "No se escribirán. Puedes volver a Revisión o aplicar ahora solo las pistas aprobadas.",
    "Building apply plan…":
      "Preparando plan de aplicación…",
    "No pending approved changes.":
      "No hay cambios aprobados pendientes.",
    "Everything approved has already been applied, or no analyzed tracks are currently eligible.":
      "Todo lo aprobado ya fue aplicado o actualmente no hay pistas analizadas elegibles.",
    "Return to Library": "Volver a Biblioteca",
    "Approval": "Aprobación",
    "Approved BPM": "BPM aprobado",
    "Write {bpm}": "Escribir {bpm}",
    "Not requested": "No solicitado",
    "Writing changes…": "Escribiendo cambios…",
    "{count} approved track pending":
      "{count} pista aprobada pendiente",
    "{count} approved tracks pending":
      "{count} pistas aprobadas pendientes",
    "Metadata writes use FFmpeg stream copy; audio is not re-encoded.":
      "La escritura de metadatos usa copia directa de streams con FFmpeg; el audio no se recodifica.",
    "Apply changes": "Aplicar cambios",
    "Final confirmation": "Confirmación final",
    "Write approved BPM changes?":
      "¿Escribir los cambios de BPM aprobados?",
    "SwingSync will now modify {count} approved file using the {mode} output mode.":
      "SwingSync modificará ahora {count} archivo aprobado usando el modo de salida {mode}.",
    "SwingSync will now modify {count} approved files using the {mode} output mode.":
      "SwingSync modificará ahora {count} archivos aprobados usando el modo de salida {mode}.",
    "Review choices alone never write files. This confirmation is the point where SwingSync commits them.":
      "Las decisiones de revisión por sí solas nunca escriben archivos. Esta confirmación es el punto en el que SwingSync las aplica.",
    "Cancel": "Cancelar",
    "Applying…": "Aplicando…",
    "Confirm & write": "Confirmar y escribir",

    // Metadata support
    "WAV does not have a sufficiently interoperable BPM convention in this version":
      "WAV no tiene una convención de BPM suficientemente interoperable en esta versión.",
    "Raw AAC does not provide a reliable cross-player metadata container":
      "AAC sin contenedor no proporciona metadatos confiables entre distintos reproductores.",
    "Metadata BPM writing is not configured for this file type":
      "La escritura de metadatos BPM no está configurada para este tipo de archivo.",

    // Known application errors
    "This track does not require review":
      "Esta pista no requiere revisión.",
    "Track has not been analyzed yet":
      "La pista todavía no fue analizada.",
    "This track does not have an approved BPM to apply":
      "Esta pista no tiene un BPM aprobado para aplicar.",
    "Open a library first":
      "Primero abre una biblioteca.",
    "Application session is closed":
      "La sesión de la aplicación está cerrada.",
    "A valid BPM is required":
      "Se requiere un BPM válido.",

    // Interpretation reasons
    "No musical interpretation is possible because no usable BPM was detected":
      "No es posible realizar una interpretación musical porque no se detectó un BPM utilizable.",
    "Generic profile preserves the detector's preferred metrical level":
      "El perfil Genérico conserva el nivel métrico preferido por el detector.",
    "The {profile} profile prefers the supported 3:2 lower-tempo interpretation {candidateBpm} BPM over the detector's {detectedBpm} BPM result. The candidate scored {candidateScore}/{maximumScore} and has direct acoustic-estimator support.":
      "El perfil {profile} prefiere la interpretación inferior 3:2 compatible de {candidateBpm} BPM frente al resultado de {detectedBpm} BPM del detector. El candidato obtuvo {candidateScore}/{maximumScore} y cuenta con soporte directo de un estimador acústico.",
    "The {profile} profile prefers the supported 3:2 lower-tempo interpretation {candidateBpm} BPM over the detector's {detectedBpm} BPM result. The candidate scored {candidateScore}/{maximumScore}.":
      "El perfil {profile} prefiere la interpretación inferior 3:2 compatible de {candidateBpm} BPM frente al resultado de {detectedBpm} BPM del detector. El candidato obtuvo {candidateScore}/{maximumScore}.",
    "The {profile} profile prefers the double-time interpretation {candidateBpm} BPM over the detector's {detectedBpm} BPM result because its multi-signal evidence score was {totalScore}/{maximumScore}, meeting the required {requiredScore}.":
      "El perfil {profile} prefiere la interpretación a doble tempo de {candidateBpm} BPM frente al resultado de {detectedBpm} BPM del detector porque su puntuación de evidencia de múltiples señales fue {totalScore}/{maximumScore}, alcanzando el mínimo requerido de {requiredScore}.",
    "The {profile} profile kept the detector BPM because the double-time candidate {candidateBpm} BPM scored only {totalScore}/{maximumScore} on the multi-signal evidence classifier, below the required {requiredScore}.":
      "El perfil {profile} mantuvo el BPM del detector porque el candidato a doble tempo de {candidateBpm} BPM obtuvo solo {totalScore}/{maximumScore} en el clasificador de evidencia de múltiples señales, por debajo del mínimo requerido de {requiredScore}.",
    "The {profile} profile found no sufficiently supported alternative metrical interpretation":
      "El perfil {profile} no encontró una interpretación métrica alternativa con soporte suficiente."
  });

export const DOMAIN_SOURCES =
  Object.freeze({
    status: {
      pending: "Pending",
      analyzing: "Analyzing",
      analyzed: "Analyzed",
      error: "Error",
      review: "Review",
      approved: "Approved",
      skipped: "Skipped",
      ready: "Ready",
      applied: "Applied",
    },

    confidence: {
      high: "High",
      medium: "Medium",
      low: "Low",
    },

    profile: {
      generic: "Generic",
      swing: "Swing",
      boogie: "Boogie",
    },

    outputMode: {
      metadata: "Metadata",
      filename: "Filename",
      both: "Both",
    },

    relationship: {
      same: "Same metrical level",
      "double-time": "Double time",
      "3:2-triplet-feel": "3:2 triplet feel",
      "raw-is-half": "Raw estimate is half-time",
      "raw-is-double": "Raw estimate is double-time",
      "raw-is-three-two-upper":
        "Raw estimate is the upper 3:2 level",
      "raw-is-three-two-lower":
        "Raw estimate is the lower 3:2 level",
    },

    analysisSource: {
      cache: "Cache",
      computed: "Computed",
    },

    approvalSource: {
      human: "Human",
      automatic: "Automatic",
    },
  });

export const REASON_SOURCES =
  Object.freeze({
    "interpretation.no-bpm":
      "No musical interpretation is possible because no usable BPM was detected",

    "interpretation.generic-preserve":
      "Generic profile preserves the detector's preferred metrical level",

    "interpretation.three-two-preferred-direct":
      "The {profile} profile prefers the supported 3:2 lower-tempo interpretation {candidateBpm} BPM over the detector's {detectedBpm} BPM result. The candidate scored {candidateScore}/{maximumScore} and has direct acoustic-estimator support.",

    "interpretation.three-two-preferred":
      "The {profile} profile prefers the supported 3:2 lower-tempo interpretation {candidateBpm} BPM over the detector's {detectedBpm} BPM result. The candidate scored {candidateScore}/{maximumScore}.",

    "interpretation.double-time-preferred":
      "The {profile} profile prefers the double-time interpretation {candidateBpm} BPM over the detector's {detectedBpm} BPM result because its multi-signal evidence score was {totalScore}/{maximumScore}, meeting the required {requiredScore}.",

    "interpretation.double-time-rejected":
      "The {profile} profile kept the detector BPM because the double-time candidate {candidateBpm} BPM scored only {totalScore}/{maximumScore} on the multi-signal evidence classifier, below the required {requiredScore}.",

    "interpretation.no-supported-alternative":
      "The {profile} profile found no sufficiently supported alternative metrical interpretation",
  });
