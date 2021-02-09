sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"../model/formatter",
	'sap/m/MessageToast',
	"../model/formatter"
], function (BaseController, JSONModel, History, formatter, MessageToast) {
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
				oViewModel = new JSONModel({
					busy: true,
					delay: 0,
					viewMode:"D"
					
				});

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
				this._bindView("/" + sObjectPath);
			}.bind(this));
			this.getView().getModel("objectView").setProperty("/viewMode","D");
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
		handleEditPress: function () {

			if (this.validationCreatedBy()) {
				this.getView().getModel("objectView").setProperty("/viewMode","E");
			}
		},
		validationCreatedBy: function () {
			var sMessageTosti18n = this.getView().getModel("i18n").getResourceBundle().getText("messageTostUpdateError");
			if (this.getView().byId("CreatedByInput").getText() !== "LAB1000009") {
				MessageToast.show(sMessageTosti18n);
				return false;
			} else {
				return true;
			}
		},
		handleSavePress: function () {

			this.getView().setBusy(true);
			var messageBoxUpdate = this.getView().getModel("i18n").getResourceBundle().getText("messageBoxUpdate");
			var messageBoxError = this.getView().getModel("i18n").getResourceBundle().getText("messageBoxUpdateError");
			var oModel = this.getOwnerComponent().getModel();
			var infoMB = this.getView().getModel("i18n").getResourceBundle().getText("infoMB");
			oModel.submitChanges({
				success: function () {
					sap.m.MessageBox.show(messageBoxUpdate, {
						icon: sap.m.MessageBox.Icon.SUCCESS,
						title: infoMB
					});
					this.getView().setBusy(false);
					this.cancelChanges();
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
		handleCancelPress: function () {
			this.cancelChanges();
		},
		cancelChanges: function () {
			this.getView().getModel("objectView").setProperty("/viewMode","D");
			this.getView().getModel().resetChanges();
		}

	});

});