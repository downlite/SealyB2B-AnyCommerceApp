/* **************************************************************

   Copyright 2013 Zoovy, Inc.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

************************************************************** */



//    !!! ->   TODO: replace 'username' in the line below with the merchants username.     <- !!!

var store_sealy = function() {
	var theseTemplates = new Array('');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
					
				app.rq.push(['templateFunction','homepageTemplate','onCompletes',function(P) {
					app.ext.store_sealy.u.showHomepageSlideshow();
					
					}]); 
				
				app.rq.push(['templateFunction','customerTemplate','onCompletes',function(P) {
					var $context = $(app.u.jqSelector('#'+P.parentID));
					var $countryinput = $('.countryDropDown', $context);
					if(!$countryinput.hasClass('rendered')){
						app.ext.cco.calls.appCheckoutDestinations.init({'callback':function(rd){
							$countryinput.addClass('rendered').anycontent({'templateID':'countryDropdownTemplate','datapointer':rd.datapointer})
							}});
						app.model.dispatchThis('immutable');
						}
					
					}]);
				//if there is any functionality required for this extension to load, put it here. such as a check for async google, the FB object, etc. return false if dependencies are not present. don't check for other extensions.
				r = true;

				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//actions are functions triggered by a user interaction, such as a click/tap.
//these are going the way of the do do, in favor of app events. new extensions should have few (if any) actions.
		a : {
			submitCreateAccountForm : function($form){
				var obj = $form.serializeJSON();
				
				if(obj.password !== obj.confirm_password){
					app.u.throwMessage('Sorry your passwords do not match!');
					return;
					}
				
				obj._vendor = "sealy";
				
				obj.todonote  = obj.firstname+" "+obj.lastname+"\n";
				obj.todonote += obj.email+"\n";
				obj.todonote += obj.address1+"\n";
				if(obj.address2 && obj.address2 !== ""){
					obj.todonote += obj.address2+"\n";
					}
				obj.todonote += obj.city+","+obj.region+" "+obj.postal+"\n";
				obj.todonote += "Sales Rep: "+obj.salesrep+"\n";
				obj.todonote += "Store Type: "+obj.storetype+"\n";
				obj.todonote += "Date Created: "+(new Date()).toDateString();
				
				var _tag = {
					'callback':function(rd){
						if(app.model.responseHasErrors(rd)){
							app.u.throwMessage(rd);
							}
						else {
							showContent('customer',{'show':'accountCreateConfirmation'});
							app.u.throwMessage(app.u.successMsgObject("Your account has been created and is pending approval!"));
							}
						}
					}
				
				//app.u.dump(obj);
				app.calls.appBuyerCreate.init(obj, _tag);
				app.model.dispatchThis('immutable');
				},
			toggleProdDetail : function($container){
				var $detail = $('.prodDetail', $container);
				var $buttonText = $('.buttonText', $container);
				if($detail.hasClass('showing')){
					$detail.stop().removeClass('showing').animate({'height':'0px'}, 750);
					$buttonText.text('+');
					}
				else {
					var height = 0;
					$detail.children().each(function(){
						height += $(this).outerHeight();
						app.u.dump(height);
						});
					$detail.stop().addClass('showing').animate({'height':height+'px'}, 750);
					$buttonText.text('-');
					}
				}
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//renderFormats are what is used to actually output data.
//on a data-bind, format: is equal to a renderformat. extension: tells the rendering engine where to look for the renderFormat.
//that way, two render formats named the same (but in different extensions) don't overwrite each other.
		renderFormats : {
			dumper : function($tag, data){
				app.u.dump(data.value);
				},
			
			trackingLink : function($tag,data){
				if(data.value.carrier && data.value.track){
					app.u.dump(data);
					$tag.append(data.value.carrier +' Tracking #: '+data.value.track);
					var href;
					//Tracking link values taken from http://verysimple.com/2011/07/06/ups-tracking-url/
					//Functional and tested as of 9/13/2013
					switch(data.value.carrier){
						case "UPS": 
							href = "http://wwwapps.ups.com/WebTracking/track?track=yes&trackNums=" + data.value.track;
							break;
						case "FEDX": 
							href = "http://www.fedex.com/Tracking?action=track&tracknumbers=" + data.value.track;
							break;
						case "USPS":
						default:
							href = "https://tools.usps.com/go/TrackConfirmAction_input?qtc_tLabels1=" + data.value.track
							break;
						}
					$tag.attr('href',href);
					}
				}
			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
		u : {
			showHomepageSlideshow : function(attempts){
				attempts = attempts || 0;
				var $target=$('#wideSlideshow');
				if(typeof $.fn.cycle == 'function'){
					if(!$target.hasClass('slideshowrendered')){
						$target.addClass('slideshowrendered').cycle({fx:'fade',speed:'slow',timeout:5000});  
						}
					}
				else if(attempts < 50){
					setTimeout(function(){app.ext.store_sealy.u.showHomepageSlideshow(attempts+1);},250);
					}
				else {
					app.u.dump('-> store_sealy ERROR: could not initialize homepage slideshow');
					}
				}
			}, //u [utilities]

//app-events are added to an element through data-app-event="extensionName|functionName"
//right now, these are not fully supported, but they will be going forward. 
//they're used heavily in the admin.html file.
//while no naming convention is stricly forced, 
//when adding an event, be sure to do off('click.appEventName') and then on('click.appEventName') to ensure the same event is not double-added if app events were to get run again over the same template.
		e : {
			} //e [app Events]
		} //r object.
	return r;
	}