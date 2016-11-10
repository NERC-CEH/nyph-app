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
      Please enter a scientific or English plant name.
      <br/>
      If you do not know the name then select the option below and be sure to include photos.
    </p>
  </div>


  <ul class="table-view">
    <li id="unknown" class="table-view-cell">
      <h3 class="taxon">Unknown plant</h3>
      <% if (!obj.removeEditBtn) { %>
      <button class="btn icon icon-edit icon-small"></button>
      <% } %>
    </li>
  </ul>
</div>
