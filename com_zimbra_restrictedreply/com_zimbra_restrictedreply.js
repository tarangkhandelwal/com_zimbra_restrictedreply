
function com_zimbra_restrictedreply_HandlerObject() {
}

com_zimbra_restrictedreply_HandlerObject.prototype = new ZmZimletBase();
com_zimbra_restrictedreply_HandlerObject.prototype.constructor = com_zimbra_restrictedreply_HandlerObject;

/**
 * Simplify handler object
 */
var RestrictedReply = com_zimbra_restrictedreply_HandlerObject;

RestrictedReply.VIEW_CLASS = "replyView"
RestrictedReply.OP = "RESTRICTED_REPLY_ZIMLET";
RestrictedReply.MAIL_HEADER = "X-RestrictReply";
/**
 * Initializes the zimlet.
 */
RestrictedReply.prototype.init = function() {
    if (appCtxt.get(ZmSetting.MAIL_ENABLED)) {
    AjxPackage.require({name:"MailCore", callback:new AjxCallback(this, this._applyRequestHeaders)});
    }
};

/**
 * This method is called by the Zimlet framework when showing an application view.
 * 
 * @param {string}    view    the name of the view
 */
RestrictedReply.prototype.onShowView = function(viewId) {
    var view = appCtxt.getAppViewMgr().getCurrentView();
    var isComposeView = (view && view.isZmComposeView);
    var isReplyScreen = view._action == ZmOperation.REPLY || view._action == ZmOperation.REPLY_ALL;  
    var isHeaderPresent = isComposeView && isReplyScreen && view._msg.attrs && view._msg.attrs[RestrictedReply.MAIL_HEADER] == "true";
    //if compose view,reply mode & RestrictedReply.MAIL_HEADER is set to true.
    if(isHeaderPresent) {
      Dwt.addClass(view.getHtmlElement(), RestrictedReply.VIEW_CLASS);
      this.disableFeature("TO", view);
      this.disableFeature("CC", view);
      this.disableFeature("BCC", view);
      this.lastViewObj = view;
    };

    if(!isHeaderPresent && Dwt.hasClass(view.getHtmlElement(), RestrictedReply.VIEW_CLASS)) {
      if(this.lastViewObj && (view === this.lastViewObj)){
        //enable buttons
        this.resetComposeView(view);
        this.lastViewObj = null;
      };

      Dwt.delClass(view.getHtmlElement(), RestrictedReply.VIEW_CLASS);
    };
};

RestrictedReply.prototype.disableFeature = function(key, view){
    this.disableField(view._recipients.getField(key));
    this.disableButton(view._recipients._button[key]);
};

RestrictedReply.prototype.disableField = function(node){
  node.disabled = true;
  Dwt.addClass(node.parentNode,"ZDisabled");
};

RestrictedReply.prototype.disableButton = function(button) {
  button.setEnabled(false);
};

RestrictedReply.prototype.enableField = function(node){
  node.removeAttribute("disabled");
  Dwt.delClass(node.parentNode,"ZDisabled");
};

RestrictedReply.prototype.enabledButton = function(button) {
  button.setEnabled(true);
};

RestrictedReply.prototype.enableFeature = function(key, view) {
    this.enableField(view._recipients.getField(key));
    this.enabledButton(view._recipients._button[key]);
};

RestrictedReply.prototype.resetComposeView = function(view) {
      this.enableFeature("TO", view);
      this.enableFeature("CC", view);
      this.enableFeature("BCC", view);
};

/**
 * This method gets called by the Zimlet framework when a toolbar is created.
 *
 * @param {ZmApp} app
 * @param {ZmButtonToolBar} toolbar
 * @param {ZmController} controller
 * @param {String} viewId
 *
 */
RestrictedReply.prototype.initializeToolbar = function(app, toolbar, controller, viewId) {
      var viewType = appCtxt.getViewTypeFromId(viewId);
      if (viewType == ZmId.VIEW_COMPOSE) {
        var op = toolbar.getOp(ZmOperation.COMPOSE_OPTIONS);
        if (op) {
          var menu = op.getMenu();
          if (menu) {
            var mi = menu.getMenuItem(RestrictedReply.OP);
            if (mi) {
              mi.setChecked(false);
              appCtxt.getCurrentView().__restrictedReplyZimlet_doRestrict = false;//reset
            } else {
              mi = menu.createMenuItem(RestrictedReply.OP, {image:"Padlock", text:"Restrict changing To/CC while replying", style:DwtMenuItem.CHECK_STYLE});
              mi.addSelectionListener(new AjxListener(this, this._handleAddRestrictReplyHeader, controller, mi));
            }
          }
        }
      }
    };

RestrictedReply.prototype._handleAddRestrictReplyHeader = function(controller, ev) {
      if(!ev)  {
        ev = window.event;
      }
      if(ev && ev.item && ev.item.getChecked)  {
        //set some unique variable ("__restrictedReplyZimlet_doRestrict") on ZmComposeView
        // since we need to deal with multiple compose-tabs.
        appCtxt.getCurrentView().__restrictedReplyZimlet_doRestrict = ev.item.getChecked();
      }
    };

/**
 * Called by the framework just before sending email.
 * @param {array} customMimeHeaders An array of custom-header objects.
 *          Each item in the array MUST be an object that has "name" and "_content" properties.
 */
RestrictedReply.prototype.addCustomMimeHeaders = function(customMimeHeaders) {
  //check if the compose view has __restrictedReplyZimlet_doRestrict set to true (is true when user selects encrypt menu)
  if(appCtxt.getCurrentView().__restrictedReplyZimlet_doRestrict) {
    customMimeHeaders.push({name:RestrictedReply.MAIL_HEADER, _content:true});
  }
  appCtxt.getCurrentView().__restrictedReplyZimlet_doRestrict = false;//reset
};

/**
 * Applies the request headers.
 * 
 */
RestrictedReply.prototype._applyRequestHeaders =
function() {
  ZmMailMsg.requestHeaders[RestrictedReply.MAIL_HEADER] = RestrictedReply.MAIL_HEADER;
};