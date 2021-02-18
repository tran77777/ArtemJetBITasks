sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"../model/formatter",
	'sap/m/MessageToast',
	"sap/m/Dialog",
	"sap/m/DialogType",
	"sap/m/Button",
	"sap/m/ButtonType",
	"sap/m/Text"

], function (BaseController, JSONModel, History, formatter, MessageToast, Dialog, DialogType, Button, ButtonType, Text) {
	"use strict";

	return BaseController.extend("jet.MyFirstProject.controller.Object", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {

			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var iOriginalBusyDelay,
				oViewModel = new JSONModel();

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
				// Restore original busy indicator delay for the object view
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler  for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */
		onNavBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("worklist", {}, true);

			}
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("zjblessons_base_Materials", {
					MaterialID: sObjectId
				});
				this.getModel("objectView").setData({
					busy: true,
					delay: 0,
					buttonEnabled: false,
					enableChange: false,
					editableForm: false,
					selectedTab: "List"

				});

				this._bindView("/" + sObjectPath);
			}.bind(this));

		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function (sObjectPath) {
			var oViewModel = this.getModel("objectView"),
				oDataModel = this.getModel();

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oDataModel.metadataLoaded().then(function () {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function () {
			var oView = this.getView(),
				oViewModel = this.getModel("objectView"),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}

			var oResourceBundle = this.getResourceBundle(),
				oObject = oView.getBindingContext().getObject(),
				sObjectId = oObject.MaterialID,
				sObjectName = oObject.Created;

			oViewModel.setProperty("/busy", false);

			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},
		onPressRefresh: function () {
			this.getView().getModel().refresh(true);
		},
		onLiveChange: function () {
			var bHasPendingChanges = this.getView().getModel().hasPendingChanges();
			this.getView().getModel("objectView").setProperty("/buttonEnabled", bHasPendingChanges);
		},
		
		onFilterSelect: function (oEvent) {
			var sKey=oEvent.getParameter("key");
			this.getView().getModel("objectView").setProperty("/selectedTab", sKey);
			this.getView().getModel("objectView").setProperty("/buttonEdit", sKey==="Form");
		},
		onSelects:function(oEvent){
		
		MessageToast.show(oEvent.getSource().getValue())
		},
		onPressChange: function (oEvent) {
debugger
			var bEnableChange = this.getView().getModel("objectView").getProperty("/enableChange");
			if (this.validateUser()) {
				this.getView().getModel("objectView").setProperty("/enableChange", !bEnableChange);
				if (this.getView().getModel().hasPendingChanges()) {

					this.openApproveDialog();
					return;
				}
			} else {
				var sMessageTosti18n = this.getView().getModel("i18n").getResourceBundle().getText("messageTostUpdateError");
				oEvent.getSource().setState(this.validateUser());
				MessageToast.show(sMessageTosti18n);
			}
		},
		validateUser: function (oEvent) {
		
			return this.getView().byId("CreatedByInput").getText() === "LAB1000009";
		},

		onSelect: function (oEvent) {

			var oPath = this.getView().getBindingContext();
			var iIndex = oEvent.getSource().getSelectedIndex() + 1;
			this.getView().getModel().setProperty("GroupID", String(iIndex), oPath);
			this.onLiveChange();
		},
		onPressSubmitChanges: function (oEvent) {

			this.getView().setBusy(true);
			var messageBoxUpdate = this.getView().getModel("i18n").getResourceBundle().getText("messageBoxUpdate");
			var messageBoxError = this.getView().getModel("i18n").getResourceBundle().getText("messageBoxUpdateError");
			var infoMB = this.getView().getModel("i18n").getResourceBundle().getText("infoMB");
			var oModel = this.getView().getModel();

			oModel.submitChanges({
				success: function () {
					sap.m.MessageBox.show(messageBoxUpdate, {
						icon: sap.m.MessageBox.Icon.SUCCESS,
						title: infoMB
					});
					this.onLiveChange();
					
					this.getView().getModel("objectView").setProperty("/enableChange", false);
					this.getView().setBusy(false);
					this.getView().getModel().resetChanges();

				}.bind(this),
				error: function () {
					sap.m.MessageBox.show(messageBoxError, {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: infoMB
					});
					this.getView().setBusy(false);
				}.bind(this)
			});
		},

		onPressResetChanges: function () {
			debugger
			this.getView().byId("smartForm").setEditable(false);
			this.getView().getModel().resetChanges();
			this.onLiveChange();
		},
		handleCancelPress:function(){
			this.getView().getModel("objectView").setProperty("/enableChange", false);
			this.onPressResetChanges();
		},
		

		openApproveDialog: function () {
			var dialogSaveButtonText = this.getView().getModel("i18n").getResourceBundle().getText("dialogSaveButtonText");
			var dialogCancelButtonText = this.getView().getModel("i18n").getResourceBundle().getText("dialogCancelButtonText");
			if (!this.oApproveDialog) {
				this.oApproveDialog = new Dialog({
					type: DialogType.Message,
					title: "Confirm",
					content: new Text({
						text: "Save changes?"
					}),
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: dialogSaveButtonText,
						press: function () {
							this.onPressSubmitChanges();
							this.oApproveDialog.close();
						}.bind(this)
					}),
					endButton: new Button({
						text: dialogCancelButtonText,
						press: function () {
	
							this.getView().getModel("objectView").setProperty("/enableChange", false);
							this.oApproveDialog.close();
							this.onPressResetChanges();
						}.bind(this)
					})
				});
			}

			this.oApproveDialog.open();
		},
		handleEditToggled: function (oEven) {
			debugger
		this.getView().getModel("objectView").setProperty("/editableForm", false);
		this.getView().byId("smartForm").setEditable(true);
	
		},
		

	});

});