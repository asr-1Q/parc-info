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
  dateAchat: "f_dateAchat",
  retrofit: "f_retrofit",
  statut: "f_statut",
  disponibilite: "f_disponibilite",
  taux: "f_taux",
  protege: "f_protege",
  dateEntretien: "f_dateEntretien",
  prochainEntretien: "f_prochainEntretien",
  nbreMaintenances: "f_nbreMaintenances",
  caracActuelles: "f_caracActuelles",
  dateSortie: "f_dateSortie",
  donneurOrdre: "f_donneurOrdre",
  commentaire: "f_commentaire",
};

export function readForm() {
  const data = {};
  for (const [key, id] of Object.entries(FORM_IDS)) {
    data[key] = document.getElementById(id).value.trim();
  }
  return data;
}

export function clearForm() {
  for (const id of Object.values(FORM_IDS)) {
    document.getElementById(id).value = "";
  }
  document.getElementById("dupAlert").classList.add("hidden");
}