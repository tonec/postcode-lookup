

(function ( $ ) {
	$.addressLookup = function ( options ) {

		var pcl = {

				options: $.extend( {
					postcodeInput: '#postcode',
					submitBtn: '#search',
					inputContainer: '#postcode-lookup',
					errorContainer: '#postcode-lookup .pc-search',
					resultsContainer: '#results',
					addressFields: '#pc-address-fields',
					manualTxt: 'Or enter your address manually',
					url: '/search/address/index/format/json',
					showaddressfields: false,
					minHeight: 140,
					supportTouch: true,
					address1: '#address1',
					address2: '#address2',
					address3: '#address3',
					town: '#town',
					forcedMaxHeight: -1
				}, options ), 

				// Keys for keyboard navigation
				keyMap: {
					'left' : 37,
					'up': 38,
					'right': 39,
					'down': 40,
					'enter': 13,
					'tab': 9
				},

				init: function () {

					// Query the dom and store the various elements required
					pcl.postcodeInput		= $( this.options.postcodeInput );
					pcl.submitBtn			= $( this.options.submitBtn );
					pcl.inputContainer		= $( this.options.inputContainer );
					pcl.errorContainer		= $( this.options.errorContainer );
					pcl.resultsContainer	= $( this.options.resultsContainer );
					pcl.addressFields 		= $( this.options.addressFields );
					pcl.address1			= $( this.options.address1 );
					pcl.address2			= $( this.options.address2 );
					pcl.address3			= $( this.options.address3 );
					pcl.town 				= $( this.options.town );
					pcl.forcedMaxHeight		= this.options.forcedMaxHeight;
					pcl.setCurrent			= '';

					// Trigger the lookup when the submit button is clicked
					pcl.submitBtn.bind( 'click', function ( event ) {
						event.preventDefault();
						pcl.search( pcl.postcodeInput.val() );
					});

					// Hide the address fields when the page first loads
					if ( !this.options.showaddressfields ) {
						pcl.hideaddressfields();
					}
				},
 
				// Take the postcode entered and query the lookup service with it
				search: function ( postcode ) {

					// Switch on user feedback
					pcl.feedbackon();

					$.getJSON( this.options.url, { postcode: postcode }, function( data ) {

						// Remove any previous errors
						pcl.inputContainer.find( '.error' ).remove();  

						// If the response contains errors send the error message to be displayed
						if ( data.errors ) {
							pcl.errors( data.error_messages )
						// Otherwise, process the data in the response
						} else {
							pcl.process( data );
						}

						// Switch off user feedback
						pcl.feedbackoff();
					});
				},

				// Loop through the data and extract the addresses
				process: function ( data ) {
					var address = '';

					pcl.addresses = [];

					for ( var i = 0; i < data.addresses.length; i++ ) {
						
						address = data.addresses[ i ];

						for ( var item in address ) {
							if ( address[ item ] === null ) {
								delete address[ item ];
							}
						}

						pcl.addresses.push( address );
					}

					pcl.build();
				},

				// Build the html dropdown of addresses that'll be injected into the dom
				build: function () {

					var i = 0;

					pcl.results = $( '<div id="pc" class="address-list"><ul></ul></div>' );
						
					for ( var key in pcl.addresses ) {

						var result = pcl.addresses[ key ],
							address = '';

						for ( var item in result ) {
							address += result[ item ] + ', ';
						}

						address = address.slice( 0, -2 );
						pcl.results.find( 'ul' ).append( '<li><a data-address-index="' + i + '">' + address + '</a></li>' );

						i++;
					}

					if ( pcl.isTouch() ) {
						var target = 'body .page';
						pcl.postcodeInput.blur();
						$( pcl.results ).dialog( pcl.results, target, pcl.address1 );
					} else {
						pcl.resultsContainer.html( pcl.results ).find( 'ul' );
						pcl.setHeight();
					}
					pcl.addevents();
				},

				addevents: function () {

					// When an address in the results dropdown is selected
					$( pcl.results ).find( 'li' ).bind( 'click', function ( event ) { 
						pcl.populatefields( event.target )
					});

					// Any click outside of the results dropdown will close it
					$( 'html, body' ).on( 'click', function ( event ) {
						if ( !$( event.target ).parents().hasClass( 'address-list' ) ) {
							pcl.close();
						}
					});

					// Add keyboard event handler
					$( document ).bind( 'keydown.pclookup', function ( event ) {
							pcl.keyboardnav( event );
					});
				},

				// Insert the selected address into the appropriate address fields
				populatefields: function ( target ) {
					var addressindex = $( target ).attr( 'data-address-index' ),
						address = pcl.addresses[ addressindex ];

					if ( !this.options.showaddressfields ) {
						pcl.showaddressfields();
						pcl.manualLink.remove();
					}

					pcl.close();
					
					$( pcl.address1 ).val( address.address1 ).focus();
					$( pcl.address2 ).val( address.address2 );
					$( pcl.address3 ).val( address.address3 );
					$( pcl.town ).val( address.town );		
				},

				hideaddressfields: function () {
					pcl.manualLink = $( '<a>' + pcl.options.manualTxt + '</a>' );

					pcl.addressFields.hide()
					pcl.inputContainer.append( pcl.manualLink );

					pcl.manualLink.bind( 'click', function () {

						pcl.showaddressfields();
						pcl.manualLink.remove();
					});
				},

				showaddressfields: function () {
					pcl.addressFields.show()
				},

				feedbackon: function () {
					pcl.submitBtn.disable = true;
					pcl.postcodeInput.after( '<div class="throbber"></div>' );
				},

				feedbackoff: function () {
					pcl.submitBtn.disable = false;
					pcl.inputContainer.find( '.throbber' ).remove();
				},

				keyboardnav: function ( event ) {
					var keycode = event.keyCode,
						first = $( pcl.results ).find( 'li:first' ).addClass( 'first' ),
						last = $( pcl.results ).find( 'li:last' ).addClass( 'last' ),
						prev, next;

					pcl.postcodeInput.blur();

					switch ( keycode ) {
						case pcl.keyMap.enter:
							pcl.populatefields( pcl.current.find( 'a' ) );
							break;

						case pcl.keyMap.tab:
							pcl.populatefields( pcl.current.find( 'a' ) );
							break;

						case pcl.keyMap.up:
							if ( pcl.current.hasClass( 'first' ) ) {
								break;
							} else {
								pcl.current = pcl.current.prev( 'li' );
							}
							pcl.setCurrent( 'up' );
							break;

						case pcl.keyMap.down:
							if ( pcl.current === '' ) {
								pcl.current = $( pcl.results ).find( 'li:first' )
							} else if ( pcl.current.hasClass( 'last' ) ) {
								break
							} else {
								pcl.current = pcl.current.next( 'li' );
							}

							pcl.setCurrent( 'down' )
							break;

						default:
							break;
					}

					event.preventDefault();
				},

				setCurrent: function ( direction ) {
					$( pcl.results ).find( 'li' ).removeClass( 'active' );
					pcl.current.addClass( 'active' );

					pcl.setScroll();
				},

				setScroll: function () {
					var height = pcl.current.prevAll('li').outerHeight() * pcl.current.prevAll('li').length;

					pcl.results.animate({ scrollTop: height + 'px' }, 0);
				},

				setHeight: function () {
					if (pcl.forcedMaxHeight != -1) {
						pcl.results.height( pcl.forcedMaxHeight ).css( 'overflow', 'auto' );
					} else {
						var windowHeight = $( window ).height(),
							resHeight = pcl.results.height(),
							resPos = pcl.results.offset().top - $( window ).scrollTop(),
							maxHeight = windowHeight - resPos - 20;
	
						if ( maxHeight < pcl.options.minHeight ) {
							maxHeight = pcl.options.minHeight - 20;
						}
	
						if ( resHeight > maxHeight ) {
							pcl.results.height( maxHeight ).css( 'overflow', 'auto' );
						}
					}
				},

				close: function () {
					$( '#pc' ).remove();
					$( document ).unbind( 'keydown.pclookup' );
					pcl.current = '';
				},

				errors: function ( error ) {
					pcl.errorContainer.after( '<p class="error">' + error + '</p>' );
				},

				isTouch: function () {
				if ( ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch ) {
					return true;
				} else {
					return false;
				}
			}

		};

		pcl.init();	
	}; 
})( jQuery );

