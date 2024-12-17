function onFormSubmit(e) {
  // Get the sheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var range = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn());
  var values = range.getValues()[0];
  
  // Get column headers
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Create email body
  var emailBody = "New lawn service quote submission:\n\n";
  
  // Add each field and its value to the email
  for (var i = 0; i < headers.length; i++) {
    emailBody += headers[i] + ": " + values[i] + "\n";
  }
  
  // Send email
  MailApp.sendEmail({
    to: "jakubsmalmail@gmail.com",
    subject: "New Lawn Peak Quote Submission",
    body: emailBody
  });
}

function createTrigger() {
  // Delete any existing triggers
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  
  // Create new trigger
  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();
}
