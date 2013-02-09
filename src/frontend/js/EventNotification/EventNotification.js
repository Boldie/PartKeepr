Ext.define('PartKeepr.EventNotification', {
		extend: 'Ext.util.Observable',

		requeryTask: null,

		constructor: function () {
			console.log("Event: construct");
			this.requeryTask = new Ext.util.DelayedTask(function(){
			    this.doCall();
			});

			this.callParent();
		},
		startService: function(){
			this.doCall();
		},
		startListeningTo: function (eventname) {
			console.log("startListeningTo",eventname);
			this.addEvents(eventname);

			var call = new PartKeepr.ServiceCall(
					"EventNotification",
					"registerListener");
			call.setParameter("event",eventname);
			call.setHandler( Ext.bind(this.fireEvent, this, [eventname,eventname], false ));
			call.doCall();
		},
		endListeningTo: function (eventname) {
			log.console("endListeningTo",eventname);
			var call = new PartKeepr.ServiceCall(
					"EventNotification",
					"deregisterListener");
			call.setParameter("event",eventname);
			call.doCall();
		},
		doCall: function () {
			console.log("Event: doCall");
			var callDefinition = Ext.encode({
				"long": true
			});

			var headers = {
				"call": 'isNotified',
				"lang": Ext.getLocale()
			};

			headers.session = PartKeepr.getApplication().getSessionManager().getSession();

			Ext.Ajax.request({
				url: PartKeepr.getBasePath() + '/EventNotification/isNotified',
				success: Ext.bind(this.onSuccess, this),
				failure: Ext.bind(this.onError, this),
				method: "POST",
				params: callDefinition,
				headers: headers
			});
		},
		startTimer: function(){
			this.requeryTask.delay(5000);
		},
		onSuccess: function (responseObj, options) {
			try {
				var response = Ext.decode(responseObj.responseText);
			} catch (ex) {
				var exception = {
					message: i18n("Critical Error"),
					detail: i18n("The server returned a response which we were not able to interpret.")
			};

				var request = {
					response: responseObj.responseText,
					request: Ext.encode(options)
			};

			PartKeepr.ExceptionWindow.showException(exception, request);
			startTimer();
			return;
			}


			if (response.status == "error") {
				this.displayError(response.exception);
				PartKeepr.getApplication().getStatusbar().setStatus({
					text: this.getErrorMessage(response.exception),
					iconCls: 'x-status-error',
					clear: {
						useDefaults: true,
						anim: false
					}
				});
				startTimer();
				return;
			}

			if (response.status == "systemerror") {
				this.displaySystemError(response);
				PartKeepr.getApplication().getStatusbar().setStatus({
					text: this.getErrorMessage(response),
					iconCls: 'x-status-error',
					clear: {
						useDefaults: true,
						anim: false
					}
				});
				startTimer();
				return;
			}

			var notifiedEvents = response.response.data;
			console.log(notifiedEvents);
			for( var i = 0; i < notifiedEvents.length; ++i  ){
				var event = notifiedEvents[i];
				console.log("Notifying event: " , event );
				this.fireEvent(event,event);
			}
			this.doCall();
		},
		onError: function (response, options) {
			var request;

			try {
	            var data = Ext.decode(response.responseText);

	            request = {
					response: response.responseText,
					request: Ext.encode(options)
			};

			PartKeepr.ExceptionWindow.showException(data.exception, request);
	        } catch (ex) {
			var exception = {
					message: i18n("Critical Error"),
					detail: i18n("The server returned a response which we were not able to interpret."),
					backtrace: response.responseText
			};

			request = {
					response: response.responseText,
					request: Ext.encode(options)
			};

			PartKeepr.ExceptionWindow.showException(exception, request);
	        }

			startTimer();
		},
		displayError: function (obj) {
			Ext.Msg.show({
				title: i18n("Error"),
				msg: this.getErrorMessage(obj),
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.ERROR

			});
		},
		getErrorMessage: function (obj) {
			var errorMsg;

			if (obj.message === "") {
				errorMsg = obj.exception;
			} else {
				errorMsg = obj.message;
			}

			return errorMsg;
		},
		displaySystemError: function (obj) {
			var errorMsg;

			errorMsg = "Error Message: " + obj.message+"<br>";
			errorMsg += "Exception:"+obj.exception+"<br>";
			errorMsg += "Backtrace:<br>"+str_replace("\n", "<br>", obj.backtrace);

			Ext.Msg.maxWidth = 800;

			Ext.Msg.show({
				title: i18n("System Error"),
				msg: errorMsg,
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.ERROR

			});
		}

	});
