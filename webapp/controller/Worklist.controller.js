sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment",
	'sap/m/MessageToast'
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, Fragment, MessageToast) {
	"use strict";

	return BaseController.extend("jet.MyFirstProject.controller.Worklist", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			var oViewModel,
				iOriginalBusyDelay,
				oTable = this.byId("table");

			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			// keeps the search state
			this._aTableSearchState = [];

			// Model used to manipulate control states
			oViewModel = new JSONModel({
				worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
				shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
				shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
				shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
				tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay: 0,
				inputValidation: {
					GroupID: "",
					SubGroupID: "",
					MaterialText: "",
					saveButtonEnabled: false
				}
			});

			this.setModel(oViewModel, "worklistView");

			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});
		},

		onOpenDialog: function () {
			var oView = this.getView();

			// create dialog lazily
			if (!this.pDialog) {
				this.pDialog = Fragment.load({
					id: oView.getId(),
					name: "jet.MyFirstProject.view.Dialog2",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					return oDialog;
				});
			}
			this.pDialog.then(function (oDialog) {
				oDialog.open();
			});
		},
		onCloseDialog: function () {
			this.byId("oDialog").close();
			this.getModel('worklistView').setProperty("/inputValidation/saveButtonEnabled", false);
			this.getModel('worklistView').setProperty("/inputValidation/GroupID", "");
			this.getModel('worklistView').setProperty("/inputValidation/SubGroupID", "");
			this.getModel('worklistView').setProperty("/inputValidation/MaterialText", "");

		},

		onSave: function () {

			var oModel = this.getOwnerComponent().getModel();

			var oItemRow = {

				MaterialID: "",
				MaterialText: this.getModel('worklistView').getProperty("/inputValidation/MaterialText"),
				Version: "A",
				GroupID: this.getModel('worklistView').getProperty("/inputValidation/GroupID"),
				SubGroupID: this.getModel('worklistView').getProperty("/inputValidation/SubGroupID"),
				Language: "RU"
			};

			var infoMB = this.getView().getModel("i18n").getResourceBundle().getText("infoMB");
			var sStatusSuccessi18n = this.getView().getModel("i18n").getResourceBundle().getText("messageBoxSuccsess");
			var sStatusErrori18n = this.getView().getModel("i18n").getResourceBundle().getText("messageBoxError");
			var messageBoxError = this.getView().getModel("i18n").getResourceBundle().getText("messageBoxUpdateError");
			oModel.create("/zjblessons_base_Materials", oItemRow, {
				success: function () {
					sap.m.MessageBox.show(sStatusSuccessi18n, {
						icon: sap.m.MessageBox.Icon.SUCCESS,
						title: infoMB
					});

				},
				error: function () {
					sap.m.MessageBox.error(messageBoxError);
				}
			});

			this.onCloseDialog();
		},
		removeP: function (sPath, mParameters) {
			return new Promise(function (fnResolve, fnReject) {
				var mRequestProps = jQuery.extend(true, {
					success: fnResolve,
					error: fnReject
				}, mParameters);

				this.getView().getModel().remove(sPath, mRequestProps);
			}.bind(this));
		},
		onLiveChange: function (oEvent) {

			var sText = oEvent.getParameter('value');
			var bButtonEnabled = !!this.getModel('worklistView').getProperty("/inputValidation/GroupID") && !!this.getModel('worklistView').getProperty(
				"/inputValidation/MaterialText") && !!this.getModel('worklistView').getProperty("/inputValidation/SubGroupID");

			this.getModel('worklistView').setProperty("/inputValidation/saveButtonEnabled", bButtonEnabled);
		},
		deleteRow: function () {

			var oTable = this.getView().byId("table");
			var oSelectedContexts = oTable.getSelectedContexts();
			var oModel = this.getOwnerComponent().getModel();
			var sMessageTosti18n = this.getView().getModel("i18n").getResourceBundle().getText("messageTostSelectError");
			var sdeletionSuccessfulStatus = this.getView().getModel("i18n").getResourceBundle().getText("deletionSuccessful");
			var sdeletionSuccessfulStatus = this.getView().getModel("i18n").getResourceBundle().getText("deletionErrorStatus");
			var sDeletionErrorSelected = this.getView().getModel("i18n").getResourceBundle().getText("deletionErrorSelected");
			for (var i = 0; i < oSelectedContexts.length; i++) {
				var oPath = oSelectedContexts[i].getPath();
				if (this.getView().getModel().getProperty(oPath + "/CreatedBy") != 'LAB1000009') {
					MessageToast.show(sMessageTosti18n);
					return;
				}
			}
			if (oSelectedContexts.length > 0) {
				var aPromise = oSelectedContexts.map(function (oItem) {

					return this.removeP(oItem.getPath());

				}.bind(this));
				Promise.all(aPromise).then(function (aData) {
					sap.m.MessageBox.show(sdeletionSuccessfulStatus, {
						icon: sap.m.MessageBox.Icon.SUCCESS,
						title: "Success!"
					});
				}).catch(function () {
					sap.m.MessageBox.show(sdeletionSuccessfulStatus, {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "Failed!"
					});
				});

			} else {
				sap.m.MessageBox.show(sDeletionErrorSelected, {
					icon: sap.m.MessageBox.Icon.WARNING,
					title: "Note!"
				});
			}

		},

		onUpdateFinished: function (oEvent) {

			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function (oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());

		},

		/**
		 * Event handler for navigating back.
		 * We navigate back in the browser history
		 * @public
		 */
		onNavBack: function () {
			// eslint-disable-next-line sap-no-history-manipulation
			history.go(-1);
		},

		onSearch: function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				var aTableSearchState = [];
				var sQuery = oEvent.getParameter("query");

				if (sQuery && sQuery.length > 0) {
					aTableSearchState = [new Filter("SubGroupText", FilterOperator.Contains, sQuery)];
					if (oEvent.getSource().getId() == "container-MyFirstProject---worklist--searchFieldMaterialText") {
						aTableSearchState = [new Filter("MaterialText", FilterOperator.EQ, sQuery)];
					}
				}

				this._applySearch(aTableSearchState);
			}

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function () {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject: function (oItem) {
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("MaterialID")
			});
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_applySearch: function (aTableSearchState) {
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		}

	});
});