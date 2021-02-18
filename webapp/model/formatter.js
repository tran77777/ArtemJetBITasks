sap.ui.define([], function () {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		numberUnit : function (sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},
		formatRadioButton:function (sValue) {
			return (sValue !== null) ? parseInt(sValue, 10)-1:-1;
		},
		
		formatInfo:function (sUser,dDate,Modified) {
		
		var oDate=	sap.ui.core.format.DateFormat.getDateInstance({
			pattern : "yyyy/MM/dd"
			});
				
			if(!!sUser){
				var sUser=	sUser.substr(3);
				
			}
		
		return this.getView().getModel("i18n").getResourceBundle().getText("labelCreatedBy")+": "+ oDate.format(dDate)+ ", "+this.getView().getModel("i18n").getResourceBundle().getText("labelCreated")+
		": " +sUser+", "+this.getView().getModel("i18n").getResourceBundle().getText("labelModified")+': '+oDate.format(Modified);
		}

	};

});