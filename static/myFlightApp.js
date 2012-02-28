/*////////////
DATA MODEL
*/////////////

myFlightApp = ( function() {
		var maxLength = 15;
		var friendCount;
		var friendList = [];
		var myLocList = [];
		var myLoc = '';
		var myDepartDate = '';
		var myReturnDate = '';
	
		function compareLocID(a, b) {
   			return (a.current_location.id - b.current_location.id);
  		}
  	
  		function compareLocCount(a, b) {
			return (b.friendCount - a.friendCount); 
  		}

		return {
			setMaxLocations : function(x) {
				maxLength = ( typeof x === 'number') ? x : 15;
			},
			getMaxLocations : function() {
				return maxLength;
			},
			setDepartDate : function(date) {
				myDepartDate =  typeof date !== 'function' && typeof date !== 'undefined' ? date : undefined;
			},
			setReturnDate : function(date) {
				myReturnDate =  typeof date !== 'function' && typeof date !== 'undefined' ? date : undefined;
			},
			getDepartDate : function() {
				return myDepartDate;
			},
			getReturnDate : function() {
				return myReturnDate;
			},
			setMyLoc : function(loc) {
				myLoc = loc;
			},
			getMyLoc : function() {
				return myLoc;
			},
			setFriendList : function(response) {
				var n = 0;
				for (var i=0; i<response.length;i++) {
					//currently storing only friends who have filled in their location
					if (response[i].current_location !== null) {
						friendList[n] = response[i];
						n++;
					}
				}
				friendCount = n+1;
				
				//create locList as well
				friendList.sort(compareLocID);
				
				var locCtr = 0; 
				var locList = [];
		
				for (var i=0; i < friendList.length; i++) {
					var friendsAtLoc = 0; 
					locList[locCtr] = new Object();
					locList[locCtr].id = friendList[i].current_location.id;
					locList[locCtr].name = friendList[i].current_location.name;
					locList[locCtr].index = i;
			
					//cycle through friends till we get to the next friend at a new location
					for (var j=i; j < friendList.length; j++) {
						if (friendList[i].current_location.id === friendList[j].current_location.id) { friendsAtLoc++; }
						else { break; }
					}
					//all done for that location, jump to next one in the friendList
					i = friendsAtLoc+i-1; 
					locList[locCtr].friendCount = friendsAtLoc;
					locCtr++;
				}
		
				//next, sort locList by friendCount
				locList.sort(compareLocCount);
				myLocList = locList;
				
				
			}, 
			getFriendList : function() {
				return friendList;
			}, 
			setLocList : function(locList) {
				myLocList = locList;
			},
			getLocList : function() {
				return myLocList;
			}
		};
}());


/*///////////////
CONTROL FUNCTIONS (Ajax, FB calls)
*////////////////

	
function shareOnFacebook(dest) {
//to be called when user clicks Share button
	var myLoc = myFlightApp.getMyLoc();
	FB.ui(
		 {
		 method: 'feed',
		 name: 'I found you! Want to travel with me?',
  		  link: 'http://adityapanda.com/mainpage',
 		  picture: 'http://adityapanda.com/css/globe.png',
 		  caption: 'I\'m looking at flights from ' + myLoc + " to " + dest + '. Join me and view a list of airplane flights to all the homes of your friends.',
 		  description: '',
 		  display: 'popup'
		},
		  function(response) {
  			  if (response && response.post_id) {
   			    alert('Post was published.');
  			  } else {
  			    alert('Post was not published.');
  				}
 		 }
	);}
	
function purchaseOnExpedia(dest) {
//to be called when user clicks Buy button
		var myLoc = myFlightApp.getMyLoc();
		var myDepartDate = myFlightApp.getDepartDate();
		var myReturnDate = myFlightApp.getReturnDate();
		
		var purchaseURL = "http://www.expedia.com/Flights-Search?trip=roundtrip&leg1=from:" 
			+ encodeURI(myLoc) + ",to:" + encodeURI(dest) + ",departure:"
			+ encodeURIComponent(myDepartDate) + "TANYT&" 
			+ "leg2=from:" + encodeURI(dest) + ",to:" + encodeURI(myLoc) + ",departure:" 
			+ encodeURIComponent(myReturnDate) + "TANYT&"
			+ "passengers=children:0,adults:1,seniors:0,infantinlap:Y&options=cabinclass:coach,nopenalty:N,sortby:price&mode=search";	
		window.open(purchaseURL);
	
	}


function ajaxPriceUpdates() {
//wrapper function to get prices for multiple locations
		var locList = myFlightApp.getLocList();
		var myLoc = myFlightApp.getMyLoc();
		if (locList.length < myFlightApp.getMaxLocations()) { myFlightApp.setMaxLocations(locList.length); }
		for (var i = 0; i < myFlightApp.getMaxLocations(); i++) {
			var dest = locList[i].name;
			ajaxGetPrice(myLoc, dest, i);
		}	
}

function ajaxGetPrice(my_location, dest, i) {
		var returnDate = myFlightApp.getReturnDate();
		var departDate = myFlightApp.getDepartDate();
			
		$.ajax( { 
			type :"POST",
			url : "testajax",
			data : {'my_location': my_location, 'destination':dest, 'departDate':departDate, 'returnDate':returnDate},
			dataType : "json",
			success : function(data) {
				if (data.error) {
					console.log(data);
				}
				else { $("[id="+i+"].price").html(data.price); }
			}, 
			error : function(response) {
				$("[id="+i+"].price").html("N/A");
			}
		}); 
	}

function getAirportForCity() {
		var city = myFlightApp.getMyLoc();
		
		$.ajax( {
			type : "POST",
			url : "getAirportForCity/",
			data : {"city":city},
			dataType : "json",
			success : function(data) {
				showYourCityIsBox(city, data.airport);				
			},
			error : function(request, status, error) {
				console.log(request.status);
				showAirportNotFoundBox();
			}
		});
}

function checkAirport() {
//to be called when user enters airport code by hand
		var airport = $("#airportCode").val();
				
		$.ajax( {
			type : "POST",
			url : "checkAirport/",
			data : {"airport":airport },
			dataType : "json",
			success : function(data) {
				myFlightApp.setMyLoc(data.city);
				showAirportChangeSuccess(airport, data.city);
			},
			//should be checking response status code, not HTTP error code
			error: function(request, status, error) {
				showUnknownAirportBox();
			}
		});
}

function getFlights() {
//to be called when date submit button is clicked

//add date validation
		var departDay = $("input[name=departDay]").val();
		var departMonth = $("select[name=departMonth]").val();
		var departDate = departMonth + "/"+departDay + "/2012";
		
		var returnDay = $("input[name=returnDay]").val();
		var returnMonth = $("select[name=returnMonth]").val();
		var returnDate = returnMonth + "/" + returnDay + "/2012";
		
		var today = new Date();
		var month = today.getMonth() + 1;
		var day = today.getDate();
		
		console.log(month);
		console.log(day);
		
		myFlightApp.setDepartDate(departDate);
		myFlightApp.setReturnDate(returnDate);
		
		ajaxPriceUpdates();
}


function mainAction() {
//to be called when the "See Where People Live" is clicked	
		FB.api('/me', function(response) {
			myFlightApp.setMyLoc(response.location.name);
		});
	
		FB.api(
		{
			method: 'fql.query',
			query: 'SELECT uid, name, current_location, pic_square FROM user WHERE uid IN (SELECT uid2 FROM friend WHERE uid1=me())'
		},
		function(response) {
			myFlightApp.setFriendList(response);

			if (myFlightApp.getMyLoc() == undefined || myFlightApp.getMyLoc() =='') {
				showAirportNotFoundBox();
			}
			else {	
				//fetch your city's airport
				getAirportForCity();
				$("#output").html( "<p>Click on a photo to view their profile.</p> <p> If checking flight prices, they may take awhile to load. </p> <div id='friends_output'></div>");
				showFriendData();
			}
		});
}


/*////////////////
VIEW FUNCTIONS (strictly page rendering)
*/////////////////
//TO DO: add a JS templating system like handlebars, or jquery tmpl


function showFriendData() {
//displays the main content of the screen, the list of locations with friend pictures, prices, and buttons

		var friendList = myFlightApp.getFriendList();
		var locList = myFlightApp.getLocList();

		//inner loop uses the index stored in locList to jump to the right spot in friendList
		if (locList.length < myFlightApp.getMaxLocations()) { myFlightApp.setMaxLocations(locList.length); }
		
		$("#output").css('display', 'visible');

		for (var i=0; i < myFlightApp.getMaxLocations(); i++) { 
			j = locList[i].index;
			
			//wrapper elements
			$("#friends_output").append("<div class=\"loc_container\"><div class=\"loc_header\" id='"+i+"'></div>");
			$("#"+i+".loc_header").html("<h2>" + locList[i].name + "</h2><h3>" + locList[i].friendCount + " friends </h3>");
			if (locList[i].name == myFlightApp.getMyLoc()) { $("#"+i+".loc_header").append("<h2>Hey, it's your home!</h2>"); }
			
			$("[id="+i+"].loc_header").append("<div class='friendName' id='friendName"+i+"'></div><div class=\"loc_col1\" id="+i+"></div>");

			//friend elements
			while (friendList[j].current_location.id === friendList[j+1].current_location.id && j < friendList.length) {
				$("[id="+i+"].loc_col1").append("<a href=\'http://www.facebook.com/" + friendList[j].uid + "\' target='_blank'>" 
					+ "<img src=\'" + friendList[j].pic_square 
					+ "\' alt=\'" + friendList[j].name + " (Click to view)\' class='friendPic' title=\'" + friendList[j].name + " (Click to view)\' "		
					+ "onMouseover='displayName("+i+","+j+")' onMouseout='hideName("+i+")' />"
					+ "</a>");
				j++;
			}

			//end case, catch the last friend and append share and purchase buttons					
			$("[id="+i+"].loc_col1").append("<a href=\'http://www.facebook.com/" + friendList[j].uid + "\' target='_blank' '>" 
				+ "<img src=\'" + friendList[j].pic_square 
				+ "\' alt=\'" + friendList[j].name + " (Click to view)\' class='friendPic' title=\'" + friendList[j].name + " (Click to view)\' "
				+ "onMouseover='displayName("+i+","+j+")' onMouseout='hideName("+i+")'/></a>");
			
			$("[id="+i+"].loc_header").append("<div class=\"loc_col2\" id='"+i+"'><h3 class=\"price\" id=\"" + i + "\"></h3>");
			$("[id="+i+"].loc_col2").append("<p><button class=\"purchaseButton\" id='" + i + "' onclick='purchaseOnExpedia(\""+locList[i].name+"\");return false;'>Buy</button>");
			$("[id="+i+"].loc_col2").append("<p><button class=\"shareButton\" id='" + i + "' onclick='shareOnFacebook(\""+locList[i].name+"\");return false;'>Share</button>");		
		}
		
		//end the list of locations
		$("#friends_output").append("<div id=\'results\'>" + friendList.length + " of your friends have set their location. We can only display friends that have filled in their location on facebook.</div>");

		//now display the date selector div
		$("#date").css('visibility','visible');
		$("#output").css('display', 'block');

	}

	
	function showAirportChangeBox() {
		$("#sidebar").html("<div id='airportChange'><form>Three letter airport code: "
		 	+ "<input type='text' id='airportCode' size='3'></input><button>Ok</button></form>"
			+ "</div><br><div>All flights come from the <a href='http://developer.ean.com/'>Expedia</a> API.<br><br>"
			+ "Click on the buttons to purchase or send trip details to your friends. </div>");	
		$("#sidebar button").bind("click", function() { checkAirport(); return false; });
	}
	
	function showAirportChangeSuccess(airport, city) {
		$("#sidebar").html("<p>You changed your departing airport to <span id='myAirport'><b>" + airport 
			+ "</span></b> which is located in <b>" + city 
			+ "</b>. <br><br> " 
			+ " </p> <br><div>All flights come from the Expedia search engine.<br><br>"
			+ "Click on the buttons to purchase or send trip details to your friends. </div>");	
	}
	
	function showYourCityIsBox(city, airport) {
		$("#sidebar").html("<p>It looks like you live in <b>" + city 
			+ " </b> so I think your favorite airport is <span id='myAirport'><b>" + airport 
			+ "</b></span>. <br><br><button id='checkAirport'> Change Airport </button> " 
			+ " </p> <br><div>All flights come from the <a href='http://developer.ean.com/'>Expedia</a> API.<br><br>"
			+ "Click on the buttons to purchase or send trip details to your friends. </div>");	
		$("#sidebar button").bind('click', function() { showAirportChangeBox(); return false;});
	}

	function showAirportNotFoundBox() {
		$("#sidebar").html("<div id='location_error'>Sorry, I can't tell what your home airport is. Please type your preferred 3-letter airport code, so I know which one to search from."
			+ "<form id='myAirport' action='return false;' > "
			+ "<input type='text' id='airportCode' name='myAirport'> <button>Ok</button></input></form></div>");
		$("#myAirport button").bind("click", function() { checkAirport(); return false; });
		$("#myAirport").bind("submit", function() { checkAirport(); return false; });
	}
	
	function showUnknownAirportBox() {
		$("#sidebar").html("<p>I don't know that airport yet. Can you try again? Three letters only. </p> <form id='myAirport' action='' > "
			+ "<input type='text' id='airportCode' name='myAirport'> <button onclick='checkAirport();return false;'>Ok</button></input></form></div>");
		
	}
	
	function showSidebarDefaultText() {
		$("#sidebar").html("<p>Hi, let's get started. <br><br> Once you're logged in, click the button 'See Where People Live.' </p>");
	}


	//write the friend's name by their picture
	function displayName(i,j) {
		var friendList = myFlightApp.getFriendList();
		var out = "div#friendName"+i;
		$(out).append(friendList[j].name);
	}
	function hideName(i) {
		var friendList = myFlightApp.getFriendList();
		var out = "div#friendName"+i;
		$(out).empty();
	}
	
	
/*///////////////
UNUSED FUNCTIONS
*////////////////

	//not finished
	function purchaseOnHipmunk(dest) {
		purchaseURL = "http://www.hipmunk.com/#!";
		//Seattle+WA.Orlando+FL,Oct10.Oct14 //need to break loc strings on the comma
	}
	
	//not finished
	function hideMap() {
		$('#map_canvas').html('');
	}
	
	//not finished
	function showMap() {
		$('#map').html('<button onclick=\'hideMap();\'>Hide Map</button>');
		var map;
		//get lat lon of all 10 locations with geocode API
    	function initialize() {
        var myOptions = {
          zoom: 8,
          center: new google.maps.LatLng(-34.397, 150.644),
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById('map_canvas'),
            myOptions);
      }
      google.maps.event.addDomListener(window, 'load', initialize);
	}
	
		
	//deprecated
	function saveDate() {
		x = document.forms['date']['dates'].value;
		if (x =='this_weekend') {
			myDepartDate = friday1;
			myReturnDate = monday1;
			$('#more_info').show();
			ajaxUpdates();			
		}
		else if (x == 'next_weekend') {
			myDepartDate = friday2;
			myReturnDate = monday2;
			$('#more_info').show();
			ajaxUpdates();
		}
		else if (x == 'custom') {
			dp = document.getElementById('date');
			dp.innerHTML += "<br><input class='datepicker' name='Depart On:' type='text'/>";
		}
		else {
			myDepartDate='';
			myReturnDate='';
		}
	}
	
	//deprecated
	function displayDateSelector() {
			//check to only display results once			
			if( $("#friends_output").length > 0) { return; }				
		
			//add date selectors
			//get date of next weekend
			friday1 = Date.today().next().friday().toString('MM/dd/yyyy');
			monday1 = Date.today().next().monday().toString('MM/dd/yyyy');

			friday2 = Date.today().next().friday().addDays(7).toString('MM/dd/yyyy');
			monday2 = Date.today().next().monday().addDays(7).toString('MM/dd/yyyy');
			
			datediv = document.getElementById('date');
			datediv.innerHTML = "<h1>Choose a Date</h1><br><h3>Please give the prices a minute to load after you make your selection.</h3>" +
					"<form id='date' action=''> <select name='dates' onchange='return saveDate();'>" +
					"<option value='blank'> Choose a date. </option>" +
					"<option value='this_weekend'> This weekend: " 
					+ friday1 + " to " + monday1 + "</option>" +
					"<option value='next_weekend'> Next weekend: " + friday2 + " to " + monday2 +
					"</option>" +
					"<option value='custom'> Select your own date (not yet available).</option>" +
					"</select></form>"
					+ "";	
			
			mainAction();
			
	}