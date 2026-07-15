import { showScreen, refreshIcons } from "./js/ui.js";
import { idbGet, idbSet, idbGetAll, idbDelete, idbClear } from "./js/database.js";
import { FORM_IDS, readForm, clearForm } from "./js/form.js";
import { isDuplicateSerial, validateRequired, debounce } from "./js/validation.js";
import { buildWorkbook, downloadWorkbook } from "./js/exportExcel.js";
import { extractScreenSizeFromModel } from "./js/helpers.js";
import { loadKnownEquipments, lookupKnownEquipment } from "./js/knownEquipment.js";

let knownEquipments = {};

document.addEventListener("DOMContentLoaded", async () => {
  refreshIcons();
  knownEquipments = await loadKnownEquipments();
  await refreshHome();

  document.getElementById("btnNewFile").addEventListener("click", () => showScreen("setup"));
  document.getElementById("btnBackFromSetup").addEventListener("click", () => showScreen("home"));

  document.getElementById("btnStartFile").addEventListener("click", async () => {
    const etablissement = document.getElementById("setupEtablissement").value.trim();
    const emplacement = document.getElementById("setupEmplacement").value.trim();
    const prefix = document.getElementById("setupPrefix").value.trim() || "REG";
    const startNum = parseInt(document.getElementById("setupStartNum").value, 10) || 1;
    const defaultStatut = document.getElementById("setupDefaultStatut").value;
    const defaultDispo = document.getElementById("setupDefaultDispo").value;
    const defaultProtege = document.getElementById("setupDefaultProtege").value;
    const defaultFabricant = document.getElementById("setupDefaultFabricant").value.trim().toUpperCase();
    const defaultTaux = document.getElementById("setupDefaultTaux").value;

    if (!etablissement || !emplacement) {
      alert("Renseigne au moins l'établissement et la salle.");
      return;
    }

    try {
      await idbSet("meta", "currentFile", {
        etablissement, emplacement, prefix, nextNumber: startNum,
        defaultStatut, defaultDispo, defaultProtege, defaultFabricant, defaultTaux,
      });
      await enterFormScreen();
    } catch (err) {
      alert("Erreur de sauvegarde : " + err.message);
    }
  });

  document.getElementById("btnBackFromForm").addEventListener("click", async () => {
    await refreshHome();
    showScreen("home");
  });

  document.getElementById("f_equipement").addEventListener("change", toggleEquipementAutre);
  attachSerialSuggestions();

  document.getElementById("f_numeroSerie").addEventListener(
    "input",
    debounce(onSerialInput, 250)
  );

  document.getElementById("f_modele").addEventListener("input", fillScreenSizeFromModel);
  document.getElementById("f_equipement").addEventListener("change", fillScreenSizeFromModel);

  document.getElementById("f_caracEntree").addEventListener("blur", () => {
    const actuelles = document.getElementById("f_caracActuelles");
    if (!actuelles.value) actuelles.value = document.getElementById("f_caracEntree").value;
  });

  document.getElementById("btnAddEquipment").addEventListener("click", async (e) => {
    e.preventDefault();
    await addEquipment();
  });

  document.getElementById("btnContinue").addEventListener("click", async () => {
    await enterFormScreen();
  });

  document.getElementById("btnFinishHome").addEventListener("click", async () => {
    const meta = await idbGet("meta", "currentFile");
    const equipments = await idbGetAll("equipments");

    if (!meta || equipments.length === 0) {
      alert("Aucun équipement saisi pour cette fiche.");
      return;
    }

    const btn = document.getElementById("btnFinishHome");
    btn.disabled = true;
    try {
      const wb = await buildWorkbook(equipments);
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `Suivi_Parc_${meta.etablissement}_${meta.emplacement}_${dateStr}.xlsx`.replace(/\s+/g, "_");
      await downloadWorkbook(wb, filename);

      document.getElementById("doneSummary").textContent =
        `${equipments.length} équipement(s) exporté(s) pour ${meta.etablissement} — ${meta.emplacement}.`;
      showScreen("done");
    } catch (err) {
      alert("Échec de l'export : " + err.message);
      console.error(err);
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById("btnDiscard").addEventListener("click", async () => {
    if (!confirm("Supprimer toute la fiche en cours (équipements déjà saisis inclus) ?")) return;
    await idbClear("equipments");
    await idbDelete("meta", "currentFile");
    await refreshHome();
  });

  document.getElementById("btnBackHomeFromDone").addEventListener("click", async () => {
    await refreshHome();
    showScreen("home");
  });

  document.getElementById("btnClearAfterDone").addEventListener("click", async () => {
    if (!confirm("Vider les données de cette fiche maintenant ?")) return;
    await idbClear("equipments");
    await idbDelete("meta", "currentFile");
    await refreshHome();
    showScreen("home");
  });

  showScreen("home");
});

function currentDefaults(meta) {
  return {
    statut: meta.defaultStatut, dispo: meta.defaultDispo, protege: meta.defaultProtege,
    fabricant: meta.defaultFabricant, taux: meta.defaultTaux,
  };
}

function toggleEquipementAutre() {
  const val = document.getElementById("f_equipement").value;
  const autreEl = document.getElementById("f_equipementAutre");
  if (val === "Autre") {
    autreEl.classList.remove("hidden");
  } else {
    autreEl.classList.add("hidden");
    autreEl.value = "";
  }
}

function attachSerialSuggestions() {
  const input = document.getElementById("f_numeroSerie");
  const box = document.getElementById("serialSuggestions");

  const render = (filter) => {
    const q = filter.trim().toUpperCase();
    const keys = Object.keys(knownEquipments);
    const matches = q ? keys.filter(k => k.includes(q)).slice(0, 8) : [];
    box.innerHTML = "";
    if (!matches.length) { box.classList.add("hidden"); return; }
    matches.forEach(serial => {
      const item = document.createElement("div");
      item.className = "model-suggestion-item";
      const info = knownEquipments[serial];
      item.textContent = `${serial} — ${info.equipement || "?"}`;
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        input.value = serial;
        box.classList.add("hidden");
        applyKnownEquipment();
      });
      box.appendChild(item);
    });
    box.classList.remove("hidden");
  };

  input.addEventListener("input", () => render(input.value));
  input.addEventListener("focus", () => render(input.value));
  input.addEventListener("blur", () => setTimeout(() => box.classList.add("hidden"), 120));
}

function fillScreenSizeFromModel() {
  const equip = document.getElementById("f_equipement").value;
  if (equip !== "Ecran") return;
  const modele = document.getElementById("f_modele").value.trim();
  const typesEl = document.getElementById("f_types");
  if (typesEl.value) return;
  const size = extractScreenSizeFromModel(modele);
  if (size) typesEl.value = `Ecran ${size}''`;
}

async function onSerialInput() {
  await checkDuplicateSerial();
  applyKnownEquipment();
}

function applyKnownEquipment() {
  const serial = document.getElementById("f_numeroSerie").value.trim();
  const alertBox = document.getElementById("knownAlert");
  if (!serial) { alertBox.classList.add("hidden"); return; }

  const known = lookupKnownEquipment(knownEquipments, serial);
  if (!known) { alertBox.classList.add("hidden"); return; }

  if (!document.getElementById("f_statut").value) document.getElementById("f_statut").value = known.statut || "";
  if (!document.getElementById("f_etat").value) document.getElementById("f_etat").value = known.etat || "";
  if (!document.getElementById("f_disponibilite").value) document.getElementById("f_disponibilite").value = known.disponibilite || "";
  if (!document.getElementById("f_taux").value && known.taux !== undefined) document.getElementById("f_taux").value = known.taux;
  if (!document.getElementById("f_commentaire").value) document.getElementById("f_commentaire").value = known.commentaire || "";

  alertBox.classList.remove("hidden");
}

async function refreshHome() {
  const meta = await idbGet("meta", "currentFile");
  const noFileState = document.getElementById("noFileState");
  const draftState = document.getElementById("draftState");

  if (!meta) {
    noFileState.classList.remove("hidden");
    draftState.classList.add("hidden");
    return;
  }

  const equipments = await idbGetAll("equipments");
  noFileState.classList.add("hidden");
  draftState.classList.remove("hidden");
  document.getElementById("draftEtab").textContent = `${meta.etablissement} — ${meta.emplacement}`;
  document.getElementById("draftCount").textContent =
    `${equipments.length} équipement${equipments.length > 1 ? "s" : ""} saisi${equipments.length > 1 ? "s" : ""}`;
}

async function enterFormScreen() {
  const meta = await idbGet("meta", "currentFile");
  if (!meta) { showScreen("home"); return; }
  document.getElementById("formContext").textContent = `${meta.etablissement} — ${meta.emplacement}`;
  document.getElementById("regBadge").textContent = `${meta.prefix}${meta.nextNumber}`;
  clearForm(currentDefaults(meta));
  await renderSessionList();
  showScreen("form");
}

async function checkDuplicateSerial() {
  const val = document.getElementById("f_numeroSerie").value.trim();
  const alertBox = document.getElementById("dupAlert");
  if (!val) { alertBox.classList.add("hidden"); return; }

  try {
    const equipments = await idbGetAll("equipments");
    const match = isDuplicateSerial(equipments, val);
    if (match) {
      document.getElementById("dupTarget").textContent = `${match.numEnregistrement} (${match.equipement || "?"})`;
      alertBox.classList.remove("hidden");
    } else {
      alertBox.classList.add("hidden");
    }
  } catch (err) {
    console.error("checkDuplicateSerial:", err);
  }
}

async function addEquipment() {
  const equipEl = document.getElementById("f_equipement");
  const check = validateRequired({ equipement: equipEl.value });
  if (!check.valid) { alert(check.errors[0].message); equipEl.focus(); return; }

  const equipVal = equipEl.value === "Autre"
    ? document.getElementById("f_equipementAutre").value.trim().toUpperCase()
    : equipEl.value;
  if (equipEl.value === "Autre" && !equipVal) { alert("Précise le type d'équipement."); return; }

  const serialEl = document.getElementById("f_numeroSerie");
  const serialVal = serialEl.value.trim();

  try {
    const meta = await idbGet("meta", "currentFile");
    if (!meta) { showScreen("home"); return; }

    if (serialVal) {
      const equipments = await idbGetAll("equipments");
      const dup = isDuplicateSerial(equipments, serialVal);
      if (dup) {
        const proceed = confirm(
          `N° de série déjà utilisé par ${dup.numEnregistrement} (${dup.equipement || "?"}).\nAjouter quand même ?`
        );
        if (!proceed) { serialEl.focus(); return; }
      }
    }

    const data = readForm();
    const record = {
      numEnregistrement: `${meta.prefix}${meta.nextNumber}`,
      etablissement: meta.etablissement,
      emplacement: meta.emplacement,
      ...data,
      equipement: equipVal,
    };

    await idbSet("equipments", undefined, record);

    meta.nextNumber += 1;
    await idbSet("meta", "currentFile", meta);

    document.getElementById("regBadge").textContent = `${meta.prefix}${meta.nextNumber}`;
    clearForm(currentDefaults(meta));
    await renderSessionList();
  } catch (err) {
    alert("Erreur lors de l'ajout : " + err.message);
    console.error(err);
  }
}

async function renderSessionList() {
  try {
    const equipments = await idbGetAll("equipments");
    const list = document.getElementById("sessionList");
    list.innerHTML = "";
    equipments.slice().reverse().forEach(item => {
      const row = document.createElement("div");
      row.textContent = `${item.numEnregistrement} — ${item.equipement} ${item.modele || ""} (${item.numeroSerie || "sans N° série"})`;
      list.appendChild(row);
    });
  } catch (err) {
    console.error("renderSessionList:", err);
  }
}