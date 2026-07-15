export const FORM_IDS = {
  equipement: "f_equipement",
  nomUtilisateur: "f_nomUtilisateur",
  numeroSerie: "f_numeroSerie",
  modele: "f_modele",
  marque: "f_marque",
  fabricant: "f_fabricant",
  annee: "f_annee",
  caracEntree: "f_caracEntree",
  types: "f_types",
  etat: "f_etat",
  statut: "f_statut",
  disponibilite: "f_disponibilite",
  taux: "f_taux",
  protege: "f_protege",
  caracActuelles: "f_caracActuelles",
  commentaire: "f_commentaire",
};

const TEXT_FIELDS = new Set([
  "nomUtilisateur", "numeroSerie", "modele", "marque", "fabricant",
  "caracEntree", "types", "caracActuelles", "commentaire",
]);

export function readForm() {
  const data = {};
  for (const [key, id] of Object.entries(FORM_IDS)) {
    let val = document.getElementById(id).value.trim();
    if (TEXT_FIELDS.has(key) && val) val = val.toUpperCase();
    data[key] = val;
  }
  return data;
}

export function clearForm(defaults = {}) {
  for (const id of Object.values(FORM_IDS)) {
    document.getElementById(id).value = "";
  }
  document.getElementById("f_equipementAutre").value = "";
  document.getElementById("f_equipementAutre").classList.add("hidden");
  if (defaults.statut) document.getElementById("f_statut").value = defaults.statut;
  if (defaults.dispo) document.getElementById("f_disponibilite").value = defaults.dispo;
  if (defaults.protege) document.getElementById("f_protege").value = defaults.protege;
  if (defaults.fabricant) document.getElementById("f_fabricant").value = defaults.fabricant;
  if (defaults.taux !== undefined && defaults.taux !== "") document.getElementById("f_taux").value = defaults.taux;
  document.getElementById("dupAlert").classList.add("hidden");
  document.getElementById("knownAlert").classList.add("hidden");
}