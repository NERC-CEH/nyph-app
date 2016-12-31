<% if (obj.taxon) { %>
  <a href="#records/<%- obj.id %><%- obj.onDatabase ? '' : '/edit' %>">
<% } else { %>
  <a href="#records/<%- obj.id %>/edit/taxon">
<% } %>

    <div class="media-object pull-left photo">
      <% if (obj.idIncomplete) { %>
      <div class="taxonphotomessage">photo required</div>
      <% } else { %>
      <%= obj.img %>
      <% } %>
    </div>
    <div class="pull-right">
    <% if (obj.saved) { %>
      <% if (obj.isSynchronising) { %>
         <div class="online-status icon icon-plus spin"></div>
      <% } else { %>
         <div class="online-status icon icon-send <%- obj.onDatabase ? 'cloud' : 'local' %>">
             <% if (!obj.onDatabase) { %><div style="font-size: 50%;">not yet sent</div><% } %>
         </div>
      <% } %>

      <div class="edit">
        <% if (!obj.onDatabase && !obj.isSynchronising) { %>
          <% if (obj.taxon) { %>
          <div data-attr="date" title="edit date" class="js-attr icon icon-calendar"></div>
          <div data-attr="location" title="edit location" class="js-attr icon icon-location"></div>
          <div data-attr="comment" title="edit comment" class="js-attr icon icon-comment"></div>
          <% } %>
        <% } %>
        <div id="delete" title="delete record" class="delete icon icon-cancel"></div>
      </div>

    <% } else { %>
      <div class="edit">
        <% if (obj.taxon) { %>
        <div data-attr="date" class="js-attr icon icon-calendar"></div>
        <div data-attr="location" class="js-attr icon icon-location"></div>
        <div data-attr="comment" class="js-attr icon icon-comment"></div>
        <% } %>

        <div id="delete" class="delete icon icon-cancel"></div>
      </div>
    <% } %>
    </div>

    <div class="media-body">
      <div class="species"> <%= obj.taxon %></div>

      <% if (obj.date) { %>
      <div class="date<%- obj.dateRangeError ? ' warn' : '' %>"><%= obj.date %></div>
      <% } else { %>
      <div class="date error">Date</div>
      <% } %>

      <% if (obj.location) { %>
      <% if (obj.location_name) { %>
      <div class="location"><%= obj.location_name %></div>
      <%  } else { %>
      <div class="location error">No location name</div>
      <% } %>
      <% if (obj.location_gridref) { %>
      <div class="location"><%= obj.location_gridref %></div>
      <%  } %>
      <% } else { %>
      <% if (obj.isLocating) { %>
      <div class="location warn">Locating...</div>
      <% } else if (obj.location_name) { %>
      <div class="location error">No grid reference</div>
      <% } else { %>
      <div class="location error">No location</div>
      <% } %>
      <% } %>
      
      <% if (obj.recorder && window.nyphAdminMode) { %>
      <div class="location"><%= obj.recorder %></div>
      <% } %>

      <div class="attributes">
        <div class="comment"><%= obj.comment %></div>
      </div>
    </div>
  </a>