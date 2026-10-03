// À coller dans Google Sheets : Extensions > Apps Script
function doPost(e) {
  const p = e.parameter, sh = SpreadsheetApp.getActiveSheet();
  if (sh.getLastRow() === 0) {
    sh.appendRow(["Date","Produit","Quantité","Total","Nom","Téléphone","Ville","Quartier","Adresse","Commentaire","Statut"]);
  }
  sh.appendRow([new Date(), p.produit, p.quantite, p.total, p.nom, "'" + p.telephone,
                p.ville, p.quartier, p.adresse, p.commentaire || "", "Nouvelle"]);
  return ContentService.createTextOutput("ok");
}
function doGet() { return ContentService.createTextOutput("Le script fonctionne."); }
