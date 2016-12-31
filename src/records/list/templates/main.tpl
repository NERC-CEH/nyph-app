<% if (obj.useTraining) { %>
<div class="list-header training">training mode</div>
<% } %>
<% if (window.nyphAdminMode) { %>
<div class="info-message"><p><strong>admin mode</strong></p>
    <p>Use admin mode to transcribe lists sent by other recorders.  Lists are distinguished by recorder name, which must be set while in admin mode (lock the recorder field to avoid typing the name each time). Records entered while in admin mode are assigned to the generic plant hunt iRecord user account, so the system cannot automatically acknowedge receipt of the records.  Please manually send an acknowledgement email to the contributer.</p>
</div>
<% } %>
<div class="info-message">
  <p>Add entries by clicking on the (+) button (top-right corner) or use the camera icon to quickly add an entry with just a photo.</p><p>When you have finished send your records by clicking Send.</p>
  <p>To modify a record click on its row below.</p>
</div>
<ul id="records-list" class="table-view no-top"></ul>
