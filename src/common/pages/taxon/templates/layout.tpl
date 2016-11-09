<div class="input-row">
  <label class="item-input-wrapper pull-left">
    <span class="media-object pull-left icon icon-search"></span>
    <input id="taxon" type="search" placeholder="Species name"  autocorrect="off" autocomplete="off" autofocus/>
  </label>
  <span class="delete media-object pull-right icon icon-cancel"></span>
</div>
<div id="suggestions">
  <div class="info-message">
    <p>
      Please enter the plant name, you can use scientific or English names.
      Select the option below if you wish us to identify it from a photo.
    </p>
  </div>


  <ul class="table-view">
    <li id="unknown" class="table-view-cell">
      <h3 class="taxon">Unknown Flowering Plant</h3>
      <% if (!obj.removeEditBtn) { %>
      <button class="btn icon icon-edit icon-small"></button>
      <% } %>
    </li>
  </ul>
</div>