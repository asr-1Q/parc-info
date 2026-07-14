const TEMPLATE_ROW_NUM = 4;       // ligne modèle dont on copie le style
const TEMPLATE_SHEET_NAME = "Détails";

const COLUMNS = [
  { key: "numEnregistrement",  header: "N°\nenregistrement" },
  { key: "etablissement",      header: "Etablissements" },
  { key: "equipement",         header: "Equipements" },
  { key: "emplacement",        header: "Emplacement" },
  { key: "nomUtilisateur",     header: "Nom Utilisateur" },
  { key: "numeroSerie",        header: "Numéro de Série" },
  { key: "modele",             header: "Modèle" },
  { key: "marque",             header: "Marque" },
  { key: "fabricant",          header: "Fabricant" },
  { key: "annee",              header: "Année de Fabrication" },
  { key: "caracEntree",        header: "Caractéristiques d'entrée" },
  { key: "types",              header: "Types" },
  { key: "etat",               header: "Etat" },
  { key: "dateAchat",          header: "Date d'achat" },
  { key: "retrofit",           header: "Rétrofit" },
  { key: "statut",             header: "Statut Actuel" },
  { key: "disponibilite",      header: "Disponibilité" },
  { key: "taux",               header: "Taux d'occupation" },
  { key: "protege",            header: "Protégé" },
  { key: "dateEntretien",      header: "Date d'entretien" },
  { key: "prochainEntretien",  header: "Prochaine Entretien" },
  { key: "nbreMaintenances",   header: "Nbre de maintenances" },
  { key: "dureeVie",           header: "Durée de Vie" },
  { key: "caracActuelles",     header: "Caractéristiques Actuelles" },
  { key: "dateSortie",         header: "Date de Sortie" },
  { key: "donneurOrdre",       header: "Donneur d'ordre" },
  { key: "commentaire",        header: "Commentaire" },
];

let templateBufferCache = null;

async function getTemplateBuffer() {
  if (templateBufferCache) return templateBufferCache;
  const res = await fetch("template/template.xlsx");
  if (!res.ok) throw new Error("template.xlsx introuvable (vérifie template/template.xlsx)");
  templateBufferCache = await res.arrayBuffer();
  return templateBufferCache;
}

export async function buildWorkbook(equipments) {
  const buffer = await getTemplateBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const ws = wb.getWorksheet(TEMPLATE_SHEET_NAME);
  if (!ws) throw new Error(`Feuille "${TEMPLATE_SHEET_NAME}" absente du template`);

  const templateRow = ws.getRow(TEMPLATE_ROW_NUM);
  let insertAt = ws.actualRowCount + 1;
  if (insertAt < TEMPLATE_ROW_NUM + 1) insertAt = TEMPLATE_ROW_NUM + 1;

  equipments.forEach((item, idx) => {
    const row = ws.getRow(insertAt + idx);
    COLUMNS.forEach((col, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.style = JSON.parse(JSON.stringify(templateRow.getCell(colIdx + 1).style));

      if (col.key === "dureeVie") {
        cell.value = { formula: `YEAR(TODAY())-Tableau3[[#This Row],[Rétrofit]]` };
        return;
      }
      let v = item[col.key];
      if (v === undefined || v === null || v === "") { cell.value = "/"; return; }
      if (["annee", "retrofit", "nbreMaintenances", "taux"].includes(col.key) && !isNaN(Number(v))) {
        v = Number(v);
      }
      cell.value = v;
    });
    row.commit();
  });

  return wb;
}

export async function downloadWorkbook(wb, filename) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}